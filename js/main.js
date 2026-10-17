import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { PLANETS, SUN, MOONS, INTERIOR } from './data.js';
import { PlanetSurface, CloudLayer, moonTextures, interiorTexture, glowTexture, ringTexture, dotTexture } from './textures.js';
import { AU_KM, eccentricAnomaly, periodYears, computeStats, habitableZone, luminosity } from './physics.js';
import { buildScenarios } from './scenarios.js';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const AU_U = 50; // единиц сцены в 1 а.е. в «реальных» масштабах
const J2000 = Date.UTC(2000, 0, 1, 12);
const $ = (s) => document.querySelector(s);

// ---------- состояние ----------
const state = {
  simDays: (Date.now() - J2000) / 86400000,
  speed: 5, // земных суток в секунду
  direction: 1,
  paused: false,
  mode: 'compact', // compact | real | true
  sizeScale: 1,
  sunMass: 1,
  userMass: 50,
  show: { orbits: true, labels: true, axes: false, moons: true, belt: true, hz: false },
  selected: null, // null | 'sun' | объект планеты
  cut: null, // null | 'sun' | объект планеты
};

// ---------- сцена ----------
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.localClippingEnabled = true;
const maxAniso = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
scene.background = new THREE.Color('#02030a');
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.0005, 40000);
camera.position.set(0, 150, 300);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1;
controls.maxDistance = 12000;
controls.zoomSpeed = 1.2;

scene.add(new THREE.AmbientLight(0xffffff, 0.06));
const sunLight = new THREE.PointLight(0xfff4e0, 2.6, 0, 0);
scene.add(sunLight);

// ---------- масштабы ----------
function mapDist(au) {
  return state.mode === 'compact' ? 14 + 26 * Math.pow(au, 0.6) : au * AU_U;
}
function bodyRadius(radiusKm) {
  if (state.mode === 'true') return (radiusKm / AU_KM) * AU_U;
  return state.sizeScale * (0.35 + 0.95 * Math.sqrt(radiusKm / 6371));
}
function sunRadius() {
  const k = Math.pow(state.sunMass, 0.8); // радиус звезды растёт примерно как M^0.8
  return state.mode === 'true' ? (SUN.radiusKm / AU_KM) * AU_U * k : 7 * k;
}

// ---------- звёзды и Млечный Путь ----------
{
  const n = 9000;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const c = new THREE.Color();
  const tilt = new THREE.Matrix4().makeRotationX(1.05).multiply(new THREE.Matrix4().makeRotationZ(0.4));
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const r = 15000;
    if (i < 5000) {
      const u = Math.random() * 2 - 1, t = Math.random() * TAU, s = Math.sqrt(1 - u * u);
      v.set(r * s * Math.cos(t), r * u, r * s * Math.sin(t));
    } else {
      // полоса Млечного Пути
      const t = Math.random() * TAU, h = (Math.random() + Math.random() + Math.random() - 1.5) * 0.12;
      v.set(Math.cos(t), h, Math.sin(t)).normalize().multiplyScalar(r).applyMatrix4(tilt);
    }
    pos.set([v.x, v.y, v.z], i * 3);
    const warm = Math.random() < 0.3;
    c.setHSL(warm ? 0.08 : 0.6, warm ? 0.5 : 0.3, 0.5 + Math.random() * 0.45);
    if (i >= 5000) c.multiplyScalar(0.55);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true })));
}

// ---------- Солнце: живая поверхность в шейдере ----------
const sunUniforms = { time: { value: 0 }, tint: { value: new THREE.Color(1, 1, 1) } };
const sunMaterial = new THREE.ShaderMaterial({
  uniforms: sunUniforms,
  clipping: true,
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>
    varying vec3 vObj; varying vec3 vN; varying vec3 vV;
    void main() {
      vObj = position;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
      #include <logdepthbuf_vertex>
      #include <clipping_planes_vertex>
    }`,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>
    #include <clipping_planes_pars_fragment>
    uniform float time; uniform vec3 tint;
    varying vec3 vObj; varying vec3 vN; varying vec3 vV;
    float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float noise(vec3 x) {
      vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
    void main() {
      #include <clipping_planes_fragment>
      #include <logdepthbuf_fragment>
      vec3 p = normalize(vObj);
      float big = fbm(p * 3.0 + vec3(0.0, time * 0.02, 0.0));
      float gran = fbm(p * 34.0 + vec3(time * 0.09));
      float spots = smoothstep(0.7, 0.76, fbm(p * 5.0 + 11.0 + time * 0.004)) * smoothstep(0.55, 0.15, abs(p.y));
      vec3 col = mix(vec3(1.0, 0.42, 0.06), vec3(1.0, 0.8, 0.38), big);
      col = mix(col, vec3(1.0, 0.96, 0.78), gran * 0.55);
      col *= 1.0 - spots * 0.75;
      float mu = max(dot(vN, vV), 0.0);
      col *= 0.42 + 0.68 * pow(mu, 0.45);
      gl_FragColor = vec4(col * tint, 1.0);
    }`,
});
const sunGroup = new THREE.Group();
scene.add(sunGroup);
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), sunMaterial);
sunMesh.userData.pick = 'sun';
sunGroup.add(sunMesh);
const glowTex = glowTexture();
const glow1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.35 }));
sunGroup.add(glow1, glow2);

// ---------- атмосферное свечение ----------
function atmosphere(color, strength) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(1.06, 64, 32),
    new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(color) }, strength: { value: strength } },
      vertexShader: `
        #include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          vW = mv.xyz;
          gl_Position = projectionMatrix * mv;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `
        #include <logdepthbuf_pars_fragment>
        uniform vec3 color; uniform float strength;
        varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main() {
          #include <logdepthbuf_fragment>
          float f = 1.0 - max(dot(vN, vV), 0.0);
          vec3 sunV = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float day = dot(vN, normalize(sunV - vW));
          float lit = smoothstep(-0.35, 0.3, day);
          gl_FragColor = vec4(color, pow(f, 4.0) * strength * (0.15 + 0.85 * lit));
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
}

// ---------- разрез ----------
// Вырезаем октант, обращённый к камере: три плоскости отсечения и три
// четвертинки диска с нарисованными слоями.
const CORNER = new THREE.Vector3(1, 1, 1).normalize();
const clipPlanes = [new THREE.Plane(), new THREE.Plane(), new THREE.Plane()];
const cutGroup = new THREE.Group();
cutGroup.visible = false;
scene.add(cutGroup);
const quarterGeo = new THREE.CircleGeometry(0.998, 96, 0, Math.PI / 2);
const cutMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
{
  const a = new THREE.Mesh(quarterGeo, cutMaterial); // плоскость z = 0
  const b = new THREE.Mesh(quarterGeo, cutMaterial);
  b.rotation.y = -Math.PI / 2; // плоскость x = 0
  const c = new THREE.Mesh(quarterGeo, cutMaterial);
  c.rotation.x = Math.PI / 2; // плоскость y = 0
  cutGroup.add(a, b, c);
}
const interiorTextures = {};
const layerLabels = [];

