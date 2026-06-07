/* ============================================================
   Synoptic field — the weather-chart globe, shared by the
   production film (main.ts) and the tuning lab (lab-globe.ts).

   A 4D value-noise field rendered as isobars in a WebGL2
   fragment shader: ray-traced sphere (no geometry, no deps),
   faint graticule underneath, phosphor-green palette, amber
   under SEEK. The noise hash is integer PCG implemented
   bit-for-bit identically in GLSL and JS, so the CPU can find
   the field's extrema and pin H/L pressure labels exactly where
   the shader draws the tightest contour rings. (A sin()-based
   hash would diverge between GPU fp32 and JS fp64.)
   ============================================================ */

/* knobs approved in the lab — single source for both pages */
export const FIELD_DEFAULTS = {
  scale: 1.85,
  levels: 16,
  speed: 0.09,
  lineAlpha: 1,
  gratAlpha: 0.08,
  dash: 1,
} as const;

/* ---------- shaders ---------- */

const VERT = `#version 300 es
void main() {
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uRes;
uniform float uRadius;
uniform float uTime;
uniform float uSpin;
uniform float uTilt;
uniform float uScale;
uniform float uLevels;
uniform float uLineAlpha;
uniform float uGratAlpha;
uniform float uDash;
uniform float uSeek;
uniform float uAlpha;

out vec4 outColor;

/* pcg4d — "Hash Functions for GPU Rendering" (Jarzynski & Olano).
   Pure 32-bit integer ops: the JS twin below matches bit-for-bit. */
uvec4 pcg4d(uvec4 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  v ^= v >> 16u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  return v;
}

float vhash(ivec4 p) {
  return float(pcg4d(uvec4(p)).x) * (1.0 / 4294967296.0);
}

/* 4D value noise: 16 lattice corners, quintic fade */
float vnoise(vec4 p) {
  vec4 i = floor(p);
  vec4 f = p - i;
  vec4 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  ivec4 ip = ivec4(i);
  float acc = 0.0;
  for (int w = 0; w < 2; w++)
  for (int z = 0; z < 2; z++)
  for (int y = 0; y < 2; y++)
  for (int x = 0; x < 2; x++) {
    vec4 sel = vec4(float(x), float(y), float(z), float(w));
    vec4 wgt = mix(1.0 - u, u, sel);
    acc += wgt.x * wgt.y * wgt.z * wgt.w * vhash(ip + ivec4(x, y, z, w));
  }
  return acc * 2.0 - 1.0;
}

const vec4 SHIFT = vec4(13.0, 7.0, 3.0, 5.0);

float fbm(vec4 p) {
  float a = 0.5;
  float sum = 0.0;
  float norm = 0.0;
  for (int i = 0; i < 3; i++) {
    sum += a * vnoise(p);
    norm += a;
    p = p * 2.0 + SHIFT;
    a *= 0.5;
  }
  return sum / norm;
}

void main() {
  vec2 q = (gl_FragCoord.xy - uRes * 0.5) / uRadius;
  float r2 = dot(q, q);

  /* the canvas is sized for the largest pose; at small poses most pixels
     sit far outside the disc — bail before the noise gets evaluated.
     1.1 keeps a safe margin past the limb ring's AA, so the derivatives
     used below never see the discard boundary. */
  if (r2 > 1.1) discard;

  float rr = sqrt(r2);
  float inside = step(r2, 1.0);

  /* point on the unit sphere (orthographic), then view -> world:
     undo tilt (about X), undo spin (about Y) */
  float z = sqrt(max(0.0, 1.0 - r2));
  vec3 vp = vec3(q, z);
  float ct = cos(uTilt), st = sin(uTilt);
  vec3 p1 = vec3(vp.x, vp.y * ct + vp.z * st, -vp.y * st + vp.z * ct);
  float cs = cos(uSpin), ss = sin(uSpin);
  vec3 p = vec3(p1.x * cs - p1.z * ss, p1.y, p1.x * ss + p1.z * cs);

  /* the field, and its isolines (1px via fwidth) */
  float f = fbm(vec4(p * uScale, uTime));
  float v = f * uLevels;
  float fw = fwidth(v) + 1e-4;
  float fr = fract(v);
  float dLine = min(fr, 1.0 - fr);
  float line = 1.0 - smoothstep(fw * 0.6, fw * 1.6, dLine);

  float k = floor(v + 0.5);
  float major = step(mod(abs(k) + 0.5, 5.0), 1.0); /* every 5th level bolder */
  float neg = step(k, -0.5);

  /* meteo convention: negative levels dashed. A secondary noise field
     crosses the contours transversally, breaking them into organic
     dashes. Skipped entirely at duty 1 (the approved look is solid). */
  float dash = 1.0;
  if (uDash < 0.999 && neg > 0.5) {
    float dn = vnoise(vec4(p * uScale * 6.0 + 17.0, uTime * 0.7));
    dash = step(fract(dn * 4.0), uDash);
  }

  /* graticule — very faint, every 15 deg, fading where lon lines pinch */
  float latd = degrees(asin(clamp(p.y, -1.0, 1.0))) / 15.0;
  float lond = degrees(atan(p.x, p.z)) / 15.0;
  float fl = fract(latd);
  float fo = fract(lond);
  float wLat = fwidth(latd) + 1e-4;
  float wLon = fwidth(lond) + 1e-4;
  float gLat = 1.0 - smoothstep(wLat * 0.5, wLat * 1.5, min(fl, 1.0 - fl));
  float gLon = (1.0 - smoothstep(wLon * 0.5, wLon * 1.5, min(fo, 1.0 - fo))) * step(wLon, 0.45);
  gLon *= smoothstep(0.0, 0.25, length(p.xz));
  float grat = max(gLat, gLon);

  /* palette: phosphor green / ink, amber under SEEK */
  vec3 cInk = mix(vec3(0.902, 0.949, 0.902), vec3(1.0, 0.69, 0.0), uSeek);
  vec3 cAcc = mix(vec3(0.2, 1.0, 0.4), vec3(1.0, 0.69, 0.0), uSeek);

  float zfade = mix(0.35, 1.0, pow(z, 0.4)); /* contours sink only near the limb */
  float la = line * dash * mix(0.5, 1.0, major) * uLineAlpha * zfade * inside;
  float ga = grat * uGratAlpha * zfade * inside;
  vec3 lineCol = mix(cInk, cAcc, mix(0.45, 0.85, major));

  /* limb ring */
  float wr = fwidth(rr) + 1e-4;
  float ring = (1.0 - smoothstep(wr, wr * 2.5, abs(rr - 1.0))) * 0.3;

  /* composite (premultiplied): graticule under contours, ring on top */
  float a = la + ga * (1.0 - la);
  vec3 c = lineCol * la + cInk * ga * (1.0 - la);
  c = cInk * ring + c * (1.0 - ring);
  a = ring + a * (1.0 - ring);

  outColor = vec4(c, a) * uAlpha;
}`;

