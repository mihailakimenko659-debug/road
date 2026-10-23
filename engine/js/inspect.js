import * as THREE from 'three';
import { FLOOR_Y } from './engine.js';
import { TIMING } from './thermo.js';

// Осмотр одной детали: её копия ставится на поворотный столик, двигатель прячется.
// Материалы общие с двигателем, поэтому деталь выглядит так же, как в сборе.

// Что показывать для каждой подписи детали
const GROUPS = {
  piston: 'piston', rings: 'piston', pin: 'piston',
  rod: 'rod', crank: 'crank', damper: 'crank', flywheel: 'crank', sprocket: 'crank',
  camIn: 'camIn', camEx: 'camEx',
  valveIn: 'valveIn', valveEx: 'valveEx', spring: 'valveIn', bucket: 'valveIn', valveGuide: 'valveIn', valveSeal: 'valveIn', valveSeat: 'valveIn',
  plug: 'plug', coil: 'coil',
  head: 'head', gasket: 'head', thermostat: 'head',
  block: 'block', liner: 'block', bulkhead: 'block', coolant: 'block',
  cover: 'cover', pan: 'pan', oil: 'pan',
  intake: 'intake', throttle: 'intake', injector: 'intake', airbox: 'intake',
  exhaust: 'exhaust', belt: 'timing', chain: 'timing', tensioner: 'timing',
  alternator: 'alternator', oilFilter: 'oilFilter', starter: 'starter',
};
export const INSPECTABLE = [
  ['piston', 'Поршень'], ['rod', 'Шатун'], ['crank', 'Коленвал'], ['camIn', 'Впускной распредвал'], ['camEx', 'Выпускной распредвал'],
  ['valveIn', 'Впускной клапан'], ['valveEx', 'Выпускной клапан'], ['plug', 'Свеча'], ['coil', 'Катушка'],
  ['head', 'Головка блока'], ['block', 'Блок цилиндров'], ['cover', 'Клапанная крышка'], ['pan', 'Поддон'],
  ['intake', 'Впуск'], ['exhaust', 'Выпуск'], ['timing', 'Привод ГРМ'],
];
export const groupOf = (key) => GROUPS[key] || key;

function collect(e, g) {
  const d = e.d;
  const near0 = (o) => { const p = new THREE.Vector3(); o.getWorldPosition(p); e.root.worldToLocal(p); return Math.abs(p.x - d.xs[0]) < d.pitch * 0.45; };
  const by = (root, keys, filter) => { const out = []; root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && keys.includes(o.userData.part) && (!filter || filter(o))) out.push(o); }); return out; };
  switch (g) {
    case 'piston': return [e.cyl[0].piston];
    case 'rod': return [e.cyl[0].rod];
    case 'crank': return [e.crank];
    case 'camIn': return [e.cams.in];
    case 'camEx': return [e.cams.ex];
    case 'valveIn': case 'valveEx': {
      const v = e.valves.find((x) => x.cyl === 0 && x.type === (g === 'valveIn' ? 'in' : 'ex'));
      return by(v.frame, ['valveIn', 'valveEx', 'spring', 'bucket', 'valveGuide', 'valveSeal', 'valveSeat']);
    }
    case 'plug': return [e.plugs[0]];
    case 'coil': return by(e.groups.cover, ['coil'], near0);
    case 'head': return by(e.groups.head, ['head', 'gasket', 'thermostat']);
    case 'block': return by(e.groups.block, ['block', 'liner', 'bulkhead']);
    case 'cover': return by(e.groups.cover, ['cover']);
    case 'pan': return by(e.groups.pan, ['pan', 'oil']);
    case 'intake': return by(e.groups.intake, ['intake', 'throttle', 'injector', 'airbox']);
    case 'exhaust': return by(e.groups.exhaust, ['exhaust']);
    case 'timing': return by(e.groups.timing, ['belt', 'chain', 'sprocket', 'tensioner']);
    default: return by(e.root, [g]);
  }
}

