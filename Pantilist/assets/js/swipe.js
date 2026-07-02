import { state } from "./state.js";
import { saveLists } from "./storage.js";
import { renderList } from "./ui.js";

let startX = 0;
let currentX = 0;
let swiped = false;

//
// TOUCH START
//
export function onSwipeStart(e) {
    if (!e.touches || !e.touches[0]) return;
    startX = e.touches[0].clientX;
    swiped = false;
}

//
// TOUCH MOVE
//
export function onSwipeMove(e, item, index) {
    if (!e.touches || !e.touches[0]) return;

    currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    const list = state.lists[state.activeList];
    if (!list) return;

    const items = list.items || [];
    if (!items[index]) return;

    // Leichtes Wischen = erledigt toggeln
    if (!swiped && Math.abs(diff) > 40) {
        swiped = true;
        item.done = !item.done;
        saveLists();
        renderList();
    }

    // Starkes Wischen = löschen
    if (Math.abs(diff) > 120) {
        items.splice(index, 1);
        saveLists();
        renderList();
    }
}

//
// TOUCH END
//
export function onSwipeEnd() {
    startX = 0;
    currentX = 0;
    swiped = false;
}
