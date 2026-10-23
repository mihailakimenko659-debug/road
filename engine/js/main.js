import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { Engine, LAYOUTS } from './engine.js';
import { computeCycle, bestAdvance, strokeOf, liftIn, liftEx, TIMING, wrap720 } from './thermo.js';
import { M, clipPlanes, applyClip, setXray } from './materials.js';
import { buildLab } from './lab.js';
import { Post } from './post.js';
import { drawPV, drawPA, drawCycles } from './charts.js';
import { PARTS } from './parts.js';
import { EngineSound } from './sound.js';

const $ = (id) => document.getElementById(id);
const fmt = (x, d = 0) => x.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });
const D2R = Math.PI / 180;

// ---------------- рендер и сцена ----------------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 260);
camera.position.set(-9.6, 5.4, 13.8);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.6, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.5;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI * 0.53;
controls.autoRotateSpeed = 0.5;

const env = buildLab(renderer, scene);
const post = new Post(renderer, scene, camera);

// ---------------- состояние ----------------
const state = {
  rpm: 2000, throttle: 0.6, advance: 20, vvt: 0,
  cylinders: 4, bore: 86, stroke: 86, cr: 10.5,
  cut: 'quarter', cutPos: 0.5, watch: 0, xray: false, flow: true, labels: true,
  explode: 0, slow: 40, playing: true,
  visible: { cover: true, head: true, block: true, manifolds: true, timing: true, pan: true, stand: true },
};
const geomParams = () => ({ cylinders: state.cylinders, bore: state.bore, stroke: state.stroke, cr: state.cr });
const slowFactor = () => Math.pow(10, -3 + 3 * state.slow / 100);

let engine = null, cyc = null, theta = 30, heat = 0;
const sound = new EngineSound();

function rebuild() {
  if (engine) engine.dispose();
  engine = new Engine(geomParams());
  scene.add(engine.root);
  engine.setExplode(state.explode);
  applyVisibility();
  fillWatch();
  updateClip();
  recompute();
  buildCallouts();
  $('order').textContent = 'порядок ' + LAYOUTS[engine.d.n].order;
}

function recompute() {
  const p = { ...geomParams(), rod: engine.d.L, rpm: state.rpm, throttle: state.throttle, advance: state.advance, vvt: state.vvt };
  cyc = computeCycle(p);
  clearTimeout(recompute.t);
  recompute.t = setTimeout(() => {
    const b = bestAdvance(p);
    $('bestAdv').textContent = `Больше всего момента при ${b}° до ВМТ`;
    $('setBest').dataset.v = b;
  }, 120);
}

// ---------------- разрез ----------------
function updateClip() {
  if (!engine) return;
  const d = engine.d;
  const [pz, px] = clipPlanes;
  $('cutPosRow').hidden = state.cut === 'none';
  let planes = [], inter = false;
  if (state.cut === 'long') {
    const z = (state.cutPos - 0.5) * d.Wb;
    pz.normal.set(0, 0, -1); pz.constant = z / 100;
    planes = [pz];
    $('cutPosLabel').textContent = 'Сдвиг плоскости';
    $('cutPosV').textContent = `${fmt(z)} мм`;
  } else {
    const xMin = d.xs[0] - d.pitch / 2, xMax = d.xs[d.n - 1] + d.pitch / 2;
    const x = xMin + state.cutPos * (xMax - xMin);
    px.normal.set(1, 0, 0); px.constant = -x / 100;
    pz.normal.set(0, 0, -1); pz.constant = 0;
    planes = state.cut === 'cross' ? [px] : state.cut === 'quarter' ? [pz, px] : [];
    inter = state.cut === 'quarter';
    $('cutPosLabel').textContent = 'Плоскость вдоль вала';
    const near = d.xs.reduce((b, cx, i) => (Math.abs(cx - x) < Math.abs(d.xs[b] - x) ? i : b), 0);
    $('cutPosV').textContent = Math.abs(d.xs[near] - x) < 6 ? `по оси цил. ${near + 1}` : `${fmt(x)} мм`;
  }
  applyClip(planes, inter);
  engine.springMat.clippingPlanes = planes; engine.springMat.clipIntersection = inter; engine.springMat.needsUpdate = true;
  paintRange($('cutPos'));
}
function cutToCylinder(i) {
  const d = engine.d;
  const xMin = d.xs[0] - d.pitch / 2, xMax = d.xs[d.n - 1] + d.pitch / 2;
  state.cutPos = (d.xs[i] - xMin) / (xMax - xMin);
  $('cutPos').value = Math.round(state.cutPos * 1000);
}
const isClipped = (p) => {
  const planes = M.aluminum.clippingPlanes;
  if (!planes || !planes.length) return false;
  const neg = planes.map((pl) => pl.distanceToPoint(p) < 0);
  return M.aluminum.clipIntersection ? neg.every(Boolean) : neg.some(Boolean);
};

