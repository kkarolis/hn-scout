import { marshal, unMarshal } from './marshaler';

class HNJobDecisionWidget {
    private _savedMap: Map<string, string>;
    private _localStorage: Storage;
    private _navigationCallback: (
        e: Event,
        jobId: string,
        beforeStatus: string | undefined,
        afterStatus: string
    ) => void;
    private _allPosts: string[]; // we use this to navigate to "tail" to next post

    private _storageKey: string;

    private readonly STORAGE_KEY_PREFIX: string = 'hn-scout';
    private readonly STORAGE_KEY_POINTER_PREFIX: string = 'hn-scout-pointer';
    private readonly HASH_KEY: string = '#hn-scout=';

    constructor(
        localStorage: Storage,
        dateSpecifier: string,
        allPosts: string[],
        navigationCallback: (e: Event, jobId: string, beforeStatus: string | undefined, afterStatus: string) => void
    ) {
        this._localStorage = localStorage;

        this._allPosts = allPosts;

        const month: string = dateSpecifier.split('-')[1];
        this._storageKey = `${this.STORAGE_KEY_PREFIX}-${month}`;

        // clear old storage if it exists
        const storagePointerKey: string = `${this.STORAGE_KEY_POINTER_PREFIX}-${month}`;
        const storagePointerValueOld: string | null = localStorage.getItem(storagePointerKey);
        const storagePointerValueNew: string = dateSpecifier;

        if (storagePointerValueOld === null) {
            localStorage.setItem(storagePointerKey, storagePointerValueNew);
        } else if (storagePointerValueOld < storagePointerValueNew) {
            localStorage.removeItem(this._storageKey);
            localStorage.setItem(storagePointerKey, storagePointerValueNew);
        }

        const hash = window.location.hash;
        if (hash.startsWith(this.HASH_KEY)) {
            const compressedData = hash.substring(this.HASH_KEY.length);
            this._savedMap = new Map(unMarshal(compressedData));
            this.saveToLocalStorage();
            window.location.hash = '';

            // remove last # from the section
            window.location.href = window.location.href.slice(0, -1);
        } else {
            this._savedMap = new Map(JSON.parse((localStorage.getItem(this._storageKey) as string) || '[]'));
        }

        this._navigationCallback = navigationCallback;
    }

    public enable(document: Document) {
        document.addEventListener('click', async (e) => {
            if (this.canHandleClick(e)) {
                await this.handleClick(e);
            }
        });
    }

    public hasStorageItem(key: string): boolean {
        return this._savedMap.has(key);
    }

    public shouldCollapse(key: string): boolean {
        return this._savedMap.get(key) === 'no';
    }

    public canHandleClick(e: Event): boolean {
        return e.target instanceof HTMLElement && e.target.classList.contains('hn-scout');
    }

