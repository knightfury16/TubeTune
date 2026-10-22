# TubeTune - YouTube Title Hider

TubeTune is a Chrome extension that hides YouTube video titles, or replaces them
with a title of your own, so you can watch without spoilers.

## Features

- **Hides the title everywhere it appears for the video you are watching**: the
  heading under the player, the browser tab, the title over the player and in
  fullscreen, the miniplayer, the top of the expanded description, Shorts, and
  the media controls of Chrome and your operating system.
- **Automatic**: hide mode is on from the moment you install TubeTune, so every
  video page opens with its title removed, with no flash while the page loads.
- **Remembered and in sync**: hide mode survives reloads and browser restarts,
  and every open YouTube tab follows the same setting.
- **Custom titles**: give the current video a title of your own from the popup.
  It stays visible even in hide mode, and is dropped when you move to another video.
- **Badge** on the toolbar icon shows `On` while titles are hidden and `Off` while
  they are shown.

## Installation

1. Clone or download the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" at the top-right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

### Automatic Title Removal

With hide mode on (the default), the extension removes the video title as soon as a
video page loads, and keeps it removed as you move from video to video.

### Show or hide titles

- Press `Ctrl+M` (`Control+M` on Mac) on any YouTube page, or
- Open the popup and flip the **Hide titles** switch.

The setting applies to all YouTube tabs at once.

### Modify Title via Popup

1. Open a YouTube video, then click the extension icon next to the address bar
   (or press `Ctrl+Shift+Y`).
2. Type the new title and press `Enter` or click **Rename**.
3. Click **Restore original title** to go back to YouTube's title.

### Keyboard Shortcuts

| Action | Windows / Linux | Mac |
|---|---|---|
| Show or hide titles | `Ctrl+M` | `Control+M` |
| Open the popup | `Ctrl+Shift+Y` | `Command+Shift+Y` |

Change them at `chrome://extensions/shortcuts`.

### What is not hidden

TubeTune hides the title of the video you are watching. Titles of other videos in
recommendations, search results and the home feed stay visible.

## Permissions

- **Storage**: remembers whether hide mode is on.
- **www.youtube.com**: the only site TubeTune runs on. It does not read your
  browsing history or any other site.

## File Structure

```plaintext
.
├── manifest.json
├── popup.html
├── icons/
├── scripts
│   ├── shared.js          # constants and storage helper used by every script
│   ├── background.js      # shortcut, badge, first-install default
│   ├── content.js         # runs on YouTube: flags hide mode, tab title, custom title
│   ├── media-session.js   # runs in YouTube's own page context: masks the media controls title
│   └── popup.js
├── styles
│   └── hide.css           # every place a title is hidden
├── tests/e2e              # Playwright end-to-end tests
└── README.md
```

## Development

```bash
npm install
npm test               # headless
npm run test:headed    # watch the tests in a browser window
```

The tests load the extension into Chromium and drive real YouTube pages; see
[tests/e2e/README.md](tests/e2e/README.md) for what they cover and how they work.

### Todo:
- [x] Automatic Title Removal
- [x] FullScreen Support
- [x] Remove title on miniplayer
- [x] Improve automatic title removal (use extension storage)
- [x] Refactor the code base
- [x] Shorts and media controls
