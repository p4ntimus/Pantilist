import { state } from "./state.js";
import { saveLists } from "./storage.js";
import { renderList } from "./ui.js";

//
// ITEM HINZUFÜGEN (mit Stacking, GLOBAL)
//
export function addItem(textOverride = null) {
    const input = document.getElementById("itemInput");
    const rawText = typeof textOverride === "string"
        ? textOverride
        : (textOverride && typeof textOverride === "object" && "target" in textOverride ? input?.value : textOverride);

    const text = String(rawText ?? input?.value ?? "").trim();
    if (!text) return;

    const list = state.lists[state.activeList];
    const cat = state.activeCategory;

    if (!Array.isArray(list.items)) list.items = [];

    // Stacking: gleiche Items in derselben Kategorie zusammenfassen
    const existing = list.items.find(
        i => i.category === cat && i.text.toLowerCase() === text.toLowerCase()
    );

    if (existing) {
        existing.count = (existing.count || 1) + 1;
        // Kategorie NICHT ändern – bleibt wie erstes Auftreten
    } else {
        list.items.push({
            text,
            done: false,
            count: 1,
            category: cat,
            unit: "Stück"
        });
    }

    sortCurrentList();
    saveLists();
    renderList();

    if (!textOverride) input.value = "";
}

//
// EINTRÄGE LÖSCHEN (DONE, GLOBAL)
//
export function clearDone() {
    const list = state.lists[state.activeList];
    const items = list.items || [];

    const doneCount = items.filter(i => i.done).length;
    if (doneCount === 0) return;

    if (doneCount > 3) {
        const ok = confirm(`Es sind ${doneCount} erledigte Einträge. Wirklich löschen?`);
        if (!ok) return;
    }

    list.items = items.filter(i => !i.done);

    saveLists();
    renderList();
}

//
// SUCHE (bleibt gleich)
//
export function filterList() {
    const input = document.getElementById("searchInput");
    const list = document.getElementById("list");
    if (!input || !list) return;

    const query = input.value.toLowerCase();

    list.querySelectorAll("li").forEach(li => {
        const text = li.textContent.toLowerCase();
        li.style.display = text.includes(query) ? "" : "none";
    });

    list.querySelectorAll(".ad-inline").forEach(ad => {
        ad.style.display = query ? "none" : "";
    });
}

//
// SORTIEREN (offen oben, erledigt unten, GLOBAL)
//
export function sortCurrentList() {
    const list = state.lists[state.activeList];
    const items = list.items || [];

    const open = items.filter(i => !i.done);
    const done = items.filter(i => i.done);

    open.sort((a, b) => a.text.localeCompare(b.text));
    done.sort((a, b) => a.text.localeCompare(b.text));

    list.items = [...open, ...done];
}

//
// FAVORITEN DIREKT HINZUFÜGEN
//
export function addItemDirect(text) {
    addItem(text);
}