// ---------------- видимость ----------------
function applyVisibility() {
  const g = engine.groups, v = state.visible;
  g.cover.visible = v.cover;
  g.head.visible = v.head;
  g.block.visible = v.block;
  g.intake.visible = g.exhaust.visible = v.manifolds;
  engine.timingVisible = v.timing;
  g.timing.visible = v.timing && !engine.exploded;
  g.pan.visible = v.pan;
  g.stand.visible = v.stand;
}
function isVisibleUp(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
const innerVisible = () => state.cut !== 'none' || state.xray || state.explode > 0.3 || !state.visible.block || !state.visible.head || !state.visible.cover;

// ---------------- выноски с живыми цифрами ----------------
const coEl = $('callouts'), svg = $('leaders');
let callouts = [];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function buildCallouts() {
  coEl.innerHTML = ''; svg.innerHTML = '';
  const d = engine.d;
  const w = () => engine.cyl[state.watch];
  // где деталь (в мм модели), к какой группе относится, нужно ли разрез, где ставить табличку
  const defs = [
    { key: 'piston', group: 'pistons', inner: true, side: -1, dy: -30, at: () => V(w().x, w().crown - 22, -d.R * 0.75) },
    { key: 'rod', group: 'pistons', inner: true, cutOnly: true, side: -1, dy: 40, at: () => { const c = w(); return V(c.x, (c.rod.position.y + c.piston.position.y) / 2, c.rod.position.z / 2); } },
    { key: 'crank', group: 'crank', side: -1, dy: 30, at: () => V(d.xs[0] - d.pitch / 2, -d.mainR, 0) },
    { key: 'camIn', group: 'valvetrain', inner: true, side: -1, dy: -40, at: () => V(d.xs[0] + d.pitch / 2, d.vIn.cam.y + d.R0, d.vIn.cam.z) },
    { key: 'camEx', group: 'valvetrain', inner: true, side: 1, dy: -50, at: () => V(d.xs[d.n - 1] - d.pitch / 2, d.vEx.cam.y + d.R0, d.vEx.cam.z) },
    { key: 'plug', group: 'head', inner: true, side: 1, dy: -20, at: () => V(w().x, d.H0 + d.hd + 20, 0) },
    { key: 'throttle', group: 'intake', side: -1, dy: -30, at: () => V((d.Lb / 2 - 30) + 32, d.H0 + 60, -(d.Wh / 2 + 95)) },
    { key: 'exhaust', group: 'exhaust', side: 1, dy: 20, at: () => V(d.xs[Math.min(1, d.n - 1)], d.H0 + 20, d.Wh / 2 + 52) },
    { key: 'belt', group: 'timing', side: -1, dy: 10, at: () => V(d.xBelt - 12, (d.vIn.cam.y + d.vEx.cam.y) * 0.3, d.vEx.cam.z + 40) },
    { key: 'flywheel', group: 'crank', side: 1, dy: 30, at: () => V(d.xRear + 30, d.B * 1.0, d.B * 0.95) },
    { key: 'gas', group: 'gas', inner: true, cutOnly: true, side: 1, dy: 60, at: () => V(w().x, (w().crown + d.H0) / 2, -d.R * 0.4) },
  ];
  callouts = defs.map((def) => {
    const el = document.createElement('div'); el.className = 'co';
    el.innerHTML = `<b>${PARTS[def.key].name}</b><span></span>`;
    coEl.appendChild(el);
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '3');
    svg.append(ln, dot);
    return { ...def, el, sub: el.querySelector('span'), ln, dot, title: el.querySelector('b') };
  });
}
function calloutText(key) {
  const c = engine.cyl[state.watch], d = engine.d, a = Math.round(c.alpha) % 720;
  const om = state.rpm * 2 * Math.PI / 60, b = (c.alpha) * D2R, r = d.r / 1000, L = d.L / 1000;
  const v = r * om * (Math.sin(b) + r * Math.sin(2 * b) / (2 * Math.sqrt(L * L - (r * Math.sin(b)) ** 2)));
  const F = Math.max(0, cyc.P[a] - 1e5) * Math.PI * (d.B / 1000) ** 2 / 4 / 1000;
  const em = (s) => `<em>${s}</em>`;
  switch (key) {
    case 'piston': return `${em(fmt(Math.abs(v), 1) + ' м/с')} · давит ${em(fmt(F, 1) + ' кН')}`;
    case 'rod': { const phi = Math.abs(c.rod.rotation.x) / D2R; return `наклон ${em(fmt(phi, 1) + '°')} · ${em(fmt(F / Math.cos(phi * D2R), 1) + ' кН')}`; }
    case 'crank': return `${em(fmt(state.rpm) + ' об/мин')} · ${em(fmt(Math.max(0, cyc.torque)) + ' Н·м')}`;
    case 'camIn': return `${em(fmt(state.rpm / 2) + ' об/мин')} · подъём ${em(fmt(liftIn(c.alpha, state.vvt), 1) + ' мм')}`;
    case 'camEx': return `${em(fmt(state.rpm / 2) + ' об/мин')} · подъём ${em(fmt(liftEx(c.alpha), 1) + ' мм')}`;
    case 'plug': return c.spark ? `${em('искра!')} ≈ 25 кВ` : `зажигает за ${em(state.advance + '°')} до ВМТ`;
    case 'throttle': return `открыта на ${em(fmt(state.throttle * 100) + ' %')} · ${em(fmt(cyc.pMan / 1000) + ' кПа')}`;
    case 'exhaust': return `газы ${em(fmt(cyc.T[600] - 273) + ' °C')} · ${em(fmt(cyc.fuelFlow * 15.7 * 1000, 0) + ' г/с')}`;
    case 'belt': return `${em(fmt(0.3 * d.B / 1000 * om, 1) + ' м/с')} · распредвалы вдвое медленнее`;
    case 'flywheel': return `запас ${em(fmt(0.5 * 0.13 * om * om / 1000, 1) + ' кДж')}`;
    case 'gas': return `${em(fmt(cyc.P[a] / 1e5, 1) + ' бар')} · ${em(fmt(cyc.T[a] - 273) + ' °C')} · ${em(fmt(cyc.V[a] * 1e6) + ' см³')}`;
    default: return '';
  }
}
const tmp = new THREE.Vector3(), cen = new THREE.Vector3();
function updateCallouts(textToo) {
  const show = state.labels && !engine.exploded;
  coEl.hidden = !show; svg.style.display = show ? '' : 'none';
  if (!show) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  cen.set(0, 0.8, 0).project(camera);
  const cx = (cen.x * 0.5 + 0.5) * w;
  const used = [];
  const leftEdge = Math.max($('gauges').getBoundingClientRect().right, document.querySelector('.hero').getBoundingClientRect().right) + 14;
  const rightEdge = $('controls').getBoundingClientRect().left - 14;
  for (const co of callouts) {
    const grp = engine.groups[co.group];
    let vis = grp ? isVisibleUp(grp) : true;
    if (co.inner && !innerVisible()) vis = false;
    if (co.cutOnly && state.cut === 'none') vis = false;
    tmp.copy(co.at());
    if (grp) tmp.add(grp.position);
    engine.root.localToWorld(tmp);
    if (vis && isClipped(tmp)) vis = false;
    tmp.project(camera);
    if (tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1) vis = false;
    if (!vis) { co.el.style.display = 'none'; co.ln.style.display = 'none'; co.dot.style.display = 'none'; continue; }
    const ax = (tmp.x * 0.5 + 0.5) * w, ay = (-tmp.y * 0.5 + 0.5) * h;
    const side = ax < cx ? -1 : 1;
    if (textToo) co.sub.innerHTML = calloutText(co.key);
    co.el.style.display = ''; co.ln.style.display = ''; co.dot.style.display = '';
    const bw = co.el.offsetWidth, bh = co.el.offsetHeight;
    let bx = ax + side * 70, by = ay + co.dy - bh / 2;
    if (side < 0) bx -= bw;
    // не даём табличкам налезать друг на друга
    for (const u of used) if (bx < u.x + u.w + 6 && bx + bw + 6 > u.x && by < u.y + u.h + 4 && by + bh + 4 > u.y) by = u.y + u.h + 6;
    // таблички не заходят под левую колонку и правую панель
    const lo = w > 900 ? leftEdge : 8, hi = w > 900 ? rightEdge : w - 8;
    if (bx < lo) bx = side < 0 ? Math.max(lo, ax + 70) : lo;
    if (bx + bw > hi) bx = hi - bw;
    by = Math.max(8, Math.min(h - bh - 90, by));
    used.push({ x: bx, y: by, w: bw, h: bh });
    co.el.style.transform = `translate(${bx}px, ${by}px)`;
    const ex = side < 0 ? bx + bw : bx, ey = by + bh / 2;
    co.ln.setAttribute('x1', ax); co.ln.setAttribute('y1', ay); co.ln.setAttribute('x2', ex); co.ln.setAttribute('y2', ey);
    co.dot.setAttribute('cx', ax); co.dot.setAttribute('cy', ay);
  }
}

