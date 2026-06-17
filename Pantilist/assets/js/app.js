/* ============================================================
   GLOBAL ELEMENTS
============================================================ */

const listElement = document.getElementById("list");
const input = document.getElementById("itemInput");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");

const favoritesMain = document.getElementById("favoritesMain");
const favoritesEditor = document.getElementById("favoritesEditor");

const categoryEditor = document.getElementById("categoryEditor");

/* ============================================================
   STORAGE KEYS
============================================================ */

const LISTS_KEY = "shoppingLists_v2";
const CATEGORIES_KEY = "shoppingCategories_v2";
const FAVORITES_KEY = "shoppingFavorites_v2";
const THEME_KEY = "shoppingTheme";
const SIZE_KEY = "shoppingSize";

/* ============================================================
   DEFAULT CATEGORIES (protected)
============================================================ */

const DEFAULT_CATEGORIES = ["haushalt", "drogerie", "sonstiges"];

/* ============================================================
   APP STATE
============================================================ */

let categories = [...DEFAULT_CATEGORIES];
let lists = {};
let favorites = [];

let activeCategory = "haushalt";

/* ============================================================
   LOAD DATA
============================================================ */

function loadData() {
  // Kategorien
  const catData = localStorage.getItem(CATEGORIES_KEY);
  if (catData) {
    try {
      const parsed = JSON.parse(catData);
      categories = [...DEFAULT_CATEGORIES, ...parsed.filter(c => !DEFAULT_CATEGORIES.includes(c))];
    } catch {
      categories = [...DEFAULT_CATEGORIES];
    }
  }

  // Listen
  const listData = localStorage.getItem(LISTS_KEY);
  if (listData) {
    try {
      lists = JSON.parse(listData);
    } catch {
      lists = {};
    }
  }

  // Listen für neue Kategorien anlegen
  categories.forEach(cat => {
    if (!lists[cat]) lists[cat] = [];
  });

  // Favoriten
  const favData = localStorage.getItem(FAVORITES_KEY);
  if (favData) {
    try {
      favorites = JSON.parse(favData);
    } catch {
      favorites = ["Milch", "Brot", "Eier", "Wasser"];
    }
  } else {
    favorites = ["Milch", "Brot", "Eier", "Wasser"];
  }
}

/* ============================================================
   SAVE DATA
============================================================ */

function saveCategories() {
  const customCats = categories.filter(c => !DEFAULT_CATEGORIES.includes(c));
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(customCats));
}

function saveLists() {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

/* ============================================================
   CATEGORY SELECTOR
============================================================ */

function renderCategorySelector() {
  categorySelect.innerHTML = "";

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = capitalize(cat);
    categorySelect.appendChild(opt);
  });

  categorySelect.value = activeCategory;
}

function changeActiveCategory() {
  activeCategory = categorySelect.value;
  renderList();
}

/* ============================================================
   CATEGORY EDITOR (Settings Panel)
============================================================ */

function renderCategoryEditor() {
  categoryEditor.innerHTML = "";

  categories.forEach((cat, index) => {
    const row = document.createElement("div");
    row.className = "cat-editor-item";
    row.draggable = true;
    row.dataset.index = index;

    const handle = document.createElement("span");
    handle.className = "cat-drag-handle";
    handle.textContent = "☰";

    const label = document.createElement("span");
    label.className = "cat-text";
    label.textContent = capitalize(cat);

    const del = document.createElement("button");
    del.className = "cat-delete";
    del.textContent = "✕";

    // Standard-Kategorien geschützt
    if (DEFAULT_CATEGORIES.includes(cat)) {
      del.disabled = true;
      del.classList.add("disabled");
    } else {
      del.onclick = () => deleteCategory(cat);
    }

    row.appendChild(handle);
    row.appendChild(label);
    row.appendChild(del);

    // Drag & Drop Events
    row.addEventListener("dragstart", onCatDragStart);
    row.addEventListener("dragover", onCatDragOver);
    row.addEventListener("drop", onCatDrop);

    categoryEditor.appendChild(row);
  });
}

function saveNewCategory() {
  const inputCat = document.getElementById("catInput");
  const text = inputCat.value.trim().toLowerCase();
  if (!text) return;

  if (categories.includes(text)) {
    alert("Kategorie existiert bereits.");
    return;
  }

  categories.push(text);
  lists[text] = [];

  saveCategories();
  saveLists();

  inputCat.value = "";

  renderCategorySelector();
  renderCategoryEditor();
}

