// The hide mode lives in chrome.storage.local, not in this worker: Chrome stops
// idle service workers, and every YouTube tab needs to see the same value.
// Absolute path: importScripts resolves against the worker script, not this file.
importScripts('/scripts/shared.js');

const badgeColorOn = 'green';
const badgeColorOff = '#FF8A8A';

async function refreshBadge() {
    const hidden = await readHideState();
    await chrome.action.setBadgeText({ text: hidden ? 'On' : 'Off' });
    await chrome.action.setBadgeBackgroundColor({ color: hidden ? badgeColorOn : badgeColorOff });
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
        await chrome.storage.local.set({ [HIDE_STATE_KEY]: DEFAULT_HIDE_STATE });
    }
    await refreshBadge();
});

chrome.runtime.onStartup.addListener(refreshBadge);
// Also on every worker start: re-enabling the extension clears the badge.
refreshBadge();

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && HIDE_STATE_KEY in changes) refreshBadge();
});

async function toggleFromShortcut() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Only toggle from a YouTube tab; elsewhere the shortcut does nothing.
    if (!tab?.url || !YOUTUBE_URL.test(tab.url)) return;
    const hidden = await readHideState();
    await chrome.storage.local.set({ [HIDE_STATE_KEY]: !hidden });
}

// Presses run one after another, so two quick presses cannot read the same state.
let pendingToggle = Promise.resolve();
chrome.commands.onCommand.addListener((command) => {
    if (command !== 'hide') return;
    pendingToggle = pendingToggle.then(toggleFromShortcut, toggleFromShortcut);
});