// ---------------- подсказка при наведении ----------------
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tip = $('tip');
let hoverPending = false, lastPointer = null;
canvas.addEventListener('pointermove', (e) => { lastPointer = e; if (!hoverPending) { hoverPending = true; requestAnimationFrame(doHover); } });
canvas.addEventListener('pointerleave', () => { tip.hidden = true; lastPointer = null; });
function doHover() {
  hoverPending = false;
  const e = lastPointer;
  if (!e || !engine || e.buttons) { tip.hidden = true; return; }
  mouse.set((e.clientX / canvas.clientWidth) * 2 - 1, -(e.clientY / canvas.clientHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObject(engine.root, true);
  let hit = null;
  for (const h of hits) {
    const o = h.object;
    if (!o.userData.part || !PARTS[o.userData.part] || !isVisibleUp(o)) continue;
    if (o.isInstancedMesh || o.isPoints) continue;
    if (isClipped(h.point)) continue;
    if (state.xray && o.material && o.material.transparent && o.userData.part !== 'gas') continue;
    if (o.userData.part === 'gas' && !(state.cut !== 'none' || state.xray)) continue;
    hit = h; break;
  }
  if (!hit) { tip.hidden = true; return; }
  const key = hit.object.userData.part;
  const info = PARTS[key];
  let extra = '', text = info.text;
  if (key === 'gas') {
    const i = hit.object.userData.cyl, c = engine.cyl[i], a = Math.round(c.alpha) % 720;
    const st = strokeOf(c.alpha);
    const what = c.alpha >= cyc.ign && c.alpha < TIMING.evo ? (cyc.XB[a] < 0.99 ? 'идёт сгорание' : 'продукты сгорания расширяются') : cyc.FRESH[a] > 0.6 ? 'свежая топливно-воздушная смесь' : 'отработавшие газы';
    text = `Цилиндр ${i + 1}, такт «${st.name.toLowerCase()}»: ${what}.`;
    extra = `p = ${fmt(cyc.P[a] / 1e5, 1)} бар · T = ${fmt(cyc.T[a] - 273)} °C · V = ${fmt(cyc.V[a] * 1e6)} см³`;
  }
  tip.innerHTML = `<b>${info.name}</b><p>${text}</p>${extra ? `<span class="mono">${extra}</span>` : ''}`;
  tip.hidden = false;
  const x = Math.min(e.clientX + 16, window.innerWidth - tip.offsetWidth - 10), y = Math.min(e.clientY + 16, window.innerHeight - tip.offsetHeight - 10);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}

// ---------------- камера ----------------
let tween = null;
function flyTo(pos, target, dur = 1.2) { tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur }; }
function view(name) {
  const d = engine.d, s = 0.01;
  const xw = d.xs[state.watch] * s;
  const views = {
    overview: [V(-9.6, 5.4, 13.8), V(0, 0.6, 0)],
    front: [V(-11.5, 2.6, 1.6), V(-1.5, 1.0, 0)],
    side: [V(0.4, 2.0, 13.5), V(0, 0.8, 0)],
    top: [V(0.01, 13, 1.4), V(0, 1.4, 0)],
    cyl: [V(xw - 8.8, d.H0 * s + 1.3, 5.2), V(xw, (d.deck - d.S * 0.9) * s, -0.2)],
    valves: [V(xw - 6.6, d.H1 * s + 2.6, 3.8), V(xw, (d.H0 + 55) * s, -0.2)],
  };
  if (name === 'cyl' || name === 'valves') { if (state.cut === 'none' || state.cut === 'long') setCut('cross'); cutToCylinder(state.watch); updateClip(); }
  const [p, t] = views[name];
  flyTo(p, t);
}

// ---------------- интерфейс ----------------
function paintRange(el) { const p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--p', p + '%'); }
function bindRange(id, fn, show) {
  const el = $(id), out = $(id + 'V');
  const upd = () => { fn(+el.value); if (out && show) out.textContent = show(+el.value); paintRange(el); };
  el.addEventListener('input', upd);
  upd();
}
let rebuildT = 0;
const scheduleRebuild = () => { clearTimeout(rebuildT); rebuildT = setTimeout(rebuild, 220); };
const clearPreset = () => $('preset').querySelectorAll('button').forEach((b) => b.classList.remove('on'));

bindRange('rpm', (v) => { state.rpm = v; engine && recompute(); }, (v) => `${fmt(v)} об/мин`);
bindRange('throttle', (v) => { state.throttle = v / 100; engine && recompute(); }, (v) => `${v} %`);
bindRange('advance', (v) => { state.advance = v; engine && recompute(); }, (v) => `${v}° до ВМТ`);
bindRange('vvt', (v) => { state.vvt = v; engine && recompute(); }, (v) => (v === 0 ? 'штатно' : `${v > 0 ? 'раньше' : 'позже'} на ${Math.abs(v)}°`));
bindRange('bore', (v) => { state.bore = v; engine && scheduleRebuild(); }, (v) => `${v} мм`);
bindRange('stroke', (v) => { state.stroke = v; engine && scheduleRebuild(); }, (v) => `${v} мм`);
bindRange('cr', (v) => { state.cr = v; engine && scheduleRebuild(); }, (v) => `${fmt(v, 1)} : 1`);
bindRange('explode', (v) => { state.explode = v / 100; if (engine) { engine.setExplode(state.explode); applyVisibility(); } }, (v) => (v ? `${v} %` : 'собран'));
bindRange('cutPos', (v) => { state.cutPos = v / 1000; updateClip(); });
bindRange('slow', (v) => { state.slow = v; }, () => { const f = slowFactor(); return f >= 0.999 ? 'нет' : `в ${fmt(1 / f)} раз`; });
['rpm', 'throttle'].forEach((id) => $(id).addEventListener('input', clearPreset));
$('setBest').addEventListener('click', () => { const v = +$('setBest').dataset.v; if (!isNaN(v)) setRange('advance', v); });
function setRange(id, v) { $(id).value = v; $(id).dispatchEvent(new Event('input')); }

function segGroup(id, fn) {
  const root = $(id);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    root.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    fn(b.dataset.v);
  });
}
const PRESETS = { idle: [800, 8, 12], city: [2000, 35, 24], full: [5200, 100, 28], red: [6800, 100, 30] };
segGroup('preset', (v) => { const [r, t, a] = PRESETS[v]; setRange('rpm', r); setRange('throttle', t); setRange('advance', a); $('preset').querySelector(`[data-v="${v}"]`).classList.add('on'); });
segGroup('cylinders', (v) => { state.cylinders = +v; state.watch = 0; rebuild(); setCut(state.cut); });
function setCut(v) {
  state.cut = v;
  $('cut').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.v === v));
  if (v === 'long') { state.cutPos = 0.5; $('cutPos').value = 500; }
  if (v === 'cross') cutToCylinder(state.watch);
  if (v === 'quarter') cutToCylinder(Math.floor(engine.d.n / 2));
  updateClip();
}
segGroup('cut', setCut);
segGroup('shell', (v) => { state.xray = v === 'glass'; setXray(state.xray); });
segGroup('env', (v) => env.setMode(v));

