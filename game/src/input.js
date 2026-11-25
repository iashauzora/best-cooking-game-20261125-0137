// input.js — mouse and keyboard for Sizzle Street Kitchen.
// Clicks are hit-tested against the same layout render.js draws with:
// bins along the counter, three grill slots, the SERVE and BIN buttons,
// and the big start button on the title / game-over screens.

import { BIN_ORDER, INGREDIENTS, LAYOUT } from './config.js';
import { touchBin, touchGrill, servePlate, trashPlate } from './cooking.js';
import { binRect, grillSlotRect, START_BTN } from './render.js';
import { ensureAudio, sfx } from './audio.js';

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function attachInput(canvas, state, startGame) {
  const toGame = (evt) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  canvas.addEventListener('pointerdown', (evt) => {
    ensureAudio();
    const { x, y } = toGame(evt);
    if (state.screen !== 'play') {
      if (inside(x, y, START_BTN)) { sfx.click(); startGame(); }
      return;
    }
    for (let i = 0; i < BIN_ORDER.length; i++) {
      if (inside(x, y, binRect(i))) { touchBin(state, BIN_ORDER[i]); return; }
    }
    for (let i = 0; i < state.grill.length; i++) {
      if (inside(x, y, grillSlotRect(i))) { touchGrill(state, i); return; }
    }
    if (inside(x, y, LAYOUT.serveBtn)) { servePlate(state); return; }
    if (inside(x, y, LAYOUT.trashBtn)) { trashPlate(state); return; }
  });

  window.addEventListener('keydown', (evt) => {
    ensureAudio();
    if (state.screen !== 'play') {
      if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); startGame(); }
      return;
    }
    if (evt.key === 'Enter') { servePlate(state); return; }
    if (evt.key === 'Backspace') { evt.preventDefault(); trashPlate(state); return; }
    for (const id of BIN_ORDER) {
      if (INGREDIENTS[id].key === evt.key) { touchBin(state, id); return; }
    }
    // Grill slots answer to Q / W / E: take (or scrap) slot 1 / 2 / 3.
    const slotKeys = ['q', 'w', 'e'];
    const slot = slotKeys.indexOf(evt.key.toLowerCase());
    if (slot >= 0) touchGrill(state, slot);
  });
}
