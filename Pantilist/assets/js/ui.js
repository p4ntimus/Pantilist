import { state } from "./state.js";
import { saveLists } from "./storage.js";
import { saveNewCategory, deleteCategory } from "./categories.js";
import { saveNewFavorite, deleteFavorite, addFavoriteToInput } from "./favorites.js";
import { 
    onCatDragStart, onCatDragOver, onCatDrop,
    onFavDragStart, onFavDragOver, onFavDrop
} from "./dragdrop.js";
import { onSwipeStart, onSwipeMove, onSwipeEnd } from "./swipe.js";

//
// DOM ELEMENTE CACHEN
//
const els = {
    list: null,
    categoryTabs: null,
    itemInput: null,
    searchInput: null,
    favoritesMain: null,
    favoritesEditor: null,
    categoryEditor: null,
    settingsPanel: null,
    listSelect: null,
    itemActionBackdrop: null,
    itemActionPanel: null,
    itemActionTitle: null,
    itemActionCount: null,
    itemActionUnit: null,
    itemActionList: null,
    itemActionClose: null,
    itemActionMoveBtn: null
};

let activeItemAction = null;

function cacheEls() {
    els.list = document.getElementById("list");
    els.categoryTabs = document.getElementById("categoryTabs");
    els.itemInput = document.getElementById("itemInput");
    els.searchInput = document.getElementById("searchInput");
    els.favoritesMain = document.getElementById("favoritesMain");
    els.favoritesEditor = document.getElementById("favoritesEditor");
    els.categoryEditor = document.getElementById("categoryEditor");
    els.settingsPanel = document.getElementById("settingsPanel");
    els.listSelect = document.getElementById("listSelect");
    els.itemActionBackdrop = document.getElementById("itemActionBackdrop");
    els.itemActionPanel = document.getElementById("itemActionPanel");
    els.itemActionTitle = document.getElementById("itemActionTitle");
    els.itemActionCount = document.getElementById("itemActionCount");
    els.itemActionUnit = document.getElementById("itemActionUnit");
    els.itemActionList = document.getElementById("itemActionList");
    els.itemActionClose = document.getElementById("itemActionClose");
    els.itemActionMoveBtn = document.getElementById("itemActionMoveBtn");
    setupItemActionPanel();
}

function setupItemActionPanel() {
    if (!els.itemActionBackdrop || !els.itemActionPanel || els.itemActionBackdrop.dataset.bound === "true") return;

    els.itemActionBackdrop.addEventListener("click", closeItemActionPanel);
    els.itemActionClose?.addEventListener("click", closeItemActionPanel);

    els.itemActionPanel.querySelectorAll("[data-step]").forEach(btn => {
        btn.addEventListener("click", () => changeActiveItemCount(btn.dataset.step === "plus" ? 1 : -1));
    });

    els.itemActionUnit?.addEventListener("change", () => {
        if (!activeItemAction) return;
        activeItemAction.item.unit = els.itemActionUnit.value;
        saveLists();
        renderList();
    });

    els.itemActionMoveBtn?.addEventListener("click", moveActiveItemToList);

    els.itemActionBackdrop.dataset.bound = "true";
}

function renderItemActionPanel() {
    if (!activeItemAction || !els.itemActionPanel) return;

    const { item } = activeItemAction;
    const unit = item.unit || "Stück";

    els.itemActionTitle.textContent = item.text;
    els.itemActionCount.textContent = item.count || 1;

    if (els.itemActionUnit) {
        const units = ["Stück", "kg", "g", "l", "ml", "Packung", "Flasche", "Dose", "Bund", "Kasten", "Beutel"];
        els.itemActionUnit.innerHTML = units
            .map(u => `<option value="${u}" ${u === unit ? "selected" : ""}>${u}</option>`)
            .join("");
    }

    if (els.itemActionList) {
        els.itemActionList.innerHTML = Object.entries(state.lists)
            .map(([id, list]) => `<option value="${id}" ${id === state.activeList ? "selected" : ""}>${list.name}</option>`)
            .join("");
    }

    els.itemActionPanel.classList.add("show");
    els.itemActionBackdrop.classList.add("show");
    els.itemActionBackdrop.hidden = false;
    els.itemActionPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("panel-open");
}

function closeItemActionPanel() {
    if (!els.itemActionPanel || !els.itemActionBackdrop) return;

    activeItemAction = null;
    els.itemActionPanel.classList.remove("show");
    els.itemActionBackdrop.classList.remove("show");
    els.itemActionBackdrop.hidden = true;
    els.itemActionPanel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("panel-open");
}

function changeActiveItemCount(delta) {
    if (!activeItemAction) return;

    const item = activeItemAction.item;
    item.count = Math.max(1, (item.count || 1) + delta);
    saveLists();
    renderList();
    if (els.itemActionCount) els.itemActionCount.textContent = item.count || 1;
}