function cutMaterials(target) {
  if (target === 'sun') return [sunMaterial];
  return [target.surface.material, target.clouds?.material].filter(Boolean);
}

function setCut(target) {
  if (state.cut) {
    cutMaterials(state.cut).forEach((m) => {
      m.clippingPlanes = null;
      m.needsUpdate = true;
    });
    if (state.cut !== 'sun') state.cut.atmos.forEach((a) => (a.visible = true));
  }
  layerLabels.splice(0).forEach((l) => removeLabel(l));
  state.cut = target;
  cutGroup.visible = !!target;
  if (!target) return renderCutButton();

  const id = target === 'sun' ? 'sun' : target.base.id;
  interiorTextures[id] ??= interiorTexture(INTERIOR[id]);
  cutMaterial.map = interiorTextures[id];
  cutMaterial.needsUpdate = true;
  cutMaterials(target).forEach((m) => {
    m.clippingPlanes = clipPlanes;
    m.clipIntersection = true;
    m.needsUpdate = true;
  });
  if (target !== 'sun') target.atmos.forEach((a) => (a.visible = false));
  if (target === state.selected) flyTo(target, target === 'sun' ? 3 : 3.4);
  INTERIOR[id].forEach((L, i, arr) => {
    const inner = arr[i + 1]?.r ?? 0;
    const label = makeLabel(L.name, 'layer', () => {});
    // соседние слои подписываем на разных гранях, чтобы подписи не слипались
    const dir = i % 2 ? new THREE.Vector3(1, 1, 0) : new THREE.Vector3(1, 0, 1);
    label.local = dir.normalize().multiplyScalar((L.r + inner) / 2);
    layerLabels.push(label);
  });
  renderCutButton();
}

const tmpQ = new THREE.Quaternion();
const tmpN = new THREE.Vector3();
function updateCut() {
  if (!state.cut) return;
  const { pos, r } = targetInfo(state.cut);
  const camDir = camera.position.clone().sub(pos).normalize();
  tmpQ.setFromUnitVectors(CORNER, camDir);
  cutGroup.position.copy(pos);
  cutGroup.quaternion.copy(tmpQ);
  cutGroup.scale.setScalar(r);
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((axis, i) => {
    tmpN.set(-axis[0], -axis[1], -axis[2]).applyQuaternion(tmpQ);
    clipPlanes[i].setFromNormalAndCoplanarPoint(tmpN, pos);
  });
  cutGroup.updateMatrixWorld();
  // подписи слоёв показываем, только когда разрез достаточно крупный
  const px = (r / camera.position.distanceTo(pos)) * (window.innerHeight / (2 * Math.tan((camera.fov * DEG) / 2)));
  layerLabels.forEach((l) => {
    l.visible = state.show.labels && px > 150;
    l.pos.copy(l.local).applyMatrix4(cutGroup.matrixWorld);
  });
}

// ---------- планеты ----------
const sphereGeo = new THREE.SphereGeometry(1, 128, 64);
const smallSphereGeo = new THREE.SphereGeometry(1, 48, 24);
const bodies = [];

function ringMesh(inner, outer, faint) {
  const geo = new THREE.RingGeometry(inner, outer, 192, 1);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i));
    uv.setXY(i, (r - inner) / (outer - inner), 0.5);
  }
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: ringTexture(faint), transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

