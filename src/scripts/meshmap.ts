/* ============================================================
   Network map — the constellation backdrop, shared by the
   production film (main.ts) and the tuning lab (lab-mesh.ts).

   A dense triangulated fabric of wandering points with the
   projects as labelled stations woven in. The fabric is
   re-woven (Delaunay) from live positions every WEAVE_MS so it
   stays planar — no crossing lines — while everything drifts;
   topology changes crossfade instead of popping. Navigation is
   a camera flight: pull back over the constellation, dive into
   the next station. Canvas 2D, zero deps.

   Station positions are DESIGNED (hand-placed anchors), the
   ambient scatter is deterministic (seeded). Labelled edges are
   real relationships from the project history.
   ============================================================ */

import { projects, statusColor, type Project } from '../data/projects';

/* ---------- tunables ---------- */

export interface MeshParams {
  focusZoom: number; // camera zoom when tuned to a node
  overviewZoom: number; // camera zoom at full-mesh view
  flightMs: number; // cut duration
  dip: number; // mid-flight zoom-out (0 = straight dolly)
  wobble: number; // micro-shimmer amplitude, world units
  wobbleSpeed: number; // shimmer tempo
  drift: number; // constant wander speed, world units / s
  repel: number; // cursor magnetism radius effect, world units
  mesh: number; // fabric line alpha
  density: number; // ambient point count
  grid: number; // background dot-grid alpha
  mode: number; // 0 = bg fabric, 1 = station web (all-to-all), 2 = both
}

/* the look approved in the lab */
export const MESH_DEFAULTS: MeshParams = {
  focusZoom: 2.75,
  overviewZoom: 1.025,
  flightMs: 1050,
  dip: 0.25,
  wobble: 11,
  wobbleSpeed: 4,
  drift: 7,
  repel: 12,
  mesh: 0.1,
  density: 200,
  grid: 0.2,
  mode: 2,
};

export const MESH_MODES = ['BG FABRIC', 'STATION WEB', 'BOTH'] as const;

/* ---------- the stations ---------- */

interface NodeDef {
  id: string;
  title: string;
  freq: string; // the value in the box — real scene frequencies
  x: number; // world anchor (designed, not computed)
  y: number;
  proj?: Project; // project nodes carry their data for the placard
}

const byId = new Map(projects.map((p) => [p.id, p]));

/* anchors are tuned for the OVERVIEW composition (the brief text block
   occupies world rect x[-620..80], y[-185..105] at the overview camera) —
   focus scenes frame stations camera-relative, so anchors are free */
const NODES: NodeDef[] = [
  { id: 'home', title: 'QTH', freq: '433.920 MHZ', x: -480, y: -290 },
  { id: 'zephyr', title: 'ZEPHYR', freq: '433.920 MHZ', x: -40, y: -320, proj: byId.get('zephyr') },
  { id: 'pager', title: 'PAGER', freq: '2.412 GHZ', x: 200, y: 30, proj: byId.get('pager') },
  { id: 'longwave', title: 'LONGWAVE', freq: '434.540 MHZ', x: 330, y: -300, proj: byId.get('longwave') },
  { id: 'sensorlab', title: 'SENSOR LAB', freq: '400.00 KHZ', x: -110, y: 210, proj: byId.get('sensorlab') },
  { id: 'meta', title: 'MIKO WORKS', freq: '98.800 MHZ', x: 210, y: 290, proj: byId.get('meta') },
  { id: 'log', title: 'LOG', freq: '77.500 KHZ', x: 430, y: 250 },
  { id: 'contact', title: 'CONTACT', freq: '1.420 GHZ', x: 540, y: -80 },
];

interface EdgeDef {
  a: string;
  b: string;
  label: string;
  dashed?: boolean;
}

