import * as THREE from 'three';
import { M, cutMat, tubeMat, beltTex, chainTex, clipState, onClipChange } from './materials.js';
import { TIMING, liftIn, liftEx, wrap720 } from './thermo.js';
import { addDetails } from './details.js';

// Схемы рядных двигателей: сдвиг цикла каждого цилиндра (° КВ) и порядок работы
export const LAYOUTS = {
  1: { offsets: [0], order: '1' },
  2: { offsets: [0, 360], order: '1-2' },
  3: { offsets: [0, 240, 480], order: '1-2-3' },
  4: { offsets: [0, 540, 180, 360], order: '1-3-4-2' },
  6: { offsets: [0, 480, 240, 600, 120, 360], order: '1-5-3-6-2-4' },
};

export const FLOOR_Y = -560; // мм, пол лаборатории относительно оси коленвала
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const plainGray = new THREE.MeshStandardMaterial({ color: 0x8a9098, roughness: 0.5, metalness: 0.2 });
const pistonPlain = new THREE.MeshStandardMaterial({ color: 0xd6d8da, metalness: 0.7, roughness: 0.33, side: THREE.DoubleSide });
const lateClip = [plainGray, pistonPlain];
const D2R = Math.PI / 180;

// ---------- размеры ----------
export function dims(p) {
  const B = p.bore, S = p.stroke, r = S / 2, n = p.cylinders;
  const L = p.rod || Math.round(1.62 * S);
  const R = B / 2;
  const pitch = B + 12;
  const ch = 0.34 * B;
  const pistonH = 0.72 * B;
  const crownTDC = r + L + ch;
  const deck = crownTDC + 0.6;
  const gasket = 1.4;
  const H0 = deck + gasket;
  const clearance = S / (p.cr - 1);
  const hd = Math.max(4, (clearance - (H0 - crownTDC)) / 0.5756);
  const tv = Math.min(24, Math.max(10, Math.atan(hd / R) / D2R)) * D2R;
  const Ls = 0.98 * B, R0 = 0.19 * B;
  const roof = (z) => H0 + hd * (1 - Math.abs(z) / R);
  const vIn = { z: -0.24 * B, xo: 0.19 * B, rh: 0.18 * B, axis: V3(0, Math.cos(tv), -Math.sin(tv)), lift: TIMING.liftIn };
  const vEx = { z: 0.25 * B, xo: 0.18 * B, rh: 0.155 * B, axis: V3(0, Math.cos(tv), Math.sin(tv)), lift: TIMING.liftEx };
  for (const v of [vIn, vEx]) {
    v.y = roof(v.z);
    v.seat = V3(0, v.y, v.z);
    v.cam = v.seat.clone().addScaledVector(v.axis, Ls + 12.5 + R0);
  }
  const H1 = Math.max(vIn.cam.y, vEx.cam.y);
  const Wh = 2 * Math.max(-vIn.cam.z, vEx.cam.z) + 2 * (R0 + 9.2 + 14);
  const Wb = B + 70;
  const Lb = (n - 1) * pitch + B + 50;
  const xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * pitch);
  const mainR = 0.29 * B, pinR = 0.235 * B, ppR = 0.125 * B;
  const Rcw = r + 0.26 * B;
  const yLiner0 = (L - r) + ch - pistonH - 6;
  const yLow = -(Math.max(Rcw, r + pinR + 8) + 10);
  const yPan = yLow - 85;
  const xFront = -Lb / 2, xRear = Lb / 2;
  const xBelt = xFront - 42;
  const coverH = R0 + 9.2 + 26;
  return { B, S, r, n, L, R, pitch, ch, pistonH, crownTDC, deck, H0, hd, tv, Ls, R0, roof, vIn, vEx, H1, Wh, Wb, Lb, xs,
    mainR, pinR, ppR, Rcw, yLiner0, yLow, yPan, xFront, xRear, xBelt, coverH, clearance };
}

// ---------- геометрические помощники ----------
function shoelace(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; } return a; }

// Тело вращения вокруг Y; профиль задаётся как [радиус, y], обход приводится к нужному направлению
function lathe(prof, seg = 48, phiStart = 0, phiLength = Math.PI * 2) {
  let pts = prof.map(([x, y]) => new THREE.Vector2(Math.max(0, x), y));
  if (shoelace(pts) < 0) pts = pts.reverse();
  return new THREE.LatheGeometry(pts, seg, phiStart, phiLength);
}

// Профиль в плоскости (z, y), выдавливание вдоль X (по центру)
function extrudeYZ(shape, depth, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 32 });
  g.rotateY(Math.PI / 2);
  g.translate(-depth / 2, 0, 0);
  return g;
}
// Профиль в плоскости (x, z), выдавливание вверх по Y от y0 до y1
function extrudeXZ(shape, y0, y1, bevel = 0) {
  const h = y1 - y0 - 2 * bevel;
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 36 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + bevel, 0);
  return g;
}
function roundRect(w, h, rad, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + rad, y);
  s.lineTo(x + w - rad, y); s.quadraticCurveTo(x + w, y, x + w, y + rad);
  s.lineTo(x + w, y + h - rad); s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  s.lineTo(x + rad, y + h); s.quadraticCurveTo(x, y + h, x, y + h - rad);
  s.lineTo(x, y + rad); s.quadraticCurveTo(x, y, x + rad, y);
  return s;
}
function circlePath(cx, cy, rad, hole = true) { const p = new THREE.Path(); p.absarc(cx, cy, rad, 0, Math.PI * 2, hole); return p; }
function gearShape(rRoot, rTip, teeth, holeR) {
  const s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, da = Math.PI * 2 / teeth;
    const pts = [[rRoot, a0], [rTip, a0 + da * 0.22], [rTip, a0 + da * 0.48], [rRoot, a0 + da * 0.7]];
    pts.forEach(([rr, a], k) => { const x = rr * Math.cos(a), y = rr * Math.sin(a); if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); });
  }
  s.closePath();
  if (holeR) s.holes.push(circlePath(0, 0, holeR));
  return s;
}
function cyl(r, len, axis = 'x', seg = 40, r2 = r) {
  const g = new THREE.CylinderGeometry(r2, r, len, seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}
function mesh(geo, mat, part, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = true;
  if (part) m.userData.part = part;
  return m;
}
function curve(pts) { return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3); }

// Путь с равномерной параметризацией по длине (для частиц газа)
class Path {
  constructor(points) {
    const c = curve(points);
    this.pts = c.getSpacedPoints(200);
    this.len = c.getLength();
  }
  at(t, out) { const f = Math.min(0.99999, Math.max(0, t)) * (this.pts.length - 1); const i = Math.floor(f); return out.copy(this.pts[i]).lerp(this.pts[i + 1], f - i); }
}

// ---------- шейдер газа в цилиндре ----------
const GAS_VERT = /* glsl */`
  #include <clipping_planes_pars_vertex>
  varying vec3 vPos;
  void main() {
    vPos = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    #include <clipping_planes_vertex>
    gl_Position = projectionMatrix * mvPosition;
  }`;
const GAS_FRAG = /* glsl */`
  #include <clipping_planes_pars_fragment>
  uniform float uFresh, uTemp, uFlameR, uBurning, uTime, uAlpha;
  uniform vec3 uSpark;
  varying vec3 vPos;
  float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
  vec3 fire(float t){ // 0 — тёмно-красный, 1 — бело-жёлтый
    return mix(mix(vec3(0.55,0.08,0.02), vec3(1.0,0.45,0.08), smoothstep(0.0,0.45,t)), vec3(1.0,0.92,0.65), smoothstep(0.45,1.0,t)); }
  void main() {
    #include <clipping_planes_fragment>
    float turb = n3(vPos * 0.09 + vec3(0.0, uTime * 0.7, uTime * 0.4)) * 0.6 + n3(vPos * 0.23 - uTime) * 0.4;
    float d = distance(vPos, uSpark) + (turb - 0.5) * 9.0;
    float burnt = 1.0 - uFresh;
    float flame = 0.0;
    if (uBurning > 0.5) { burnt = 1.0 - smoothstep(uFlameR - 4.0, uFlameR + 1.0, d); flame = exp(-pow((d - uFlameR) / 3.5, 2.0)); }
    float t = clamp((uTemp - 700.0) / 2000.0, 0.0, 1.0);
    vec3 freshC = mix(vec3(0.12, 0.5, 1.0), vec3(0.35, 0.85, 1.0), turb) * 1.25;
    vec3 hotC = fire(t * (0.75 + 0.35 * turb));
    vec3 exhC = mix(vec3(0.42, 0.36, 0.33), hotC, smoothstep(0.15, 0.6, t));
    vec3 burntC = uBurning > 0.5 ? hotC : exhC;
    vec3 col = mix(freshC, burntC, burnt) + flame * vec3(1.0, 0.85, 0.5) * 1.6;
    float a = mix(0.55, 0.62 + 0.33 * t, burnt) + flame * 0.5;
    gl_FragColor = vec4(col, clamp(a * uAlpha, 0.0, 0.95));
  }`;

const POINTS_VERT = /* glsl */`
  #include <clipping_planes_pars_vertex>
  attribute vec3 color; attribute float alpha;
  varying vec3 vColor; varying float vAlpha;
  uniform float uSize;
  void main() {
    vColor = color; vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    #include <clipping_planes_vertex>
    gl_PointSize = uSize / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }`;
const POINTS_FRAG = /* glsl */`
  #include <clipping_planes_pars_fragment>
  varying vec3 vColor; varying float vAlpha;
  void main() {
    #include <clipping_planes_fragment>
    vec2 q = gl_PointCoord - 0.5; float d = dot(q, q);
    if (d > 0.25) discard;
    gl_FragColor = vec4(vColor, vAlpha * (1.0 - d * 4.0));
  }`;

