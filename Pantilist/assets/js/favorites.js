import { state } from "./state.js";
import { saveLists } from "./storage.js";
import { renderFavoritesMain, renderFavoritesEditor } from "./ui.js";
import { addItem } from "./list.js";

//
// FAVORIT HINZUFÜGEN
//
export function saveNewFavorite(categoryOverride = null) {
    const input = document.getElementById("favInput");
    const text = input.value.trim();
    if (!text) return;

    const list = state.lists[state.activeList];
    const cat = categoryOverride || state.activeCategory;

    if (!list.favorites[cat]) list.favorites[cat] = [];

    // Prüfen, ob Favorit existiert
    const exists = list.favorites[cat].some(
        f => (f.text || "").toLowerCase() === text.toLowerCase()
    );

    if (exists) {
        alert("Favorit existiert bereits.");
        return;
    }

    // Favorit speichern
    list.favorites[cat].push({
        text,
        category: cat
    });

    saveLists();

    input.value = "";

    renderFavoritesMain();
    renderFavoritesEditor();
}

//
// FAVORIT LÖSCHEN
//
export function deleteFavorite(index) {
    const list = state.lists[state.activeList];
    const cat = state.activeCategory;

    if (!list.favorites[cat]) return;

    list.favorites[cat].splice(index, 1);

    saveLists();
    renderFavoritesMain();
    renderFavoritesEditor();
}

//
// FAVORIT DIREKT IN DIE LISTE ÜBERNEHMEN
//
export function addFavoriteToInput(fav) {
    if (!fav || !fav.text) return;

    // ⭐ Kategorie setzen, damit das Item farbig wird
    state.activeCategory = fav.category;

    // ⭐ Jetzt Item mit richtiger Kategorie hinzufügen
    addItem(fav.text);
}
