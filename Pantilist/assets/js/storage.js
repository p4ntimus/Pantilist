import { state } from "./state.js";

const STORAGE_KEY = "pantilist_lists_v2";
const THEME_KEY = "shoppingTheme";
const SIZE_KEY = "shoppingSize";

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
// MIGRATION – ALTE DATEN REPARIEREN
//
function migrateData() {
    Object.values(state.lists).forEach(list => {

        // Kategorien sicherstellen
        if (!Array.isArray(list.categories)) list.categories = [];

        // categoryMeta sicherstellen
        if (!list.categoryMeta) list.categoryMeta = {};

        list.categories.forEach(cat => {

            // Meta anlegen falls fehlt
            if (!list.categoryMeta[cat]) {
                list.categoryMeta[cat] = {
                    color: randomPastelColor(),
                    emoji: "📦"
                };
            }

            // HSL → HEX reparieren
            const col = list.categoryMeta[cat].color;
            if (col && col.startsWith("hsl")) {
                list.categoryMeta[cat].color = randomPastelColor();
            }
        });

        // Items reparieren (altes Format: pro Kategorie)
        if (!list.items) list.items = {};
        list.categories.forEach(cat => {
            if (!Array.isArray(list.items[cat])) list.items[cat] = [];

            list.items[cat] = list.items[cat]
                .filter(i => i)
                .map(i => {
                    if (typeof i === "string") {
                        return { text: i, count: 1, done: false, unit: "Stück" };
                    }
                    if (!i.text) i.text = "Unbenannt";
                    if (!i.count) i.count = 1;
                    if (typeof i.done !== "boolean") i.done = false;
                    if (!i.unit) i.unit = "Stück";
                    return i;
                });
        });

        // Favoriten reparieren
        if (!list.favorites) list.favorites = {};
        list.categories.forEach(cat => {
            if (!Array.isArray(list.favorites[cat])) list.favorites[cat] = [];

            list.favorites[cat] = list.favorites[cat]
                .filter(f => f)
                .map(f => {
                    if (typeof f === "string") {
                        return { text: f, category: cat };
                    }
                    if (!f.text) f.text = "Unbenannt";
                    if (!f.category) f.category = cat;
                    return f;
                });
        });
    });
}

//
// MIGRATION 2 – ITEMS GLOBAL MACHEN
//
function migrateToGlobalItems() {
    Object.values(state.lists).forEach(list => {
        // Wenn items bereits ein Array ist → nichts tun
        if (Array.isArray(list.items)) return;

        const globalItems = [];

        // Altes Format: items = { cat: [ ... ] }
        Object.entries(list.items || {}).forEach(([cat, arr]) => {
            if (!Array.isArray(arr)) return;

            arr.forEach(i => {
                globalItems.push({
                    text: i.text || "Unbenannt",
                    count: i.count || 1,
                    done: typeof i.done === "boolean" ? i.done : false,
                    category: cat,
                    unit: i.unit || "Stück"
                });
            });
        });

        list.items = globalItems;
    });
}

//
// ⭐ MIGRATION 3 – ALLE ITEMS MIT FEHLENDER KATEGORIE REPARIEREN
//
function fixMissingCategories() {
    Object.values(state.lists).forEach(list => {
        const fallbackCat = list.categories?.[0] || "sonstiges";

        list.items = (list.items || []).map(i => ({
            ...i,
            category: i.category || fallbackCat,
            unit: i.unit || "Stück"
        }));
    });
}

//
// DATEN LADEN
//
export function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            console.warn("Keine Daten gefunden → Standardwerte setzen.");
            initializeDefaults();
            saveLists();
            return;
        }

        const data = JSON.parse(raw);

        if (data.lists && typeof data.lists === "object") {
            state.lists = data.lists;
            migrateData();           // alte Struktur reparieren
            migrateToGlobalItems();  // globale Items herstellen
            fixMissingCategories();  // ⭐ fehlende Kategorien reparieren
        }

        // aktive Liste
        if (data.activeList && state.lists[data.activeList]) {
            state.activeList = data.activeList;
        } else {
            state.activeList = Object.keys(state.lists)[0];
        }

        // aktive Kategorie
        const list = state.lists[state.activeList];
        if (data.activeCategory && list.categories.includes(data.activeCategory)) {
            state.activeCategory = data.activeCategory;
        } else {
            state.activeCategory = list.categories[0];
        }

    } catch (err) {
        console.error("Fehler beim Laden → Standardwerte setzen.", err);
        initializeDefaults();
        saveLists();
    }

    // Geladene UI‑Settings (Theme / Size) aus localStorage wiederherstellen
    try {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            state.theme = savedTheme;
        }
        const savedSize = localStorage.getItem(SIZE_KEY);
        if (savedSize) {
            state.size = savedSize;
        }
    } catch (e) {
        console.warn('Konnte Theme/Size aus localStorage nicht lesen', e);
    }
}

//
// STANDARDWERTE
//
function initializeDefaults() {
    state.lists = {
        default: {
            name: "Standardliste",
            categories: ["haushalt", "essen", "trinken", "drogerie", "sonstiges"],
            items: [], // ⭐ GLOBAL
            favorites: {
                haushalt: [],
                essen: [],
                trinken: [],
                drogerie: [],
                sonstiges: []
            },
            categoryMeta: {
                haushalt:  { color: randomPastelColor(), emoji: "🧽" },
                essen:     { color: randomPastelColor(), emoji: "🍎" },
                trinken:   { color: randomPastelColor(), emoji: "🥤" },
                drogerie:  { color: randomPastelColor(), emoji: "🧴" },
                sonstiges: { color: randomPastelColor(), emoji: "📦" }
            }
        }
    };

    state.activeList = "default";
    state.activeCategory = "haushalt";
}

//
// SPEICHERN
//
export function saveLists() {
    const data = {
        lists: state.lists,
        activeList: state.activeList,
        activeCategory: state.activeCategory
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

//
// THEME & SIZE BLEIBEN SEPARAT
//
export function saveTheme() {
    localStorage.setItem(THEME_KEY, state.theme);
}

export function saveSize() {
    localStorage.setItem(SIZE_KEY, state.size);
}