// Огни городов светятся только на ночной стороне, лава — всегда.
function nightEmissive(material, uniform) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.nightOnly = uniform;
    sh.fragmentShader = 'uniform float nightOnly;\n' + sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       vec3 sunV = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
       float dayL = dot(normal, normalize(sunV + vViewPosition));
       totalEmissiveRadiance *= mix(1.0, smoothstep(0.2, -0.15, dayL), nightOnly);`,
    );
  };
}

function initialAnomaly(p) {
  return ((p.L0 - p.peri) * DEG + (TAU * state.simDays) / p.period) % TAU;
}

function freshParams(p) {
  return { a: p.a, e: p.e, massMul: 1, radiusMul: 1, tilt: p.tilt, rotation: Math.abs(p.rotation), albedo: p.albedo };
}

async function buildPlanets(progress) {
  for (let idx = 0; idx < PLANETS.length; idx++) {
    const p = PLANETS[idx];
    progress(`Создаём: ${p.name}`, idx / PLANETS.length);
    await new Promise((r) => setTimeout(r, 0));

    const root = new THREE.Group();
    const tiltGroup = new THREE.Group();
    const body = new THREE.Group();
    root.add(tiltGroup);
    tiltGroup.add(body);
    scene.add(root);

    const surf = new PlanetSurface(p, idx + 3);
    [surf.map, surf.emissive, surf.bump, surf.roughness].forEach((t) => t && (t.anisotropy = maxAniso));
    const nightU = { value: 1 };
    const material = new THREE.MeshStandardMaterial({
      map: surf.map,
      bumpMap: surf.bump || null,
      bumpScale: p.kind === 'earth' ? 3 : 2.2,
      roughnessMap: surf.roughness || null,
      roughness: surf.roughness ? 1 : 0.95,
      metalness: 0,
      emissiveMap: surf.emissive,
      emissive: new THREE.Color(1, 1, 1),
      emissiveIntensity: 1.3,
    });
    nightEmissive(material, nightU);
    const surface = new THREE.Mesh(sphereGeo, material);
    surface.userData.pick = p.id;
    body.add(surface);

    let clouds = null;
    const atmos = [];
    if (p.kind === 'earth') {
      const cl = new CloudLayer(42);
      clouds = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ map: cl.map, transparent: true, depthWrite: false, roughness: 1 }));
      clouds.userData.layer = cl;
      clouds.scale.setScalar(1.012);
      body.add(clouds);
      atmos.push(atmosphere('#4d9bff', 1.1));
    }
    if (p.id === 'venus') atmos.push(atmosphere('#ffd58a', 1.0));
    if (p.id === 'uranus') atmos.push(atmosphere('#a9f0ff', 0.7));
    if (p.id === 'neptune') atmos.push(atmosphere('#5d86ff', 0.8));
    if (p.id === 'mars') atmos.push(atmosphere('#ff9a6a', 0.4));
    if (p.id === 'jupiter' || p.id === 'saturn') atmos.push(atmosphere('#f3dcb0', 0.35));
    atmos.forEach((a) => body.add(a));
    if (p.rings) body.add(p.faintRings ? ringMesh(1.6, 2.05, true) : ringMesh(1.24, 2.27, false));

    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.7, 0), new THREE.Vector3(0, 1.7, 0)]),
      new THREE.LineBasicMaterial({ color: '#ff6b6b', transparent: true, opacity: 0.8 }),
    );
    body.add(axis);

    const orbitLine = new THREE.LineLoop(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: '#7f9cff', transparent: true, opacity: 0.22 }),
    );
    scene.add(orbitLine);

    const moonPivot = new THREE.Group();
    (p.id === 'earth' ? root : tiltGroup).add(moonPivot);
    const moons = (MOONS[p.id] || []).map((m, i) => {
      const tx = moonTextures(m.color, 100 + idx * 10 + i);
      const mesh = new THREE.Mesh(smallSphereGeo, new THREE.MeshStandardMaterial({ map: tx.map, bumpMap: tx.bump, bumpScale: 2, roughness: 1 }));
      moonPivot.add(mesh);
      const o = { data: m, mesh, angle: Math.random() * TAU, label: null };
      o.label = makeLabel(m.name, 'moon', () => select(bodies[idx]));
      return o;
    });

    const obj = {
      base: p, cur: freshParams(p), M: initialAnomaly(p), spin: Math.random() * TAU,
      root, tiltGroup, body, surface, clouds, atmos, axis, orbitLine, moonPivot, moons, surf, nightU,
      label: null, rDisp: 1, climateT: null, climateDirty: true,
    };
    obj.label = makeLabel(p.name, 'planet', () => select(obj));
    bodies.push(obj);
    renderClimate(obj);
  }
}

// ---------- климат ----------
function statsOf(b) {
  const signedRot = b.cur.rotation * (b.cur.tilt > 90 ? -1 : 1);
  return computeStats(b.base, { ...b.cur, rotation: signedRot }, state.sunMass, state.userMass);
}

function renderClimate(b) {
  const T = statsOf(b).tSurfC;
  b.climateDirty = false;
  if (b.climateT !== null && Math.abs(T - b.climateT) < 0.75) return;
  b.climateT = T;
  const res = b.surf.render(T);
  b.nightU.value = res.nightOnly ? 1 : 0;
  if (b.clouds) b.clouds.userData.layer.render(T);
}

function markClimate(b) {
  if (b) b.climateDirty = true;
  else bodies.forEach((x) => (x.climateDirty = true));
}

let lastClimate = 0;
function processClimate(now) {
  if (now - lastClimate < 90) return;
  const b = bodies.find((x) => x.climateDirty);
  if (!b) return;
  lastClimate = now;
  renderClimate(b);
}

function climateText(b, T) {
  const id = b.base.id, k = b.base.kind;
  if (k === 'earth') {
    if (T < -15) return 'Планета-снежок: льды покрыли почти весь шар.';
    if (T < 5) return 'Ледниковый период: ледники спускаются к умеренным широтам.';
    if (T < 25) return 'Умеренный климат: океаны, леса, пустыни и полярные шапки.';
    if (T < 45) return 'Жарко: полярные льды растаяли, пустыни разрастаются.';
    if (T < 100) return 'Пекло: растительность гибнет, океаны мелеют.';
    if (T < 450) return 'Океаны выкипели: плотные облака, парниковая катастрофа, как на Венере.';
    return 'Кора раскалена докрасна, местами течёт лава.';
  }
  if (id === 'mars') {
    if (T < -90) return 'Очень холодно: полярные шапки разрастаются.';
    if (T < -15) return 'Холодная пыльная пустыня с полярными шапками.';
    if (T < 5) return 'Полярные шапки тают.';
    if (T < 40) return 'Тепло: в низинах появились моря, по берегам зеленеет.';
    return 'Жарко: вода испаряется.';
  }
  if (k === 'rocky') {
    if (T < -60) return 'Холодно: у полюсов намерзает иней.';
    if (T < 350) return 'Безвоздушная каменная пустыня в кратерах.';
    return 'Кора раскаляется, в трещинах светится лава.';
  }
  if (k === 'cloudy') return T < 100 ? 'Облака светлеют и остывают.' : 'Плотные облака скрывают раскалённую поверхность.';
  if (T > 650) return 'Горячий юпитер: облака темнеют и светятся от жара.';
  if (T > 60) return 'Атмосфера прогрелась: облака темнеют.';
  if (T < -150) return 'Очень холодно: облака бледнеют.';
  return 'Облачные пояса, как сейчас.';
}

// ---------- орбиты ----------
function orbitPosition(obj, E, out) {
  const { cur, base } = obj;
  const xo = cur.a * (Math.cos(E) - cur.e);
  const yo = cur.a * Math.sqrt(1 - cur.e * cur.e) * Math.sin(E);
  const w = base.peri * DEG, inc = base.incl * DEG;
  const x = xo * Math.cos(w) - yo * Math.sin(w);
  const y = xo * Math.sin(w) + yo * Math.cos(w);
  out.set(x, y * Math.sin(inc), -y * Math.cos(inc));
  const r = out.length();
  return out.multiplyScalar(mapDist(r) / r);
}

function rebuildOrbit(obj) {
  const pts = [];
  for (let i = 0; i < 512; i++) pts.push(orbitPosition(obj, (i / 512) * TAU, new THREE.Vector3()));
  obj.orbitLine.geometry.dispose();
  obj.orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
}

function applyBodyScale(obj) {
  obj.rDisp = bodyRadius(obj.base.radiusKm * obj.cur.radiusMul);
  obj.body.scale.setScalar(obj.rDisp);
  obj.tiltGroup.rotation.z = -obj.cur.tilt * DEG;
  obj.moons.forEach((m, i) => {
    const d = m.data;
    if (state.mode === 'true') {
      m.dist = (d.distKm / AU_KM) * AU_U;
      m.mesh.scale.setScalar((d.radiusKm / AU_KM) * AU_U);
    } else {
      m.dist = obj.rDisp * (1.35 + 0.42 * Math.sqrt(d.distKm / obj.base.radiusKm)) + i * 0.05;
      m.mesh.scale.setScalar(Math.max(0.07 * state.sizeScale, obj.rDisp * (d.radiusKm / obj.base.radiusKm)));
    }
  });
}

// ---------- пояс астероидов и обитаемая зона ----------
const beltData = [];
for (let i = 0; i < 6000; i++) {
  beltData.push({ a: 2.1 + Math.pow(Math.random(), 0.8) * 1.2, t: Math.random() * TAU, z: (Math.random() - 0.5) * 0.12 });
}
const belt = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: '#a89c8c', size: 0.22, sizeAttenuation: true, map: dotTexture(), alphaTest: 0.3, transparent: true, opacity: 0.8 }),
);
scene.add(belt);
function rebuildBelt() {
  const pos = new Float32Array(beltData.length * 3);
  beltData.forEach((b, i) => {
    const r = mapDist(b.a);
    pos.set([r * Math.cos(b.t), b.z * r * 0.2, -r * Math.sin(b.t)], i * 3);
  });
  belt.geometry.dispose();
  belt.geometry = new THREE.BufferGeometry();
  belt.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  belt.material.size = state.mode === 'compact' ? 0.2 : 0.35;
}

const hzMesh = new THREE.Mesh(
  new THREE.BufferGeometry(),
  new THREE.MeshBasicMaterial({ color: '#3ddc84', transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }),
);
hzMesh.rotation.x = -Math.PI / 2;
scene.add(hzMesh);
function rebuildHZ() {
  const [i, o] = habitableZone(state.sunMass);
  hzMesh.geometry.dispose();
  hzMesh.geometry = new THREE.RingGeometry(mapDist(i), mapDist(o), 180, 1);
}

function rebuildAll() {
  const sr = sunRadius();
  sunMesh.scale.setScalar(sr);
  glow1.scale.setScalar(sr * 5);
  glow2.scale.setScalar(sr * 14);
  const lum = luminosity(state.sunMass);
  sunLight.intensity = 2.6 * Math.min(2.2, Math.max(0.35, Math.sqrt(lum)));
  sunUniforms.tint.value.setRGB(1, 1, 1).lerp(new THREE.Color(state.sunMass < 1 ? '#ff7a4a' : '#bcd4ff'), Math.min(0.6, Math.abs(state.sunMass - 1)));
  bodies.forEach((b) => {
    applyBodyScale(b);
    rebuildOrbit(b);
  });
  rebuildBelt();
  rebuildHZ();
}

// ---------- подписи ----------
const labelLayer = $('#labels');
const labels = [];
function makeLabel(text, kind, onClick) {
  const el = document.createElement(kind === 'layer' ? 'span' : 'button');
  el.className = `label ${kind}`;
  el.textContent = text;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  labelLayer.appendChild(el);
  const l = { el, kind, pos: new THREE.Vector3(), visible: true };
  labels.push(l);
  return l;
}
function removeLabel(l) {
  l.el.remove();
  labels.splice(labels.indexOf(l), 1);
}
const sunLabel = makeLabel('Солнце', 'planet sun', () => select('sun'));

const tmpV = new THREE.Vector3();
function updateLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  for (const l of labels) {
    if (!l.visible) {
      l.el.style.display = 'none';
      continue;
    }
    tmpV.copy(l.pos).project(camera);
    if (tmpV.z > 1 || tmpV.z < -1 || Math.abs(tmpV.x) > 1.1 || Math.abs(tmpV.y) > 1.1) {
      l.el.style.display = 'none';
      continue;
    }
    l.el.style.display = '';
    l.el.style.transform = `translate(${((tmpV.x + 1) / 2) * w}px, ${((1 - tmpV.y) / 2) * h}px)`;
  }
}

// ---------- выбор и камера ----------
const camAnim = { active: false };
const lastTarget = new THREE.Vector3();

function targetInfo(sel) {
  if (sel === 'sun') return { pos: new THREE.Vector3(), r: sunRadius() };
  if (sel) return { pos: sel.root.getWorldPosition(new THREE.Vector3()), r: sel.rDisp };
  return { pos: new THREE.Vector3(), r: 0 };
}

function overviewOffset() {
  return state.mode === 'compact' ? new THREE.Vector3(0, 150, 300) : new THREE.Vector3(0, 950, 1800);
}

function flyTo(sel, k) {
  const { pos, r } = targetInfo(sel);
  const dir = camera.position.clone().sub(pos).normalize();
  camAnim.active = true;
  camAnim.t = 0;
  camAnim.fromTarget = controls.target.clone();
  camAnim.fromCam = camera.position.clone();
  camAnim.offset = dir.multiplyScalar(r * k * (window.innerWidth <= 860 ? 1.5 : 1));
}

function select(sel) {
  if (state.cut && state.cut !== sel) setCut(null);
  state.selected = sel;
  const { pos, r } = targetInfo(sel);
  let offset;
  if (sel) {
    const dir = camera.position.clone().sub(controls.target).normalize();
    dir.y = Math.max(dir.y, 0.25);
    dir.normalize();
    const dist = sel === 'sun' ? r * 4.5 : r * (sel.base.rings ? 7 : 5.5) + (state.show.moons && sel.moons.length ? r * 3 : 0);
    offset = dir.multiplyScalar(window.innerWidth <= 860 ? dist * 1.6 : dist);
    controls.minDistance = r * 1.15;
  } else {
    offset = overviewOffset();
    controls.minDistance = 1;
  }
  camAnim.active = true;
  camAnim.t = 0;
  camAnim.fromTarget = controls.target.clone();
  camAnim.fromCam = camera.position.clone();
  camAnim.offset = offset;
  lastTarget.copy(pos);

  bodies.forEach((b) => {
    b.orbitLine.material.opacity = b === sel ? 0.75 : 0.22;
    b.orbitLine.material.color.set(b === sel ? '#ffd27f' : '#7f9cff');
  });
  document.querySelectorAll('#planetbar button').forEach((btn) => {
    const id = sel === 'sun' ? 'sun' : sel ? sel.base.id : '';
    btn.classList.toggle('active', btn.dataset.id === id);
  });
  renderInfo();
}

function updateCamera(realDt) {
  const dt = Math.min(realDt, 0.4);
  const { pos } = targetInfo(state.selected);
  if (camAnim.active) {
    camAnim.t = Math.min(1, camAnim.t + dt / 1.6);
    const k = camAnim.t < 0.5 ? 4 * camAnim.t ** 3 : 1 - Math.pow(-2 * camAnim.t + 2, 3) / 2;
    controls.target.lerpVectors(camAnim.fromTarget, pos, k);
    camera.position.lerpVectors(camAnim.fromCam, pos.clone().add(camAnim.offset), k);
    if (camAnim.t >= 1) camAnim.active = false;
  } else if (state.selected) {
    const delta = pos.clone().sub(lastTarget);
    camera.position.add(delta);
    controls.target.add(delta);
  }
  lastTarget.copy(pos);
}

// ---------- клики по объектам ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;
function pick(e) {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const targets = [sunMesh, ...bodies.map((b) => b.surface)];
  const hit = raycaster.intersectObjects(targets, false)[0];
  if (!hit) return null;
  const id = hit.object.userData.pick;
  return id === 'sun' ? 'sun' : bodies.find((b) => b.base.id === id);
}
canvas.addEventListener('pointerdown', (e) => (downAt = [e.clientX, e.clientY]));
canvas.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const hit = pick(e);
  if (hit && hit !== state.selected) select(hit);
});
canvas.addEventListener('pointermove', (e) => {
  if (e.buttons) return;
  canvas.style.cursor = pick(e) ? 'pointer' : 'grab';
});

// ---------- анимация ----------
const clock = new THREE.Clock();
let frame = 0;
function clampRev(rev, max) {
  return Math.abs(rev) > max ? Math.sign(rev) * max : rev;
}

function tick(now) {
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.1);
  const dDays = state.paused ? 0 : state.speed * state.direction * dt;
  state.simDays += dDays;

  sunMesh.rotation.y += clampRev(dDays / 25.4, 0.02) * TAU;
  if (!state.paused) sunUniforms.time.value += dt * Math.min(4, 0.6 + Math.log10(1 + state.speed));
  glow1.material.opacity = state.cut === 'sun' ? 0.35 : 1;

  for (const b of bodies) {
    const Tdays = periodYears(b.cur.a, state.sunMass) * 365.256;
    b.M = (b.M + (TAU * dDays) / Tdays) % TAU;
    orbitPosition(b, eccentricAnomaly(b.M, b.cur.e), b.root.position);
    b.spin += clampRev((dDays * 24) / b.cur.rotation, 0.06) * TAU;
    b.surface.rotation.y = b.spin;
    if (b.clouds) b.clouds.rotation.y = b.spin * 1.04 + state.simDays * 0.02;
    b.axis.visible = state.show.axes;
    b.orbitLine.visible = state.show.orbits;
    b.moonPivot.visible = state.show.moons;
    b.moons.forEach((m) => {
      m.angle += clampRev(dDays / m.data.period, 0.03) * TAU;
      m.mesh.position.set(Math.cos(m.angle) * m.dist, 0, -Math.sin(m.angle) * m.dist);
      m.mesh.rotation.y = m.angle;
      m.label.visible = state.show.labels && state.show.moons && state.selected === b;
      if (m.label.visible) m.mesh.getWorldPosition(m.label.pos);
    });
    b.label.visible = state.show.labels;
    b.label.pos.copy(b.root.position);
    b.label.pos.y += b.rDisp * 1.25;
  }
  sunLabel.visible = state.show.labels;
  sunLabel.pos.set(0, sunRadius() * 1.15, 0);
  belt.visible = state.show.belt;
  belt.rotation.y = (TAU * state.simDays) / (periodYears(2.7, state.sunMass) * 365.256);
  hzMesh.visible = state.show.hz;

  updateCamera(rawDt);
  controls.update();
  updateCut();
  renderer.render(scene, camera);
  updateLabels();
  processClimate(now || 0);

  if (frame++ % 10 === 0) {
    updateDate();
    updateLive();
  }
  requestAnimationFrame(tick);
}

// ---------- время ----------
const fmt = (v, d = 2) => Number(v).toLocaleString('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: 0 });

function updateDate() {
  const d = new Date(J2000 + state.simDays * 86400000);
  $('#date').textContent = isFinite(d) && d.getUTCFullYear() > -10000 && d.getUTCFullYear() < 100000
    ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : '—';
}

function speedLabel(s) {
  if (s < 1.5 / 86400) return '1 с (реальное время)';
  if (s < 1 / 1440) return `${fmt(s * 86400, 0)} с`;
  if (s < 1 / 24) return `${fmt(s * 1440, 1)} мин`;
  if (s < 1) return `${fmt(s * 24, 1)} ч`;
  if (s < 365) return `${fmt(s, 1)} сут`;
  return `${fmt(s / 365.256, 1)} лет`;
}
// шкала скорости: 0..1000 ↔ от реального времени до ~5 лет в секунду (логарифмическая)
const SPEED_MIN = 1 / 86400, SPEED_MAX = 2000;
const SPEED_STEPS = [1 / 86400, 1 / 1440, 10 / 1440, 1 / 24, 6 / 24, 1, 3, 7, 15, 30, 91.3, 182.6, 365.25, 730.5, 1826];
const speedToUI = (s) => (1000 * Math.log(s / SPEED_MIN)) / Math.log(SPEED_MAX / SPEED_MIN);
const uiToSpeed = (u) => SPEED_MIN * Math.pow(SPEED_MAX / SPEED_MIN, u / 1000);

function setSpeed(v) {
  state.speed = Math.min(SPEED_MAX, Math.max(SPEED_MIN, v));
  $('#speed').value = speedToUI(state.speed);
  refreshTime();
}
function stepSpeed(dir) {
  const s = state.speed;
  const next = dir > 0 ? SPEED_STEPS.find((x) => x > s * 1.01) : [...SPEED_STEPS].reverse().find((x) => x < s / 1.01);
  if (next) setSpeed(next);
}
function setPaused(p) {
  state.paused = p;
  refreshTime();
}
function refreshTime() {
  const text = `1 с = ${speedLabel(state.speed)}`;
  $('#speedValue').textContent = text;
  $('#dockSpeed').textContent = state.paused ? 'Пауза' : (state.direction < 0 ? '◂ ' : '') + text;
  const play = $('#play');
  play.innerHTML = state.paused ? ICONS.play : ICONS.pause;
  play.title = state.paused ? 'Пуск (пробел)' : 'Пауза (пробел)';
  play.setAttribute('aria-label', play.title);
  $('#reverse').classList.toggle('active', state.direction < 0);
  $('#slower').disabled = state.speed <= SPEED_STEPS[0] * 1.01;
  $('#faster').disabled = state.speed >= SPEED_STEPS[SPEED_STEPS.length - 1] / 1.01;
}

const ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1" fill="currentColor"/><rect x="13.5" y="5.5" width="4" height="13" rx="1" fill="currentColor"/></svg>',
};

// ---------- интерфейс ----------
function setMode(m) {
  state.mode = m;
  $('#mode').value = m;
  $('#sizeRow').classList.toggle('disabled', m === 'true');
  rebuildAll();
}

function setShow(key, v) {
  state.show[key] = v;
  const cb = document.querySelector(`[data-show="${key}"]`);
  if (cb) cb.checked = v;
}

function resetAll() {
  setCut(null);
  bodies.forEach((b) => (b.cur = freshParams(b.base)));
  setSunMass(1);
  rebuildAll();
  markClimate();
}

function setupControls() {
  $('#speed').addEventListener('input', (e) => {
    state.speed = uiToSpeed(+e.target.value);
    refreshTime();
  });
  $('#play').addEventListener('click', () => setPaused(!state.paused));
  $('#slower').addEventListener('click', () => stepSpeed(-1));
  $('#faster').addEventListener('click', () => stepSpeed(1));
  $('#reverse').addEventListener('click', () => {
    state.direction *= -1;
    refreshTime();
  });
  $('#realtime').addEventListener('click', () => setSpeed(SPEED_MIN));
  $('#today').addEventListener('click', () => {
    state.simDays = (Date.now() - J2000) / 86400000;
    bodies.forEach((b) => (b.M = initialAnomaly(b.base)));
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      setPaused(!state.paused);
    } else if (e.key === 'Escape') select(null);
    else if (e.key === '0') select('sun');
    else if (/^[1-8]$/.test(e.key)) select(bodies[+e.key - 1]);
    else if (e.key === ']' || e.key === '+' || e.key === '=') stepSpeed(1);
    else if (e.key === '[' || e.key === '-') stepSpeed(-1);
    else if ((e.key === 'c' || e.key === 'с') && state.selected) toggleCut();
  });

  $('#mode').addEventListener('change', (e) => {
    setMode(e.target.value);
    select(state.selected);
    toast(
      {
        compact: 'Наглядный масштаб: расстояния сжаты, планеты увеличены — так удобно рассматривать систему целиком.',
        real: 'Реальные расстояния: орбиты в правильных пропорциях. Видно, как далеко находятся планеты-гиганты!',
        true: 'Полностью реальный масштаб: планеты стали крошечными точками. Солнечная система почти пустая! Нажмите на подпись, чтобы долететь до планеты.',
      }[state.mode],
    );
  });

  const size = $('#size');
  size.addEventListener('input', () => {
    state.sizeScale = +size.value;
    $('#sizeValue').textContent = `× ${fmt(state.sizeScale, 1)}`;
    bodies.forEach(applyBodyScale);
    if (state.selected) controls.minDistance = targetInfo(state.selected).r * 1.15;
  });

  document.querySelectorAll('[data-show]').forEach((cb) => {
    cb.checked = state.show[cb.dataset.show];
    cb.addEventListener('change', () => (state.show[cb.dataset.show] = cb.checked));
  });

  $('#sunMass').addEventListener('input', (e) => setSunMass(+e.target.value));

  $('#userMass').value = state.userMass;
  $('#userMass').addEventListener('input', (e) => {
    state.userMass = Math.max(0, +e.target.value || 0);
    renderStats();
  });

  $('#resetAll').addEventListener('click', () => {
    resetAll();
    renderInfo();
    toast('Все параметры возвращены к реальным значениям.');
  });

  document.querySelectorAll('#presets button').forEach((btn) => btn.addEventListener('click', () => runPreset(btn.dataset.preset)));

  const list = $('#scenarioList');
  SCENARIOS.forEach((s) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<b>${s.title}</b><span>${s.subtitle} · ${s.steps.length} шагов</span>`;
    btn.addEventListener('click', () => startScenario(s));
    list.appendChild(btn);
  });
  $('#scPrev').addEventListener('click', () => gotoStep(scenario.step - 1));
  $('#scNext').addEventListener('click', () => (scenario.step < scenario.s.steps.length - 1 ? gotoStep(scenario.step + 1) : endScenario()));
  $('#scClose').addEventListener('click', endScenario);

  const bar = $('#planetbar');
  [{ id: 'sun', name: 'Солнце', color: '#ffb43a' }, ...PLANETS.map((p) => ({ id: p.id, name: p.name, color: p.colors[1] }))].forEach((p, i) => {
    const btn = document.createElement('button');
    btn.dataset.id = p.id;
    btn.innerHTML = `<span class="dot" style="background:${p.color}"></span><span>${p.name}</span>`;
    btn.title = `${p.name} (клавиша ${i})`;
    btn.addEventListener('click', () => select(p.id === 'sun' ? 'sun' : bodies[i - 1]));
    bar.appendChild(btn);
  });
  const all = document.createElement('button');
  all.dataset.id = '';
  all.className = 'overview';
  all.innerHTML = '<span>Обзор</span>';
  all.title = 'Вся система (Esc)';
  all.addEventListener('click', () => select(null));
  bar.prepend(all);

  $('#toggleControls').addEventListener('click', () => document.body.classList.toggle('controls-open'));
  $('#closeInfo').addEventListener('click', () => select(null));
  refreshTime();
}

