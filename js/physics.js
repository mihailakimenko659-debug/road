// Формулы, по которым «лаборатория» пересчитывает свойства планеты.
export const AU_KM = 149597870.7;

// Светимость звезды главной последовательности растёт примерно как M^4.
export const luminosity = (sunMass) => Math.pow(sunMass, 4);

// Третий закон Кеплера: T² = a³ / M (годы, а.е., массы Солнца).
export const periodYears = (a, sunMass) => Math.sqrt((a * a * a) / sunMass);

// Решение уравнения Кеплера M = E − e·sin E методом Ньютона.
export function eccentricAnomaly(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 12; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

// Равновесная температура (без парникового эффекта), K.
export const equilibriumK = (a, albedo, sunMass) =>
  (278.6 * Math.pow(luminosity(sunMass), 0.25) * Math.pow(1 - albedo, 0.25)) / Math.sqrt(a);

export function computeStats(base, cur, sunMass, userMass) {
  const R = base.radiusKm * cur.radiusMul;
  const M = base.massEarth * cur.massMul;
  const rE = R / 6371;
  const g = (9.81 * M) / (rE * rE);
  const vEsc = 11.186 * Math.sqrt(M / rE);
  const density = (5.514 * M) / (rE * rE * rE);
  const T = periodYears(cur.a, sunMass);
  const vOrb = 29.78 * Math.sqrt(sunMass / cur.a);
  const vPeri = vOrb * Math.sqrt((1 + cur.e) / (1 - cur.e));
  const vAph = vOrb * Math.sqrt((1 - cur.e) / (1 + cur.e));
  const flux = luminosity(sunMass) / (cur.a * cur.a);

  // Поправка на атмосферу берётся из реальной планеты: разница между
  // наблюдаемой температурой и равновесной при исходных параметрах.
  const greenhouse = base.tempC + 273.15 - equilibriumK(base.a, base.albedo, 1);
  const tEqC = equilibriumK(cur.a, cur.albedo, sunMass) - 273.15;
  const tSurfC = tEqC + greenhouse;

  const orbitHours = T * 365.256 * 24;
  const solarDay = 1 / Math.abs(1 / cur.rotation - 1 / orbitHours);

  return {
    R, M, g, vEsc, density, T, vOrb, vPeri, vAph, flux, tEqC, tSurfC, solarDay,
    perihelion: cur.a * (1 - cur.e),
    aphelion: cur.a * (1 + cur.e),
    lightMin: (cur.a * 499.005) / 60,
    weight: (userMass * g) / 9.81,
    jump: (0.5 * 9.81) / g,
  };
}

// Границы обитаемой зоны (консервативная оценка), а.е.
export const habitableZone = (sunMass) => {
  const s = Math.sqrt(luminosity(sunMass));
  return [0.95 * s, 1.67 * s];
};
