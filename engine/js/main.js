import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { Engine, LAYOUTS } from './engine.js';
import { computeCycle, bestAdvance, strokeOf, liftIn, liftEx, TIMING, wrap720 } from './thermo.js';
import { M, clipPlanes, applyClip, setXray } from './materials.js';
import { buildLab } from './lab.js';
import { drawPV, drawPA, drawCycles } from './charts.js';
import { PARTS } from './parts.js';
import { EngineSound } from './sound.js';

const $ = (id) => document.getElementById(id);
const fmt = (x, d = 0) => x.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------------- рендер и сцена ----------------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 300);
camera.position.set(-7.4, 4.6, 11.6);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI * 0.53;
controls.autoRotateSpeed = 0.6;

buildLab(renderer, scene);

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
  buildLabels();
  const d = engine.d;
  const L = (d.n * Math.PI * d.B * d.B / 4 * d.S / 1e6);
  $('spec').textContent = `${d.n} цил. · ${fmt(L, 2)} л · ${d.B}×${d.S} мм · DOHC ${d.n * 4}V`;
  $('order').textContent = 'порядок работы ' + LAYOUTS[d.n].order;
}

function recompute() {
  const p = { ...geomParams(), rod: engine.d.L, rpm: state.rpm, throttle: state.throttle, advance: state.advance, vvt: state.vvt };
  cyc = computeCycle(p);
  clearTimeout(recompute.t);
  recompute.t = setTimeout(() => {
    const b = bestAdvance(p);
    $('bestAdv').textContent = `Лучший момент при ${b}° до ВМТ`;
    $('setBest').dataset.v = b;
  }, 120);
}