/* ---------- GL wrapper ---------- */

export interface SynopticDrawOpts {
  radius: number; // sphere radius, device px
  time: number; // field time (morph)
  spin: number; // rad, about Y (include yaw)
  tilt: number; // rad, about X
  scale: number;
  levels: number;
  lineAlpha: number;
  gratAlpha: number;
  dash: number;
  seek: number; // 0 tuned -> 1 seeking (amber)
  alpha: number; // whole-layer fade (scene pose)
}

export interface Synoptic {
  fit(side: number): void; // square canvas, device px
  draw(o: SynopticDrawOpts): void;
}

export const createSynoptic = (canvas: HTMLCanvasElement): Synoptic | null => {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false });
  if (!gl) return null;

  const compile = (type: number, src: string): WebGLShader | null => {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('synoptic:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('synoptic:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const u = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(prog, name);
  const uRes = u('uRes');
  const uRadius = u('uRadius');
  const uTime = u('uTime');
  const uSpin = u('uSpin');
  const uTilt = u('uTilt');
  const uScale = u('uScale');
  const uLevels = u('uLevels');
  const uLineAlpha = u('uLineAlpha');
  const uGratAlpha = u('uGratAlpha');
  const uDash = u('uDash');
  const uSeek = u('uSeek');
  const uAlpha = u('uAlpha');

  return {
    fit(side: number): void {
      canvas.width = canvas.height = side;
    },
    draw(o: SynopticDrawOpts): void {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uRadius, o.radius);
      gl.uniform1f(uTime, o.time);
      gl.uniform1f(uSpin, o.spin);
      gl.uniform1f(uTilt, o.tilt);
      gl.uniform1f(uScale, o.scale);
      gl.uniform1f(uLevels, o.levels);
      gl.uniform1f(uLineAlpha, o.lineAlpha);
      gl.uniform1f(uGratAlpha, o.gratAlpha);
      gl.uniform1f(uDash, o.dash);
      gl.uniform1f(uSeek, o.seek);
      gl.uniform1f(uAlpha, o.alpha);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
};

/* ---------- CPU twin of the noise ---------- */

const U32 = 4294967296;

const pcg4dx = (a: number, b: number, c: number, d: number): number => {
  a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
  b = (Math.imul(b, 1664525) + 1013904223) >>> 0;
  c = (Math.imul(c, 1664525) + 1013904223) >>> 0;
  d = (Math.imul(d, 1664525) + 1013904223) >>> 0;
  a = (a + Math.imul(b, d)) >>> 0;
  b = (b + Math.imul(c, a)) >>> 0;
  c = (c + Math.imul(a, b)) >>> 0;
  d = (d + Math.imul(b, c)) >>> 0;
  a = (a ^ (a >>> 16)) >>> 0;
  b = (b ^ (b >>> 16)) >>> 0;
  c = (c ^ (c >>> 16)) >>> 0;
  d = (d ^ (d >>> 16)) >>> 0;
  a = (a + Math.imul(b, d)) >>> 0;
  return a;
};

const vhash = (x: number, y: number, z: number, w: number): number =>
  pcg4dx(x >>> 0, y >>> 0, z >>> 0, w >>> 0) / U32;

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

const vnoise = (px: number, py: number, pz: number, pw: number): number => {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const iz = Math.floor(pz);
  const iw = Math.floor(pw);
  const ux = fade(px - ix);
  const uy = fade(py - iy);
  const uz = fade(pz - iz);
  const uw = fade(pw - iw);
  let acc = 0;
  for (let w = 0; w < 2; w++)
    for (let z = 0; z < 2; z++)
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          const wgt =
            (x ? ux : 1 - ux) * (y ? uy : 1 - uy) * (z ? uz : 1 - uz) * (w ? uw : 1 - uw);
          acc += wgt * vhash(ix + x, iy + y, iz + z, iw + w);
        }
  return acc * 2 - 1;
};

/* must mirror the GLSL fbm exactly: 3 octaves, gain 0.5, SHIFT (13,7,3,5) */
export const fbm = (px: number, py: number, pz: number, pw: number): number => {
  let a = 0.5;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < 3; i++) {
    sum += a * vnoise(px, py, pz, pw);
    norm += a;
    px = px * 2 + 13;
    py = py * 2 + 7;
    pz = pz * 2 + 3;
    pw = pw * 2 + 5;
    a *= 0.5;
  }
  return sum / norm;
};

