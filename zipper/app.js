import * as THREE from 'three';
import { DRAW, PRODUCTS } from './products.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// затухающая пружина: вещь «садится» на место с маленьким отскоком
const spring = (t) => (t >= 1 ? 1 : 1 - Math.exp(-6.5 * t) * Math.cos(10.5 * t));
const DEG = Math.PI / 180;

const sticky = $('#sticky'), scrolly = $('#scrolly'), canvas = $('#cloth');
const hint = $('#hint'), header = $('#header'), stageHead = $('#stageHead'), grid = $('#grid');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let W = 0, H = 0;

// Сценарий прокрутки (доли от 0 до 1)
const T = {
  unzip: [0.02, 0.62], // бегунок проходит всю молнию, уходя в глубину
  tilt: [0.04, 0.6], // плоскость ткани наклоняется
  widen: [0.36, 0.62], // разрез раскрывается шире
  exit: [0.5, 0.8], // половины уезжают за края экрана
};
const phase = ([a, b], p) => clamp((p - a) / (b - a));

// ======================================================================
// Карточки коллекции
// ======================================================================
const cards = PRODUCTS.map((p, i) => {
  const el = document.createElement('article');
  el.className = 'card';
  el.style.setProperty('--tile', p.tile);
  el.innerHTML = `<span class="sku">${p.sku}</span>
    <svg viewBox="0 0 200 200" role="img" aria-label="${p.name}">${DRAW[p.type](p.c, p.a, i)}</svg>
    <div class="row"><b>${p.name}</b><span class="price">${p.price}</span></div>`;
  grid.appendChild(el);
  return { el };
});

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// большинство вещей вылетает из глубины разреза, остальные — сбоку и по дуге
const TYPES = ['depth', 'depth', 'depth', 'left', 'right', 'toss', 'depth', 'spiral'];
cards.forEach((c) => {
  c.type = TYPES[Math.floor(rnd() * TYPES.length)];
  c.start = 0.3 + rnd() * 0.42;
  c.dur = 0.2 + rnd() * 0.08;
  c.fx = (rnd() - 0.5) * 2;
  c.fy = (rnd() - 0.5) * 2;
  c.rz = (rnd() - 0.5) * 220;
  c.ry = (rnd() - 0.5) * 140;
  c.a0 = rnd() * Math.PI * 2;
});
let visibleCards = 0;

function layoutCards() {
  const cols = W >= 1280 ? 6 : W >= 980 ? 5 : W >= 700 ? 4 : 3;
  const rows = W >= 700 ? 2 : 3;
  visibleCards = Math.min(PRODUCTS.length, cols * rows);
  grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  grid.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
  cards.forEach((c, i) => (c.el.hidden = i >= visibleCards));
  $('#stageCount').textContent = `${visibleCards} вещей · листайте дальше`;
  // центр каждой карточки в координатах экрана (без учёта трансформаций)
  cards.forEach((c) => {
    c.cx = grid.offsetLeft + c.el.offsetLeft + c.el.offsetWidth / 2;
    c.cy = grid.offsetTop + c.el.offsetTop + c.el.offsetHeight / 2;
  });
}

function flight(c, t) {
  const e = spring(t);
  const inv = 1 - e;
  const air = 1 - easeOut(clamp(t * 1.15)); // «высота» над столом — для тени
  let x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1;
  switch (c.type) {
    case 'depth': {
      // из точки, куда уходит молния, по дуге к своему месту
      const sx = W / 2 - c.cx + c.fx * 40, sy = H * 0.72 - c.cy;
      const arc = Math.sin(clamp(t) * Math.PI) * H * 0.12;
      x = sx * inv; y = sy * inv - arc; z = -3200 * inv + 180 * air;
      rx = 75 * inv; rz = c.rz * 0.35 * inv; ry = c.ry * 0.3 * inv;
      break;
    }
    case 'left':
    case 'right': {
      const side = c.type === 'left' ? -1 : 1;
      x = side * W * 0.95 * inv; y = c.fy * H * 0.3 * inv - Math.sin(clamp(t) * Math.PI) * H * 0.18;
      rz = c.rz * inv; ry = side * Math.abs(c.ry) * inv; z = 300 * air;
      break;
    }
    case 'spiral': {
      const ang = c.a0 + inv * Math.PI * 3.2, rad = inv * Math.max(W, H) * 0.7;
      x = Math.cos(ang) * rad; y = Math.sin(ang) * rad; rz = inv * 360; s = 0.5 + 0.5 * e;
      break;
    }
    case 'toss':
      x = c.fx * W * 0.6 * inv; y = -Math.sin(clamp(t) * Math.PI) * H * 0.35 + H * 0.6 * inv; rz = c.rz * 1.6 * inv; rx = 30 * inv; z = 350 * air;
      break;
  }
  rz += Math.sin(t * Math.PI * 3) * 6 * (1 - t);
  return {
    transform: `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg) scale(${s.toFixed(3)})`,
    air,
    sheen: rz + ry * 0.5 + rx * 0.3,
  };
}

