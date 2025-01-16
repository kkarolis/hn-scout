import { marshal, unMarshal } from './marshaler';

(() => {
    const selectorTopLevelComments = "td[indent='0'] + td + td";

    class HNJobDecisionWidget {
        private _savedMap: Map<string, string>;
        private _localStorage: Storage;
        private _clickCallback: (e: Event, jobId: string, jobStatus: string) => void;

        private readonly STORAGE_KEY: string = "hn-job-decisions";
        
        constructor(localStorage: Storage, clickCallback: (e: Event, jobId: string, jobStatus: string) => void) {
            this._localStorage = localStorage;
            this._savedMap = new Map(JSON.parse(localStorage.getItem(this.STORAGE_KEY) as string || '[]'));
            this._clickCallback = clickCallback;
        }

        public install(document: Document) {
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

            const jobStatus: string = e.target.getAttribute('data-job-status') as string;
            const jobId: string = e.target.getAttribute('data-job-id') as string;

            // persist the change
            this._savedMap.set(jobId, jobStatus);
            this._localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this._savedMap.entries())));

            this._clickCallback(e, jobId, jobStatus);
        }

        public getHtmlElementText(id: string): string {
            return [
                `<a href="#" class="hn-job-decision" data-job-id="${id}" data-job-status="yes">yes</a>`,
                `<a href="#" class="hn-job-decision" data-job-id="${id}" data-job-status="no">no</a>`,
                `<a href="#" class="hn-job-decision" data-job-id="${id}" data-job-status="maybe">maybe</a>`,
            ].join(' | ');
        }
    }

    const hnJobDecisionWidget = new HNJobDecisionWidget(localStorage, (e: Event, jobId: string, jobStatus: string) => {
        e.preventDefault();
        (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement)?.click();
    });

    [...document.querySelectorAll(`${selectorTopLevelComments} span.navs a[id]`)].forEach((el) => {
        const jobId = el.id;
        let jobElements = hnJobDecisionWidget.getHtmlElementText(jobId);
        el.insertAdjacentHTML('afterend', ` | ${jobElements}`);
        if (hnJobDecisionWidget.hasStorageItem(jobId)) {
            (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement)?.click();
        }
    });
    hnJobDecisionWidget.install(document);
})();

// const selectorTopLevelComments = "td[indent='0'] + td + td";
// const topLevelCommentIds = Array.from(document.querySelectorAll(`${selectorTopLevelComments} a[href^='item']`)).map((el) => {
//     // href expected to be in format "item?id=1234567890"
//     let href = el.getAttribute('href');

//     // ¯\_(ツ)_/¯
//     if (!href) return null;

//     let idText = href.split('=')[1];
//     return parseInt(idText, 10);
// }).filter(Boolean);

// class HNJobDecisionWidget {
//     public getHtmlElementText(id: string): string {
//         return [
//             `<a href="#" class="hnjs-yes" data-comment-id="${id}">yes</a>`,
//             `<a href="#" class="hnjs-no" data-comment-id="${id}">no</a>`,
//             `<a href="#" class="hnjs-maybe" data-comment-id="${id}">maybe</a>`,
//         ].join(' | ');
//     }
// }

// const hnJobDecisionWidget = new HNJobDecisionWidget();


// function createUIElements(id: string): string {
//     return [
//         `<a href="#" class="hnjs-yes" data-comment-id="${id}">yes</a>`,
//         `<a href="#" class="hnjs-no" data-comment-id="${id}">no</a>`,
//         `<a href="#" class="hnjs-maybe" data-comment-id="${id}">maybe</a>`,
//     ].join(' | ');
// };

// enum JobStatus {
//     YES = "yes",
//     NO = "no",
//     MAYBE = "maybe",
// }


// function hideSelectedJobs() {
//     const savedMapSerialized = localStorage.getItem("hnjsjobs") as string || '[]';
//     const savedMap: Map<string, string> = new Map(JSON.parse(savedMapSerialized));
//     savedMap.forEach((value, key) => {
//         (document.querySelector(`tr[id='${key}'] a[id='${key}']`) as HTMLElement)?.click();
//     });
// }

// function handleJobYes(target: HTMLElement, jobId: string) {
//     const map = new Map<string, string>();

//     const savedMapSerialized = localStorage.getItem("hnjsjobs") as string || '[]';
//     const savedMap: Map<string, string> = new Map(JSON.parse(savedMapSerialized));
//     savedMap.set(jobId, JobStatus.YES);

//     localStorage.setItem("hnjsjobs", JSON.stringify(Array.from(savedMap.entries())));
//     (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement)?.click();
// }


// document.addEventListener('click', (e) => {
//     if (e.target instanceof HTMLElement && e.target.classList.contains('hnjs-yes')) {
//         e.preventDefault();
//         console.log(e.target);
//         handleJobYes(e.target, e.target.getAttribute('data-comment-id') as string);
//     } else if (e.target instanceof HTMLElement && e.target.classList.contains('hnjs-no')) {
//         e.preventDefault();
//         console.log(e.target.getAttribute('data-comment-id'));
//     } else if (e.target instanceof HTMLElement && e.target.classList.contains('hnjs-maybe')) {
//         e.preventDefault();
//         console.log(e.target.getAttribute('data-comment-id'));
//     }
// });

// [...document.querySelectorAll(`${selectorTopLevelComments} span.navs a[id]`)].forEach((el) => {
//     let jobElements = hnJobDecisionWidget.getHtmlElementText(el.id);
//     el.insertAdjacentHTML('afterend', ` | ${jobElements}`);
// })

// hideSelectedJobs();