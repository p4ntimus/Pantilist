import { state } from "./state.js";
import { saveTheme, saveSize } from "./storage.js";

//
// SETTINGS PANEL
//
export function openSettings() {
    const panel = document.getElementById("settingsPanel");
    const backdrop = document.getElementById("settingsBackdrop");
    if (panel) panel.classList.add("show");
    if (backdrop) backdrop.classList.add("show");
    document.body.classList.add("no-scroll");
    document.documentElement.classList.add("no-scroll");
    // Fallback: set inline styles to force-disable scroll
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
}

export function closeSettings() {
    const panel = document.getElementById("settingsPanel");
    const backdrop = document.getElementById("settingsBackdrop");
    if (panel) panel.classList.remove("show");
    if (backdrop) backdrop.classList.remove("show");
    document.body.classList.remove("no-scroll");
    document.documentElement.classList.remove("no-scroll");
    // Remove inline fallback
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
}

//
// THEME WECHSELN
//
export function changeTheme() {
    const select = document.getElementById("themeSelect");
    if (!select) return;

    const theme = select.value;
    state.theme = theme;

    // Alle Themes deaktivieren
    const themes = ["default", "forest", "diablo", "blackfantasy", "unicorn", "coreblue"];
    themes.forEach(t => {
        const link = document.getElementById("theme-" + t);
        if (link) link.disabled = true;
    });

    // Gewähltes Theme aktivieren
    const active = document.getElementById("theme-" + theme);
    if (active) active.disabled = false;

    // PWA Farbe setzen
    const meta = document.getElementById("theme-color-meta");
    if (meta) {
        meta.setAttribute("content", PWA_COLORS[theme] || "#000000");
    }

    saveTheme();
}

//
// LAYOUT-GRÖSSE
//
export function changeSize() {
    const select = document.getElementById("sizeSelect");
    if (!select) return;

    const size = select.value;
    state.size = size;

    // Alte Größe entfernen
    document.body.className = document.body.className
        .replace(/size-\w+/g, "")
        .trim();

    // Neue Größe setzen
    document.body.classList.add(`size-${size}`);

    saveSize();
}

//
// INITIALISIERUNG
//
export function applySavedSettings() {
    const themeSelect = document.getElementById("themeSelect");
    const sizeSelect = document.getElementById("sizeSelect");

    if (themeSelect) themeSelect.value = state.theme;
    if (sizeSelect) sizeSelect.value = state.size;

    // Theme aktivieren
    changeTheme();

    // Größe anwenden
    changeSize();
}

//
// PWA Farben
//
const PWA_COLORS = {
    default: "#ff8ac2",
    forest: "#4caf50",
    diablo: "#dba0ff",
    blackfantasy: "#9b59b6",
    unicorn: "#ff8ac2",
    coreblue: "#3b82f6"
};
