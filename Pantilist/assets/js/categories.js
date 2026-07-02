import { state } from "./state.js";
import { saveLists } from "./storage.js";
import { 
    renderCategoryTabs, 
    renderCategoryEditor, 
    renderList, 
    renderFavoritesMain, 
    renderFavoritesEditor 
} from "./ui.js";

//
// ZUFALLS-PASTELLFARBE (HEX)
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
// NEUE KATEGORIE HINZUFÜGEN
//
export function saveNewCategory() {
    const input = document.getElementById("catInput");
    const text = input.value.trim().toLowerCase();
    if (!text) return;

    const list = state.lists[state.activeList];

    if (list.categories.includes(text)) {
        alert("Kategorie existiert bereits.");
        return;
    }

    // Kategorie hinzufügen
    list.categories.push(text);

    // Favoriten anlegen
    if (!list.favorites) list.favorites = {};
    if (!Array.isArray(list.favorites[text])) list.favorites[text] = [];

    // Kategorie-Meta anlegen
    if (!list.categoryMeta) list.categoryMeta = {};
    list.categoryMeta[text] = {
        color: randomPastelColor(),
        emoji: "📦"
    };

    // Neue Kategorie aktivieren
    state.activeCategory = text;

    saveLists();

    input.value = "";

    renderCategoryTabs();
    renderCategoryEditor();
    renderFavoritesMain();
    renderFavoritesEditor();
    renderList();
}

//
// KATEGORIE LÖSCHEN
//
export function deleteCategory(cat) {
    const list = state.lists[state.activeList];

    if (!list.categories.includes(cat)) return;

    // Fallback-Kategorie bestimmen
    const fallback = list.categories[0] === cat
        ? list.categories[1]
        : list.categories[0];

    // Items: Kategorie umschreiben (GLOBAL)
    if (Array.isArray(list.items)) {
        list.items.forEach(item => {
            if (item.category === cat) {
                item.category = fallback;
            }
        });
    }

    // Favoriten verschieben
    if (!list.favorites) list.favorites = {};
    if (!Array.isArray(list.favorites[fallback])) list.favorites[fallback] = [];
    if (Array.isArray(list.favorites[cat])) {
        list.favorites[fallback].push(...list.favorites[cat]);
        delete list.favorites[cat];
    }

    // Kategorie-Meta löschen
    if (list.categoryMeta) {
        delete list.categoryMeta[cat];
    }

    // Kategorie entfernen
    list.categories = list.categories.filter(c => c !== cat);

    // Aktive Kategorie reparieren
    if (state.activeCategory === cat) {
        state.activeCategory = fallback;
    }

    saveLists();

    renderCategoryTabs();
    renderCategoryEditor();
    renderFavoritesMain();
    renderFavoritesEditor();
    renderList();
}

//
// Default-Kategorie? (nicht mehr relevant)
//
export function isDefaultCategory(cat) {
    return false;
}