function fillWatch() {
  const sel = $('watch');
  sel.innerHTML = engine.d.xs.map((_, i) => `<option value="${i}">№ ${i + 1}</option>`).join('');
  state.watch = Math.min(state.watch, engine.d.n - 1);
  sel.value = state.watch;
}
$('watch').addEventListener('change', (e) => { state.watch = +e.target.value; if (state.cut === 'cross') { cutToCylinder(state.watch); updateClip(); } });
$('flow').addEventListener('change', (e) => { state.flow = e.target.checked; });
$('labelsOn').addEventListener('change', (e) => { state.labels = e.target.checked; });
$('autorot').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; });
$('hq').addEventListener('change', (e) => { post.enabled = e.target.checked; renderer.setPixelRatio(Math.min(post.enabled ? 1.5 : 2, window.devicePixelRatio || 1)); resize(); });
document.querySelectorAll('[data-group]').forEach((el) => el.addEventListener('change', () => { state.visible[el.dataset.group] = el.checked; applyVisibility(); }));
document.querySelectorAll('[data-view]').forEach((el) => el.addEventListener('click', () => view(el.dataset.view)));
let chartMode = 'pv';
document.querySelectorAll('[data-chart]').forEach((el) => el.addEventListener('click', () => {
  chartMode = el.dataset.chart;
  document.querySelectorAll('[data-chart]').forEach((x) => x.classList.toggle('on', x === el));
  $('logScale').parentElement.hidden = chartMode !== 'pv';
}));
$('play').addEventListener('click', () => {
  state.playing = !state.playing;
  $('play').textContent = state.playing ? '❚❚' : '▶';
  $('play').setAttribute('aria-label', state.playing ? 'Пауза' : 'Пуск');
});
$('back').addEventListener('click', () => { theta -= 5; });
$('fwd').addEventListener('click', () => { theta += 5; });
$('soundBtn').addEventListener('click', () => { if (sound.on) sound.stop(); else sound.start(); $('soundBtn').setAttribute('aria-pressed', String(sound.on)); });
$('toggleControls').addEventListener('click', () => {
  const open = $('controls').classList.toggle('open');
  $('toggleControls').setAttribute('aria-expanded', String(open));
  $('toggleControls').textContent = open ? 'Закрыть' : 'Настройки';
});
$('gaugesToggle').addEventListener('click', () => { const c = $('gauges').classList.toggle('collapsed'); $('gaugesToggle').setAttribute('aria-expanded', String(!c)); });
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, select')) return;
  if (e.code === 'Space') { e.preventDefault(); $('play').click(); }
  if (e.key === 'ArrowLeft') theta -= e.shiftKey ? 1 : 5;
  if (e.key === 'ArrowRight') theta += e.shiftKey ? 1 : 5;
});