// ---------------- разрез ----------------
function updateClip() {
  if (!engine) return;
  const d = engine.d;
  const [pz, px] = clipPlanes;
  const row = $('cutPosRow');
  row.hidden = state.cut === 'none';
  let planes = [], inter = false;
  if (state.cut === 'long') {
    const z = (state.cutPos - 0.5) * d.Wb;
    pz.normal.set(0, 0, -1); pz.constant = z / 100;
    planes = [pz];
    $('cutPosLabel').textContent = 'Плоскость поперёк вала, сдвиг';
    $('cutPosV').textContent = `${fmt(z)} мм`;
  } else {
    const xMin = d.xs[0] - d.pitch / 2, xMax = d.xs[d.n - 1] + d.pitch / 2;
    const x = xMin + state.cutPos * (xMax - xMin);
    px.normal.set(1, 0, 0); px.constant = -x / 100;
    pz.normal.set(0, 0, -1); pz.constant = 0;
    planes = state.cut === 'cross' ? [px] : state.cut === 'quarter' ? [pz, px] : [];
    inter = state.cut === 'quarter';
    $('cutPosLabel').textContent = 'Плоскость разреза вдоль вала';
    const near = d.xs.reduce((b, cx, i) => (Math.abs(cx - x) < Math.abs(d.xs[b] - x) ? i : b), 0);
    $('cutPosV').textContent = Math.abs(d.xs[near] - x) < 6 ? `по оси цил. ${near + 1}` : `${fmt(x)} мм`;
  }
  applyClip(planes, inter);
  engine.springMat.clippingPlanes = planes; engine.springMat.clipIntersection = inter; engine.springMat.needsUpdate = true;
}
function cutToCylinder(i) {
  const d = engine.d;
  const xMin = d.xs[0] - d.pitch / 2, xMax = d.xs[d.n - 1] + d.pitch / 2;
  state.cutPos = (d.xs[i] - xMin) / (xMax - xMin);
  $('cutPos').value = Math.round(state.cutPos * 1000);
}
const isClipped = (p) => {
  const planes = engine && M.aluminum.clippingPlanes;
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

// ---------------- подписи ----------------
const labelsEl = $('labels');
const GROUP_OF = { alternator: 'block', block: 'block', crank: 'crank', flywheel: 'crank', piston: 'pistons', rod: 'pistons', head: 'head', camIn: 'valvetrain', camEx: 'valvetrain',
  valveIn: 'valvetrain', spring: 'valvetrain', cover: 'cover', coil: 'cover', intake: 'intake', throttle: 'intake', exhaust: 'exhaust', belt: 'timing', pan: 'pan' };
let labelItems = [];
// детали внутри корпуса: подписываем, только когда их видно (разрез, рентген или снят корпус)
const INNER = new Set(['piston', 'rod', 'crank', 'camIn', 'camEx', 'valveIn', 'spring']);
const innerVisible = () => state.cut !== 'none' || state.xray || state.explode > 0.3 || !state.visible.block || !state.visible.head || !state.visible.cover;
function buildLabels() {
  labelsEl.innerHTML = '';
  labelItems = engine.anchors.map((a) => {
    const el = document.createElement('div');
    el.className = 'lbl'; el.textContent = PARTS[a.key].name;
    labelsEl.appendChild(el);
    return { el, a, group: GROUP_OF[a.key], inner: INNER.has(a.key) };
  });
  engine.d.xs.forEach((x, i) => {
    const el = document.createElement('div');
    el.className = 'lbl num'; el.textContent = String(i + 1);
    labelsEl.appendChild(el);
    labelItems.push({ el, a: { pos: new THREE.Vector3(x, engine.d.H1 + engine.d.coverH + 40, -engine.d.Wh / 2 + 30) }, group: 'cover', num: true });
  });
}
const tmpV = new THREE.Vector3();
function updateLabels() {
  const show = state.labels;
  labelsEl.hidden = !show;
  if (!show) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  for (const it of labelItems) {
    const grp = engine.groups[it.group];
    let vis = grp ? grp.visible && isVisibleUp(grp) : true;
    tmpV.copy(it.a.pos);
    if (grp) tmpV.add(grp.position);
    engine.root.localToWorld(tmpV);
    if (vis && isClipped(tmpV) && !it.num) vis = false;
    if (it.inner && !innerVisible()) vis = false;
    tmpV.project(camera);
    if (tmpV.z > 1 || !vis) { it.el.style.display = 'none'; continue; }
    it.el.style.display = '';
    it.el.style.transform = `translate(${(tmpV.x * 0.5 + 0.5) * w}px, ${(-tmpV.y * 0.5 + 0.5) * h - 10}px) translate(-50%, -100%)`;
    it.el.style.left = '0'; it.el.style.top = '0';
  }
}
function isVisibleUp(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }

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
    if (!o.userData.part || !isVisibleUp(o)) continue;
    if (isClipped(h.point)) continue;
    if (state.xray && o.material && o.material.transparent && o.userData.part !== 'gas') continue;
    if (o.userData.part === 'gas' && !(state.cut !== 'none' || state.xray)) continue;
    if (o.userData.part === 'coolant' && hits.length > 1 && !state.xray && state.cut === 'none') continue;
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
function flyTo(pos, target, dur = 1.1) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur };
}
function view(name) {
  const d = engine.d, s = 0.01;
  const xw = d.xs[state.watch] * s;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const views = {
    overview: [V(-7.4, 4.6, 11.6), V(0, 0.5, 0)],
    front: [V(-9.5, 2.2, 1.2), V(-1.5, 1.0, 0)],
    side: [V(0.4, 1.8, 10.5), V(0, 0.9, 0)],
    top: [V(0.01, 11, 1.2), V(0, 1.4, 0)],
    cyl: [V(xw - 6.2, d.H0 * s + 0.9, 3.4), V(xw, (d.deck - d.S * 0.9) * s, 0)],
    valves: [V(xw - 4.6, d.H1 * s + 1.9, 2.6), V(xw, (d.H0 + 55) * s, 0)],
  };
  if (name === 'cyl' || name === 'valves') {
    if (state.cut === 'none' || state.cut === 'long') setCut('cross');
    cutToCylinder(state.watch); updateClip();
  }
  const [p, t] = views[name];
  flyTo(p, t);
}

// ---------------- интерфейс ----------------
function bindRange(id, fn, show) {
  const el = $(id), out = $(id + 'V');
  const upd = () => { fn(+el.value); if (out) out.textContent = show(+el.value); };
  el.addEventListener('input', upd);
  upd();
}
let rebuildT = 0;
const scheduleRebuild = () => { clearTimeout(rebuildT); rebuildT = setTimeout(rebuild, 220); };

