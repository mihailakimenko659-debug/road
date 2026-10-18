import * as THREE from 'three';
import { Fluid } from './fluid.js';
import { Bloom } from './post.js';

// Временная шкала интро, секунды
//  0–2   искры слетаются в розу
//  2–3   роза висит и мерцает
//  3     взрыв (огненный шар); страница начинает тлеть снизу
//  4–5   над кромкой поднимается пламя
//  5–5.8 резкая вспышка, огонь сжигает страницу целиком
const END = 6.7;
const SIM_START = 2.9;
const DT = 1 / 60;

const $ = (s) => document.querySelector(s);
const canvas = $('#fx'), introBg = $('#introBg'), skipBtn = $('#skip');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?t=3.5 в адресе замораживает интро на нужной секунде — удобно разглядывать кадры
const FREEZE = new URLSearchParams(location.search).get('t');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true });
} catch (e) {
  renderer = null;
}

// ---------- общий GLSL: шум, цвет огня, линия горения ----------
const GLSL_COMMON = /* glsl */ `
  float ss(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return s;
  }
  // цвет раскалённого вещества (как у излучения нагретого тела):
  // тёмно-красный → оранжевый → жёлтый → почти белый
  vec3 fireColor(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c = mix(vec3(0.2, 0.015, 0.0), vec3(0.92, 0.2, 0.015), ss(0.0, 0.42, t));
    c = mix(c, vec3(1.0, 0.56, 0.12), ss(0.38, 0.72, t));
    return mix(c, vec3(1.0, 0.93, 0.78), ss(0.72, 1.0, t));
  }
  // высота линии огня (0 — низ экрана, 1 — верх)
  float frontY(float T) {
    float sm = ss(3.0, 4.0, T), fl = ss(4.0, 5.0, T), fx = clamp((T - 5.0) / 0.8, 0.0, 1.0);
    return -0.06 + 0.09 * sm + 0.13 * fl + 1.55 * fx * fx;
  }
  // расстояние до линии горения: >0 — бумага цела, <0 — сгорела.
  // Кромка рваная: шум, искажённый другим шумом; при вспышке появляются прогары.
  float burnDist(vec2 uv, float T, float aspect) {
    vec2 p = vec2(uv.x * aspect, uv.y);
    float fl = ss(4.0, 5.0, T), fx = clamp((T - 5.0) / 0.8, 0.0, 1.0);
    float warp = fbm(p * 2.0 + vec2(T * 0.05, -T * 0.12));
    float n = fbm(p * 3.2 + warp * 1.6 + vec2(0.0, -T * 0.08));
    float h = uv.y + (n - 0.5) * 2.0 * (0.05 + 0.06 * fl + 0.22 * fx);
    h -= fx * ss(0.6, 0.78, fbm(p * 4.0 + 11.0)) * 0.3;
    return h - frontY(T);
  }
`;

// ---------- страница интро (рисуется на canvas и затем горит) ----------
function introTexture(W, H, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, '#1d110c');
  g.addColorStop(1, '#090605');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const n = document.createElement('canvas');
  n.width = n.height = 192;
  const nctx = n.getContext('2d');
  const img = nctx.createImageData(192, 192);
  for (let i = 0; i < 192 * 192; i++) {
    const v = Math.random() * 255;
    img.data.set([v, v * 0.9, v * 0.8, 14], i * 4);
  }
  nctx.putImageData(img, 0, 0);
  ctx.fillStyle = ctx.createPattern(n, 'repeat');
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < (W * H) / 2500; i++) {
    ctx.strokeStyle = `rgba(233,217,198,${(0.015 + Math.random() * 0.03).toFixed(3)})`;
    ctx.lineWidth = 0.6;
    const x = Math.random() * W, y = Math.random() * H, a = Math.random() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8 + 3, x + Math.cos(a) * 16, y + Math.sin(a) * 16);
    ctx.stroke();
  }
  const P = W < 820 ? 16 : 28;
  ctx.fillStyle = 'rgba(233,217,198,0.78)';
  ctx.font = '600 20px "Cormorant Garamond", serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
  ctx.fillText('ОГНИВО', P, 44);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  ctx.font = '400 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(233,217,198,0.5)';
  ctx.fillText('ПАРФЮМЕРНАЯ МАСТЕРСКАЯ · 2026', W - P, 42);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(233,217,198,0.6)';
  ctx.font = 'italic 500 22px "Cormorant Garamond", serif';
  ctx.fillText('Новый аромат — «Пепел розы»', W / 2, H - 54);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

