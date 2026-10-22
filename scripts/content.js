// content.js (shared.js is loaded first). Runs at document_start so hide mode is
// flagged on <html> before YouTube renders anything; styles/hide.css does the hiding.
const HEADING = 'ytd-watch-metadata #title h1';
const CUSTOM_TITLE_ID = 'tubetune-custom-title';
const HIDDEN_ATTR = 'data-tubetune-hidden';
const CUSTOM_ATTR = 'data-tubetune-custom';
const HIDDEN_TAB_TITLE = 'YouTube';

let hideState = DEFAULT_HIDE_STATE; // Mirrors chrome.storage.local, which the background owns
let customTitle = null; // Set from the popup, cleared when the page changes
let realTabTitle = ''; // Last tab title YouTube itself wrote
let titleObserver = null;

const showsVideoTitle = () => location.pathname === '/watch' || location.pathname.startsWith('/shorts/');

function applyVisibility() {
    document.documentElement.toggleAttribute(HIDDEN_ATTR, hideState);
    document.documentElement.toggleAttribute(CUSTOM_ATTR, customTitle !== null);
    if (!realTabTitle) return;
    let tabTitle = realTabTitle;
    if (showsVideoTitle() && customTitle) tabTitle = `${customTitle} - YouTube`;
    else if (showsVideoTitle() && hideState) tabTitle = HIDDEN_TAB_TITLE;
    writeTabTitle(tabTitle);
}

// Drops the observer's record of our own write, so it only ever reports YouTube's.
function writeTabTitle(text) {
    if (document.title !== text) document.title = text;
    titleObserver?.takeRecords();
}

async function loadHideState() {
    hideState = await readHideState();
    applyVisibility();
}

// <title> is parsed early in <head>; wait for it, then follow every title YouTube writes.
function whenTitleElement(callback) {
    const existing = document.querySelector('title');
    if (existing) return callback(existing);
    const observer = new MutationObserver(() => {
        const titleElement = document.querySelector('title');
        if (titleElement) {
            observer.disconnect();
            callback(titleElement);
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

function observeTabTitle(titleElement) {
    const onTitle = () => {
        realTabTitle = document.title;
        applyVisibility();
    };
    titleObserver = new MutationObserver(onTitle);
    titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
    onTitle();
}

// YouTube stops updating its heading once anything rewrites it, so a custom
// title goes in its own element and hide.css swaps the two.
function setCustomTitle(title) {
    const heading = document.querySelector(HEADING);
    if (!heading) return;
    let custom = document.getElementById(CUSTOM_TITLE_ID);
    if (!custom) {
        custom = document.createElement('span');
        custom.id = CUSTOM_TITLE_ID;
        heading.append(custom);
    }
    custom.textContent = title;
    customTitle = title;
    applyVisibility();
}

function resetCustomTitle() {
    document.getElementById(CUSTOM_TITLE_ID)?.remove();
    customTitle = null;
    applyVisibility();
}

applyVisibility(); // Hidden by default until storage says otherwise
loadHideState();
whenTitleElement(observeTabTitle);

// A custom title belongs to one video; YouTube navigates without reloading.
document.addEventListener('yt-navigate-finish', resetCustomTitle);

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && HIDE_STATE_KEY in changes) {
        hideState = changes[HIDE_STATE_KEY].newValue ?? DEFAULT_HIDE_STATE;
        applyVisibility();
    }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'modifyTitle') {
        const title = String(request.newTitle ?? '').replace(/\s+/g, ' ').trim();
        if (title) setCustomTitle(title);
    } else if (request.action === 'resetTitle') {
        resetCustomTitle();
    }
    sendResponse({ status: 'Success' });
});
