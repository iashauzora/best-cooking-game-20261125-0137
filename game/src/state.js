// state.js — the whole game state in one plain object, plus order spawning.
// A small seeded RNG keeps every run reproducible (and lets the screenshot
// scenes in main.js stage exact moments of a shift).

import { RECIPES, levelTuning } from './config.js';

// mulberry32: tiny deterministic random source.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createState(seed = 20261125) {
  return {
    screen: 'title',          // 'title' | 'play' | 'over'
    rng: makeRng(seed),
    time: 0,
    score: 0,
    served: 0,
    lost: 0,
    hearts: 3,
    level: 1,
    streak: 0,
    bestStreak: 0,
    orders: [],               // {id, recipe, left, total, born}
    grill: [null, null, null],// null | {ing, t, state:'cooking'|'perfect'|'burnt', dinged}
    plate: [],                // ingredient ids, bottom first; 'burnt:<id>' ruins it
    spawnIn: 1.2,
    flash: '',                // short centre message ("Perfect!", "+$16", ...)
    flashT: 0,
    frozen: false,            // screenshot scenes freeze the clock
    nextOrderId: 1,
  };
}

export function unlockedRecipes(level) {
  return RECIPES.filter((r) => r.unlock <= level);
}

// Add a fresh order if there is room on the board. Returns the order or null.
export function spawnOrder(state) {
  const tune = levelTuning(state.level);
  if (state.orders.length >= tune.maxOrders) return null;
  const pool = unlockedRecipes(state.level);
  const recipe = pool[Math.floor(state.rng() * pool.length)];
  const order = {
    id: state.nextOrderId++,
    recipe,
    left: tune.patience,
    total: tune.patience,
    born: state.time,
  };
  state.orders.push(order);
  return order;
}

// The order the current plate is closest to finishing: the one sharing the
// longest prefix with the plate stack. Drives the "next ingredient" hint.
export function targetOrder(state) {
  let best = null;
  let bestScore = -1;
  for (const order of state.orders) {
    let n = 0;
    while (n < state.plate.length && n < order.recipe.stack.length && state.plate[n] === order.recipe.stack[n]) n++;
    if (n > bestScore) { bestScore = n; best = order; }
  }
  return best;
}

export function nextNeeded(state) {
  const order = targetOrder(state);
  if (!order) return null;
  const n = state.plate.length;
  return n < order.recipe.stack.length ? order.recipe.stack[n] : null;
}
