// Процедурные текстуры: всё рисуется на canvas, внешние картинки не нужны.
// Поверхности планет зависят от климата: шумовые поля считаются один раз,
// а раскраска (льды, океаны, растительность, лава) пересчитывается быстро.
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

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function palette(colors, t) {
  t = Math.min(0.9999, Math.max(0, t)) * (colors.length - 1);
  const i = Math.floor(t), f = t - i;
  const a = colors[i], b = colors[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hash = (i) => (Math.imul(i ^ 0x5bd1e995, 2654435761) >>> 0) / 4294967296;

class Layer {
  constructor(w, h, srgb = true) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');
    this.img = this.ctx.createImageData(w, h);
    this.tex = new THREE.CanvasTexture(this.canvas);
    if (srgb) this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
  }
  set(i, c, a = 255) {
    const d = this.img.data, k = i * 4;
    d[k] = c[0];
    d[k + 1] = c[1];
    d[k + 2] = c[2];
    d[k + 3] = a;
  }
  flush() {
    this.ctx.putImageData(this.img, 0, 0);
    this.tex.needsUpdate = true;
  }
}

// Заполнение поля по точкам сферы (равнопромежуточная проекция).
function forSphere(W, H, fn) {
  for (let y = 0; y < H; y++) {
    const lat = (0.5 - (y + 0.5) / H) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < W; x++) {
      const lon = ((x + 0.5) / W) * Math.PI * 2;
      fn(cl * Math.cos(lon), sl, cl * Math.sin(lon), y * W + x, lat, lon);
    }
  }
}

// Ударные кратеры: чаша с валом, вписываются прямо в поле высот.
function addCraters(field, W, H, count, seed, maxR, minR = 0.006, depth = 0.22) {
  const r = rng(seed);
  for (let c = 0; c < count; c++) {
    const lat0 = Math.asin(2 * r() - 1), lon0 = r() * Math.PI * 2;
    const a = minR + (maxR - minR) * Math.pow(r(), 3);
    const dep = depth * (0.6 + r() * 0.6);
    const cx = Math.cos(lat0) * Math.cos(lon0), cy = Math.sin(lat0), cz = Math.cos(lat0) * Math.sin(lon0);
    const ext = a * 1.7;
    const y0 = clamp(Math.floor((0.5 - (lat0 + ext) / Math.PI) * H), 0, H - 1);
    const y1 = clamp(Math.ceil((0.5 - (lat0 - ext) / Math.PI) * H), 0, H - 1);
    for (let y = y0; y <= y1; y++) {
      const lat = (0.5 - (y + 0.5) / H) * Math.PI;
      const cl = Math.cos(lat), sl = Math.sin(lat);
      const dLon = cl < 0.05 ? Math.PI : Math.min(Math.PI, ext / cl);
      const x0 = Math.floor(((lon0 - dLon) / (Math.PI * 2)) * W), x1 = Math.ceil(((lon0 + dLon) / (Math.PI * 2)) * W);
      for (let xx = x0; xx <= x1; xx++) {
        const x = ((xx % W) + W) % W;
        const lon = ((x + 0.5) / W) * Math.PI * 2;
        const dot = cl * Math.cos(lon) * cx + sl * cy + cl * Math.sin(lon) * cz;
        const t = Math.acos(clamp(dot, -1, 1)) / a;
        if (t > 1.7) continue;
        const bowl = t < 1 ? dep * (t * t - 1) : 0;
        const rim = dep * 0.35 * Math.exp(-(((t - 1) / 0.2) ** 2));
        field[y * W + x] += bowl + rim;
      }
    }
  }
}

function bumpFrom(field, W, H, lo, hi) {
  const l = new Layer(W, H, false);
  for (let i = 0; i < W * H; i++) {
    const v = clamp((field[i] - lo) / (hi - lo), 0, 1) * 255;
    l.set(i, [v, v, v]);
  }
  l.flush();
  return l.tex;
}

