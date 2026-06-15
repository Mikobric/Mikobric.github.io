import { FIELD_DEFAULTS, createSynoptic, createExtremaTracker } from './synoptic';
import { MESH_DEFAULTS, createMeshMap } from './meshmap';
import { revealElement, type RevealStyle } from './reveals';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- text decoder (the "hacker" effect) ---------- */

/* teletype noise: block glyphs + sync marks — the scramble reads as a
   tearing broadcast signal rather than a generic "hacker" effect */
const CHARS = '░▒▓█▌▐│┤<>=+·—01';

function decode(el: HTMLElement, duration = 800): void {
  const original = el.textContent ?? '';
  if (!original.trim() || reducedMotion) return;
  if (el.dataset.decoding === '1') return;
  el.dataset.decoding = '1';
  const start = performance.now();

  const tick = (now: number): void => {
    const p = Math.min(1, (now - start) / duration);
    const reveal = Math.floor(p * original.length);
    let out = original.slice(0, reveal);
    for (let i = reveal; i < original.length; i++) {
      const ch = original[i];
      out += ch === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    el.textContent = out;
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = original;
      delete el.dataset.decoding;
    }
  };
  requestAnimationFrame(tick);
}

/* hero lines — revealed staggered with the opening scene's style (flicker),
   fired on load or after the title card */
function runHeroDecode(): void {
  const heroStyle = (document.getElementById('top')?.dataset.reveal as RevealStyle) ?? 'flicker';
  document.querySelectorAll<HTMLElement>('[data-decode]').forEach((el) => {
    const delay = Number(el.dataset.decodeDelay ?? 0);
    el.style.opacity = '0';
    revealElement(el, heroStyle, 150 + delay);
  });
}

/* ---------- header clock ---------- */

const clock = document.getElementById('clock');

function updateClock(): void {
  if (!clock) return;
  clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
}

updateClock();
setInterval(updateClock, 1000);

/* ---------- film engine ---------- */

const scenes = Array.from(document.querySelectorAll<HTMLElement>('.scene'));
const frameEl = document.querySelector<HTMLElement>('.hud .frame');
const nameEl = document.querySelector<HTMLElement>('.hud .name');
const freqEl = document.querySelector<HTMLElement>('.hud .freq');
const N = scenes.length;

const filmMode = !reducedMotion && N > 1;