function setSunMass(v) {
  state.sunMass = v;
  $('#sunMass').value = v;
  $('#sunMassValue').textContent = `${fmt(v, 2)} M☉ · светимость × ${fmt(luminosity(v), 2)}`;
  rebuildAll();
  markClimate();
  renderStats();
}

// ---------- информационная панель ----------
const info = $('#info');

const LAB = [
  { key: 'a', label: 'Расстояние от Солнца', min: 0.2, max: 40, log: true, unit: 'а.е.', d: 3 },
  { key: 'e', label: 'Вытянутость орбиты (эксцентриситет)', min: 0, max: 0.9, step: 0.001, d: 3 },
  { key: 'massMul', label: 'Масса', min: 0.1, max: 100, log: true, unit: '×', d: 2 },
  { key: 'radiusMul', label: 'Радиус', min: 0.3, max: 3, step: 0.01, unit: '×', d: 2 },
  { key: 'tilt', label: 'Наклон оси', min: 0, max: 180, step: 0.1, unit: '°', d: 1 },
  { key: 'rotation', label: 'Период вращения вокруг оси', min: 1, max: 6000, log: true, unit: 'ч', d: 1 },
  { key: 'albedo', label: 'Альбедо (отражательная способность)', min: 0, max: 0.95, step: 0.01, d: 2 },
];

