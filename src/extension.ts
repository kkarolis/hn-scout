import { marshal, unMarshal } from './marshaler';

(() => {
    const selectorTopLevelComments = "td[indent='0'] + td + td";

    class HNJobDecisionWidget {
        private _savedMap: Map<string, string>;
        private _localStorage: Storage;
        private _clickCallback: (e: Event, jobId: string, beforeStatus: string | undefined, afterStatus: string) => void;

        private readonly STORAGE_KEY: string = "hn-job-decisions";
        
        constructor(localStorage: Storage, clickCallback: (e: Event, jobId: string, beforeStatus: string | undefined, afterStatus: string) => void) {
            this._localStorage = localStorage;
            this._savedMap = new Map(JSON.parse(localStorage.getItem(this.STORAGE_KEY) as string || '[]'));
            this._clickCallback = clickCallback;
        }

        public enable(document: Document) {
            document.addEventListener('click', (e) => {
                if (this.canHandleClick(e)) {
                    this.handleClick(e);
                }
            })
        }

        public hasStorageItem(key: string): boolean {
            return this._savedMap.has(key);
        }

        public canHandleClick(e: Event): boolean {
            return e.target instanceof HTMLElement && e.target.classList.contains('hn-job-decision');
        }

        public handleClick(e: Event) {
            if (!(e.target instanceof HTMLElement)) return;

            const afterStatus: string = e.target.getAttribute('data-job-status') as string;
            const jobId: string = e.target.getAttribute('data-job-id') as string;

            const beforeStatus = this._savedMap.get(jobId);

            // persist the change
            if (beforeStatus !== afterStatus) {
                this._savedMap.set(jobId, afterStatus);
                this._localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this._savedMap.entries())));

                e.target.classList.add('selected');

                // de-select the other element
                if (beforeStatus !== undefined) {
                    const otherElement = document.querySelector(`a.hn-job-decision[data-job-status="${beforeStatus}"]`) as HTMLElement;
                    otherElement.classList.remove('selected')
                }
            } else {
                this._savedMap.delete(jobId);
                this._localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this._savedMap.entries())));
                e.target.classList.remove('selected');
            }

            // update the UI
            this._clickCallback(e, jobId, beforeStatus, afterStatus);
        }

        private html(strings: TemplateStringsArray, ...values: any[]): string {
            return String.raw({ raw: strings }, ...values);
        }

        public getHtmlElementText(id: string): string {
            return this.html`
                <a href="#" class="hn-job-decision ${this._savedMap.get(id) === 'yes' ? 'selected' : ''}" 
                   data-job-id="${id}" data-job-status="yes">yes</a> |
                <a href="#" class="hn-job-decision ${this._savedMap.get(id) === 'no' ? 'selected' : ''}" 
                   data-job-id="${id}" data-job-status="no">no</a> |
                <a href="#" class="hn-job-decision ${this._savedMap.get(id) === 'maybe' ? 'selected' : ''}" 
                   data-job-id="${id}" data-job-status="maybe">maybe</a>
            `.trim();
        }
    }

    // install widget callback in the page
    const hnJobDecisionWidget = new HNJobDecisionWidget(localStorage, (e: Event, jobId: string, beforeStatus: string | undefined, afterStatus: string) => {
        e.preventDefault();
        if (beforeStatus === afterStatus || beforeStatus === undefined) {
            (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement)?.click();
        }
    });
    hnJobDecisionWidget.enable(document);

    // render the widget into the page
    document.querySelectorAll(`${selectorTopLevelComments} span.navs a[id]`).forEach((el) => {
        const jobId = el.id;
        let jobElements = hnJobDecisionWidget.getHtmlElementText(jobId);
        el.insertAdjacentHTML('afterend', ` | ${jobElements}`);
        if (hnJobDecisionWidget.hasStorageItem(jobId)) {
            (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement)?.click();
        }
    });
})();