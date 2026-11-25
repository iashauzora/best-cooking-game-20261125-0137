// audio.js — every sound in Sizzle Street Kitchen is synthesised with
// WebAudio at play time: no audio files, no network, nothing to load.
// The context is created lazily on the first user gesture (click or key),
// which is what desktop Chrome requires before it will make a sound.

let ctx = null;
let master = null;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function tone(freq, at, dur, type = 'sine', vol = 0.2, slideTo = null) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + at;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(at, dur, vol = 0.12, freq = 1800) {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
}

export const sfx = {
  click()  { tone(660, 0, 0.06, 'triangle', 0.15); },
  place()  { tone(300, 0, 0.07, 'triangle', 0.2, 190); noise(0, 0.05, 0.06, 900); },
  sizzle() { noise(0, 0.5, 0.1, 2400); noise(0.12, 0.35, 0.07, 3000); },
  ding()   { tone(1174, 0, 0.16, 'sine', 0.22); tone(1568, 0.07, 0.22, 'sine', 0.18); },
  serve()  { tone(523, 0, 0.1, 'triangle', 0.2); tone(659, 0.08, 0.1, 'triangle', 0.2); tone(784, 0.16, 0.18, 'triangle', 0.22); },
  error()  { tone(196, 0, 0.16, 'sawtooth', 0.12, 147); },
  trash()  { noise(0, 0.14, 0.14, 500); tone(160, 0, 0.12, 'triangle', 0.12, 90); },
  expire() { tone(392, 0, 0.14, 'square', 0.1); tone(311, 0.13, 0.22, 'square', 0.1); },
  level()  { [523, 587, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.14, 'triangle', 0.18)); },
};