// ---------------- пояснение к такту ----------------
const STROKE_COLOR = { intake: 'var(--intake)', compression: 'var(--compress)', power: 'var(--fire)', exhaust: 'var(--exhaust)' };
function explain(alpha) {
  const a = Math.round(wrap720(alpha)) % 720;
  const st = strokeOf(alpha);
  const inOpen = liftIn(alpha, state.vvt) > 0.3, exOpen = liftEx(alpha) > 0.3;
  const p = cyc.P[a] / 1e5, T = cyc.T[a] - 273;
  const v = (s) => `<span class="v">${s}</span>`, c = (s) => `<span class="c">${s}</span>`;
  let text;
  if (inOpen && exOpen) text = `<b>Перекрытие клапанов.</b> Открыты и впускной, и выпускной: уходящие газы помогают втянуть свежую смесь.`;
  else if (st.key === 'intake') text = `<b>Впуск.</b> Поршень идёт вниз и тянет за собой смесь воздуха и бензина. В цилиндре разрежение — ${c(fmt(p, 2) + ' бар')}.`;
  else if (st.key === 'compression' && alpha < cyc.ign) text = `<b>Сжатие.</b> Клапаны закрыты. Поршень сжимает смесь в ${c(fmt(state.cr, 1) + ' раза')}: она нагревается до ${v(fmt(T) + ' °C')}, давление ${v(fmt(p, 1) + ' бар')}.`;
  else if (alpha >= cyc.ign && alpha < 360) text = `<b>Искра.</b> Свеча поджигает смесь за ${v(state.advance + '°')} до ВМТ — пламени нужно время, чтобы разгореться. Давление уже ${v(fmt(p, 1) + ' бар')}.`;
  else if (st.key === 'power' && !exOpen) text = `<b>Рабочий ход.</b> Газы при ${v(fmt(T) + ' °C')} и ${v(fmt(p, 1) + ' бар')} толкают поршень вниз. Только этот такт даёт работу.`;
  else if (st.key === 'power') text = `<b>Свободный выпуск.</b> Выпускной клапан открылся до НМТ: газы под давлением сами вырываются в коллектор.`;
  else text = `<b>Выпуск.</b> Поршень поднимается и выталкивает газы при ${v(fmt(T) + ' °C')} в выпускной коллектор.`;
  return { st, text };
}

