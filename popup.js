const toggleInput = document.getElementById("toggleInput");
const statusText = document.getElementById("statusText");
const instantToggleInput = document.getElementById("instantToggleInput");
const instantStatusText = document.getElementById("instantStatusText");
const screenshotEnabledInput = document.getElementById("screenshotEnabledInput");
const screenshotEnabledText = document.getElementById("screenshotEnabledText");
const scrollButtonsInput = document.getElementById("scrollButtonsInput");
const scrollButtonsStatusText = document.getElementById("scrollButtonsStatusText");
const allButtonsInput = document.getElementById("allButtonsInput");
const allButtonsStatusText = document.getElementById("allButtonsStatusText");

// carregar estado
chrome.storage.sync.get(
    ["enabled", "instantScroll", "screenshotEnabled", "scrollButtonsEnabled", "statusSources", "githubStatusEnabled", "claudeStatusEnabled"],
    (result) => {
        updateToggle(result.enabled ?? true);
        updateInstantToggle(result.instantScroll ?? false);
        updateScrollButtonsEnabled(result.scrollButtonsEnabled ?? true);
        updateScreenshotEnabled(result.screenshotEnabled ?? true);
        syncMasterToggle();

        loadStatusSources(result);
        renderSourcesSettings();
        renderStatusButtons();
    }
);

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
// STATUS SOURCES
// ======================
//
// Every monitor is a "status source" backed by an Atlassian Statuspage v2
// endpoint (the same format GitHub and Claude expose). A single GET to
// `{origin}/api/v2/summary.json` returns the page name, overall status and
// all components — so any Statuspage-powered service can be added by URL.

const SVG_ICONS = {
    github: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
    claude: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c.36 3.02 1.02 5.02 2 6s2.98 1.64 6 2c-3.02.36-5.02 1.02-6 2s-1.64 2.98-2 6c-.36-3.02-1.02-5.02-2-6s-2.98-1.64-6-2c3.02-.36 5.02-1.02 6-2s1.64-2.98 2-6z"/></svg>',
    generic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"/></svg>',
};

const DEFAULT_SOURCES = [
    { id: "github", name: "github", url: "https://www.githubstatus.com", icon: "github", builtin: true, enabled: true },
    { id: "claude", name: "claude", url: "https://status.anthropic.com", icon: "claude", builtin: true, enabled: true },
];

const STATUS_CONFIG = {
    operational:          { dot: "#4ec9b0", badge: "badge-ok",           label: "ok"          },
    degraded_performance: { dot: "#dcdcaa", badge: "badge-degraded",     label: "degraded"    },
    partial_outage:       { dot: "#ce9178", badge: "badge-partial",      label: "partial"     },
    major_outage:         { dot: "#f44747", badge: "badge-outage",       label: "outage"      },
    under_maintenance:    { dot: "#858585", badge: "badge-maintenance",  label: "maintenance" },
};

let statusSources = [];
// runtime state per source id: { components, open, dot, label, hint, details }
const sourceState = {};

const statusSourcesList = document.getElementById("statusSourcesList");
const statusButtons = document.getElementById("statusButtons");
const addSourceInput = document.getElementById("addSourceInput");
const addSourceBtn = document.getElementById("addSourceBtn");
const addSourceMsg = document.getElementById("addSourceMsg");

function loadStatusSources(result) {
    if (Array.isArray(result.statusSources) && result.statusSources.length) {
        statusSources = result.statusSources;
        return;
    }
    // first run / migration: seed the built-in sources, honoring the legacy
    // github/claude enable flags if the user had set them.
    statusSources = DEFAULT_SOURCES.map(s => ({ ...s }));
    if (result.githubStatusEnabled === false) statusSources[0].enabled = false;
    if (result.claudeStatusEnabled === false) statusSources[1].enabled = false;
    saveStatusSources();
}

function saveStatusSources() {
    chrome.storage.sync.set({ statusSources });
}

function summaryEndpoint(source) {
    return source.url.replace(/\/+$/, "") + "/api/v2/summary.json";
}

// Accept anything the user pastes (bare host, base url, or a full api url)
// and reduce it to the service origin.
function normalizeOrigin(input) {
    let raw = (input || "").trim();
    if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    try {
        return new URL(raw).origin;
    } catch {
        return null;
    }
}

async function fetchSummary(source) {
    const res = await fetch(summaryEndpoint(source));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data || !data.status || !Array.isArray(data.components)) {
        throw new Error("not a statuspage");
    }
    return data;
}

function showAddMsg(text, kind) {
    addSourceMsg.textContent = text;
    addSourceMsg.className = "add-msg " + (kind || "info");
}

// -------- add flow --------