/* ============================================================
   DELETE CATEGORY (Option B)
============================================================ */

function deleteCategory(cat) {
  if (!lists[cat]) return;

  // Einträge nach "sonstiges" verschieben
  lists["sonstiges"].push(...lists[cat]);

  // Kategorie entfernen
  categories = categories.filter(c => c !== cat);
  delete lists[cat];

  saveCategories();
  saveLists();

  if (activeCategory === cat) {
    activeCategory = "sonstiges";
  }

  renderCategorySelector();
  renderCategoryEditor();
  renderList();
}

/* ============================================================
   CATEGORY DRAG & DROP
============================================================ */

let dragCatIndex = null;

function onCatDragStart(e) {
  dragCatIndex = Number(e.currentTarget.dataset.index);
  e.dataTransfer.effectAllowed = "move";
}

function onCatDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function onCatDrop(e) {
  e.preventDefault();
  const targetIndex = Number(e.currentTarget.dataset.index);

  if (dragCatIndex === targetIndex) return;

  const moved = categories.splice(dragCatIndex, 1)[0];
  categories.splice(targetIndex, 0, moved);

  dragCatIndex = null;

  saveCategories();
  renderCategorySelector();
  renderCategoryEditor();
}

/* ============================================================
   LIST RENDERING
============================================================ */

function renderList() {
  listElement.innerHTML = "";

  const items = lists[activeCategory] || [];

  items.forEach((item, index) => {
    const li = createListItem(item.text, item.done);
    listElement.appendChild(li);

    if ((index + 1) % 5 === 0) {
      const ad = createInlineAd(index + 1);
      listElement.appendChild(ad);
    }
  });

  filterList();
}

/* ============================================================
   LIST ITEMS
============================================================ */

function createListItem(text, done = false) {
  const li = document.createElement("li");
  li.textContent = text;

  if (done) li.classList.add("done");

  li.onclick = () => {
    li.classList.toggle("done");
    updateFromDOM();
  };

  li.oncontextmenu = (e) => {
    e.preventDefault();
    li.remove();
    updateFromDOM();
  };

  return li;
}

function updateFromDOM() {
  const items = [];
  listElement.querySelectorAll("li").forEach(li => {
    items.push({
      text: li.textContent,
      done: li.classList.contains("done")
    });
  });

  lists[activeCategory] = items;
  sortCurrentList();
  saveLists();
  renderList();
}

/* ============================================================
   ADD ITEM
============================================================ */

function addItem() {
  const text = input.value.trim();
  if (!text) return;

  lists[activeCategory].push({ text, done: false });

  sortCurrentList();
  saveLists();
  renderList();

  input.value = "";
}

/* ============================================================
   SORTING
============================================================ */

function sortCurrentList() {
  const items = lists[activeCategory] || [];
  const open = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  lists[activeCategory] = [...open, ...done];
}

/* ============================================================
   DELETE DONE
============================================================ */

function clearDone() {
  const items = lists[activeCategory] || [];
  const doneCount = items.filter(i => i.done).length;

  if (doneCount === 0) return;

  if (doneCount > 3) {
    const ok = confirm(`Es sind ${doneCount} erledigte Einträge. Wirklich löschen?`);
    if (!ok) return;
  }

  lists[activeCategory] = items.filter(i => !i.done);
  saveLists();
  renderList();
}

/* ============================================================
   SEARCH FILTER
============================================================ */

function filterList() {
  const query = (searchInput.value || "").toLowerCase();

  listElement.querySelectorAll("li").forEach(li => {
    const text = li.textContent.toLowerCase();
    li.style.display = text.includes(query) ? "" : "none";
  });

  listElement.querySelectorAll(".ad-inline").forEach(ad => {
    ad.style.display = query ? "none" : "";
  });
}

/* ============================================================
   INLINE ADS
============================================================ */

function createInlineAd(afterIndex) {
  const ad = document.createElement("div");
  ad.className = "ad-inline";
  ad.dataset.after = afterIndex;
  ad.textContent = "Hier könnte Werbung zur Finanzierung sein.";
  return ad;
}

