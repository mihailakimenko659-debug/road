// Термодинамика одного цилиндра 4-тактного бензинового двигателя (цикл Отто).
// Модель учебная, но честная по порядку величин: первый закон термодинамики
// для закрытой фазы (сжатие → сгорание → расширение), закон сгорания Вибе,
// упрощённые впуск и выпуск, потери на трение по формуле Хейвуда.
//
// Угол α — угол цикла цилиндра в градусах поворота коленвала, 0…720:
//   0 — ВМТ в начале впуска, 180 — НМТ, 360 — ВМТ сжатия (вспышка), 540 — НМТ.

export const TIMING = {
  ivo: -12,      // впускной открывается за 12° до ВМТ
  ivDur: 244,    // и закрывается через 52° после НМТ
  evo: 490,      // выпускной открывается за 50° до НМТ
  evDur: 244,    // и закрывается через 14° после ВМТ
  liftIn: 9.2,   // мм
  liftEx: 8.6,
};

export const STROKES = [
  { key: 'intake', name: 'Впуск', from: 0, to: 180 },
  { key: 'compression', name: 'Сжатие', from: 180, to: 360 },
  { key: 'power', name: 'Рабочий ход', from: 360, to: 540 },
  { key: 'exhaust', name: 'Выпуск', from: 540, to: 720 },
];

export const wrap720 = (a) => ((a % 720) + 720) % 720;

export function strokeOf(alpha) {
  const a = wrap720(alpha);
  return STROKES[Math.min(3, Math.floor(a / 180))];
}

// Подъём клапана: плавный профиль кулачка (без удара на сбеге)
export function valveLift(alpha, open, dur, max) {
  const t = wrap720(alpha - open);
  if (t >= dur) return 0;
  const s = Math.sin(Math.PI * t / dur);
  return max * Math.pow(s, 1.55);
}

export const liftIn = (alpha, vvt = 0) => valveLift(alpha, TIMING.ivo - vvt, TIMING.ivDur, TIMING.liftIn);
export const liftEx = (alpha) => valveLift(alpha, TIMING.evo, TIMING.evDur, TIMING.liftEx);

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Положение поршня: расстояние от ВМТ, м
export function pistonTravel(alphaDeg, r, L) {
  const th = alphaDeg * Math.PI / 180;
  const s = Math.sin(th);
  return r + L - (r * Math.cos(th) + Math.sqrt(L * L - r * r * s * s));
}

/**
 * p: { bore, stroke, rod (мм), cr, rpm, throttle (0…1), advance (°), vvt (°), cylinders }
 * Возвращает таблицы по градусам (0…720) и итоговые показатели.
 */
