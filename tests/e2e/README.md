# TubeTune end-to-end tests

Each test starts a fresh Chromium profile with the extension loaded and drives
real YouTube pages. They need an internet connection.

```bash
npm test                 # headless
npm run test:headed      # watch it in a browser window
npx playwright test -g "#3"   # one test by name
```

## Browser

Branded Google Chrome (137+) can no longer load unpacked extensions from the
command line, so the tests use Playwright's Chromium. If the build that matches
the installed Playwright version is missing, the newest one already under
`ms-playwright` is used instead. Run `npx playwright install chromium` to get
the matching build, or set `TUBETUNE_CHROMIUM` to a Chromium executable.

## What is simulated

| Real action | How the tests do it |
|---|---|
| Pressing `Ctrl+M` | Extension shortcuts are handled by the browser UI, which Playwright cannot press. The test copy of the extension records the `chrome.commands.onCommand` listeners and the test calls them with `'hide'`. |
| Clicking the toolbar icon | `popup.html` is opened in a background tab, so the YouTube tab stays the active one, exactly as with the real popup. |
| Chrome stopping the idle service worker | DevTools protocol `ServiceWorker.stopAllWorkers`, then a message wakes it again. |

The extension files themselves are never modified; the harness works on a
temporary copy (`support/extension.js`).

## Bug numbers

Test names starting with `#N` refer to the numbered bug list from the
bug review. Tests without a number are regression checks for behaviour that
already works.
