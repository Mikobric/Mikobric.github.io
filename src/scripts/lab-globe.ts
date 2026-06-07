/* ============================================================
   LAB — synoptic globe tuning page.
   The actual field renderer + noise + extrema tracking live in
   synoptic.ts (shared with the production film). This file is
   just the sandbox: sliders, keyboard, overlay instruments.
   ============================================================ */

import {
  FIELD_DEFAULTS,
  createSynoptic,
  createExtremaTracker,
  type SynopticDrawOpts,
} from './synoptic';

/* ---------- tunables (mirrored in the panel) ---------- */

interface Params {
  scale: number; // noise frequency on the unit sphere
  levels: number; // contour levels per unit of field value
  speed: number; // field morph speed (4th noise dimension)
  spinSpeed: number; // sphere rotation, rad/frame
  lineAlpha: number; // contour brightness
  gratAlpha: number; // graticule brightness (kept faint)
  dash: number; // dash duty cycle for negative contours
}

const DEFAULTS: Params = { ...FIELD_DEFAULTS, spinSpeed: 0.0024 };

/* internal tuning page, but accessibility still applies: hold the field
   and the spin still (params stay untouched, so nothing gets persisted) */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const STORE = 'lab-globe-params';

const params: Params = { ...DEFAULTS };
try {
  Object.assign(params, JSON.parse(localStorage.getItem(STORE) ?? '{}'));
} catch {
  /* stale storage — defaults win */
}

/* ---------- setup ---------- */

const field = document.getElementById('field') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLCanvasElement;
const panel = document.getElementById('panel') as HTMLDivElement;

const synoptic = createSynoptic(field);
const otx = overlay.getContext('2d');

if (!synoptic || !otx) {
  const hint = document.createElement('p');
  hint.className = 'hud';
  hint.style.top = '50%';
  hint.textContent = otx ? 'WEBGL2 REQUIRED' : 'CANVAS 2D REQUIRED';
  document.body.appendChild(hint);
  throw new Error('lab-globe: missing rendering context');
}

const tracker = createExtremaTracker();

/* ---------- sizing ---------- */

const dpr = Math.min(2, window.devicePixelRatio || 1);
let side = 0; // field canvas, CSS px
let R = 0; // sphere radius, device px
let OW = 0;
let OH = 0; // overlay, device px

const fit = (): void => {
  side = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.92);
  field.style.width = `${side}px`;
  field.style.height = `${side}px`;
  synoptic.fit(Math.round(side * dpr));
  R = side * dpr * 0.39;
  OW = overlay.width = Math.round(window.innerWidth * dpr);
  OH = overlay.height = Math.round(window.innerHeight * dpr);
};
fit();
window.addEventListener('resize', fit);

/* ---------- state ---------- */

let spin = (-19 * Math.PI) / 180; /* QTH hemisphere faces the camera */
let tilt = 0.3;
let yaw = 0;
let tiltTarget = 0.3;
let yawTarget = 0;
let fieldTime = 0;
let frozen = false;
let seek = 0;
let seekOn = false;
let last = performance.now();
let lastScan = 0;

window.addEventListener(
  'mousemove',
  (e: MouseEvent) => {
    tiltTarget = 0.3 + (e.clientY / window.innerHeight - 0.5) * 0.4;
    yawTarget = (e.clientX / window.innerWidth - 0.5) * 0.6;
  },
  { passive: true },
);

/* world (lat/lon, deg) -> view space; same rotations the shader inverts */
interface P3 {
  x: number;
  y: number;
  z: number;
}

const project = (latDeg: number, lonDeg: number): P3 => {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180 + spin + yaw;
  const cl = Math.cos(lat);
  const x = cl * Math.sin(lon);
  const y = Math.sin(lat);
  const z = cl * Math.cos(lon);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  return { x, y: y * ct - z * st, z: y * st + z * ct };
};

/* ---------- overlay: crosshair, H/L, QTH ---------- */

const drawOverlay = (jx: number, jy: number): void => {
  otx.clearRect(0, 0, OW, OH);
  const cx = OW / 2 + jx;
  const cy = OH / 2 + jy;
  const ink = seekOn ? '255, 176, 0' : '230, 242, 230';
  const acc = seekOn ? '255, 176, 0' : '51, 255, 102';

  /* crosshair: thin horizontal axis through the disc, ticks beyond the limb */
  otx.lineWidth = dpr;
  otx.strokeStyle = `rgba(${ink}, 0.18)`;
  otx.beginPath();
  otx.moveTo(cx - R * 1.4, cy);
  otx.lineTo(cx + R * 1.4, cy);
  otx.stroke();

  otx.strokeStyle = `rgba(${ink}, 0.55)`;
  const g = 10 * dpr;
  const t = 14 * dpr;
  for (const [x1, y1, x2, y2] of [
    [cx, cy - R - g - t, cx, cy - R - g],
    [cx, cy + R + g, cx, cy + R + g + t],
    [cx - R - g - t, cy, cx - R - g, cy],
    [cx + R + g, cy, cx + R + g + t, cy],
  ] as const) {
    otx.beginPath();
    otx.moveTo(x1, y1);
    otx.lineTo(x2, y2);
    otx.stroke();
  }

  /* H/L pressure centres — only on the near side, clear of the limb */
  const fs = Math.max(14 * dpr, R * 0.085);
  for (const l of tracker.labels()) {
    const p = project(l.lat, l.lon);
    if (p.z < 0.18) continue;
    if (Math.hypot(p.x, p.y) > 0.8) continue;
    const sx = cx + p.x * R;
    const sy = cy - p.y * R;
    const a = Math.min(1, (p.z - 0.18) / 0.25);
    otx.textAlign = 'center';
    otx.font = `700 ${fs}px 'Space Mono', monospace`;
    otx.fillStyle = `rgba(${ink}, ${0.95 * a})`;
    otx.fillText(l.kind, sx, sy);
    otx.font = `${fs * 0.45}px 'Space Mono', monospace`;
    otx.fillStyle = `rgba(${acc}, ${0.8 * a})`;
    otx.fillText(String(l.val), sx, sy + fs * 0.62);
  }

  /* QTH beacon — Poland, 52N 19E, same as the production globe */
  const qth = project(52, 19);
  if (qth.z > 0) {
    const sx = cx + qth.x * R;
    const sy = cy - qth.y * R;
    otx.fillStyle = `rgba(${acc}, 0.95)`;
    otx.beginPath();
    otx.arc(sx, sy, 3 * dpr, 0, Math.PI * 2);
    otx.fill();
    otx.textAlign = 'left';
    otx.font = `${10 * dpr}px 'Space Mono', monospace`;
    otx.fillStyle = `rgba(${acc}, 0.75)`;
    otx.fillText('QTH', sx + 8 * dpr, sy - 6 * dpr);
  }
};

