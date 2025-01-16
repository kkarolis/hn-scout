import { marshal, unMarshal } from './marshaler';

(() => {
    const selectorTopLevelComments = "td[indent='0'] + td + td";

    class HNJobDecisionWidget {
        private _savedMap: Map<string, string>;
        private _localStorage: Storage;
        private _clickCallback: (e: Event, jobId: string, beforeStatus: string | undefined, afterStatus: string) => void;

        private readonly STORAGE_KEY: string = "hn-job-decisions";
        private readonly HASH_KEY: string = "#hn-job-decisions=";
        
        constructor(localStorage: Storage, clickCallback: (e: Event, jobId: string, beforeStatus: string | undefined, afterStatus: string) => void) {
            this._localStorage = localStorage;

            // logic for loading data from hash
            const hash = window.location.hash;
            if (hash.startsWith(this.HASH_KEY)) {
                const compressedData = hash.substring(this.HASH_KEY.length);
                this._savedMap = new Map(unMarshal(compressedData));
                this.saveToLocalStorage();
                window.location.hash = '';

                // remove last # from the section
                window.location.href = window.location.href.slice(0, -1);
            } else {
                this._savedMap = new Map(JSON.parse(localStorage.getItem(this.STORAGE_KEY) as string || '[]'));
            }

            this._clickCallback = clickCallback;
        }

        private saveToLocalStorage(): void {
            this._localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this._savedMap.entries())));
        }

        public enable(document: Document) {
            document.addEventListener('click', async (e) => {
                if (this.canHandleClick(e)) {
                    await this.handleClick(e);
                }
            })
        }

        public hasStorageItem(key: string): boolean {
            return this._savedMap.has(key);
        }

        public canHandleClick(e: Event): boolean {
            return e.target instanceof HTMLElement && (e.target.classList.contains('hn-job-decision') || e.target.classList.contains('hn-job-decision-copy-share-link'));
        }

        private async copyShareLink(e: Event) {
            const compressedData = marshal(this._savedMap);
            window.location.hash = `hn-job-decisions=${compressedData}`;
            navigator.clipboard.writeText(window.location.href);
        }

        public async handleClick(e: Event) {
            if (!(e.target instanceof HTMLElement)) return;

            if (e.target.classList.contains('hn-job-decision-copy-share-link')) {
                this.copyShareLink(e);
                return;
            }

            const afterStatus: string = e.target.getAttribute('data-job-status') as string;
            const jobId: string = e.target.getAttribute('data-job-id') as string;

            const beforeStatus = this._savedMap.get(jobId);

            // persist the change
            if (beforeStatus !== afterStatus) {
                this._savedMap.set(jobId, afterStatus);
                this.saveToLocalStorage();

                e.target.classList.add('selected');

                // de-select the other element
                if (beforeStatus !== undefined) {
                    const otherElement = document.querySelector(`a.hn-job-decision[data-job-status="${beforeStatus}"]`) as HTMLElement;
                    otherElement.classList.remove('selected')
                }
            } else {
                this._savedMap.delete(jobId);
                this.saveToLocalStorage();
                e.target.classList.remove('selected');
            }

            // update the UI
            this._clickCallback(e, jobId, beforeStatus, afterStatus);
        }

        private html(strings: TemplateStringsArray, ...values: any[]): string {
            return String.raw({ raw: strings }, ...values);
        }

        // some good old brittle html with implied structure
        public getHtmlToolbarElementText(): string {
            return this.html`
                <tr class="coll athing comtr" id="doesnotexist">
                    <td>
                        <table border="0">
                            <tbody>
                                <tr>
                                    <td class="ind" indent="0"></td>
                                    <td valign="top" class="nosee votelinks" style="background-size: 10px;">
                                        <center><div class="votearrow" style="background-image: none;"></div></center>
                                    </td>
                                    <td class="default">
                                        <div style="margin-top:2px; margin-bottom:-10px;">
                                            <span class="comhead">
                                            HN Job Actions | <a href="javascript:void(0)" class="hn-job-decision-copy-share-link">copy share link</a>
                                            <br/>
                                            </span>
                                        </div><br/>
                                        <div class="noshow comment"><div class="commtext c00"></div></div>
                                        <br/>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            `.trim();
        }

        public getHtmlPerCommentElementText(id: string): string {
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

    document.querySelector('table.comment-tree tbody')?.insertAdjacentHTML('afterbegin', hnJobDecisionWidget.getHtmlToolbarElementText());

    // render the widget into the page
    document.querySelectorAll(`${selectorTopLevelComments} span.navs a[id]`).forEach((el) => {
        const jobId = el.id;
        let jobElements = hnJobDecisionWidget.getHtmlPerCommentElementText(jobId);
        el.insertAdjacentHTML('afterend', ` | ${jobElements}`);
        if (hnJobDecisionWidget.hasStorageItem(jobId)) {
            (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement)?.click();
        }
    });
})();