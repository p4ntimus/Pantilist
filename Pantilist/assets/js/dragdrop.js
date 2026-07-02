import { state } from "./state.js";
import { saveLists } from "./storage.js";
import { renderCategoryEditor, renderFavoritesEditor } from "./ui.js";

//
// DRAG & DROP – KATEGORIEN (innerhalb der aktiven Liste)
//
let dragCatIndex = null;

export function onCatDragStart(e) {
    dragCatIndex = Number(e.currentTarget.dataset.index);
    e.dataTransfer.effectAllowed = "move";
}

export function onCatDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

export function onCatDrop(e) {
    e.preventDefault();
    const targetIndex = Number(e.currentTarget.dataset.index);

    if (dragCatIndex === null) return;
    if (dragCatIndex === targetIndex) {
        dragCatIndex = null;
        return;
    }

    const list = state.lists[state.activeList];
    const cats = list.categories;

    // Kategorie verschieben
    const movedCat = cats.splice(dragCatIndex, 1)[0];
    cats.splice(targetIndex, 0, movedCat);

    // ⭐ categoryMeta mit verschieben (stabil & migrationssicher)
    if (list.categoryMeta) {
        const metaEntries = Object.entries(list.categoryMeta);

        const ordered = cats.map(cat => {
            const found = metaEntries.find(([key]) => key === cat);
            return [
                cat,
                found
                    ? found[1]
                    : { color: "#ffd966", emoji: "📦" } // Fallback
            ];
        });

        list.categoryMeta = Object.fromEntries(ordered);
    }

    dragCatIndex = null;

    saveLists();
    renderCategoryEditor();
}

//
// DRAG & DROP – FAVORITEN (innerhalb der aktiven Kategorie)
//
let dragFavIndex = null;

export function onFavDragStart(e) {
    dragFavIndex = Number(e.currentTarget.dataset.index);
    e.dataTransfer.effectAllowed = "move";
}

export function onFavDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

export function onFavDrop(e) {
    e.preventDefault();
    const targetIndex = Number(e.currentTarget.dataset.index);

    if (dragFavIndex === null) return;
    if (dragFavIndex === targetIndex) {
        dragFavIndex = null;
        return;
    }

    const list = state.lists[state.activeList];
    const favs = list.favorites[state.activeCategory] || [];

    const moved = favs.splice(dragFavIndex, 1)[0];
    favs.splice(targetIndex, 0, moved);

    dragFavIndex = null;

    saveLists();
    renderFavoritesEditor();
}
