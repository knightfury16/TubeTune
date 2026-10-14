// Loaded before background.js, content.js and popup.js (all classic scripts),
// so these names are globals in each of them.
const HIDE_STATE_KEY = 'hideState';
const DEFAULT_HIDE_STATE = true; // Titles are hidden from the first install
const YOUTUBE_URL = /^https?:\/\/www\.youtube\.com\//;
const YOUTUBE_WATCH_URL = /^https?:\/\/www\.youtube\.com\/watch\b/;

async function readHideState() {
    const stored = await chrome.storage.local.get({ [HIDE_STATE_KEY]: DEFAULT_HIDE_STATE });
    return stored[HIDE_STATE_KEY];
}
