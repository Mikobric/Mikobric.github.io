/* ---- per-scene text reveals ----
   Each scene declares a `data-reveal` style; on activation its labels and
   title load with that style instead of the old uniform scramble. Five
   characters of motion: a line rises, a beam wipes, letters stagger or warm
   up like a tube, or text types in. Reduced-motion shows the text at once.

   revealElement() owns one text node. It stashes the original text the first
   time it runs (re-entrant: re-revealing restores from the stash, never from
   a half-scrambled DOM). */

export type RevealStyle = 'rise' | 'type' | 'stagger' | 'beam' | 'flicker' | 'scramble';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NOISE = '░▒▓<>=+·—01';
const rnd = (s: string): string => s[(Math.random() * s.length) | 0]!;

/* original text, captured once per element */
function source(el: HTMLElement): string {
  if (el.dataset.rtext === undefined) el.dataset.rtext = el.textContent ?? '';
  return el.dataset.rtext;
}

/* wrap each character in its own span (for stagger / flicker) */
function spanify(el: HTMLElement, text: string): HTMLElement[] {
  el.textContent = '';
  const out: HTMLElement[] = [];
  for (const c of text) {
    const s = document.createElement('span');
    s.className = 'rv-ch';
    s.textContent = c;
    el.appendChild(s);
    out.push(s);
  }
  return out;
}

function scramble(el: HTMLElement, text: string, duration = 600): void {
  el.style.opacity = '1';
  const start = performance.now();
  const tick = (now: number): void => {
    const p = Math.min(1, (now - start) / duration);
    const reveal = Math.floor(p * text.length);
    let out = text.slice(0, reveal);
    for (let i = reveal; i < text.length; i++) out += text[i] === ' ' ? ' ' : rnd(NOISE);
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

function typewriter(el: HTMLElement, text: string): void {
  el.style.opacity = '1';
  el.textContent = '';
  const txt = document.createElement('span');
  const cur = document.createElement('span');
  cur.className = 'rv-cursor';
  cur.innerHTML = '&nbsp;';
  el.append(txt, cur);
  let i = 0;
  const step = (): void => {
    txt.textContent = text.slice(0, i);
    /* deliberately slow: on long cuts (collapse = 1200ms) a fast type
       finishes mid-transition and reads as static — keep typing past settle */
    if (i++ <= text.length) setTimeout(step, 60 + Math.random() * 45);
    else setTimeout(() => cur.remove(), 600);
  };
  step();
}

function rise(el: HTMLElement, text: string): void {
  el.style.opacity = '1';
  el.textContent = '';
  const clip = document.createElement('span');
  clip.className = 'rv-clip';
  const inner = document.createElement('span');
  inner.textContent = text;
  clip.appendChild(inner);
  el.appendChild(clip);
  inner.style.transform = 'translateY(110%)';
  // next frame: release
  requestAnimationFrame(() => {
    inner.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)';
    requestAnimationFrame(() => {
      inner.style.transform = 'none';
    });
  });
}

function stagger(el: HTMLElement, text: string, delay: number): void {
  el.style.opacity = '1';
  const spans = spanify(el, text);
  spans.forEach((s, i) => {
    s.style.opacity = '0';
    s.style.transform = 'translateY(0.45em)';
    s.style.transition = 'opacity .5s ease, transform .6s cubic-bezier(.16,1,.3,1)';
    setTimeout(
      () => {
        s.style.opacity = '1';
        s.style.transform = 'none';
      },
      delay + i * 22,
    );
  });
}

function flicker(el: HTMLElement, text: string, delay: number): void {
  el.style.opacity = '1';
  const spans = spanify(el, text);
  spans.forEach((s) => {
    s.style.opacity = '0';
    const on = delay + 120 + Math.random() * 520;
    const pre = on - 70 - Math.random() * 60;
    setTimeout(() => (s.style.opacity = '0.7'), Math.max(0, pre));
    setTimeout(() => (s.style.opacity = '0'), Math.max(0, pre + 30));
    setTimeout(() => (s.style.opacity = '1'), on);
  });
}

function beam(el: HTMLElement, text: string): void {
  el.style.opacity = '1';
  el.textContent = '';
  const wrap = document.createElement('span');
  wrap.className = 'rv-beam';
  const txt = document.createElement('span');
  txt.className = 'rv-beam-txt';
  txt.textContent = text;
  const bar = document.createElement('span');
  bar.className = 'rv-beam-bar';
  wrap.append(txt, bar);
  el.appendChild(wrap);
  txt.style.clipPath = 'inset(0 100% 0 0)';
  const dur = 600;
  const start = performance.now();
  const tick = (now: number): void => {
    const p = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    txt.style.clipPath = `inset(0 ${100 - e * 100}% 0 0)`;
    bar.style.left = `${e * 100}%`;
    bar.style.opacity = p < 1 ? '1' : '0';
    if (p < 1) requestAnimationFrame(tick);
    else bar.remove();
  };
  requestAnimationFrame(tick);
}

export function revealElement(el: HTMLElement, style: RevealStyle, delay = 0): void {
  const text = source(el);
  if (!text.trim()) return;
  if (reduced) {
    el.textContent = text;
    return;
  }
  switch (style) {
    case 'type':
      setTimeout(() => typewriter(el, text), delay);
      break;
    case 'rise':
      setTimeout(() => rise(el, text), delay);
      break;
    case 'stagger':
      stagger(el, text, delay);
      break;
    case 'flicker':
      flicker(el, text, delay);
      break;
    case 'beam':
      setTimeout(() => beam(el, text), delay);
      break;
    default:
      setTimeout(() => scramble(el, text), delay);
  }
}