const shaderMats = [];
function clipShader(opts) {
  const m = new THREE.ShaderMaterial({ ...opts, clipping: true });
  m.clippingPlanes = clipState.planes; m.clipIntersection = clipState.intersection;
  shaderMats.push(m);
  return m;
}
onClipChange((planes, inter) => { for (const m of [...shaderMats, ...lateClip]) { m.clippingPlanes = planes; m.clipIntersection = inter; m.needsUpdate = true; } });

// =====================================================================
export class Engine {
  constructor(params) {
    this.p = { ...params };
    this.look = params.look || { block: 'alu', cover: 0xb3262c, coverRough: 0.5, label: ['DOHC', '', ''], intake: 'alu', timing: 'belt' };
    // цвета и фактура — под выбранный мотор
    M.cover.color.setHex(this.look.cover); M.cover.roughness = this.look.coverRough;
    const plastic = this.look.intake === 'plastic';
    M.plenum.color.setHex(plastic ? 0x24262a : 0x9ea4aa); M.plenum.metalness = plastic ? 0.05 : 0.7; M.plenum.roughness = plastic ? 0.7 : 0.38;
    M.intake.color.setHex(plastic ? 0x2a2c30 : 0xa3a9af); M.intake.metalness = plastic ? 0.05 : 0.7; M.intake.roughness = plastic ? 0.68 : 0.4;
    this.layout = LAYOUTS[params.cylinders];
    const d = this.d = dims(params);
    this.root = new THREE.Group();
    this.root.scale.setScalar(0.01);
    this.groups = {};
    for (const k of ['block', 'head', 'valvetrain', 'cover', 'crank', 'pistons', 'intake', 'exhaust', 'timing', 'pan', 'gas', 'flow', 'stand']) {
      this.groups[k] = new THREE.Group();
      this.root.add(this.groups[k]);
    }
    // куда разлетаются группы деталей при разборке (мм)
    this.explodeDir = {
      head: V3(0, 200, 0), valvetrain: V3(0, 200, 0), cover: V3(0, 430, 0), intake: V3(0, 160, -300),
      exhaust: V3(0, 160, 300), pan: V3(0, -380, 0), crank: V3(0, -210, 0), timing: V3(-230, 60, 0),
    };
    this.pistonLift = 0; this.rodLift = 0;
    this.cyl = [];
    this.anchors = [];
    this.buildBlock(); this.buildCrank(); this.buildPistons(); this.buildHead(); this.buildValvetrain();
    this.buildCover(); this.buildIntake(); this.buildExhaust(); this.buildTiming(); this.buildPan(); this.buildAccessories(); this.buildGas(); this.buildStand();
    this.details = addDetails(this);
    this.sparkLights = [0, 1].map(() => { const l = new THREE.PointLight(0xffa040, 0, 3.2, 1.6); this.root.add(l); return l; });
  }

  add(group, m) { this.groups[group].add(m); return m; }

  // ---------------- блок цилиндров ----------------
  buildBlock() {
    const d = this.d, { B, R, Lb, Wb, xs, pitch } = d;
    const bm = this.look.block === 'iron' ? M.blockIron : M.aluminum;
    const jacketLen = (d.n - 1) * pitch + B + 22, jacketW = B + 22;
    // верх блока с рубашкой
    const top = roundRect(Lb, Wb, 14);
    top.holes.push(holeFrom(roundRect(jacketLen, jacketW, 30)));
    this.add('block', mesh(extrudeXZ(top, d.yLiner0 + 12, d.deck), bm, 'block'));
    // дно рубашки
    const floor = roundRect(Lb, Wb, 14);
    xs.forEach((x) => floor.holes.push(circlePath(x, 0, R + 4)));
    this.add('block', mesh(extrudeXZ(floor, d.yLiner0, d.yLiner0 + 12), bm, 'block'));
    // картер
    const cc = roundRect(Lb, Wb, 14);
    cc.holes.push(holeFrom(roundRect(Lb - 24, Wb - 20, 10)));
    this.add('block', mesh(extrudeXZ(cc, d.yLow, d.yLiner0), bm, 'block'));
    // рёбра жёсткости снаружи картера
    for (const x of xs) for (const s of [-1, 1]) {
      const rib = mesh(new THREE.BoxGeometry(8, d.yLiner0 - d.yLow + 20, 8), bm, 'block');
      rib.position.set(x, (d.yLiner0 + d.yLow) / 2 + 10, s * (Wb / 2 + 3));
      this.add('block', rib);
    }
    // гильзы
    xs.forEach((x) => {
      const liner = mesh(lathe([[R, d.yLiner0 - 6], [R + 4, d.yLiner0 - 6], [R + 4, d.deck], [R, d.deck]], 56), M.iron, 'liner');
      liner.position.x = x;
      this.add('block', liner);
    });
    // антифриз
    const cool = roundRect(jacketLen - 2, jacketW - 2, 29);
    xs.forEach((x) => cool.holes.push(circlePath(x, 0, R + 4.2)));
    const coolant = mesh(extrudeXZ(cool, d.yLiner0 + 13, d.deck - 3), M.coolant, 'coolant', false);
    coolant.renderOrder = 2;
    this.add('block', coolant);
    // опоры коренных шеек
    for (let j = 0; j <= d.n; j++) {
      const x = xs[0] - pitch / 2 + j * pitch;
      const s = new THREE.Shape();
      const w = Wb / 2 - 10;
      s.moveTo(-w, d.yLow); s.lineTo(w, d.yLow); s.lineTo(w, d.yLiner0 + 2); s.lineTo(-w, d.yLiner0 + 2); s.closePath();
      s.holes.push(circlePath(0, 0, d.mainR + 2.5));
      const bh = mesh(extrudeYZ(s, 17), bm, 'bulkhead');
      bh.position.x = x;
      this.add('block', bh);
      for (const z of [-1, 1]) {
        const bolt = mesh(cyl(4.5, 70, 'y', 12), M.steel, 'bulkhead');
        bolt.position.set(x, d.yLow + 30, z * (d.mainR + 13));
        this.add('block', bolt);
      }
    }
    // прокладка ГБЦ
    const gs = roundRect(Lb, Wb, 14);
    xs.forEach((x) => gs.holes.push(circlePath(x, 0, R + 1.2)));
    this.add('head', mesh(extrudeXZ(gs, d.deck, d.H0), M.gasket, 'gasket'));
    this.anchors.push({ key: 'block', pos: V3(xs[0] - 10, d.deck - 70, Wb / 2 + 5) });
  }

  // ---------------- коленчатый вал ----------------
  buildCrank() {
    const d = this.d, { xs, r, B, mainR, pinR, Rcw, pitch } = d;
    const g = this.crank = new THREE.Group();
    this.groups.crank.add(g);
    const seg = (x0, x1, rad, mat = M.steel, part = 'crank') => {
      const m = mesh(cyl(rad, x1 - x0, 'x', 48), mat, part); m.position.x = (x0 + x1) / 2; g.add(m); return m;
    };
    const pinW = 11, webW = 16;
    // коренные шейки
    const front = d.xFront - 72, rear = d.xRear + 14;
    seg(front, xs[0] - pinW - webW + 1, mainR);
    for (let i = 0; i < d.n - 1; i++) seg(xs[i] + pinW + webW - 1, xs[i + 1] - pinW - webW + 1, mainR);
    seg(xs[d.n - 1] + pinW + webW - 1, rear, mainR);
    seg(front - 10, d.xFront - 40, 0.2 * B); // носок
    seg(d.xRear + 6, d.xRear + 20, 0.5 * B, M.forged); // фланец маховика
    // щёки, противовесы и шатунные шейки
    const rw = pinR + 8, del = 0.5;
    const web = new THREE.Shape();
    web.moveTo(rw * Math.cos(0.35), r + rw * Math.sin(0.35));
    web.absarc(0, r, rw, 0.35, Math.PI - 0.35, false);
    web.lineTo(-Rcw * Math.cos(del), -Rcw * Math.sin(del));
    web.absarc(0, 0, Rcw, Math.PI + del, 2 * Math.PI - del, false);
    web.closePath();
    const webGeo = extrudeYZ(web, webW, 1.2);
    this.layout.offsets.forEach((off, i) => {
      const t = new THREE.Group();
      t.rotation.x = -off * D2R;
      t.position.x = xs[i];
      const pin = mesh(cyl(pinR, 2 * pinW + 2, 'x', 40), M.steel, 'crank'); pin.position.y = r; t.add(pin);
      for (const s of [-1, 1]) { const w = mesh(webGeo, M.forged, 'crank'); w.position.x = s * (pinW + webW / 2); t.add(w); }
      g.add(t);
    });
    // шкив-демпфер спереди
    const dmp = mesh(lathe([[0.2 * B + 2, -10], [0.78 * B, -10], [0.78 * B, -6], [0.74 * B, -4], [0.78 * B, -2], [0.74 * B, 0], [0.78 * B, 2], [0.74 * B, 4], [0.78 * B, 6], [0.78 * B, 10], [0.2 * B + 2, 10]], 64), M.pulley, 'damper');
    dmp.rotation.z = Math.PI / 2; dmp.position.x = d.xBelt - 30;
    g.add(dmp);
    // маховик сзади
    const rf = 1.45 * B;
    const fw = mesh(extrudeYZ(gearShape(rf - 3, rf + 2.5, 112, 0), 14), M.flywheel, 'flywheel');
    fw.position.x = d.xRear + 28;
    g.add(fw);
    const fwDisc = mesh(lathe([[0, -9], [rf - 3, -9], [rf - 3, 9], [0, 9]], 72), M.flywheel, 'flywheel');
    fwDisc.rotation.z = Math.PI / 2; fwDisc.position.x = d.xRear + 26;
    g.add(fwDisc);
    for (let k = 0; k < 6; k++) {
      const b = mesh(cyl(4, 6, 'x', 10), M.steel, 'flywheel');
      const a = k * Math.PI / 3;
      b.position.set(d.xRear + 37, 0.42 * B * Math.cos(a), 0.42 * B * Math.sin(a));
      g.add(b);
    }
    this.anchors.push({ key: 'crank', pos: V3(xs[0] - pitch / 2, -mainR - 4, 0) }, { key: 'flywheel', pos: V3(d.xRear + 30, rf * 0.7, rf * 0.7) });
  }

