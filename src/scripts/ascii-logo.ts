/* ---- ASCII boot logo: the MIKO wordmark on the opening title card ----
   Hand-built 5x7 bitmap letters, rasterised into a character grid. The
   logo arrives like a tuned-in transmission: a scan front sweeps left to
   right, resolving teletype noise into solid glyphs (signal lock). Once
   locked, a slow diagonal brightness wave flows through the letters so the
   phosphor never sits dead-still — motion, not a pulse.

   Self-contained. Runs only while the title card is in the DOM (it lives
   for one session, ~2.1s) and bails the moment the card is removed. */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pre = document.getElementById('tc-ascii');

if (pre) {
  /* 5x7 letterforms — '1' is an inked pixel */
  const FONT: Record<string, string[]> = {
    M: ['1   1', '11 11', '1 1 1', '1   1', '1   1', '1   1', '1   1'],
    I: ['11111', '  1  ', '  1  ', '  1  ', '  1  ', '  1  ', '11111'],
    K: ['1   1', '1  1 ', '1 1  ', '11   ', '1 1  ', '1  1 ', '1   1'],
    O: [' 111 ', '1   1', '1   1', '1   1', '1   1', '1   1', ' 111 '],
  };

  const WORD = 'MIKO';
  const GLYPH_W = 5;
  const GLYPH_H = 7;
  const PX_W = 2; // each inked pixel is 2 chars wide → bolder, squarer letters
  const GAP = 4; // chars between letters

  const ROWS = GLYPH_H;
  const COLS = WORD.length * GLYPH_W * PX_W + (WORD.length - 1) * GAP;

  /* rasterise the word into a boolean mask once */
  const mask: boolean[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  let cursor = 0;
  for (const ch of WORD) {
    const g = FONT[ch]!;
    for (let r = 0; r < GLYPH_H; r++) {
      for (let c = 0; c < GLYPH_W; c++) {
        if (g[r]![c] === '1') {
          for (let k = 0; k < PX_W; k++) mask[r]![cursor + c * PX_W + k] = true;
        }
      }
    }
    cursor += GLYPH_W * PX_W + GAP;
  }

  /* dim → bright; even the lightest glyph stays legible so the word reads */
  const RAMP = ':-=+*oO#%@';
  const NOISE = '░▒▓<>=+·—01';

  const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

  /* animated brightness field — two crossing diagonal waves */
  const field = (x: number, y: number, t: number): number => {
    const w1 = Math.sin(x * 0.3 - y * 0.5 - t * 2.0);
    const w2 = Math.sin(x * 0.12 + y * 0.22 + t * 1.1);
    return clamp01(0.5 + 0.3 * w1 + 0.2 * w2);
  };

  const REVEAL_MS = 950;

  const frame = (t: number, rp: number): void => {
    /* scan front in char-columns: starts off the left edge, exits past the right */
    const front = rp * (COLS + 6) - 3;
    let out = '';
    for (let y = 0; y < ROWS; y++) {
      let line = '';
      for (let x = 0; x < COLS; x++) {
        if (!mask[y]![x]) {
          line += ' ';
          continue;
        }
        const dx = x - front;
        if (dx > 1.5) {
          // ahead of the scan: incoming static
          line += Math.random() < 0.5 ? NOISE[(Math.random() * NOISE.length) | 0] : ' ';
        } else if (dx > -1.5) {
          // the scan beam itself — brightest
          line += '@';
        } else {
          const b = field(x, y, t);
          line += RAMP[Math.min(RAMP.length - 1, (b * RAMP.length) | 0)];
        }
      }
      out += line + (y < ROWS - 1 ? '\n' : '');
    }
    pre.textContent = out;
  };

  if (reduced) {
    // no animation: render a single locked frame
    frame(0, 1);
  } else {
    let start = 0;
    const loop = (now: number): void => {
      if (!document.body.contains(pre)) return; // card dismissed → stop
      if (!start) start = now;
      const elapsed = now - start;
      const rp = clamp01(elapsed / REVEAL_MS);
      frame(elapsed / 1000, rp);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
