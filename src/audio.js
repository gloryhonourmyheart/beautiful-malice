/**
 * 极简 WebAudio 合成器：不需要任何音频素材，离线也能响。
 * 之后 C 同学要换成真实音效，只要保留这些方法名即可。
 */
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.humGain = null;
    this.enabled = false;
  }

  start() {
    if (this.enabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this._startHum();
      this.enabled = true;
    } catch (e) {
      console.warn('audio unavailable', e);
    }
  }

  _startHum() {
    const ctx = this.ctx;
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0.05;
    this.humGain.connect(this.master);

    [58, 87, 116].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.4 / (i + 1);
      o.connect(g).connect(this.humGain);
      o.start();
    });

    // 空调底噪
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const ng = ctx.createGain();
    ng.gain.value = 0.06;
    noise.connect(lp).connect(ng).connect(this.humGain);
    noise.start();
  }

  _tone(freq, dur, type = 'sine', vol = 0.14, slideTo = null) {
    if (!this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _noise(dur, freq, q, vol) {
    if (!this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
  }

  blip() { this._tone(660, 0.08, 'triangle', 0.06); }
  hover() { this._tone(440, 0.05, 'sine', 0.03); }

  laugh() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this._noise(0.16, 380 + Math.random() * 260, 2.2, 0.05), i * 130 + Math.random() * 60);
    }
  }

  tsk() { this._noise(0.12, 1600, 3, 0.05); }
  paper() { this._noise(0.22, 2600, 1.2, 0.06); }
  thud() { this._tone(90, 0.18, 'sine', 0.16, 55); }
  scrape() { this._noise(0.3, 900, 1.6, 0.05); }

  bell() {
    this._tone(880, 1.6, 'sine', 0.12);
    setTimeout(() => this._tone(1174, 1.4, 'sine', 0.09), 180);
    setTimeout(() => this._tone(880, 1.2, 'sine', 0.06), 900);
  }

  sting() {
    this._tone(220, 2.2, 'sine', 0.1, 110);
    this._tone(330, 2.0, 'triangle', 0.05, 165);
  }
}
