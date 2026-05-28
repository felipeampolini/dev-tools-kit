# dev-tools-kit

A Chrome extension with a developer-focused dark UI that adds a floating widget and quick-access tools to every page you browse.

## Features

### Floating Widget
A compact panel docked to the right edge of every page with:
- **Scroll to Top / Bottom** — one-click navigation
- **Screenshot** — captures the visible tab and copies it directly to your clipboard as PNG
- **Minimize / Maximize** — collapse the widget to a single button when not needed
- **Auto-hide** — the widget only appears when the page has scrollable content

### GitHub Status Monitor
Fetches [githubstatus.com](https://www.githubstatus.com) on popup open and displays overall status inline. Click to expand a component-by-component breakdown (Actions, API, Pages, Codespaces, etc.) with color-coded badges.

### Settings Panel
All features are configurable via a collapsible settings panel in the popup:

| Setting | Description |
|---|---|
| `float.widget` | Enable / disable the floating widget entirely |
| `instant.scroll` | Switch between smooth and instant scroll behavior |
| `github.status` | Show / hide the GitHub status button |
| `all.buttons` | Master toggle for widget action buttons |
| `scroll.buttons` | Show / hide the scroll ⬆⬇ buttons |
| `print.screen` | Show / hide the screenshot ⎙ button |

The `all.buttons` master toggle has bidirectional logic:
- Turning it **OFF** disables all sub-toggles (including the minimize button)
- Turning any sub-toggle **ON** automatically activates the master
- Turning all sub-toggles **OFF** automatically deactivates the master

## Installation

This extension is not published to the Chrome Web Store. Install it manually as an unpacked extension:

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder
5. The extension icon will appear in your toolbar

## Usage

Click the extension icon to open the popup. The GitHub status loads automatically. Use the **settings** button (⚙) to expand configuration options.

The floating widget appears automatically on any scrollable page and can be toggled per-site behavior via the `float.widget` setting.

## Project Structure

```
dev-tools-kit/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker — handles tab screenshot capture
├── content.js          # Injected script — creates and manages the floating widget
├── style.css           # Floating widget styles
├── popup.html          # Extension popup UI
└── popup.js            # Popup logic — settings, GitHub status, toggles
```

## Tech

- Chrome Extension Manifest V3
- Vanilla JS — no dependencies
- GitHub Status API: `https://www.githubstatus.com/api/v2/`
- VS Code dark theme color palette

## License

[MIT](LICENSE) © Felipe Ampolini