/* ============================================================
   FAVORITES
============================================================ */

function renderFavoritesMain() {
  favoritesMain.innerHTML = "";
  favorites.forEach(fav => {
    const btn = document.createElement("button");
    btn.textContent = fav;
    btn.onclick = () => addFavorite(fav);
    favoritesMain.appendChild(btn);
  });
}

function addFavorite(text) {
  input.value = text;
  addItem();
}

/* FAVORITEN EDITOR */

function renderFavoritesEditor() {
  favoritesEditor.innerHTML = "";

  favorites.forEach((fav, index) => {
    const row = document.createElement("div");
    row.className = "fav-editor-item";
    row.draggable = true;
    row.dataset.index = index;

    const handle = document.createElement("span");
    handle.className = "fav-drag-handle";
    handle.textContent = "☰";

    const label = document.createElement("span");
    label.className = "fav-text";
    label.textContent = fav;

    const del = document.createElement("button");
    del.className = "fav-delete";
    del.textContent = "✕";
    del.onclick = () => {
      favorites.splice(index, 1);
      saveFavorites();
      renderFavorites();
    };

    row.appendChild(handle);
    row.appendChild(label);
    row.appendChild(del);

    row.addEventListener("dragstart", onFavDragStart);
    row.addEventListener("dragover", onFavDragOver);
    row.addEventListener("drop", onFavDrop);

    favoritesEditor.appendChild(row);
  });
}

function renderFavorites() {
  renderFavoritesMain();
  renderFavoritesEditor();
}

function saveNewFavorite() {
  const inputFav = document.getElementById("favInput");
  const text = inputFav.value.trim();
  if (!text) return;

  favorites.push(text);
  saveFavorites();
  inputFav.value = "";
  renderFavorites();
}

/* FAVORITEN DRAG & DROP */

let dragFavIndex = null;

function onFavDragStart(e) {
  dragFavIndex = Number(e.currentTarget.dataset.index);
  e.dataTransfer.effectAllowed = "move";
}

function onFavDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function onFavDrop(e) {
  e.preventDefault();
  const targetIndex = Number(e.currentTarget.dataset.index);

  if (dragFavIndex === targetIndex) return;

  const moved = favorites.splice(dragFavIndex, 1)[0];
  favorites.splice(targetIndex, 0, moved);

  dragFavIndex = null;

  saveFavorites();
  renderFavorites();
}

/* ============================================================
   THEME & SIZE
============================================================ */

function changeTheme() {
  const theme = document.getElementById("themeSelect").value;

  document.getElementById("theme-default").disabled = theme !== "default";
  document.getElementById("theme-forest").disabled = theme !== "forest";
  document.getElementById("theme-diablo").disabled = theme !== "diablo";
  document.getElementById("theme-blackfantasy").disabled = theme !== "blackfantasy";
  document.getElementById("theme-unicorn").disabled = theme !== "unicorn";
  document.getElementById("theme-coreblue").disabled = theme !== "coreblue";

  localStorage.setItem(THEME_KEY, theme);
}

function changeSize() {
  const size = document.getElementById("sizeSelect").value;

  document.body.classList.remove("size-normal", "size-large", "size-xlarge");
  document.body.classList.add(`size-${size}`);

  localStorage.setItem(SIZE_KEY, size);
}

/* ============================================================
   SETTINGS PANEL
============================================================ */

function openSettings() {
  const panel = document.getElementById("settingsPanel");
  panel.classList.remove("hidden");
  setTimeout(() => panel.classList.add("show"), 10);
}

function closeSettings() {
  const panel = document.getElementById("settingsPanel");
  panel.classList.remove("show");
  setTimeout(() => panel.classList.add("hidden"), 300);
}

/* ============================================================
   HELPERS
============================================================ */

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============================================================
   INIT
============================================================ */

window.onload = () => {
  loadData();

  // Theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "default";
  document.getElementById("themeSelect").value = savedTheme;
  changeTheme();

  // Size
  const savedSize = localStorage.getItem(SIZE_KEY) || "normal";
  document.getElementById("sizeSelect").value = savedSize;
  changeSize();

  // Kategorien
  renderCategorySelector();
  renderCategoryEditor();

  // Favoriten
  renderFavorites();

  // Liste
  renderList();

  // Enter = hinzufügen
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") addItem();
  });
};
