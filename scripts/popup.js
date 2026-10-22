// popup.js (shared.js is loaded first)
const form = document.getElementById('titleForm');
const input = document.getElementById('newTitle');
const modifyButton = document.getElementById('modifyButton');
const resetButton = document.getElementById('resetButton');
const toggleButton = document.getElementById('toggleButton');
const modeLine = document.getElementById('modeLine');
const status = document.getElementById('status');
const shortcutHint = document.getElementById('shortcutHint');

const watchTab = findWatchTab();

async function findWatchTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url && YOUTUBE_WATCH_URL.test(tab.url) ? tab : null;
}

function showHideState(hidden) {
    document.body.toggleAttribute('data-hidden', hidden);
    toggleButton.setAttribute('aria-checked', String(hidden));
    modeLine.textContent = hidden ? 'Titles are hidden on YouTube.' : 'Titles are visible on YouTube.';
}

function showStatus(text, tone = 'info') {
    status.textContent = text;
    status.dataset.tone = tone;
}

async function showShortcut() {
    const commands = await chrome.commands.getAll();
    const shortcut = commands.find((c) => c.name === 'hide')?.shortcut;
    shortcutHint.replaceChildren();
    if (shortcut) {
        const key = document.createElement('kbd');
        key.textContent = shortcut;
        shortcutHint.append(key, ' shows or hides titles on any YouTube page.');
    } else {
        shortcutHint.textContent = 'Set a keyboard shortcut at chrome://extensions/shortcuts.';
    }
}

async function sendToWatchTab(message) {
    const tab = await watchTab;
    if (!tab) return;
    try {
        await chrome.tabs.sendMessage(tab.id, message);
        window.close();
    } catch {
        showStatus('Reload the YouTube tab, then try again.', 'error');
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = input.value.trim();
    if (!newTitle) {
        showStatus('Type a title first.', 'error');
        input.focus();
        return;
    }
    sendToWatchTab({ action: 'modifyTitle', newTitle });
});

resetButton.addEventListener('click', () => sendToWatchTab({ action: 'resetTitle' }));

toggleButton.addEventListener('click', async () => {
    await chrome.storage.local.set({ [HIDE_STATE_KEY]: !(await readHideState()) });
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && HIDE_STATE_KEY in changes) {
        showHideState(changes[HIDE_STATE_KEY].newValue ?? DEFAULT_HIDE_STATE);
    }
});

(async () => {
    showHideState(await readHideState());
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));
    showShortcut();
    if (!(await watchTab)) {
        input.disabled = true;
        modifyButton.disabled = true;
        resetButton.disabled = true;
        showStatus('Open a YouTube video to rename it.');
    }
})();
