import * as THREE from 'three';
import { FLOOR_Y } from './engine.js';

// Светлая лаборатория двигателей: окна во всю стену, белые панели, столы с приборами.
// Режим «Студия» — бесшовный светлый фон без комнаты.
// Единицы сцены: 1 = 100 мм. Размытие фона делает постобработка, поэтому
// предметы обстановки нарочно простые.

const Y0 = FLOOR_Y / 100;

function tex(w, h, draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const std = (color, roughness = 0.6, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

function box(parent, w, h, d, mat, x, y, z, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true;
  parent.add(m); return m;
}

export function buildLab(renderer, scene) {
  const lab = new THREE.Group(), studio = new THREE.Group();
  scene.add(lab, studio);
  const RW = 84, RD = 64, RH = 32; // комната
  const zBack = -RD / 2, xLeft = -RW / 2, xRight = RW / 2;

  // ---------- пол ----------
  const floorMap = tex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#cfd3d7'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30000; i++) { const v = 190 + Math.random() * 30; g.fillStyle = `rgba(${v},${v + 2},${v + 5},0.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = 'rgba(120,128,138,0.35)'; g.lineWidth = 2;
    for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * w / 4, 0); g.lineTo(k * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, k * h / 4); g.lineTo(w, k * h / 4); g.stroke(); }
  }, [10, 8]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), std(0xffffff, 0.24, 0.0, { map: floorMap }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = Y0; floor.receiveShadow = true;
  lab.add(floor);
  // резиновый коврик под стендом и жёлтая разметка
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(24, 15), std(0x3b4047, 0.9));
  mat.rotation.x = -Math.PI / 2; mat.position.set(0, Y0 + 0.01, 0); mat.receiveShadow = true; lab.add(mat);
  const yellow = std(0xf2c230, 0.55);
  for (const [w, d, x, z] of [[26, 0.35, 0, 8.6], [26, 0.35, 0, -8.6], [0.35, 17.5, 13, 0], [0.35, 17.5, -13, 0]]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), yellow);
    s.rotation.x = -Math.PI / 2; s.position.set(x, Y0 + 0.015, z); s.receiveShadow = true; lab.add(s);
  }

  // ---------- стены ----------
  const wallMap = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#eceef1'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const v = 228 + Math.random() * 20; g.fillStyle = `rgba(${v},${v},${v + 3},0.4)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = 'rgba(160,168,178,0.45)'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
  }, [12, 4]);
  const wallMat = std(0xffffff, 0.85, 0, { map: wallMap });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), wallMat);
  left.rotation.y = Math.PI / 2; left.position.set(xLeft, Y0 + RH / 2, 0); left.receiveShadow = true; lab.add(left);
  const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = xRight; lab.add(right);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), wallMat); front.rotation.y = Math.PI; front.position.set(0, Y0 + RH / 2, RD / 2); lab.add(front);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), std(0xf3f4f6, 0.9)); ceil.rotation.x = Math.PI / 2; ceil.position.y = Y0 + RH; lab.add(ceil);
  // плинтус
  for (const [w, x, z, r] of [[RD, xLeft + 0.1, 0, Math.PI / 2], [RD, xRight - 0.1, 0, -Math.PI / 2]]) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.2), std(0xb9bec5, 0.6)); b.rotation.y = r; b.position.set(x, Y0 + 0.6, z); lab.add(b);
  }

  // ---------- задняя стена с окнами ----------
  const sky = tex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#cfe3f5'); gr.addColorStop(0.55, '#eef5fb'); gr.addColorStop(1, '#f7f4ee');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // мягкие силуэты деревьев и корпусов за окном
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w, r = 30 + Math.random() * 60;
      g.fillStyle = `rgba(${120 + Math.random() * 40},${160 + Math.random() * 30},${120 + Math.random() * 20},0.55)`;
      g.beginPath(); g.arc(x, h * 0.78 - Math.random() * 40, r, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(200,205,214,0.8)'; g.fillRect(w * 0.62, h * 0.42, w * 0.2, h * 0.4);
    g.fillStyle = 'rgba(185,192,202,0.8)'; g.fillRect(w * 0.12, h * 0.5, w * 0.14, h * 0.32);
  });
  const glass = new THREE.MeshBasicMaterial({ map: sky, toneMapped: true });
  glass.color.setScalar(2.4); // ярче комнаты — окна светятся и дают боке
  const winW = RW - 8, winH = 19, winY = Y0 + 5 + winH / 2;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glass); win.position.set(0, winY, zBack); lab.add(win);
  // простенки и переплёты
  const frame = std(0x40464e, 0.45, 0.6);
  box(lab, RW, 5, 0.6, wallMat, 0, Y0 + 2.5, zBack, false);
  box(lab, RW, RH - 5 - winH, 0.6, wallMat, 0, Y0 + 5 + winH + (RH - 5 - winH) / 2, zBack, false);
  for (let k = 0; k <= 8; k++) box(lab, 0.35, winH, 0.5, frame, -winW / 2 + k * winW / 8, winY, zBack + 0.2, false);
  box(lab, winW, 0.35, 0.5, frame, 0, winY + winH * 0.18, zBack + 0.2, false);
  box(lab, winW + 0.6, 0.45, 1.2, std(0xdfe2e6, 0.5), 0, Y0 + 5, zBack + 0.5, false);

  // ---------- рабочие столы с приборами ----------
  const benchTop = std(0xe9ebee, 0.45), benchBody = std(0xc7ccd3, 0.55, 0.2), dark = std(0x23272d, 0.5, 0.3);
  const screenTex = (kind) => tex(512, 320, (g, w, h) => {
    g.fillStyle = '#0b1722'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(90,150,190,0.25)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.lineWidth = 4;
    if (kind === 0) { g.strokeStyle = '#ffb547'; g.beginPath(); for (let x = 0; x < w; x++) { const t = x / w; const y = h * (0.86 - 0.7 * Math.exp(-Math.pow((t - 0.4) / 0.07, 2)) - 0.04 * Math.sin(t * 30)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    if (kind === 1) { g.strokeStyle = '#5cc8ff'; g.beginPath(); for (let x = 0; x < w; x++) { const y = h * 0.5 + Math.sin(x / 18) * h * 0.25 * Math.sin(x / 90); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    if (kind === 2) { const bars = [0.4, 0.62, 0.8, 0.92, 0.97, 0.9, 0.74]; bars.forEach((b, i) => { g.fillStyle = i === 4 ? '#ffb547' : '#4aa3d9'; g.fillRect(40 + i * 64, h - 30 - b * (h - 70), 40, b * (h - 70)); }); }
  });
  const screens = [0, 1, 2].map(screenTex);
  const bench = (x, z, rot, len = 14) => {
    const g = new THREE.Group();
    box(g, len, 0.4, 3.6, benchTop, 0, 9, 0);
    box(g, len - 0.4, 8.6, 3.2, benchBody, 0, 4.3, 0);
    for (let k = 0; k < Math.floor(len / 3.5); k++) box(g, 3.1, 0.15, 0.1, dark, -len / 2 + 1.9 + k * 3.5, 7.8, 1.66, false);
    g.position.set(x, Y0, z); g.rotation.y = rot;
    lab.add(g); return g;
  };
  const b1 = bench(-22, zBack + 2.4, 0, 16);
  const b2 = bench(19, zBack + 2.4, 0, 18);
  // мониторы и осциллограф
  const monitor = (parent, x, kind, w = 5.2) => {
    const m = new THREE.Group();
    box(m, w, w * 0.62, 0.3, dark, 0, 3.2, 0);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, w * 0.62 - 0.3), new THREE.MeshBasicMaterial({ map: screens[kind] }));
    sc.material.color.setScalar(1.6); sc.position.set(0, 3.2, 0.16); m.add(sc);
    box(m, 0.5, 1.8, 0.5, dark, 0, 1.1, -0.2); box(m, 2, 0.15, 1.4, dark, 0, 0.1, -0.2);
    m.position.set(x, 9.2, -0.6); parent.add(m);
  };
  monitor(b1, -3.5, 0); monitor(b1, 2.5, 2);
  monitor(b2, -5, 1, 4.4); monitor(b2, 3.5, 0, 6);
  const scope = box(b2, 4, 2.4, 2.4, std(0x9aa3ad, 0.5, 0.3), -0.5, 10.4, 0.2);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshBasicMaterial({ map: screens[1] })); scr.material.color.setScalar(1.8);
  scr.position.set(-1.1, 10.5, 1.42); b2.add(scr);
  for (let k = 0; k < 4; k++) box(b2, 0.25, 0.25, 0.2, std(0x30353c), 0.6 + k * 0.4, 10.0, 1.45, false);
  // мелочи на столах
  box(b1, 2.6, 0.6, 1.8, std(0xd84a2c, 0.5), 6, 9.5, 0.4);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.8, 20), std(0xffffff, 0.3)); mug.position.set(-7, 9.6, 0.8); b1.add(mug);
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 1.4, 32), std(0xd6d8da, 0.3, 0.8)); piston.position.set(-1, 9.9, 0.9); b1.add(piston);

  // ---------- стеллаж у левой стены ----------
  const shelf = new THREE.Group();
  const steelM = std(0x8f99a5, 0.45, 0.6);
  for (const x of [-5, 5]) for (const z of [-1.4, 1.4]) box(shelf, 0.25, 22, 0.25, steelM, x, 11, z);
  const boxColors = [0x2f6db5, 0xe3e6ea, 0xd84a2c, 0x3b4047, 0xf2c230, 0xe3e6ea];
  for (let k = 0; k < 5; k++) {
    box(shelf, 10.4, 0.2, 3, steelM, 0, 1 + k * 4.8, 0);
    let x = -4.6;
    while (x < 4.2) { const w = 1.2 + Math.random() * 2; const hgt = 1 + Math.random() * 2.6; box(shelf, w * 0.9, hgt, 2.4, std(boxColors[(Math.random() * boxColors.length) | 0], 0.6), x + w / 2, 1.1 + k * 4.8 + hgt / 2, 0); x += w; }
  }
  shelf.position.set(xLeft + 2, Y0, -12); shelf.rotation.y = Math.PI / 2;
  lab.add(shelf);

  // ---------- доска с формулами у правой стены ----------
  const board = tex(1024, 600, (g, w, h) => {
    g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9ced4'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = '#1e3a5f'; g.font = '600 54px Manrope, system-ui, sans-serif';
    g.fillText('Цикл Отто', 60, 100);
    g.font = '500 44px "JetBrains Mono", monospace';
    g.fillStyle = '#2b2f36';
    g.fillText('η = 1 − 1 / ε^(k−1)', 60, 190);
    g.fillText('pV = mRT', 60, 260);
    g.fillText('N = M · ω', 60, 330);
    g.fillStyle = '#c9472d'; g.fillText('ε = 10,5   k = 1,35', 60, 400);
    // рисунок p–V
    g.strokeStyle = '#1e3a5f'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(640, 80); g.lineTo(640, 520); g.lineTo(960, 520); g.stroke();
    g.strokeStyle = '#ff8a3d'; g.beginPath(); g.moveTo(660, 120); g.quadraticCurveTo(700, 380, 940, 470); g.stroke();
    g.strokeStyle = '#7f8cff'; g.beginPath(); g.moveTo(660, 330); g.quadraticCurveTo(720, 470, 940, 500); g.stroke();
  });
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(14, 8.2), std(0xffffff, 0.35, 0, { map: board }));
  bd.rotation.y = -Math.PI / 2; bd.position.set(xRight - 0.15, Y0 + 13, -6); lab.add(bd);
  box(lab, 0.5, 0.4, 14, std(0xb9bec5, 0.5), xRight - 0.5, Y0 + 8.7, -6);

  // шкаф и огнетушитель у правой стены
  box(lab, 3.2, 18, 7, std(0xdfe3e8, 0.5, 0.1), xRight - 1.8, Y0 + 9, 12);
  const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4.6, 24), std(0xc8221c, 0.35, 0.2)); ext.position.set(xRight - 1.4, Y0 + 2.3, 4); ext.castShadow = true; lab.add(ext);

  // растения в горшках — немного жизни
  const leaf = std(0x5b9a4b, 0.8), pot = std(0xf1f1ef, 0.5);
  const plant = (x, z, s) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.9, 2.2, 24), pot); p.position.y = 1.1; p.castShadow = true; g.add(p);
    for (let k = 0; k < 7; k++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + Math.random() * 0.9, 0), leaf);
      f.position.set((Math.random() - 0.5) * 2, 3 + Math.random() * 3.5 * s, (Math.random() - 0.5) * 2); f.castShadow = true; g.add(f);
    }
    g.position.set(x, Y0, z); g.scale.setScalar(s); lab.add(g);
  };
  plant(xLeft + 4, zBack + 4, 1.3); plant(xRight - 5, zBack + 5, 1.1); plant(-31, 14, 1);

  // потолочные светильники
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); lampMat.color.setScalar(3);
  for (const x of [-24, 0, 24]) for (const z of [-16, 0, 16]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(10, 2), lampMat); l.rotation.x = Math.PI / 2; l.position.set(x, Y0 + RH - 0.05, z); lab.add(l);
  }

  // ---------- студия: бесшовный фон ----------
  const cyc = new THREE.Shape();
  const sR = 10, sW = 140, sD = 60, sH = 50;
  const prof = [];
  for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI / 2; prof.push(new THREE.Vector2(sD / 2 - sR + Math.cos(a) * sR, sR + Math.sin(a) * sR)); }
  prof.unshift(new THREE.Vector2(-sD, 0));
  prof.push(new THREE.Vector2(sD / 2, sH));
  const cycGeo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[i], b = prof[i + 1];
    for (const [x0, x1] of [[-sW / 2, sW / 2]]) {
      pos.push(x0, a.y, -a.x, x1, a.y, -a.x, x1, b.y, -b.x, x0, a.y, -a.x, x1, b.y, -b.x, x0, b.y, -b.x);
    }
  }
  cycGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cycGeo.computeVertexNormals();
  const cycM = new THREE.Mesh(cycGeo, std(0xe9ebee, 0.75)); cycM.position.y = Y0; cycM.receiveShadow = true;
  cycM.material.side = THREE.DoubleSide;
  studio.add(cycM);
  void cyc;
  studio.visible = false;

  // ---------- свет ----------
  const hemi = new THREE.HemisphereLight(0xf4f8ff, 0xcfc9bf, 1.15);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff6ea, 2.6);
  key.position.set(-10, 26, -16); // со стороны окон
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 4; sc.far = 70;
  key.shadow.radius = 9; key.shadow.blurSamples = 18; key.shadow.bias = -0.0006;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 1.1); fill.position.set(14, 12, 18); scene.add(fill);
  const top = new THREE.DirectionalLight(0xffffff, 0.6); top.position.set(0, 30, 4); scene.add(top);

  scene.environment = brightEnv(renderer);
  const bgLab = new THREE.Color(0xe8ebef), bgStudio = new THREE.Color(0xeceef1);
  scene.background = bgLab;
  scene.fog = new THREE.Fog(0xe8ebef, 70, 140);

  return {
    setMode(mode) {
      lab.visible = mode === 'lab';
      studio.visible = mode === 'studio';
      scene.background = mode === 'lab' ? bgLab : bgStudio;
      scene.fog.color.copy(scene.background);
    },
  };
}

// Окружение для отражений: светлая комната с большими световыми панелями
function brightEnv(renderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 18, 40), new THREE.MeshBasicMaterial({ color: 0xbfc4ca, side: THREE.BackSide }));
  room.position.y = 5; s.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x9fa4aa }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3.9; s.add(floor);
  const panel = (w, h, x, y, z, rx, ry, c, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
  };
  for (const x of [-10, 0, 10]) for (const z of [-8, 8]) panel(6, 2, x, 13.9, z, Math.PI / 2, 0, 0xffffff, 5);
  panel(36, 9, 0, 6, -19.9, 0, 0, 0xeaf3ff, 3.2);       // окна
  panel(14, 8, -19.9, 6, 4, 0, Math.PI / 2, 0xffffff, 1.6);
  panel(12, 6, 19.9, 6, -2, 0, -Math.PI / 2, 0xfff1de, 1.8);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.02);
  pm.dispose();
  return rt.texture;
}