// ---------- роза из искр ----------
// Лепестки по золотой спирали: внутренние высокие и плотно закрученные,
// внешние ниже, раскрыты, кончики отогнуты наружу. Большинство искр — на кромках,
// поэтому лепестки читаются линиями, как у раскалённой проволоки.
function rosePoints(count) {
  const petals = 38;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const weights = Array.from({ length: petals }, (_, i) => 0.45 + i / petals);
  const wsum = weights.reduce((a, b) => a + b, 0);
  const target = [], heat = [];
  for (let i = 0; i < petals; i++) {
    const k = i / (petals - 1);
    const theta = i * golden;
    const width = Math.min(2.5, 1.2 + 1.5 * k);
    const hgt = 1.0 - 0.14 * k;
    const rBase = 0.02 + 0.1 * k;
    const rTop = 0.05 + 0.72 * Math.pow(k, 0.75);
    const n = Math.round((count * weights[i]) / wsum);
    for (let s = 0; s < n; s++) {
      const rim = Math.random() < 0.58;
      let v = rim && Math.random() < 0.55 ? 0.97 + Math.random() * 0.03 : 1 - Math.pow(Math.random(), 1.6);
      const ow = (0.3 + 0.7 * Math.sqrt(v)) * (v > 0.8 ? Math.sqrt(Math.max(0, 1 - ((v - 0.8) / 0.22) ** 2)) : 1);
      let u = (Math.random() * 2 - 1) * ow;
      if (rim && v < 0.97) u = Math.sign(u || 1) * ow * (0.95 + Math.random() * 0.05);
      // бутон-чаша: узкое основание, лепесток выпукло обнимает середину
      let r = rBase + (rTop - rBase) * Math.pow(v, 0.65) + 0.18 * k * Math.sin(Math.PI * v * 0.9);
      r += 0.08 * k * Math.pow(Math.abs(u) / Math.max(ow, 0.01), 3) * v; // завёрнутые края
      let y = hgt * v;
      if (k > 0.45 && v > 0.78) {
        const c = (v - 0.78) / 0.22;
        r += c * c * 0.24 * k; // кончики внешних лепестков отгибаются наружу
        y -= c * c * 0.08 * k;
      }
      const phi = theta + (u * width) / 2;
      target.push(r * Math.cos(phi), y - 0.5, r * Math.sin(phi));
      heat.push(rim ? 0.72 + Math.random() * 0.28 : 0.3 + Math.random() * 0.25 + (1 - k) * 0.15);
    }
  }
  return { target: new Float32Array(target), heat };
}