// ---------------- главный цикл ----------------
const clock = new THREE.Clock();
let uiT = 0, coT = 0, time = 0;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < 700 ? 50 : 34;
  if (w > 900) camera.setViewOffset(w, h, -Math.round((Math.min(380, w * 0.27) - 330) / 2) - 10, 0, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  post.setSize();
}
window.addEventListener('resize', resize);
resize();
const camLocal = new THREE.Vector3();

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  time += dt;
  let dTheta = 0;
  if (state.playing) { dTheta = state.rpm / 60 * 360 * dt * slowFactor(); theta += dTheta; }
  if (tween) {
    const t = Math.min(1, (performance.now() - tween.start) / 1000 / tween.dur);
    const k = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    if (t >= 1) tween = null;
  }
  const load = state.throttle;
  const heatTarget = Math.min(1.3, 1.3 * Math.pow(state.rpm / 6000, 1.5) * Math.pow(load, 1.2)) * (state.playing ? 1 : 0.6);
  heat += (heatTarget - heat) * Math.min(1, dt / 4);
  engine.theta = theta;
  camLocal.copy(camera.position).multiplyScalar(100);
  engine.update(theta, { cyc, vvt: state.vvt, throttle: state.throttle, flow: state.flow, dTheta, time, watch: state.cut === 'none' && !state.xray ? -1 : state.watch, heat: heat * 2.4, cam: camLocal });

  // звук: по вспышкам в цилиндрах
  sound.update(state.playing ? state.rpm / 60 * engine.d.n / 2 * slowFactor() : 0, load);
  if (dTheta > 0 && dTheta < 180) for (const c of engine.cyl) {
    if (Math.floor((theta - c.off - cyc.ign) / 720) > Math.floor((theta - dTheta - c.off - cyc.ign) / 720)) sound.fire(load);
  }

  controls.update();
  post.render(camera.position.distanceTo(controls.target), time);
  coT += dt;
  updateCallouts(coT > 0.1);
  if (coT > 0.1) coT = 0;
  uiT += dt;
  if (uiT > 0.08) { uiT = 0; updateUI(); }
  requestAnimationFrame(frame);
}

