// Builds a throwaway copy of the extension with a small test shim, and finds a
// Chromium that can load unpacked extensions (branded Chrome 137+ cannot).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../../..');
const NOT_EXTENSION = new Set([
    '.git', 'node_modules', 'tests', 'test-results', 'playwright-report', 'blob-report',
    'package.json', 'package-lock.json', 'playwright.config.js', 'README.md', '.gitignore',
]);

// Real extension shortcuts are handled by the browser UI and cannot be pressed
// from Playwright, so the shim records the onCommand listeners for the tests to call.
const SHIM = `self.__tt = { commandListeners: [] };
const __ttAdd = chrome.commands.onCommand.addListener.bind(chrome.commands.onCommand);
chrome.commands.onCommand.addListener = (fn) => {
    self.__tt.commandListeners.push(fn);
    __ttAdd(fn);
};
`;

function buildTestExtension() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tubetune-e2e-'));
    for (const entry of fs.readdirSync(ROOT)) {
        if (!NOT_EXTENSION.has(entry)) {
            fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
        }
    }

    const manifestPath = path.join(dir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const original = manifest.background.service_worker;
    if (manifest.background.type === 'module') {
        fs.writeFileSync(path.join(dir, '__test_shim.js'), SHIM);
        fs.writeFileSync(path.join(dir, '__test_sw.js'), `import './__test_shim.js';\nimport './${original}';\n`);
    } else {
        fs.writeFileSync(path.join(dir, '__test_sw.js'), `${SHIM}importScripts('${original}');\n`);
    }
    manifest.background.service_worker = '__test_sw.js';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Blank extension page the harness uses to wake a stopped service worker.
    fs.writeFileSync(path.join(dir, '__test_page.html'), '<!DOCTYPE html><title>test</title>');

    return { dir, popupPath: manifest.action.default_popup };
}

function resolveChromium() {
    if (process.env.TUBETUNE_CHROMIUM) return process.env.TUBETUNE_CHROMIUM;

    const bundled = chromium.executablePath();
    if (fs.existsSync(bundled)) return bundled;

    // Fall back to the newest Chromium Playwright has already downloaded.
    const match = bundled.match(/^(.*[\\/])chromium-\d+([\\/].*)$/);
    if (match) {
        const [, root, relative] = match;
        const candidates = fs.existsSync(root) ? fs.readdirSync(root) : [];
        const found = candidates
            .map((name) => name.match(/^chromium-(\d+)$/))
            .filter(Boolean)
            .sort((a, b) => Number(b[1]) - Number(a[1]))
            .map((m) => path.join(root, m[0], relative))
            .find((exe) => fs.existsSync(exe));
        if (found) return found;
    }
    throw new Error('No Chromium found. Run `npx playwright install chromium` or set TUBETUNE_CHROMIUM.');
}

module.exports = { buildTestExtension, resolveChromium };