bindRange('rpm', (v) => { state.rpm = v; engine && recompute(); }, (v) => `${fmt(v)} об/мин`);
bindRange('throttle', (v) => { state.throttle = v / 100; engine && recompute(); }, (v) => `${v} %`);
bindRange('advance', (v) => { state.advance = v; engine && recompute(); }, (v) => `${v}° до ВМТ`);
bindRange('vvt', (v) => { state.vvt = v; engine && recompute(); }, (v) => (v === 0 ? 'штатно' : `${v > 0 ? 'раньше' : 'позже'} на ${Math.abs(v)}°`));
bindRange('bore', (v) => { state.bore = v; engine && scheduleRebuild(); }, (v) => `${v} мм`);
bindRange('stroke', (v) => { state.stroke = v; engine && scheduleRebuild(); }, (v) => `${v} мм`);
bindRange('cr', (v) => { state.cr = v; engine && scheduleRebuild(); }, (v) => `${fmt(v, 1)} : 1`);
bindRange('explode', (v) => { state.explode = v / 100; engine && engine.setExplode(state.explode); engine && applyVisibility(); }, (v) => (v ? `${v} %` : 'собран'));
bindRange('cutPos', (v) => { state.cutPos = v / 1000; updateClip(); }, () => $('cutPosV').textContent);
bindRange('slow', (v) => { state.slow = v; }, () => {
  const f = slowFactor();
  return f >= 0.999 ? 'нет, реальное время' : `в ${fmt(1 / f)} раз`;
});
$('setBest').addEventListener('click', () => { const v = +$('setBest').dataset.v; if (!isNaN(v)) { $('advance').value = v; $('advance').dispatchEvent(new Event('input')); } });

function segGroup(id, fn) {
  const root = $(id);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    root.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    fn(b.dataset.v);
  });
}
segGroup('cylinders', (v) => { state.cylinders = +v; state.watch = 0; rebuild(); });
function setCut(v) {
  state.cut = v;
  $('cut').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.v === v));
  if (v === 'long') { state.cutPos = 0.5; $('cutPos').value = 500; }
  if (v === 'cross') cutToCylinder(state.watch);
  if (v === 'quarter') cutToCylinder(Math.floor(engine.d.n / 2));
  updateClip();
}
segGroup('cut', setCut);

function fillWatch() {
  const sel = $('watch');
  sel.innerHTML = engine.d.xs.map((_, i) => `<option value="${i}">№ ${i + 1}</option>`).join('');
  state.watch = Math.min(state.watch, engine.d.n - 1);
  sel.value = state.watch;
}
$('watch').addEventListener('change', (e) => { state.watch = +e.target.value; if (state.cut === 'cross') { cutToCylinder(state.watch); updateClip(); } });

$('xray').addEventListener('change', (e) => { state.xray = e.target.checked; setXray(state.xray); });
$('flow').addEventListener('change', (e) => { state.flow = e.target.checked; });
$('labelsOn').addEventListener('change', (e) => { state.labels = e.target.checked; });
$('autorot').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; });
document.querySelectorAll('[data-group]').forEach((el) => el.addEventListener('change', () => { state.visible[el.dataset.group] = el.checked; applyVisibility(); }));
document.querySelectorAll('[data-view]').forEach((el) => el.addEventListener('click', () => view(el.dataset.view)));
document.querySelectorAll('[data-chart]').forEach((el) => el.addEventListener('click', () => {
  chartMode = el.dataset.chart;
  document.querySelectorAll('[data-chart]').forEach((x) => x.classList.toggle('on', x === el));
  $('logScale').parentElement.hidden = chartMode !== 'pv';
}));
let chartMode = 'pv';

$('play').addEventListener('click', () => {
  state.playing = !state.playing;
  $('play').textContent = state.playing ? '❚❚' : '▶';
  $('play').setAttribute('aria-label', state.playing ? 'Пауза' : 'Пуск');
});
$('back').addEventListener('click', () => { theta -= 5; });
$('fwd').addEventListener('click', () => { theta += 5; });
$('soundBtn').addEventListener('click', () => {
  const on = !sound.on;
  if (on) sound.start(); else sound.stop();
  $('soundBtn').setAttribute('aria-pressed', String(sound.on));
});
$('toggleControls').addEventListener('click', () => {
  const open = $('controls').classList.toggle('open');
  $('toggleControls').setAttribute('aria-expanded', String(open));
  $('toggleControls').textContent = open ? 'Закрыть' : 'Настройки';
});
$('gaugesToggle').addEventListener('click', () => {
  const c = $('gauges').classList.toggle('collapsed');
  $('gaugesToggle').setAttribute('aria-expanded', String(!c));
});
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, select')) return;
  if (e.code === 'Space') { e.preventDefault(); $('play').click(); }
  if (e.key === 'ArrowLeft') theta -= e.shiftKey ? 1 : 5;
  if (e.key === 'ArrowRight') theta += e.shiftKey ? 1 : 5;
});

