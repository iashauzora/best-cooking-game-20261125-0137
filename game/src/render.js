// render.js — every pixel of Sizzle Street Kitchen. Pure canvas drawing:
// the dining-room wall and order board up top, the grill, the assembly plate
// and the pass in the middle, and the ingredient bins along the counter.

import { INGREDIENTS, BIN_ORDER, LAYOUT } from './config.js';
import { nextNeeded, targetOrder } from './state.js';
import { plateHint } from './cooking.js';

export const START_BTN = { x: 490, y: 486, w: 300, h: 74 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', bold = true) {
  ctx.font = `${bold ? '700' : '400'} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient drawn as food, centred in the box (x, y, w, h).
export function drawIngredient(ctx, id, x, y, w, h) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  const u = Math.min(w, 64) / 64; // scale unit
  ctx.scale(u, u);
  ctx.fillStyle = ing.fill;
  ctx.strokeStyle = ing.trim;
  ctx.lineWidth = 2.5;
  const slab = (yy, hh, r = 7) => { rr(ctx, -30, yy, 60, hh, r); ctx.fill(); ctx.stroke(); };
  switch (id) {
    case 'bunbase':
      rr(ctx, -30, -4, 60, 16, 7); ctx.fill(); ctx.stroke();
      break;
    case 'buntop':
      ctx.beginPath(); ctx.arc(0, 10, 30, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff2cf';
      [[-14, -8], [2, -14], [15, -6], [-4, -2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(dx, dy, 3.4, 2, 0.5, 0, 7); ctx.fill(); });
      break;
    case 'patty':
      slab(-8, 17, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      [-16, 0, 16].forEach((dx) => { ctx.beginPath(); ctx.arc(dx, 0, 3, 0, 7); ctx.fill(); });
      break;
    case 'chicken':
      slab(-9, 18, 10);
      ctx.strokeStyle = 'rgba(122,66,16,0.55)';
      ctx.beginPath(); ctx.moveTo(-22, -2); ctx.lineTo(20, 4); ctx.moveTo(-20, 6); ctx.lineTo(22, -3); ctx.stroke();
      break;
    case 'bacon':
      ctx.beginPath();
      ctx.moveTo(-30, 2);
      for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(-25 + i * 10, i % 2 ? -8 : 8, -20 + i * 10, 2);
      ctx.lineTo(30, 12); ctx.lineTo(-30, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f0a58e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-28, 6);
      for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(-23 + i * 10, i % 2 ? -3 : 12, -18 + i * 10, 6);
      ctx.stroke();
      break;
    case 'egg':
      ctx.fillStyle = ing.trim;
      ctx.beginPath(); ctx.ellipse(0, 1, 30, 13, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.fill; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); ctx.stroke();
      break;
    case 'mushroom':
      [-18, 0, 18].forEach((dx) => {
        ctx.fillStyle = ing.fill; ctx.beginPath(); ctx.arc(dx, -3, 11, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = ing.trim; rr(ctx, dx - 4, -3, 8, 11, 3); ctx.fill();
      });
      break;
    case 'cheese':
      ctx.save(); ctx.rotate(0.06);
      rr(ctx, -30, -9, 60, 17, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, 8); ctx.quadraticCurveTo(13, 18, 18, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      break;
    case 'lettuce':
      ctx.beginPath(); ctx.moveTo(-32, 4);
      for (let i = 0; i < 8; i++) ctx.quadraticCurveTo(-28 + i * 8, i % 2 ? -8 : 6, -24 + i * 8, 2);
      ctx.lineTo(32, 12); ctx.lineTo(-32, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'tomato':
      [-19, 0, 19].forEach((dx) => {
        ctx.beginPath(); ctx.arc(dx, 0, 12.5, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff9a8a'; ctx.beginPath(); ctx.arc(dx, 0, 7, 0, 7); ctx.fill();
        ctx.fillStyle = ing.fill;
      });
      break;
  }
  ctx.restore();
}

function drawHeader(ctx, state) {
  const { header } = LAYOUT;
  ctx.fillStyle = '#40260f';
  ctx.fillRect(header.x, header.y, header.w, header.h);
  text(ctx, 'SIZZLE STREET KITCHEN', 24, 31, 24, '#ffd98a');
  text(ctx, `Score  $${state.score}`, 560, 31, 23, '#ffffff', 'center');
  text(ctx, `Served ${state.served}`, 742, 31, 20, '#ffe9bd', 'center');
  text(ctx, `Level ${state.level}`, 892, 31, 20, '#ffe9bd', 'center');
  if (state.streak >= 2) text(ctx, `Streak x${state.streak}`, 1010, 31, 20, '#ffb35c', 'center');
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.hearts ? '#ff5b6a' : 'rgba(255,255,255,0.18)';
    const cx = 1152 + i * 38, cy = 30;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 11);
    ctx.bezierCurveTo(cx - 17, cy - 4, cx - 9, cy - 15, cx, cy - 5);
    ctx.bezierCurveTo(cx + 9, cy - 15, cx + 17, cy - 4, cx, cy + 11);
    ctx.fill();
  }
}

function drawOrderCard(ctx, order, x, y, w, h, isTarget) {
  ctx.fillStyle = isTarget ? '#fff7df' : '#fdf3e0';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.lineWidth = isTarget ? 4 : 2;
  ctx.strokeStyle = isTarget ? '#e8930c' : '#c9a86a';
  rr(ctx, x, y, w, h, 12); ctx.stroke();
  text(ctx, order.recipe.name, x + 16, y + 24, 21, '#5b3410');
  text(ctx, `$${order.recipe.price}`, x + w - 16, y + 24, 21, '#1d7a35', 'right');
  // The stack, bottom first, as chips.
  const chipW = 52, chipH = 40;
  order.recipe.stack.forEach((ing, i) => {
    const cx = x + 14 + i * (chipW + 5);
    const cy = y + 46;
    ctx.fillStyle = INGREDIENTS[ing].fill;
    rr(ctx, cx, cy, chipW, chipH, 8); ctx.fill();
    ctx.strokeStyle = INGREDIENTS[ing].trim; ctx.lineWidth = 1.6;
    rr(ctx, cx, cy, chipW, chipH, 8); ctx.stroke();
    drawIngredient(ctx, ing, cx + chipW / 2, cy + chipH / 2 + 4, 40, 26);
  });
  text(ctx, 'bottom → top', x + 16, y + 104, 13, '#97794e');
  // Patience bar.
  const frac = Math.max(0, order.left / order.total);
  ctx.fillStyle = '#e5d3ac'; rr(ctx, x + 14, y + h - 30, w - 28, 14, 7); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#58a34c' : frac > 0.25 ? '#e8930c' : '#d63a2f';
  if (frac > 0) { rr(ctx, x + 14, y + h - 30, (w - 28) * frac, 14, 7); ctx.fill(); }
  text(ctx, `${Math.ceil(order.left)}s`, x + w - 16, y + 104, 14, '#8a6a35', 'right');
}

function drawOrders(ctx, state) {
  const { orders } = LAYOUT;
  const target = targetOrder(state);
  state.orders.forEach((order, i) => {
    drawOrderCard(ctx, order, orders.x + i * (orders.cardW + orders.gap), orders.y, orders.cardW, orders.h, order === target && state.plate.length > 0);
  });
  if (!state.orders.length) text(ctx, 'Waiting for customers…', orders.x + 8, orders.y + 70, 20, '#7a5a28');
}

function drawGrill(ctx, state) {
  const g = LAYOUT.grill;
  ctx.fillStyle = '#3a3f46'; rr(ctx, g.x, g.y, g.w, g.h, 14); ctx.fill();
  ctx.strokeStyle = '#20242a'; ctx.lineWidth = 3; rr(ctx, g.x, g.y, g.w, g.h, 14); ctx.stroke();
  text(ctx, 'THE GRILL', g.x + g.w / 2, g.y + 28, 22, '#ffb35c', 'center');
  text(ctx, 'click a ready item to plate it', g.x + g.w / 2, g.y + 54, 13, '#aeb6bf', 'center');
  state.grill.forEach((item, i) => {
    const sx = g.x + 24 + i * 116, sy = g.y + 76, sw = 104, sh = 190;
    ctx.fillStyle = '#26292e'; rr(ctx, sx, sy, sw, sh, 10); ctx.fill();
    ctx.strokeStyle = '#15171a'; ctx.lineWidth = 2; rr(ctx, sx, sy, sw, sh, 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(sx + 10, sy + 118 + r * 16); ctx.lineTo(sx + sw - 10, sy + 118 + r * 16); ctx.stroke(); }
    if (!item) {
      text(ctx, 'empty', sx + sw / 2, sy + 60, 15, '#6b7280', 'center');
      return;
    }
    drawIngredient(ctx, item.ing, sx + sw / 2, sy + 52, 84, 60);
    text(ctx, INGREDIENTS[item.ing].name, sx + sw / 2, sy + 100, 14, '#e5e7eb', 'center');
    // Doneness bar with the perfect zone marked.
    const spec = INGREDIENTS[item.ing].grill;
    const bx = sx + 10, bw = sw - 20, by = sy + 128;
    ctx.fillStyle = '#111'; rr(ctx, bx, by, bw, 16, 8); ctx.fill();
    ctx.fillStyle = '#58a34c';
    rr(ctx, bx + bw * (spec.cook / (spec.perfect * 1.35)), by, bw * ((spec.perfect - spec.cook) / (spec.perfect * 1.35)), 16, 4); ctx.fill();
    const pos = Math.min(1, item.t / (spec.perfect * 1.35));
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + bw * pos - 2, by - 3, 4, 22);
    const color = item.state === 'perfect' ? '#7be382' : item.state === 'burnt' ? '#ff7a6b' : '#ffd98a';
    const label = item.state === 'perfect' ? 'PERFECT!' : item.state === 'burnt' ? 'BURNT' : 'COOKING';
    text(ctx, label, sx + sw / 2, sy + 168, item.state === 'perfect' ? 16 : 13, color, 'center');
  });
}

function drawPlate(ctx, state) {
  const p = LAYOUT.plate;
  ctx.fillStyle = '#7c4a21'; rr(ctx, p.x, p.y, p.w, p.h, 14); ctx.fill();
  ctx.strokeStyle = '#54300f'; ctx.lineWidth = 3; rr(ctx, p.x, p.y, p.w, p.h, 14); ctx.stroke();
  text(ctx, 'ASSEMBLY PLATE', p.x + p.w / 2, p.y + 28, 22, '#ffd98a', 'center');
  // The plate itself.
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.ellipse(p.cx, p.baseY, 128, 30, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c3ccd4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(p.cx, p.baseY, 128, 30, 0, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(p.cx, p.baseY, 88, 19, 0, 0, 7); ctx.stroke();
  // The stack, bottom layer first.
  state.plate.forEach((ing, i) => {
    drawIngredient(ctx, ing, p.cx, p.baseY - 12 - i * 17, 190, 44);
  });
  if (!state.plate.length) text(ctx, 'empty plate', p.cx, p.baseY - 40, 16, '#e8cf9f', 'center');
  // Hint + flash.
  text(ctx, plateHint(state), p.x + p.w / 2, p.y + p.h - 18, 15, '#ffe9bd', 'center');
  if (state.flashT > 0 && state.flash) {
    ctx.fillStyle = 'rgba(32,18,4,0.85)';
    const w = ctx.measureText(state.flash).width;
    void w;
    rr(ctx, p.cx - 190, p.y + 58, 380, 40, 20); ctx.fill();
    text(ctx, state.flash, p.cx, p.y + 79, 19, '#ffd98a', 'center');
  }
}

function drawPass(ctx, state) {
  const p = LAYOUT.pass;
  ctx.fillStyle = '#274435'; rr(ctx, p.x, p.y, p.w, p.h, 14); ctx.fill();
  ctx.strokeStyle = '#14251b'; ctx.lineWidth = 3; rr(ctx, p.x, p.y, p.w, p.h, 14); ctx.stroke();
  text(ctx, 'THE PASS', p.x + p.w / 2, p.y + 28, 22, '#a7e8bd', 'center');
  const target = targetOrder(state);
  if (target && state.plate.length) {
    text(ctx, `Plating for: ${target.recipe.name}`, p.x + p.w / 2, p.y + 66, 17, '#eafff1', 'center');
    text(ctx, `${state.plate.length} of ${target.recipe.stack.length} layers on the plate`, p.x + p.w / 2, p.y + 94, 15, '#bfe9cd', 'center');
  } else {
    text(ctx, 'Match a plate to an order,', p.x + p.w / 2, p.y + 66, 16, '#eafff1', 'center');
    text(ctx, 'then serve it here.', p.x + p.w / 2, p.y + 90, 16, '#eafff1', 'center');
  }
  text(ctx, 'Tips grow with speed and streaks.', p.x + p.w / 2, p.y + 128, 14, '#8fc7a1', 'center');
  const s = LAYOUT.serveBtn, t = LAYOUT.trashBtn;
  ctx.fillStyle = '#2fbf71'; rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.strokeStyle = '#1d7a48'; ctx.lineWidth = 3; rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke();
  text(ctx, 'SERVE ⏎', s.x + s.w / 2, s.y + s.h / 2, 23, '#ffffff', 'center');
  ctx.fillStyle = '#8a4b3a'; rr(ctx, t.x, t.y, t.w, t.h, 12); ctx.fill();
  ctx.strokeStyle = '#5d2d20'; ctx.lineWidth = 3; rr(ctx, t.x, t.y, t.w, t.h, 12); ctx.stroke();
  text(ctx, 'BIN ⌫', t.x + t.w / 2, t.y + t.h / 2, 23, '#ffe1d6', 'center');
}

export function binRect(i) {
  const b = LAYOUT.bins;
  return { x: b.x + i * (b.binW + b.gap), y: b.y, w: b.binW, h: b.h };
}
export function grillSlotRect(i) {
  const g = LAYOUT.grill;
  return { x: g.x + 24 + i * 116, y: g.y + 76, w: 104, h: 190 };
}

function drawBins(ctx, state) {
  const b = LAYOUT.bins;
  ctx.fillStyle = '#5d3a17';
  ctx.fillRect(0, b.y - 14, 1280, 800 - b.y + 14);
  ctx.fillStyle = '#6f4520';
  ctx.fillRect(0, b.y - 14, 1280, 8);
  const needed = nextNeeded(state);
  BIN_ORDER.forEach((id, i) => {
    const r = binRect(i);
    const ing = INGREDIENTS[id];
    ctx.fillStyle = '#fdf6e3'; rr(ctx, r.x, r.y, r.w, r.h - 58, 10); ctx.fill();
    ctx.strokeStyle = needed === id ? '#ffb300' : '#a97c46';
    ctx.lineWidth = needed === id ? 5 : 2;
    rr(ctx, r.x, r.y, r.w, r.h - 58, 10); ctx.stroke();
    drawIngredient(ctx, id, r.x + r.w / 2, r.y + 48, 76, 52);
    if (ing.grill) text(ctx, '→ grill', r.x + r.w / 2, r.y + 92, 13, '#b3541e', 'center');
    text(ctx, ing.name, r.x + r.w / 2, r.y + r.h - 40, 15, '#ffe9bd', 'center');
    text(ctx, `key ${ing.key}`, r.x + r.w / 2, r.y + r.h - 18, 13, '#d8b988', 'center');
    if (needed === id) text(ctx, '▼ NEXT', r.x + r.w / 2, r.y - 24, 15, '#ffb300', 'center');
  });
}

function drawBackdrop(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, 800);
  grad.addColorStop(0, '#f7e3bd');
  grad.addColorStop(0.72, '#eecfa0');
  grad.addColorStop(1, '#e3ba7d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = 'rgba(180,120,50,0.15)';
  for (let x = 0; x < 1280; x += 80) ctx.fillRect(x, 238, 2, 330);
}

function drawTitle(ctx, state) {
  drawBackdrop(ctx);
  drawBins(ctx, { ...state, plate: [], orders: [] });
  ctx.fillStyle = 'rgba(43,24,6,0.88)';
  rr(ctx, 240, 120, 800, 430, 24); ctx.fill();
  text(ctx, 'SIZZLE STREET', 640, 196, 58, '#ffd98a', 'center');
  text(ctx, 'KITCHEN', 640, 254, 58, '#ffb35c', 'center');
  text(ctx, 'Orders fly in. Stack each dish bottom-to-top, grill what needs', 640, 316, 19, '#fff3da', 'center');
  text(ctx, 'grilling, catch the green PERFECT zone, and serve before the', 640, 342, 19, '#fff3da', 'center');
  text(ctx, 'customer walks. Three walk-outs end the shift!', 640, 368, 19, '#fff3da', 'center');
  text(ctx, 'Mouse: click bins, grill and buttons · Keys: 1–0 pick, Enter serves, ⌫ bins the plate', 640, 404, 15, '#d8b988', 'center');
  ctx.fillStyle = '#2fbf71'; rr(ctx, START_BTN.x, START_BTN.y, START_BTN.w, START_BTN.h, 14); ctx.fill();
  ctx.strokeStyle = '#1d7a48'; ctx.lineWidth = 3; rr(ctx, START_BTN.x, START_BTN.y, START_BTN.w, START_BTN.h, 14); ctx.stroke();
  text(ctx, 'START THE SHIFT', START_BTN.x + START_BTN.w / 2, START_BTN.y + START_BTN.h / 2, 26, '#ffffff', 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(30,16,3,0.82)';
  ctx.fillRect(0, 0, 1280, 800);
  rr(ctx, 340, 210, 600, 380, 24);
  ctx.fillStyle = '#40260f'; ctx.fill();
  text(ctx, 'SHIFT OVER', 640, 286, 46, '#ffd98a', 'center');
  text(ctx, 'Three customers walked out.', 640, 336, 19, '#fff3da', 'center');
  text(ctx, `Final score  $${state.score}`, 640, 392, 30, '#ffffff', 'center');
  text(ctx, `Dishes served ${state.served} · best streak x${state.bestStreak} · level ${state.level}`, 640, 432, 18, '#ffe9bd', 'center');
  ctx.fillStyle = '#2fbf71'; rr(ctx, START_BTN.x, START_BTN.y, START_BTN.w, START_BTN.h, 14); ctx.fill();
  ctx.strokeStyle = '#1d7a48'; ctx.lineWidth = 3; rr(ctx, START_BTN.x, START_BTN.y, START_BTN.w, START_BTN.h, 14); ctx.stroke();
  text(ctx, 'COOK AGAIN', START_BTN.x + START_BTN.w / 2, START_BTN.y + START_BTN.h / 2, 26, '#ffffff', 'center');
}

export function drawGame(ctx, state) {
  if (state.screen === 'title') { drawTitle(ctx, state); return; }
  drawBackdrop(ctx);
  drawHeader(ctx, state);
  drawOrders(ctx, state);
  drawGrill(ctx, state);
  drawPlate(ctx, state);
  drawPass(ctx, state);
  drawBins(ctx, state);
  if (state.screen === 'over') drawOver(ctx, state);
}