async function addStatusSource() {
    const origin = normalizeOrigin(addSourceInput.value);
    if (!origin) {
        showAddMsg("invalid url", "err");
        return;
    }
    if (statusSources.some(s => s.url.replace(/\/+$/, "") === origin)) {
        showAddMsg("already added", "err");
        return;
    }

    addSourceBtn.disabled = true;
    showAddMsg("checking…", "info");

    const probe = { url: origin };
    try {
        const data = await fetchSummary(probe);
        const name = ((data.page && data.page.name) ? data.page.name : new URL(origin).host)
            .toLowerCase();
        const componentCount = data.components.filter(c => !c.group).length;

        const source = {
            id: "src_" + Date.now().toString(36),
            name,
            url: origin,
            icon: "generic",
            builtin: false,
            enabled: true,
        };
        statusSources.push(source);
        saveStatusSources();

        renderSourcesSettings();
        renderStatusButtons();

        addSourceInput.value = "";
        showAddMsg(`added ${name} · ${componentCount} components`, "ok");
    } catch {
        showAddMsg("not a valid status api (expects statuspage v2)", "err");
    } finally {
        addSourceBtn.disabled = false;
    }
}

addSourceBtn.addEventListener("click", addStatusSource);
addSourceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addStatusSource();
});

function removeStatusSource(id) {
    statusSources = statusSources.filter(s => s.id !== id);
    delete sourceState[id];
    saveStatusSources();
    renderSourcesSettings();
    renderStatusButtons();
}

function setSourceEnabled(id, enabled) {
    const source = statusSources.find(s => s.id === id);
    if (!source) return;
    source.enabled = enabled;
    saveStatusSources();
    renderStatusButtons();
}

// -------- settings list rendering --------

function renderSourcesSettings() {
    statusSourcesList.innerHTML = "";

    statusSources.forEach(source => {
        const row = document.createElement("div");
        row.className = "row";

        const label = document.createElement("div");
        label.className = "label";
        const nameSpan = document.createElement("span");
        nameSpan.textContent = source.name;
        label.appendChild(nameSpan);
        label.appendChild(document.createTextNode(".status"));

        const wrap = document.createElement("div");
        wrap.className = "toggle-wrap";

        const stateText = document.createElement("span");
        stateText.className = "status-text" + (source.enabled ? " on" : "");
        stateText.textContent = source.enabled ? "ON" : "OFF";

        const sw = document.createElement("label");
        sw.className = "toggle-switch";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = source.enabled;
        const slider = document.createElement("span");
        slider.className = "slider";
        sw.appendChild(input);
        sw.appendChild(slider);

        input.addEventListener("change", () => {
            stateText.textContent = input.checked ? "ON" : "OFF";
            stateText.className = "status-text" + (input.checked ? " on" : "");
            setSourceEnabled(source.id, input.checked);
        });

        wrap.appendChild(stateText);
        wrap.appendChild(sw);

        if (!source.builtin) {
            const remove = document.createElement("button");
            remove.className = "remove-source";
            remove.textContent = "×";
            remove.title = "remove " + source.name;
            remove.addEventListener("click", () => removeStatusSource(source.id));
            wrap.appendChild(remove);
        }

        row.appendChild(label);
        row.appendChild(wrap);
        statusSourcesList.appendChild(row);
    });
}

// -------- status buttons rendering --------

function renderStatusButtons() {
    statusButtons.innerHTML = "";

    const enabled = statusSources.filter(s => s.enabled);
    enabled.forEach(source => {
        const btn = document.createElement("button");
        btn.className = "btn";

        const icon = document.createElement("span");
        icon.className = "btn-icon";
        icon.innerHTML = SVG_ICONS[source.icon] || SVG_ICONS.generic;

        const label = document.createElement("span");
        label.className = "btn-label";
        label.textContent = source.name + " status";

        const dot = document.createElement("span");
        dot.className = "status-dot";
        dot.textContent = "●";

        const hint = document.createElement("span");
        hint.className = "btn-hint";

        btn.appendChild(icon);
        btn.appendChild(label);
        btn.appendChild(dot);
        btn.appendChild(hint);

        const details = document.createElement("div");
        details.className = "details-panel";

        const state = { components: [], open: false, dot, label, hint, details };
        sourceState[source.id] = state;

        btn.addEventListener("click", () => {
            if (state.components.length) {
                toggleDetails(source.id);
            } else {
                fetchSourceStatus(source);
            }
        });

        statusButtons.appendChild(btn);
        statusButtons.appendChild(details);

        fetchSourceStatus(source);
    });
}

async function fetchSourceStatus(source) {
    const state = sourceState[source.id];
    if (!state) return;

    state.dot.removeAttribute("data-status");
    state.label.textContent = "fetching…";
    state.hint.textContent = "";

    try {
        const data = await fetchSummary(source);
        state.components = data.components.filter(c => !c.group);
        state.dot.setAttribute("data-status", data.status.indicator);
        state.label.textContent = data.status.description.toLowerCase();
        state.hint.textContent = state.components.length ? "▾" : "";
    } catch {
        state.dot.setAttribute("data-status", "error");
        state.label.textContent = "connection error";
        state.hint.textContent = "";
        state.components = [];
    }
}

function toggleDetails(id) {
    const state = sourceState[id];
    if (!state || !state.components.length) return;

    state.open = !state.open;
    state.hint.textContent = state.open ? "▴" : "▾";

    if (state.open) {
        state.details.innerHTML = "";

        state.components.forEach(c => {
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
            state.details.appendChild(row);
        });
    }

    state.details.classList.toggle("open", state.open);
}