function moveActiveItemToList() {
    if (!activeItemAction || !els.itemActionList) return;

    const targetId = els.itemActionList.value;
    if (!targetId || !state.lists[targetId]) return;

    const currentList = state.lists[state.activeList];
    const targetList = state.lists[targetId];
    const item = activeItemAction.item;

    if (!Array.isArray(currentList.items)) currentList.items = [];
    if (!Array.isArray(targetList.items)) targetList.items = [];

    const currentIndex = currentList.items.indexOf(item);
    if (currentIndex > -1) currentList.items.splice(currentIndex, 1);

    const targetCategory = targetList.categories?.includes(item.category)
        ? item.category
        : (targetList.categories?.[0] || "allgemein");

    const movedItem = {
        ...item,
        category: targetCategory,
        unit: item.unit || "Stück"
    };

    targetList.items.push(movedItem);
    state.activeList = targetId;
    state.activeCategory = targetCategory;
    saveLists();
    renderUI();
    closeItemActionPanel();
}

function openItemActionPanel(item, index) {
    activeItemAction = { item, index };
    renderItemActionPanel();
}

//
// UI INITIALISIEREN
//
export function renderUI() {
    cacheEls();
    renderListSelector();
    renderCategoryTabs();
    renderFavoritesMain();
    renderFavoritesEditor();
    renderCategoryEditor();
    renderList();
}

//
// LISTEN SELECTOR
//
export function renderListSelector() {
    if (!els.listSelect) return;

    els.listSelect.innerHTML = Object.entries(state.lists)
        .map(([id, list]) => `
            <option value="${id}" ${id === state.activeList ? "selected" : ""}>
                ${list.name}
            </option>
        `)
        .join("");
}

//
// KATEGORIEN ALS TABS
//
export function renderCategoryTabs() {
    const container = els.categoryTabs;
    if (!container) return;

    const list = state.lists[state.activeList];
    const categories = list.categories;
    const meta = list.categoryMeta || {};

    container.innerHTML = "";

    categories.forEach(cat => {
        const btn = document.createElement("button");

        const m = meta[cat] || {};
        const emoji = m.emoji || "";
        const color = m.color || "#ffd966";

        btn.innerHTML = emoji ? `${emoji} ${capitalize(cat)}` : capitalize(cat);

        btn.style.backgroundColor = color;

        if (cat === state.activeCategory) {
            btn.classList.add("active");
            btn.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.15)";
        }

        btn.addEventListener("click", () => {
            state.activeCategory = cat;
            saveLists();
            renderUI();
        });

        container.appendChild(btn);
    });
}

//
// LISTE – GLOBAL
//
export function renderList() {
    const listEl = els.list;
    if (!listEl) return;

    const list = state.lists[state.activeList];
    const items = list.items || [];
    const metaAll = list.categoryMeta || {};

    const html = items
        .map((item, index) => {
            const text = item.count > 1 
                ? `${item.text} (${item.count}×)` 
                : item.text;

            const doneClass = item.done ? "done" : "";

            const meta = metaAll[item.category] || {};
            const color = meta.color || "#ffd966";
            const emoji = meta.emoji || "";
            const style = `style="border-left: 10px solid ${color}; --item-bg: ${color}ee; background: ${color}ee;"`;
            


            const unit = item.unit || "Stück";
            const unitSuffix = unit && unit !== "Stück" ? ` · ${unit}` : "";
            const displayText = item.count > 1 ? `${item.text} (${item.count}×${unitSuffix})` : `${item.text}${unitSuffix}`;

            return `
                <li class="${doneClass}" data-index="${index}" ${style.trim()}>
                    <div class="item-row">
                        <div class="item-main">
                            ${emoji ? `<span class="item-emoji">${emoji}</span>` : ""}
                            <span class="item-text">${displayText}</span>
                        </div>
                        <button class="item-action-btn" type="button" data-index="${index}" aria-label="Artikelaktionen öffnen">
                            <span class="item-action-btn__box">⋯</span>
                        </button>
                    </div>
                </li>
                ${((index + 1) % 5 === 0) ? `<div class="ad-inline">Hier könnte Werbung sein.</div>` : ""}
            `;
        })
        .join("");

    listEl.innerHTML = html;

    listEl.querySelectorAll("li").forEach((li, index) => {
        const item = items[index];

        li.onclick = event => {
            if (event.target.closest(".item-action-btn")) {
                event.stopPropagation();
                openItemActionPanel(item, index);
                return;
            }

            item.done = !item.done;
            saveLists();
            renderList();
        };

        li.querySelector(".item-action-btn")?.addEventListener("click", event => {
            event.stopPropagation();
            openItemActionPanel(item, index);
        });

        li.addEventListener("touchstart", onSwipeStart);
        li.addEventListener("touchmove", e => onSwipeMove(e, item, index));
        li.addEventListener("touchend", onSwipeEnd);
    });
}

