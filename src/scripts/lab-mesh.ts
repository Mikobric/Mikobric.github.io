/* ============================================================
   LAB — network map tuning page.
   The actual engine (fabric, wander, camera flights, drawing)
   lives in meshmap.ts, shared with the production film. This
   file is just the sandbox: sliders, mode/overview buttons,
   readouts, deep links.
   ============================================================ */

import { MESH_DEFAULTS, MESH_MODES, createMeshMap, type MeshParams } from './meshmap';

const STORE = 'lab-mesh-params-v2';

const params: MeshParams = { ...MESH_DEFAULTS };
try {
  Object.assign(params, JSON.parse(localStorage.getItem(STORE) ?? '{}'));
} catch {
  /* stale storage — defaults win */
}

/* ---------- setup ---------- */

const canvas = document.getElementById('mesh') as HTMLCanvasElement;
const camReadout = document.getElementById('cam-readout');
const nodeReadout = document.getElementById('node-readout');
const panel = document.getElementById('panel') as HTMLDivElement;

const fpsEl = document.createElement('div');
fpsEl.className = 'fps';
fpsEl.textContent = '-- FPS';
panel.appendChild(fpsEl);

/* ---------- readouts + fps, fed by the engine's frame loop ---------- */

let frames = 0;
let fpsT = performance.now();

const onFrame = (now: number): void => {
  if (camReadout) {
    const c = mm.cam();
    camReadout.textContent = `CAM ${String(Math.round(c.x)).padStart(5, '0')},${String(
      Math.round(c.y),
    ).padStart(5, '0')} ×${c.z.toFixed(2)}`;
  }
  if (nodeReadout) {
    const idx = mm.currentIdx();
    const n = mm.nodeInfo(idx);
    nodeReadout.textContent = `LINK ${String(idx + 1).padStart(2, '0')}/${String(
      mm.storyLength,
    ).padStart(2, '0')} — ${n.title} · ${n.freq}`;
  }
  frames++;
  if (now - fpsT > 1000) {
    fpsEl.textContent = `${frames} FPS`;
    frames = 0;
    fpsT = now;
  }
};

const maybe = createMeshMap(canvas, params, { interactive: true, placard: true, onFrame });
if (!maybe) throw new Error('lab-mesh: no 2d context');
const mm = maybe;

/* ---------- control panel ---------- */

type Spec = readonly [keyof MeshParams, string, number, number, number];

const SPEC: readonly Spec[] = [
  ['focusZoom', 'FOCUS ZOOM', 1.2, 3.5, 0.05],
  ['overviewZoom', 'OVERVIEW ZOOM', 0.4, 1.2, 0.025],
  ['flightMs', 'FLIGHT MS', 400, 2200, 50],
  ['dip', 'FLIGHT DIP', 0, 0.6, 0.025],
  ['wobble', 'SHIMMER', 0, 30, 0.5],
  ['wobbleSpeed', 'SHIMMER SPEED', 0.2, 4, 0.1],
  ['drift', 'DRIFT SPEED', 0, 30, 0.5],
  ['repel', 'CURSOR REPEL', 0, 60, 2],
  ['mesh', 'MESH', 0, 0.4, 0.01],
  ['density', 'POINTS', 100, 500, 20],
  ['grid', 'GRID', 0, 0.2, 0.005],
];

const save = (): void => localStorage.setItem(STORE, JSON.stringify(params));
const outputs = new Map<keyof MeshParams, HTMLOutputElement>();
const inputs = new Map<keyof MeshParams, HTMLInputElement>();

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
    if (key === 'density') mm.rebuild(); /* re-weave the net */
    save();
  });
  outputs.set(key, out);
  inputs.set(key, inp);
  row.append(lab, out, inp);
  panel.appendChild(row);
}

const btns = document.createElement('div');
btns.className = 'btns';
const modeBtn = document.createElement('button');
const modeLabel = (): string => `MODE: ${MESH_MODES[params.mode] ?? MESH_MODES[0]}`;
modeBtn.textContent = modeLabel();
const overviewBtn = document.createElement('button');
overviewBtn.textContent = 'OVERVIEW';
const resetBtn = document.createElement('button');
resetBtn.textContent = 'RESET';
btns.append(modeBtn, overviewBtn, resetBtn);
panel.appendChild(btns);

modeBtn.addEventListener('click', () => {
  params.mode = (params.mode + 1) % MESH_MODES.length;
  modeBtn.textContent = modeLabel();
  save();
});

overviewBtn.addEventListener('click', () => mm.flyOverview());

resetBtn.addEventListener('click', () => {
  Object.assign(params, MESH_DEFAULTS);
  modeBtn.textContent = modeLabel();
  for (const [key] of SPEC) {
    const inp = inputs.get(key);
    const out = outputs.get(key);
    if (inp) inp.value = String(params[key]);
    if (out) out.textContent = String(params[key]);
  }
  mm.rebuild();
  save();
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'h' || e.key === 'H') panel.classList.toggle('hidden');
});

/* deep links for testing: /mesh?node=3 lands tuned to a story index,
   /mesh?mode=1 forces a display mode */
const qs = new URLSearchParams(window.location.search);
const qMode = Number(qs.get('mode'));
if (qs.has('mode') && Number.isFinite(qMode)) {
  params.mode = ((Math.round(qMode) % MESH_MODES.length) + MESH_MODES.length) % MESH_MODES.length;
  modeBtn.textContent = modeLabel();
}
const jump = Number(qs.get('node'));
if (qs.has('node') && Number.isFinite(jump)) {
  mm.jumpTo(Math.round(jump));
}