  // ---------------- поршни и шатуны ----------------
  buildPistons() {
    const d = this.d, { B, R, ch, pistonH, ppR, pinR, L } = d;
    const Rp = R - 0.3, yt = ch, yb = ch - pistonH;
    // головка поршня (днище и кольцевые канавки) — по кругу, ниже — только юбки на опорных сторонах,
    // а по бокам видны приливы под палец, как у настоящего поршня
    const yl = yt - 20;
    const crownGeo = lathe([
      [0, yt - 9], [Rp - 9, yt - 9], [Rp - 4.5, yt - 15], [Rp - 4.5, yl], [Rp, yl],
      [Rp, yt - 17.5], [Rp - 3, yt - 17.5], [Rp - 3, yt - 14], [Rp, yt - 14], [Rp, yt - 11.1], [Rp - 2.2, yt - 11.1],
      [Rp - 2.2, yt - 9.5], [Rp, yt - 9.5], [Rp, yt - 6.6], [Rp - 2.2, yt - 6.6], [Rp - 2.2, yt - 5], [Rp, yt - 5],
      [Rp, yt - 2], [Rp - 2.5, yt], [Rp * 0.55, yt + 0.6], [0, yt + 0.9]], 72);
    const skirtProf = [[Rp - 4, yl], [Rp, yl], [Rp - 0.12, yb + 5], [Rp - 1, yb], [Rp - 4, yb]];
    const skirts = [lathe(skirtProf, 28, -1.05, 2.1), lathe(skirtProf, 28, Math.PI - 1.05, 2.1)];
    const bossGeo = cyl(ppR + 6, 2 * (Rp - 3.5), 'x', 28);
    const ringGeo = (y0, y1, depth) => lathe([[R - depth, y0], [R - 0.05, y0], [R - 0.05, y1], [R - depth, y1]], 64);
    const rings = [ringGeo(yt - 6.5, yt - 5.1, 2.1), ringGeo(yt - 11, yt - 9.6, 2.1), ringGeo(yt - 17.4, yt - 14.1, 2.9)];
    // шатун: двутавр
    const rB = pinR + 8, rS = ppR + 5.5;
    const a1 = 0.32, a2 = 0.6;
    const outline = new THREE.Shape();
    outline.moveTo(rB * Math.cos(a1), rB * Math.sin(a1));
    outline.lineTo(0.14 * B, 0.45 * L);
    outline.lineTo(rS * Math.cos(-a2), L + rS * Math.sin(-a2));
    outline.absarc(0, L, rS, -a2, Math.PI + a2, false);
    outline.lineTo(-0.14 * B, 0.45 * L);
    outline.lineTo(-rB * Math.cos(a1), rB * Math.sin(a1));
    outline.absarc(0, 0, rB, Math.PI - a1, 2 * Math.PI + a1, false);
    const body = outline.clone();
    body.holes.push(circlePath(0, 0, pinR + 0.3), circlePath(0, L, ppR + 0.3));
    const slot = new THREE.Shape();
    const sy0 = rB + 5, sy1 = L - rS - 4;
    slot.moveTo(0.42 * rB, sy0); slot.lineTo(0.14 * B - 4.5, 0.45 * L); slot.lineTo(rS * 0.8 - 4, sy1);
    slot.lineTo(-(rS * 0.8 - 4), sy1); slot.lineTo(-(0.14 * B - 4.5), 0.45 * L); slot.lineTo(-0.42 * rB, sy0); slot.closePath();
    const bodyFull = body.clone(); bodyFull.holes.push(holeFrom(slot));
    const rodGeo = extrudeYZ(bodyFull, 20, 0.8);
    const webGeo = extrudeYZ(slot, 7);
    const capGeo = cyl(3.6, 26, 'y', 12);

    this.layout.offsets.forEach((off, i) => {
      const x = d.xs[i];
      const pg = new THREE.Group();
      pg.position.x = x;
      pg.add(mesh(crownGeo, M.piston, 'piston'));
      for (const sk of skirts) pg.add(mesh(sk, pistonPlain, 'piston'));
      pg.add(mesh(bossGeo, M.piston, 'piston'));
      for (const sx of [-1, 1]) { const pe = mesh(cyl(ppR, 1.2, 'x', 24), M.steel, 'pin'); pe.position.x = sx * (Rp - 3.4); pg.add(pe); const clip = mesh(new THREE.TorusGeometry(ppR + 1.2, 0.7, 6, 24), M.steel, 'pin'); clip.rotation.y = Math.PI / 2; clip.position.x = sx * (Rp - 3.2); pg.add(clip); }
      for (const sx of [-1, 1]) { const web = mesh(new THREE.BoxGeometry(5, yt - 9 - (ppR + 2), 2 * (ppR + 6)), M.piston, 'piston'); web.position.set(sx * (Rp - 8), (yt - 9 + ppR + 2) / 2, 0); pg.add(web); }
      for (const rg of rings) pg.add(mesh(rg, M.ring, 'rings'));
      const wp = mesh(lathe([[ppR * 0.55, -0.4 * B], [ppR, -0.4 * B], [ppR, 0.4 * B], [ppR * 0.55, 0.4 * B]], 32), M.steel, 'pin');
      wp.rotation.z = Math.PI / 2; pg.add(wp);
      this.groups.pistons.add(pg);
      const rg = new THREE.Group();
      rg.position.x = x;
      rg.add(mesh(rodGeo, M.forged, 'rod'), mesh(webGeo, M.forged, 'rod'));
      for (const s of [-1, 1]) { const b = mesh(capGeo, M.steel, 'rod'); b.position.set(0, -2, s * (pinR + 4.2)); rg.add(b); }
      this.groups.pistons.add(rg);
      this.cyl[i] = { x, off, piston: pg, rod: rg };
    });
    this.anchors.push({ key: 'piston', pos: V3(d.xs[0], d.crownTDC - 20, R) }, { key: 'rod', pos: V3(d.xs[0], d.L * 0.5, 0) });
  }

  // ---------------- головка блока ----------------
  // Головка собрана как настоящая отливка: стенки, камеры сгорания, каналы с толстыми
  // стенками, колодцы толкателей, направляющие, свечные колодцы, рубашка, постели валов.
  // Каждая часть — замкнутое тело, поэтому в разрезе видны стенки и пустоты.
  buildHead() {
    const d = this.d, { Lb, Wh, H0, H1, xs, B, R, vIn, vEx, R0, hd } = d;
    const tW = 7;                       // толщина наружных стенок
    const yDeck = H0 + hd + 14;         // верх плиты с камерами сгорания
    const add = (geo, mat = M.head, part = 'head') => this.add('head', mesh(geo, mat, part));
    const roofDeform = (geo, xc) => {
      const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) if (Math.abs(p.getY(k) - H0) < 0.01) {
        const z = p.getZ(k), x = p.getX(k) - xc;
        if (Math.hypot(x, z) <= R + 0.01) p.setY(k, H0 + hd * (1 - Math.min(1, Math.abs(z) / R)));
      }
      p.needsUpdate = true; geo.computeVertexNormals();
      return geo;
    };
    // каналы: сначала считаем путь, по нему же пойдут частицы и стрелки
    const rIn = 0.165 * B, rInB = 0.12 * B, rEx = 0.14 * B, rExB = 0.11 * B, wall = 4.5;
    const yPin = H0 + 62, yPex = H0 + 50;
    this.ports = xs.map((x) => {
      const split = V3(x, vIn.y + 34, vIn.z - 20), merge = V3(x, vEx.y + 34, vEx.z + 20);
      const inMain = [V3(x, yPin + 1, -Wh / 2 - 1), V3(x, H0 + 56, -Wh / 2 + 22), split];
      const exMain = [merge, V3(x, yPex, Wh / 2 - 22), V3(x, yPex, Wh / 2 + 1)];
      const throat = (v, s) => V3(x + s * v.xo, v.y, v.z).addScaledVector(v.axis, 5);
      const inBr = [-1, 1].map((s) => [split, V3(x + s * vIn.xo * 0.7, vIn.y + 20, vIn.z - 12), throat(vIn, s)]);
      const exBr = [-1, 1].map((s) => [throat(vEx, s), V3(x + s * vEx.xo * 0.7, vEx.y + 20, vEx.z + 12), merge]);
      return { inMain, exMain, inBr, exBr };
    });

