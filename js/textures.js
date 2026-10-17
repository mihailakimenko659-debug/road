// Процедурные текстуры: всё рисуется на canvas, внешние картинки не нужны.
import * as THREE from 'three';

// --- 3D value noise (бесшовно ложится на сферу) ---
function makeNoise(seed) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  let s = seed * 9301 + 49297;
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const val = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    s = (s * 9301 + 49297) % 233280;
    val[i] = s / 233280;
  }
  const fade = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const h = (x, y, z) => val[perm[perm[perm[x & 255] + (y & 255)] + (z & 255)]];

  function noise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    return lerp(
      lerp(lerp(h(xi, yi, zi), h(xi + 1, yi, zi), u), lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
      lerp(lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v),
      w,
    );
  }
  return function fbm(x, y, z, oct = 5) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * noise(x * f, y * f, z * f);
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / norm;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function palette(colors, t) {
  const c = colors.map(hexToRgb);
  t = Math.min(0.9999, Math.max(0, t)) * (c.length - 1);
  const i = Math.floor(t), f = t - i;
  return [0, 1, 2].map((k) => c[i][k] + (c[i + 1][k] - c[i][k]) * f);
}

const mix = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t);
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Обход пикселей равнопромежуточной проекции с координатами точки на сфере.
function paint(w, h, fn) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - (y + 0.5) / h) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < w; x++) {
      const lon = ((x + 0.5) / w) * Math.PI * 2;
      const c = fn(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat, lon);
      const i = (y * w + x) * 4;
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = c[3] ?? 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function planetTexture(p, seed) {
  const fbm = makeNoise(seed);
  const W = 1024, H = 512;
  const col = p.colors;

  if (p.kind === 'earth') {
    const deep = [14, 38, 92], shallow = [36, 92, 160];
    return paint(W, H, (x, y, z, lat) => {
      const n = fbm(x * 1.8 + 3, y * 1.8, z * 1.8, 6);
      const m = fbm(x * 4 + 10, y * 4, z * 4, 4);
      const alat = Math.abs(lat);
      let c;
      if (n < 0.5) {
        c = mix(deep, shallow, smooth(0.38, 0.5, n));
      } else {
        const dry = smooth(0.15, 0.55, 1 - Math.abs(Math.abs(lat) - 0.42) * 2.5) * smooth(0.45, 0.65, m);
        c = mix([52, 112, 52], [196, 170, 112], dry);
        c = mix(c, [110, 96, 70], smooth(0.62, 0.72, n));
      }
      const ice = smooth(1.15, 1.3, alat + (m - 0.5) * 0.3);
      return mix(c, [240, 245, 250], ice);
    });
  }

  if (p.kind === 'gas' || p.kind === 'ice') {
    const bandCount = p.kind === 'gas' ? 9 : 4;
    const turb = p.kind === 'gas' ? 0.55 : 0.2;
    return paint(W, H, (x, y, z, lat, lon) => {
      const n = fbm(x * 3, y * 9, z * 3, 5);
      const t = Math.sin(lat * bandCount + (n - 0.5) * turb * 6) * 0.5 + 0.5;
      let c = palette(col, t * 0.85 + fbm(x * 6, y * 20, z * 6, 3) * 0.15);
      if (p.spot) {
        const sLat = p.id === 'jupiter' ? -0.38 : -0.35;
        const dLon = Math.atan2(Math.sin(lon - 2.2), Math.cos(lon - 2.2));
        const dist = Math.hypot(dLon / 0.22, (lat - sLat) / 0.1);
        const spotCol = p.id === 'jupiter' ? [190, 92, 60] : [20, 32, 90];
        c = mix(c, spotCol, smooth(1.0, 0.6, dist + (n - 0.5) * 0.4));
      }
      return c;
    });
  }

  if (p.kind === 'cloudy') {
    return paint(W, H, (x, y, z) => {
      const q = fbm(x * 2, y * 2, z * 2, 4);
      const n = fbm(x * 2 + q * 3, y * 5 + q * 2, z * 2, 6);
      return palette(col, n);
    });
  }

  // каменистые планеты
  return paint(W, H, (x, y, z, lat) => {
    const n = fbm(x * 2.5, y * 2.5, z * 2.5, 6);
    const m = fbm(x * 9 + 5, y * 9, z * 9, 4);
    let c = palette(col, n * 0.8 + m * 0.2);
    if (p.craters) {
      const cr = fbm(x * 14, y * 14, z * 14, 3);
      c = mix(c, [60, 58, 55], smooth(0.62, 0.72, cr) * 0.5);
    }
    if (p.polarCaps) c = mix(c, [235, 232, 228], smooth(1.25, 1.35, Math.abs(lat) + (m - 0.5) * 0.2));
    return c;
  });
}

export function cloudTexture(seed) {
  const fbm = makeNoise(seed);
  return paint(1024, 512, (x, y, z) => {
    const q = fbm(x * 2, y * 2, z * 2, 3);
    const n = fbm(x * 3 + q * 2, y * 6, z * 3 + q, 6);
    const a = smooth(0.5, 0.72, n) * 235;
    return [255, 255, 255, a];
  });
}

export function sunTexture() {
  const fbm = makeNoise(7);
  return paint(512, 256, (x, y, z) => {
    const n = fbm(x * 6, y * 6, z * 6, 5);
    return palette(['#ff7a1a', '#ffb43a', '#ffe08a', '#fff4d0'], n * 1.2 - 0.1);
  });
}

export function moonTexture(hex, seed) {
  const fbm = makeNoise(seed);
  const base = hexToRgb(hex);
  return paint(256, 128, (x, y, z) => {
    const n = fbm(x * 4, y * 4, z * 4, 5);
    const k = 0.65 + n * 0.6;
    return base.map((v) => Math.min(255, v * k));
  });
}

export function glowTexture(inner = 'rgba(255,230,160,1)', outer = 'rgba(255,140,40,0)') {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.2, 'rgba(255,200,110,0.55)');
  g.addColorStop(0.5, 'rgba(255,150,60,0.12)');
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function ringTexture(faint) {
  const w = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  const fbm = makeNoise(11);
  for (let x = 0; x < w; x++) {
    const t = x / w;
    let a, c;
    if (faint) {
      a = (Math.sin(t * 60) > 0.85 ? 0.5 : 0.04) * smooth(0, 0.1, t) * smooth(1, 0.9, t);
      c = [200, 220, 225];
    } else {
      const n = fbm(t * 40, 0.5, 0.5, 4);
      a = 0.25 + n * 0.75;
      if (t > 0.58 && t < 0.63) a *= 0.08; // щель Кассини
      if (t < 0.15) a *= 0.35; // тусклое кольцо C
      a *= smooth(0, 0.03, t) * smooth(1, 0.96, t);
      c = mix([150, 130, 100], [235, 222, 190], n);
    }
    ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
    ctx.fillRect(x, 0, 1, 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