// Размеры детали для выбранного мотора
export function specsOf(g, e, def) {
  const d = e.d, f = (x, n = 1) => x.toLocaleString('ru-RU', { maximumFractionDigits: n });
  const mm = (x) => `${f(x)} мм`;
  const iron = e.look.block === 'iron';
  switch (g) {
    case 'piston': return [['Диаметр', mm(d.B - 0.6)], ['Высота', mm(d.pistonH)], ['Компрессионная высота', mm(d.ch)], ['Палец', `Ø ${mm(2 * d.ppR)}`], ['Колец', '3: два компрессионных и маслосъёмное']];
    case 'rod': return [['Расстояние между головками', mm(d.L)], ['Нижняя головка', `Ø ${mm(2 * d.pinR)}`], ['Верхняя головка', `Ø ${mm(2 * d.ppR)}`], ['Отношение L / R', f(d.L / d.r, 2)]];
    case 'crank': return [['Радиус кривошипа', `${mm(d.r)} (ход ${mm(d.S)})`], ['Коренные шейки', `${d.n + 1} × Ø ${mm(2 * d.mainR)}`], ['Шатунные шейки', `${d.n} × Ø ${mm(2 * d.pinR)}`], ['Порядок работы', e.layout.order]];
    case 'camIn': return [['Подъём клапана', mm(TIMING.liftIn)], ['Открытие', `${-TIMING.ivo}° до ВМТ`], ['Закрытие', `${TIMING.ivDur + TIMING.ivo - 180}° после НМТ`], ['Кулачков', String(d.n * 2)], ['Скорость', 'вдвое медленнее коленвала']];
    case 'camEx': return [['Подъём клапана', mm(TIMING.liftEx)], ['Открытие', `${540 - TIMING.evo}° до НМТ`], ['Закрытие', `${TIMING.evo + TIMING.evDur - 720}° после ВМТ`], ['Кулачков', String(d.n * 2)], ['Скорость', 'вдвое медленнее коленвала']];
    case 'valveIn': return [['Тарелка', `Ø ${mm(2 * d.vIn.rh)}`], ['Стержень', `Ø ${mm(0.07 * d.B)}`], ['Длина', mm(d.Ls)], ['Ход', mm(TIMING.liftIn)], ['Наклон оси', `${f(d.tv * 180 / Math.PI, 0)}°`]];
    case 'valveEx': return [['Тарелка', `Ø ${mm(2 * d.vEx.rh)}`], ['Стержень', `Ø ${mm(0.07 * d.B)}`], ['Длина', mm(d.Ls)], ['Ход', mm(TIMING.liftEx)], ['Наклон оси', `${f(d.tv * 180 / Math.PI, 0)}°`]];
    case 'block': return [['Цилиндров', String(d.n)], ['Диаметр цилиндра', mm(d.B)], ['Материал', iron ? 'чугун' : 'алюминий, гильзы чугунные'], ['Рабочий объём', `${f(d.n * Math.PI * d.B ** 2 / 4 * d.S / 1e6, 2)} л`]];
    case 'head': return [['Клапанов', `${d.n * 4} (по 4 на цилиндр)`], ['Камера', 'шатровая'], ['Степень сжатия', `${f(def.cr || e.p.cr)} : 1`], ['Распредвалов', '2 (DOHC)']];
    case 'timing': return [['Привод', e.look.timing === 'chain' ? 'цепь' : 'зубчатый ремень'], ['Передаточное число', '2 : 1']];
    default: return [];
  }
}

export class Inspector {
  constructor(scene) {
    this.scene = scene;
    this.stage = new THREE.Group();
    this.stage.visible = false;
    scene.add(this.stage);
    // поворотный столик
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.5, 64), new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.32, metalness: 0.05 }));
    ped.receiveShadow = true; ped.castShadow = true;
    this.ped = ped;
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.025, 8, 96), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
    this.ring.rotation.x = Math.PI / 2;
    this.stage.add(ped, this.ring);
    this.turn = new THREE.Group();
    this.stage.add(this.turn);
    this.part = null;
  }

  // возвращает центр и размер детали — по ним ставится камера
  show(engine, g) {
    this.clear();
    const src = collect(engine, g);
    if (!src.length) return null;
    engine.root.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(engine.root.matrixWorld).invert();
    const holder = new THREE.Group();
    for (const o of src) {
      const c = o.clone(true);
      c.traverse((x) => { if (x.isPoints || x.isInstancedMesh) x.visible = false; });
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      m.decompose(c.position, c.quaternion, c.scale);
      holder.add(c);
    }
    // ставим деталь центром на ось столика
    const box = new THREE.Box3().setFromObject(holder);
    const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    holder.position.sub(ctr);
    // самая длинная сторона детали — 3,6 единицы сцены (мелкие детали увеличены, крупные уменьшены)
    const sc = 3.6 / Math.max(size.x, size.y, size.z);
    this.turn.scale.setScalar(sc);
    this.turn.add(holder);
    const yBase = FLOOR_Y / 100 + 1.1;
    this.ped.position.y = yBase - 0.25; this.ring.position.y = yBase;
    this.turn.position.set(0, yBase + 0.15 + size.y * sc / 2, 0);
    this.scaleNote = sc / 0.01; // во сколько раз крупнее, чем в сборе
    this.turn.rotation.set(0, 0.6, 0);
    this.stage.visible = true;
    this.part = g;
    return { center: this.turn.position.clone(), radius: 2.2, scale: this.scaleNote };
  }

  clear() {
    while (this.turn.children.length) this.turn.remove(this.turn.children[0]);
    this.stage.visible = false;
    this.part = null;
  }

  update(dt, spin) { if (this.part && spin) this.turn.rotation.y += dt * 0.35; }
}