//
// FAVORITEN (MAIN)
//
export function renderFavoritesMain() {
    const container = els.favoritesMain;
    if (!container) return;

    const list = state.lists[state.activeList];
    let favs = list.favorites[state.activeCategory] || [];

    // ⭐ Reparatur alter Favoriten
    favs = favs.map(f => {
        if (typeof f === "string") return { text: f, category: state.activeCategory };
        if (!f.text) f.text = "Unbenannt";
        return f;
    });

    const meta = list.categoryMeta?.[state.activeCategory] || {};
    const favColor = meta.color || "#ffd966";

    container.innerHTML = favs
        .map(f => `
            <button>
                ${meta.emoji ? `<span class="fav-icon">${meta.emoji}</span>` : ""}
                ${f.text}
            </button>
        `)
        .join("");

    container.querySelectorAll("button").forEach((btn, i) => {
        btn.style.backgroundColor = favColor;
        btn.onclick = () => addFavoriteToInput(favs[i]);
    });
}

//
// FAVORITEN EDITOR
//
export function renderFavoritesEditor() {
    const container = els.favoritesEditor;
    if (!container) return;

    const list = state.lists[state.activeList];
    let favs = list.favorites[state.activeCategory] || [];

    // ⭐ Reparatur alter Favoriten
    favs = favs.map(f => {
        if (typeof f === "string") return { text: f, category: state.activeCategory };
        if (!f.text) f.text = "Unbenannt";
        return f;
    });

    const meta = list.categoryMeta?.[state.activeCategory] || {};
    const favColor = meta.color || "#ffd966";

    container.innerHTML = favs
        .map((f, index) => `
            <div class="fav-editor-item" draggable="true" data-index="${index}">
                <span class="fav-drag-handle">☰</span>
                ${meta.emoji ? `<span class="fav-icon">${meta.emoji}</span>` : ""}
                <span class="fav-text">${f.text}</span>
                <button class="fav-delete">
                    <svg viewBox="0 0 24 24" class="trash-icon" fill="none" stroke="currentColor">
                        <path d="M3 6h18" stroke-width="2" stroke-linecap="round"/>
                        <path d="M9 6V4h6v2" stroke-width="2" stroke-linecap="round"/>
                        <path d="M10 10v8" stroke-width="2" stroke-linecap="round"/>
                        <path d="M14 10v8" stroke-width="2" stroke-linecap="round"/>
                        <path d="M5 6l1 14h12l1-14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `)
        .join("");

    container.querySelectorAll(".fav-editor-item").forEach((row, index) => {
        row.addEventListener("dragstart", onFavDragStart);
        row.addEventListener("dragover", onFavDragOver);
        row.addEventListener("drop", onFavDrop);
        row.style.backgroundColor = favColor;

        row.querySelector(".fav-delete").onclick = () => deleteFavorite(index);
    });

    const favSelect = document.getElementById("favCategorySelect");
    if (favSelect) {
        favSelect.innerHTML = list.categories
            .map(cat => `<option value="${cat}">${cat}</option>`)
            .join("");
    }
}

//
// KATEGORIEN EDITOR
//
export function renderCategoryEditor() {
    const container = els.categoryEditor;
    if (!container) return;

    const list = state.lists[state.activeList];
    const categories = list.categories;
    const meta = list.categoryMeta || {};

    container.innerHTML = categories
        .map((cat, index) => {
            const m = meta[cat] || {};
            const color = m.color || "#ffd966";
            const emoji = m.emoji || "📦";

            return `
                <div class="cat-editor-item" draggable="true" data-index="${index}">
                    <span class="cat-drag-handle">☰</span>

                    <input type="color" class="cat-color-input" value="${color}">
                    <input type="text" class="cat-emoji-input" value="${emoji}" maxlength="4">

                    <span class="cat-text">${capitalize(cat)}</span>

                    <button class="cat-delete">
                        <svg viewBox="0 0 24 24" class="trash-icon" fill="none" stroke="currentColor">
                            <path d="M3 6h18" stroke-width="2" stroke-linecap="round"/>
                            <path d="M9 6V4h6v2" stroke-width="2" stroke-linecap="round"/>
                            <path d="M10 10v8" stroke-width="2" stroke-linecap="round"/>
                            <path d="M14 10v8" stroke-width="2" stroke-linecap="round"/>
                            <path d="M5 6l1 14h12l1-14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
        })
        .join("");

    container.querySelectorAll(".cat-editor-item").forEach((row, index) => {
        const cat = categories[index];

        row.addEventListener("dragstart", onCatDragStart);
        row.addEventListener("dragover", onCatDragOver);
        row.addEventListener("drop", onCatDrop);

        const colorInput = row.querySelector(".cat-color-input");
        colorInput.addEventListener("input", () => {
            list.categoryMeta[cat].color = colorInput.value;
            saveLists();
            renderCategoryTabs();
            renderList();
            renderFavoritesMain();
        });

        const emojiInput = row.querySelector(".cat-emoji-input");
        emojiInput.addEventListener("input", () => {
            list.categoryMeta[cat].emoji = emojiInput.value;
            saveLists();
            renderCategoryTabs();
            renderList();
            renderFavoritesMain();
        });

        row.querySelector(".cat-delete").onclick = () => deleteCategory(cat);
    });
}

//
// HILFSFUNKTION
//
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
