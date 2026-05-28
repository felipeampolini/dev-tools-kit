let widgetCreated = false;
let widget;
let toggleBtn;
let screenshotWidgetBtn;
let scrollToTopBtn;
let scrollToBottomBtn;
let isMinimized = false;
let instantScroll = false;
let screenshotEnabled = true;
let scrollButtonsEnabled = true;

// ouvir mudanças vindas do popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggleWidget") init();
    if (msg.action === "setInstantScroll") instantScroll = msg.value;
    if (msg.action === "setScreenshotEnabled") {
        screenshotEnabled = msg.value;
        if (screenshotWidgetBtn) screenshotWidgetBtn.style.display = msg.value ? "" : "none";
        applyMinimizeButtonVisibility();
    }
    if (msg.action === "setScrollButtonsEnabled") {
        scrollButtonsEnabled = msg.value;
        applyScrollButtonsVisibility();
    }
});

init();

function init() {
    chrome.storage.sync.get(["enabled", "instantScroll", "screenshotEnabled", "scrollButtonsEnabled"], (result) => {
        instantScroll = result.instantScroll ?? false;
        screenshotEnabled = result.screenshotEnabled ?? true;
        scrollButtonsEnabled = result.scrollButtonsEnabled ?? true;
        const enabled = result.enabled ?? true;

        if (enabled) {
            if (!widgetCreated) createWidget();
            updateWidgetVisibility();
        } else {
            removeWidget();
        }
    });
}

function createWidget() {
    widgetCreated = true;

    widget = document.createElement("div");
    widget.id = "scrollWidget";

    toggleBtn = document.createElement("button");
    toggleBtn.id = "toggleWidget";
    toggleBtn.innerHTML = "-";

    screenshotWidgetBtn = document.createElement("button");
    screenshotWidgetBtn.id = "screenshotWidgetBtn";
    screenshotWidgetBtn.innerHTML = "⎙";
    screenshotWidgetBtn.style.display = screenshotEnabled ? "" : "none";

    scrollToTopBtn = document.createElement("button");
    scrollToTopBtn.id = "scrollToTopBtn";
    scrollToTopBtn.innerHTML = "⬆";

    scrollToBottomBtn = document.createElement("button");
    scrollToBottomBtn.id = "scrollToBottomBtn";
    scrollToBottomBtn.innerHTML = "⬇";

    widget.appendChild(toggleBtn);
    widget.appendChild(screenshotWidgetBtn);
    widget.appendChild(scrollToTopBtn);
    widget.appendChild(scrollToBottomBtn);
    document.body.appendChild(widget);

    applyScrollButtonsVisibility();

    scrollToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: instantScroll ? "instant" : "smooth" });
    scrollToBottomBtn.onclick = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: instantScroll ? "instant" : "smooth" });

    screenshotWidgetBtn.onclick = async () => {
        try {
            const { dataUrl, error } = await chrome.runtime.sendMessage({ action: "captureScreenshot" });
            if (error) throw new Error(error);

            const blob = await (await fetch(dataUrl)).blob();
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

            flash(screenshotWidgetBtn, "flash-success");
        } catch {
            flash(screenshotWidgetBtn, "flash-error");
        }
    };

    toggleBtn.onclick = () => {
        isMinimized = !isMinimized;
        widget.classList.toggle("minimized", isMinimized);
        toggleBtn.innerHTML = isMinimized ? "+" : "−";
    };

    // listeners de scroll dinâmico
    window.addEventListener("load", updateWidgetVisibility);
    window.addEventListener("resize", updateWidgetVisibility);

    const observer = new MutationObserver(updateWidgetVisibility);
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(updateWidgetVisibility, 1000);
}

function removeWidget() {
    if (widget) widget.remove();
    widgetCreated = false;
    toggleBtn = null;
    screenshotWidgetBtn = null;
    scrollToTopBtn = null;
    scrollToBottomBtn = null;
}

function flash(btn, cls) {
    btn.classList.add(cls);
    setTimeout(() => btn.classList.remove(cls), 1500);
}

function applyScrollButtonsVisibility() {
    if (scrollToTopBtn) scrollToTopBtn.style.display = scrollButtonsEnabled ? "" : "none";
    if (scrollToBottomBtn) scrollToBottomBtn.style.display = scrollButtonsEnabled ? "" : "none";
    applyMinimizeButtonVisibility();
}

function applyMinimizeButtonVisibility() {
    if (!toggleBtn) return;
    toggleBtn.style.display = (scrollButtonsEnabled || screenshotEnabled) ? "" : "none";
}

function pageHasScroll() {
    return document.documentElement.scrollHeight > window.innerHeight;
}

function updateWidgetVisibility() {
    if (!widget) return;
    widget.style.display = pageHasScroll() ? "flex" : "none";
}