import { STROKES, TIMING, liftIn, liftEx, wrap720 } from './thermo.js';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const STROKE_COLORS = () => ({ intake: css('--intake'), compression: css('--compress'), power: css('--fire'), exhaust: css('--exhaust') });

function setup(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  return { g, w, h };
}

function niceStep(range, target) {
  const raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

function axes(g, x0, y0, x1, y1, xt, yt, xl, yl) {
  const grid = css('--grid'), muted = css('--muted');
  g.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
  g.fillStyle = muted; g.strokeStyle = grid; g.lineWidth = 1;
  for (const t of xt) { g.beginPath(); g.moveTo(t.px, y0); g.lineTo(t.px, y1); g.stroke(); g.textAlign = 'center'; g.fillText(t.label, t.px, y0 + 13); }
  for (const t of yt) { g.beginPath(); g.moveTo(x0, t.py); g.lineTo(x1, t.py); g.stroke(); g.textAlign = 'right'; g.fillText(t.label, x0 - 5, t.py + 3); }
  g.textAlign = 'left'; g.fillText(yl, x0 + 4, y1 + 11);
  g.textAlign = 'right'; g.fillText(xl, x1, y0 - 5);
}

export function drawPV(canvas, cyc, alpha, log) {
  const { g, w, h } = setup(canvas);
  const C = STROKE_COLORS();
  const x0 = 38, x1 = w - 10, y0 = h - 20, y1 = 8;
  const vmin = cyc.V[0] * 1e6, vmax = cyc.V[180] * 1e6;
  const pmaxBar = Math.max(10, cyc.pmax / 1e5 * 1.08);
  const pminLog = 0.2;
  const X = (v) => x0 + (v * 1e6 - 0) / (vmax * 1.04) * (x1 - x0);
  const Y = log ? (p) => y0 - (Math.log10(Math.max(pminLog, p / 1e5)) - Math.log10(pminLog)) / (Math.log10(pmaxBar) - Math.log10(pminLog)) * (y0 - y1)
    : (p) => y0 - (p / 1e5) / pmaxBar * (y0 - y1);
  const xt = []; const sx = niceStep(vmax, 4);
  for (let v = 0; v <= vmax * 1.04; v += sx) xt.push({ px: x0 + v / (vmax * 1.04) * (x1 - x0), label: v.toFixed(0) });
  const yt = [];
  if (log) for (const p of [0.5, 1, 2, 5, 10, 20, 50, 100]) { if (p <= pmaxBar) yt.push({ py: Y(p * 1e5), label: String(p) }); }
  else { const sy = niceStep(pmaxBar, 4); for (let p = 0; p <= pmaxBar; p += sy) yt.push({ py: Y(p * 1e5), label: p.toFixed(0) }); }
  axes(g, x0, y0, x1, y1, xt, yt, 'V, см³', 'p, бар');
  // ВМТ / НМТ
  g.strokeStyle = css('--muted'); g.setLineDash([3, 3]);
  for (const v of [cyc.V[0], cyc.V[180]]) { g.beginPath(); g.moveTo(X(v), y0); g.lineTo(X(v), y1); g.stroke(); }
  g.setLineDash([]);
  g.fillStyle = css('--muted'); g.textAlign = 'center';
  g.textAlign = 'left'; g.fillText('ВМТ', X(cyc.V[0]) + 4, (y0 + y1) / 2); g.textAlign = 'right'; g.fillText('НМТ', X(cyc.V[180]) - 4, y1 + 26);
  for (const s of STROKES) {
    g.strokeStyle = C[s.key]; g.lineWidth = 2; g.beginPath();
    for (let a = s.from; a <= s.to; a++) { const px = X(cyc.V[a]), py = Y(cyc.P[a]); a === s.from ? g.moveTo(px, py) : g.lineTo(px, py); }
    g.stroke();
  }
  const a = Math.round(wrap720(alpha));
  marker(g, X(cyc.V[a]), Y(cyc.P[a]));
}

export function drawPA(canvas, cyc, alpha, vvt) {
  const { g, w, h } = setup(canvas);
  const C = STROKE_COLORS();
  const x0 = 38, x1 = w - 10, y0 = h - 20, y1 = 8;
  const pmaxBar = Math.max(10, cyc.pmax / 1e5 * 1.08);
  const X = (a) => x0 + a / 720 * (x1 - x0);
  const Y = (p) => y0 - (p / 1e5) / pmaxBar * (y0 - y1);
  for (const s of STROKES) { g.fillStyle = C[s.key]; g.globalAlpha = 0.09; g.fillRect(X(s.from), y1, X(s.to) - X(s.from), y0 - y1); }
  g.globalAlpha = 1;
  const xt = [0, 180, 360, 540, 720].map((a) => ({ px: X(a), label: String(a) }));
  const yt = []; const sy = niceStep(pmaxBar, 4); for (let p = 0; p <= pmaxBar; p += sy) yt.push({ py: Y(p * 1e5), label: p.toFixed(0) });
  axes(g, x0, y0, x1, y1, xt, yt, '° КВ', 'p, бар');
  // подъём клапанов (внизу, своя шкала)
  const LY = (l) => y0 - l / 10 * (y0 - y1) * 0.3;
  for (const [f, col] of [[(a) => liftIn(a, vvt), C.intake], [liftEx, C.exhaust]]) {
    g.strokeStyle = col; g.lineWidth = 1.4; g.globalAlpha = 0.85; g.beginPath();
    for (let a = 0; a <= 720; a += 2) { const px = X(a), py = LY(f(a)); a ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke(); g.globalAlpha = 1;
  }
  // зажигание
  g.strokeStyle = css('--spark'); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(X(cyc.ign), y0); g.lineTo(X(cyc.ign), y1); g.stroke(); g.setLineDash([]);
  g.fillStyle = css('--spark'); g.textAlign = 'right'; g.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
  g.fillText('искра', X(cyc.ign) - 3, y1 + 22);
  g.strokeStyle = css('--fg'); g.lineWidth = 1.8; g.beginPath();
  for (let a = 0; a <= 720; a++) { const px = X(a), py = Y(cyc.P[a]); a ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
  const a = Math.round(wrap720(alpha));
  g.strokeStyle = css('--accent'); g.lineWidth = 1; g.beginPath(); g.moveTo(X(a), y0); g.lineTo(X(a), y1); g.stroke();
  marker(g, X(a), Y(cyc.P[a]));
}

function marker(g, x, y) {
  g.fillStyle = css('--accent'); g.strokeStyle = css('--bg'); g.lineWidth = 2;
  g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.stroke();
}

// Полосы тактов для всех цилиндров
export function drawCycles(canvas, engine, watch) {
  const { g, w, h } = setup(canvas);
  const C = STROKE_COLORS();
  const n = engine.cyl.length;
  const x0 = 30, x1 = w - 8;
  const rowH = Math.min(18, (h - 16) / n);
  g.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
  engine.cyl.forEach((c, i) => {
    const y = 4 + i * rowH;
    g.fillStyle = i === watch ? css('--fg') : css('--muted');
    g.textAlign = 'left'; g.fillText('Ц' + (i + 1), 2, y + rowH * 0.68);
    // полоса: сегменты такта, сдвинутые по фазе цилиндра (ось — угол коленвала)
    for (const s of STROKES) {
      for (const [a0, a1] of split(s.from + c.off, s.to + c.off)) {
        g.fillStyle = C[s.key]; g.globalAlpha = i === watch ? 0.95 : 0.6;
        g.fillRect(x0 + a0 / 720 * (x1 - x0), y + 2, (a1 - a0) / 720 * (x1 - x0) - 1, rowH - 5);
      }
    }
    g.globalAlpha = 1;
  });
  const theta = wrap720(engine.theta);
  const px = x0 + theta / 720 * (x1 - x0);
  g.strokeStyle = css('--fg'); g.lineWidth = 2; g.beginPath(); g.moveTo(px, 1); g.lineTo(px, 4 + n * rowH); g.stroke();
  g.fillStyle = css('--muted'); g.textAlign = 'center';
  for (const a of [0, 180, 360, 540, 720]) g.fillText(String(a), x0 + a / 720 * (x1 - x0), h - 2);
}
function split(a0, a1) {
  const s = wrap720(a0), e = s + (a1 - a0);
  return e <= 720 ? [[s, e]] : [[s, 720], [0, e - 720]];
}

// Внешняя скоростная характеристика: момент и мощность по оборотам при полном газе
export function drawDyno(canvas, curve, rated, cur, run) {
  const { g, w, h } = setup(canvas);
  const x0 = 34, x1 = w - 34, y0 = h - 20, y1 = 10;
  const rMax = curve[curve.length - 1].rpm, rMin = 0;
  const tMax = Math.max(...curve.map((c) => c.t), rated ? rated.torque : 0) * 1.3;
  const pMax = Math.max(...curve.map((c) => c.p), rated ? rated.power : 0) * 1.18;
  const X = (r) => x0 + (r - rMin) / (rMax - rMin) * (x1 - x0);
  const YT = (t) => y0 - t / tMax * (y0 - y1), YP = (p) => y0 - p / pMax * (y0 - y1);
  const step = rMax > 7000 ? 2000 : 1000;
  const xt = []; for (let r = 0; r <= rMax; r += step) xt.push({ px: X(r), label: String(r / 1000) });
  const yt = []; const sy = niceStep(tMax, 4); for (let t = 0; t <= tMax; t += sy) yt.push({ py: YT(t), label: t.toFixed(0) });
  axes(g, x0, y0, x1, y1, xt, yt, 'тыс. об/мин', 'Н·м');
  g.fillStyle = css('--accent'); g.textAlign = 'left'; g.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
  const sp = niceStep(pMax, 4); for (let p = 0; p <= pMax; p += sp) g.fillText(p.toFixed(0), x1 + 5, YP(p) + 3);
  g.textAlign = 'right'; g.fillText('кВт', x1 + 30, y1 + 11);
  const pts = run ? curve.filter((c) => c.rpm <= run.rpm) : curve;
  for (const [key, Y, col] of [['t', YT, css('--cool')], ['p', YP, css('--accent')]]) {
    g.strokeStyle = col; g.lineWidth = 2; g.globalAlpha = run ? 1 : 0.95; g.beginPath();
    pts.forEach((c, i) => (i ? g.lineTo(X(c.rpm), Y(c[key])) : g.moveTo(X(c.rpm), Y(c[key]))));
    g.stroke();
  }
  g.globalAlpha = 1;
  if (rated) {
    const mark = (x, y, col, label, below) => {
      g.strokeStyle = col; g.lineWidth = 1.5; g.fillStyle = css('--panel-solid') || '#1c2330';
      g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = col; g.textAlign = 'center'; g.fillText(label, Math.min(x1 - 20, Math.max(x0 + 20, x)), y + (below ? 17 : -9));
    };
    // момент подписываем над точкой, мощность — под ней, чтобы не налезали
    mark(X(rated.torqueRpm), YT(rated.torque), css('--cool'), `${rated.torque} Н·м`, false);
    mark(X(rated.powerRpm), YP(rated.power), css('--accent'), `${rated.power} кВт`, true);
  }
  if (cur) { g.fillStyle = css('--fg'); g.beginPath(); g.arc(X(cur.rpm), YT(Math.max(0, cur.t)), 4, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(X(cur.rpm), YP(Math.max(0, cur.p)), 4, 0, Math.PI * 2); g.fill(); }
}