// ---------------- пояснение к текущему такту ----------------
const STROKE_CLASS = { intake: 'var(--intake)', compression: 'var(--compress)', power: 'var(--fire)', exhaust: 'var(--exhaust)' };
function explain(alpha) {
  const a = Math.round(wrap720(alpha)) % 720;
  const st = strokeOf(alpha);
  const inOpen = liftIn(alpha, state.vvt) > 0.3, exOpen = liftEx(alpha) > 0.3;
  const p = cyc.P[a] / 1e5, T = cyc.T[a] - 273;
  let text;
  if (inOpen && exOpen) text = 'Перекрытие клапанов: открыты и впускной, и выпускной. Уходящие газы помогают втянуть свежую смесь.';
  else if (st.key === 'intake') text = `Поршень идёт вниз и создаёт разрежение. Через впускные клапаны в цилиндр втекает смесь воздуха и бензина. Давление ${fmt(p, 2)} бар.`;
  else if (st.key === 'compression' && alpha < cyc.ign) text = `Клапаны закрыты. Поршень поднимается и сжимает смесь в ${fmt(state.cr, 1)} раза — она нагревается до ${fmt(T)} °C, давление ${fmt(p, 1)} бар.`;
  else if (alpha >= cyc.ign && alpha < 360) text = `Искра за ${state.advance}° до ВМТ: пламени нужно время, чтобы разгореться, поэтому смесь поджигают заранее. Давление уже ${fmt(p, 1)} бар.`;
  else if (st.key === 'power' && !exOpen) text = `Рабочий ход. Сгоревшие газы (${fmt(T)} °C, ${fmt(p, 1)} бар) давят на поршень и через шатун вращают коленвал. Только этот такт даёт работу.`;
  else if (st.key === 'power') text = 'Выпускной клапан открылся до НМТ: газы под остаточным давлением сами вырываются в коллектор — свободный выпуск.';
  else text = `Поршень поднимается и выталкивает горячие газы (${fmt(T)} °C) через выпускные клапаны в коллектор.`;
  return { st, text, inOpen, exOpen };
}

// ---------------- главный цикл ----------------
const clock = new THREE.Clock();
let uiT = 0, time = 0;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < 700 ? 52 : 38;
  // сдвигаем центр кадра между левыми приборами и правой панелью
  if (w > 900) camera.setViewOffset(w, h, -Math.round((Math.min(400, w * 0.28) - 310) / 2) - 40, 0, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  time += dt;
  let dTheta = 0;
  if (state.playing) { dTheta = state.rpm / 60 * 360 * dt * slowFactor(); theta += dTheta; }
  if (tween) {
    tween.t = Math.min(1, (performance.now() - tween.start) / 1000 / tween.dur);
    const k = tween.t < 0.5 ? 4 * tween.t ** 3 : 1 - (-2 * tween.t + 2) ** 3 / 2;
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    if (tween.t >= 1) tween = null;
  }
  const load = state.throttle;
  // коллектор краснеет только на серьёзной нагрузке: тепло ∝ расходу газов и их температуре
  const heatTarget = Math.min(1.3, 1.3 * Math.pow(state.rpm / 6000, 1.5) * Math.pow(load, 1.2)) * (state.playing ? 1 : 0.6);
  heat += (heatTarget - heat) * Math.min(1, dt / 4);
  engine.theta = theta;
  engine.update(theta, { cyc, vvt: state.vvt, throttle: state.throttle, flow: state.flow, dTheta: dTheta || 0, time, watch: state.cut === 'none' && !state.xray ? -1 : state.watch, heat: heat * 2.4 });

  // вспышки — для звука
  const fireRate = state.playing ? state.rpm / 60 * engine.d.n / 2 * slowFactor() : 0;
  sound.update(fireRate, load);
  if (dTheta > 0 && dTheta < 180) {
    for (const c of engine.cyl) {
      const k0 = Math.floor((theta - dTheta - c.off - cyc.ign) / 720), k1 = Math.floor((theta - c.off - cyc.ign) / 720);
      if (k1 > k0) sound.fire(load);
    }
  }

  controls.update();
  renderer.render(scene, camera);
  updateLabels();

  uiT += dt;
  if (uiT > 0.08) { uiT = 0; updateUI(); }
  requestAnimationFrame(frame);
}