function updateUI() {
  const c = engine.cyl[state.watch];
  const ex = explain(c.alpha);
  $('nowCyl').textContent = `Цилиндр ${state.watch + 1} · ${fmt(c.alpha)}° цикла`;
  const pill = $('nowStroke');
  pill.textContent = ex.st.name; pill.style.background = STROKE_COLOR[ex.st.key];
  $('nowText').innerHTML = ex.text;
  const li = liftIn(c.alpha, state.vvt), le = liftEx(c.alpha);
  $('vIn').textContent = li > 0.05 ? `Впуск ${fmt(li, 1)} мм` : 'Впуск закрыт';
  $('vEx').textContent = le > 0.05 ? `Выпуск ${fmt(le, 1)} мм` : 'Выпуск закрыт';
  $('vIn').classList.toggle('open', li > 0.05); $('vEx').classList.toggle('open', le > 0.05);
  $('vSpark').hidden = !c.spark;

  $('tPower').textContent = fmt(Math.max(0, cyc.power / 1000), 1);
  $('tHp').textContent = `кВт`;
  $('tTorque').textContent = fmt(Math.max(0, cyc.torque));
  $('tEff').textContent = fmt(cyc.etaE * 100);
  $('gaugeSum').textContent = `${fmt(Math.max(0, cyc.power / 735.5))} л.с. · ${fmt(cyc.displacement * 1000, 1)} л`;
  $('roPmax').textContent = fmt(cyc.pmax / 1e5, 0);
  $('roPmaxA').textContent = `бар · ${fmt(cyc.apmax - 360)}° после ВМТ`;
  $('roMap').textContent = fmt(cyc.pMan / 1000);
  $('roPs').textContent = fmt(cyc.pistonSpeed, 1);
  $('knockBox').className = 'ro ' + (cyc.knock ? 'bad' : cyc.knockRisk > 0.6 ? 'warn' : 'ok');
  $('roKnock').textContent = cyc.knock ? 'есть!' : cyc.knockRisk > 0.6 ? 'риск' : 'нет';
  $('roTu').textContent = `смесь ${fmt(cyc.TuMax - 273)} °C`;
  const a = Math.round(c.alpha) % 720;
  $('live').textContent = `Ц${state.watch + 1}: p ${fmt(cyc.P[a] / 1e5, 1)} бар · T ${fmt(cyc.T[a] - 273)} °C · V ${fmt(cyc.V[a] * 1e6)} см³`;
  $('angle').textContent = `${fmt(wrap720(theta))}° КВ`;
  const revSec = 60 / state.rpm / slowFactor();
  $('perRev').textContent = revSec >= 1 ? `оборот за ${fmt(revSec, 1)} с` : `${fmt(1 / revSec, revSec > 0.1 ? 1 : 0)} об/с на экране`;
  if (!$('gauges').classList.contains('collapsed') && $('gauges').getClientRects().length) {
    if (chartMode === 'pv') drawPV($('chart'), cyc, c.alpha, $('logScale').checked);
    else drawPA($('chart'), cyc, c.alpha, state.vvt);
    drawCycles($('cycles'), engine, state.watch);
  }
}

if (window.innerWidth < 700) { state.labels = false; $('labelsOn').checked = false; post.enabled = false; $('hq').checked = false; }
window.lab = { state, view, get theta() { return theta; }, set theta(v) { theta = v; } };
rebuild();
setCut('quarter');
requestAnimationFrame(frame);
