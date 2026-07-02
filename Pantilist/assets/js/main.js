import { loadData, saveLists } from "./storage.js";
import { state } from "./state.js";

import { renderUI, renderListSelector } from "./ui.js";
import { addItem, clearDone, filterList } from "./list.js";
import { saveNewFavorite } from "./favorites.js";
import { saveNewCategory } from "./categories.js";
import { 
    openSettings, closeSettings, applySavedSettings,
    changeTheme, changeSize
} from "./settings.js";

//
// Zufalls‑Pastellfarbe (HEX)
//
function randomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 80;
    const lightness = 85;

    const a = saturation * Math.min(lightness, 100 - lightness) / 10000;
    const f = n => {
        const k = (n + hue / 30) % 12;
        const color = lightness/100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
    };

    const r = f(0);
    const g = f(8);
    const b = f(4);

    return "#" + [r, g, b]
        .map(x => x.toString(16).padStart(2, "0"))
        .join("");
}

//
// START
//
window.addEventListener("DOMContentLoaded", () => {

    //
    // 1. Daten laden + Migration
    //
    loadData();

    //
    // 2. UI aufbauen
    //
    renderUI();

    //
    // 3. gespeicherte Settings anwenden
    //
    applySavedSettings();

    //
    // 4. Events verbinden
    //

    // --- LISTEN AUSWAHL ---
    const listSelect = document.getElementById("listSelect");
    const addListBtn = document.getElementById("addListBtn");

    if (listSelect) {
        listSelect.onchange = e => {
            const id = e.target.value;

            if (!state.lists[id]) return;

            state.activeList = id;

            const list = state.lists[id];
            state.activeCategory = list.categories[0];

            saveLists();
            renderUI();
        };
    }

    if (addListBtn) {
        addListBtn.onclick = () => {
            const name = prompt("Name der neuen Liste?");
            if (!name) return;

            const id = name.toLowerCase().replace(/\s+/g, "_");

            state.lists[id] = {
                name,
                categories: ["allgemein"],
                items: [], // ⭐ GLOBAL
                favorites: { allgemein: [] },
                categoryMeta: {
                    allgemein: {
                        color: randomPastelColor(),
                        emoji: "📦"
                    }
                }
            };

            state.activeList = id;
            state.activeCategory = "allgemein";

            saveLists();
            renderUI();
        };
    }

    // --- Settings Button ---
    const settingsBtn   = document.querySelector(".settings-btn");
    const closeBtn      = document.querySelector(".close-btn");

    if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
    if (closeBtn)    closeBtn.addEventListener("click", closeSettings);
    // Backdrop click should also close settings
    const settingsBackdrop = document.getElementById("settingsBackdrop");
    if (settingsBackdrop) settingsBackdrop.addEventListener("click", closeSettings);

    // --- Items ---
    const itemInput = document.getElementById("itemInput");
    itemInput.addEventListener("keydown", e => {
        if (e.key === "Enter") addItem();
    });

    
    // --- Favoriten ---
    const addBtn = document.querySelector(".add-btn");
    if (addBtn) addBtn.onclick = addItem;
    const favInput = document.getElementById("favInput");
    const favCategorySelect = document.getElementById("favCategorySelect");

    favInput.addEventListener("keydown", e => {
        if (e.key === "Enter") saveNewFavorite(favCategorySelect.value);
    });

    document.getElementById("favAddBtn").onclick = () => {
        saveNewFavorite(favCategorySelect.value);
    };

    // --- Kategorien ---
    const catInput = document.getElementById("catInput");
    catInput.addEventListener("keydown", e => {
        if (e.key === "Enter") saveNewCategory();
    });

    document.getElementById("catAddBtn").onclick = saveNewCategory;

    // --- Suche ---
    document.getElementById("searchInput").addEventListener("input", filterList);

    // --- Settings ---
    document.getElementById("themeSelect").addEventListener("change", changeTheme);
    document.getElementById("sizeSelect").addEventListener("change", changeSize);

    // --- Liste ---
    document.querySelector(".clear-done").onclick = clearDone;
});