function renderCards(p) {
  const th = clamp((p - 0.55) / 0.14);
  stageHead.style.opacity = th.toFixed(3);
  stageHead.style.transform = `translateY(${((1 - easeOut(th)) * 30).toFixed(1)}px)`;
  for (let i = 0; i < visibleCards; i++) {
    const c = cards[i];
    const t = clamp((p - c.start) / c.dur);
    const st = c.el.style;
    st.opacity = clamp(t * 4).toFixed(3);
    if (t >= 1) {
      st.transform = 'none';
      st.boxShadow = '';
      st.setProperty('--sheen-o', 0);
      st.pointerEvents = '';
      // после посадки снимаем отдельный слой, чтобы карточка перерисовалась начисто
      st.willChange = 'auto';
      continue;
    }
    const f = flight(c, t);
    st.transform = f.transform;
    // в воздухе тень мягкая и далёкая, при посадке — плотная и короткая
    st.boxShadow = `0 1px 0 rgba(0,0,0,.04), 0 ${(18 + f.air * 70).toFixed(0)}px ${(40 + f.air * 90).toFixed(0)}px -${(24 - f.air * 14).toFixed(0)}px rgba(23,26,23,${(0.45 - f.air * 0.3).toFixed(2)})`;
    st.setProperty('--sheen', f.sheen.toFixed(1));
    st.setProperty('--sheen-o', clamp(Math.abs(f.sheen) / 40).toFixed(2));
    st.pointerEvents = 'none';
    st.willChange = 'transform, opacity';
  }
}

// ======================================================================
// Ткань с молнией (WebGL)
// ======================================================================
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.body.classList.add('no-webgl');
}

const C = {}; // текущая сцена: всё, что пересоздаётся при изменении размеров
const TOOTH = 11; // шаг зубцов, px
const R_CURL = 16; // радиус сгиба отворота, px

// --- шум для складок ---
const NOISE = new Float32Array(1024).map(() => Math.random());
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const h = (i, j) => NOISE[((Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0) & 1023];
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * u;
  const b = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * u;
  return a + (b - a) * v;
}

