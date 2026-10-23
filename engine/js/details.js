import * as THREE from 'three';
import { M, cutMat, beltTex, clipState, onClipChange } from './materials.js';
import { lathe, cyl, mesh, curve, extrudeXZ, roundRect, beltPath, beltGeometry, FLOOR_Y } from './engine.js';
import { TIMING, liftIn, liftEx } from './thermo.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const plain = (opts) => { const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...opts }); m.clippingPlanes = clipState.planes; clipped.push(m); return m; };
const clipped = [];
onClipChange((planes, inter) => { for (const m of clipped) { m.clippingPlanes = planes; m.clipIntersection = inter; m.needsUpdate = true; } });

// ---------- шевроны: бегущие стрелки вдоль пути ----------
const chevGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0.42, 0); s.lineTo(-0.2, 0.6); s.lineTo(-0.5, 0.6); s.lineTo(0.1, 0); s.lineTo(-0.5, -0.6); s.lineTo(-0.2, -0.6); s.closePath();
  return new THREE.ShapeGeometry(s);
})();

export class Chevrons {
  constructor(points, normal, { count = 10, size = 14, color = 0xffffff, opacity = 0.9, closed = false, clip = false, offset = 0, billboard = false } = {}) {
    this.billboard = billboard;
    const c = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.3);
    this.pts = c.getSpacedPoints(300);
    this.len = c.getLength();
    this.count = count; this.size = size; this.normal = normal.clone().normalize(); this.phase = offset;
    this.mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    this.mat.color.multiplyScalar(1.6);
    if (clip) { this.mat.clippingPlanes = clipState.planes; clipped.push(this.mat); }
    this.base = opacity;
    this.mesh = new THREE.InstancedMesh(chevGeo, this.mat, count);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    this.update(0, 1);
  }
  update(dist, vis, cam) {
    this.phase = (this.phase + dist) % this.len;
    if (this.phase < 0) this.phase += this.len;
    this.mat.opacity = this.base * vis;
    this.mesh.visible = vis > 0.02;
    const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3();
    const n = this.pts.length - 1;
    for (let i = 0; i < this.count; i++) {
      const s = ((this.phase + (i / this.count) * this.len) % this.len) / this.len;
      const f = s * n, k = Math.min(n - 1, Math.floor(f));
      P.copy(this.pts[k]).lerp(this.pts[k + 1], f - k);
      X.copy(this.pts[k + 1]).sub(this.pts[k]).normalize();
      if (this.billboard && cam) Z.copy(cam).sub(P); else Z.copy(this.normal);
      Z.addScaledVector(X, -X.dot(Z)).normalize();
      Y.crossVectors(Z, X);
      // плавно появляются в начале пути и гаснут в конце
      const edge = Math.min(1, s * 6, (1 - s) * 6);
      const sc = this.size * (0.35 + 0.65 * edge);
      m.makeBasis(X.multiplyScalar(sc), Y.multiplyScalar(sc), Z.multiplyScalar(sc)).setPosition(P);
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---------- дым из выхлопной трубы ----------
const SMOKE_VERT = /* glsl */`
  attribute float life; attribute float seed; varying float vLife; uniform float uScale;
  void main() { vLife = life; vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uScale * (0.4 + life * 2.2) / -mv.z; gl_Position = projectionMatrix * mv; }`;
const SMOKE_FRAG = /* glsl */`
  varying float vLife; uniform float uHeat;
  void main() { vec2 q = gl_PointCoord - 0.5; float d = dot(q, q); if (d > 0.25) discard;
    float a = (1.0 - d * 4.0) * (1.0 - vLife) * 0.32;
    vec3 c = mix(vec3(0.78, 0.8, 0.84), vec3(0.62, 0.6, 0.58), uHeat);
    gl_FragColor = vec4(c, a); }`;

class Smoke {
  constructor(origin, dir, count = 70) {
    this.o = origin; this.dir = dir.clone().normalize(); this.count = count;
    this.p = new Float32Array(count * 3); this.v = new Float32Array(count * 3);
    this.life = new Float32Array(count).fill(1); this.seed = new Float32Array(count).map(() => Math.random());
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3));
    g.setAttribute('life', new THREE.BufferAttribute(this.life, 1));
    g.setAttribute('seed', new THREE.BufferAttribute(this.seed, 1));
    this.mat = new THREE.ShaderMaterial({ vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, transparent: true, depthWrite: false, uniforms: { uScale: { value: 2600 * Math.min(2, window.devicePixelRatio || 1) }, uHeat: { value: 0 } } });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 7;
    this.next = 0; this.acc = 0;
  }
  update(dTheta, rate, heat) {
    this.acc += dTheta * rate;
    while (this.acc > 1) {
      this.acc -= 1;
      const i = this.next; this.next = (this.next + 1) % this.count;
      this.life[i] = 0;
      this.p[3 * i] = this.o.x; this.p[3 * i + 1] = this.o.y; this.p[3 * i + 2] = this.o.z;
      const sp = 2.2 + Math.random();
      this.v[3 * i] = this.dir.x * sp + (Math.random() - 0.5) * 0.6; this.v[3 * i + 1] = this.dir.y * sp + 0.4 + Math.random() * 0.4; this.v[3 * i + 2] = this.dir.z * sp + (Math.random() - 0.5) * 0.6;
    }
    const k = Math.min(30, Math.abs(dTheta));
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] >= 1) { this.p[3 * i + 1] = -1e5; continue; }
      this.life[i] = Math.min(1, this.life[i] + k * 0.0045);
      this.p[3 * i] += this.v[3 * i] * k; this.p[3 * i + 1] += this.v[3 * i + 1] * k; this.p[3 * i + 2] += this.v[3 * i + 2] * k;
      this.v[3 * i] *= 0.985; this.v[3 * i + 2] *= 0.985; this.v[3 * i + 1] = this.v[3 * i + 1] * 0.99 + 0.012;
    }
    this.mat.uniforms.uHeat.value = heat;
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.life.needsUpdate = true;
  }
}