const toUI = (s, v) => (s.log ? (1000 * Math.log(v / s.min)) / Math.log(s.max / s.min) : v);
const fromUI = (s, u) => (s.log ? s.min * Math.pow(s.max / s.min, u / 1000) : u);

// Сдвигаем центр кадра, чтобы выбранная планета не пряталась за панелью.
function updateViewOffset() {
  const w = window.innerWidth, h = window.innerHeight;
  if (!state.selected) camera.clearViewOffset();
  else if (w <= 860) camera.setViewOffset(w, h, 0, h * 0.24, w, h);
  else camera.setViewOffset(w, h, Math.min(200, w * 0.14), 0, w, h);
  camera.updateProjectionMatrix();
}

function interiorHTML(id, radiusKm) {
  const layers = INTERIOR[id];
  return `
    <h3>Внутреннее строение</h3>
    <button id="cutBtn" class="cut wide"></button>
    <ol class="layers">
      ${layers.map((L, i) => {
        const inner = layers[i + 1]?.r ?? 0;
        const from = Math.round((1 - L.r) * radiusKm), to = Math.round((1 - inner) * radiusKm);
        return `<li>
          <span class="swatch" style="background:${L.color}"></span>
          <div><b>${L.name}</b><small>глубина ${fmt(from, 0)} – ${fmt(to, 0)} км · ${L.temp}</small><p>${L.text}</p></div>
        </li>`;
      }).join('')}
    </ol>`;
}

