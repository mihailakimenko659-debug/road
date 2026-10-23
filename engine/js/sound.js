// Звук стенда: каждая вспышка в цилиндре — короткий глухой «хлопок» шумом через фильтр.
// Когда вспышек становится больше ~30 в секунду, хлопки сливаются в гул:
// его даёт генератор с частотой вспышек.
export class EngineSound {
  constructor() { this.ctx = null; this.on = false; }

  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = 0.0; this.master.connect(ctx.destination);
      const len = ctx.sampleRate * 0.25;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      this.osc = ctx.createOscillator(); this.osc.type = 'sawtooth'; this.osc.frequency.value = 40;
      this.oscLp = ctx.createBiquadFilter(); this.oscLp.type = 'lowpass'; this.oscLp.frequency.value = 300; this.oscLp.Q.value = 4;
      this.oscGain = ctx.createGain(); this.oscGain.gain.value = 0;
      this.osc.connect(this.oscLp).connect(this.oscGain).connect(this.master);
      this.osc.start();
    }
    this.ctx.resume();
    this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.1);
    this.on = true;
    return true;
  }

  stop() {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    this.on = false;
  }

  // rate — вспышек в секунду (с учётом замедления), load — нагрузка 0…1
  update(rate, load) {
    if (!this.on) return;
    const t = this.ctx.currentTime;
    const hum = Math.min(1, Math.max(0, (rate - 22) / 30));
    this.osc.frequency.setTargetAtTime(Math.max(20, rate), t, 0.05);
    this.oscLp.frequency.setTargetAtTime(220 + rate * 3 + load * 600, t, 0.08);
    this.oscGain.gain.setTargetAtTime(hum * (0.08 + 0.12 * load), t, 0.08);
    this.humLevel = hum;
  }

  fire(load) {
    if (!this.on || (this.humLevel || 0) > 0.85) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380 + load * 900;
    const g = ctx.createGain();
    const v = (0.35 + 0.65 * load) * (1 - (this.humLevel || 0));
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(lp).connect(g).connect(this.master);
    src.start(t); src.stop(t + 0.22);
    // низкий «удар»
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const og = ctx.createGain(); og.gain.setValueAtTime(v * 0.8, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(og).connect(this.master); o.start(t); o.stop(t + 0.16);
  }
}