/* ---------- control panel ---------- */

type Spec = readonly [keyof Params, string, number, number, number];

const SPEC: readonly Spec[] = [
  ['scale', 'FIELD SCALE', 1, 5, 0.05],
  ['levels', 'CONTOUR LEVELS', 6, 30, 1],
  ['speed', 'MORPH SPEED', 0, 0.3, 0.005],
  ['spinSpeed', 'SPIN', 0, 0.01, 0.0002],
  ['lineAlpha', 'LINE', 0.2, 1, 0.02],
  ['gratAlpha', 'GRATICULE', 0, 0.2, 0.005],
  ['dash', 'DASH DUTY', 0, 1, 0.05],
];

const save = (): void => localStorage.setItem(STORE, JSON.stringify(params));
const outputs = new Map<keyof Params, HTMLOutputElement>();
const inputs = new Map<keyof Params, HTMLInputElement>();

const fpsEl = document.createElement('div');
fpsEl.className = 'fps';
fpsEl.textContent = '-- FPS';
panel.appendChild(fpsEl);

for (const [key, label, min, max, step] of SPEC) {
  const row = document.createElement('div');
  row.className = 'row';
  const lab = document.createElement('label');
  lab.textContent = label;
  const out = document.createElement('output');
  const inp = document.createElement('input');
  inp.type = 'range';
  inp.min = String(min);
  inp.max = String(max);
  inp.step = String(step);
  inp.value = String(params[key]);
  out.textContent = String(params[key]);
  inp.addEventListener('input', () => {
    params[key] = Number(inp.value);
    out.textContent = inp.value;
    save();
  });
  outputs.set(key, out);
  inputs.set(key, inp);
  row.append(lab, out, inp);
  panel.appendChild(row);
}

const btns = document.createElement('div');
btns.className = 'btns';
const seekBtn = document.createElement('button');
seekBtn.textContent = 'SEEK';
const freezeBtn = document.createElement('button');
freezeBtn.textContent = 'FREEZE';
const resetBtn = document.createElement('button');
resetBtn.textContent = 'RESET';
btns.append(seekBtn, freezeBtn, resetBtn);
panel.appendChild(btns);

const toggleSeek = (): void => {
  seekOn = !seekOn;
  seekBtn.classList.toggle('on', seekOn);
};
const toggleFreeze = (): void => {
  frozen = !frozen;
  freezeBtn.classList.toggle('on', frozen);
};

seekBtn.addEventListener('click', toggleSeek);
freezeBtn.addEventListener('click', toggleFreeze);
resetBtn.addEventListener('click', () => {
  Object.assign(params, DEFAULTS);
  for (const [key] of SPEC) {
    const inp = inputs.get(key);
    const out = outputs.get(key);
    if (inp) inp.value = String(params[key]);
    if (out) out.textContent = String(params[key]);
  }
  save();
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'h' || e.key === 'H') panel.classList.toggle('hidden');
  if (e.key === 's' || e.key === 'S') toggleSeek();
  if (e.key === ' ') {
    e.preventDefault();
    toggleFreeze();
  }
});

/* ---------- frame loop ---------- */

let frames = 0;
let fpsT = performance.now();

const frame = (): void => {
  requestAnimationFrame(frame);
  if (document.hidden) return;

  const now = performance.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (!reducedMotion) spin += params.spinSpeed;
  if (!frozen && !reducedMotion) fieldTime += dt * params.speed;
  tilt += (tiltTarget - tilt) * 0.04;
  yaw += (yawTarget - yaw) * 0.04;
  seek += ((seekOn ? 1 : 0) - seek) * 0.15;

  /* SEEK shakes the whole instrument, like the production globe */
  const jx = seekOn ? (Math.random() - 0.5) * 5 * dpr : 0;
  const jy = seekOn ? (Math.random() - 0.5) * 5 * dpr : 0;
  field.style.translate = `calc(-50% + ${jx / dpr}px) calc(-50% + ${jy / dpr}px)`;

  const opts: SynopticDrawOpts = {
    radius: R,
    time: fieldTime,
    spin: spin + yaw,
    tilt,
    scale: params.scale,
    levels: params.levels,
    lineAlpha: params.lineAlpha,
    gratAlpha: params.gratAlpha,
    dash: params.dash,
    seek,
    alpha: 1,
  };
  synoptic.draw(opts);

  if (now - lastScan > 250) {
    lastScan = now;
    tracker.scan(params.scale, fieldTime, now);
  }
  drawOverlay(jx, jy);

  frames++;
  if (now - fpsT > 1000) {
    fpsEl.textContent = `${frames} FPS`;
    frames = 0;
    fpsT = now;
  }
};

requestAnimationFrame(frame);