function renderCutButton() {
  const btn = $('#cutBtn');
  if (!btn) return;
  const on = state.cut && state.cut === state.selected;
  btn.textContent = on ? 'Собрать обратно' : 'Разрезать и заглянуть внутрь';
  btn.classList.toggle('active', !!on);
}

function toggleCut() {
  if (!state.selected) return;
  setCut(state.cut === state.selected ? null : state.selected);
}

function renderInfo() {
  const sel = state.selected;
  document.body.classList.toggle('info-open', !!sel);
  updateViewOffset();
  if (!sel) return;
  const d = sel === 'sun' ? SUN : sel.base;
  const fact = d.facts[Math.floor(Math.random() * d.facts.length)];
  let html = `
    <p class="kicker">${d.type}</p>
    <h2>${d.name}</h2>
    <p class="desc">${d.description}</p>
    <div class="fact"><span>Знаете ли вы?</span>${fact}</div>`;

  if (sel === 'sun') {
    html += `
      <h3>Характеристики</h3>
      <dl class="stats">
        <div><dt>Радиус</dt><dd>${fmt(SUN.radiusKm * Math.pow(state.sunMass, 0.8), 0)} км</dd></div>
        <div><dt>Масса</dt><dd>${fmt(SUN.massEarth * state.sunMass, 0)} масс Земли</dd></div>
        <div><dt>Температура поверхности</dt><dd>≈ ${fmt(SUN.tempC, 0)} °C</dd></div>
        <div><dt>Светимость</dt><dd>× ${fmt(luminosity(state.sunMass), 2)} от текущей</dd></div>
      </dl>
      ${interiorHTML('sun', SUN.radiusKm)}
      <p class="note">Изменить массу Солнца можно на левой панели. Тогда изменятся все орбитальные периоды
      (третий закон Кеплера) и температуры планет — звезда станет ярче или тусклее.</p>`;
  } else {
    html += `
      <h3>Сейчас</h3>
      <dl class="stats live">
        <div><dt>Расстояние до Солнца</dt><dd id="liveDist">—</dd></div>
        <div><dt>Скорость на орбите</dt><dd id="liveSpeed">—</dd></div>
        <div class="wide"><dt>Поверхность и климат</dt><dd class="text" id="climate">—</dd></div>
      </dl>
      <h3>Характеристики</h3>
      <dl class="stats" id="stats"></dl>
      <h3>Лаборатория «Что если?»</h3>
      <p class="note">Меняйте параметры — модель, поверхность и все расчёты обновятся сразу.</p>
      <div class="lab">
        ${LAB.map((s) => `
          <label class="slider">
            <span class="row"><span>${s.label}</span><output id="out-${s.key}"></output></span>
            <input type="range" id="lab-${s.key}" data-key="${s.key}" min="${s.log ? 0 : s.min}" max="${s.log ? 1000 : s.max}" step="${s.log ? 1 : s.step}">
          </label>`).join('')}
      </div>
      <button class="ghost wide" id="resetPlanet">Вернуть реальные значения</button>
      ${interiorHTML(sel.base.id, sel.base.radiusKm * sel.cur.radiusMul)}`;
  }
  $('#infoBody').innerHTML = html;
  info.scrollTop = 0;
  $('#cutBtn').addEventListener('click', toggleCut);
  renderCutButton();
  if (sel === 'sun') return;

  info.querySelectorAll('.lab input').forEach((input) => {
    const s = LAB.find((x) => x.key === input.dataset.key);
    input.value = toUI(s, sel.cur[s.key]);
    input.addEventListener('input', () => {
      sel.cur[s.key] = fromUI(s, +input.value);
      if (s.key === 'a' || s.key === 'e') rebuildOrbit(sel);
      if (s.key === 'radiusMul' || s.key === 'tilt') applyBodyScale(sel);
      markClimate(sel);
      renderStats();
    });
  });
  $('#resetPlanet').addEventListener('click', () => {
    sel.cur = freshParams(sel.base);
    applyBodyScale(sel);
    rebuildOrbit(sel);
    markClimate(sel);
    renderInfo();
  });
  renderStats();
}