function updateUI() {
  const c = engine.cyl[state.watch];
  const ex = explain(c.alpha);
  $('nowCyl').textContent = `Цилиндр ${state.watch + 1} · ${fmt(c.alpha)}° цикла`;
  const pill = $('nowStroke');
  pill.textContent = ex.st.name;
  pill.style.background = STROKE_CLASS[ex.st.key];
  $('nowText').textContent = ex.text;
  const li = liftIn(c.alpha, state.vvt), le = liftEx(c.alpha);
  $('vIn').textContent = li > 0.05 ? `Впуск: ${fmt(li, 1)} мм` : 'Впуск: закрыт';
  $('vEx').textContent = le > 0.05 ? `Выпуск: ${fmt(le, 1)} мм` : 'Выпуск: закрыт';
  $('vIn').classList.toggle('open', li > 0.05);
  $('vEx').classList.toggle('open', le > 0.05);
  $('vSpark').hidden = !c.spark;

  $('roRpm').textContent = fmt(state.rpm);
  $('roTorque').textContent = fmt(Math.max(0, cyc.torque));
  $('roPower').textContent = fmt(Math.max(0, cyc.power / 1000), 1);
  $('roHp').textContent = `кВт · ${fmt(Math.max(0, cyc.power / 735.5))} л.с.`;
  $('roEff').textContent = `${fmt(cyc.etaE * 100)} %`;
  $('roPmax').textContent = fmt(cyc.pmax / 1e5, 0);
  $('roPmaxA').textContent = `бар · ${fmt(cyc.apmax - 360)}° после ВМТ`;
  $('roMap').textContent = fmt(cyc.pMan / 1000);
  $('roPs').textContent = fmt(cyc.pistonSpeed, 1);
  const kb = $('knockBox');
  kb.className = 'ro ' + (cyc.knock ? 'bad' : cyc.knockRisk > 0.6 ? 'warn' : 'ok');
  $('roKnock').textContent = cyc.knock ? 'есть!' : cyc.knockRisk > 0.6 ? 'риск' : 'нет';
  $('roTu').textContent = `смесь перед фронтом ${fmt(cyc.TuMax - 273)} °C`;

  const a = Math.round(c.alpha) % 720;
  $('live').textContent = `Ц${state.watch + 1}: p ${fmt(cyc.P[a] / 1e5, 1)} бар · T ${fmt(cyc.T[a] - 273)} °C · V ${fmt(cyc.V[a] * 1e6)} см³ · ход ${fmt(engine.d.crownTDC - c.crown, 1)} мм`;
  const th = wrap720(theta);
  $('angle').textContent = `${fmt(th)}° КВ`;
  const revSec = 60 / state.rpm / slowFactor();
  $('perRev').textContent = revSec >= 1 ? `1 оборот за ${fmt(revSec, 1)} с` : `${fmt(1 / revSec, revSec > 0.1 ? 1 : 0)} об/с на экране`;

  if (chartMode === 'pv') drawPV($('chart'), cyc, c.alpha, $('logScale').checked);
  else drawPA($('chart'), cyc, c.alpha, state.vvt);
  drawCycles($('cycles'), engine, state.watch);
}

if (window.innerWidth < 900) $('gauges').classList.add('collapsed');
if (window.innerWidth < 700) { state.labels = false; $('labelsOn').checked = false; }
// для проверки из консоли: lab.theta = 360 — поставить коленвал на угол
window.lab = { state, view, get theta() { return theta; }, set theta(v) { theta = v; } };
rebuild();
setCut('quarter');
requestAnimationFrame(frame);