function noiseCanvas(size, alpha) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    img.data.set([v, v, v, Math.random() * alpha * 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Холст под текстуру: экран плюс поля сбоку, сверху и длинный «хвост» ткани снизу.
function surface(ext, scale) {
  const c = document.createElement('canvas');
  c.width = Math.round((W + 2 * ext.m) * scale);
  c.height = Math.round((H + ext.mt + ext.mb) * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(ext.m, ext.mt);
  return { c, ctx, x0: -ext.m, y0: -ext.mt, w: W + 2 * ext.m, h: H + ext.mt + ext.mb };
}

function drawTape(ctx, r) {
  ctx.fillStyle = '#1a231d';
  ctx.fillRect(W / 2 - 26, r.y0, 52, r.h);
  for (let y = r.y0; y < r.y0 + r.h; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${(0.02 + Math.random() * 0.03).toFixed(3)})`;
    ctx.fillRect(W / 2 - 26, y, 52, 1);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(W / 2 - 26, r.y0, 1.5, r.h);
  ctx.fillRect(W / 2 + 24.5, r.y0, 1.5, r.h);
}

// Лицевая сторона: ткань, печать, тесьма молнии и строчка.
function drawFront(ext) {
  const r = surface(ext, ext.scale);
  const { ctx } = r;
  const P = W < 760 ? 16 : 28;

  ctx.fillStyle = '#304036'; // светлее итога: плетение затемняет
  ctx.fillRect(r.x0, r.y0, r.w, r.h);
  for (let i = 0; i < 40; i++) {
    const x = r.x0 + Math.random() * r.w, y = r.y0 + Math.random() * r.h, rad = 120 + Math.random() * 380;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, Math.random() < 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x0, r.y0, r.w, r.h);
  }
  ctx.fillStyle = ctx.createPattern(noiseCanvas(256, 0.07), 'repeat');
  ctx.fillRect(r.x0, r.y0, r.w, r.h);

  ctx.fillStyle = '#e2652a';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  ctx.fillText('КОЛЛЕКЦИЯ ОСЕНЬ-ЗИМА 2026', P, 108);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  const size = Math.min(380, Math.max(96, W * 0.24));
  ctx.font = `${size}px "Dela Gothic One", "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ece6dc';
  ctx.fillText('SHOV', W / 2, H * 0.5 + size * 0.36);

  ctx.textAlign = 'left';
  const leadSize = W < 760 ? 16 : 20;
  ctx.font = `400 ${leadSize}px Manrope, sans-serif`;
  const lines = wrapLines(ctx, 'Одежда, которая держит форму. Плотный хлопок, металл, двойные швы.', Math.min(430, W - 2 * P));
  const lh = leadSize * 1.4;
  lines.forEach((l, i) => ctx.fillText(l, P, H - P - 60 - (lines.length - 1 - i) * lh));
  if (W >= 760) {
    ctx.textAlign = 'right';
    const spec = [['400', 'rgba(236,230,220,0.62)', 'Арт. SH-26FW'], ['500', '#ece6dc', 'Молния №8, металл'], ['400', 'rgba(236,230,220,0.62)', '320 г/м² · двойная строчка']];
    spec.forEach(([w, col, txt], i) => {
      ctx.font = `${w} 12px "JetBrains Mono", monospace`;
      ctx.fillStyle = col;
      ctx.fillText(txt, W - P, H - P - 92 + i * 20);
    });
  }
  drawSeams(ctx, P);
  // плетение поверх печати: краска лежит на нитях, рельеф виден и сквозь неё
  const wv = weaveTiles();
  const pat = ctx.createPattern(wv.color, 'repeat');
  pat.setTransform(new DOMMatrix().translate(-ext.m, -ext.mt).scale(WEAVE_TILE / wv.S));
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = pat;
  ctx.fillRect(r.x0, r.y0, r.w, r.h);
  ctx.fillStyle = ctx.createPattern(noiseCanvas(128, 0.12), 'repeat');
  ctx.fillRect(r.x0, r.y0, r.w, r.h);
  ctx.globalCompositeOperation = 'source-over';
  // утолщения нитей утка, ворсинки и катышки
  for (let i = 0; i < (r.w * r.h) / 900; i++) {
    ctx.fillStyle = `rgba(255,255,255,${(0.025 + Math.random() * 0.04).toFixed(3)})`;
    ctx.fillRect(r.x0 + Math.random() * r.w, r.y0 + Math.random() * r.h, 8 + Math.random() * 50, 1 + Math.random() * 0.8);
  }
  for (let i = 0; i < (r.w * r.h) / 1400; i++) {
    ctx.fillStyle = Math.random() < 0.7 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(r.x0 + Math.random() * r.w, r.y0 + Math.random() * r.h, 0.5 + Math.random() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  // ткань у молнии чуть вытерта
  [-1, 1].forEach((sd) => {
    const g = ctx.createLinearGradient(W / 2 + sd * 26, 0, W / 2 + sd * 90, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(W / 2 + sd * 26, W / 2 + sd * 90), r.y0, 64, r.h);
  });

  drawTape(ctx, r);
  ctx.strokeStyle = 'rgba(236,230,220,0.42)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 5]);
  [-34, 34].forEach((dx) => {
    ctx.beginPath();
    ctx.moveTo(W / 2 + dx, r.y0);
    ctx.lineTo(W / 2 + dx, r.y0 + r.h);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(r.c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Кокетка с двойной отстрочкой и два прорезных кармана.
function drawSeams(ctx, P) {
  const stitch = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const ys = Math.round(Math.max(150, H * 0.19));
  const shade = ctx.createLinearGradient(0, ys - 14, 0, ys + 10);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(0.55, 'rgba(0,0,0,0.18)');
  shade.addColorStop(0.62, 'rgba(255,255,255,0.06)');
  shade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(-W, ys - 14, W * 3, 24);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1.4;
  stitch(-W, ys, W * 2, ys);
  ctx.strokeStyle = 'rgba(236,230,220,0.36)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 4]);
  stitch(-W, ys - 6, W * 2, ys - 6);
  stitch(-W, ys + 6, W * 2, ys + 6);
  ctx.setLineDash([]);

  const len = Math.min(160, H * 0.17), cy = H * 0.73;
  [[W * 0.2, -0.26], [W * 0.8, 0.26]].forEach(([cx, ang]) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    // листочка кармана
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(-9, -len / 2, 18, len);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(ang < 0 ? 8 : -10, -len / 2, 2, len); // прорезь
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-9, -len / 2, 18, len);
    ctx.strokeStyle = 'rgba(236,230,220,0.34)';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(-6, -len / 2 + 3, 12, len - 6);
    ctx.setLineDash([]);
    // закрепки
    ctx.fillStyle = 'rgba(236,230,220,0.5)';
    ctx.fillRect(-9, -len / 2 - 1, 18, 2.5);
    ctx.fillRect(-9, len / 2 - 1.5, 18, 2.5);
    ctx.restore();
  });
}

// Изнанка: стёганая атласная подкладка и вшитая этикетка.
function drawLining(ext) {
  const r = surface(ext, Math.min(ext.scale, 1));
  const { ctx } = r;
  const g = ctx.createLinearGradient(0, r.y0, 0, r.y0 + r.h);
  g.addColorStop(0, '#e4632a');
  g.addColorStop(1, '#c94a19');
  ctx.fillStyle = g;
  ctx.fillRect(r.x0, r.y0, r.w, r.h);
  const step = 46;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 3]);
  for (let k = r.x0 - r.h; k < r.x0 + r.w + r.h; k += step) {
    [['rgba(110,30,0,0.28)', 0], ['rgba(255,205,170,0.22)', 1.2]].forEach(([col, off]) => {
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.moveTo(k + off, r.y0);
      ctx.lineTo(k + r.h + off, r.y0 + r.h);
      ctx.moveTo(k + r.h + off, r.y0);
      ctx.lineTo(k + off, r.y0 + r.h);
      ctx.stroke();
    });
  }
  ctx.setLineDash([]);
  drawTape(ctx, r);
  // этикетка (зеркально, чтобы читалась на отвороте)
  ctx.save();
  ctx.translate(W / 2 - 68, 104);
  ctx.scale(-1, 1);
  ctx.fillStyle = '#f2ede3';
  ctx.fillRect(-30, -34, 60, 68);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.strokeRect(-27, -31, 54, 62);
  ctx.fillStyle = '#171a17';
  ctx.textAlign = 'center';
  ctx.font = '13px "Dela Gothic One", sans-serif';
  ctx.fillText('SHOV', 0, -8);
  ctx.font = '6px "JetBrains Mono", monospace';
  ctx.fillText('64% ХЛОПОК', 0, 8);
  ctx.fillText('36% ПОЛИЭСТЕР', 0, 17);
  ctx.fillText('M · 48', 0, 26);
  ctx.restore();
  const tex = new THREE.CanvasTexture(r.c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- плетение ткани -----------------------------------------------------
// Саржа 2/1 на тайле 12×12 нитей: для каждой нити считаем высоту (рельеф),
// из неё — карту нормалей, плюс карту цвета (основа темнее утка).
const WEAVE = { cells: 12, px: 14, pitch: 5 }; // pitch — шаг нити на экране, px
const WEAVE_TILE = WEAVE.cells * WEAVE.pitch; // размер тайла на экране, px
let weaveCache = null;
function weaveTiles() {
  if (weaveCache) return weaveCache;
  const { cells, px } = WEAVE;
  const S = cells * px;
  const hgt = new Float32Array(S * S), col = new Float32Array(S * S);
  const rnd01 = () => Math.random();
  const warpW = Array.from({ length: cells }, () => 0.82 + rnd01() * 0.3);
  const weftW = Array.from({ length: cells }, () => 0.82 + rnd01() * 0.3);
  const warpT = Array.from({ length: cells }, () => rnd01() * 0.1);
  const weftT = Array.from({ length: cells }, () => rnd01() * 0.07);
  const ph = Array.from({ length: cells * 2 }, () => rnd01() * Math.PI * 2);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const ci = Math.floor(x / px), cj = Math.floor(y / px);
      const u = ((x % px) + 0.5) / px, v = ((y % px) + 0.5) / px;
      const warpTop = (ci + cj) % 3 !== 0; // диагональ саржи
      let h, c;
      if (warpTop) {
        const r = Math.abs(2 * u - 1) / warpW[ci];
        h = (r < 1 ? Math.sqrt(1 - r * r) : 0) * (0.62 + 0.38 * Math.sin(Math.PI * v));
        h += 0.06 * Math.sin(v * Math.PI * 4 + u * 3 + ph[ci]); // скрутка волокон
        c = 0.82 + warpT[ci] - (r < 1 ? 0 : 0.1);
      } else {
        const r = Math.abs(2 * v - 1) / weftW[cj];
        h = (r < 1 ? Math.sqrt(1 - r * r) : 0) * (0.62 + 0.38 * Math.sin(Math.PI * u));
        h += 0.06 * Math.sin(u * Math.PI * 4 + v * 3 + ph[cells + cj]);
        c = 0.95 + weftT[cj] - (r < 1 ? 0 : 0.1);
      }
      h += (Math.random() - 0.5) * 0.09; // ворс
      hgt[y * S + x] = h;
      col[y * S + x] = Math.min(1, c + (Math.random() - 0.5) * 0.05);
    }
  }
  const nc = document.createElement('canvas'), cc = document.createElement('canvas');
  nc.width = nc.height = cc.width = cc.height = S;
  const nctx = nc.getContext('2d'), cctx = cc.getContext('2d');
  const nImg = nctx.createImageData(S, S), cImg = cctx.createImageData(S, S);
  const at = (x, y) => hgt[((y + S) % S) * S + ((x + S) % S)];
  const k = 2.6;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const hx = at(x + 1, y) - at(x - 1, y), hy = at(x, y + 1) - at(x, y - 1);
      let nx = -hx * k, ny = hy * k, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l; ny /= l; nz /= l;
      const i = (y * S + x) * 4;
      nImg.data.set([(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255, 255], i);
      const g = col[y * S + x] * 255;
      cImg.data.set([g, g, g, 255], i);
    }
  }
  nctx.putImageData(nImg, 0, 0);
  cctx.putImageData(cImg, 0, 0);
  weaveCache = { normal: nc, color: cc, S };
  return weaveCache;
}

function weaveNormal(tilesX, tilesY) {
  const tex = new THREE.CanvasTexture(weaveTiles().normal);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(tilesX, tilesY);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// шлифованный металл: тонкие продольные риски для карты шероховатости
function brushedTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(70,70,70)';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const g = 40 + Math.random() * 110;
    ctx.fillStyle = `rgba(${g},${g},${g},0.5)`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 20 + Math.random() * 140, 0.6 + Math.random() * 0.8);
  }
  // редкие царапины
  ctx.strokeStyle = 'rgba(160,160,160,0.6)';
  for (let i = 0; i < 14; i++) {
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    const x = Math.random() * s, y = Math.random() * s;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.035, 0.035);
  return tex;
}

// Студийное окружение: тёмная комната и несколько софтбоксов —
// металл получает чёткие блики вместо мягкого «пластилинового» отражения.
function studioEnvironment() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.32, 0.31), side: THREE.BackSide })));
  const panel = (w, h, x, y, z, power) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power * 0.96), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(5, 2, -2.4, 3.2, 3.4, 9); // основной софтбокс сверху слева
  panel(1, 7, 4.6, 0.4, 2, 5); // узкий стрип справа
  panel(1, 7, -4.6, -0.6, 1.5, 2.5); // стрип слева
  panel(8, 1.2, 0, -4.6, 2.4, 2.2); // отражение от пола
  panel(4, 3, 0.5, 1.5, 4.8, 3.5); // фронтальный свет со стороны зрителя
  panel(3, 3, 0.5, 1.5, -4.6, 2); // контровой
  return s;
}

function tabLabelTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.translate(32, 128);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(40,38,34,0.75)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '40px "Dela Gothic One", sans-serif';
  ctx.fillText('SHOV', 0, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Звено молнии: «головка» смотрит к соседней половине, хвост уходит в тесьму.
function toothGeometry() {
  const s = new THREE.Shape();
  s.moveTo(4.8, -2.1);
  s.lineTo(-2.2, -2.7);
  s.quadraticCurveTo(-5.6, -2.7, -5.6, 0);
  s.quadraticCurveTo(-5.6, 2.7, -2.2, 2.7);
  s.lineTo(4.8, 2.1);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.6, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -1.1);
  return g;
}

// --- деформация ткани -------------------------------------------------
// t — расстояние от линии молнии вглубь полотнища, y — высота (вверх),
// sigma — сторона (−1 левая, +1 правая).
const D = { ys: 0, O: 0, Cmax: 0, Lo: 1, Lf: 1, Lc: 1, fold: 0, drape: 0 };
function deform(sigma, t, y, out) {
  const d = y - D.ys;
  const tp = Math.max(0, t);
  const sid = sigma * 31.7;
  let tt = t, z = 0, lat = 0;
  // ткань не лежит идеально ровно: мягкие бугры по всему полотну
  // (шум берётся по x со знаком, поэтому половины совпадают на линии молнии)
  z += (vnoise((sigma * tp) / 230 + 50, y / 210) - 0.5) * (5 + 10 * D.drape);
  if (d > 0) {
    const wob = vnoise(y / 420 + sid, 3.3) - 0.5; // неровная кромка разреза
    const o = D.O * (1 - Math.exp(-d / D.Lo)) * (1 + 0.16 * wob);
    lat = o * Math.exp(-tp / D.Lf);
    // ширина и радиус отворота «гуляют» по длине
    const tc = D.Cmax * smoothstep(0, D.Lc, d) * (0.8 + 0.4 * vnoise(y / 360 + sid, 7.1));
    const R = R_CURL * (0.75 + 0.5 * vnoise(y / 220 + sid, 1.7));
    const flat = smoothstep(tc, tc + 70, tp);
    if (t < tc) {
      const u = tc - t, th = u / R;
      if (th <= Math.PI) {
        tt = tc - R * Math.sin(th);
        z += R * (1 - Math.cos(th));
      } else {
        tt = tc + (u - Math.PI * R);
        z += 2 * R;
      }
      // валик отворота мнётся: мелкие заломы вдоль него
      const buck = vnoise(y / 46 + sid, u / 50) - 0.5;
      const bw = smoothstep(0, 18, u);
      z += buck * 4.5 * bw;
      tt += buck * 2.5 * bw;
    }
    const k = D.O > 0 ? o / D.O : 0;
    // ткань у разреза приподнимается
    z += 0.14 * o * Math.exp(-tp / 160);
    // косые складки: гребни шума, вытянутые вдоль натяжения
    const n = vnoise(tp / 75 + d / 150 + sid, d / 48 - tp / 170);
    z += D.fold * 12 * k * flat * (1 - Math.abs(2 * n - 1)) * Math.exp(-tp / 320);
    // мелкие «лучики» натяжения от бегунка
    const rr = Math.hypot(tp, d);
    z += 2.6 * flat * Math.sin(Math.atan2(d, tp + 6) * 16) * Math.exp(-rr / 80) * smoothstep(0, 30, d);
  } else if (d > -70) {
    // под бегунком ткань натянута и чуть вздута над зубцами
    z += 1.6 * (1 + d / 70) * Math.exp(-tp / 50);
  }
  // строчка вдоль тесьмы чуть стягивает ткань
  z -= 0.9 * Math.exp(-Math.abs(tp - 34) / 4);
  out.set(sigma * (tt + lat), y, z);
  return out;
}