function buildRose(W, H, camera, pxScale) {
  const count = W < 820 ? 22000 : 40000;
  const { target, heat } = rosePoints(count);
  const n = target.length / 3;
  const visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
  const visW = visH * camera.aspect;
  let maxR = 0, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    maxR = Math.max(maxR, Math.hypot(target[i * 3], target[i * 3 + 2]));
    minY = Math.min(minY, target[i * 3 + 1]);
    maxY = Math.max(maxY, target[i * 3 + 1]);
  }
  // размер: 40 % от меньшей стороны экрана
  const size = 0.4 * Math.min(visW, visH);
  const scale = size / (2 * Math.max(maxR, (maxY - minY) / 2));

  const start = new Float32Array(n * 3), dir = new Float32Array(n * 3), seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const tx = target[i * 3] * scale, ty = target[i * 3 + 1] * scale, tz = target[i * 3 + 2] * scale;
    target.set([tx, ty, tz], i * 3);
    const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
    const R = (1.4 + Math.random() * 2.2) * Math.max(visW, visH) * 0.5;
    const fromBelow = Math.random() < 0.3;
    start.set([R * Math.sin(b) * Math.cos(a), fromBelow ? -visH * (0.6 + Math.random() * 0.6) : R * Math.cos(b), R * Math.sin(b) * Math.sin(a) * 0.5], i * 3);
    const dx = tx + (Math.random() - 0.5) * size * 0.3, dy = ty + size * 0.05 + (Math.random() - 0.5) * size * 0.3, dz = tz + (Math.random() - 0.5) * size * 0.3;
    const l = Math.hypot(dx, dy, dz) || 1;
    dir.set([dx / l, dy / l, dz / l], i * 3);
    seed.set([Math.random(), heat[i], Math.random(), Math.random()], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: pxScale }, uSize: { value: size } },
    vertexShader: /* glsl */ `
      ${GLSL_COMMON}
      attribute vec3 aStart; attribute vec3 aDir; attribute vec4 aSeed;
      uniform float uTime, uPx, uSize;
      varying float vTemp; varying float vAlpha;
      void main() {
        float T = uTime;
        // 1. слёт: у каждой искры своя задержка и закрученная траектория
        float q = clamp((T - aSeed.x * 0.65) / 1.35, 0.0, 1.0);
        float e = 1.0 - pow(1.0 - q, 3.0);
        vec3 p = mix(aStart, position, e);
        vec3 side = normalize(cross(position - aStart + vec3(1e-3), vec3(0.0, 1.0, 0.0)));
        p += side * sin(e * 3.14159) * (0.25 + aSeed.w * 0.5) * uSize;
        // 2. роза «дышит»: искры дрожат на месте
        p += vec3(sin(T * 7.0 + aSeed.w * 60.0), cos(T * 6.0 + aSeed.w * 41.0), sin(T * 5.0 + aSeed.w * 23.0)) * 0.0025 * uSize * e;
        // 3. взрыв: разлёт с сопротивлением воздуха
        float te = max(0.0, T - 3.0);
        float drag = (1.0 - exp(-2.6 * te)) / 2.6;
        p += aDir * drag * (0.9 + aSeed.y * 1.4 + aSeed.w * 0.9) * uSize * 1.7;
        vec4 world = modelMatrix * vec4(p, 1.0);
        world.y += 0.3 * te * te * uSize; // горячие искры поднимаются
        vec4 mv = viewMatrix * world;
        gl_Position = projectionMatrix * mv;

        float flicker = 0.7 + 0.3 * sin(T * (9.0 + aSeed.w * 14.0) + aSeed.w * 80.0);
        float cool = exp(-te * 1.3);
        vTemp = (aSeed.y * (0.78 + 0.22 * (1.0 - e)) + 0.18 * (1.0 - e)) * cool * flicker + 0.05;
        vAlpha = ss(0.0, 0.12, q) * cool * (1.0 - ss(1.6, 2.4, te)) * (0.45 + 0.55 * aSeed.y);
        float size = (0.0038 + aSeed.z * 0.004) * uSize;
        size *= 1.0 + 1.3 * (1.0 - e) * step(0.001, q); // в полёте искры крупнее
        size *= 1.0 + te * 0.25;
        gl_PointSize = max(1.0, size * uPx / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_COMMON}
      varying float vTemp; varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r2 = dot(c, c) * 4.0;
        float core = exp(-r2 * 9.0), halo = exp(-r2 * 2.4) * 0.3;
        // ярче единицы — уйдёт в свечение
        vec3 col = fireColor(vTemp) * (core * 2.6 + halo) * (0.6 + vTemp * 1.4);
        gl_FragColor = vec4(col * vAlpha, vAlpha * core * 0.6);
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

// ---------- угольки: штрихи с размытием в движении, их несёт поток газа ----------
function buildEmbers(count, dpr, aspect) {
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: dpr }, uVel: { value: null }, uTexel: { value: new THREE.Vector2() }, uAspect: { value: aspect } },
    vertexShader: /* glsl */ `
      ${GLSL_COMMON}
      attribute vec4 aSeed;
      uniform float uTime, uPx, uAspect; uniform sampler2D uVel; uniform vec2 uTexel;
      varying float vTemp; varying float vAlpha; varying vec2 vDir; varying float vLen;
      void main() {
        float life = 1.0 + aSeed.z * 1.0;
        float age = mod(uTime + aSeed.y * life, life);
        float birth = uTime - age;
        float sm = ss(3.0, 4.0, birth), fl = ss(4.0, 5.0, birth), fx = clamp((birth - 5.0) / 0.8, 0.0, 1.0);
        float amount = (0.2 * sm + 0.7 * fl + 1.0 * fx) * step(3.0, birth) * (1.0 - step(5.9, birth));
        float on = step(fract(aSeed.y * 13.37 + aSeed.x * 7.1), amount);
        float k = age / life;
        float rise = (0.07 + aSeed.z * 0.2) * (1.0 + fx * 2.0);
        float wob = sin(age * 2.6 + aSeed.y * 30.0) * 0.012 * (1.0 + age * 2.0);
        vec2 pos = vec2(aSeed.x + wob, frontY(birth) + 0.01 + age * rise);
        // поток горячего воздуха подхватывает уголёк
        vec2 flow = texture2D(uVel, clamp(pos, 0.0, 1.0)).xy * uTexel;
        pos += flow * age * 0.55;
        vec2 vel = vec2(cos(age * 2.6 + aSeed.y * 30.0) * 0.031 * (1.0 + age * 2.0), rise) + flow * 0.55;
        vDir = normalize(vec2(vel.x * uAspect, vel.y) + 1e-5);
        vLen = clamp(length(vel) * 3.0, 0.0, 1.0);
        vTemp = (1.0 - k) * (0.55 + 0.45 * aSeed.w);
        vAlpha = on * (1.0 - k) * ss(0.0, 0.05, k) * (1.0 - ss(5.7, 6.3, uTime));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
        gl_PointSize = (7.0 + aSeed.w * 12.0) * uPx * (1.0 - 0.45 * k);
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_COMMON}
      varying float vTemp; varying float vAlpha; varying vec2 vDir; varying float vLen;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        c.y = -c.y;
        vec2 perp = vec2(-vDir.y, vDir.x);
        float al = dot(c, vDir), pe = dot(c, perp);
        float sa = mix(0.07, 0.36, vLen), sp = 0.045;
        float a = exp(-al * al / (2.0 * sa * sa) - pe * pe / (2.0 * sp * sp));
        gl_FragColor = vec4(fireColor(vTemp) * a * vAlpha * (1.2 + vTemp * 2.5), a * vAlpha * 0.6);
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

