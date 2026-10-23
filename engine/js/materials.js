import * as THREE from 'three';

// Все детали рисуются двусторонними. Если камера видит «изнанку» детали —
// значит, плоскость разреза срезала её стенку, и там красится сечение
// (как на учебных разрезных моторах: срез окрашен и заштрихован).

export const clipPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)];
export const clipState = { planes: [], intersection: false };

const solids = [];      // материалы корпусных деталей (могут стать «рентгеном»)
const all = [];

function hatch(shader, cutColor) {
  shader.uniforms.uCut = { value: new THREE.Color(cutColor) };
  shader.uniforms.uXray = { value: 0 };
  shader.fragmentShader = 'uniform vec3 uCut;\nuniform float uXray;\n' + shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    `#include <dithering_fragment>
    if (!gl_FrontFacing && uXray < 0.5) {
      float h = step(0.62, fract((gl_FragCoord.x + gl_FragCoord.y) / 7.0));
      gl_FragColor = vec4(uCut * (0.78 + 0.22 * h), 1.0);
    }`);
}

export function cutMat(opts, cutColor = 0xc9472d, { housing = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, shadowSide: THREE.FrontSide, ...opts });
  m.userData.cut = cutColor;
  m.onBeforeCompile = (s) => { hatch(s, cutColor); m.userData.shader = s; };
  m.clippingPlanes = clipState.planes;
  m.clipIntersection = clipState.intersection;
  if (housing) solids.push(m);
  all.push(m);
  return m;
}

// Каналы (впускные/выпускные): изнутри видна стенка канала, без штриховки
export function tubeMat(opts) {
  const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...opts });
  m.clippingPlanes = clipState.planes;
  all.push(m);
  return m;
}

export function applyClip(planes, intersection) {
  clipState.planes = planes;
  clipState.intersection = intersection;
  for (const m of all) { m.clippingPlanes = planes; m.clipIntersection = intersection; m.needsUpdate = true; }
  for (const f of extraClipped) f(planes, intersection);
}
const extraClipped = [];
export function onClipChange(fn) { extraClipped.push(fn); }

export function setXray(on) {
  for (const m of solids) {
    m.transparent = on;
    m.opacity = on ? 0.13 : 1;
    m.depthWrite = !on;
    if (m.userData.shader) m.userData.shader.uniforms.uXray.value = on ? 1 : 0;
    m.needsUpdate = true;
  }
}

// ---------- процедурные текстуры ----------

function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function noise(ctx, w, h, amount, alpha = 0.08) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

// литой алюминий: мелкая «песочная» шероховатость
const castBump = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const v = 110 + Math.random() * 40;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
  }
}, [6, 6], false);

// шлифованная сталь: тонкие круговые риски не нужны — продольные
const brushed = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) {
    const v = 100 + Math.random() * 60;
    g.strokeStyle = `rgba(${v},${v},${v},0.5)`;
    g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.lineTo(w, y + (Math.random() - 0.5) * 2); g.stroke();
  }
}, [2, 2], false);

// «муар» клапанной крышки (порошковая краска)
const crinkle = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) {
    const v = 90 + Math.random() * 80;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.2, 0, Math.PI * 2); g.fill();
  }
}, [5, 5], false);

// зубья ремня ГРМ
export const beltTex = canvasTex(64, 32, (g, w, h) => {
  g.fillStyle = '#1b1c1f'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2c2e33'; g.fillRect(0, 0, w * 0.42, h);
  g.fillStyle = '#3a3c42'; g.fillRect(w * 0.42, 0, 2, h);
  noise(g, w, h, 14);
}, [40, 1]);

export const M = {
  aluminum: cutMat({ color: 0x9da2a7, metalness: 0.6, roughness: 0.5, bumpMap: castBump, bumpScale: 0.7 }, 0xc9472d, { housing: true }),
  head: cutMat({ color: 0xc6c7c4, metalness: 0.5, roughness: 0.45, bumpMap: castBump, bumpScale: 0.5 }, 0xd0532f, { housing: true }),
  iron: cutMat({ color: 0x55585c, metalness: 0.6, roughness: 0.55 }, 0x8c3a2a, { housing: true }),
  cover: cutMat({ color: 0x8e1d22, metalness: 0.15, roughness: 0.62, bumpMap: crinkle, bumpScale: 1.4 }, 0xd8a24a, { housing: true }),
  pan: cutMat({ color: 0x2a2d31, metalness: 0.45, roughness: 0.5 }, 0xc9472d, { housing: true }),
  steel: cutMat({ color: 0xc9ced4, metalness: 1, roughness: 0.28, roughnessMap: brushed }, 0xe8d3a0),
  forged: cutMat({ color: 0x8d9298, metalness: 0.95, roughness: 0.38 }, 0xe0b878),
  piston: cutMat({ color: 0xd6d8da, metalness: 0.7, roughness: 0.33 }, 0xf0b25a),
  ring: cutMat({ color: 0x3b3e43, metalness: 0.9, roughness: 0.35 }, 0xffd27a),
  valve: cutMat({ color: 0xa9adb2, metalness: 1, roughness: 0.3 }, 0xe8d3a0),
  valveEx: cutMat({ color: 0x8a7d70, metalness: 0.9, roughness: 0.42 }, 0xe8d3a0),
  spring: cutMat({ color: 0x3f6fb8, metalness: 0.6, roughness: 0.38 }, 0x9fc2ff),
  bucket: cutMat({ color: 0x9aa0a6, metalness: 1, roughness: 0.25 }, 0xe8d3a0),
  ceramic: cutMat({ color: 0xf1efe8, metalness: 0, roughness: 0.35 }, 0xd8d0c0),
  coil: cutMat({ color: 0x17181b, metalness: 0.2, roughness: 0.55 }, 0x5a5f66),
  rubber: cutMat({ color: 0x1d1e21, metalness: 0, roughness: 0.85 }, 0x444),
  gasket: cutMat({ color: 0x6f747a, metalness: 0.8, roughness: 0.4 }, 0xa0a6ad, { housing: true }),
  pulley: cutMat({ color: 0x9da3a9, metalness: 0.9, roughness: 0.32 }, 0xe0b878),
  flywheel: cutMat({ color: 0x6b6f74, metalness: 0.9, roughness: 0.42, roughnessMap: brushed }, 0xc8a06a),
  intake: tubeMat({ color: 0x3a3e44, metalness: 0.55, roughness: 0.48 }),
  plenum: cutMat({ color: 0x2b2f35, metalness: 0.5, roughness: 0.45, bumpMap: castBump, bumpScale: 0.4 }, 0xc9472d, { housing: true }),
  exhaust: tubeMat({ color: 0x4a403a, metalness: 0.75, roughness: 0.6, emissive: 0xff3a08, emissiveIntensity: 0 }),
  brass: cutMat({ color: 0xc9a253, metalness: 1, roughness: 0.32 }, 0xffe1a0),
  stand: new THREE.MeshStandardMaterial({ color: 0x2f5d8a, metalness: 0.5, roughness: 0.5 }),
  standDark: new THREE.MeshStandardMaterial({ color: 0x23272c, metalness: 0.6, roughness: 0.5 }),
  coolant: new THREE.MeshStandardMaterial({ color: 0x3fd0c9, transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0, depthWrite: false, side: THREE.DoubleSide }),
  oil: new THREE.MeshStandardMaterial({ color: 0xc28a1c, transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0, side: THREE.DoubleSide }),
};
for (const k of ['coolant', 'oil']) { M[k].clippingPlanes = clipState.planes; all.push(M[k]); }
