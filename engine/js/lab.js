import * as THREE from 'three';
import { FLOOR_Y } from './engine.js';

// Испытательный бокс: эпоксидный пол с разметкой, стеновые панели, потолочные светильники.
// Единицы сцены: 1 = 100 мм.

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

export function buildLab(renderer, scene) {
  const lab = new THREE.Group();
  scene.add(lab);

  // --- пол ---
  const floorMap = tex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#2b3036'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { const v = 38 + Math.random() * 22; g.fillStyle = `rgba(${v},${v + 3},${v + 7},0.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    // швы плит 1×1 м
    g.strokeStyle = 'rgba(10,12,14,0.8)'; g.lineWidth = 3;
    for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * w / 4, 0); g.lineTo(k * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, k * h / 4); g.lineTo(w, k * h / 4); g.stroke(); }
  }, [8, 8]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.38, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = Y0; floor.receiveShadow = true;
  lab.add(floor);

  // жёлто-чёрная разметка вокруг стенда
  const stripe = tex(512, 32, (g, w, h) => {
    g.fillStyle = '#e2b11c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#16171a';
    for (let x = -h; x < w + h; x += 48) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 24, h); g.lineTo(x + 24 + h, 0); g.lineTo(x + h, 0); g.fill(); }
  }, [6, 1]);
  const sm = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 });
  const W = 13, Dp = 9.5;
  for (const [w, x, z, r] of [[W * 2, 0, Dp, 0], [W * 2, 0, -Dp, 0], [Dp * 2, W, 0, Math.PI / 2], [Dp * 2, -W, 0, Math.PI / 2]]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.5, 0.5), sm);
    s.rotation.set(-Math.PI / 2, 0, r); s.position.set(x, Y0 + 0.005, z); s.receiveShadow = true;
    lab.add(s);
  }

  // --- стены ---
  const panel = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#353b42'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = 48 + Math.random() * 16; g.fillStyle = `rgba(${v},${v + 4},${v + 9},0.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    // перфорированные звукопоглощающие панели
    g.fillStyle = 'rgba(15,17,20,0.55)';
    for (let y = 24; y < h; y += 22) for (let x = 24; x < w; x += 22) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(10,12,14,0.9)'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
  }, [10, 3]);
  const wallMat = new THREE.MeshStandardMaterial({ map: panel, roughness: 0.85, metalness: 0.1 });
  const roomW = 90, roomD = 70, roomH = 36;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), wallMat);
  back.position.set(0, Y0 + roomH / 2, -roomD / 2); back.receiveShadow = true; lab.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(roomD, roomH), wallMat.clone());
  left.material.map = panel.clone(); left.material.map.repeat.set(8, 3); left.material.map.needsUpdate = true;
  left.rotation.y = Math.PI / 2; left.position.set(-roomW / 2, Y0 + roomH / 2, 0); lab.add(left);
  const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = roomW / 2; lab.add(right);
  const front = back.clone(); front.rotation.y = Math.PI; front.position.z = roomD / 2; lab.add(front);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), new THREE.MeshStandardMaterial({ color: 0x1a1d21, roughness: 0.9 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = Y0 + roomH; lab.add(ceil);

  // табличка бокса
  const sign = tex(1024, 256, (g, w, h) => {
    g.fillStyle = '#e9ecef'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9472d'; g.fillRect(0, 0, 36, h);
    g.fillStyle = '#16191d';
    g.font = '600 78px Manrope, system-ui, sans-serif'; g.fillText('ИСПЫТАТЕЛЬНЫЙ БОКС  № 2', 80, 112);
    g.font = '500 44px Manrope, system-ui, sans-serif'; g.fillStyle = '#48505a'; g.fillText('Лаборатория двигателей внутреннего сгорания', 80, 190);
  });
  const signM = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.5 }));
  signM.position.set(-14, Y0 + 19, -roomD / 2 + 0.05); lab.add(signM);

  // стойка измерительной аппаратуры у стены
  const rack = new THREE.Group();
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x1c1f23, metalness: 0.5, roughness: 0.45 });
  const r0 = new THREE.Mesh(new THREE.BoxGeometry(7, 18, 6), rackMat); r0.position.y = 9; r0.castShadow = true; rack.add(r0);
  const screen = tex(512, 320, (g, w, h) => {
    g.fillStyle = '#081016'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1d3b48'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#ffb547'; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x < w; x++) { const t = x / w; const y = h * (0.85 - 0.65 * Math.exp(-Math.pow((t - 0.42) / 0.06, 2)) - 0.08 * Math.sin(t * 9)); x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  });
  for (let k = 0; k < 3; k++) {
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.4), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }));
    sc.position.set(0, 14 - k * 4.6, 3.02); rack.add(sc);
  }
  rack.position.set(22, Y0, -roomD / 2 + 3.5);
  lab.add(rack);

  // верстак и огнетушитель
  const bench = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 6), new THREE.MeshStandardMaterial({ color: 0x8a2a20, roughness: 0.55, metalness: 0.3 }));
  bench.position.set(-30, Y0 + 4.5, -roomD / 2 + 3.5); bench.castShadow = true; lab.add(bench);
  const top = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.5, 6.4), new THREE.MeshStandardMaterial({ color: 0x6b5b47, roughness: 0.8 }));
  top.position.set(-30, Y0 + 9.25, -roomD / 2 + 3.5); lab.add(top);
  const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 5, 24), new THREE.MeshStandardMaterial({ color: 0xc0201c, roughness: 0.35, metalness: 0.2 }));
  ext.position.set(-40, Y0 + 2.5, -roomD / 2 + 2); ext.castShadow = true; lab.add(ext);

  // потолочные светильники
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xf4f6ff, toneMapped: false });
  for (const x of [-24, 0, 24]) for (const z of [-18, 0, 18]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), lampMat);
    l.rotation.x = Math.PI / 2; l.position.set(x, Y0 + roomH - 0.05, z); lab.add(l);
  }

  // --- свет ---
  scene.add(new THREE.HemisphereLight(0xc8d6ff, 0x2a241e, 0.55));
  const key = new THREE.DirectionalLight(0xfff3e4, 2.3);
  key.position.set(9, 26, 14);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 5; sc.far = 60;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fc0ff, 0.7); fill.position.set(-16, 10, -6); scene.add(fill);
  const rim = new THREE.SpotLight(0xffd7a8, 60, 50, 0.5, 0.6, 1.6); rim.position.set(-6, 18, -22); rim.target.position.set(0, 0, 0); scene.add(rim, rim.target);

  // --- окружение для отражений металла ---
  scene.environment = studioEnv(renderer);
  scene.background = new THREE.Color(0x15181c);
  scene.fog = new THREE.Fog(0x15181c, 55, 120);
  return { lab, key };
}

function studioEnv(renderer) {
  const s = new THREE.Scene();
  const box = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ color: 0x2a2f36, side: THREE.BackSide }));
  box.position.y = 6; s.add(box);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x1b1e22 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3.9; s.add(floor);
  const light = (w, h, x, y, z, rx, ry, c = 0xffffff, k = 6) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
  };
  for (const x of [-10, 0, 10]) light(6, 1.4, x, 15.8, -2, Math.PI / 2, 0);
  light(10, 6, -19.8, 6, 0, 0, Math.PI / 2, 0xbfd3ff, 2.2);
  light(8, 5, 19.8, 7, 4, 0, -Math.PI / 2, 0xffe2c0, 2.6);
  light(14, 3, 0, 5, -19.8, 0, 0, 0xffffff, 1.4);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.03);
  pm.dispose();
  return rt.texture;
}