// ---------- поверхность планеты, зависящая от климата ----------
export class PlanetSurface {
  constructor(p, seed) {
    this.p = p;
    const W = (this.W = p.kind === 'earth' ? 1536 : 1024);
    const H = (this.H = W / 2);
    const fbm = makeNoise(seed);
    const n = (this.n = new Float32Array(W * H));
    const m = (this.m = new Float32Array(W * H));
    this.palette = p.colors.map(hexToRgb);

    if (p.kind === 'earth') {
      forSphere(W, H, (x, y, z, i) => {
        n[i] = fbm(x * 1.8 + 3, y * 1.8, z * 1.8, 6);
        m[i] = fbm(x * 5 + 10, y * 5, z * 5, 4);
      });
    } else if (p.kind === 'gas' || p.kind === 'ice') {
      forSphere(W, H, (x, y, z, i) => {
        n[i] = fbm(x * 3, y * 9, z * 3, 5);
        m[i] = fbm(x * 7, y * 26, z * 7, 4);
      });
    } else if (p.kind === 'cloudy') {
      forSphere(W, H, (x, y, z, i) => {
        const q = fbm(x * 2, y * 2, z * 2, 4);
        n[i] = fbm(x * 2 + q * 3, y * 5 + q * 2, z * 2, 6);
        m[i] = fbm(x * 9, y * 14, z * 9, 3);
      });
    } else {
      forSphere(W, H, (x, y, z, i) => {
        n[i] = fbm(x * 2.5, y * 2.5, z * 2.5, 6);
        m[i] = fbm(x * 9 + 5, y * 9, z * 9, 4);
      });
      if (p.craters) addCraters(n, W, H, 420, seed * 7 + 1, 0.16, 0.008, 0.2);
      else addCraters(n, W, H, 90, seed * 7 + 1, 0.07, 0.006, 0.12);
    }

    this.color = new Layer(W, H);
    this.map = this.color.tex;
    const solid = p.kind === 'earth' || p.kind === 'rocky';
    if (solid) {
      this.bump = p.kind === 'earth' ? bumpFrom(n, W, H, 0.5, 0.8) : bumpFrom(n, W, H, 0.2, 0.8);
      this.roughL = new Layer(W, H, false);
      this.roughness = this.roughL.tex;
    }
    this.emissiveL = new Layer(W, H);
    this.emissive = this.emissiveL.tex;
    this.T = null;
  }

  // T — средняя температура поверхности, °C. Возвращает, что сейчас видно.
  render(T) {
    this.T = T;
    const k = this.p.kind;
    if (k === 'earth') return this.renderEarth(T);
    if (k === 'rocky') return this.renderRocky(T);
    if (k === 'cloudy') return this.renderCloudy(T);
    return this.renderGiant(T);
  }

  rowLat(i) {
    return (0.5 - (Math.floor(i / this.W) + 0.5) / this.H) * Math.PI;
  }