/* real relationships — labelled story links drawn over the fabric */
const EDGES: EdgeDef[] = [
  { a: 'home', b: 'zephyr', label: 'LORA UPLINK' },
  { a: 'home', b: 'pager', label: 'ESP-NOW' },
  { a: 'home', b: 'meta', label: 'ON AIR' },
  { a: 'zephyr', b: 'longwave', label: '1.8 KM AIR GAP' },
  { a: 'zephyr', b: 'sensorlab', label: 'BME680 BRING-UP' },
  { a: 'pager', b: 'sensorlab', label: 'PROTO BENCH' },
  { a: 'meta', b: 'log', label: 'TRANSMISSION LOG' },
  { a: 'log', b: 'contact', label: 'DCF77 SYNC', dashed: true },
  { a: 'contact', b: 'home', label: 'QSL CARD', dashed: true },
];

/* the story — scene order for navigation */
const STORY = ['home', 'zephyr', 'pager', 'longwave', 'sensorlab', 'meta', 'log', 'contact'];

const nodeIdx = new Map(NODES.map((n, i) => [n.id, i]));
const edgePairs = EDGES.map((e) => [nodeIdx.get(e.a)!, nodeIdx.get(e.b)!] as const);

/* the full station web: every pair not already covered by a story edge */
const storyKeys = new Set(edgePairs.map(([a, b]) => (a < b ? `${a},${b}` : `${b},${a}`)));
const webPairs: Array<readonly [number, number]> = [];
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    if (!storyKeys.has(`${i},${j}`)) webPairs.push([i, j]);
  }
}

/* fabric bounds — scatter region and the walls the wander bounces off */
const X0 = -1500;
const X1 = 1560;
const Y0 = -960;
const Y1 = 1010;

/* how far a station may roam from its designed anchor */
const LEASH = 70;

/* re-weave cadence */
const WEAVE_MS = 400;

/* ---------- helpers ---------- */

/* deterministic PRNG — same constellation on every load */
const mulberry32 = (seed: number) => (): number => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* Bowyer–Watson Delaunay; returns deduped edges as point-index pairs */
const delaunayEdges = (ps: ReadonlyArray<{ x: number; y: number }>): Array<[number, number]> => {
  const n = ps.length;
  const xs = ps.map((p) => p.x);
  const ys = ps.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) * 10;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  /* super-triangle vertices appended after the real points */
  const vx = [...xs, cx - span, cx + span, cx];
  const vy = [...ys, cy - span * 0.6, cy - span * 0.6, cy + span];

  interface Tri {
    a: number;
    b: number;
    c: number;
    ux: number; // circumcenter
    uy: number;
    r2: number; // circumradius²
  }

  const mkTri = (a: number, b: number, c: number): Tri => {
    const ax = vx[a]!;
    const ay = vy[a]!;
    const bx = vx[b]!;
    const by = vy[b]!;
    const cx2 = vx[c]!;
    const cy2 = vy[c]!;
    const d = 2 * (ax * (by - cy2) + bx * (cy2 - ay) + cx2 * (ay - by));
    const ux =
      ((ax * ax + ay * ay) * (by - cy2) +
        (bx * bx + by * by) * (cy2 - ay) +
        (cx2 * cx2 + cy2 * cy2) * (ay - by)) /
      d;
    const uy =
      ((ax * ax + ay * ay) * (cx2 - bx) +
        (bx * bx + by * by) * (ax - cx2) +
        (cx2 * cx2 + cy2 * cy2) * (bx - ax)) /
      d;
    return { a, b, c, ux, uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 };
  };

  let tris: Tri[] = [mkTri(n, n + 1, n + 2)];

  for (let i = 0; i < n; i++) {
    const px = vx[i]!;
    const py = vy[i]!;
    const bad: Tri[] = [];
    const keep: Tri[] = [];
    for (const t of tris) {
      ((px - t.ux) ** 2 + (py - t.uy) ** 2 < t.r2 ? bad : keep).push(t);
    }
    /* boundary = edges of the bad region that appear exactly once */
    const counts = new Map<string, [number, number]>();
    const once = new Map<string, [number, number]>();
    for (const t of bad) {
      for (const [a, b] of [
        [t.a, t.b],
        [t.b, t.c],
        [t.c, t.a],
      ] as const) {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        if (counts.has(key)) {
          once.delete(key);
        } else {
          counts.set(key, [a, b]);
          once.set(key, [a, b]);
        }
      }
    }
    tris = keep;
    for (const [a, b] of once.values()) tris.push(mkTri(a, b, i));
  }

  const edges = new Map<string, [number, number]>();
  for (const t of tris) {
    if (t.a >= n || t.b >= n || t.c >= n) continue; /* touches the super-triangle */
    for (const [a, b] of [
      [t.a, t.b],
      [t.b, t.c],
      [t.c, t.a],
    ] as const) {
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(key, a < b ? [a, b] : [b, a]);
    }
  }
  return [...edges.values()];
};

