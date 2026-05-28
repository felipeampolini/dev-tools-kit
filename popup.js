const toggleInput = document.getElementById("toggleInput");
const statusText = document.getElementById("statusText");
const instantToggleInput = document.getElementById("instantToggleInput");
const instantStatusText = document.getElementById("instantStatusText");
const githubStatusEnabledInput = document.getElementById("githubStatusEnabledInput");
const githubStatusEnabledText = document.getElementById("githubStatusEnabledText");
const screenshotEnabledInput = document.getElementById("screenshotEnabledInput");
const screenshotEnabledText = document.getElementById("screenshotEnabledText");
const scrollButtonsInput = document.getElementById("scrollButtonsInput");
const scrollButtonsStatusText = document.getElementById("scrollButtonsStatusText");
const allButtonsInput = document.getElementById("allButtonsInput");
const allButtonsStatusText = document.getElementById("allButtonsStatusText");
const githubStatusBtn = document.getElementById("githubStatusBtn");
const githubDot = document.getElementById("githubDot");
const githubLabel = document.getElementById("githubLabel");
const githubHint = document.getElementById("githubHint");

// carregar estado
chrome.storage.sync.get(["enabled", "instantScroll", "githubStatusEnabled", "screenshotEnabled", "scrollButtonsEnabled"], (result) => {
    updateToggle(result.enabled ?? true);
    updateInstantToggle(result.instantScroll ?? false);
    updateGithubStatusEnabled(result.githubStatusEnabled ?? true);
    updateScrollButtonsEnabled(result.scrollButtonsEnabled ?? true);
    updateScreenshotEnabled(result.screenshotEnabled ?? true);
    syncMasterToggle();

    if (result.githubStatusEnabled ?? true) fetchGithubStatus();
});

// toggle widget
toggleInput.addEventListener("change", () => {
    const newState = toggleInput.checked;

    chrome.storage.sync.set({ enabled: newState }, () => {
        updateToggle(newState);

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: "toggleWidget" });
            });
        });
    });
});

function updateToggle(enabled) {
    toggleInput.checked = enabled;
    statusText.textContent = enabled ? "ON" : "OFF";
    statusText.className = "status-text" + (enabled ? " on" : "");
}

// instant scroll toggle
instantToggleInput.addEventListener("change", () => {
    const newState = instantToggleInput.checked;

    chrome.storage.sync.set({ instantScroll: newState }, () => {
        updateInstantToggle(newState);

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: "setInstantScroll", value: newState });
            });
        });
    });
});

function updateInstantToggle(enabled) {
    instantToggleInput.checked = enabled;
    instantStatusText.textContent = enabled ? "ON" : "OFF";
    instantStatusText.className = "status-text" + (enabled ? " on" : "");
}

// github status feature toggle
githubStatusEnabledInput.addEventListener("change", () => {
    const newState = githubStatusEnabledInput.checked;
    chrome.storage.sync.set({ githubStatusEnabled: newState }, () => {
        updateGithubStatusEnabled(newState);
        if (newState) fetchGithubStatus();
    });
});

function updateGithubStatusEnabled(enabled) {
    githubStatusEnabledInput.checked = enabled;
    githubStatusEnabledText.textContent = enabled ? "ON" : "OFF";
    githubStatusEnabledText.className = "status-text" + (enabled ? " on" : "");
    githubStatusBtn.style.display = enabled ? "" : "none";
    githubDetails.style.display = enabled ? "" : "none";
    if (!enabled && detailsOpen) {
        detailsOpen = false;
        githubDetails.classList.remove("open");
    }
}

// screenshot feature toggle
screenshotEnabledInput.addEventListener("change", () => {
    const newState = screenshotEnabledInput.checked;
    chrome.storage.sync.set({ screenshotEnabled: newState }, () => {
        updateScreenshotEnabled(newState);
        syncMasterToggle();
    });
});

// scroll buttons toggle
scrollButtonsInput.addEventListener("change", () => {
    const newState = scrollButtonsInput.checked;
    chrome.storage.sync.set({ scrollButtonsEnabled: newState }, () => {
        updateScrollButtonsEnabled(newState);
        syncMasterToggle();
    });
});

function updateScrollButtonsEnabled(enabled) {
    scrollButtonsInput.checked = enabled;
    scrollButtonsStatusText.textContent = enabled ? "ON" : "OFF";
    scrollButtonsStatusText.className = "status-text" + (enabled ? " on" : "");
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "setScrollButtonsEnabled", value: enabled });
        });
    });
}