  renderEarth(T) {
    const { W, H, n, m, color, roughL, emissiveL } = this;
    const sea = 0.5 - 0.5 * smooth(55, 115, T);
    const iceLat = (Math.PI / 2) * clamp((T + 30) / 58, 0, 1.25);
    const veg = smooth(-8, 8, T) * (1 - smooth(28, 48, T));
    const hot = smooth(45, 120, T);
    const scorch = smooth(150, 500, T);
    const lava = smooth(450, 900, T);
    const deep = [10, 30, 78], shallow = [30, 96, 160], green = [48, 104, 46], forest = [28, 74, 36];
    const desert = [200, 172, 114], rock = [112, 98, 76], seabed = [196, 186, 162];
    let cities = 0;
    for (let y = 0; y < H; y++) {
      const lat = (0.5 - (y + 0.5) / H) * Math.PI;
      const alat = Math.abs(lat);
      const dryBand = smooth(0.15, 0.55, 1 - Math.abs(alat - 0.42) * 2.5);
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const h = n[i], d = m[i];
        let c, r = 0.9, land = h >= sea, e = null;
        if (!land) {
          c = mix(shallow, deep, smooth(0, 0.14, sea - h));
          c = mix(c, [70, 84, 70], hot * 0.45);
          r = 0.32;
        } else {
          const dry = clamp(dryBand * smooth(0.42, 0.62, d) + hot, 0, 1);
          c = mix(mix(green, forest, smooth(0.45, 0.6, d)), desert, dry);
          c = mix(desert, c, veg);
          c = mix(c, rock, smooth(sea + 0.11, sea + 0.2, h));
          if (h < 0.5) c = mix(seabed, c, smooth(0.5 - 0.05, 0.5, h) * 0.3);
          c = mix(c, [118, 92, 72], hot * 0.6);
          c = mix(c, [62, 50, 46], scorch * 0.85);
          if (veg > 0.35 && h < sea + 0.09 && d > 0.48 && hash(i) > 0.985 - veg * 0.012) {
            e = [255, 196, 120];
            cities++;
          }
        }
        const ice = smooth(iceLat - 0.04, iceLat + 0.04, alat + (d - 0.5) * 0.4 + (land ? 0.1 : 0));
        if (ice > 0) {
          c = mix(c, land ? [236, 241, 248] : [214, 230, 242], ice);
          r = r + (0.6 - r) * ice;
          if (ice > 0.5) e = null;
        }
        if (lava > 0) {
          const ridge = 1 - Math.abs(2 * d - 1);
          const g = lava * smooth(0.82, 0.97, ridge);
          if (g > 0) e = [255 * g, 80 * g, 16 * g];
          c = mix(c, [40, 30, 28], lava * 0.7);
        }
        color.set(i, c);
        roughL.set(i, [r * 255, r * 255, r * 255]);
        emissiveL.set(i, e || [0, 0, 0]);
      }
    }
    color.flush();
    roughL.flush();
    emissiveL.flush();
    return { nightOnly: lava < 0.05, glow: cities > 0 || lava > 0 };
  }

  renderRocky(T) {
    const { W, H, n, m, color, roughL, emissiveL, palette: pal } = this;
    const isMars = this.p.id === 'mars';
    const water = isMars ? smooth(-5, 20, T) * 0.44 : 0;
    const iceLat = isMars ? 1.3 + (T + 65) * 0.006 : 1.57 + (T + 110) * 0.006;
    const veg = isMars ? smooth(5, 18, T) * (1 - smooth(35, 50, T)) : 0;
    const glow = smooth(350, 900, T);
    let lit = false;
    for (let i = 0; i < W * H; i++) {
      const h = n[i], d = m[i];
      const lat = this.rowLat(i);
      let c = palette(pal, h * 0.8 + d * 0.2);
      // свежие кратеры светлее, дно темнее
      c = mix(c, [58, 56, 54], smooth(0.1, -0.1, h - 0.35) * 0.35);
      let r = 0.95, e = [0, 0, 0];
      if (h < water) {
        c = mix([40, 100, 150], [16, 46, 96], smooth(0, 0.15, water - h));
        r = 0.32;
      } else if (veg > 0) {
        c = mix(c, [86, 112, 58], veg * 0.8 * (1 - smooth(water, water + 0.18, h)));
      }
      const ice = smooth(iceLat - 0.04, iceLat + 0.04, Math.abs(lat) + (d - 0.5) * 0.25);
      if (ice > 0) {
        c = mix(c, [238, 236, 232], ice);
        r = r + (0.6 - r) * ice;
      }
      if (glow > 0) {
        c = mix(c, [46, 36, 34], glow * 0.7);
        const ridge = 1 - Math.abs(2 * d - 1);
        const g = glow * smooth(0.8, 0.96, ridge);
        if (g > 0) {
          e = [255 * g, 90 * g, 20 * g];
          lit = true;
        }
      }
      color.set(i, c);
      roughL.set(i, [r * 255, r * 255, r * 255]);
      emissiveL.set(i, e);
    }
    color.flush();
    roughL.flush();
    emissiveL.flush();
    return { nightOnly: false, glow: lit };
  }

  renderCloudy(T) {
    const { W, H, n, m, color, emissiveL, palette: pal } = this;
    const cold = smooth(250, -40, T);
    const hot = smooth(500, 1000, T);
    for (let i = 0; i < W * H; i++) {
      let c = palette(pal, n[i] * 0.85 + m[i] * 0.15);
      c = mix(c, [236, 234, 222], cold * 0.6);
      c = mix(c, [196, 120, 70], hot * 0.6);
      color.set(i, c);
      emissiveL.set(i, [0, 0, 0]);
    }
    color.flush();
    emissiveL.flush();
    return { nightOnly: false, glow: false };
  }

  renderGiant(T) {
    const { W, H, n, m, color, emissiveL, palette: pal, p } = this;
    const bandCount = p.kind === 'gas' ? 9 : 4;
    const turb = p.kind === 'gas' ? 0.55 : 0.2;
    const hot = smooth(60, 650, T);
    const glow = smooth(700, 1400, T);
    const cold = smooth(-150, -260, T);
    for (let y = 0; y < H; y++) {
      const lat = (0.5 - (y + 0.5) / H) * Math.PI;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const lon = ((x + 0.5) / W) * Math.PI * 2;
        const t = Math.sin(lat * bandCount + (n[i] - 0.5) * turb * 6) * 0.5 + 0.5;
        let c = palette(pal, t * 0.85 + m[i] * 0.15);
        if (p.spot) {
          const sLat = p.id === 'jupiter' ? -0.38 : -0.35;
          const dLon = Math.atan2(Math.sin(lon - 2.2), Math.cos(lon - 2.2));
          const dist = Math.hypot(dLon / 0.22, (lat - sLat) / 0.1);
          const spotCol = p.id === 'jupiter' ? [190, 92, 60] : [20, 32, 90];
          c = mix(c, spotCol, smooth(1.0, 0.6, dist + (n[i] - 0.5) * 0.4));
        }
        c = mix(c, mix([92, 48, 36], [150, 70, 40], t), hot * 0.75);
        c = mix(c, [228, 236, 240], cold * 0.4);
        color.set(i, c);
        const g = glow * smooth(0.55, 0.9, t);
        emissiveL.set(i, [255 * g, 70 * g, 20 * g]);
      }
    }
    color.flush();
    emissiveL.flush();
    return { nightOnly: false, glow: glow > 0 };
  }
}

