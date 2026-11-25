// main.js — boots Sizzle Street Kitchen: canvas, the frame loop, starting a
// shift, and the ?scene= staging the maker uses to take honest screenshots
// of real game states (the clock freezes; everything on screen is drawn by
// the game's own renderer from a real state).

import { createState, spawnOrder } from './state.js';
import { update } from './cooking.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { RECIPES } from './config.js';

const canvas = document.getElementById('kitchen');
const ctx = canvas.getContext('2d');

let state = createState();

function startGame() {
  state = createState(Date.now() % 2147483647);
  state.screen = 'play';
  spawnOrder(state);
  state.spawnIn = 2.2;
  attachInputOnce();
}

let inputAttached = false;
function attachInputOnce() {
  if (inputAttached) return;
  inputAttached = true;
  attachInput(canvas, stateProxy, startGame);
}

// Input handlers always see the current state object, even after a restart
// replaces it.
const stateProxy = new Proxy({}, {
  get(_t, prop) { return state[prop]; },
  set(_t, prop, value) { state[prop] = value; return true; },
});
attachInputOnce();

// --- Screenshot scenes -----------------------------------------------------
// ?scene=1 fresh shift, ?scene=2 mid-assembly with the grill running,
// ?scene=3 a finished plate about to be served while another order runs
// out of patience. All staged through the game's own state and renderer.
function stageScene(n) {
  state = createState(4242);
  state.screen = 'play';
  state.frozen = true;
  const byId = (id) => RECIPES.find((r) => r.id === id);
  const addOrder = (recipe, leftFrac) => {
    const tune = 55;
    state.orders.push({ id: state.nextOrderId++, recipe, left: tune * leftFrac, total: tune, born: 0 });
  };
  if (n === 1) {
    addOrder(byId('classic'), 0.92);
    addOrder(byId('blt'), 0.8);
    state.score = 0;
  } else if (n === 2) {
    addOrder(byId('classic'), 0.78);
    addOrder(byId('sunrise'), 0.62);
    addOrder(byId('garden'), 0.45);
    state.plate = ['bunbase', 'patty', 'cheese'];
    state.grill[0] = { ing: 'egg', t: 3.1, state: 'perfect', dinged: true };
    state.grill[1] = { ing: 'mushroom', t: 1.4, state: 'cooking', dinged: false };
    state.score = 47; state.served = 3; state.streak = 2; state.level = 2;
    state.flash = ''; state.flashT = 0;
  } else if (n === 3) {
    addOrder(byId('melt'), 0.97);
    addOrder(byId('double'), 0.16);
    state.plate = ['bunbase', 'chicken', 'cheese', 'bacon', 'buntop'];
    state.grill[2] = { ing: 'patty', t: 8.9, state: 'burnt', dinged: true };
    state.score = 132; state.served = 8; state.streak = 4; state.level = 3;
    state.flash = 'Sizzle Feast up next — grill the chicken!';
    state.flashT = 99;
  }
}

const sceneParam = new URLSearchParams(location.search).get('scene');
if (sceneParam) stageScene(Number(sceneParam));

// --- Frame loop -------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(state, dt);
  drawGame(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