function buildHalf(sigma, ext) {
  const NT = W < 760 ? 56 : 84, NY = W < 760 ? 220 : 320;
  const Wh = W / 2 + ext.mg; // полотно шире текстуры: края никогда не попадают в кадр
  const yTop = H / 2 + ext.mt, yBot = -H / 2 - ext.mb;
  const ts = [], ys = [];
  for (let i = 0; i <= NT; i++) ts.push(Wh * Math.pow(i / NT, 1.75));
  for (let j = 0; j <= NY; j++) ys.push(yTop - ((yTop - yBot) * j) / NY);
  const count = (NT + 1) * (NY + 1);
  const pos = new Float32Array(count * 3), uv = new Float32Array(count * 2);
  for (let j = 0; j <= NY; j++) {
    for (let i = 0; i <= NT; i++) {
      const k = j * (NT + 1) + i;
      pos.set([sigma * ts[i], ys[j], 0], k * 3);
      uv.set([(sigma * ts[i] + W / 2 + ext.m) / (W + 2 * ext.m), (ys[j] - yBot) / (yTop - yBot)], k * 2);
    }
  }
  const idx = [];
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NT; i++) {
      const a = j * (NT + 1) + i, b = a + NT + 1, c = a + 1, d = b + 1;
      if (sigma > 0) idx.push(a, b, c, c, b, d);
      else idx.push(a, c, b, c, d, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);

  const holder = new THREE.Group(); // половина вместе с зубцами — уезжает за край
  const front = new THREE.Mesh(geo, C.frontMat);
  const back = new THREE.Mesh(geo, C.backMat);
  [front, back].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    holder.add(mesh);
  });
  const nTeeth = Math.ceil((yTop - yBot) / TOOTH) + 2;
  const teeth = new THREE.InstancedMesh(C.toothGeo, C.metalMat, nTeeth);
  teeth.castShadow = true;
  teeth.frustumCulled = false;
  holder.add(teeth);
  C.group.add(holder);
  return { sigma, geo, ts, ys, NT, NY, teeth, nTeeth, top: yTop, holder };
}

