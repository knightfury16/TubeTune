# TubeTune - YouTube Title Modifier

TubeTune is a Chrome extension designed to modify or remove YouTube video titles.

## Features

- Modify YouTube video titles via a popup.
- Use keyboard shortcuts to hide titles `Ctrl+M` or open the popup `Shift+Ctrl+Y`.

## Installation

1. Clone or download the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" at the top-right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

### Automatic Title Removal

The extension automatically removes the YouTube video title when a video page loads.

### Modify Title via Popup

1. Click on the extension icon next to the address bar to open the popup.
2. Enter the new title in the input field.
3. Click "Modify Title" to change the video title.

### Keyboard Shortcuts

- **Hide Title**: `Ctrl+M`
- **Open Popup**: `Ctrl+Shift+Y`

## File Structure

```plaintext
.
├── manifest.json
├── popup.html
├── scripts
│   ├── background.js
│   ├── content.js
│   └── popup.js
└── README.md
```

### Todo:
- [x] Automatic Title Removal
- [x] FullScreen Support