export const fieldAt = (latDeg: number, lonDeg: number, scale: number, time: number): number => {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const cl = Math.cos(lat);
  return fbm(cl * Math.sin(lon) * scale, Math.sin(lat) * scale, cl * Math.cos(lon) * scale, time);
};

/* ---------- H/L labels: world-anchored extrema of the same field ---------- */

export interface ExtLabel {
  kind: 'H' | 'L';
  lat: number; // deg
  lon: number; // deg
  val: number; // hPa
  seen: number; // ms timestamp of last scan hit
}

export interface ExtremaTracker {
  scan(scale: number, time: number, now: number): void;
  labels(): ExtLabel[];
}

const STEP = 6; // deg — coarse is fine, extrema are broad
const LATS: number[] = [];
const LONS: number[] = [];
for (let lat = -84; lat <= 84; lat += STEP) LATS.push(lat);
for (let lon = -180; lon < 180; lon += STEP) LONS.push(lon);

export const createExtremaTracker = (): ExtremaTracker => {
  let known: ExtLabel[] = [];

  return {
    scan(scale: number, time: number, now: number): void {
      const grid: number[][] = LATS.map((lat) =>
        LONS.map((lon) => fieldAt(lat, lon, scale, time)),
      );
      const found: Array<{ kind: 'H' | 'L'; lat: number; lon: number; f: number }> = [];

      for (let i = 1; i < LATS.length - 1; i++) {
        for (let j = 0; j < LONS.length; j++) {
          const f = grid[i]![j]!;
          if (Math.abs(f) < 0.2) continue;
          let isMax = true;
          let isMin = true;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (!di && !dj) continue;
              const n = grid[i + di]![(j + dj + LONS.length) % LONS.length]!;
              if (n >= f) isMax = false;
              if (n <= f) isMin = false;
            }
          }
          if (isMax || isMin) {
            found.push({ kind: isMax ? 'H' : 'L', lat: LATS[i]!, lon: LONS[j]!, f });
          }
        }
      }

      found.sort((a, b) => Math.abs(b.f) - Math.abs(a.f));

      for (const e of found.slice(0, 8)) {
        const val = Math.round(1013 + e.f * 38); /* plausible synoptic range */
        const old = known.find(
          (l) =>
            l.kind === e.kind &&
            Math.hypot(l.lat - e.lat, (l.lon - e.lon) * Math.cos((e.lat * Math.PI) / 180)) < 14,
        );
        if (old) {
          old.lat = e.lat;
          old.lon = e.lon;
          old.val = val;
          old.seen = now;
        } else {
          known.push({ kind: e.kind, lat: e.lat, lon: e.lon, val, seen: now });
        }
      }
      known = known.filter((l) => now - l.seen < 1200);
    },
    labels(): ExtLabel[] {
      return known;
    },
  };
};