const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
const along = new THREE.Vector3(), across = new THREE.Vector3(), nrm = new THREE.Vector3();
const mtx = new THREE.Matrix4();

function updateHalf(h) {
  const pos = h.geo.attributes.position.array;
  let k = 0;
  for (let j = 0; j <= h.NY; j++) {
    for (let i = 0; i <= h.NT; i++) {
      deform(h.sigma, h.ts[i], h.ys[j], vA);
      pos[k++] = vA.x;
      pos[k++] = vA.y;
      pos[k++] = vA.z;
    }
  }
  h.geo.attributes.position.needsUpdate = true;
  h.geo.computeVertexNormals();

  // зубцы стоят на кромке тесьмы и повторяют её изгиб
  const tb = 2.6;
  for (let n = 0; n < h.nTeeth; n++) {
    const y = h.top - n * TOOTH - (h.sigma > 0 ? TOOTH / 2 : 0);
    deform(h.sigma, tb, y, vA);
    deform(h.sigma, tb, y + 1, vB);
    deform(h.sigma, tb + 1, y, vC);
    along.subVectors(vB, vA).normalize();
    across.subVectors(vC, vA).normalize();
    if (h.sigma < 0) nrm.crossVectors(along, across);
    else nrm.crossVectors(across, along);
    nrm.normalize();
    along.crossVectors(nrm, across).normalize();
    mtx.makeBasis(across, along, nrm);
    vA.addScaledVector(nrm, 2.2);
    mtx.setPosition(vA);
    h.teeth.setMatrixAt(n, mtx);
  }
  h.teeth.instanceMatrix.needsUpdate = true;
}

// Бегунок молнии: литой корпус с клином-разделителем, приподнятая верхняя
// пластина, мостик, кольцо и язычок с углублённой панелью. Фаски маленькие —
// грани остаются чёткими.
function crisp(shape, depth, bevel = 0.5) {
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 18 });
}
function buildSlider(parent) {
  const g = new THREE.Group();
  const M = C.metalMat;
  const add = (geo, z, mat = M) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };

  const body = new THREE.Shape();
  body.moveTo(-18, 8);
  body.lineTo(-5.5, 8);
  body.lineTo(0, 1.5); // вырез под клин-разделитель
  body.lineTo(5.5, 8);
  body.lineTo(18, 8);
  body.lineTo(18, 2);
  body.quadraticCurveTo(17.5, -7, 12.5, -13);
  body.lineTo(9.5, -44);
  body.quadraticCurveTo(0, -50, -9.5, -44);
  body.lineTo(-12.5, -13);
  body.quadraticCurveTo(-17.5, -7, -18, 2);
  body.closePath();
  add(crisp(body, 7.5, 0.6), 1.1);
  const top = crisp(body, 1.2, 0.4);
  top.scale(0.84, 0.9, 1);
  top.translate(0, -1.5, 0);
  add(top, 9.6);
  // клин-разделитель между зубцами
  const wedge = new THREE.Shape();
  wedge.moveTo(-4, 9);
  wedge.lineTo(4, 9);
  wedge.lineTo(0, 1);
  wedge.closePath();
  add(crisp(wedge, 6, 0.4), 1.2);

  // мостик: арка вдоль корпуса, под ней — отверстие для кольца
  const arch = new THREE.Shape();
  arch.moveTo(-11, 0);
  arch.lineTo(11, 0);
  arch.lineTo(11, 3);
  arch.quadraticCurveTo(11, 9.5, 5, 9.8);
  arch.lineTo(-5, 9.8);
  arch.quadraticCurveTo(-11, 9.5, -11, 3);
  arch.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-7, 0);
  hole.lineTo(-7, 2.6);
  hole.quadraticCurveTo(-7, 6.4, -3, 6.6);
  hole.lineTo(3, 6.6);
  hole.quadraticCurveTo(7, 6.4, 7, 2.6);
  hole.lineTo(7, 0);
  hole.closePath();
  arch.holes.push(hole);
  const archGeo = crisp(arch, 7, 0.45);
  archGeo.translate(0, 0, -3.5);
  // профиль арки: x → вдоль корпуса (y), y → вверх (z), толщина → поперёк (x)
  archGeo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  archGeo.translate(0, -17, 0);
  add(archGeo, 11);

  // язычок на кольце; ось качания — перекладина мостика
  const tab = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.3, 1.15, 14, 36), M);
  ring.rotation.y = Math.PI / 2;
  ring.castShadow = true;
  tab.add(ring);
  const plate = new THREE.Shape();
  const w = 8, L = 62;
  plate.moveTo(-w + 3, 0);
  plate.lineTo(w - 3, 0);
  plate.quadraticCurveTo(w, 0, w, -3);
  plate.lineTo(w + 1.8, -L + 7);
  plate.quadraticCurveTo(w + 1.8, -L, w - 4, -L);
  plate.lineTo(-w + 4, -L);
  plate.quadraticCurveTo(-w - 1.8, -L, -w - 1.8, -L + 7);
  plate.lineTo(-w, -3);
  plate.quadraticCurveTo(-w, 0, -w + 3, 0);
  const slot = new THREE.Path();
  slot.absellipse(0, -5.5, 4.2, 2.6, 0, Math.PI * 2, true);
  plate.holes.push(slot);
  const plateGeo = crisp(plate, 2.2, 0.45);
  plateGeo.translate(0, -0.2, -1.1);
  const plateMesh = new THREE.Mesh(plateGeo, M);
  plateMesh.castShadow = true;
  tab.add(plateMesh);
  // углублённая панель с гравировкой
  const panel = new THREE.Shape();
  panel.moveTo(-5, -14);
  panel.lineTo(5, -14);
  panel.lineTo(5.8, -52);
  panel.quadraticCurveTo(5.8, -55, 2.8, -55);
  panel.lineTo(-2.8, -55);
  panel.quadraticCurveTo(-5.8, -55, -5.8, -52);
  panel.closePath();
  const panelMesh = new THREE.Mesh(crisp(panel, 0.3, 0.25), C.metalDarkMat);
  panelMesh.position.z = 1.35;
  tab.add(panelMesh);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(9, 36), new THREE.MeshBasicMaterial({ map: tabLabelTexture(), transparent: true, depthWrite: false }));
  label.position.set(0, -34.5, 2.05);
  tab.add(label);
  tab.position.set(0, -17, 18.6);
  g.add(tab);
  g.scale.setScalar(1.1);
  parent.add(g);
  C.slider = g;
  C.tab = tab;
  C.tabRest = 0.27; // в покое язычок лежит, касаясь зубцов
}

