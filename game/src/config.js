// config.js — Sizzle Street Kitchen: ingredients, recipes, levels and layout.
// Everything the other modules need to agree on lives here: what can be cooked,
// what a dish is made of (bottom of the stack first), how hard each level gets,
// and where every station sits on the 1280x800 canvas.

// Ingredients. grill: null means the item goes straight from its bin to the
// plate; otherwise the item must spend time on the grill: it is ready once
// `cook` seconds pass, perfect until `perfect` seconds, and burnt after that.
export const INGREDIENTS = {
  bunbase:  { name: 'Bun Base',  key: '1', grill: null,                            fill: '#e8b06a', trim: '#c9853e' },
  patty:    { name: 'Patty',     key: '2', grill: { cook: 3.2, perfect: 6.4 },    fill: '#8a4b23', trim: '#5f3013' },
  chicken:  { name: 'Chicken',   key: '3', grill: { cook: 3.8, perfect: 7.2 },    fill: '#d98e4a', trim: '#a86424' },
  bacon:    { name: 'Bacon',     key: '4', grill: { cook: 2.6, perfect: 5.2 },    fill: '#b8452e', trim: '#7e2a1a' },
  egg:      { name: 'Egg',       key: '5', grill: { cook: 2.4, perfect: 4.8 },    fill: '#f6c945', trim: '#fff3c4' },
  mushroom: { name: 'Mushroom',  key: '6', grill: { cook: 2.8, perfect: 5.6 },    fill: '#cbb59a', trim: '#8f7a5c' },
  cheese:   { name: 'Cheese',    key: '7', grill: null,                            fill: '#ffc93c', trim: '#e09f00' },
  lettuce:  { name: 'Lettuce',   key: '8', grill: null,                            fill: '#69b44c', trim: '#3f7d2c' },
  tomato:   { name: 'Tomato',    key: '9', grill: null,                            fill: '#e8483f', trim: '#a8231c' },
  buntop:   { name: 'Bun Top',   key: '0', grill: null,                            fill: '#eeb96f', trim: '#c9853e' },
};

// The order the bins are drawn on the counter, left to right.
export const BIN_ORDER = [
  'bunbase', 'patty', 'chicken', 'bacon', 'egg',
  'mushroom', 'cheese', 'lettuce', 'tomato', 'buntop',
];

// Recipes: the stack from the plate up. price is what the customer pays before
// the tip; unlock is the first level the dish can be ordered.
export const RECIPES = [
  { id: 'classic',  name: 'Classic Burger',  stack: ['bunbase', 'patty', 'cheese', 'lettuce', 'buntop'],                 price: 12, unlock: 1 },
  { id: 'blt',      name: 'Bacon Crunch',    stack: ['bunbase', 'bacon', 'lettuce', 'tomato', 'buntop'],                  price: 12, unlock: 1 },
  { id: 'sunrise',  name: 'Sunrise Bun',     stack: ['bunbase', 'egg', 'bacon', 'cheese', 'buntop'],                      price: 13, unlock: 2 },
  { id: 'garden',   name: 'Garden Stack',    stack: ['bunbase', 'lettuce', 'tomato', 'mushroom', 'cheese', 'buntop'],     price: 15, unlock: 2 },
  { id: 'melt',     name: 'Chicken Melt',    stack: ['bunbase', 'chicken', 'cheese', 'bacon', 'buntop'],                  price: 15, unlock: 3 },
  { id: 'double',   name: 'Double Trouble',  stack: ['bunbase', 'patty', 'cheese', 'patty', 'tomato', 'buntop'],          price: 17, unlock: 3 },
  { id: 'feast',    name: 'Sizzle Feast',    stack: ['bunbase', 'chicken', 'mushroom', 'cheese', 'lettuce', 'buntop'],    price: 18, unlock: 4 },
];

// Level tuning: how many orders can wait at once, how long a customer waits
// before walking out, and how soon the next customer arrives.
export function levelTuning(level) {
  return {
    maxOrders: level >= 2 ? 3 : 2,
    patience: Math.max(34, 62 - (level - 1) * 4),
    spawnEvery: Math.max(3.2, 6.5 - (level - 1) * 0.55),
    servesToLevel: 4,
  };
}

// Canvas layout shared by render.js (drawing) and input.js (hit testing).
export const VIEW = { w: 1280, h: 800 };
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 60 },
  orders: { x: 24, y: 72, w: 1232, h: 158, cardW: 400, gap: 16 },
  grill:  { x: 30, y: 268, w: 380, h: 300, slots: 3 },
  plate:  { x: 450, y: 268, w: 380, h: 300, cx: 640, baseY: 520 },
  pass:   { x: 870, y: 268, w: 380, h: 300 },
  serveBtn: { x: 890, y: 452, w: 160, h: 64 },
  trashBtn: { x: 1070, y: 452, w: 160, h: 64 },
  bins:   { x: 24, y: 600, w: 1232, h: 168, binW: 118, gap: 5.7 },
};
