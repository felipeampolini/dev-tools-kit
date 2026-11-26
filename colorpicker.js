// ======================
// COLOR PICKER — conta-gotas na página
// ======================
// Fluxo: popup envia "startColorPick" -> capturamos a aba visível (background.js)
// -> overlay com lupa segue o cursor -> clique copia o HEX e salva no histórico.

(() => {
    const HISTORY_MAX = 16;
    const LOUPE_SIZE = 120; // px na tela
    const LOUPE_PIXELS = 15; // pixels da captura mostrados na lupa (ímpar)

    let picking = false;
    let overlay, loupe, loupeCtx, label, srcCtx, scale;
    let lastHex = null;

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action !== "startColorPick") return;
        startPicking()
            .then(() => sendResponse({ ok: true }))
            .catch((e) => sendResponse({ error: e.message || String(e) }));
        return true;
    });

    async function startPicking() {
        if (picking) return;

        const { dataUrl, error } = await chrome.runtime.sendMessage({ action: "captureScreenshot" });
        if (error) throw new Error(error);

        const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        srcCtx = canvas.getContext("2d", { willReadFrequently: true });
        srcCtx.drawImage(bitmap, 0, 0);
        scale = bitmap.width / window.innerWidth;

        buildOverlay();
        picking = true;
    }

    function buildOverlay() {
        overlay = document.createElement("div");
        overlay.id = "dtkColorOverlay";

        loupe = document.createElement("canvas");
        loupe.id = "dtkColorLoupe";
        loupe.width = LOUPE_SIZE;
        loupe.height = LOUPE_SIZE;
        loupeCtx = loupe.getContext("2d");
        loupeCtx.imageSmoothingEnabled = false;

        label = document.createElement("div");
        label.id = "dtkColorLabel";

        const hint = document.createElement("div");
        hint.id = "dtkColorHint";
        hint.textContent = "click to pick · esc to cancel";

        overlay.append(loupe, label, hint);
        document.documentElement.appendChild(overlay);

        overlay.addEventListener("mousemove", onMove);
        overlay.addEventListener("click", onClick);
        overlay.addEventListener("contextmenu", onCancel);
        overlay.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
        window.addEventListener("keydown", onKey, true);
        window.addEventListener("resize", stopPicking);
    }

    function stopPicking() {
        picking = false;
        lastHex = null;
        if (overlay) overlay.remove();
        overlay = loupe = loupeCtx = label = srcCtx = null;
        window.removeEventListener("keydown", onKey, true);
        window.removeEventListener("resize", stopPicking);
    }

    function pixelAt(clientX, clientY) {
        const x = Math.min(Math.floor(clientX * scale), srcCtx.canvas.width - 1);
        const y = Math.min(Math.floor(clientY * scale), srcCtx.canvas.height - 1);
        const [r, g, b] = srcCtx.getImageData(x, y, 1, 1).data;
        return { x, y, hex: toHex(r, g, b) };
    }

    function onMove(e) {
        const { x, y, hex } = pixelAt(e.clientX, e.clientY);
        lastHex = hex;

        // lupa ampliada ao redor do pixel
        const half = Math.floor(LOUPE_PIXELS / 2);
        const cell = LOUPE_SIZE / LOUPE_PIXELS;
        loupeCtx.fillStyle = "#1e1e1e";
        loupeCtx.fillRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);
        loupeCtx.drawImage(srcCtx.canvas, x - half, y - half, LOUPE_PIXELS, LOUPE_PIXELS, 0, 0, LOUPE_SIZE, LOUPE_SIZE);
        loupeCtx.strokeStyle = "#ffffff";
        loupeCtx.lineWidth = 1;
        loupeCtx.strokeRect(half * cell + 0.5, half * cell + 0.5, cell - 1, cell - 1);
        loupeCtx.strokeStyle = "#000000";
        loupeCtx.strokeRect(half * cell - 0.5, half * cell - 0.5, cell + 1, cell + 1);

        label.textContent = hex;
        label.style.setProperty("--dtk-swatch", hex);

        // posiciona perto do cursor, invertendo nas bordas
        const offset = 20;
        const boxH = LOUPE_SIZE + 30;
        let left = e.clientX + offset;
        let top = e.clientY + offset;
        if (left + LOUPE_SIZE > window.innerWidth) left = e.clientX - offset - LOUPE_SIZE;
        if (top + boxH > window.innerHeight) top = e.clientY - offset - boxH;
        loupe.style.transform = `translate(${left}px, ${top}px)`;
        label.style.transform = `translate(${left}px, ${top + LOUPE_SIZE + 6}px)`;
        loupe.style.display = label.style.display = "block";
    }

    function onClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const hex = lastHex || pixelAt(e.clientX, e.clientY).hex;
        const { clientX: x, clientY: y } = e;
        stopPicking();
        saveColor(hex);

        copyText(hex).then((ok) => {
            if (ok) {
                burst(x, y, hex);
                floatCopied(x, y);
            }
            showToast(hex, ok);
        });
    }

    function onCancel(e) {
        e.preventDefault();
        stopPicking();
    }

    function onKey(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            stopPicking();
        }
    }

    function toHex(r, g, b) {
        return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fallback para páginas sem clipboard API (ex.: http)
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.cssText = "position:fixed;opacity:0;";
            document.documentElement.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        }
    }

    function saveColor(hex) {
        chrome.storage.local.get(["colorHistory"], ({ colorHistory = [] }) => {
            const history = [hex, ...colorHistory.filter((c) => c !== hex)].slice(0, HISTORY_MAX);
            chrome.storage.local.set({ colorHistory: history, currentColor: hex });
        });
    }

    function showToast(hex, ok = true) {
        document.getElementById("dtkColorToast")?.remove();
        const toast = document.createElement("div");
        toast.id = "dtkColorToast";
        toast.classList.toggle("error", !ok);
        toast.style.setProperty("--dtk-swatch", hex);
        toast.textContent = ok ? `${hex} copied` : `${hex} — copy failed`;
        document.documentElement.appendChild(toast);
        setTimeout(() => toast.remove(), 1800);
    }

    // ======================
    // EFEITO DE PARTÍCULAS (feedback de "copiado")
    // ======================

    const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function hexToRgb(hex) {
        const n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    // mistura com branco (amount > 0) ou preto (amount < 0)
    function shade(hex, amount) {
        const target = amount > 0 ? 255 : 0;
        const a = Math.abs(amount);
        return toHex(...hexToRgb(hex).map((v) => Math.round(v + (target - v) * a)));
    }

    function isLight(hex) {
        const [r, g, b] = hexToRgb(hex);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
    }

    function burst(x, y, hex) {
        if (reducedMotion()) return;

        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const canvas = document.createElement("canvas");
        canvas.id = "dtkColorBurst";
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        document.documentElement.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);

        // contorno contrastante para a partícula aparecer em qualquer fundo
        const outline = isLight(hex) ? "rgba(0, 0, 0, 0.55)" : "rgba(255, 255, 255, 0.75)";
        const palette = [hex, hex, hex, shade(hex, 0.4), shade(hex, -0.35), "#ffffff"];

        const particles = Array.from({ length: 40 }, () => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5.5;
            return {
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 3 + Math.random() * 4,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.4,
                color: palette[Math.floor(Math.random() * palette.length)],
                circle: Math.random() < 0.5,
                life: 1,
                decay: 0.014 + Math.random() * 0.012,
            };
        });

        const ring = { r: 6, alpha: 1 };
        let last = performance.now();

        function frame(now) {
            const dt = Math.min((now - last) / 16.67, 3); // normaliza p/ ~60fps
            last = now;
            ctx.clearRect(0, 0, w, h);
            let alive = false;

            // anel de "pulso" saindo do ponto clicado
            if (ring.alpha > 0) {
                alive = true;
                ring.r += 3.2 * dt;
                ring.alpha -= 0.045 * dt;
                ctx.globalAlpha = Math.max(ring.alpha, 0);
                ctx.lineWidth = 3;
                ctx.strokeStyle = hex;
                ctx.beginPath();
                ctx.arc(x, y, ring.r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.lineWidth = 1;
                ctx.strokeStyle = outline;
                ctx.beginPath();
                ctx.arc(x, y, ring.r + 2, 0, Math.PI * 2);
                ctx.stroke();
            }

            for (const p of particles) {
                if (p.life <= 0) continue;
                alive = true;

                p.vx *= Math.pow(0.97, dt);
                p.vy = p.vy * Math.pow(0.97, dt) + 0.22 * dt; // gravidade
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.rot += p.vr * dt;
                p.life -= p.decay * dt;

                ctx.globalAlpha = Math.max(p.life, 0);
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.strokeStyle = outline;
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (p.circle) ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                else ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            if (alive) requestAnimationFrame(frame);
            else canvas.remove();
        }

        requestAnimationFrame(frame);
    }

    function floatCopied(x, y) {
        if (reducedMotion()) return;
        const el = document.createElement("div");
        el.className = "dtk-color-copied";
        el.textContent = "✓ copied";
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.documentElement.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
    }
})();