const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ---------- public API ---------- */

export interface MeshOpts {
  interactive?: boolean; // wheel/arrow nav, drag, click-to-fly (the lab)
  placard?: boolean; // focused station's datasheet lines (default = interactive)
  getSeek?: () => boolean; // film SEEK state -> everything goes amber
  onFrame?: (now: number) => void; // lab readouts / fps
  /* where the focused node parks, as viewport fractions off centre —
     the film offsets it into clear space so the station box never sits
     on top of the scene typography */
  focusOffset?: { x: number; y: number };
  /* film mode: while tuned in, neighbouring stations render as a dot +
     callsign only — the full datasheet box belongs to the focused one
     (anything else keeps colliding with the scene typography). The
     pulled-back overview still shows every box. */
  compactNeighbors?: boolean;
}

export interface MeshMap {
  storyLength: number;
  flyTo(storyIdx: number, park?: { x: number; y: number }): void;
  flyOverview(): void;
  jumpTo(storyIdx: number, park?: { x: number; y: number }): void; // instant, no flight
  rebuild(): void; // after a density change
  cam(): { x: number; y: number; z: number };
  currentIdx(): number;
  nodeInfo(storyIdx: number): { title: string; freq: string };
}

export const createMeshMap = (
  canvas: HTMLCanvasElement,
  params: MeshParams,
  opts: MeshOpts = {},
): MeshMap | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const interactive = opts.interactive ?? false;
  const placardOn = opts.placard ?? interactive;
  const getSeek = opts.getSeek ?? ((): boolean => false);
  const foX = opts.focusOffset?.x ?? 0;
  const foY = opts.focusOffset?.y ?? 0;

  /* accessibility: under prefers-reduced-motion the net holds still and
     camera flights become jumps (matters for the lab — the film never
     builds this layer when reduced motion is on) */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- fabric state ---------- */

  interface Pt {
    x: number;
    y: number;
    size: number; // ambient dot radius (0 for stations — they draw boxes)
    station?: number; // index into NODES
  }

  /* per-point live state: wander position + interactive offset with spring-back */
  interface PtState {
    wx: number; // accumulated wander, relative to the anchor
    wy: number;
    ox: number; // interaction offset (cursor repel / drag)
    oy: number;
    vx: number;
    vy: number;
  }

  interface FabricEdge {
    a: number;
    b: number;
    alpha: number;
    target: number;
  }

  let pts: Pt[] = [];
  let state: PtState[] = [];
  let posX: number[] = [];
  let posY: number[] = [];
  const fabricEdges = new Map<string, FabricEdge>();
  let lastWeave = 0;

  /* the fabric is re-woven from LIVE positions every WEAVE_MS, so the
     triangulation stays planar (no crossing lines) while the points
     wander; topology changes ease in and out instead of popping */
  const reweave = (): void => {
    const live = pts.map((p, i) => ({ x: posX[i] ?? p.x, y: posY[i] ?? p.y }));
    const fresh = delaunayEdges(live);
    for (const fe of fabricEdges.values()) fe.target = 0;
    for (const [a, b] of fresh) {
      const key = `${a},${b}`;
      const ex = fabricEdges.get(key);
      if (ex) {
        ex.target = 1;
      } else {
        fabricEdges.set(key, { a, b, alpha: 0, target: 1 });
      }
    }
  };

  const buildFabric = (): void => {
    const rnd = mulberry32(1987);
    /* stations first, so point index == station index */
    pts = NODES.map((n, i) => ({ x: n.x, y: n.y, size: 0, station: i }));

    /* best-candidate scatter: each new point lands as far from the
       others as 14 tries allow — even spacing without a grid. Bounds
       reach well past the stations: full-bleed at every camera pose. */
    while (pts.length < NODES.length + Math.round(params.density)) {
      let bx = 0;
      let by = 0;
      let bestD = -1;
      for (let c = 0; c < 14; c++) {
        const x = X0 + (X1 - X0) * rnd();
        const y = Y0 + (Y1 - Y0) * rnd();
        let dMin = 1e18;
        for (const p of pts) {
          const d = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (d < dMin) dMin = d;
        }
        if (dMin > bestD) {
          bestD = dMin;
          bx = x;
          by = y;
        }
      }
      pts.push({ x: bx, y: by, size: 0.9 + rnd() * 1.8 });
    }

    state = pts.map(() => ({ wx: 0, wy: 0, ox: 0, oy: 0, vx: 0, vy: 0 }));
    posX = pts.map((p) => p.x);
    posY = pts.map((p) => p.y);
    fabricEdges.clear();
    reweave();
    /* fresh weave starts fully visible — no fade-in on (re)build */
    for (const fe of fabricEdges.values()) fe.alpha = 1;
  };

  buildFabric();

  /* ---------- sizing ---------- */

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0;
  let H = 0;

  const fit = (): void => {
    W = canvas.width = Math.round(window.innerWidth * dpr);
    H = canvas.height = Math.round(window.innerHeight * dpr);
  };
  fit();
  window.addEventListener('resize', fit);

  /* ---------- camera ---------- */

  let camX = 0;
  let camY = 0;
  let camZ = params.overviewZoom;
  let current = 0; /* story index */

  interface Flight {
    t0: number;
    dur: number;
    fromX: number;
    fromY: number;
    fromZ: number;
    toX: number;
    toY: number;
    toZ: number;
    track: boolean; /* after arrival, follow the (wandering) station */
  }

  let flight: Flight | null = null;
  let settleT = 0; /* ms timestamp of last arrival — placard fade-in */
  let arrived = false; /* tuned to a station -> camera tracks it */

  /* world-space camera offset that parks the focused node off centre;
     callers may override the spot per flight (the film parks per scene) */
  let parkX = foX;
  let parkY = foY;
  const offW = (z: number): { x: number; y: number } => ({
    x: (parkX * (W / dpr)) / z,
    y: (parkY * (H / dpr)) / z,
  });

  const flyTo = (storyIdx: number, park?: { x: number; y: number }): void => {
    const idx = ((storyIdx % STORY.length) + STORY.length) % STORY.length;
    const ni = nodeIdx.get(STORY[idx]!)!;
    current = idx;
    arrived = false;
    parkX = park?.x ?? foX;
    parkY = park?.y ?? foY;
    const off = offW(params.focusZoom);
    flight = {
      t0: performance.now(),
      dur: reduced ? 1 : params.flightMs,
      fromX: camX,
      fromY: camY,
      fromZ: camZ,
      /* aim at the live position — the station is mid-wander */
      toX: (posX[ni] ?? NODES[ni]!.x) - off.x,
      toY: (posY[ni] ?? NODES[ni]!.y) - off.y,
      toZ: params.focusZoom,
      track: true,
    };
  };

  const flyOverview = (): void => {
    arrived = false;
    flight = {
      t0: performance.now(),
      dur: reduced ? 1 : params.flightMs,
      fromX: camX,
      fromY: camY,
      fromZ: camZ,
      toX: 40,
      toY: -10,
      toZ: params.overviewZoom,
      track: false,
    };
  };

  const jumpTo = (storyIdx: number, park?: { x: number; y: number }): void => {
    current = ((storyIdx % STORY.length) + STORY.length) % STORY.length;
    const ni = nodeIdx.get(STORY[current]!)!;
    flight = null;
    parkX = park?.x ?? foX;
    parkY = park?.y ?? foY;
    const off = offW(params.focusZoom);
    camX = (posX[ni] ?? NODES[ni]!.x) - off.x;
    camY = (posY[ni] ?? NODES[ni]!.y) - off.y;
    camZ = params.focusZoom;
    settleT = performance.now();
    arrived = true;
  };

  /* world <-> screen */
  const w2sX = (x: number): number => (x - camX) * camZ * dpr + W / 2;
  const w2sY = (y: number): number => (y - camY) * camZ * dpr + H / 2;
  const s2wX = (sx: number): number => (sx * dpr - W / 2) / (camZ * dpr) + camX;
  const s2wY = (sy: number): number => (sy * dpr - H / 2) / (camZ * dpr) + camY;

  /* ---------- input ---------- */

  let mouseWX = 1e9; /* far away until the mouse shows up */
  let mouseWY = 1e9;
  let hover = -1;
  let dragging = -1;
  let dragMoved = 0;
  let wheelLock = 0;

  window.addEventListener(
    'mousemove',
    (e: MouseEvent) => {
      mouseWX = s2wX(e.clientX);
      mouseWY = s2wY(e.clientY);
      if (dragging >= 0) {
        const n = NODES[dragging]!;
        const s = state[dragging]!;
        s.ox = mouseWX - n.x - s.wx;
        s.oy = mouseWY - n.y - s.wy;
        s.vx = 0;
        s.vy = 0;
        dragMoved++;
      }
    },
    { passive: true },
  );

  if (interactive) {
    canvas.addEventListener('mousedown', () => {
      if (hover >= 0) {
        dragging = hover;
        dragMoved = 0;
      }
    });

    window.addEventListener('mouseup', () => {
      if (dragging >= 0) {
        /* a clean click (no real drag) tunes into the station */
        if (dragMoved < 3) {
          const sIdx = STORY.indexOf(NODES[dragging]!.id);
          if (sIdx >= 0) flyTo(sIdx);
        }
        dragging = -1;
      }
    });

    window.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        const now = performance.now();
        if (now < wheelLock) return;
        if (Math.abs(e.deltaY) < 18) return;
        wheelLock = now + params.flightMs + 240; /* one flick = one cut */
        flyTo(current + (e.deltaY > 0 ? 1 : -1));
      },
      { passive: true },
    );

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') flyTo(current + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') flyTo(current - 1);
    });
  }

  /* ---------- simulation ---------- */

  const tickPoints = (t: number, dt: number): void => {
    /* reduced motion: no shimmer, no wander, no cursor magnetism */
    const wob = reduced ? 0 : params.wobble;
    const drift = reduced ? 0 : params.drift;
    const t1 = t * 0.001 * params.wobbleSpeed;
    const tw = t * 0.001;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      const s = state[i]!;

      if (dragging !== i) {
        /* cursor magnetism: nearby points lean away, gently */
        const dx = p.x + s.wx + s.ox - mouseWX;
        const dy = p.y + s.wy + s.oy - mouseWY;
        const d = Math.hypot(dx, dy);
        const RR = 140;
        let tx = 0;
        let ty = 0;
        if (d < RR && d > 0.001 && !reduced) {
          const push = ((RR - d) / RR) * params.repel;
          tx = (dx / d) * push;
          ty = (dy / d) * push;
        }
        /* damped spring toward the (usually zero) target offset */
        s.vx += (tx - s.ox) * 0.02 - s.vx * 0.12;
        s.vy += (ty - s.oy) * 0.02 - s.vy * 0.12;
        s.ox += s.vx;
        s.oy += s.vy;
      }

      /* endless wander: a heading that turns smoothly forever, walked
         at constant speed — the points travel, they never come home */
      const heading =
        i * 2.39996 +
        Math.sin(tw * 0.16 + i * 1.7) * 1.6 +
        Math.sin(tw * 0.071 + i * 0.9) * 1.1;
      s.wx += Math.cos(heading) * drift * dt;
      s.wy += Math.sin(heading) * drift * dt;

      if (p.station !== undefined) {
        /* stations roam on a loose leash around their designed anchor,
           so the composition (and the camera targets) hold together */
        const wd = Math.hypot(s.wx, s.wy);
        if (wd > LEASH) {
          const over = (wd - LEASH) / wd;
          s.wx -= s.wx * over * 0.03;
          s.wy -= s.wy * over * 0.03;
        }
      } else {
        /* ambient points bounce softly off the fabric walls */
        const ax = p.x + s.wx;
        const ay = p.y + s.wy;
        if (ax < X0) s.wx += (X0 - ax) * 0.04;
        if (ax > X1) s.wx += (X1 - ax) * 0.04;
        if (ay < Y0) s.wy += (Y0 - ay) * 0.04;
        if (ay > Y1) s.wy += (Y1 - ay) * 0.04;
      }

      /* micro-shimmer on top — high-frequency life */
      posX[i] =
        p.x +
        s.wx +
        s.ox +
        (Math.sin(t1 * 0.42 + i * 2.1) * 0.5 + Math.sin(t1 * 0.23 + i * 1.3) * 0.32) * wob;
      posY[i] =
        p.y +
        s.wy +
        s.oy +
        (Math.cos(t1 * 0.37 + i * 1.7) * 0.5 + Math.sin(t1 * 0.13 + i * 2.3) * 0.5) * wob;
    }
  };

  /* ---------- drawing ---------- */

  interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  const boxes: Box[] = NODES.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));

  const draw = (t: number): void => {
    ctx.clearRect(0, 0, W, H);

    /* SEEK: the whole instrument goes amber, like the rest of the HUD */
    const seek = getSeek();
    const INK = seek ? '255, 176, 0' : '230, 242, 230';
    const GREEN = seek ? '255, 176, 0' : '51, 255, 102';
    const DIM = seek ? '255, 176, 0' : '124, 138, 124';

    /* label scale: grows with zoom but tamed, so overview stays readable */
    const ls = Math.min(1.5, Math.max(0.85, Math.pow(camZ, 0.6))) * dpr;
    const fs = 11 * ls;

    /* ---- background dot grid (world-anchored: sells the camera) ---- */
    if (params.grid > 0.005) {
      const step = 80;
      const gx0 = Math.floor(s2wX(0) / step) * step;
      const gy0 = Math.floor(s2wY(0) / step) * step;
      const gx1 = s2wX(W / dpr);
      const gy1 = s2wY(H / dpr);
      ctx.fillStyle = `rgba(${INK}, ${params.grid})`;
      for (let gx = gx0; gx <= gx1; gx += step) {
        for (let gy = gy0; gy <= gy1; gy += step) {
          ctx.fillRect(w2sX(gx), w2sY(gy), dpr, dpr);
        }
      }
    }

    const bgFabric = params.mode !== 1;
    const stationWeb = params.mode >= 1;
    const curI = nodeIdx.get(STORY[current]!)!;

    /* ---- the fabric: live-woven triangulation, planar by construction ---- */
    ctx.lineWidth = dpr;
    if (bgFabric) {
      const meshA = params.mesh * (params.mode === 2 ? 0.7 : 1);
      for (const [key, fe] of fabricEdges) {
        fe.alpha += (fe.target - fe.alpha) * 0.07;
        if (fe.target === 0 && fe.alpha < 0.02) {
          fabricEdges.delete(key);
          continue;
        }
        if (fe.alpha < 0.02) continue;
        ctx.strokeStyle = `rgba(${INK}, ${meshA * fe.alpha})`;
        ctx.beginPath();
        ctx.moveTo(w2sX(posX[fe.a]!), w2sY(posY[fe.a]!));
        ctx.lineTo(w2sX(posX[fe.b]!), w2sY(posY[fe.b]!));
        ctx.stroke();
      }
    }

    /* ---- station web: every station wired to every other ---- */
    if (stationWeb) {
      for (const [ai, bi] of webPairs) {
        const touched = ai === hover || bi === hover || ai === curI || bi === curI;
        ctx.strokeStyle = `rgba(${INK}, ${touched ? 0.4 : 0.16})`;
        ctx.beginPath();
        ctx.moveTo(w2sX(posX[ai]!), w2sY(posY[ai]!));
        ctx.lineTo(w2sX(posX[bi]!), w2sY(posY[bi]!));
        ctx.stroke();
      }
    }

    /* ---- story edges: the labelled, meaningful links on top ---- */
    for (let e = 0; e < EDGES.length; e++) {
      const def = EDGES[e]!;
      const [ai, bi] = edgePairs[e]!;
      const ax = w2sX(posX[ai]!);
      const ay = w2sY(posY[ai]!);
      const bx = w2sX(posX[bi]!);
      const by = w2sY(posY[bi]!);

      const touched = ai === hover || bi === hover || ai === curI || bi === curI;
      ctx.strokeStyle = `rgba(${INK}, ${touched ? 0.55 : 0.28})`;
      if (def.dashed) ctx.setLineDash([4 * dpr, 7 * dpr]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);

      /* link captions appear when close to the action */
      if (camZ > 1.15 && touched) {
        ctx.font = `${9 * ls}px 'Space Mono', monospace`;
        ctx.fillStyle = `rgba(${DIM}, 0.85)`;
        ctx.textAlign = 'center';
        ctx.fillText(def.label, (ax + bx) / 2, (ay + by) / 2 - 6 * ls);
      }
    }

    /* ---- ambient points: the anonymous dots of the net ---- */
    if (bgFabric) {
      const dotScale = Math.max(0.8, Math.sqrt(camZ)) * dpr;
      const dotDim = params.mode === 2 ? 0.7 : 1;
      for (let i = NODES.length; i < pts.length; i++) {
        const p = pts[i]!;
        ctx.fillStyle = `rgba(${INK}, ${(0.3 + p.size * 0.2) * dotDim})`;
        ctx.beginPath();
        ctx.arc(w2sX(posX[i]!), w2sY(posY[i]!), p.size * dotScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* ---- stations: chip + bordered label box ---- */
    hover = -1;
    const mx = w2sX(mouseWX);
    const my = w2sY(mouseWY);
    /* tuned-in film view: only the focused station gets the full box */
    const compactOn =
      (opts.compactNeighbors ?? false) && camZ > params.overviewZoom * 1.4;

    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i]!;
      const sx = w2sX(posX[i]!);
      const sy = w2sY(posY[i]!);
      const isCur = i === curI;

      if (compactOn && !isCur) {
        /* ambient neighbour: dot + callsign, no datasheet box */
        const cfs = fs * 0.85;
        ctx.fillStyle = `rgba(${GREEN}, 0.6)`;
        ctx.fillRect(sx - 1.5 * dpr, sy - 1.5 * dpr, 3 * dpr, 3 * dpr);
        ctx.textAlign = 'left';
        ctx.font = `700 ${cfs}px 'Space Mono', monospace`;
        ctx.fillStyle = `rgba(${DIM}, 0.75)`;
        ctx.fillText(n.title, sx + 8 * ls, sy + cfs * 0.35);
        boxes[i] = { x: sx, y: sy - cfs, w: 8 * ls + ctx.measureText(n.title).width, h: cfs * 2 };
        continue;
      }

      ctx.font = `700 ${fs}px 'Space Mono', monospace`;
      const tw = ctx.measureText(n.title).width;
      ctx.font = `${fs * 0.85}px 'Space Mono', monospace`;
      const fw = ctx.measureText(n.freq).width;

      const chip = 9 * ls;
      const padX = 7 * ls;
      /* project nodes get extra width so the status dot clears the title */
      const bw = chip + padX * 2.5 + Math.max(tw, fw) + (n.proj ? 12 * ls : 0);
      const bh = fs * 2.6;
      const bx = sx + 12 * ls; /* box hangs right of the point */
      const by = sy - bh / 2;
      boxes[i] = { x: bx, y: by, w: bw, h: bh };

      const isHover =
        (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) ||
        Math.hypot(mx - sx, my - sy) < 18 * ls;
      if (isHover) hover = i;

      /* the point itself + leader to the box */
      ctx.fillStyle = `rgba(${GREEN}, ${isCur || isHover ? 1 : 0.7})`;
      ctx.fillRect(sx - 1.5 * dpr, sy - 1.5 * dpr, 3 * dpr, 3 * dpr);
      ctx.strokeStyle = `rgba(${INK}, 0.35)`;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(bx, sy);
      ctx.stroke();

      /* box: hairline border, green chip, title + freq */
      ctx.fillStyle = 'rgba(11, 13, 11, 0.82)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = isCur
        ? `rgba(${GREEN}, 0.9)`
        : `rgba(${INK}, ${isHover ? 0.6 : 0.28})`;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = `rgba(${GREEN}, 0.95)`;
      ctx.fillRect(bx + padX * 0.7, by + (bh - chip) / 2, chip, chip);

      ctx.textAlign = 'left';
      ctx.font = `700 ${fs}px 'Space Mono', monospace`;
      ctx.fillStyle = `rgba(${INK}, 0.95)`;
      ctx.fillText(n.title, bx + chip + padX * 1.4, by + bh * 0.42);
      ctx.font = `${fs * 0.85}px 'Space Mono', monospace`;
      ctx.fillStyle = `rgba(${GREEN}, 0.8)`;
      ctx.fillText(n.freq, bx + chip + padX * 1.4, by + bh * 0.82);

      /* status dot for project nodes — the existing site convention */
      if (n.proj) {
        ctx.fillStyle = statusColor[n.proj.status];
        ctx.beginPath();
        ctx.arc(bx + bw - 8 * ls, by + 8 * ls, 2.5 * ls, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* ---- placard: the focused station's datasheet line (lab only —
       in the film the scene content itself is the detail) ---- */
    if (placardOn) {
      const n = NODES[curI]!;
      const settled = !flight && camZ > params.focusZoom * 0.8;
      const pa = settled ? Math.min(1, (t - settleT) / 400) : 0;
      if (pa > 0.01 && n.proj) {
        const px = w2sX(posX[curI]!) + 12 * ls;
        const py = w2sY(posY[curI]!) + boxes[curI]!.h / 2 + 10 * ls;
        ctx.textAlign = 'left';
        ctx.font = `${fs * 0.85}px 'Space Mono', monospace`;
        ctx.fillStyle = `rgba(${DIM}, ${0.9 * pa})`;
        ctx.fillText(n.proj.subtitle, px, py + fs);
        ctx.fillStyle = `rgba(${INK}, ${0.7 * pa})`;
        ctx.fillText(`${n.proj.year} — ${n.proj.role}`, px, py + fs * 2.2);
        ctx.fillStyle = `rgba(${GREEN}, ${0.8 * pa})`;
        ctx.fillText(`${n.proj.partNo} · ${n.proj.status}`, px, py + fs * 3.4);
      }
    }
  };

  /* ---------- frame loop ---------- */

  let lastFrameT = performance.now();

  const frame = (): void => {
    requestAnimationFrame(frame);
    if (document.hidden) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrameT) / 1000);
    lastFrameT = now;

    if (flight) {
      const p = Math.min(1, (now - flight.t0) / flight.dur);
      const e = easeInOut(p);
      camX = flight.fromX + (flight.toX - flight.fromX) * e;
      camY = flight.fromY + (flight.toY - flight.fromY) * e;
      /* the dip: pull back mid-flight so the whole mesh flashes by */
      const z = flight.fromZ + (flight.toZ - flight.fromZ) * e;
      camZ = z * (1 - params.dip * Math.sin(Math.PI * p));
      if (p >= 1) {
        arrived = flight.track;
        flight = null;
        settleT = now;
      }
    } else if (arrived) {
      /* the station keeps wandering — the camera quietly stays with it,
         holding the node at its designed off-centre parking spot */
      const ci = nodeIdx.get(STORY[current]!)!;
      const off = offW(camZ);
      camX += ((posX[ci] ?? camX + off.x) - off.x - camX) * 0.05;
      camY += ((posY[ci] ?? camY + off.y) - off.y - camY) * 0.05;
    }

    tickPoints(now, dt);
    if (now - lastWeave > WEAVE_MS) {
      lastWeave = now;
      reweave();
    }
    draw(now);

    opts.onFrame?.(now);
  };

  requestAnimationFrame(frame);

  return {
    storyLength: STORY.length,
    flyTo,
    flyOverview,
    jumpTo,
    rebuild: buildFabric,
    cam: () => ({ x: camX, y: camY, z: camZ }),
    currentIdx: () => current,
    nodeInfo: (idx: number) => {
      const n = NODES[nodeIdx.get(STORY[((idx % STORY.length) + STORY.length) % STORY.length]!)!]!;
      return { title: n.title, freq: n.freq };
    },
  };
};