// =====================================================================
export function addDetails(e) {
  const d = e.d, { B, Wb, Wh, Lb, H0, H1, xs, xFront, xRear, n } = d;
  const top = H1 + 2 + d.coverH;
  const out = { chev: [] };

  // --- юбки поршней с антифрикционным покрытием ---
  const Rp = d.R - 0.3, yt = d.ch, yb = d.ch - d.pistonH;
  const coatMat = plain({ color: 0x3a3d43, roughness: 0.72, metalness: 0.2 });
  const coat = (start) => new THREE.LatheGeometry([new THREE.Vector2(Rp + 0.08, yb + 4), new THREE.Vector2(Rp + 0.08, yt - 21)], 24, start, 1.5);
  for (const c of e.cyl) for (const st of [-0.75, Math.PI - 0.75]) c.piston.add(mesh(coat(st), coatMat, 'piston'));

  // --- топливная рампа и форсунки ---
  const yr = H0 + 128, zr = -Wh / 2 - 40;
  const railLen = (xs[n - 1] - xs[0]) + 80;
  const railMat = cutMat({ color: 0xb8c2cc, metalness: 0.9, roughness: 0.25 }, 0xe8d3a0);
  const rail = mesh(cyl(9, railLen, 'x', 24), railMat, 'injector'); rail.position.set((xs[0] + xs[n - 1]) / 2, yr, zr); e.add('intake', rail);
  for (const s of [-1, 1]) { const cap = mesh(cyl(11, 10, 'x', 6), M.brass, 'injector'); cap.position.set((xs[0] + xs[n - 1]) / 2 + s * railLen / 2, yr, zr); e.add('intake', cap); }
  xs.forEach((x) => {
    const cup = mesh(cyl(8, 16, 'y', 16), railMat, 'injector'); cup.position.set(x, yr - 9, zr + 1); e.add('intake', cup);
    const con = mesh(new THREE.BoxGeometry(12, 10, 16), M.coil, 'injector'); con.position.set(x + 12, yr - 12, zr - 8); e.add('intake', con);
  });
  const fuelLine = [V3(xs[0] - 40, yr, zr), V3(xs[0] - 80, yr + 10, zr - 20), V3(xFront - 60, yr - 40, zr - 60), V3(xFront - 70, FLOOR_Y + 120, -(Wb / 2 + 150))];
  e.add('intake', mesh(new THREE.TubeGeometry(curve(fuelLine), 60, 4.5, 10, false), plain({ color: 0x1c1d20, roughness: 0.6 }), 'injector'));

  // --- воздушный фильтр и гофрированный патрубок ---
  const zP = -(Wh / 2 + 95), yP = H0 + 28, tbX = (Lb / 2 - 30) + 30;
  const boxC = V3(tbX + 150, yP + 50, zP - 30);
  const hosePts = [V3(tbX + 30, yP, zP), V3(tbX + 62, yP + 4, zP - 4), V3(tbX + 90, yP + 30, zP - 22), V3(boxC.x - 62, boxC.y, boxC.z)];
  const hoseCurve = curve(hosePts);
  const corr = new THREE.TubeGeometry(hoseCurve, 90, 34, 28, false);
  // гофры: радиус меняется вдоль патрубка
  {
    const p = corr.attributes.position, nrm = corr.attributes.normal, segs = 91, radial = 29;
    for (let i = 0; i < segs; i++) {
      const bump = 2.6 * Math.sin(i * 1.9) * Math.min(1, i / 8, (segs - 1 - i) / 8);
      for (let j = 0; j < radial; j++) { const k = i * radial + j; p.setXYZ(k, p.getX(k) + nrm.getX(k) * bump, p.getY(k) + nrm.getY(k) * bump, p.getZ(k) + nrm.getZ(k) * bump); }
    }
    corr.computeVertexNormals();
  }
  e.add('intake', mesh(corr, plain({ color: 0x232428, roughness: 0.7 }), 'intake'));
  const airbox = mesh(extrudeXZ(roundRect(130, 210, 26), boxC.y - 58, boxC.y + 58, 8), cutMat({ color: 0x2b2e33, roughness: 0.6, metalness: 0.1 }, 0xc9472d, { housing: true }), 'airbox');
  airbox.position.set(boxC.x, 0, boxC.z); e.add('intake', airbox);
  const lid = mesh(extrudeXZ(roundRect(136, 216, 28), boxC.y + 52, boxC.y + 62, 3), cutMat({ color: 0x3a3e45, roughness: 0.55 }, 0xc9472d), 'airbox');
  lid.position.set(boxC.x, 0, boxC.z); e.add('intake', lid);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const clip = mesh(new THREE.BoxGeometry(10, 18, 6), M.steel, 'airbox'); clip.position.set(boxC.x + sx * 50, boxC.y + 50, boxC.z + sz * 109); e.add('intake', clip); }
  const snork = [V3(boxC.x, boxC.y + 58, boxC.z + 40), V3(boxC.x, boxC.y + 110, boxC.z + 52), V3(boxC.x - 10, boxC.y + 150, boxC.z + 110)];
  e.add('intake', mesh(new THREE.TubeGeometry(curve(snork), 40, 30, 28, false), plain({ color: 0x2b2e33, roughness: 0.6 }), 'airbox'));
  const post = mesh(cyl(7, boxC.y - 58 - FLOOR_Y, 'y', 12), M.stand, 'stand'); post.position.set(boxC.x, (boxC.y - 58 + FLOOR_Y) / 2, boxC.z); e.add('stand', post);
  // воздух входит в патрубок
  out.airIn = new Chevrons([V3(boxC.x - 22, boxC.y + 330, boxC.z + 230), V3(boxC.x - 16, boxC.y + 240, boxC.z + 170), V3(boxC.x - 10, boxC.y + 160, boxC.z + 118)], V3(1, 0, 0), { count: 6, size: 22, color: 0x9fdcff, billboard: true });
  e.groups.intake.add(out.airIn.mesh);

  // --- катализатор, выхлопная труба, дым ---
  const zC = Wh / 2 + 78, xEnd = xs[n - 1] + 70, xD = xEnd + 95;
  const cat = mesh(lathe([[0, 0], [0.22 * B, 0], [0.46 * B, 26], [0.46 * B, 150], [0.22 * B, 176], [0, 176]], 40), M.exhaust, 'exhaust');
  cat.position.set(xD, FLOOR_Y + 84, zC); e.add('exhaust', cat);
  const shield = mesh(lathe([[0.48 * B, 30], [0.5 * B, 30], [0.5 * B, 146], [0.48 * B, 146]], 40, ), cutMat({ color: 0xc9ced4, metalness: 0.9, roughness: 0.35 }, 0xe8d3a0), 'exhaust');
  shield.position.copy(cat.position); e.add('exhaust', shield);
  const tail = [V3(xD, FLOOR_Y + 86, zC), V3(xD, FLOOR_Y + 50, zC), V3(xD + 60, FLOOR_Y + 40, zC), V3(xD + 220, FLOOR_Y + 46, zC + 10)];
  e.add('exhaust', mesh(new THREE.TubeGeometry(curve(tail), 50, 0.2 * B, 22, false), M.exhaust, 'exhaust'));
  const tip = mesh(lathe([[0.2 * B, -12], [0.24 * B, -12], [0.24 * B, 14], [0.21 * B, 14]], 28), M.steel, 'exhaust');
  tip.rotation.z = -Math.PI / 2 + 0.04; tip.position.set(xD + 220, FLOOR_Y + 46, zC + 10); e.add('exhaust', tip);
  out.smoke = new Smoke(V3(xD + 236, FLOOR_Y + 47, zC + 10), V3(1, 0.05, 0.04));
  e.groups.exhaust.add(out.smoke.points);
  out.exOut = new Chevrons([V3(xD + 240, FLOOR_Y + 46, zC + 10), V3(xD + 330, FLOOR_Y + 54, zC + 14), V3(xD + 430, FLOOR_Y + 70, zC + 18)], V3(0, 0, 1), { count: 5, size: 22, color: 0xffc48a, billboard: true });
  e.groups.exhaust.add(out.exOut.mesh);

  // --- клапанная крышка: рёбра, болты, шильдик ---
  for (const z of [0.3 * Wh, 0.38 * Wh]) { const rib = mesh(new THREE.BoxGeometry(Lb - 90, 6, 5), M.cover, 'cover'); rib.position.set(0, top + 2, z); e.add('cover', rib); }
  const nb = Math.round(Lb / 70);
  for (let k = 0; k < nb; k++) for (const s of [-1, 1]) {
    const b = mesh(cyl(5.5, 7, 'y', 6), M.steel, 'cover'); b.position.set(-Lb / 2 + 30 + k * (Lb - 60) / (nb - 1), H1 + 10, s * (Wh / 2 - 12)); e.add('cover', b);
  }
  const label = document.createElement('canvas'); label.width = 512; label.height = 96;
  const g = label.getContext('2d');
  g.fillStyle = '#e9ecef'; g.fillRect(0, 0, 512, 96);
  g.fillStyle = '#141619'; g.font = '700 54px Montserrat, Manrope, sans-serif'; g.fillText('DOHC', 26, 68);
  g.fillStyle = '#c9472d'; g.fillText(`${n * 4}V`, 210, 68);
  g.fillStyle = '#141619'; g.font = '600 34px "JetBrains Mono", monospace';
  const litres = (n * Math.PI * B * B / 4 * d.S / 1e6).toFixed(1).replace('.', ',');
  g.fillText(`${litres} л`, 360, 64);
  const lt = new THREE.CanvasTexture(label); lt.colorSpace = THREE.SRGBColorSpace; lt.anisotropy = 8;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(200, Lb * 0.45), Math.min(200, Lb * 0.45) * 96 / 512), new THREE.MeshStandardMaterial({ map: lt, roughness: 0.35, metalness: 0.3 }));
  plate.rotation.x = -Math.PI / 2; plate.position.set(0, top + 0.6, -0.34 * Wh); plate.userData.part = 'cover';
  e.add('cover', plate);
  // жгут проводов катушек
  const harness = [V3(xs[0] - 50, top + 18, 50), ...xs.map((x) => V3(x + 4, top + 16, 47)), V3(xs[n - 1] + 60, top + 10, 56), V3(xRear + 30, top - 60, 90), V3(xRear + 60, H0 - 20, 120)];
  e.add('cover', mesh(new THREE.TubeGeometry(curve(harness), 120, 5, 10, false), plain({ color: 0x1a1b1e, roughness: 0.55 }), 'coil'));
  // сапун и шланг
  const pcv = [V3(xs[n - 1] - 20, top + 4, -0.2 * Wh), V3(xs[n - 1] - 10, top + 40, -0.3 * Wh), V3(xs[n - 1], H0 + 120, zP + 30)];
  e.add('cover', mesh(new THREE.TubeGeometry(curve(pcv), 40, 7, 12, false), plain({ color: 0x1d1e21, roughness: 0.7 }), 'cover'));

  // --- блок: заглушки, рёбра ГБЦ, термостат, патрубки охлаждения ---
  const brassP = plain({ color: 0xc9a253, metalness: 1, roughness: 0.32 });
  xs.forEach((x) => { for (const s of [-1, 1]) { const fp = mesh(cyl(13, 4, 'z', 24), brassP, 'block'); fp.position.set(x + 20, d.deck - 70, s * (Wb / 2 + 1)); e.add('block', fp); } });
  for (const s of [-1, 1]) for (const y of [H0 + 22, H0 + 92]) { const rib = mesh(new THREE.BoxGeometry(Lb - 40, 4, 4), M.head, 'head'); rib.position.set(0, y, s * (Wh / 2 + 2)); e.add('head', rib); }
  const thermo = mesh(new THREE.BoxGeometry(46, 40, 44), M.aluminum, 'thermostat');
  thermo.position.set(xFront + 26, H1 - 24, 0.3 * Wh); e.add('head', thermo);
  const neck = mesh(cyl(18, 36, 'x', 24), M.aluminum, 'thermostat'); neck.position.set(xFront - 4, H1 - 18, 0.3 * Wh); e.add('head', neck);
  // теплообменник стенда
  const coolerX = xFront - 330, coolerZ = Wb / 2 + 210;
  const cooler = mesh(new THREE.BoxGeometry(150, 300, 240), plain({ color: 0xdfe3e8, roughness: 0.45, metalness: 0.3 }), 'cooler');
  cooler.position.set(coolerX, FLOOR_Y + 150, coolerZ); e.add('stand', cooler);
  for (let k = 0; k < 9; k++) { const fin = mesh(new THREE.BoxGeometry(152, 6, 200), plain({ color: 0x9aa3ad, roughness: 0.4, metalness: 0.5 }), 'cooler'); fin.position.set(coolerX, FLOOR_Y + 40 + k * 28, coolerZ); e.add('stand', fin); }
  const hoseMat = plain({ color: 0x1f2023, roughness: 0.65 });
  const upper = [V3(xFront - 20, H1 - 18, 0.3 * Wh), V3(xFront - 80, H1 + 30, 0.34 * Wh), V3(coolerX + 60, H1 + 10, coolerZ - 60), V3(coolerX, FLOOR_Y + 330, coolerZ - 20), V3(coolerX, FLOOR_Y + 300, coolerZ)];
  e.add('stand', mesh(new THREE.TubeGeometry(curve(upper), 80, 16, 16, false), hoseMat, 'coolant'));
  const lower = [V3(coolerX + 75, FLOOR_Y + 60, coolerZ - 40), V3(coolerX + 160, FLOOR_Y + 80, coolerZ - 100), V3(xFront - 40, d.yLiner0 + 30, 0.24 * Wb), V3(xFront, d.yLiner0 + 36, 0.22 * Wb)];
  e.add('stand', mesh(new THREE.TubeGeometry(curve(lower), 80, 16, 16, false), hoseMat, 'coolant'));
  out.coolFlow = new Chevrons(upper.slice(1, 4), V3(0, 0, 1), { count: 7, size: 8, color: 0x7ff0e6, opacity: 0.5, billboard: true });
  e.groups.stand.add(out.coolFlow.mesh);

  // --- маслозаборник в поддоне ---
  const pick = [V3(-20, d.yLow + 2, -0.18 * Wb), V3(-20, d.yLow - 30, -0.18 * Wb), V3(10, d.yPan + 24, -0.05 * Wb), V3(30, d.yPan + 22, 0)];
  e.add('pan', mesh(new THREE.TubeGeometry(curve(pick), 40, 7, 12, false), plain({ color: 0xa9adb2, metalness: 0.9, roughness: 0.35 }), 'oil'));
  const screen = mesh(cyl(28, 8, 'y', 32), M.steel, 'oil'); screen.position.set(30, d.yPan + 18, 0); e.add('pan', screen);

  // --- поликлиновой ремень генератора ---
  const xD2 = d.xBelt - 30;
  const altC = new THREE.Vector2(-(Wb / 2 + 0.72 * B), d.yLiner0 + 12);
  const acc = beltPath([{ c: new THREE.Vector2(0, 0), r: 0.78 * B }, { c: altC, r: 0.3 * B }]);
  const { geo: ag } = beltGeometry(acc, xD2, 18, 4);
  const atex = beltTex.clone(); atex.needsUpdate = true;
  out.accTex = atex;
  e.add('block', mesh(ag, cutMat({ color: 0xffffff, map: atex, roughness: 0.8 }, 0x444444), 'belt'));
  e.alternator.position.x = xD2 - (xFront + 30);

  // --- натяжитель ГРМ ---
  const idler = e.rollers.find((r) => r.r < 0.2 * B);
  if (idler) {
    const arm = mesh(new THREE.BoxGeometry(10, 70, 18), M.steel, 'tensioner');
    arm.position.set(d.xBelt + 18, idler.g.position.y - 30, idler.g.position.z + 8); arm.rotation.x = 0.4; e.add('timing', arm);
  }

  // --- шевроны движения ---
  // ремень ГРМ: стрелки чуть снаружи ленты, перед ней
  const tpath = e.timingPath.filter((_, i) => i % 3 === 0).map((p) => V3(d.xBelt - 16, p.y, p.x));
  out.belt = new Chevrons(tpath.slice().reverse(), V3(1, 0, 0), { count: 12, size: 11, color: 0xffffff, opacity: 0.85, closed: true });
  e.groups.timing.add(out.belt.mesh);
  // маховик: кольцо стрелок вокруг
  const rf = 1.45 * B + 22;
  const ring = Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return V3(xRear + 48, rf * Math.cos(a), rf * Math.sin(a)); });
  out.fly = new Chevrons(ring, V3(1, 0, 0), { count: 10, size: 14, color: 0xffc15e, opacity: 0.8, closed: true });
  e.groups.crank.add(out.fly.mesh);
  // внутри каналов (видно в разрезе)
  out.ports = e.cyl.map((_, i) => ({
    in: new Chevrons(e.intakePaths[i][0].pts.filter((_, k) => k % 10 === 0).slice(8), V3(1, 0, 0), { count: 7, size: 11, color: 0x8fd8ff, clip: true, billboard: true }),
    ex: new Chevrons(e.exhaustPaths[i][0].pts.filter((_, k) => k % 10 === 0).slice(0, 14), V3(1, 0, 0), { count: 7, size: 11, color: 0xffb27a, clip: true, billboard: true }),
  }));
  out.ports.forEach((p) => { e.groups.flow.add(p.in.mesh, p.ex.mesh); });

  // ---------- движение ----------
  out.update = (s, th, dTheta) => {
    const dRad = dTheta * Math.PI / 180;
    out.accTex.offset.x = (0.78 * B * th) / 9.525;
    const load = 0.3 + 0.7 * s.throttle;
    const cam = s.cam;
    out.airIn.update(dTheta * 0.9 * load * n / 4, 1, cam);
    out.exOut.update(dTheta * 1.2 * load * n / 4, 1, cam);
    out.coolFlow.update(dTheta * 0.25, 1, cam);
    out.belt.update(0.3 * B * dRad, 1);
    out.fly.update(rf * dRad, 1);
    out.smoke.update(dTheta, 0.06 * load * n / 4, Math.min(1, s.heat));
    out.ports.forEach((p, i) => {
      const al = e.cyl[i].alpha;
      const li = liftIn(al, s.vvt) / TIMING.liftIn, le = liftEx(al) / TIMING.liftEx;
      p.in.update(dTheta * 1.6 * li * load, Math.min(1, li * 2.5), cam);
      p.ex.update(dTheta * 2.2 * le, Math.min(1, le * 2.5), cam);
    });
  };
  return out;
}