async function buildCloth() {
  if (!renderer) return;
  if (C.scene) {
    C.scene.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) [].concat(o.material).forEach((mm) => { mm.map?.dispose?.(); mm.dispose?.(); });
    });
  }
  const dpr = Math.min(window.devicePixelRatio || 1, W < 760 ? 1.75 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  C.scene = scene;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studioEnvironment(), 0.02).texture;
  pmrem.dispose();

  const fov = 30;
  const camera = new THREE.PerspectiveCamera(fov, W / H, 10, 40000);
  C.D = H / 2 / Math.tan((fov * DEG) / 2);
  camera.position.set(0, 0, C.D);
  C.camera = camera;

  const sun = new THREE.DirectionalLight(0xfff6ea, 1.9);
  sun.position.set(-0.45 * W, 0.75 * H, 1500);
  sun.castShadow = true;
  sun.shadow.mapSize.set(W < 760 ? 1024 : 2048, W < 760 ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -W, right: W, top: H, bottom: -H * 1.6, near: 10, far: 6000 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 1.2;
  sun.shadow.radius = 6;
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x3a4a40, 0.55));

  // ловец теней: прозрачная плоскость позади ткани, тень ложится на витрину
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(W * 2.2, H * 2.2), new THREE.ShadowMaterial({ opacity: 0.36, depthWrite: false }));
  catcher.position.z = -90;
  catcher.receiveShadow = true;
  scene.add(catcher);
  C.catcher = catcher;

  // ткань длиннее экрана: молния уходит вниз и вглубь далеко за его край.
  // Размеры текстуры кратны тайлу плетения, чтобы рисунок и рельеф совпадали.
  const TW = Math.ceil((W * 1.6) / WEAVE_TILE) * WEAVE_TILE;
  const TH = Math.ceil((H * 3.4 + 200) / WEAVE_TILE) * WEAVE_TILE;
  const ext = { m: (TW - W) / 2, mg: Math.round(Math.max(W, H) * 1.1), mt: 200, mb: TH - H - 200 };
  ext.scale = Math.min(dpr, 4096 / TW, 4096 / TH);
  C.frontMat = new THREE.MeshPhysicalMaterial({
    map: drawFront(ext),
    normalMap: weaveNormal(TW / WEAVE_TILE, TH / WEAVE_TILE),
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughness: 0.92,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#93ab9c'),
    envMapIntensity: 0.4,
    side: THREE.FrontSide,
  });
  C.backMat = new THREE.MeshPhysicalMaterial({
    map: drawLining(ext),
    normalMap: weaveNormal((TW / WEAVE_TILE) * 3, (TH / WEAVE_TILE) * 3),
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.36,
    metalness: 0,
    sheen: 0.8,
    sheenRoughness: 0.3,
    sheenColor: new THREE.Color('#ffc9a3'),
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.5,
    side: THREE.BackSide,
  });
  const brushed = brushedTexture();
  C.metalMat = new THREE.MeshPhysicalMaterial({ color: '#cfccc4', metalness: 1, roughness: 0.3, roughnessMap: brushed, envMapIntensity: 1.25 });
  C.metalDarkMat = new THREE.MeshPhysicalMaterial({ color: '#9e9b94', metalness: 1, roughness: 0.6, roughnessMap: brushed, envMapIntensity: 1 });
  C.toothGeo = toothGeometry();

  C.group = new THREE.Group();
  scene.add(C.group);
  C.pivotY = H / 2 + ext.mt; // ткань наклоняется вокруг верхнего края
  C.halves = [buildHalf(-1, ext), buildHalf(1, ext)];
  C.zipTop = H / 2 - 30;
  C.zipEnd = -H / 2 - ext.mb - 80; // бегунок проходит всю молнию до конца
  buildSlider(C.halves[0].holder); // бегунок остаётся на левой половине
  C.tabState = { a: 0, va: 0, b: 0, vb: 0, prevYs: null, time: 0 };
  C.lastP = -1;
  sticky.classList.add('ready');
}

