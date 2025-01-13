// extract top level comments
document.addEventListener('DOMContentLoaded', () => {
    console.log('Extension content script loaded');
});

const selectorTopLevelComments = "td[indent='0'] + td + td";
const topLevelCommentIds = Array.from(document.querySelectorAll(`${selectorTopLevelComments} a[href^='item']`)).map((el) => {
    // href expected to be in format "item?id=1234567890"
    let href = el.getAttribute('href');

    // ¯\_(ツ)_/¯
    if (!href) return null;

    let idText = href.split('=')[1];
    return parseInt(idText, 10);
}).filter(Boolean);


function createUIElements(id: string): string {
    return [
        `<a href="#" class="hnjs-yes" data-comment-id="${id}">yes</a>`,
        `<a href="#" class="hnjs-no" data-comment-id="${id}">no</a>`,
        `<a href="#" class="hnjs-maybe" data-comment-id="${id}">maybe</a>`,
    ].join(' | ');
};

enum JobStatus {
    YES = "yes",
    NO = "no",
    MAYBE = "maybe",
}


function hideSelectedJobs() {
    const savedMapSerialized = localStorage.getItem("hnjsjobs") as string || '[]';
    const savedMap: Map<string, string> = new Map(JSON.parse(savedMapSerialized));
    savedMap.forEach((value, key) => {
        document.querySelector(`tr[id='${key}'] a[id='${key}']`)?.click();
    });
}

function handleJobYes(target: HTMLElement, jobId: string | null) {
    const map = new Map<string, string>();

    const savedMapSerialized = localStorage.getItem("hnjsjobs") as string || '[]';
    const savedMap: Map<string, string> = new Map(JSON.parse(savedMapSerialized));
    savedMap.set(jobId, JobStatus.YES);
    localStorage.setItem("hnjsjobs", JSON.stringify(Array.from(savedMap.entries())));
    document.querySelector(`tr[id='${jobId}'] a[id='${jobId}']`)?.click();
}


document.addEventListener('click', (e) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('hnjs-yes')) {
        e.preventDefault();
        console.log(e.target);
        handleJobYes(e.target, e.target.getAttribute('data-comment-id'));
    } else if (e.target instanceof HTMLElement && e.target.classList.contains('hnjs-no')) {
        e.preventDefault();
        console.log(e.target.getAttribute('data-comment-id'));
    } else if (e.target instanceof HTMLElement && e.target.classList.contains('hnjs-maybe')) {
        e.preventDefault();
        console.log(e.target.getAttribute('data-comment-id'));
    }
});

[...document.querySelectorAll(`${selectorTopLevelComments} span.navs a[id]`)].forEach((el) => {
    let jobElements = createUIElements(el.id);
    el.insertAdjacentHTML('afterend', ` | ${jobElements}`);
})

hideSelectedJobs();