    // плита с камерами сгорания (между цилиндрами и по краям)
    const deck = roundRect(Lb, Wh, 16);
    xs.forEach((x) => deck.holes.push(circlePath(x, 0, R)));
    add(extrudeXZ(deck, H0, yDeck));
    // свод каждой камеры: шатёр с отверстиями клапанов и свечи
    xs.forEach((x) => {
      const sh = new THREE.Shape(); sh.absarc(x, 0, R, 0, Math.PI * 2, false);
      for (const v of [vIn, vEx]) for (const s of [-1, 1]) sh.holes.push(circlePath(x + s * v.xo, -v.z, v.rh + 0.4));
      sh.holes.push(circlePath(x, 0, 7.4));
      add(roofDeform(extrudeXZ(sh, H0, yDeck), x));
    });
    // наружные стенки с окнами каналов
    const sideWall = (zFace, yPort, rHole) => {
      const shp = new THREE.Shape(); shp.moveTo(-Lb / 2 + 8, H0); shp.lineTo(Lb / 2 - 8, H0); shp.lineTo(Lb / 2 - 8, H1); shp.lineTo(-Lb / 2 + 8, H1); shp.closePath();
      xs.forEach((x) => shp.holes.push(circlePath(x, yPort, rHole)));
      const g = new THREE.ExtrudeGeometry(shp, { depth: tW, bevelEnabled: false, curveSegments: 32 });
      g.translate(0, 0, zFace < 0 ? zFace : zFace - tW);
      return g;
    };
    add(sideWall(-Wh / 2, yPin, rIn + wall + 0.5));
    add(sideWall(Wh / 2, yPex, rEx + wall + 0.5));
    for (const sx of [-1, 1]) {
      const ew = new THREE.Shape(); const w = Wh / 2 - tW, top = Math.min(vIn.cam.y, vEx.cam.y) - 0.17 * B;
      ew.moveTo(-w, H0); ew.lineTo(w, H0); ew.lineTo(w, top); ew.lineTo(-w, top); ew.closePath();
      const m = mesh(extrudeYZ(ew, 10), M.head, 'head'); m.position.x = sx * (Lb / 2 - 5); this.add('head', m);
    }
    // фланцы каналов снаружи
    const ring = (x, y, z0, z1, r0, r1) => {
      const sh = new THREE.Shape(); sh.absarc(x, y, r1, 0, Math.PI * 2, false); sh.holes.push(circlePath(x, y, r0));
      const g = new THREE.ExtrudeGeometry(sh, { depth: Math.abs(z1 - z0), bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 2, curveSegments: 32 });
      g.translate(0, 0, Math.min(z0, z1)); return g;
    };
    xs.forEach((x) => { add(ring(x, yPin, -Wh / 2 - 7, -Wh / 2, rIn + 0.5, rIn + 12)); add(ring(x, yPex, Wh / 2, Wh / 2 + 7, rEx + 0.5, rEx + 12)); });
    // каналы с толстыми стенками
    this.ports.forEach((pt) => {
      add(thickTube(curve(pt.inMain), rIn, wall, 40, 24));
      add(thickTube(curve(pt.exMain), rEx, wall, 40, 24));
      for (const b of pt.inBr) add(thickTube(curve(b), rInB, wall - 1, 24, 20));
      for (const b of pt.exBr) add(thickTube(curve(b), rExB, wall - 1, 24, 20));
    });
    // свечные колодцы
    // свечной колодец заканчивается у верхней плоскости головки, дальше — уплотнение крышки
    xs.forEach((x) => { const t = mesh(lathe([[11, yDeck - 2], [15.5, yDeck - 2], [15.5, H1 + 4], [11, H1 + 4]], 32), M.head, 'head'); t.position.x = x; this.add('head', t); const sl = mesh(lathe([[11, H1 + 4], [16.5, H1 + 4], [16.5, H1 + 10], [11, H1 + 10]], 32), M.rubber, 'cover'); sl.position.x = x; this.add('cover', sl); });
    // рубашка охлаждения головки
    const wj = roundRect(Lb - 2 * tW - 6, Wh - 2 * tW - 6, 10);
    xs.forEach((x) => wj.holes.push(circlePath(x, 0, 16)));
    const cool = mesh(extrudeXZ(wj, yDeck + 1, yDeck + 15), M.coolant, 'coolant', false); cool.renderOrder = 2; this.add('head', cool);
    // постели распредвалов: перегородки с полукруглыми вырезами и крышки
    const jr = 0.155 * B + 0.6;
    for (let j = 0; j <= d.n; j++) {
      const x = xs[0] - d.pitch / 2 + j * d.pitch;
      // опоры шеек: узкие «башенки» от стенки к свечному колодцу, а не сплошная стена
      for (const v of [vIn, vEx]) {
        const sgn = Math.sign(v.cam.z), zo = sgn * (Wh / 2 - tW), zi = sgn * 15, y0 = v.cam.y - jr - 16;
        const b = new THREE.Shape();
        b.moveTo(Math.min(zo, zi), y0); b.lineTo(Math.max(zo, zi), y0); b.lineTo(Math.max(zo, zi), v.cam.y);
        b.lineTo(v.cam.z + jr, v.cam.y); b.absarc(v.cam.z, v.cam.y, jr, 0, Math.PI, true);
        b.lineTo(Math.min(zo, zi), v.cam.y); b.closePath();
        const bh = mesh(extrudeYZ(b, 14, 0.6), M.head, 'head'); bh.position.x = x; this.add('head', bh);
      }
      for (const v of [vIn, vEx]) {
        const cw = jr + 10, c = new THREE.Shape();
        c.moveTo(v.cam.z - cw, v.cam.y); c.lineTo(v.cam.z - jr, v.cam.y); c.absarc(v.cam.z, v.cam.y, jr, Math.PI, 0, true);
        c.lineTo(v.cam.z + cw, v.cam.y); c.lineTo(v.cam.z + cw, v.cam.y + jr + 6); c.lineTo(v.cam.z - cw, v.cam.y + jr + 6); c.closePath();
        const cap = mesh(extrudeYZ(c, 14, 0.8), M.head, 'head'); cap.position.x = x; this.add('head', cap);
        for (const s2 of [-1, 1]) {
          const bolt = mesh(new THREE.CylinderGeometry(4.6, 4.6, 5, 6), M.steel, 'head'); bolt.position.set(x, v.cam.y + jr + 8.5, v.cam.z + s2 * (jr + 5)); this.add('head', bolt);
        }
      }
      // болты головки блока с бобышками
      for (const s2 of [-1, 1]) {
        const z = s2 * (Wh / 2 - 22), yb = yDeck + 18;
        const boss = mesh(cyl(9, yb - yDeck, 'y', 20), M.head, 'head'); boss.position.set(x, (yb + yDeck) / 2, z); this.add('head', boss);
        const hb = mesh(new THREE.CylinderGeometry(7.5, 7.5, 7, 12), M.steel, 'head'); hb.position.set(x, yb + 3.5, z); this.add('head', hb);
        const wsh = mesh(cyl(10, 1.6, 'y', 20), M.steel, 'head'); wsh.position.set(x, yb + 0.8, z); this.add('head', wsh);
      }
    }
    // свечи зажигания
    this.plugs = [];
    xs.forEach((x) => {
      const tip = H0 + hd - 1.5;
      const g = new THREE.Group();
      g.position.set(x, tip, 0);
      g.add(mesh(cyl(1.1, 3, 'y', 8), M.steel, 'plug'));
      const ground = mesh(new THREE.BoxGeometry(2, 4, 2), M.steel, 'plug'); ground.position.set(0, -1.5, 3.2); g.add(ground);
      g.add(mesh(lathe([[0, 1.5], [6.3, 1.5], [7, 4], [6.3, 6], [7, 8], [6.3, 10], [7, 12], [6.3, 14], [7, 16], [6.3, 18.5], [0, 18.5]], 24), M.steel, 'plug'));
      const hex = mesh(new THREE.CylinderGeometry(10.2, 10.2, 12, 6), M.steel, 'plug'); hex.position.y = 24; g.add(hex);
      g.add(mesh(lathe([[0, 30], [6.8, 30], [6.8, 48], [6.0, 50], [6.8, 52], [6.0, 54], [6.8, 56], [5.2, 58], [5.2, 72], [3, 72], [3, 76], [0, 76]], 24), M.ceramic, 'plug'));
      g.userData.baseY = g.position.y;
      this.add('head', g);
      this.plugs.push(g);
    });
    this.anchors.push({ key: 'head', pos: V3(xs[d.n - 1] + 10, H0 + 40, -Wh / 2) });
  }

  // ---------------- газораспределительный механизм ----------------
  buildValvetrain() {
    const d = this.d, { B, R0, Ls, xs, vIn, vEx } = d;
    this.valves = [];
    const mkValve = (v) => {
      const rh = v.rh, rs = 0.035 * B;
      return lathe([[0, 0], [rh, 0], [rh, 1.4], [rh * 0.92, 2.6], [rh * 0.62, 5], [rh * 0.36, 8.5], [rs * 1.5, 13], [rs, 18],
        [rs, Ls - 7], [rs * 0.82, Ls - 6], [rs * 0.82, Ls - 4], [rs, Ls - 3.5], [rs, Ls], [0, Ls]], 36);
    };
    const springBase = Ls * 0.48, springTop0 = Ls - 9;
    const helix = new THREE.Curve();
    const coils = 6.5, sr = 0.125 * B;
    const sh = springTop0 - springBase;
    helix.getPoint = (t, out = new THREE.Vector3()) => out.set(sr * Math.cos(t * coils * 2 * Math.PI), t * sh, sr * Math.sin(t * coils * 2 * Math.PI));
    const springGeo = new THREE.TubeGeometry(helix, 220, 1.7, 8, false);
    const springMat = new THREE.MeshStandardMaterial({ color: 0x34383d, metalness: 0.75, roughness: 0.34, side: THREE.DoubleSide });
    springMat.clippingPlanes = clipState.planes;
    this.springMat = springMat;
    const bucketGeo = lathe([[0, Ls + 12.5], [0.165 * B, Ls + 12.5], [0.165 * B, Ls + 0.5 - 14], [0.165 * B - 1.6, Ls + 0.5 - 14], [0.165 * B - 1.6, Ls + 10], [0, Ls + 10]], 36);
    const retGeo = lathe([[0, Ls - 9], [0.14 * B, Ls - 9], [0.08 * B, Ls - 3], [0, Ls - 3]], 24);
    const valveGeo = { in: mkValve(vIn), ex: mkValve(vEx) };
    const up = V3(0, 1, 0);
    // неподвижные части в головке: колодец толкателя, направляющая втулка, колпачок, шайба, седло
    const rb = 0.165 * B, rs = 0.035 * B;
    const boreGeo = lathe([[rb + 0.6, springBase - 3], [rb + 5.5, springBase - 3], [rb + 5.5, Ls + 6], [rb + 0.6, Ls + 6]], 36);
    const guideGeo = lathe([[rs + 0.25, 16], [rs + 3.6, 16], [rs + 3.6, springBase - 1], [rs + 0.25, springBase - 1]], 20);
    const sealGeo = lathe([[rs + 0.2, springBase - 1], [rs + 5.2, springBase - 1], [rs + 4.4, springBase + 5], [rs + 0.2, springBase + 5]], 20);
    const washerGeo = lathe([[rs + 5.4, springBase - 1.2], [0.125 * B + 3, springBase - 1.2], [0.125 * B + 3, springBase], [rs + 5.4, springBase]], 32);
    const seatGeo = (v) => lathe([[v.rh - 1.4, -0.6], [v.rh + 1.8, -0.6], [v.rh + 1.8, 3], [v.rh - 0.6, 3]], 36);
    const seatMat = M.iron, guideMat = cutMat({ color: 0x9c7b4f, metalness: 0.85, roughness: 0.42 }, 0xe8c07a);
    xs.forEach((x, i) => {
      for (const [v, type] of [[vIn, 'in'], [vEx, 'ex']]) {
        for (const s of [-1, 1]) {
          const frame = new THREE.Group();
          frame.position.set(x + s * v.xo, v.y, v.z);
          frame.quaternion.setFromUnitVectors(up, v.axis);
          const moving = new THREE.Group();
          moving.add(mesh(valveGeo[type], type === 'in' ? M.valve : M.valveEx, type === 'in' ? 'valveIn' : 'valveEx'));
          moving.add(mesh(retGeo, M.steel, 'spring'), mesh(bucketGeo, M.bucket, 'bucket'));
          frame.add(moving);
          frame.add(mesh(boreGeo, M.head, 'head'), mesh(guideGeo, guideMat, 'valveGuide'), mesh(sealGeo, M.rubber, 'valveSeal'), mesh(washerGeo, M.steel, 'spring'), mesh(seatGeo(v), seatMat, 'valveSeat'));
          const sp = mesh(springGeo, springMat, 'spring');
          sp.position.y = springBase;
          frame.add(sp);
          this.groups.valvetrain.add(frame);
          frame.userData.base = frame.position.clone(); frame.userData.axis = v.axis;
          this.valves.push({ cyl: i, type, frame, moving, spring: sp, springBase, springTop0 });
        }
      }
    });
    // распредвалы с кулачками, построенными из того же закона подъёма
    const camLen0 = d.xBelt + 8, camLen1 = d.xRear - 14;
    this.cams = {};
    for (const [v, type] of [[vIn, 'in'], [vEx, 'ex']]) {
      const cg = new THREE.Group();
      cg.position.set(0, v.cam.y, v.cam.z);
      const shaft = mesh(cyl(0.12 * B, camLen1 - camLen0, 'x', 32), M.steel, type === 'in' ? 'camIn' : 'camEx');
      shaft.position.x = (camLen0 + camLen1) / 2; cg.add(shaft);
      for (let j = 0; j <= d.n; j++) {
        const jx = xs[0] - d.pitch / 2 + j * d.pitch;
        const jr = mesh(cyl(0.155 * B, 14, 'x', 32), M.steel, type === 'in' ? 'camIn' : 'camEx'); jr.position.x = jx; cg.add(jr);
      }
      const psiF = type === 'in' ? Math.PI - d.tv : -(Math.PI - d.tv);
      xs.forEach((x, i) => {
        const off = this.layout.offsets[i];
        const sh = new THREE.Shape();
        const N = 180;
        for (let k = 0; k <= N; k++) {
          const psi = (k / N) * Math.PI * 2;
          const alpha = 2 * (psiF - psi) / D2R - off;
          const lift = type === 'in' ? liftIn(alpha, 0) : liftEx(alpha);
          const rho = R0 + lift;
          const yy = rho * Math.cos(psi), zz = rho * Math.sin(psi);
          if (k === 0) sh.moveTo(-zz, yy); else sh.lineTo(-zz, yy);
        }
        const lg = extrudeYZ(sh, 13, 0.6);
        for (const s of [-1, 1]) { const lobe = mesh(lg, M.steel, type === 'in' ? 'camIn' : 'camEx'); lobe.position.x = x + s * v.xo; cg.add(lobe); }
      });
      cg.userData.baseY = cg.position.y;
      this.groups.valvetrain.add(cg);
      this.cams[type] = cg;
    }
    this.anchors.push({ key: 'camIn', pos: V3(xs[0] + d.pitch / 2, vIn.cam.y + 14, vIn.cam.z) }, { key: 'camEx', pos: V3(xs[0] + d.pitch / 2, vEx.cam.y + 14, vEx.cam.z) },
      { key: 'valveIn', pos: V3(xs[0] - vIn.xo, vIn.y + 30, vIn.z - 12) }, { key: 'spring', pos: V3(xs[0] + vEx.xo, vEx.y + Ls * 0.7, vEx.z + 22) });
  }

  buildCover() {
    const d = this.d, top = d.H1 + 2 + d.coverH;
    // полая крышка: стенки 5 мм и верхняя панель с окнами под катушки
    const outer = () => roundRect(d.Lb - 12, d.Wh - 14, 26);
    const walls = outer(); walls.holes.push(holeFrom(roundRect(d.Lb - 22, d.Wh - 24, 21)));
    this.add('cover', mesh(extrudeXZ(walls, d.H1 + 2, top - 6), M.cover, 'cover'));
    const lid = outer(); d.xs.forEach((x) => lid.holes.push(circlePath(x, 0, 16.5)));
    this.add('cover', mesh(extrudeXZ(lid, top - 10, top, 4), M.cover, 'cover'));
    // маслоотражатель внутри
    const baffle = mesh(new THREE.BoxGeometry(d.Lb - 40, 3, d.Wh * 0.3), M.cover, 'cover'); baffle.position.set(0, top - 16, -d.Wh * 0.25); this.add('cover', baffle);
    // фланец и резиновая прокладка
    this.add('cover', mesh(extrudeXZ(roundRect(d.Lb - 6, d.Wh - 8, 26), d.H1, d.H1 + 5), M.aluminum, 'cover'));
    this.add('cover', mesh(extrudeXZ((() => { const g = roundRect(d.Lb - 10, d.Wh - 12, 24); g.holes.push(holeFrom(roundRect(d.Lb - 20, d.Wh - 22, 20))); return g; })(), d.H1 + 5, d.H1 + 7), M.rubber, 'cover'));
    // катушки «карандашного» типа: наконечник на свече, корпус в колодце, разъём сверху
    const plugTop = d.H0 + d.hd + 72;
    const coilGeo = lathe([[0, plugTop], [8.6, plugTop], [8.6, plugTop + 26], [10.6, plugTop + 30], [10.6, top + 2], [12.5, top + 4], [12.5, top + 8], [0, top + 8]], 28);
    d.xs.forEach((x) => {
      const body = mesh(coilGeo, M.coil, 'coil'); body.position.x = x; this.add('cover', body);
      const boot = mesh(lathe([[0, plugTop - 2], [9.6, plugTop - 2], [9.6, plugTop + 24], [0, plugTop + 24]], 24), M.rubber, 'coil'); boot.position.x = x; this.add('cover', boot);
      const head = mesh(extrudeXZ(roundRect(30, 44, 8), top + 6, top + 26, 3), M.coil, 'coil'); head.position.set(x, 0, 4); this.add('cover', head);
      const conn = mesh(new THREE.BoxGeometry(16, 13, 16), M.coil, 'coil'); conn.position.set(x, top + 18, 33); this.add('cover', conn);
      const latch = mesh(new THREE.BoxGeometry(10, 3, 8), plainGray, 'coil'); latch.position.set(x, top + 25, 33); this.add('cover', latch);
      const bolt = mesh(new THREE.CylinderGeometry(4, 4, 5, 6), M.steel, 'coil'); bolt.position.set(x + 11, top + 28, -12); this.add('cover', bolt);
    });
    const cap = mesh(lathe([[0, top - 2], [19, top - 2], [19, top + 10], [16, top + 14], [0, top + 14]], 32), M.coil, 'cover');
    cap.position.set(d.xs[0] - d.pitch * 0.5 + 10, 0, -d.Wh * 0.22);
    this.add('cover', cap);
    this.anchors.push({ key: 'cover', pos: V3(d.xs[d.n - 1], top + 4, -d.Wh * 0.3) }, { key: 'coil', pos: V3(d.xs[0], top + 24, 4) });
  }

  // ---------------- впуск ----------------
  buildIntake() {
    const d = this.d, { B, Wh, H0, xs, vIn } = d;
    const zP = -(Wh / 2 + 95), yP = H0 + 28, rP = 40;
    const pa = d.Lb / 2 - 30, pb = d.Lb / 2 - 48, t = 4;
    // ресивер — полый, со стенкой 4 мм
    const plen = mesh(lathe([[0, -pa], [rP * 0.6, -pa], [rP, -pb], [rP, pb], [rP * 0.6, pa], [0, pa], [0, pa - t], [rP * 0.6 - t, pa - t], [rP - t, pb], [rP - t, -pb], [rP * 0.6 - t, -pa + t], [0, -pa + t]], 48), M.plenum, 'intake');
    plen.rotation.z = Math.PI / 2; plen.position.set(0, yP, zP);
    this.add('intake', plen);
    // дроссельный узел
    const tbX = (d.Lb / 2 - 30) + 30; // дроссель сзади, подальше от камеры
    const tb = mesh(lathe([[29, -32], [33, -32], [33, 32], [29, 32]], 48), M.intake, 'throttle');
    tb.rotation.z = Math.PI / 2; tb.position.set(tbX, yP, zP);
    this.add('intake', tb);
    const plate = mesh(cyl(28.5, 1.8, 'x', 40), M.brass, 'throttle');
    const plateG = new THREE.Group(); plateG.position.set(tbX, yP, zP); plateG.add(plate);
    const shaftT = mesh(cyl(2.4, 72, 'z', 10), M.steel, 'throttle'); plateG.add(shaftT);
    this.add('intake', plateG);
    this.throttlePlate = plateG;
    const motor = mesh(new THREE.BoxGeometry(30, 34, 22), M.coil, 'throttle'); motor.position.set(tbX, yP, zP - 45);
    this.add('intake', motor);
    // патрубки и каналы в ГБЦ
    this.intakePaths = [];
    const rr = 0.165 * B, rbr = 0.12 * B;
    xs.forEach((x, i) => {
      const port = this.ports[i];
      const main = [V3(x, yP + 20, zP + 8), V3(x, yP + 80, zP + 20), V3(x, H0 + 112, -Wh / 2 - 48), V3(x, H0 + 70, -Wh / 2 - 12), V3(x, H0 + 63, -Wh / 2 + 1)];
      const runner = mesh(new THREE.TubeGeometry(curve(main), 80, rr, 24, false), M.intake, 'intake');
      this.add('intake', runner);
      void rbr;
      // путь газа: патрубок → канал в головке → к своему клапану
      const branches = port.inBr.map((b) => new Path([...main.slice(0, 4), ...port.inMain, ...b.slice(1)]));
      this.intakePaths[i] = branches;
      // форсунка
      const inj = mesh(cyl(5.5, 46, 'y', 16), M.coil, 'injector');
      const ip = V3(x, H0 + 104, -Wh / 2 - 22);
      inj.position.copy(ip); inj.rotation.x = -0.75;
      this.add('intake', inj);
      // фланцевые болты коллектора
      for (const s of [-1, 1]) { const b = mesh(cyl(4, 12, 'z', 10), M.steel, 'intake'); b.position.set(x + s * 22, H0 + 62, -Wh / 2 - 8); this.add('intake', b); }
    });
    this.anchors.push({ key: 'intake', pos: V3(xs[0], yP + rP, zP) }, { key: 'throttle', pos: V3(tbX - 32, yP + 34, zP) });
  }

  // ---------------- выпуск ----------------
  buildExhaust() {
    const d = this.d, { B, Wh, H0, xs, vEx } = d;
    const zC = Wh / 2 + 78, yC = d.deck - 150;
    const re = 0.15 * B, rc = 0.25 * B;
    const xEnd = xs[d.n - 1] + 70;
    this.exhaustPaths = [];
    xs.forEach((x, i) => {
      const merge = V3(x, vEx.y + 34, vEx.z + 20);
      const tail = [merge, V3(x, H0 + 50, Wh / 2 - 22), V3(x, H0 + 50, Wh / 2 + 6), V3(x, H0 + 30, Wh / 2 + 44), V3(x + 8, yC + 70, zC - 4), V3(x + 30, yC + 8, zC), V3(xEnd, yC, zC), V3(xEnd + 70, yC - 30, zC), V3(xEnd + 95, FLOOR_Y + 260, zC)];
      this.add('exhaust', mesh(new THREE.TubeGeometry(curve([V3(x, H0 + 50, Wh / 2 - 1), ...tail.slice(2, 6)]), 80, re, 22, false), M.exhaust, 'exhaust'));
      const port = this.ports[i];
      this.exhaustPaths[i] = port.exBr.map((b) => new Path([...b, ...tail.slice(1)]));
      // фланец приёмной трубы с шпильками
      const fl = new THREE.Shape(); fl.absarc(0, 0, re + 14, 0, Math.PI * 2, false); fl.holes.push(circlePath(0, 0, re + 0.5));
      const flg = new THREE.ExtrudeGeometry(fl, { depth: 6, bevelEnabled: false, curveSegments: 32 }); flg.translate(x, H0 + 50, Wh / 2 + 7);
      this.add('exhaust', mesh(flg, M.steel, 'exhaust'));
      for (const sx of [-1, 1]) { const nut = mesh(new THREE.CylinderGeometry(5.5, 5.5, 6, 6), M.brass, 'exhaust'); nut.rotation.x = Math.PI / 2; nut.position.set(x + sx * (re + 8), H0 + 50, Wh / 2 + 16); this.add('exhaust', nut); }
    });
    const coll = [V3(xs[0] - 10, yC, zC), V3(xEnd, yC, zC), V3(xEnd + 70, yC - 30, zC), V3(xEnd + 95, FLOOR_Y + 260, zC)];
    this.add('exhaust', mesh(new THREE.TubeGeometry(curve(coll), 80, rc, 28, false), M.exhaust, 'exhaust'));
    // лямбда-зонд
    const o2 = mesh(cyl(7, 30, 'y', 6), M.steel, 'exhaust'); o2.position.set(xEnd + 40, yC + rc + 10, zC); this.add('exhaust', o2);
    this.anchors.push({ key: 'exhaust', pos: V3(xs[Math.min(1, d.n - 1)], H0 + 25, Wh / 2 + 50) });
  }

  // ---------------- привод ГРМ ----------------
  buildTiming() {
    const d = this.d, { B, vIn, vEx, xBelt } = d;
    const rc = 0.3 * B, rcs = 2 * rc;
    const camY = (vIn.cam.y + vEx.cam.y) / 2;
    // окружности в плоскости (z, y), обход против часовой стрелки
    const circles = [
      { c: new THREE.Vector2(0, 0), r: rc, key: 'crank' },
      { c: new THREE.Vector2(vEx.cam.z * 0.62 + 6, camY * 0.42), r: 0.27 * B, key: 'pump' },
      { c: new THREE.Vector2(vEx.cam.z, vEx.cam.y), r: rcs, key: 'ex' },
      { c: new THREE.Vector2(vIn.cam.z, vIn.cam.y), r: rcs, key: 'in' },
      { c: new THREE.Vector2((vIn.cam.z - rcs - rc) * 0.5 + 0.2 * B, camY * 0.5), r: 0.18 * B, key: 'idler' },
    ];
    const chain = this.look.timing === 'chain';
    const W = chain ? 16 : 24, T = chain ? 7 : 4.2;
    this.timingPath = beltPath(circles);
    const { geo: bg, len: s } = beltGeometry(this.timingPath, xBelt, W, T);
    this.beltLen = s;
    const tex = (chain ? chainTex : beltTex).clone(); tex.needsUpdate = true; tex.repeat.set(1, 1);
    this.beltTex = tex;
    const bm = chain ? cutMat({ color: 0xffffff, map: tex, roughness: 0.32, metalness: 0.9 }, 0xd8d0c0) : cutMat({ color: 0xffffff, map: tex, roughness: 0.82, metalness: 0 }, 0x444444);
    this.add('timing', mesh(bg, bm, chain ? 'chain' : 'belt'));
    // шкивы
    const gear = (rad, teeth, part) => {
      const g = new THREE.Group();
      g.add(mesh(extrudeYZ(gearShape(rad - 2.6, rad + 0.6, teeth, 0), W + 2), M.pulley, part));
      for (const sx of [-1, 1]) { const f = mesh(cyl(rad + 4, 1.6, 'x', 48), M.pulley, part); f.position.x = sx * (W / 2 + 2); g.add(f); }
      return g;
    };
    const cs = gear(rc, 21, 'sprocket'); cs.position.x = xBelt; this.crank.add(cs);
    for (const [type, v] of [['in', vIn], ['ex', vEx]]) {
      const g = gear(rcs, 42, 'sprocket');
      g.position.x = xBelt;
      const hub = mesh(cyl(0.2 * B, W + 12, 'x', 32), M.steel, 'sprocket'); hub.position.x = 0; g.add(hub);
      for (let k = 0; k < 4; k++) {
        const hole = mesh(cyl(0.11 * B, W + 4, 'x', 24), M.rubber, 'sprocket');
        const a = k * Math.PI / 2 + Math.PI / 4;
        hole.position.set(0, 0.6 * rcs * Math.cos(a), 0.6 * rcs * Math.sin(a));
        g.add(hole);
      }
      this.cams[type].add(g);
    }
    this.rollers = [];
    for (const C of circles.filter((c) => c.key === 'pump' || c.key === 'idler')) {
      const g = new THREE.Group();
      g.add(mesh(cyl(C.r, W + 2, 'x', 40), M.pulley, C.key === 'idler' ? 'tensioner' : 'sprocket'));
      g.add(mesh(cyl(C.r * 0.4, W + 8, 'x', 20), M.steel, C.key === 'idler' ? 'tensioner' : 'sprocket'));
      g.position.set(xBelt, C.c.y, C.c.x);
      this.add('timing', g);
      this.rollers.push({ g, r: C.r });
    }
    this.rc = rc;
    this.anchors.push({ key: 'belt', pos: V3(xBelt - 12, camY * 0.6, vEx.cam.z + 30) });
  }

  buildPan() {
    const d = this.d;
    const walls = roundRect(d.Lb - 4, d.Wb - 4, 16);
    walls.holes.push(holeFrom(roundRect(d.Lb - 16, d.Wb - 16, 10)));
    this.add('pan', mesh(extrudeXZ(walls, d.yPan + 5, d.yLow), M.pan, 'pan'));
    this.add('pan', mesh(extrudeXZ(roundRect(d.Lb - 4, d.Wb - 4, 16), d.yPan, d.yPan + 5), M.pan, 'pan'));
    this.add('pan', mesh(extrudeXZ(roundRect(d.Lb + 6, d.Wb + 6, 18), d.yLow - 5, d.yLow), M.pan, 'pan'));
    const oil = mesh(new THREE.BoxGeometry(d.Lb - 18, 32, d.Wb - 18), M.oil, 'oil', false);
    oil.position.y = d.yPan + 5 + 16;
    this.add('pan', oil);
    const drain = mesh(cyl(8, 10, 'y', 6), M.brass, 'pan'); drain.position.set(d.xRear - 60, d.yPan - 4, 0); this.add('pan', drain);
    this.anchors.push({ key: 'pan', pos: V3(0, d.yPan + 20, d.Wb / 2) });
  }

  // навесное оборудование
  buildAccessories() {
    const d = this.d, { B, Wb, xFront, xRear } = d;
    // генератор: корпус с рёбрами, шкив поликлинового ремня
    const alt = new THREE.Group();
    const body = mesh(lathe([[0, -40], [0.62 * B, -40], [0.66 * B, -30], [0.66 * B, 30], [0.6 * B, 40], [0, 40]], 40), M.aluminum, 'alternator');
    body.rotation.z = Math.PI / 2; alt.add(body);
    for (let k = 0; k < 14; k++) {
      const fin = mesh(new THREE.BoxGeometry(70, 4, 6), M.aluminum, 'alternator');
      const a = (k / 14) * Math.PI * 2; fin.position.set(0, 0.67 * B * Math.cos(a), 0.67 * B * Math.sin(a)); fin.rotation.x = -a; alt.add(fin);
    }
    const ap = mesh(lathe([[6, -10], [0.3 * B, -10], [0.27 * B, -5], [0.3 * B, 0], [0.27 * B, 5], [0.3 * B, 10], [6, 10]], 32), M.pulley, 'alternator');
    ap.rotation.z = Math.PI / 2; ap.position.x = -52; alt.add(ap);
    alt.position.set(xFront + 30, d.yLiner0 + 12, -(Wb / 2 + 0.72 * B));
    this.add('block', alt);
    this.alternator = ap;
    // масляный фильтр
    const of = mesh(lathe([[0, 0], [0.4 * B, 0], [0.42 * B, 6], [0.42 * B, 0.95 * B], [0.36 * B, 1.05 * B], [0, 1.05 * B]], 36), new THREE.MeshStandardMaterial({ color: 0x1f4e9c, metalness: 0.4, roughness: 0.4 }), 'oilFilter');
    of.material.clippingPlanes = clipState.planes; shaderMats.push(of.material);
    of.rotation.x = -(Math.PI / 2 + 0.3); of.position.set(-0.15 * d.pitch, d.yLiner0 - 18, -Wb / 2 - 2);
    this.add('block', of);
    // стартер у маховика
    const st = mesh(lathe([[0, -70], [0.36 * B, -70], [0.38 * B, -60], [0.38 * B, 40], [0.3 * B, 56], [0, 56]], 32), M.coil, 'starter');
    st.rotation.z = Math.PI / 2; st.position.set(xRear - 40, -0.65 * B, -(Wb / 2 + 0.45 * B));
    this.add('block', st);
    // щуп
    const ds = mesh(cyl(4, 180, 'y', 10), M.steel, 'dipstick'); ds.position.set(xFront + 70, d.yLiner0 + 40, -Wb / 2 - 10); ds.rotation.x = -0.12;
    const dhm = new THREE.MeshStandardMaterial({ color: 0xffb400, roughness: 0.5 }); dhm.clippingPlanes = clipState.planes; shaderMats.push(dhm);
    const dh = mesh(new THREE.TorusGeometry(10, 3, 8, 20), dhm, 'dipstick');
    dh.position.set(xFront + 70, d.yLiner0 + 140, -Wb / 2 - 21);
    this.add('block', ds); this.add('block', dh);
    this.anchors.push({ key: 'alternator', pos: V3(xFront + 30, d.yLiner0 + 12 + 0.7 * B, -(Wb / 2 + 0.72 * B)) });
  }

  // ---------------- газ и частицы ----------------
  buildGas() {
    const d = this.d, { R, H0, hd } = d;
    this.gas = [];
    const Rg = R - 0.5;
    d.xs.forEach((x, i) => {
      const g = new THREE.CylinderGeometry(Rg, Rg, 1, 56, 1, false);
      const pos = g.attributes.position;
      const bottom = [];
      for (let k = 0; k < pos.count; k++) {
        if (pos.getY(k) > 0) pos.setY(k, H0 + hd * (1 - Math.min(1, Math.abs(pos.getZ(k)) / Rg)));
        else bottom.push(k);
      }
      const mat = clipShader({
        vertexShader: GAS_VERT, fragmentShader: GAS_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uFresh: { value: 1 }, uTemp: { value: 300 }, uFlameR: { value: 0 }, uBurning: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 1 }, uSpark: { value: V3(0, H0 + hd - 3, 0) } },
      });
      const m = new THREE.Mesh(g, mat);
      m.position.x = x;
      m.renderOrder = 3;
      m.userData.part = 'gas';
      m.userData.cyl = i;
      this.groups.gas.add(m);
      this.gas.push({ mesh: m, bottom, mat });
    });
    // частицы потока
    const make = (count, paths, hue) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
      geo.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(count), 1));
      const mat = clipShader({ vertexShader: POINTS_VERT, fragmentShader: POINTS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uSize: { value: 70 * Math.min(2, window.devicePixelRatio || 1) } } });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      pts.renderOrder = 4;
      this.groups.flow.add(pts);
      const t = new Float32Array(count), br = new Uint8Array(count), j = new Float32Array(count * 2);
      for (let k = 0; k < count; k++) { t[k] = Math.random(); br[k] = k % 2; j[2 * k] = (Math.random() - 0.5); j[2 * k + 1] = (Math.random() - 0.5); }
      return { pts, geo, t, br, j, paths, hue, count };
    };
    this.flows = d.xs.map((_, i) => ({ in: make(90, this.intakePaths[i], 'in'), ex: make(110, this.exhaustPaths[i], 'ex') }));
  }

  buildStand() {
    const d = this.d;
    const mat = M.stand, dark = M.standDark;
    const box = (w, h, dd, x, y, z, m = mat) => { const b = mesh(new THREE.BoxGeometry(w, h, dd), m, 'stand'); b.position.set(x, y, z); this.add('stand', b); return b; };
    const zS = d.Wb / 2 + 150, x0 = d.xFront + 40, x1 = d.xRear - 40;
    const yF = FLOOR_Y;
    // рама на полу
    box(d.Lb + 420, 40, 50, 0, yF + 20, zS);
    box(d.Lb + 420, 40, 50, 0, yF + 20, -zS);
    box(50, 40, 2 * zS + 50, -(d.Lb + 370) / 2, yF + 20, 0);
    box(50, 40, 2 * zS + 50, (d.Lb + 370) / 2, yF + 20, 0);
    // стойки и кронштейны опор
    for (const x of [x0, x1]) for (const s of [-1, 1]) {
      const yTop = (d.yLiner0 + d.yLow) / 2;
      box(46, yTop - yF - 40, 46, x, (yTop + yF + 40) / 2, s * zS);
      box(30, 30, zS - d.Wb / 2, x, yTop, s * (zS + d.Wb / 2) / 2);
      const pad = mesh(cyl(22, 18, 'z', 24), M.rubber, 'stand'); pad.position.set(x, yTop, s * (d.Wb / 2 + 20)); this.add('stand', pad);
    }
    for (const x of [-(d.Lb + 370) / 2, (d.Lb + 370) / 2]) for (const s of [-1, 1]) {
      const foot = mesh(cyl(30, 12, 'y', 20), dark, 'stand'); foot.position.set(x, yF + 6, s * zS); this.add('stand', foot);
    }
  }

  // =====================================================================
  setExplode(t) {
    const k = t * t * (3 - 2 * t);
    for (const [g, v] of Object.entries(this.explodeDir)) this.groups[g].position.copy(v).multiplyScalar(k);
    // внутри групп: распредвалы выше головки, клапаны вытянуты вверх, свечи выкручены,
    // поршни выходят из цилиндров, шатуны — между поршнями и валом
    for (const c of Object.values(this.cams)) c.position.y = c.userData.baseY + 170 * k;
    for (const v of this.valves) v.frame.position.copy(v.frame.userData.base).addScaledVector(v.frame.userData.axis, 110 * k);
    for (const p of this.plugs) p.position.y = p.userData.baseY + 150 * k;
    this.pistonLift = 190 * k; this.rodLift = -40 * k;
    this.exploded = t > 0.01;
    this.groups.timing.visible = this.timingVisible !== false;
    this.groups.stand.visible = t < 0.3 && this.standVisible !== false;
  }

  /**
   * theta — угол поворота коленвала, ° (растёт непрерывно)
   * s: { cyc, vvt, throttle, flow, dTheta, time, watch, heat }
   */
  update(theta, s) {
    const d = this.d, th = theta * D2R;
    this.crank.rotation.x = th;
    this.cams.in.rotation.x = (theta + s.vvt) * D2R / 2;
    this.cams.ex.rotation.x = th / 2;
    this.beltTex.offset.x = (this.rc * th) / 9.525;
    for (const r of this.rollers) r.g.rotation.x = th * this.rc / r.r;
    this.alternator.rotation.x = th * 2.6;
    this.throttlePlate.rotation.z = (0.12 + s.throttle * 1.38);

    let lightIdx = 0;
    for (const l of this.sparkLights) l.intensity = 0;
    this.cyl.forEach((c, i) => {
      const beta = th - c.off * D2R;
      const sb = Math.sin(beta), cb = Math.cos(beta);
      const yPin = d.r * cb + Math.sqrt(d.L * d.L - d.r * d.r * sb * sb);
      c.piston.position.y = yPin + this.pistonLift;
      c.rod.position.set(c.x, d.r * cb + this.rodLift, d.r * sb);
      c.rod.rotation.x = Math.atan2(-d.r * sb, yPin - d.r * cb);
      c.alpha = wrap720(theta - c.off);
      c.crown = yPin + d.ch;
      // газ
      const g = this.gas[i];
      const pos = g.mesh.geometry.attributes.position;
      for (const k of g.bottom) pos.setY(k, c.crown);
      pos.needsUpdate = true;
      g.mesh.geometry.computeBoundingSphere();
      const a = Math.round(c.alpha) % 720;
      const cyc = s.cyc;
      const burning = c.alpha >= cyc.ign && c.alpha < TIMING.evo && cyc.XB[a] < 0.999;
      const u = g.mat.uniforms;
      u.uFresh.value = cyc.FRESH[a];
      u.uTemp.value = cyc.T[a];
      u.uBurning.value = burning ? 1 : 0;
      u.uFlameR.value = burning ? 4 + Math.cbrt(Math.max(0, cyc.XB[a])) * d.R * 1.9 : 0;
      u.uTime.value = s.time;
      u.uAlpha.value = s.watch === i || s.watch < 0 ? 1 : 0.55;
      // искра и свет пламени
      const sinceIgn = c.alpha - cyc.ign;
      c.spark = sinceIgn >= 0 && sinceIgn < 7;
      if ((c.spark || burning) && lightIdx < this.sparkLights.length && !this.exploded) {
        const l = this.sparkLights[lightIdx++];
        l.position.set(c.x, d.H0 - 10, 0);
        if (!cyc.hrMax) cyc.hrMax = cyc.HR.reduce((m, v) => Math.max(m, v), 1e-9);
        const hr = cyc.HR[a] / cyc.hrMax;
        l.intensity = c.spark ? 0.5 : 0.25 + 2.2 * hr;
        l.color.setHSL(c.spark ? 0.6 : 0.07, 1, c.spark ? 0.8 : 0.55);
      }
    });

    // клапаны
    for (const v of this.valves) {
      const al = this.cyl[v.cyl].alpha;
      const lift = v.type === 'in' ? liftIn(al, s.vvt) : liftEx(al);
      v.moving.position.y = -lift;
      v.spring.scale.y = (v.springTop0 - lift - v.springBase) / (v.springTop0 - v.springBase);
      v.lift = lift;
    }

    // частицы
    if (s.flow && !this.exploded) this.updateFlow(s);
    this.details.update(s, th, s.dTheta || 0);
    this.groups.flow.visible = s.flow && !this.exploded;
    this.groups.gas.visible = !this.exploded;
    M.exhaust.emissiveIntensity = s.heat;
  }

  updateFlow(s) {
    const tmp = new THREE.Vector3();
    const dTh = Math.min(20, Math.abs(s.dTheta)) * Math.sign(s.dTheta || 1);
    const load = 0.35 + 0.65 * s.throttle;
    this.flows.forEach((f, i) => {
      const al = this.cyl[i].alpha;
      const lin = liftIn(al, s.vvt) / TIMING.liftIn, lex = liftEx(al) / TIMING.liftEx;
      // скорость в долях пути за градус: на впуске ~1 путь за такт, на выпуске быстрее (свободный выпуск)
      const blow = al > TIMING.evo && al < TIMING.evo + 50 ? 2.2 : 1;
      for (const [fl, speed] of [[f.in, lin * load * 0.0062], [f.ex, lex * 0.0058 * blow]]) {
        const P = fl.geo.attributes.position.array, C = fl.geo.attributes.color.array, A = fl.geo.attributes.alpha.array;
        for (let k = 0; k < fl.count; k++) {
          fl.t[k] += speed * dTh * (0.75 + 0.5 * Math.abs(fl.j[2 * k]));
          if (fl.t[k] > 1) fl.t[k] -= 1;
          if (fl.t[k] < 0) fl.t[k] += 1;
          const path = fl.paths[fl.br[k]];
          path.at(fl.t[k], tmp);
          const rad = fl.hue === 'in' ? 0.11 * this.d.B : 0.1 * this.d.B;
          P[3 * k] = tmp.x + fl.j[2 * k] * rad * 1.4;
          P[3 * k + 1] = tmp.y + fl.j[2 * k + 1] * rad;
          P[3 * k + 2] = tmp.z + (fl.j[2 * k] * fl.j[2 * k + 1]) * rad * 2;
          const tt = fl.t[k];
          if (fl.hue === 'in') { C[3 * k] = 0.25; C[3 * k + 1] = 0.7 + 0.2 * tt; C[3 * k + 2] = 1; A[k] = 0.55; }
          else { const h = Math.max(0, 1 - tt * 1.6); C[3 * k] = 0.5 + 0.5 * h; C[3 * k + 1] = 0.42 + 0.2 * h; C[3 * k + 2] = 0.35 - 0.25 * h; A[k] = 0.25 + 0.45 * h; }
        }
        fl.geo.attributes.position.needsUpdate = true;
        fl.geo.attributes.color.needsUpdate = true;
        fl.geo.attributes.alpha.needsUpdate = true;
      }
    });
  }

  dispose() {
    this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && shaderMats.includes(o.material)) { o.material.dispose(); shaderMats.splice(shaderMats.indexOf(o.material), 1); } });
    this.root.removeFromParent();
  }
}