    public async handleClick(e: Event) {
        if (!(e.target instanceof HTMLElement)) return;

        if (e.target.classList.contains('hn-scout-copy-share-link')) {
            await this.copyShareLink(e);
            return;
        }

        if (e.target.classList.contains('hn-scout-clear')) {
            this.clearAll(e);
            return;
        }

        if (e.target.classList.contains('hn-scout-tail')) {
            this.tail(e);
            return;
        }

        await this.handleDecision(e);
    }

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
                                        HN Scout | 
                                            <a href="javascript:void(0)" class="hn-scout hn-scout-copy-share-link">cp link</a>
                                            |
                                            <a href="javascript:void(0)" class="hn-scout hn-scout-clear">clear</a>
                                            |
                                            <a href="javascript:void(0)" class="hn-scout hn-scout-tail">tail</a>
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
            <a href="#" class="hn-scout ${this._savedMap.get(id) === 'yes' ? 'selected' : ''}" 
                data-job-id="${id}" data-job-status="yes">yes</a> |
            <a href="#" class="hn-scout ${this._savedMap.get(id) === 'no' ? 'selected' : ''}" 
                data-job-id="${id}" data-job-status="no">no</a> |
            <a href="#" class="hn-scout ${this._savedMap.get(id) === 'maybe' ? 'selected' : ''}" 
                data-job-id="${id}" data-job-status="maybe">maybe</a>
        `.trim();
    }

    private saveToLocalStorage(): void {
        this._localStorage.setItem(this._storageKey, JSON.stringify(Array.from(this._savedMap.entries())));
    }

    private async copyShareLink(e: Event) {
        const compressedData = marshal(this._savedMap);
        window.location.hash = `hn-scout=${compressedData}`;
        navigator.clipboard.writeText(window.location.href);
    }

    private clearAll(e: Event) {
        this._savedMap.clear();
        this.saveToLocalStorage();
        window.location.hash = '';
        window.location.reload();
        if (window.location.href.endsWith('#')) {
            window.location.href = window.location.href.slice(0, -1);
        }
    }

    private tail(e: Event) {
        let target: string | undefined = this._allPosts.length > 0 ? this._allPosts[0] : undefined;
        let previousJobId: string | undefined = target;

        // iterate backwards from last post and find job before one which
        // has a decision. This will not work reliably as there are up-votes
        // on some jobs which will move them to the top, but need to
        // experiment, maybe it will be good enough in practice.
        for (const jobId of [...this._allPosts].reverse()) {
            if (this._savedMap.has(jobId)) {
                target = previousJobId;
                break;
            }
            previousJobId = jobId;
        }

        if (target !== undefined) {
            window.location.hash = '';
            window.location.hash = target;

            // Ensure element is in view
            document.getElementById(target)?.scrollIntoView();
        }
    }

    private async handleDecision(e: Event) {
        const target: HTMLElement = e.target as HTMLElement;

        const afterStatus: string = target.getAttribute('data-job-status') as string;
        const jobId: string = target.getAttribute('data-job-id') as string;

        const beforeStatus = this._savedMap.get(jobId);

        // persist the change
        if (beforeStatus !== afterStatus) {
            this._savedMap.set(jobId, afterStatus);
            this.saveToLocalStorage();

            target.classList.add('selected');

            // de-select the other element
            if (beforeStatus !== undefined) {
                const otherElement = document.querySelector(
                    `a.hn-scout[data-job-status="${beforeStatus}"][data-job-id="${jobId}"]`
                ) as HTMLElement;
                otherElement.classList.remove('selected');
            }
        } else {
            this._savedMap.delete(jobId);
            this.saveToLocalStorage();
            target.classList.remove('selected');
        }

        // update the UI
        await this._navigationCallback(e, jobId, beforeStatus, afterStatus);
    }

    private html(strings: TemplateStringsArray, ...values: any[]): string {
        return String.raw({ raw: strings }, ...values);
    }
}

(() => {
    const selectorTopLevelComments = "td[indent='0'] + td + td";

    const isAuthoredByWhoIsHiring = () => {
        return document.querySelector("table.fatitem a[href='user?id=whoishiring']") !== null;
    };

    const isWhoIsHiringPost = () => {
        const titleLine: HTMLElement = document.querySelector('table.fatitem span.titleline a') as HTMLElement;
        return titleLine.textContent?.includes('Who is hiring?');
    };

    // only install the widget on who is hiring posts
    if (!isAuthoredByWhoIsHiring() || !isWhoIsHiringPost()) {
        return;
    }

    function parseDate(date: string): string {
        // Would have something like this 2024-10-01T15:00:16 1727794816
        const isoDate: string = date.split(' ')[0];
        const dateObj: Date = new Date(isoDate);
        return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    // install widget callback in the page
    const allPosts = Array.from(document.querySelectorAll(`${selectorTopLevelComments} span.navs a[id]`)).map(
        (el) => el.id
    );

    // kinda assuming date is UTC here.
    const dateSpecifier: string = parseDate((document.querySelector('table.fatitem span.age') as HTMLElement).title);

    const hnJobDecisionWidget = new HNJobDecisionWidget(
        localStorage,
        dateSpecifier,
        allPosts,
        async (e: Event, jobId: string, beforeStatus: string | undefined, afterStatus: string) => {
            e.preventDefault();

            const toggleClose = () =>
                (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement).click();
            const next = () => {
                const nodeList: NodeListOf<HTMLElement> = document.querySelectorAll(
                    `tr[id='${jobId}'] span.navs a.clicky`
                );
                const linksToNext = Array.from(nodeList).filter((el) => el.textContent === 'next');
                if (linksToNext.length > 0) {
                    linksToNext[0].click();
                }
            };

            // handles the navigation logic
            // some delicious mommas spaghetti right here
            // we'll be mostly clicking no, so let's limit navigation on that choice
            if (beforeStatus === undefined) {
                if (afterStatus === 'no') {
                    toggleClose();
                } else {
                    next();
                }
            } else {
                if (afterStatus === 'no') {
                    toggleClose();
                } else {
                    if (beforeStatus === 'no') {
                        toggleClose();
                    }
                    next();
                }
            }
        }
    );

    hnJobDecisionWidget.enable(document);

    document
        .querySelector('table.comment-tree tbody')
        ?.insertAdjacentHTML('afterbegin', hnJobDecisionWidget.getHtmlToolbarElementText());

    // render the widget into the page
    document.querySelectorAll(`${selectorTopLevelComments} span.navs a[id]`).forEach((el) => {
        const jobId = el.id;
        let jobElements = hnJobDecisionWidget.getHtmlPerCommentElementText(jobId);
        el.insertAdjacentHTML('afterend', ` | ${jobElements}`);

        if (hnJobDecisionWidget.hasStorageItem(jobId) && hnJobDecisionWidget.shouldCollapse(jobId)) {
            (document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`) as HTMLElement)?.click();
        }
    });
})();