if (!filmMode) {
  /* static fallback: everything visible, labels decode on scroll into view */
  document.getElementById('titlecard')?.remove();
  runHeroDecode();
  scenes.forEach((s) => s.classList.add('on'));
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        decode(entry.target as HTMLElement, 550);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.4 },
  );
  document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => io.observe(el));
} else {
  document.documentElement.classList.add('film-on');

  /* lighter cuts on touch / small screens: no displacement, no noise, no blur */
  const lite = window.matchMedia('(hover: none), (max-width: 760px)').matches;

  /* ---- easing ---- */
  const easeInOut = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const outExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const bell = (t: number): number => Math.sin(Math.PI * t);

  /* ---- SVG displacement rigs (analog picture tearing) ---- */
  interface Rig {
    turb: Element | null;
    map: Element | null;
    url: string;
  }

  const rig = (id: string): Rig => {
    const filter = document.getElementById(id);
    return {
      turb: filter?.querySelector('feTurbulence') ?? null,
      map: filter?.querySelector('feDisplacementMap') ?? null,
      url: `url(#${id})`,
    };
  };

  const rigIn = rig('disp-in');
  const rigOut = rig('disp-out');
  let seed = 7;
  let seedAt = 0;

  const displace = (r: Rig, fx: number, fy: number, scale: number): string => {
    if (lite || scale < 1 || !r.turb || !r.map) return '';
    /* regenerating turbulence every frame kills the frame rate — refresh
       the pattern at ~11 Hz, animate only the displacement scale */
    const now = performance.now();
    if (now - seedAt > 90) {
      seedAt = now;
      r.turb.setAttribute('baseFrequency', `${fx} ${fy}`);
      r.turb.setAttribute('seed', String((seed = (seed + 1) % 997)));
    }
    r.map.setAttribute('scale', scale.toFixed(1));
    return r.url;
  };

  /* ---- static-noise burst layer ---- */
  const noise = document.getElementById('noise') as HTMLCanvasElement | null;
  const noiseCtx = noise?.getContext('2d') ?? null;
  /* one reusable buffer — a fresh ImageData per frame is pure GC churn,
     and the collector would stall exactly when a cut is playing */
  const noiseImg = noiseCtx?.createImageData(160, 90) ?? null;

  const drawNoise = (alpha: number): void => {
    if (!noise || !noiseCtx || !noiseImg || lite) return;
    noise.style.opacity = alpha.toFixed(3);
    if (alpha <= 0.01) return;
    const d = noiseImg.data;
    for (let k = 0; k < d.length; k += 4) {
      const v = (Math.random() * 255) | 0;
      d[k] = v;
      d[k + 1] = v;
      d[k + 2] = v;
      d[k + 3] = 255;
    }
    noiseCtx.putImageData(noiseImg, 0, 0);
  };

  /* ---- scan beam ---- */
  const beam = document.getElementById('beam');

  /* ---- frequency readout jamming ---- */
  const jam = (s: string, p: number): string =>
    s.replace(/[0-9]/g, (ch) => (Math.random() < p ? String((Math.random() * 10) | 0) : ch));

  /* ---- tuner instruments: sliding dial, RSSI bars, lock status ---- */
  const dialStrip = document.getElementById('dial-strip');
  const rssiBars = Array.from(document.querySelectorAll<HTMLElement>('.rssi i'));
  const lockEl = document.querySelector<HTMLElement>('.hud .lock');
  const CH_W = 200;
  const DIAL_W = 340;

  const setDial = (pos: number, jitter = 0): void => {
    if (!dialStrip) return;
    const x = DIAL_W / 2 - (pos * CH_W + CH_W / 2) + jitter;
    dialStrip.style.transform = `translateX(${x.toFixed(1)}px)`;
  };

  const setRssi = (n: number): void => {
    rssiBars.forEach((bar, k) => bar.classList.toggle('on', k < n));
  };

  let seekingNow = false;

  /* after a cut lands, the needle overshoots past the channel and damps
     back — the little "catch" that sells locking onto a station */
  let settleRaf = 0;
  const settleDial = (pos: number, dir: number): void => {
    cancelAnimationFrame(settleRaf);
    const t0 = performance.now();
    const dur = 360;
    const tick = (now: number): void => {
      if (animating) return; /* a new cut owns the dial now */
      const t = Math.min(1, (now - t0) / dur);
      const damp = (1 - t) * (1 - t);
      setDial(pos, Math.sin(t * Math.PI * 2.5) * damp * -dir * 5);
      if (t < 1) settleRaf = requestAnimationFrame(tick);
    };
    settleRaf = requestAnimationFrame(tick);
  };

  const setLock = (tuned: boolean): void => {
    seekingNow = !tuned;
    if (lockEl) {
      lockEl.textContent = tuned ? 'TUNED' : 'SEEK';
      lockEl.classList.toggle('seeking', !tuned);
    }
    cursorEl?.classList.toggle('seeking', !tuned);
  };

  /* ---- custom cursor: scope reticle, wired into the tuner state ---- */

  const cursorEl = lite ? null : document.getElementById('cursor');
  const cursorDot = cursorEl?.querySelector<HTMLElement>('.c-dot') ?? null;
  const cursorRing = cursorEl?.querySelector<HTMLElement>('.c-ring') ?? null;

  if (cursorEl) {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let ringX = mx;
    let ringY = my;
    let ringRaf = false;

    const ringLoop = (): void => {
      ringX += (mx - ringX) * 0.16;
      ringY += (my - ringY) * 0.16;
      if (cursorRing) {
        cursorRing.style.translate = `${(ringX - mx).toFixed(1)}px ${(ringY - my).toFixed(1)}px`;
      }
      if (Math.abs(mx - ringX) + Math.abs(my - ringY) > 0.4) {
        requestAnimationFrame(ringLoop);
      } else {
        ringRaf = false;
      }
    };

    window.addEventListener(
      'mousemove',
      (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
        cursorEl.style.transform = `translate(${mx}px, ${my}px)`;
        cursorEl.classList.add('show');
        if (!ringRaf) {
          ringRaf = true;
          requestAnimationFrame(ringLoop);
        }
      },
      { passive: true },
    );

    /* ring tightens on interactive targets */
    document.addEventListener('mouseover', (e: MouseEvent) => {
      const hit = (e.target as Element | null)?.closest?.('a, button') ?? null;
      cursorEl.classList.toggle('is-link', hit !== null);
    });

    document.documentElement.addEventListener('mouseleave', () =>
      cursorEl.classList.remove('show'),
    );
    document.documentElement.addEventListener('mouseenter', () =>
      cursorEl.classList.add('show'),
    );
  }

  /* ---- the cuts: every swipe is a different way of losing the signal ---- */

  type Cut = (inc: HTMLElement, out: HTMLElement, f: number) => void;

  const cuts: Record<string, Cut> = {
    vroll: (inc, out, f) => {
      const e = easeInOut(f);
      inc.style.transform = `translateY(${(e - 1) * 100}%)`;
      inc.style.filter = displace(rigIn, 0.002, 0.6, 50 * bell(f));
      out.style.transform = `translateY(${e * 26}%)`;
      out.style.filter = `brightness(${1 - e * 0.5})`;
      drawNoise(bell(f) * 0.16);
    },

    swap: (inc, out, f) => {
      inc.style.opacity = String(Math.min(1, f * 1.5));
      inc.style.filter = displace(rigIn, 0.002, 0.9, 280 * (1 - f) * (1 - f));
      out.style.filter = `brightness(${1 - f * 0.7}) ${displace(rigOut, 0.002, 0.9, 240 * f * f)}`;
      drawNoise(bell(f) * 0.3);
    },

    sweep: (inc, out, f) => {
      const e = easeInOut(f);
      inc.style.clipPath = `inset(0 0 ${(1 - e) * 100}% 0)`;
      out.style.transform = `translateY(${e * 14}px)`;
      out.style.filter = `brightness(${1 - e * 0.45})`;
      if (beam) {
        beam.style.opacity = String(bell(f));
        beam.style.top = `${e * 100}%`;
        const p1 = inc.style.getPropertyValue('--p1') || 'var(--ink)';
        const p2 = inc.style.getPropertyValue('--p2') || 'var(--ink)';
        beam.style.background = `linear-gradient(90deg, ${p1}, ${p2})`;
      }
      drawNoise(bell(f) * 0.1);
    },

    collapse: (inc, out, f) => {
      if (f < 0.5) {
        const p = easeInOut(f / 0.5);
        inc.style.opacity = '0';
        out.style.transform = `scaleY(${Math.max(0.004, 1 - p)})`;
        out.style.filter = `brightness(${1 + p * 2})`;
      } else {
        const p = outExpo((f - 0.5) / 0.5);
        out.style.opacity = '0';
        inc.style.transform = `scaleY(${Math.max(0.004, p)})`;
        inc.style.filter = `brightness(${2.6 - 1.6 * p})`;
      }
      drawNoise(bell(f) * 0.22);
    },

    tear: (inc, out, f) => {
      const e = outExpo(f);
      const wob = (1 - f) * Math.sin(f * 16) * 36;
      inc.style.transform = `translateX(calc(${(1 - e) * 100}% + ${wob}px))`;
      inc.style.filter = displace(rigIn, 0.001, 0.12, 140 * bell(f));
      out.style.transform = `translateX(calc(${-e * 18}% + ${-wob * 0.4}px))`;
      out.style.filter = `brightness(${1 - e * 0.55})`;
      drawNoise(bell(f) * 0.18);
    },

    ghost: (inc, out, f) => {
      const settle = (1 - f) * (1 - f);
      const osc = settle * Math.sin(f * 26) * 64;
      inc.style.opacity = String(Math.min(1, f * 1.4));
      inc.style.transform = `translateX(${osc}px)`;
      inc.style.filter = displace(rigIn, 0.004, 0.3, 60 * settle);
      out.style.transform = `translateX(${-osc * 0.5}px)`;
      out.style.filter = `brightness(${1 - f * 0.6})`;
      drawNoise(bell(f) * 0.14);
    },

    roll: (inc, out, f) => {
      const e = easeInOut(f);
      inc.style.transform = `translateY(${(1 - e) * 100}%)`;
      out.style.transform = `translateY(${-e * 100}%)`;
      const blur = lite ? 0 : bell(f) * 6;
      if (blur > 0.2) {
        inc.style.filter = `blur(${blur.toFixed(1)}px)`;
        out.style.filter = `blur(${blur.toFixed(1)}px)`;
      }
    },

    carrier: (inc, out, f) => {
      if (f < 0.45) {
        inc.style.opacity = '0';
        out.style.filter = `brightness(${1 - easeInOut(f / 0.45)})`;
      } else if (f < 0.55) {
        inc.style.opacity = '0';
        out.style.filter = 'brightness(0)';
      } else {
        const p = (f - 0.55) / 0.45;
        out.style.opacity = '0';
        inc.style.opacity = String(Math.min(1, p * 1.3));
        inc.style.filter = `brightness(${0.2 + p * 0.8}) ${displace(rigIn, 0.002, 0.7, 50 * (1 - p))}`;
      }
      drawNoise(f > 0.3 && f < 0.7 ? 0.22 : bell(f) * 0.1);
    },
  };

  /* designed duration per cut, ms */
  const DUR: Record<string, number> = {
    vroll: 950,
    swap: 850,
    sweep: 1050,
    collapse: 1200,
    tear: 950,
    ghost: 1100,
    roll: 900,
    carrier: 1400,
  };

  const resetFx = (el: HTMLElement): void => {
    el.style.clipPath = '';
    el.style.transform = '';
    el.style.opacity = '';
    el.style.filter = '';
    el.style.removeProperty('--f');
  };

  /* ---- scene state ---- */

  let current = 0;
  let animating = false;

  const settleStates = (): void => {
    scenes.forEach((scene, idx) => {
      resetFx(scene);
      if (idx === current) scene.dataset.state = 'current';
      else delete scene.dataset.state;
    });
    drawNoise(0);
    if (beam) beam.style.opacity = '0';
  };

  const activate = (idx: number): void => {
    const scene = scenes[idx];
    if (!scene) return;
    if (frameEl) {
      frameEl.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    }
    const name = scene.dataset.name ?? '';
    if (nameEl && nameEl.textContent !== name) {
      /* fixed-width slot (CSS min-width) + a short crossfade — the rest of
         the tuner cluster must not move when the label changes mid-cut */
      nameEl.style.opacity = '0';
      setTimeout(() => {
        nameEl.textContent = name;
        nameEl.style.opacity = '';
      }, 75);
    }
    if (!scene.classList.contains('on')) {
      const style = (scene.dataset.reveal as RevealStyle) ?? 'rise';
      scene.classList.add('on');
      /* non-rise styles drive the big title from JS — neutralise the CSS mask */
      if (style !== 'rise') scene.classList.add('rv-js');
      scene.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el, i) => {
        el.style.opacity = '0';
        revealElement(el, style, i * 90);
      });
      if (style !== 'rise') {
        scene.querySelectorAll<HTMLElement>('.mask-inner').forEach((el, i) => {
          el.style.opacity = '0';
          revealElement(el, style, 140 + i * 120);
        });
      }
    }
  };

  /* express path: land on a scene instantly — no film, no waiting.
     Used by the number keys; mirrors what deep links do on load. */
  const jumpTo = (idx: number): void => {
    if (animating || idx === current || idx < 0 || idx >= N) return;
    current = idx;
    settleStates();
    activate(current);
    if (freqEl) freqEl.textContent = scenes[current]!.dataset.freq ?? '';
    setDial(current);
    setRssi(5);
    setLock(true);
    meshJump(current);
  };

  /* ---- timed cut player: one gesture = one full, designed transition ---- */

  /* the globe layer hooks in here; real implementation assigned below */
  let globeGo: (idx: number, dir: number) => void = () => {};
  /* the network-map layer: cut flight + instant deep-link jump */
  let meshGo: (scene: number) => void = () => {};
  let meshJump: (scene: number) => void = () => {};

  /* a second gesture mid-cut fast-forwards the remaining timeline instead
     of being swallowed — assigned per-cut by playCut, no-op between cuts */
  let fastForward: () => void = () => {};

  const playCut = (target: number): void => {
    if (animating || target === current || target < 0 || target >= N) return;
    const forward = target > current;
    /* going back replays the cut we arrived through, in reverse */
    const inc = forward ? scenes[target]! : scenes[current]!;
    const out = forward ? scenes[current]! : scenes[target]!;
    const fxName = inc.dataset.fx ?? 'swap';
    const cut = cuts[fxName] ?? cuts.swap!;
    let dur = DUR[fxName] ?? 1000;
    const tuneFreq = scenes[target]!.dataset.freq ?? '';

    animating = true;
    /* z-order flip: scenes drop under the constellation for the flight */
    document.documentElement.classList.add('cutting');
    inc.dataset.state = 'incoming';
    out.dataset.state = 'current';
    setLock(false);
    globeGo(target, forward ? 1 : -1);
    meshGo(target);

    const from = current;
    let start = performance.now();
    let activated = false;
    let ffwd = false;

    /* impatience compresses what's left of the cut to a quarter, from the
       current frame — the cut still completes, just visibly faster */
    fastForward = (): void => {
      if (!animating || ffwd) return;
      ffwd = true;
      const t0 = Math.min(1, (performance.now() - start) / dur);
      dur = Math.max(150, dur * 0.25);
      start = performance.now() - t0 * dur;
    };

    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / dur);
      const f = forward ? t : 1 - t;
      inc.style.setProperty('--f', f.toFixed(4));
      cut(inc, out, f);
      if (freqEl) freqEl.textContent = jam(tuneFreq, Math.min(1, bell(t) * 1.5));
      /* dial slides between channels, trembling while seeking */
      setDial(from + (target - from) * easeInOut(t), bell(t) * (Math.random() - 0.5) * 7);
      /* signal strength drops mid-cut, flickering */
      setRssi(Math.max(1, Math.round(5 - bell(t) * 4 + (Math.random() - 0.5))));
      /* the cursor loses lock too — dot glitches with the signal */
      if (cursorDot) {
        const g = bell(t) * 7;
        cursorDot.style.translate = `${((Math.random() - 0.5) * g).toFixed(1)}px ${((Math.random() - 0.5) * g).toFixed(1)}px`;
      }
      if (!activated && t >= 0.5) {
        activated = true;
        activate(target);
      }
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        current = target;
        settleStates();
        document.documentElement.classList.remove('cutting');
        if (freqEl) freqEl.textContent = tuneFreq;
        settleDial(current, forward ? 1 : -1);
        setRssi(5);
        setLock(true);
        if (cursorDot) cursorDot.style.translate = '';
        animating = false;
        lockGestures();
      }
    };
    requestAnimationFrame(step);
  };

  /* ---- opening title card — once per session ---- */

  const titlecard = document.getElementById('titlecard');
  let tcDone = true;

  const dismissTitlecard = (): void => {
    if (tcDone) return;
    tcDone = true;
    if (titlecard) {
      titlecard.classList.add('tc-hide');
      setTimeout(() => titlecard.remove(), 750);
    }
    runHeroDecode();
  };

  if (titlecard && !sessionStorage.getItem('miko-titlecard')) {
    tcDone = false;
    sessionStorage.setItem('miko-titlecard', '1');
    titlecard.classList.add('tc-show');
    titlecard
      .querySelectorAll<HTMLElement>('.tc-decode')
      .forEach((el, k) => setTimeout(() => decode(el, 700), 250 + k * 300));
    setTimeout(dismissTitlecard, 2100);
  } else {
    titlecard?.remove();
    runHeroDecode();
  }

  /* ---- gestures: trigger cuts, never scrub them ---- */

  let acc = 0;
  let lastWheelAt = 0;
  let locked = false;

  const lockGestures = (): void => {
    /* swallow the touchpad inertia tail; unlock after a quiet gap */
    locked = true;
    lastWheelAt = performance.now();
    acc = 0;
  };

  window.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      e.preventDefault();
      if (!tcDone) {
        dismissTitlecard();
        lockGestures();
        return;
      }
      const now = performance.now();
      if (animating) {
        /* a fresh flick mid-cut (quiet gap = a separate gesture, not the
           inertia tail) is a clear "skip ahead" — fast-forward the cut */
        if (now - lastWheelAt > 200) fastForward();
        lastWheelAt = now;
        return;
      }
      if (locked) {
        if (now - lastWheelAt > 240) {
          locked = false;
          acc = 0;
        } else {
          lastWheelAt = now;
          return;
        }
      }
      if (now - lastWheelAt > 200) acc = 0; // new gesture
      lastWheelAt = now;
      acc += e.deltaY;
      if (Math.abs(acc) > 60) {
        const dir = acc > 0 ? 1 : -1;
        acc = 0;
        playCut(current + dir);
      }
    },
    { passive: false },
  );

  let touchY = 0;
  let touchUsed = false;

  window.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
      touchUsed = false;
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      e.preventDefault();
      if (!tcDone) {
        dismissTitlecard();
        touchUsed = true;
        return;
      }
      if (touchUsed) return;
      const dy = touchY - (e.touches[0]?.clientY ?? 0);
      if (Math.abs(dy) <= 50) return;
      touchUsed = true;
      if (animating) {
        /* a second swipe mid-cut fast-forwards it */
        fastForward();
        return;
      }
      playCut(current + (dy > 0 ? 1 : -1));
    },
    { passive: false },
  );

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    /* number keys tune straight to a scene — the power-user express lane */
    if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const idx = Number(e.key) - 1;
      if (idx >= N) return;
      e.preventDefault();
      if (!tcDone) dismissTitlecard();
      jumpTo(idx);
      return;
    }
    const next = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
    const prev = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    const home = e.key === 'Home';
    const end = e.key === 'End';
    if (!next && !prev && !home && !end) return;
    e.preventDefault();
    if (!tcDone) {
      dismissTitlecard();
      return;
    }
    if (animating) {
      /* repeat key mid-cut = impatience — finish the cut fast */
      fastForward();
      return;
    }
    if (home) playCut(0);
    else if (end) playCut(N - 1);
    else playCut(current + (next ? 1 : -1));
  });

  window.addEventListener('pointerdown', () => {
    if (!tcDone) dismissTitlecard();
  });

  /* ---- easter egg: AFTERGLOW — the cursor leaves a phosphor wake,
     like a long-persistence oscilloscope. Amber while seeking. ---- */

  const eggBtn = document.getElementById('egg-toggle');
  const trail = document.getElementById('trail') as HTMLCanvasElement | null;
  const trailCtx = trail?.getContext('2d') ?? null;
  let egg = false;
  let trailRaf = false;
  let trailX = window.innerWidth / 2;
  let trailY = window.innerHeight / 2;
  let prevX = trailX;
  let prevY = trailY;

  const sizeTrail = (): void => {
    if (!trail) return;
    trail.width = window.innerWidth;
    trail.height = window.innerHeight;
  };

  let lastTrailMove = 0;

  const trailLoop = (): void => {
    if (!egg || !trail || !trailCtx) {
      trailRaf = false;
      return;
    }
    /* phosphor decay — quick, so the wake vanishes instead of lingering */
    trailCtx.globalCompositeOperation = 'destination-out';
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    trailCtx.fillRect(0, 0, trail.width, trail.height);

    /* cursor idle → ease the whole layer out (CSS), then wipe and sleep */
    const idle = performance.now() - lastTrailMove;
    if (idle > 900) trail.style.opacity = '0';
    if (idle > 1900) {
      trailCtx.globalCompositeOperation = 'source-over';
      trailCtx.clearRect(0, 0, trail.width, trail.height);
      trailRaf = false;
      return;
    }

    /* fresh beam energy along the cursor path — only while it moves */
    const dist = Math.hypot(trailX - prevX, trailY - prevY);
    if (dist > 0.5) {
      trailCtx.globalCompositeOperation = 'lighter';
      const col = seekingNow ? '255, 176, 0' : '51, 255, 102';
      const steps = 4;
      for (let k = 1; k <= steps; k++) {
        const x = prevX + ((trailX - prevX) * k) / steps;
        const y = prevY + ((trailY - prevY) * k) / steps;
        const r = 80;
        const grad = trailCtx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${col}, 0.085)`);
        grad.addColorStop(0.5, `rgba(${col}, 0.035)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        trailCtx.fillStyle = grad;
        trailCtx.beginPath();
        trailCtx.arc(x, y, r, 0, Math.PI * 2);
        trailCtx.fill();
      }
    }
    prevX = trailX;
    prevY = trailY;
    requestAnimationFrame(trailLoop);
  };

  const setEgg = (on: boolean): void => {
    egg = on;
    localStorage.setItem('miko-afterglow', on ? '1' : '0');
    eggBtn?.setAttribute('aria-pressed', String(on));
    eggBtn?.classList.toggle('on', on);
    if (trail) {
      trail.style.opacity = on ? '1' : '0';
      trailCtx?.clearRect(0, 0, trail.width, trail.height);
    }
    if (on && !trailRaf) {
      trailRaf = true;
      lastTrailMove = performance.now();
      requestAnimationFrame(trailLoop);
    }
  };

  if (eggBtn && trail && !lite) {
    sizeTrail();
    window.addEventListener('resize', sizeTrail);
    window.addEventListener(
      'mousemove',
      (e: MouseEvent) => {
        trailX = e.clientX;
        trailY = e.clientY;
        lastTrailMove = performance.now();
        if (egg) {
          if (trail) trail.style.opacity = '1';
          if (!trailRaf) {
            trailRaf = true;
            prevX = trailX;
            prevY = trailY;
            requestAnimationFrame(trailLoop);
          }
        }
      },
      { passive: true },
    );
    eggBtn.addEventListener('click', () => setEgg(!egg));
    if (localStorage.getItem('miko-afterglow') === '1') setEgg(true);
  } else {
    eggBtn?.remove();
  }

  /* ---- 3D: wireframe globe — a travelling companion through the film ----
     hand-rolled spherical projection; vector-display look. A real little
     satellite rides a wide orbit and uplinks to QTH when in view. */

  const globe = document.getElementById('globe') as HTMLCanvasElement | null;

  /* layer switch: the network map (meshmap.ts) currently fronts the film;
     the synoptic globe below is kept fully intact — flip the flag to bring
     it back (or to run both) */
  const GLOBE_LAYER = false;
  const MESH_LAYER = true;

  if (globe && !lite && GLOBE_LAYER) {
    const gtx = globe.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let GW = 0;
    let GH = 0;

    /* the isobar field (WebGL, see synoptic.ts) replaces the hand-drawn
       grid; no WebGL2 -> the wireframe below still works as the fallback */
    const synCanvas = document.getElementById('synoptic') as HTMLCanvasElement | null;
    const synoptic = synCanvas ? createSynoptic(synCanvas) : null;
    const tracker = synoptic ? createExtremaTracker() : null;
    const FIELD = FIELD_DEFAULTS;
    let synSide = 0; /* square field canvas, CSS px */
    let fieldTime = 0;
    let lastFrameMs = performance.now();
    let lastScanMs = 0;

    const fitGlobe = (): void => {
      GW = globe.width = Math.round(window.innerWidth * dpr);
      GH = globe.height = Math.round(window.innerHeight * dpr);
      if (synoptic && synCanvas) {
        const rMax = Math.min(GW, GH) * 0.3 * 1.15; /* largest POSES scale */
        const sideDev = Math.ceil(rMax * 2.35);
        synoptic.fit(sideDev);
        synSide = sideDev / dpr;
        synCanvas.style.width = `${synSide}px`;
        synCanvas.style.height = `${synSide}px`;
      }
    };
    fitGlobe();
    window.addEventListener('resize', fitGlobe);

    /* one pose per scene: position (viewport fractions), scale, alpha */
    interface Pose {
      x: number;
      y: number;
      s: number;
      a: number;
    }

    const POSES: Pose[] = [
      { x: 0.79, y: 0.56, s: 1.0, a: 1 },    // opening — big, right of the title
      { x: 0.8, y: 0.34, s: 0.7, a: 0.9 },   // brief — top right
      { x: 0.84, y: 0.3, s: 0.55, a: 0.85 }, // zephyr
      { x: 0.14, y: 0.34, s: 0.5, a: 0.85 }, // pager — wanders left
      { x: 0.85, y: 0.4, s: 0.6, a: 0.85 },  // longwave — back right
      { x: 0.5, y: 0.26, s: 0.5, a: 0.8 },   // sensor lab — centre stage
      { x: 0.16, y: 0.3, s: 0.55, a: 0.85 }, // miko works — left again
      { x: 0.86, y: 0.2, s: 0.4, a: 0.65 },  // log — small, corner
      { x: 0.76, y: 0.44, s: 1.15, a: 1 },   // contact — the finale
    ];

    const poseOf = (idx: number): Pose => POSES[idx] ?? POSES[0]!;
    const poseNow: Pose = { ...poseOf(current) };
    let poseTarget: Pose = poseOf(current);
    let kick = 0;

    globeGo = (idx: number, dir: number): void => {
      poseTarget = poseOf(idx);
      kick += dir * 0.9;
      kick = Math.max(-1.6, Math.min(1.6, kick));
    };

    /* start with the QTH hemisphere facing the camera (lon 19°E → front);
       positive tilt pitches the NORTH pole toward the viewer */
    let spin = (-19 * Math.PI) / 180;
    let tilt = 0.3;
    let yaw = 0;
    let tiltTarget = 0.3;
    let yawTarget = 0;
    let satAngle = 0;

    window.addEventListener(
      'mousemove',
      (e: MouseEvent) => {
        tiltTarget = 0.3 + (e.clientY / window.innerHeight - 0.5) * 0.4;
        yawTarget = (e.clientX / window.innerWidth - 0.5) * 0.6;
      },
      { passive: true },
    );

    interface P3 {
      x: number;
      y: number;
      z: number;
    }

    const project = (latDeg: number, lonDeg: number, r: number): P3 => {
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180 + spin + yaw;
      const x = r * Math.cos(lat) * Math.sin(lon);
      const y = r * Math.sin(lat);
      const z = r * Math.cos(lat) * Math.cos(lon);
      const c = Math.cos(tilt);
      const s = Math.sin(tilt);
      return { x, y: y * c - z * s, z: y * s + z * c };
    };

    /* satellite orbit point in view space (inclined 55°) */
    const ORBIT = 1.85;
    const INC = (55 * Math.PI) / 180;

    const orbitPoint = (angle: number, r: number): P3 => {
      const ox = r * Math.cos(angle);
      const oy = r * Math.sin(angle) * Math.cos(INC);
      const oz = r * Math.sin(angle) * Math.sin(INC);
      const c = Math.cos(tilt);
      const s = Math.sin(tilt);
      return { x: ox, y: oy * c - oz * s, z: oy * s + oz * c };
    };

    const drawGlobe = (): void => {
      if (!gtx || document.hidden) return;

      const nowMs = performance.now();
      const dt = Math.min(0.1, (nowMs - lastFrameMs) / 1000);
      lastFrameMs = nowMs;
      fieldTime += dt * FIELD.speed; /* pressure systems morph in real time */

      /* glide toward the scene's pose; spin gets a decaying kick per cut */
      poseNow.x += (poseTarget.x - poseNow.x) * 0.055;
      poseNow.y += (poseTarget.y - poseNow.y) * 0.055;
      poseNow.s += (poseTarget.s - poseNow.s) * 0.055;
      poseNow.a += (poseTarget.a - poseNow.a) * 0.055;
      tilt += (tiltTarget - tilt) * 0.04;
      yaw += (yawTarget - yaw) * 0.04;
      spin += 0.0024 + kick * 0.045;
      kick *= 0.94;
      satAngle += 0.008;

      const R = Math.min(GW, GH) * 0.3 * poseNow.s;
      const cx = poseNow.x * GW;
      const cy = poseNow.y * GH;
      const jit = seekingNow ? 2.5 * dpr : 0;
      const grid = seekingNow ? '255, 176, 0' : '230, 242, 230';
      const acc = seekingNow ? '255, 176, 0' : '51, 255, 102';
      const J = (): number => (jit ? (Math.random() - 0.5) * jit : 0);
      const X = (p: P3): number => cx + p.x + J();
      const Y = (p: P3): number => cy - p.y + J();

      gtx.clearRect(0, 0, GW, GH);
      gtx.globalAlpha = Math.max(0, Math.min(1, poseNow.a));
      gtx.lineWidth = dpr;

      if (synoptic && synCanvas) {
        /* isobar field: ride the pose (and the SEEK shake) via transform,
           everything else happens in the shader */
        const tx = cx / dpr - synSide / 2 + J() / dpr;
        const ty = cy / dpr - synSide / 2 + J() / dpr;
        synCanvas.style.transform = `translate(${tx}px, ${ty}px)`;
        synoptic.draw({
          radius: R,
          time: fieldTime,
          spin: spin + yaw,
          tilt,
          scale: FIELD.scale,
          levels: FIELD.levels,
          lineAlpha: FIELD.lineAlpha,
          gratAlpha: FIELD.gratAlpha,
          dash: FIELD.dash,
          seek: seekingNow ? 1 : 0,
          alpha: Math.max(0, Math.min(1, poseNow.a)),
        });
      } else {
        /* fallback: the original hand-drawn wireframe grid */
        const seg = (a: P3, b: P3): void => {
          const zAvg = (a.z + b.z) / 2;
          gtx.strokeStyle = `rgba(${grid}, ${zAvg > 0 ? 0.18 : 0.05})`;
          gtx.beginPath();
          gtx.moveTo(X(a), Y(a));
          gtx.lineTo(X(b), Y(b));
          gtx.stroke();
        };

        for (let lat = -75; lat <= 75; lat += 15) {
          let prev = project(lat, 0, R);
          for (let lon = 10; lon <= 360; lon += 10) {
            const cur = project(lat, lon, R);
            seg(prev, cur);
            prev = cur;
          }
        }
        for (let lon = 0; lon < 360; lon += 15) {
          let prev = project(-90, lon, R);
          for (let lat = -80; lat <= 90; lat += 10) {
            const cur = project(lat, lon, R);
            seg(prev, cur);
            prev = cur;
          }
        }
      }

      /* orbit guide — dashed accent track, clearly not part of the mesh */
      const oR = R * ORBIT;
      gtx.setLineDash([3 * dpr, 6 * dpr]);
      let oPrev = orbitPoint(0, oR);
      for (let k = 1; k <= 72; k++) {
        const oCur = orbitPoint((k / 72) * Math.PI * 2, oR);
        gtx.strokeStyle = `rgba(${acc}, ${(oPrev.z + oCur.z) / 2 > 0 ? 0.35 : 0.1})`;
        gtx.beginPath();
        gtx.moveTo(X(oPrev), Y(oPrev));
        gtx.lineTo(X(oCur), Y(oCur));
        gtx.stroke();
        oPrev = oCur;
      }
      gtx.setLineDash([]);

      /* QTH — Poland, 52°N 19°E */
      const qth = project(52, 19, R);
      const qthFront = qth.z > 0;
      if (qthFront) {
        gtx.fillStyle = `rgba(${acc}, 0.95)`;
        gtx.beginPath();
        gtx.arc(X(qth), Y(qth), 3 * dpr, 0, Math.PI * 2);
        gtx.fill();
        gtx.font = `${10 * dpr}px 'Space Mono', monospace`;
        gtx.fillStyle = `rgba(${acc}, 0.75)`;
        gtx.fillText('QTH', X(qth) + 8 * dpr, Y(qth) - 6 * dpr);
      }

      /* the satellite — a little spacecraft riding the orbit */
      const sat = orbitPoint(satAngle, oR);
      const ahead = orbitPoint(satAngle + 0.06, oR);
      const heading = Math.atan2(-(ahead.y - sat.y), ahead.x - sat.x);
      const front = sat.z > 0;
      const sAlpha = front ? 0.95 : 0.35;
      const u = dpr * Math.max(0.7, Math.min(1.2, poseNow.s));

      gtx.save();
      gtx.translate(X(sat), Y(sat));
      gtx.rotate(heading);
      /* solar panels */
      gtx.fillStyle = `rgba(${grid}, ${sAlpha * 0.75})`;
      gtx.fillRect(-12 * u, -2.5 * u, 8 * u, 5 * u);
      gtx.fillRect(4 * u, -2.5 * u, 8 * u, 5 * u);
      /* panel struts */
      gtx.strokeStyle = `rgba(${grid}, ${sAlpha * 0.75})`;
      gtx.beginPath();
      gtx.moveTo(-4 * u, 0);
      gtx.lineTo(4 * u, 0);
      gtx.stroke();
      /* body */
      gtx.fillStyle = `rgba(${acc}, ${sAlpha})`;
      gtx.fillRect(-3 * u, -3.5 * u, 6 * u, 7 * u);
      gtx.restore();

      /* uplink while both are on the near side */
      if (qthFront && front) {
        gtx.strokeStyle = `rgba(${acc}, 0.4)`;
        gtx.setLineDash([4 * dpr, 7 * dpr]);
        gtx.lineDashOffset = -((performance.now() / 40) % 1000) * dpr;
        gtx.beginPath();
        gtx.moveTo(X(qth), Y(qth));
        gtx.lineTo(X(sat), Y(sat));
        gtx.stroke();
        gtx.setLineDash([]);
      }

      /* H/L pressure centres — world-anchored extrema of the same field
         the shader draws; only when the globe is big enough to star */
      if (tracker && R > 110 * dpr) {
        if (nowMs - lastScanMs > 250) {
          lastScanMs = nowMs;
          tracker.scan(FIELD.scale, fieldTime, nowMs);
        }
        const fs = R * 0.085;
        for (const l of tracker.labels()) {
          const lp = project(l.lat, l.lon, R);
          if (lp.z < 0.18 * R) continue;
          if (Math.hypot(lp.x, lp.y) > 0.8 * R) continue;
          const la = Math.min(1, (lp.z / R - 0.18) / 0.25);
          gtx.textAlign = 'center';
          gtx.font = `700 ${fs}px 'Space Mono', monospace`;
          gtx.fillStyle = `rgba(${grid}, ${0.95 * la})`;
          gtx.fillText(l.kind, X(lp), Y(lp));
          gtx.font = `${fs * 0.45}px 'Space Mono', monospace`;
          gtx.fillStyle = `rgba(${acc}, ${0.8 * la})`;
          gtx.fillText(String(l.val), X(lp), Y(lp) + fs * 0.62);
        }
        gtx.textAlign = 'left';
      }
    };

    const globeLoop = (): void => {
      drawGlobe();
      requestAnimationFrame(globeLoop);
    };
    requestAnimationFrame(globeLoop);
  }

  /* ---- network map: the constellation the film travels through ----
     every cut is a camera flight across the mesh into the next station;
     BRIEF pulls back to the overview of the whole net. See meshmap.ts. */
  const meshCanvas = document.getElementById('meshmap') as HTMLCanvasElement | null;

  if (meshCanvas && !lite && MESH_LAYER) {
    const mm = createMeshMap(meshCanvas, { ...MESH_DEFAULTS }, {
      getSeek: () => seekingNow,
      /* fallback parking spot — SCENE_PARK below overrides it per scene */
      focusOffset: { x: 0.22, y: -0.2 },
      compactNeighbors: true,
    });
    if (mm) {
      /* film scene -> story node; -1 = no station, fly to the overview */
      const SCENE_NODE = [0, -1, 1, 2, 3, 4, 5, 6, 7];
      /* where the focused station box parks on each scene (viewport
         fractions off centre) — hand-placed into that scene's clear
         real estate so the box never sits inside the typography */
      const SCENE_PARK: Array<{ x: number; y: number }> = [
        { x: -0.2, y: -0.38 },  // opening — above the title, left of centre
        { x: 0, y: 0 },         // brief — overview, unused
        { x: 0.22, y: -0.2 },   // zephyr — upper right, above the title
        { x: 0.22, y: -0.2 },   // pager
        { x: 0.22, y: -0.2 },   // longwave
        { x: 0.22, y: -0.2 },   // sensor lab
        { x: 0.22, y: -0.2 },   // miko works
        { x: 0.05, y: -0.36 },  // log — thin clear band above the columns
        { x: 0.26, y: -0.26 },  // contact — right of the head, above title
      ];
      meshGo = (scene: number): void => {
        const t = SCENE_NODE[scene] ?? -1;
        if (t < 0) mm.flyOverview();
        else mm.flyTo(t, SCENE_PARK[scene]);
      };
      meshJump = (scene: number): void => {
        const t = SCENE_NODE[scene] ?? -1;
        if (t < 0) mm.flyOverview();
        else mm.jumpTo(t, SCENE_PARK[scene]);
      };
    }
  }

  /* nav → scene */
  document.querySelectorAll<HTMLAnchorElement>('a[data-scene]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      playCut(Number(a.dataset.scene ?? 0));
    });
  });

  /* deep link: #works etc. lands on its scene instantly */
  const hashIdx = scenes.findIndex((s) => s.id && `#${s.id}` === window.location.hash);
  if (hashIdx > 0) current = hashIdx;
  meshJump(current);

  settleStates();
  activate(current);
  if (freqEl) freqEl.textContent = scenes[current]?.dataset.freq ?? '';
  setDial(current);
  setRssi(5);
  setLock(true);
}
