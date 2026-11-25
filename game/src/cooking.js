// cooking.js — the rules of the kitchen: what happens when the cook touches
// a bin, the grill or the pass, and how a shift advances second by second.

import { INGREDIENTS, levelTuning } from './config.js';
import { spawnOrder, targetOrder } from './state.js';
import { sfx } from './audio.js';

function setFlash(state, text, seconds = 1.1) {
  state.flash = text;
  state.flashT = seconds;
}

// Touch a counter bin. Raw grill items go on a free grill slot; everything
// else lands straight on the plate.
export function touchBin(state, ingId) {
  const ing = INGREDIENTS[ingId];
  if (!ing || state.screen !== 'play') return;
  if (ing.grill) {
    const slot = state.grill.findIndex((s) => s === null);
    if (slot === -1) { setFlash(state, 'Grill is full!'); sfx.error(); return; }
    state.grill[slot] = { ing: ingId, t: 0, state: 'cooking', dinged: false };
    sfx.sizzle();
  } else {
    state.plate.push(ingId);
    sfx.place();
  }
}

// Touch a grill slot: a finished item joins the plate, a burnt one is
// scrapped, a still-cooking one just gets a shake of the head.
export function touchGrill(state, slot) {
  const item = state.grill[slot];
  if (!item || state.screen !== 'play') return;
  if (item.state === 'perfect') {
    state.plate.push(item.ing);
    state.grill[slot] = null;
    sfx.place();
  } else if (item.state === 'burnt') {
    state.grill[slot] = null;
    setFlash(state, 'Scrapped the burnt one');
    sfx.trash();
  } else {
    setFlash(state, 'Still cooking…');
    sfx.click();
  }
}

export function trashPlate(state) {
  if (!state.plate.length) return;
  state.plate = [];
  state.streak = 0;
  setFlash(state, 'Plate binned');
  sfx.trash();
}

// Serve the plate: it must match one waiting order's stack exactly.
export function servePlate(state) {
  if (!state.plate.length || state.screen !== 'play') return;
  const match = state.orders.find((o) =>
    o.recipe.stack.length === state.plate.length &&
    o.recipe.stack.every((ing, i) => ing === state.plate[i]));
  if (!match) {
    setFlash(state, 'No order matches this plate!');
    sfx.error();
    return;
  }
  const tune = levelTuning(state.level);
  const tip = Math.round(match.recipe.price * 0.6 * (match.left / match.total));
  const streakBonus = Math.min(5, state.streak);
  const earned = match.recipe.price + tip + streakBonus;
  state.score += earned;
  state.served += 1;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.orders = state.orders.filter((o) => o !== match);
  state.plate = [];
  setFlash(state, `Served! +$${earned} (tip $${tip})`);
  sfx.serve();
  const newLevel = 1 + Math.floor(state.served / tune.servesToLevel);
  if (newLevel > state.level) {
    state.level = newLevel;
    setFlash(state, `Level ${newLevel} — the rush grows!`, 1.6);
    sfx.level();
  }
  if (state.orders.length < tune.maxOrders) state.spawnIn = Math.min(state.spawnIn, 0.8);
}

// Advance the shift: grill timers, order patience, spawning, messages.
export function update(state, dt) {
  if (state.screen !== 'play' || state.frozen) return;
  state.time += dt;
  if (state.flashT > 0) state.flashT -= dt;

  for (let i = 0; i < state.grill.length; i++) {
    const item = state.grill[i];
    if (!item) continue;
    item.t += dt;
    const g = INGREDIENTS[item.ing].grill;
    const next = item.t < g.cook ? 'cooking' : item.t <= g.perfect ? 'perfect' : 'burnt';
    if (next !== item.state) {
      item.state = next;
      if (next === 'perfect' && !item.dinged) { item.dinged = true; sfx.ding(); }
    }
  }

  const tune = levelTuning(state.level);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    if (spawnOrder(state)) state.spawnIn = tune.spawnEvery;
    else state.spawnIn = 1.0;
  }

  for (const order of [...state.orders]) {
    order.left -= dt;
    if (order.left <= 0) {
      state.orders = state.orders.filter((o) => o !== order);
      state.lost += 1;
      state.hearts -= 1;
      state.streak = 0;
      setFlash(state, 'A customer walked out!');
      sfx.expire();
      if (state.hearts <= 0) {
        state.screen = 'over';
        return;
      }
    }
  }
}

// The hint line under the plate: what to add next, or why serving will fail.
export function plateHint(state) {
  if (!state.plate.length) return 'Pick a bun base to start a plate.';
  const order = targetOrder(state);
  if (!order) return 'No orders waiting — a customer is coming.';
  const stack = order.recipe.stack;
  const prefix = stack.slice(0, state.plate.length);
  const matches = prefix.every((ing, i) => ing === state.plate[i]);
  if (!matches) return `This plate matches no order — bin it and restart.`;
  if (state.plate.length === stack.length) return `${order.recipe.name} is ready — serve it!`;
  const next = stack[state.plate.length];
  const ing = INGREDIENTS[next];
  return `Building ${order.recipe.name}: next is ${ing.name}${ing.grill ? ' (grill it first!)' : ''}.`;
}