function seasonsText(tilt) {
  if (tilt > 90) return `Ось «перевёрнута» — планета вращается в обратную сторону. ${seasonsText(180 - tilt)}`;
  if (tilt < 5) return 'Сезонов почти нет: освещённость круглый год одинакова.';
  if (tilt < 35) return 'Умеренные времена года, похожие на земные.';
  if (tilt < 60) return 'Очень резкие времена года.';
  return 'Экстремальные сезоны: долгий полярный день и полярная ночь почти по всей планете.';
}

function waterText(t, kind) {
  if (kind === 'gas' || kind === 'ice') return '<span class="badge">Нет твёрдой поверхности — температура указана для верхних облаков</span>';
  if (t < 0) return '<span class="badge cold">Вода на поверхности замерзает</span>';
  if (t <= 100) return '<span class="badge ok">Вода может быть жидкой</span>';
  return '<span class="badge hot">Вода выкипает</span>';
}

function durationText(hours) {
  if (hours < 48) return `${fmt(hours, 1)} ч`;
  if (hours < 24 * 730) return `${fmt(hours / 24, 1)} сут`;
  return `${fmt(hours / 24 / 365.256, 1)} лет`;
}

function renderStats() {
  const sel = state.selected;
  if (!sel || sel === 'sun' || !$('#stats')) return;
  LAB.forEach((s) => {
    const out = $(`#out-${s.key}`);
    if (!out) return;
    let v = `${fmt(sel.cur[s.key], s.d)}${s.unit ? ' ' + s.unit : ''}`;
    if (s.key === 'massMul') v = `× ${fmt(sel.cur.massMul, 2)}`;
    if (s.key === 'radiusMul') v = `× ${fmt(sel.cur.radiusMul, 2)}`;
    out.textContent = v;
  });
  const s = statsOf(sel);
  const real = sel.base;
  const year = s.T < 2 ? `${fmt(s.T * 365.256, 1)} земных сут` : `${fmt(s.T, 2)} земных лет`;
  $('#climate').textContent = climateText(sel, s.tSurfC);
  $('#stats').innerHTML = `
    <div><dt>Год (оборот вокруг Солнца)</dt><dd>${year}</dd></div>
    <div><dt>Солнечные сутки</dt><dd>${durationText(s.solarDay)}</dd></div>
    <div><dt>Радиус</dt><dd>${fmt(s.R, 0)} км</dd></div>
    <div><dt>Масса</dt><dd>${fmt(s.M, 3)} масс Земли</dd></div>
    <div><dt>Плотность</dt><dd>${fmt(s.density, 2)} г/см³</dd></div>
    <div><dt>Сила тяжести</dt><dd>${fmt(s.g, 2)} м/с² <small>(${fmt(s.g / 9.81, 2)} g)</small></dd></div>
    <div><dt>Вторая космическая скорость</dt><dd>${fmt(s.vEsc, 1)} км/с</dd></div>
    <div><dt>Перигелий / афелий</dt><dd>${fmt(s.perihelion, 3)} / ${fmt(s.aphelion, 3)} а.е.</dd></div>
    <div><dt>Скорость на орбите</dt><dd>${fmt(s.vPeri, 1)} … ${fmt(s.vAph, 1)} км/с</dd></div>
    <div><dt>Свет от Солнца идёт</dt><dd>${fmt(s.lightMin, 1)} мин</dd></div>
    <div><dt>Солнечного света</dt><dd>${fmt(s.flux * 100, 1)} % от земного</dd></div>
    <div><dt>Температура без атмосферы</dt><dd>${fmt(s.tEqC, 0)} °C</dd></div>
    <div class="wide"><dt>Средняя температура (с учётом атмосферы)</dt><dd>${fmt(s.tSurfC, 0)} °C</dd>${waterText(s.tSurfC, real.kind)}</div>
    <div class="wide"><dt>Времена года</dt><dd class="text">${seasonsText(sel.cur.tilt)}</dd></div>
    <div><dt>Спутников</dt><dd>${real.moons}</dd></div>
    <div class="wide you"><dt>Если вы весите ${fmt(state.userMass, 0)} кг на Земле</dt>
      <dd>здесь весы покажут <b>${fmt(s.weight, 1)} кг</b>, а прыжок в 50 см станет прыжком в <b>${fmt(s.jump * 100, 0)} см</b></dd></div>`;
}