// ---------- облака Земли ----------
export class CloudLayer {
  constructor(seed) {
    const W = (this.W = 1024), H = (this.H = 512);
    const fbm = makeNoise(seed);
    this.f = new Float32Array(W * H);
    forSphere(W, H, (x, y, z, i, lat) => {
      const q = fbm(x * 2, y * 2, z * 2, 3);
      // полосы облачности: экваториальная и умеренные широты
      const band = 0.06 * Math.cos(lat * 6);
      this.f[i] = fbm(x * 3 + q * 2, y * 6, z * 3 + q, 6) + band;
    });
    this.layer = new Layer(W, H);
    this.map = this.layer.tex;
  }
  render(T) {
    const warm = smooth(15, 130, T);
    const cold = smooth(5, -60, T);
    const lo = 0.5 - 0.36 * warm + 0.08 * cold;
    const tint = mix([255, 255, 255], [238, 214, 158], smooth(100, 260, T));
    const maxA = 235 + 20 * warm;
    for (let i = 0; i < this.f.length; i++) {
      this.layer.set(i, tint, smooth(lo, lo + 0.22, this.f[i]) * maxA);
    }
    this.layer.flush();
  }
}

// ---------- спутники ----------
export function moonTextures(hex, seed) {
  const W = 512, H = 256;
  const fbm = makeNoise(seed);
  const base = hexToRgb(hex);
  const f = new Float32Array(W * H);
  forSphere(W, H, (x, y, z, i) => (f[i] = fbm(x * 4, y * 4, z * 4, 6)));
  addCraters(f, W, H, 160, seed * 13, 0.18, 0.01, 0.18);
  const l = new Layer(W, H);
  for (let i = 0; i < W * H; i++) {
    const k = 0.55 + f[i] * 0.75;
    l.set(i, base.map((v) => Math.min(255, v * k)));
  }
  l.flush();
  return { map: l.tex, bump: bumpFrom(f, W, H, 0.2, 0.8) };
}

// ---------- разрез: концентрические слои ----------
export function interiorTexture(layers) {
  const s = 1024, c = s / 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d');
  const r = rng(99);
  layers.forEach((L, idx) => {
    const R = Math.max(L.r * c, idx === 0 ? 0 : 3);
    const inner = (layers[idx + 1]?.r ?? 0) * c;
    const col = hexToRgb(L.color);
    const light = mix(col, [255, 255, 255], 0.22), dark = mix(col, [0, 0, 0], 0.25);
    const g = ctx.createRadialGradient(c, c, inner, c, c, R);
    g.addColorStop(0, `rgb(${light.map(Math.round)})`);
    g.addColorStop(1, `rgb(${dark.map(Math.round)})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.fill();
    // зернистость и «течения» внутри слоя
    const band = R - inner;
    for (let k = 0; k < band * 6; k++) {
      const rr = inner + r() * band, a = r() * Math.PI * 2;
      ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
      ctx.beginPath();
      ctx.ellipse(c + Math.cos(a) * rr, c + Math.sin(a) * rr, 1 + r() * 4, 0.6 + r() * 1.5, a + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.stroke();
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function glowTexture() {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,230,160,1)');
  g.addColorStop(0.2, 'rgba(255,200,110,0.55)');
  g.addColorStop(0.5, 'rgba(255,150,60,0.12)');
  g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function ringTexture(faint) {
  const w = 2048;
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
      const n = fbm(t * 60, 0.5, 0.5, 5);
      const fine = fbm(t * 400, 2.5, 0.5, 2);
      a = 0.2 + n * 0.7 + (fine - 0.5) * 0.25;
      if (t > 0.58 && t < 0.63) a *= 0.06; // щель Кассини
      if (t > 0.86 && t < 0.87) a *= 0.2; // щель Энке
      if (t < 0.15) a *= 0.35; // тусклое кольцо C
      a *= smooth(0, 0.03, t) * smooth(1, 0.96, t);
      c = mix([150, 130, 100], [238, 225, 194], n);
    }
    ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 1).toFixed(3)})`;
    ctx.fillRect(x, 0, 1, 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(16, 16, 15, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}
