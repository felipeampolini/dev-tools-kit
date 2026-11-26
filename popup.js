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
const claudeStatusEnabledInput = document.getElementById("claudeStatusEnabledInput");
const claudeStatusEnabledText = document.getElementById("claudeStatusEnabledText");
const claudeStatusBtn = document.getElementById("claudeStatusBtn");
const claudeDot = document.getElementById("claudeDot");
const claudeLabel = document.getElementById("claudeLabel");
const claudeHint = document.getElementById("claudeHint");

// carregar estado
chrome.storage.sync.get(["enabled", "instantScroll", "githubStatusEnabled", "claudeStatusEnabled", "colorPickerEnabled", "screenshotEnabled", "scrollButtonsEnabled"], (result) => {
    updateToggle(result.enabled ?? true);
    updateInstantToggle(result.instantScroll ?? false);
    updateGithubStatusEnabled(result.githubStatusEnabled ?? true);
    updateClaudeStatusEnabled(result.claudeStatusEnabled ?? true);
    updateColorPickerEnabled(result.colorPickerEnabled ?? true);
    updateScrollButtonsEnabled(result.scrollButtonsEnabled ?? true);
    updateScreenshotEnabled(result.screenshotEnabled ?? true);
    syncMasterToggle();

    if (result.githubStatusEnabled ?? true) fetchGithubStatus();
    if (result.claudeStatusEnabled ?? true) fetchClaudeStatus();
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

// claude status feature toggle
claudeStatusEnabledInput.addEventListener("change", () => {
    const newState = claudeStatusEnabledInput.checked;
    chrome.storage.sync.set({ claudeStatusEnabled: newState }, () => {
        updateClaudeStatusEnabled(newState);
        if (newState) fetchClaudeStatus();
    });
});

function updateClaudeStatusEnabled(enabled) {
    claudeStatusEnabledInput.checked = enabled;
    claudeStatusEnabledText.textContent = enabled ? "ON" : "OFF";
    claudeStatusEnabledText.className = "status-text" + (enabled ? " on" : "");
    claudeStatusBtn.style.display = enabled ? "" : "none";
    claudeDetails.style.display = enabled ? "" : "none";
    if (!enabled && claudeDetailsOpen) {
        claudeDetailsOpen = false;
        claudeDetails.classList.remove("open");
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


// ======================
// CLAUDE STATUS
// ======================

const claudeDetails = document.getElementById("claudeDetails");

let claudeComponents = [];
let claudeDetailsOpen = false;

async function fetchClaudeStatus() {
    claudeDot.removeAttribute("data-status");
    claudeLabel.textContent = "fetching...";
    claudeHint.textContent = "";

    try {
        const [statusRes, componentsRes] = await Promise.all([
            fetch("https://status.anthropic.com/api/v2/status.json"),
            fetch("https://status.anthropic.com/api/v2/components.json")
        ]);

        const { status } = await statusRes.json();
        const { components } = await componentsRes.json();

        claudeComponents = components.filter(c => !c.group);

        claudeDot.setAttribute("data-status", status.indicator);
        claudeLabel.textContent = status.description.toLowerCase();
        claudeHint.textContent = "▾";

    } catch {
        claudeDot.setAttribute("data-status", "error");
        claudeLabel.textContent = "connection error";
        claudeHint.textContent = "";
        claudeComponents = [];
    }
}

function toggleClaudeDetails() {
    if (!claudeComponents.length) return;

    claudeDetailsOpen = !claudeDetailsOpen;
    claudeHint.textContent = claudeDetailsOpen ? "▴" : "▾";

    if (claudeDetailsOpen) {
        claudeDetails.innerHTML = "";

        claudeComponents.forEach(c => {
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
            claudeDetails.appendChild(row);
        });
    }

    claudeDetails.classList.toggle("open", claudeDetailsOpen);
}

claudeStatusBtn.addEventListener("click", () => {
    if (claudeComponents.length) {
        toggleClaudeDetails();
    } else {
        fetchClaudeStatus();
    }
});


// ======================
// COLOR PICKER
// ======================

const colorPickerEnabledInput = document.getElementById("colorPickerEnabledInput");
const colorPickerEnabledText = document.getElementById("colorPickerEnabledText");
const colorDivider = document.getElementById("colorDivider");
const colorPickerBtn = document.getElementById("colorPickerBtn");
const colorChip = document.getElementById("colorChip");
const colorHint = document.getElementById("colorHint");
const colorPanel = document.getElementById("colorPanel");
const colorSwatch = document.getElementById("colorSwatch");
const colorInput = document.getElementById("colorInput");
const pickFromPageBtn = document.getElementById("pickFromPageBtn");
const fmtHex = document.getElementById("fmtHex");
const fmtRgb = document.getElementById("fmtRgb");
const fmtHsl = document.getElementById("fmtHsl");
const colorHistoryEl = document.getElementById("colorHistory");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const colorMsg = document.getElementById("colorMsg");

const COLOR_HISTORY_MAX = 16;
const DEFAULT_COLOR = "#4ec9b0";

let colorPanelOpen = false;
let colorHistory = [];

// feature toggle
colorPickerEnabledInput.addEventListener("change", () => {
    const newState = colorPickerEnabledInput.checked;
    chrome.storage.sync.set({ colorPickerEnabled: newState }, () => updateColorPickerEnabled(newState));
});

function updateColorPickerEnabled(enabled) {
    colorPickerEnabledInput.checked = enabled;
    colorPickerEnabledText.textContent = enabled ? "ON" : "OFF";
    colorPickerEnabledText.className = "status-text" + (enabled ? " on" : "");
    colorPickerBtn.style.display = enabled ? "" : "none";
    colorPanel.style.display = enabled ? "" : "none";
    colorDivider.style.display = enabled ? "" : "none";
    if (!enabled && colorPanelOpen) {
        colorPanelOpen = false;
        colorHint.textContent = "▾";
        colorPanel.classList.remove("open");
    }
}

// abrir / fechar painel
colorPickerBtn.addEventListener("click", () => {
    colorPanelOpen = !colorPanelOpen;
    colorHint.textContent = colorPanelOpen ? "▴" : "▾";
    colorPanel.classList.toggle("open", colorPanelOpen);
});

// carregar cor atual + histórico (a página salva aqui após o conta-gotas)
chrome.storage.local.get(["currentColor", "colorHistory"], (result) => {
    colorHistory = result.colorHistory ?? [];
    setColor(result.currentColor ?? DEFAULT_COLOR);
    renderColorHistory();
});

// conversões
function normalizeHex(value) {
    let v = value.trim().replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{3}$/.test(v)) v = v.split("").map(c => c + c).join("");
    return /^[0-9a-f]{6}$/.test(v) ? "#" + v : null;
}

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }

    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// atualiza UI com a cor (não mexe no input hex enquanto o usuário digita nele)
function setColor(hex, { fromHexInput = false } = {}) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);

    colorInput.value = hex;
    colorSwatch.style.background = hex;
    colorChip.style.background = hex;
    if (!fromHexInput) fmtHex.value = hex;
    fmtHex.classList.remove("invalid");
    fmtRgb.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    fmtHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function commitColor(hex) {
    colorHistory = [hex, ...colorHistory.filter(c => c !== hex)].slice(0, COLOR_HISTORY_MAX);
    chrome.storage.local.set({ currentColor: hex, colorHistory });
    renderColorHistory();
}

function renderColorHistory() {
    colorHistoryEl.innerHTML = "";

    if (!colorHistory.length) {
        const empty = document.createElement("span");
        empty.className = "history-empty";
        empty.textContent = "no colors yet";
        colorHistoryEl.appendChild(empty);
        return;
    }

    colorHistory.forEach(hex => {
        const sw = document.createElement("button");
        sw.className = "history-swatch";
        sw.style.background = hex;
        sw.title = hex;
        sw.addEventListener("click", () => {
            setColor(hex);
            chrome.storage.local.set({ currentColor: hex });
        });
        colorHistoryEl.appendChild(sw);
    });
}

// seletor nativo: "input" atualiza ao vivo, "change" salva no histórico
colorInput.addEventListener("input", () => setColor(colorInput.value));
colorInput.addEventListener("change", () => commitColor(colorInput.value));

// digitar/colar hex
fmtHex.addEventListener("input", () => {
    const hex = normalizeHex(fmtHex.value);
    if (hex) setColor(hex, { fromHexInput: true });
    else fmtHex.classList.add("invalid");
});

fmtHex.addEventListener("change", () => {
    const hex = normalizeHex(fmtHex.value);
    if (hex) {
        setColor(hex);
        commitColor(hex);
    }
});

fmtHex.addEventListener("keydown", (e) => {
    if (e.key === "Enter") fmtHex.blur();
});

// copiar formatos
document.querySelectorAll(".copy-btn[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
        const el = document.getElementById(btn.dataset.copy);
        const text = el.value ?? el.textContent;
        try {
            await navigator.clipboard.writeText(text);
            btn.textContent = "copied";
            btn.classList.add("copied");
        } catch {
            btn.textContent = "error";
        }
        setTimeout(() => {
            btn.textContent = "copy";
            btn.classList.remove("copied");
        }, 1200);
    });
});

clearHistoryBtn.addEventListener("click", () => {
    colorHistory = [];
    chrome.storage.local.set({ colorHistory });
    renderColorHistory();
});

// conta-gotas: o content script captura a aba e mostra a lupa; o popup fecha
pickFromPageBtn.addEventListener("click", () => {
    colorMsg.textContent = "";

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab) return;

        chrome.tabs.sendMessage(tab.id, { action: "startColorPick" }, (res) => {
            if (chrome.runtime.lastError || !res) {
                colorMsg.textContent = "unavailable on this page — try reloading it";
                return;
            }
            if (res.error) {
                colorMsg.textContent = "capture failed: " + res.error;
                return;
            }
            window.close();
        });
    });
});