function updateLive() {
  const sel = state.selected;
  if (!sel || sel === 'sun' || !$('#liveDist')) return;
  const E = eccentricAnomaly(sel.M, sel.cur.e);
  const r = sel.cur.a * (1 - sel.cur.e * Math.cos(E));
  const v = 29.78 * Math.sqrt(state.sunMass * (2 / r - 1 / sel.cur.a));
  $('#liveDist').textContent = `${fmt(r, 3)} а.е. · ${fmt((r * AU_KM) / 1e6, 1)} млн км`;
  $('#liveSpeed').textContent = `${fmt(v, 2)} км/с`;
}

// ---------- опыты ----------
const byId = (id) => bodies.find((b) => b.base.id === id);
function setParam(id, key, value) {
  const b = byId(id);
  b.cur[key] = value;
  applyBodyScale(b);
  rebuildOrbit(b);
  markClimate(b);
  if (state.selected === b) renderInfo();
}

const PRESETS = {
  'earth-venus': () => {
    setParam('earth', 'a', 0.723);
    select(byId('earth'));
    return 'Земля на орбите Венеры: солнечного света почти вдвое больше, год короче — 225 суток. Средняя температура около +60 °C: леса сменяются пустынями.';
  },
  'earth-mars': () => {
    setParam('earth', 'a', 1.524);
    select(byId('earth'));
    return 'Земля на орбите Марса: света на 57 % меньше, год длится 687 суток, а льды покрывают почти всю планету.';
  },
  'earth-ecc': () => {
    setParam('earth', 'e', 0.5);
    select(byId('earth'));
    setSpeed(40);
    return 'Вытянутая орбита: посмотрите, как Земля разгоняется возле Солнца и замедляется вдали от него — это второй закон Кеплера.';
  },
  'earth-tilt': () => {
    setParam('earth', 'tilt', 0);
    setShow('axes', true);
    select(byId('earth'));
    return 'Без наклона оси на Земле не было бы времён года: на каждой широте круглый год одна и та же погода.';
  },
  'jupiter-star': () => {
    setParam('jupiter', 'massMul', 80);
    select(byId('jupiter'));
    return 'Юпитер в 80 раз тяжелее: при такой массе давление в ядре запустило бы термоядерный синтез — Юпитер стал бы маленькой красной звездой.';
  },
  'sun-heavy': () => {
    setSunMass(1.5);
    setShow('hz', true);
    select(null);
    return 'Солнце в 1,5 раза массивнее: светит в 5 раз ярче, планеты обращаются быстрее, а зона, где возможна жидкая вода, отодвигается к Марсу.';
  },
};
function runPreset(id) {
  endScenario();
  const msg = PRESETS[id]();
  toast(msg, 9000);
  document.body.classList.remove('controls-open');
}

// ---------- сценарии ----------
const api = {
  reset: resetAll,
  select: (id) => select(id === 'sun' ? 'sun' : id ? byId(id) : null),
  set: setParam,
  speed: (v) => {
    setSpeed(v);
    setPaused(false);
  },
  show: setShow,
  cut: (id) => setCut(id === 'sun' ? 'sun' : byId(id)),
  sunMass: setSunMass,
  mode: (m) => {
    if (state.mode !== m) setMode(m);
  },
};
const SCENARIOS = buildScenarios(api);
const scenario = { s: null, step: 0 };

function startScenario(s) {
  scenario.s = s;
  scenario.step = 0;
  document.body.classList.add('scenario-on');
  document.body.classList.remove('controls-open');
  $('#scTitle').textContent = s.title;
  $('#scDots').innerHTML = s.steps.map((_, i) => `<button aria-label="Шаг ${i + 1}" data-i="${i}"></button>`).join('');
  $('#scDots').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => gotoStep(+b.dataset.i)));
  gotoStep(0);
}
function gotoStep(i) {
  const s = scenario.s;
  if (!s || i < 0 || i >= s.steps.length) return;
  // при переходе назад или вперёд через несколько шагов состояние собирается заново
  if (i !== scenario.step + 1) for (let k = 0; k < i; k++) s.steps[k].run();
  scenario.step = i;
  const st = s.steps[i];
  st.run();
  $('#scStep').textContent = `Шаг ${i + 1} из ${s.steps.length}`;
  $('#scHead').textContent = st.title;
  $('#scText').textContent = st.text;
  $('#scPrev').disabled = i === 0;
  $('#scNext').textContent = i === s.steps.length - 1 ? 'Завершить' : 'Далее';
  $('#scDots').querySelectorAll('button').forEach((b, k) => b.classList.toggle('active', k === i));
}
function endScenario() {
  if (!scenario.s) return;
  scenario.s = null;
  document.body.classList.remove('scenario-on');
}

let toastTimer;
function toast(msg, ms = 6000) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---------- запуск ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateViewOffset();
});

(async function start() {
  const bar = $('#loadBar'), text = $('#loadText');
  await buildPlanets((t, k) => {
    text.textContent = t;
    bar.style.width = `${Math.round(k * 100)}%`;
  });
  setupControls();
  setSunMass(1);
  rebuildAll();
  updateDate();
  $('#loading').classList.add('done');
  setTimeout(() => $('#hint').classList.add('hide'), 9000);
  requestAnimationFrame(tick);
})();