// ---------- горящая страница + пламя и дым из симуляции ----------
function buildPage(tex, aspect) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPage: { value: tex }, uDye: { value: null }, uAspect: { value: aspect } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_COMMON}
      uniform sampler2D uPage, uDye; uniform float uTime, uAspect;
      varying vec2 vUv;
      void main() {
        float T = uTime;
        vec2 uv = vUv;
        vec2 p = vec2(uv.x * uAspect, uv.y);
        float sm = ss(3.0, 4.0, T), fl = ss(4.0, 5.0, T), fx = clamp((T - 5.0) / 0.8, 0.0, 1.0);
        float d = T < 3.0 ? 9.0 : burnDist(uv, T, uAspect);
        vec4 dye = T < SIM_START ? vec4(0.0) : texture2D(uDye, uv);
        float temp = dye.r, smoke = dye.g;

        // марево: горячий воздух преломляет свет
        float haze = clamp(temp * 0.8 + (sm * 0.4 + fl + fx) * exp(-max(d, 0.0) / 0.1), 0.0, 2.0);
        vec2 jitter = vec2(noise(vec2(uv.y * 42.0, T * 7.0)) - 0.5, noise(vec2(uv.x * 34.0 + T * 5.0, uv.y * 26.0 - T * 3.0)) - 0.5);
        vec3 page = texture2D(uPage, uv + jitter * 0.006 * haze).rgb;

        // подпалина → обугливание
        float scorch = 1.0 - ss(0.0, 0.17, d);
        page = mix(page, page * vec3(0.6, 0.38, 0.24) + vec3(0.07, 0.03, 0.01), scorch * 0.85);
        float charred = 1.0 - ss(0.0, 0.045, d);
        page = mix(page, vec3(0.022, 0.016, 0.013), charred);
        float alpha = ss(-0.002, 0.004, d);

        float glowAmt = 0.75 * sm + 0.9 * fl + 1.5 * fx;
        float flick = 0.65 + 0.7 * noise(vec2(p.x * 14.0, T * 6.0));
        // тлеющая кромка: тонкая раскалённая линия и тёплый ореол
        float edge = exp(-max(d, 0.0) / 0.008) * alpha;
        vec3 em = fireColor(edge * 0.95 + 0.05) * edge * glowAmt * flick * 1.6;
        em += fireColor(0.42) * exp(-max(d, 0.0) / 0.045) * alpha * glowAmt * 0.18;
        // искорки, перебегающие по углю
        float sp = step(0.84, noise(p * 95.0 + vec2(0.0, T * 0.7))) * charred * alpha * (1.0 - edge);
        em += fireColor(0.78) * sp * glowAmt * (0.5 + 0.8 * sin(T * 11.0 + p.x * 50.0 + p.y * 20.0));
        // мелкие язычки у самой кромки (детали, которые не поймает сетка симуляции)
        float lick = fbm(vec2(p.x * 22.0, p.y * 9.0 - T * 4.5));
        float lh = max(d, 0.0) / (0.012 + 0.03 * fl + 0.05 * fx);
        em += fireColor(0.85) * pow(clamp(lick * 1.8 - 0.55 - lh, 0.0, 1.0), 1.4) * step(-0.004, d) * (0.4 * sm + fl + fx) * 2.0;

        // пламя из симуляции + мелкая турбулентность поверх
        // языки: вытянутая вверх турбулентность рвёт поле температуры на пряди
        float tongues = fbm(vec2(p.x * 13.0, p.y * 5.0 - T * 4.6) + vec2(fbm(vec2(p.x * 6.0, p.y * 3.0 - T * 2.2)) * 1.6, 0.0));
        float detail = pow(tongues, 1.6) * 2.6;
        float ft = temp * detail;
        vec3 fire = fireColor(clamp(ft * 0.45, 0.0, 1.0)) * pow(ft, 1.15) * 1.7;

        // вспышка взрыва розы (короткая, в центре)
        float boom = step(3.0, T) * exp(-(T - 3.0) * 8.0);
        vec2 c = (uv - 0.5) * vec2(uAspect, 1.0);
        em += vec3(1.0, 0.75, 0.45) * boom * exp(-dot(c, c) * 60.0) * 1.2;
        // резкая вспышка, с которой огонь охватывает страницу
        float burst = step(5.0, T) * exp(-(T - 5.0) * 3.5);
        fire *= 1.0 + burst * 0.7;

        float fadeOut = 1.0 - ss(5.95, 6.6, T);
        em *= fadeOut;
        fire *= fadeOut;
        float sa = clamp(smoke * 0.7, 0.0, 0.8) * fadeOut;
        vec3 smokeCol = vec3(0.075, 0.064, 0.058) + fireColor(0.4) * min(temp, 1.0) * 0.22;

        vec3 rgb = page * alpha;
        float a = alpha;
        rgb = rgb * (1.0 - sa) + smokeCol * sa; // дым поверх
        a = a + sa * (1.0 - a);
        vec3 light = em + fire;
        rgb += light;
        a = max(a, clamp(max(light.r, max(light.g, light.b)) * 0.7, 0.0, 1.0));
        gl_FragColor = vec4(rgb, a);
      }`.replace('SIM_START', SIM_START.toFixed(2)),
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  return mesh;
}

// ======================================================================
const S = {}; // текущая сцена
let startTime = 0, running = false, raf = 0;

function dispose() {
  if (!S.bloom) return;
  S.bloom.dispose();
  [S.fluid.vel, S.fluid.dye, S.fluid.prs].forEach((pp) => { pp.read.dispose(); pp.write.dispose(); });
  S.fluid.div.dispose();
  S.fluid.curl.dispose();
  [S.page, S.embers, S.rose].forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
}

function setup() {
  dispose();
  const W = window.innerWidth, H = window.innerHeight;
  const mobile = W < 820;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  renderer.autoClear = false;

  S.cam3d = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
  S.cam3d.position.set(0, 0, 6);
  S.camFlat = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
  S.scene3d = new THREE.Scene();
  S.sceneFlat = new THREE.Scene();

  S.fluid = new Fluid(renderer, W / H, mobile ? 150 : 210, mobile ? 360 : 540, GLSL_COMMON);
  S.bloom = new Bloom(renderer, Math.round(W * dpr), Math.round(H * dpr), 6);

  S.page = buildPage(introTexture(W, H, Math.min(dpr, 1.5)), W / H);
  S.sceneFlat.add(S.page);
  S.embers = buildEmbers(mobile ? 1600 : 3400, dpr, W / H);
  S.embers.material.uniforms.uTexel.value.copy(S.fluid.texel);
  S.sceneFlat.add(S.embers);

  S.rose = buildRose(W, H, S.cam3d, (H * dpr) / 2 / Math.tan((35 * Math.PI) / 360));
  S.rose.rotation.x = 0.42;
  S.scene3d.add(S.rose);
  S.simTime = SIM_START;
}

function simulateTo(T, maxSteps) {
  let n = 0;
  while (S.simTime + DT <= T && n < maxSteps) {
    S.fluid.step(S.simTime, DT);
    S.simTime += DT;
    n++;
  }
  if (S.simTime + DT <= T) S.simTime = T; // не успеваем — догоняем, пропуская шаги
}

function draw(T) {
  if (T >= SIM_START) simulateTo(T, 4);
  S.rose.material.uniforms.uTime.value = T;
  S.rose.rotation.y = -0.5 + T * 0.16;
  S.embers.material.uniforms.uTime.value = T;
  S.embers.material.uniforms.uVel.value = S.fluid.vel.read.texture;
  S.page.material.uniforms.uTime.value = T;
  S.page.material.uniforms.uDye.value = S.fluid.dye.read.texture;
  S.bloom.render(() => {
    renderer.render(S.sceneFlat, S.camFlat);
    renderer.render(S.scene3d, S.cam3d);
  });
}

function frame(now) {
  const T = FREEZE !== null ? parseFloat(FREEZE) : (now - startTime) / 1000;
  draw(T);
  introBg.classList.add('gone');
  if (T >= END && FREEZE === null) return finish();
  raf = requestAnimationFrame(frame);
}

function finish() {
  running = false;
  cancelAnimationFrame(raf);
  canvas.classList.add('done');
  introBg.classList.add('gone');
  skipBtn.hidden = true;
  document.documentElement.style.overflow = '';
}

function play() {
  if (!renderer || reduceMotion) return finish();
  running = true;
  canvas.classList.remove('done');
  introBg.classList.remove('gone');
  skipBtn.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  window.scrollTo(0, 0);
  setup();
  // режим разглядывания кадра: заранее досчитываем симуляцию до нужной секунды
  if (FREEZE !== null) simulateTo(parseFloat(FREEZE), 100000);
  startTime = performance.now();
  raf = requestAnimationFrame(frame);
}

skipBtn.addEventListener('click', finish);
$('#replay').addEventListener('click', () => {
  if (!running) play();
});
let resizeTimer;
window.addEventListener('resize', () => {
  if (!running) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const t = (performance.now() - startTime) / 1000;
    setup();
    S.simTime = Math.max(SIM_START, t);
  }, 120);
});

// ждём шрифты, чтобы надписи на сгорающей странице были правильными
Promise.race([
  Promise.all(['600 20px "Cormorant Garamond"', 'italic 500 22px "Cormorant Garamond"', '11px "JetBrains Mono"'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 2000)),
]).catch(() => {}).then(play);
