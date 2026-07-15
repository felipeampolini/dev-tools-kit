# dev-tools-kit

A Chrome extension with a developer-focused dark UI that adds a floating widget and quick-access tools to every page you browse.

## Features

### Floating Widget
A compact panel docked to the right edge of every page with:
- **Scroll to Top / Bottom** — one-click navigation
- **Screenshot** — captures the visible tab and copies it directly to your clipboard as PNG
- **Minimize / Maximize** — collapse the widget to a single button when not needed
- **Auto-hide** — the widget only appears when the page has scrollable content

<img width="153" height="223" alt="2026-05-27 22-18-18" src="https://github.com/user-attachments/assets/b19b1c07-6179-4a89-b3cf-c6c88f169929" />
<img width="74" height="70" alt="2026-05-27 22-18-39" src="https://github.com/user-attachments/assets/2746b01c-5953-4c06-a391-710e96ed8f38" />



### Status Monitors
Each monitor fetches a status page on popup open and displays the overall status inline. Click any monitor to expand a component-by-component breakdown with color-coded badges.

Two monitors ship by default:

- **GitHub** — [githubstatus.com](https://www.githubstatus.com) (Actions, API, Pages, Codespaces, etc.)
- **Claude** — [status.anthropic.com](https://status.anthropic.com) (Claude API, Console, Claude.ai, etc.)

<img width="30%" alt="2026-05-27 22-19-51" src="https://github.com/user-attachments/assets/4c7273ba-1f12-4cd0-b078-c845b3b2f9b8" />

#### Add your own monitors

Both defaults use the [Atlassian Statuspage](https://www.atlassian.com/software/statuspage) v2 API — the same format used by hundreds of services (Vercel, Cloudflare, npm, OpenAI, Discord, …). The settings panel has a **`status.monitors`** section where you can add any Statuspage-powered service:

1. Paste the service's status URL — a bare host (`vercel-status.com`), the base URL (`https://www.githubstatus.com`), or even a full API URL all work.
2. Press **+**. The extension normalizes the URL, does a single `GET` to `/api/v2/summary.json`, and **auto-detects the service name and its components**.
3. On success it's saved and a new status button appears. Invalid or unreachable URLs are rejected with a message.

Every monitor (built-in or custom) has an **ON/OFF** toggle; custom monitors also have a **×** to remove them. The full list is persisted in `chrome.storage.sync`, so it follows your Chrome profile.

### Settings Panel

All features are configurable via a collapsible settings panel in the popup:

| Setting | Description |
|---|---|
| `float.widget` | Enable / disable the floating widget entirely |
| `instant.scroll` | Switch between smooth and instant scroll behavior |
| `status.monitors` | Add / remove / toggle status monitors (GitHub, Claude, and any custom Statuspage service) |
| `all.buttons` | Master toggle for widget action buttons |
| `scroll.buttons` | Show / hide the scroll ⬆⬇ buttons |
| `print.screen` | Show / hide the screenshot ⎙ button |

The `all.buttons` master toggle has bidirectional logic:
- Turning it **OFF** disables all sub-toggles (including the minimize button)
- Turning any sub-toggle **ON** automatically activates the master
- Turning all sub-toggles **OFF** automatically deactivates the master

<img width="30%" alt="2026-05-27 22-16-51" src="https://github.com/user-attachments/assets/7e596932-2cbe-4235-a8cf-5cbd6f9648ae" />

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
└── popup.js            # Popup logic — settings, status monitors, toggles
```

## Tech

- Chrome Extension Manifest V3
- Vanilla JS — no dependencies
- Status monitors: [Atlassian Statuspage](https://www.atlassian.com/software/statuspage) v2 API (`/api/v2/summary.json`) — GitHub and Claude ship as defaults; any Statuspage-powered service can be added by URL
- VS Code dark theme color palette

## License

[MIT](LICENSE) © Felipe Ampolini