// Труба с толщиной стенки: наружная и внутренняя поверхности + торцы — замкнутое тело
function thickTube(c, rIn, wall, segs, radial) {
  const outer = new THREE.TubeGeometry(c, segs, rIn + wall, radial, false);
  const inner = new THREE.TubeGeometry(c, segs, rIn, radial, false);
  const po = outer.attributes.position.array, pi = inner.attributes.position.array;
  const nv = po.length / 3;
  const pos = new Float32Array(po.length * 2); pos.set(po); pos.set(pi, po.length);
  const idx = [];
  const io = outer.index.array, ii = inner.index.array;
  for (let k = 0; k < io.length; k++) idx.push(io[k]);
  for (let k = 0; k < ii.length; k += 3) idx.push(ii[k] + nv, ii[k + 2] + nv, ii[k + 1] + nv);
  const R1 = radial + 1;
  for (const [ring, flip] of [[0, true], [segs, false]]) {
    for (let j = 0; j < radial; j++) {
      const a = ring * R1 + j, b = a + 1, c2 = b + nv, d2 = a + nv;
      if (flip) idx.push(a, b, c2, a, c2, d2); else idx.push(a, c2, b, a, d2, c2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Контур ремня вокруг шкивов (окружности в плоскости (z, y), обход против часовой стрелки)
function beltPath(circles) {
  const pts = [], tangents = [];
  for (let i = 0; i < circles.length; i++) {
    const A = circles[i], Bc = circles[(i + 1) % circles.length];
    const dv = Bc.c.clone().sub(A.c), Dl = dv.length(), dh = dv.clone().divideScalar(Dl);
    const psi = Math.acos((A.r - Bc.r) / Dl);
    const ang = Math.atan2(dh.y, dh.x) - psi;
    const nrm = new THREE.Vector2(Math.cos(ang), Math.sin(ang));
    tangents.push([A.c.clone().addScaledVector(nrm, A.r), Bc.c.clone().addScaledVector(nrm, Bc.r)]);
  }
  for (let i = 0; i < circles.length; i++) {
    const C = circles[i];
    const pin = tangents[(i - 1 + circles.length) % circles.length][1], pout = tangents[i][0];
    let a0 = Math.atan2(pin.y - C.c.y, pin.x - C.c.x), a1 = Math.atan2(pout.y - C.c.y, pout.x - C.c.x);
    while (a1 < a0) a1 += Math.PI * 2;
    const steps = Math.max(4, Math.ceil((a1 - a0) * C.r / 3));
    for (let k = 0; k <= steps; k++) { const a = a0 + (a1 - a0) * k / steps; pts.push(new THREE.Vector2(C.c.x + C.r * Math.cos(a), C.c.y + C.r * Math.sin(a))); }
    const [p0, p1] = tangents[i];
    const ls = Math.ceil(p0.distanceTo(p1) / 4);
    for (let k = 1; k < ls; k++) pts.push(p0.clone().lerp(p1, k / ls));
  }
  return pts;
}

// Лента ремня шириной W вдоль X и толщиной T наружу от контура
function beltGeometry(pts, x, W, T) {
  const pos = [], uv = [], idx = [];
  let s = 0;
  const N = pts.length;
  for (let i = 0; i <= N; i++) {
    const p = pts[i % N], q = pts[(i + 1) % N], pr = pts[(i - 1 + N) % N];
    if (i > 0) s += p.distanceTo(pts[(i - 1) % N]);
    const t = q.clone().sub(pr).normalize();
    const nr = new THREE.Vector2(t.y, -t.x);
    const o = p.clone().addScaledVector(nr, T);
    for (const [pp, xo] of [[p, -W / 2], [p, W / 2], [o, -W / 2], [o, W / 2]]) { pos.push(x + xo, pp.y, pp.x); uv.push(s / 9.525, xo > 0 ? 1 : 0); }
  }
  for (let i = 0; i < N; i++) {
    const a = i * 4, b = (i + 1) * 4;
    const quad = (p0, p1, p2, p3) => idx.push(p0, p2, p1, p0, p3, p2);
    quad(a + 2, b + 2, b + 3, a + 3);
    quad(a + 1, b + 1, b, a);
    quad(a, b, b + 2, a + 2);
    quad(a + 3, b + 3, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return { geo, len: s };
}

export { lathe, cyl, mesh, curve, extrudeXZ, extrudeYZ, roundRect, beltPath, beltGeometry };

function holeFrom(shape) { const p = new THREE.Path(); p.curves = shape.curves; p.currentPoint = shape.currentPoint; return p; }