// all buttons master toggle
allButtonsInput.addEventListener("change", () => {
    const newState = allButtonsInput.checked;
    chrome.storage.sync.set({ scrollButtonsEnabled: newState, screenshotEnabled: newState }, () => {
        updateScrollButtonsEnabled(newState);
        updateScreenshotEnabled(newState);
        allButtonsInput.checked = newState;
        allButtonsStatusText.textContent = newState ? "ON" : "OFF";
        allButtonsStatusText.className = "status-text" + (newState ? " on" : "");
    });
});

function syncMasterToggle() {
    const anyOn = scrollButtonsInput.checked || screenshotEnabledInput.checked;
    allButtonsInput.checked = anyOn;
    allButtonsStatusText.textContent = anyOn ? "ON" : "OFF";
    allButtonsStatusText.className = "status-text" + (anyOn ? " on" : "");
}

function updateScreenshotEnabled(enabled) {
    screenshotEnabledInput.checked = enabled;
    screenshotEnabledText.textContent = enabled ? "ON" : "OFF";
    screenshotEnabledText.className = "status-text" + (enabled ? " on" : "");
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "setScreenshotEnabled", value: enabled });
        });
    });
}

// ======================
// SETTINGS PANEL
// ======================

const settingsBtn = document.getElementById("settingsBtn");
const settingsHint = document.getElementById("settingsHint");
const settingsPanel = document.getElementById("settingsPanel");
let settingsOpen = false;

settingsBtn.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    settingsHint.textContent = settingsOpen ? "▴" : "▾";
    settingsPanel.classList.toggle("open", settingsOpen);
});


// ======================
// GITHUB STATUS
// ======================

const githubDetails = document.getElementById("githubDetails");

const STATUS_CONFIG = {
    operational:          { dot: "#4ec9b0", badge: "badge-ok",          label: "ok"          },
    degraded_performance: { dot: "#dcdcaa", badge: "badge-degraded",    label: "degraded"    },
    partial_outage:       { dot: "#ce9178", badge: "badge-partial",      label: "partial"     },
    major_outage:         { dot: "#f44747", badge: "badge-outage",       label: "outage"      },
    under_maintenance:    { dot: "#858585", badge: "badge-maintenance",  label: "maintenance" },
};

let githubComponents = [];
let detailsOpen = false;

async function fetchGithubStatus() {
    githubDot.removeAttribute("data-status");
    githubLabel.textContent = "fetching...";
    githubHint.textContent = "";

    try {
        const [statusRes, componentsRes] = await Promise.all([
            fetch("https://www.githubstatus.com/api/v2/status.json"),
            fetch("https://www.githubstatus.com/api/v2/components.json")
        ]);

        const { status } = await statusRes.json();
        const { components } = await componentsRes.json();

        githubComponents = components.filter(c => !c.group);

        githubDot.setAttribute("data-status", status.indicator);
        githubLabel.textContent = status.description.toLowerCase();
        githubHint.textContent = "▾";

    } catch {
        githubDot.setAttribute("data-status", "error");
        githubLabel.textContent = "connection error";
        githubHint.textContent = "";
        githubComponents = [];
    }
}

function toggleDetails() {
    if (!githubComponents.length) return;

    detailsOpen = !detailsOpen;
    githubHint.textContent = detailsOpen ? "▴" : "▾";

    if (detailsOpen) {
        githubDetails.innerHTML = "";

        githubComponents.forEach(c => {
            const cfg = STATUS_CONFIG[c.status] || { dot: "#5a5a5a", badge: "badge-maintenance", label: c.status };

            const row = document.createElement("div");
            row.className = "component-row";

            const dot = document.createElement("span");
            dot.className = "component-dot";
            dot.style.background = cfg.dot;

            const name = document.createElement("span");
            name.className = "component-name";
            name.textContent = c.name.toLowerCase();

            const badge = document.createElement("span");
            badge.className = `component-badge ${cfg.badge}`;
            badge.textContent = cfg.label;

            row.appendChild(dot);
            row.appendChild(name);
            row.appendChild(badge);
            githubDetails.appendChild(row);
        });
    }

    githubDetails.classList.toggle("open", detailsOpen);
}

githubStatusBtn.addEventListener("click", () => {
    if (githubComponents.length) {
        toggleDetails();
    } else {
        fetchGithubStatus();
    }
});
