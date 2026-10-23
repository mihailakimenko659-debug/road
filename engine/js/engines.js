// Реальные двигатели для стенда. Паспортные данные — опубликованные производителями
// цифры для указанной версии. ve и fric — подобраны так, чтобы модель при полном газе
// и лучшем угле зажигания выдавала паспортные момент и мощность (см. README).

export const ENGINES = {
  vaz21126: {
    name: 'ВАЗ-21126', maker: 'АвтоВАЗ', since: 'с 2007 года', cars: 'Lada Priora, Kalina, Granta',
    cylinders: 4, bore: 82, stroke: 75.6, rod: 133.02, cr: 11.0,
    rated: { power: 72, powerRpm: 5600, torque: 145, torqueRpm: 4000 }, redline: 6200, idle: 850,
    ve: { max: 0.98, peak: 4.25, k: 0.026 }, fric: 1,
    look: { block: 'iron', cover: 0xb9bdc2, coverRough: 0.38, label: ['ВАЗ', '21126', '16V'], intake: 'plastic', timing: 'belt' },
    facts: [
      'Чугунный блок, алюминиевая головка с 16 клапанами и гидрокомпенсаторами.',
      'Облегчённая поршневая группа: поршень с короткой юбкой и длинный шатун.',
      'ГРМ — зубчатый ремень. Если он оборвётся, поршни встречаются с открытыми клапанами.',
    ],
  },
  k20a: {
    name: 'Honda K20A', maker: 'Honda', since: '2001–2006, версия Type R', cars: 'Integra Type R (DC5), Civic Type R',
    cylinders: 4, bore: 86, stroke: 86, rod: 139, cr: 11.5,
    rated: { power: 162, powerRpm: 8000, torque: 206, torqueRpm: 7000 }, redline: 8400, idle: 800,
    ve: { max: 1.14, peak: 7.75, k: 0.026 }, fric: 0.75,
    look: { block: 'alu', cover: 0xb3262c, coverRough: 0.5, label: ['DOHC', 'i-VTEC', ''], intake: 'alu', timing: 'chain' },
    facts: [
      'Высокооборотистый мотор: максимум мощности — при 8000 об/мин.',
      'Система i-VTEC на высоких оборотах переключает клапаны на второй, «острый» профиль кулачков.',
      'Алюминиевый блок, цепь ГРМ, квадратная размерность 86×86 мм.',
    ],
  },
  skyactiv: {
    name: 'Mazda Skyactiv-G 2.0', maker: 'Mazda', since: 'с 2011 года', cars: 'Mazda 3, Mazda 6, CX-5',
    cylinders: 4, bore: 83.5, stroke: 91.2, rod: 150, cr: 14.0,
    rated: { power: 121, powerRpm: 6000, torque: 210, torqueRpm: 4000 }, redline: 6500, idle: 650,
    ve: { max: 1.1, peak: 4.75, k: 0.026 }, fric: 1,
    look: { block: 'alu', cover: 0x2e3238, coverRough: 0.55, label: ['SKYACTIV', '-G', '2.0'], intake: 'plastic', timing: 'chain' },
    facts: [
      'Степень сжатия 14:1 — Mazda заявляла её как самую высокую среди серийных бензиновых моторов.',
      'Чтобы такой мотор не детонировал, нужны поздняя вспышка на малых оборотах и выпуск «4-2-1».',
      'Длинный ход поршня (91,2 мм) — момент на средних оборотах.',
    ],
  },
  m54b30: {
    name: 'BMW M54B30', maker: 'BMW', since: '2000–2006', cars: 'BMW 330i (E46), 530i (E39, E60), X5 3.0i',
    cylinders: 6, bore: 84, stroke: 89.6, rod: 135, cr: 10.2,
    rated: { power: 170, powerRpm: 5900, torque: 300, torqueRpm: 3500 }, redline: 6500, idle: 700,
    ve: { max: 1.12, peak: 4.5, k: 0.012 }, fric: 1,
    look: { block: 'alu', cover: 0x3a3d42, coverRough: 0.5, label: ['M54', 'B30', '24V'], intake: 'plastic', timing: 'chain' },
    facts: [
      'Рядная «шестёрка» полностью уравновешена: силы инерции поршней гасят друг друга.',
      'Алюминиевый блок с чугунными гильзами, цепь ГРМ, двойной VANOS — фазовращатели на обоих распредвалах.',
      'Порядок работы 1-5-3-6-2-4: вспышка каждые 120° поворота вала.',
    ],
  },
  k1kr: {
    name: 'Toyota 1KR-FE', maker: 'Toyota', since: 'с 2004 года', cars: 'Toyota Aygo, Citroën C1, Peugeot 107',
    cylinders: 3, bore: 71, stroke: 84, rod: 136, cr: 10.5,
    rated: { power: 50, powerRpm: 6000, torque: 93, torqueRpm: 3600 }, redline: 6500, idle: 750,
    ve: { max: 1.04, peak: 4.25, k: 0.02 }, fric: 1,
    look: { block: 'alu', cover: 0x24272b, coverRough: 0.6, label: ['1KR', '-FE', '12V'], intake: 'plastic', timing: 'chain' },
    facts: [
      'Литровая «тройка» для малолитражек. Алюминиевый блок, цепь ГРМ.',
      'Вспышки идут через 240° поворота вала — отсюда характерный «рокот» трёхцилиндрового мотора.',
      'Длинный ход при маленьком диаметре — ради экономичности на низких оборотах.',
    ],
  },
};

export const CUSTOM = {
  name: 'Свой двигатель', maker: '', since: '', cars: '',
  rated: null, redline: 7000, idle: 800, ve: { max: 0.94, peak: 4.5, k: 0.011 }, fric: 1,
  look: { block: 'alu', cover: 0xb3262c, coverRough: 0.5, label: ['DOHC', '', ''], intake: 'alu', timing: 'belt' },
  facts: ['Конструкцию задаёте вы: число цилиндров, диаметр, ход и степень сжатия.'],
};
