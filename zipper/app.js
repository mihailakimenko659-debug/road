import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
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
  ctx.fillStyle = '#17201a';
  ctx.fillRect(W / 2 - 26, r.y0, 52, r.h);
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = r.y0; y < r.y0 + r.h; y += 3) ctx.fillRect(W / 2 - 26, y, 52, 1);
}

// Лицевая сторона: ткань, печать, тесьма молнии и строчка.
function drawFront(ext) {
  const r = surface(ext, ext.scale);
  const { ctx } = r;
  const P = W < 760 ? 16 : 28;

  ctx.fillStyle = '#26332b';
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
  // печать чуть «впитывается» в ткань
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(noiseCanvas(128, 0.12), 'repeat');
  ctx.fillRect(r.x0, r.y0, r.w, r.h);
  ctx.globalCompositeOperation = 'source-over';

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

function twillTexture() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#b4b4b4';
  ctx.lineWidth = 2.2;
  for (let k = -s; k < 2 * s; k += 6) {
    ctx.beginPath();
    ctx.moveTo(k, 0);
    ctx.lineTo(k + s, s);
    ctx.stroke();
  }
  ctx.drawImage(noiseCanvas(s, 0.25), 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
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
const D = { ys: 0, O: 0, Cmax: 0, Lo: 1, Lf: 1, Lc: 1, fold: 0 };
function deform(sigma, t, y, out) {
  const d = y - D.ys;
  const tp = Math.max(0, t);
  let tt = t, z = 0, lat = 0;
  if (d > 0) {
    // раскрытие почти линейно растёт от бегунка — получается настоящая «V»
    const o = D.O * (1 - Math.exp(-d / D.Lo));
    lat = o * Math.exp(-tp / D.Lf);
    const tc = D.Cmax * smoothstep(0, D.Lc, d);
    // на отвороте ткань гладкая, складки начинаются за линией сгиба
    const flat = smoothstep(tc, tc + 70, tp);
    if (t < tc) {
      // край заворачивается вокруг цилиндра и ложится изнанкой наружу
      const u = tc - t, th = u / R_CURL;
      if (th <= Math.PI) {
        tt = tc - R_CURL * Math.sin(th);
        z = R_CURL * (1 - Math.cos(th));
      } else {
        tt = tc + (u - Math.PI * R_CURL);
        z = 2 * R_CURL;
      }
    }
    const k = D.O > 0 ? o / D.O : 0;
    // ткань у разреза приподнимается
    z += 0.14 * o * Math.exp(-tp / 160);
    // косые складки: гребни шума, вытянутые вдоль натяжения
    const n = vnoise(tp / 75 + d / 150 + sigma * 13.7, d / 48 - tp / 170);
    z += D.fold * 11 * k * flat * (1 - Math.abs(2 * n - 1)) * Math.exp(-tp / 320);
    // мелкие «лучики» натяжения от бегунка
    const rr = Math.hypot(tp, d);
    z += 2.6 * flat * Math.sin(Math.atan2(d, tp + 6) * 16) * Math.exp(-rr / 80) * smoothstep(0, 30, d);
  } else if (d > -70) {
    // под бегунком ткань натянута и чуть вздута над зубцами
    z += 1.6 * (1 + d / 70) * Math.exp(-tp / 50);
  }
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

function buildSlider(parent) {
  const g = new THREE.Group();
  const body = new THREE.Shape();
  body.moveTo(-17, 6);
  body.lineTo(17, 6);
  body.lineTo(12, -44);
  body.quadraticCurveTo(0, -51, -12, -44);
  body.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: 7, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 2.2, bevelSegments: 4, curveSegments: 12 });
  const bodyMesh = new THREE.Mesh(bodyGeo, C.metalMat);
  bodyMesh.position.z = 2;
  bodyMesh.castShadow = true;
  g.add(bodyMesh);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(6, 30, 3), C.metalMat);
  ridge.position.set(0, -14, 11.5);
  ridge.castShadow = true;
  g.add(ridge);

  const tabShape = new THREE.Shape();
  const w = 8, L = 66;
  tabShape.moveTo(-w + 3, 0);
  tabShape.lineTo(w - 3, 0);
  tabShape.quadraticCurveTo(w, 0, w, -3);
  tabShape.lineTo(w + 1.5, -L + 6);
  tabShape.quadraticCurveTo(w + 1.5, -L, w - 4, -L);
  tabShape.lineTo(-w + 4, -L);
  tabShape.quadraticCurveTo(-w - 1.5, -L, -w - 1.5, -L + 6);
  tabShape.lineTo(-w, -3);
  tabShape.quadraticCurveTo(-w, 0, -w + 3, 0);
  const hole = new THREE.Path();
  hole.absarc(0, -7, 3.2, 0, Math.PI * 2, true);
  tabShape.holes.push(hole);
  const tabGeo = new THREE.ExtrudeGeometry(tabShape, { depth: 2.4, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 3, curveSegments: 10 });
  const tabMesh = new THREE.Mesh(tabGeo, C.metalMat);
  tabMesh.castShadow = true;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(10, 40), new THREE.MeshBasicMaterial({ map: tabLabelTexture(), transparent: true, depthWrite: false }));
  label.position.set(0, -38, 3.5);
  const tab = new THREE.Group();
  tab.add(tabMesh, label);
  tab.position.set(0, -16, 15);
  g.add(tab);
  parent.add(g);
  C.slider = g;
  C.tab = tab;
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
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
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

  // ткань длиннее экрана: молния уходит вниз и вглубь далеко за его край
  const ext = { m: Math.round(W * 0.3), mg: Math.round(Math.max(W, H) * 1.1), mt: 200, mb: Math.round(H * 2.4) };
  ext.scale = Math.min(dpr, 4096 / (W + 2 * ext.m), 4096 / (H + ext.mt + ext.mb));
  const twill = twillTexture();
  twill.repeat.set((W + 2 * ext.m) / 40, (H + ext.mt + ext.mb) / 40);
  C.frontMat = new THREE.MeshPhysicalMaterial({
    map: drawFront(ext),
    bumpMap: twill,
    bumpScale: 1.6,
    roughness: 0.9,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color('#8fa898'),
    envMapIntensity: 0.45,
    side: THREE.FrontSide,
  });
  C.backMat = new THREE.MeshPhysicalMaterial({
    map: drawLining(ext),
    roughness: 0.38,
    metalness: 0,
    sheen: 0.8,
    sheenRoughness: 0.3,
    sheenColor: new THREE.Color('#ffc9a3'),
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.8,
    side: THREE.BackSide,
  });
  C.metalMat = new THREE.MeshStandardMaterial({ color: '#a19f98', metalness: 1, roughness: 0.3, envMapIntensity: 0.9 });
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
  C.tab.rotation.set(-s.a, 0, s.b);

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
