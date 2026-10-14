// Playwright fixtures: a fresh Chromium profile per test with TubeTune loaded,
// plus an `ext` driver for the parts of the extension a test needs to poke.
const fs = require('fs');
const { test: base, expect, chromium } = require('@playwright/test');
const { buildTestExtension, resolveChromium } = require('./extension');

const withTimeout = (promise, ms, what) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${what} timed out`)), ms)),
]);

class ExtensionDriver {
    constructor(context, popupPath) {
        this.context = context;
        this.popupPath = popupPath;
        this.worker = null;
    }

    async serviceWorker() {
        if (!this.worker) {
            this.worker = this.context.serviceWorkers()[0] ?? await this.context.waitForEvent('serviceworker');
        }
        return this.worker;
    }

    async id() {
        return new URL((await this.serviceWorker()).url()).host;
    }

    async evaluate(fn, arg) {
        const worker = await this.serviceWorker();
        return withTimeout(worker.evaluate(fn, arg), 10_000, 'service worker evaluate');
    }

    // Same as the user pressing the shortcut bound to `name` in manifest.json.
    async command(name) {
        await this.evaluate((n) => self.__tt.commandListeners.forEach((fn) => fn(n)), name);
    }

    async tabId(page) {
        const ids = await this.evaluate(
            (url) => chrome.tabs.query({}).then((tabs) => tabs.filter((t) => t.url === url).map((t) => t.id)),
            page.url(),
        );
        if (ids.length !== 1) throw new Error(`Expected one tab for ${page.url()}, found ${ids.length}`);
        return ids[0];
    }

    // The extension can only see URLs of YouTube tabs, so other tabs read the global badge.
    async badge(page) {
        const tabId = page.url().includes('youtube.com') ? await this.tabId(page) : undefined;
        return this.evaluate((id) => chrome.action.getBadgeText(id === undefined ? {} : { tabId: id }), tabId);
    }

    // Opens a page in a tab that does not take focus, so the current tab stays active.
    async openInBackgroundTab(url) {
        const pagePromise = this.context.waitForEvent('page');
        await this.evaluate((u) => chrome.tabs.create({ url: u, active: false }), url);
        const page = await pagePromise;
        await page.waitForLoadState('domcontentloaded');
        return page;
    }

    // The toolbar popup cannot be clicked from Playwright. Loading popup.html in a
    // background tab runs the same code while the YouTube tab stays the active one.
    async openPopup() {
        return this.openInBackgroundTab(`chrome-extension://${await this.id()}/${this.popupPath}`);
    }

    // Simulates Chrome shutting down the idle MV3 service worker. Playwright keeps
    // the same Worker handle across the restart, so only the globals tell them apart.
    async restartServiceWorker() {
        const id = await this.id();
        const helper = await this.context.newPage();
        const cdp = await this.context.newCDPSession(helper);
        await cdp.send('ServiceWorker.enable');
        await cdp.send('ServiceWorker.stopAllWorkers');
        await cdp.detach();
        await helper.waitForTimeout(1000);

        await helper.goto(`chrome-extension://${id}/__test_page.html`);
        await helper.evaluate(() => chrome.runtime.sendMessage({ action: '__test_ping' }).catch(() => {}));
        await helper.close();

        const fresh = await this.evaluate(() => self.__ttAlive === undefined);
        if (!fresh) throw new Error('Service worker did not restart');
    }
}

const test = base.extend({
    extension: [async ({}, use) => {
        const built = buildTestExtension();
        await use(built);
        fs.rmSync(built.dir, { recursive: true, force: true });
    }, { scope: 'worker' }],

    context: async ({ extension, headless }, use) => {
        const context = await chromium.launchPersistentContext('', {
            executablePath: resolveChromium(),
            headless,
            viewport: { width: 1280, height: 800 },
            args: [
                `--disable-extensions-except=${extension.dir}`,
                `--load-extension=${extension.dir}`,
                '--mute-audio',
            ],
        });
        await use(context);
        await context.close();
    },

    page: async ({ context }, use) => {
        await use(context.pages()[0] ?? await context.newPage());
    },

    // Hide mode each test starts in. `null` keeps whatever a fresh install sets.
    initialHideState: [false, { option: true }],

    ext: async ({ context, extension, initialHideState }, use) => {
        const ext = new ExtensionDriver(context, extension.popupPath);
        await ext.evaluate(() => { self.__ttAlive = true; });
        if (initialHideState !== null) {
            // Wait for onInstalled to write its default so it cannot overwrite ours.
            await expect.poll(() => ext.evaluate(() => chrome.storage.local.get('hideState')
                .then((s) => s.hideState !== undefined))).toBe(true);
            await ext.evaluate((v) => chrome.storage.local.set({ hideState: v }), initialHideState);
        }
        await use(ext);
    },
});

module.exports = { test, expect };