export function computeCycle(p) {
  const R = 287, LHV = 43.4e6, AFR = 14.7;
  const B = p.bore / 1000, S = p.stroke / 1000, r = S / 2, L = p.rod / 1000;
  const A = Math.PI * B * B / 4, Vd = A * S, Vc = Vd / (p.cr - 1);
  const vol = (a) => Vc + A * pistonTravel(a, r, L);
  const rpmK = p.rpm / 1000;

  // Давление во впускном коллекторе определяется дросселем
  const pMan = (0.26 + 0.74 * Math.pow(p.throttle, 0.85)) * 1e5;
  // Наполнение: лучше всего около 4500 об/мин, впускной распредвал его сдвигает
  // ve — наполнение конкретного мотора (подобрано под паспортные момент и мощность)
  const ve = p.ve || { max: 0.94, peak: 4.5, k: 0.011 };
  const vvtPeak = ve.peak + p.vvt * 0.06;
  const etaV = clamp(ve.max - ve.k * (rpmK - vvtPeak) ** 2 - Math.abs(p.vvt) * 0.0015, 0.45, 1.25);
  const pExh = 1.03e5 + 0.006e5 * rpmK * rpmK;
  const Tin = 318;
  const resid = clamp(0.035 + 0.11 * (1 - p.throttle) * (1 - rpmK / 9), 0.03, 0.2);
  const mAir = etaV * pMan * Vd / (R * Tin);
  const mFuel = mAir / AFR;
  const mTot = (mAir + mFuel) / (1 - resid);
  const Qfuel = mFuel * LHV;
  const lossFrac = clamp(0.11 + 0.07 * (1 - rpmK / 7), 0.1, 0.22);
  const Qnet = Qfuel * 0.97 * (1 - lossFrac);

  const ign = 360 - p.advance;
  const burn = 38 + 2.4 * rpmK + 16 * (1 - p.throttle);  // длительность сгорания, ° КВ
  const wiebe = (a) => (a <= ign ? 0 : 1 - Math.exp(-5 * Math.pow((a - ign) / burn, 3)));

  const N = 721;
  const P = new Float64Array(N), V = new Float64Array(N), T = new Float64Array(N);
  const XB = new Float64Array(N), FRESH = new Float64Array(N), HR = new Float64Array(N);
  for (let a = 0; a < N; a++) V[a] = vol(a);

  // Закрытая фаза: от НМТ впуска до открытия выпускного клапана
  const T180 = 335;
  const p180 = mTot * R * T180 / V[180];
  let pc = p180, a = 180, Tu = T180, TuMax = T180;
  const da = 0.25;
  P[180] = pc;
  while (a < TIMING.evo - 1e-9) {
    const V1 = vol(a), V2 = vol(a + da);
    const Tg = pc * V1 / (mTot * R);
    const gamma = clamp(1.38 - 0.1 * (Tg - 300) / 1800, 1.25, 1.38);
    const dQ = Qnet * (wiebe(a + da) - wiebe(a));
    const pn = pc + ((gamma - 1) * dQ - gamma * pc * (V2 - V1)) / V1;
    // температура несгоревшей смеси впереди фронта пламени (для оценки детонации)
    if (wiebe(a) < 0.9) { Tu = T180 * Math.pow(pn / p180, (1.33 - 1) / 1.33); TuMax = Math.max(TuMax, Tu); }
    pc = pn; a += da;
    const ai = Math.round(a);
    if (Math.abs(a - ai) < 1e-6) { P[ai] = pc; HR[ai] = dQ / da; }
  }
  const pEvo = P[TIMING.evo];
  const Tevo = pEvo * V[TIMING.evo] / (mTot * R);

  for (let i = 0; i < N; i++) {
    const al = i;
    if (al >= TIMING.evo) {
      // свободный выпуск: давление сбрасывается в коллектор, затем поршень выталкивает газы
      const bd = pExh + (pEvo - pExh) * Math.exp(-(al - TIMING.evo) / 11);
      P[i] = al < 700 ? bd : bd + (pMan * 0.97 - pExh) * smooth(700, 740, al);
    } else if (al < 180) {
      const start = pExh + (pMan * 0.97 - pExh) * smooth(-20, 20, al);
      P[i] = al < 150 ? start : start + (p180 - start) * smooth(150, 180, al);
    }
    XB[i] = al < ign ? 0 : (al < TIMING.evo ? wiebe(al) : 1);
    // доля свежей смеси в цилиндре
    if (al < 200) FRESH[i] = resid + (1 - resid) * smooth(-5, 190, al) ;
    else if (al < ign) FRESH[i] = 1;
    else FRESH[i] = 1 - XB[i];
    if (al >= TIMING.evo) FRESH[i] = 0;
    // температура
    if (al >= 180 && al <= TIMING.evo) T[i] = P[i] * V[i] / (mTot * R);
    else if (al > TIMING.evo) T[i] = Math.max(850, Tevo * Math.pow(P[i] / pEvo, 0.22));
    else T[i] = Tin + (Math.max(850, Tevo * Math.pow(pExh / pEvo, 0.22)) - Tin) * resid * 4 * (1 - smooth(0, 60, al)) + (T180 - Tin) * smooth(120, 180, al);
  }

  // Работа за цикл: ∮ p dV
  let W = 0;
  for (let i = 0; i < 720; i++) W += 0.5 * (P[i] + P[i + 1]) * (V[i + 1] - V[i]);
  const imep = W / Vd;
  const fmep = (0.97 + 0.15 * rpmK + 0.05 * rpmK * rpmK) * 1e5 * 0.85 * (p.fric || 1);
  const bmep = imep - fmep;
  const n = p.cylinders;
  const torque = bmep * Vd * n / (4 * Math.PI);
  const power = torque * 2 * Math.PI * p.rpm / 60;
  let pmax = 0, apmax = 0, Tmax = 0;
  for (let i = 0; i < N; i++) { if (P[i] > pmax) { pmax = P[i]; apmax = i; } if (T[i] > Tmax) Tmax = T[i]; }

  return {
    P, V, T, XB, FRESH, HR,
    Vd, Vc, displacement: Vd * n,
    ign, burn, pMan, etaV,
    imep, bmep, fmep, torque, power,
    etaI: W / Qfuel, etaE: Math.max(0, bmep * Vd / Qfuel),
    pmax, apmax, Tmax, TuMax,
    knock: TuMax > 1000,
    knockRisk: clamp((TuMax - 900) / 100, 0, 1.2),
    pistonSpeed: 2 * S * p.rpm / 60,
    fuelFlow: mFuel * n * p.rpm / 120, // кг/с
  };
}

// Лучший угол опережения при текущих условиях (по максимуму работы, без детонации)
export function bestAdvance(p) {
  let best = 0, bestT = -Infinity;
  for (let adv = 0; adv <= 45; adv += 1) {
    const c = computeCycle({ ...p, advance: adv });
    if (c.imep > bestT) { bestT = c.imep; best = adv; }
  }
  return best;
}