function updateCloth(p, dt) {
  if (!C.group) return false;
  const u = easeInOut(phase(T.unzip, p));
  const tilt = 52 * DEG * easeInOut(phase(T.tilt, p));
  const wide = easeInOut(phase(T.widen, p));
  const ex = phase(T.exit, p);
  // бегунок идёт быстрее там, где молния уходит вдаль, — равномерно для глаза
  const ys = C.zipTop + (C.zipEnd - C.zipTop) * Math.pow(u, 1.35);
  const gain = smoothstep(0, 0.05, u);

  if (Math.abs(p - C.lastP) > 1e-5) {
    C.lastP = p;
    D.ys = ys;
    D.O = W * 0.17 * gain * (1 + 1.6 * wide);
    D.Cmax = gain * (52 + 70 * wide);
    D.Lo = H * 0.95;
    D.Lf = W * 0.55;
    D.Lc = H * 0.5;
    D.fold = gain;
    D.drape = gain;
    C.halves.forEach(updateHalf);

    // плоскость ткани наклоняется вокруг верхнего края: низ уходит вглубь
    const py = C.pivotY;
    C.group.rotation.x = tilt;
    C.group.position.set(0, py - py * Math.cos(tilt), -py * Math.sin(tilt));
    // расстёгнутые половины расходятся и уезжают за края экрана
    const out = easeIn(ex) * W * 3.4;
    C.halves.forEach((h) => {
      h.holder.position.x = h.sigma * out;
      h.holder.rotation.y = h.sigma * 0.45 * easeInOut(ex);
    });
    C.catcher.material.opacity = 0.36 * (1 - smoothstep(0, 0.5, ex)) * (1 - tilt / (60 * DEG));
  }

  // бегунок и язычок-маятник
  const s = C.tabState;
  C.slider.position.set(0, ys, 3);
  const vy = s.prevYs === null || dt <= 0 ? 0 : (ys - s.prevYs) / dt;
  s.prevYs = ys;
  s.time += dt;
  const lift = clamp(-vy * 0.0009, 0, 0.95) + 0.04;
  const swingT = Math.sin(s.time * 2.7) * 0.06 * clamp(Math.abs(vy) / 400);
  const h = Math.min(dt, 1 / 30);
  s.va += (-55 * (s.a - lift) - 7 * s.va) * h;
  s.a += s.va * h;
  s.vb += (-40 * (s.b - swingT) - 3.5 * s.vb) * h;
  s.b += s.vb * h;
  C.tab.rotation.set(C.tabRest - s.a, 0, s.b);

  renderer.render(C.scene, C.camera);
  return Math.abs(s.va) + Math.abs(s.vb) > 0.002;
}

// ======================================================================
// Прокрутка
// ======================================================================
let shown = 0;
function target() {
  const total = scrolly.offsetHeight - H;
  return total > 0 ? clamp(-scrolly.getBoundingClientRect().top / total) : 0;
}

let lastTime = performance.now(), lastRendered = -1, settling = true;
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const t = target();
  shown = reduceMotion.matches ? t : shown + (t - shown) * (1 - Math.pow(0.0009, dt));
  if (Math.abs(t - shown) < 0.0003) shown = t;
  const p = shown;

  // ткань ушла за края — холст больше не нужен
  const gone = p >= T.exit[1];
  canvas.style.visibility = gone ? 'hidden' : 'visible';
  hint.style.opacity = (1 - clamp(p * 25)).toFixed(3);
  header.classList.toggle('on-paper', p > 0.6);

  if (p !== lastRendered || settling) {
    renderCards(p);
    settling = !gone && (updateCloth(p, dt) || p !== lastRendered);
    lastRendered = p;
  }
  requestAnimationFrame(loop);
}

function measure() {
  W = sticky.clientWidth;
  H = sticky.clientHeight;
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    const oldW = W, oldH = H;
    measure();
    layoutCards();
    if (Math.abs(W - oldW) > 1 || Math.abs(H - oldH) > 80) {
      await buildCloth();
      settling = true;
      lastRendered = -1;
    }
  }, 150);
});

(async function start() {
  measure();
  layoutCards();
  // ждём шрифты, иначе печать на ткани нарисуется запасным шрифтом
  await Promise.race([
    Promise.all(['100px "Dela Gothic One"', '20px Manrope', '13px "JetBrains Mono"', '500 13px "JetBrains Mono"'].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {});
  layoutCards();
  await buildCloth();
  shown = target();
  requestAnimationFrame(loop);
})();
