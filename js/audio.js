/* =========================================================
   上课偷吃 · 音频系统
   全部用 WebAudio 实时合成，不依赖任何音频文件
   另含中文老师语音（speechSynthesis，失败时静默，字幕照常显示）
   ========================================================= */
(function (global) {
  'use strict';

  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let muted = false;
  let started = false;

  // ---- 环境音 / 音乐 ----
  let hum = null;
  let musicTimer = null;
  let musicStep = 0;
  let nextNoteTime = 0;
  const BPM = 96;
  let musicWanted = false;
  let musicGainNode = null;

  // ---- 粉笔 ----
  let chalkTimer = null;
  let chalkOn = false;

  // ---- 心跳 ----
  let tension = 0;
  let lastBeat = 0;

  // ---- 停电氛围 ----
  let nightAmb = null;

  // ---- 语音 ----
  let voices = [];
  let zhVoice = null;
  let sichuanVoice = null;
  let voiceReady = false;
  let lastSayAt = 0;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.85;
      master.connect(ctx.destination);

      // 1 秒白噪声，反复复用
      const len = ctx.sampleRate;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      started = true;
    } catch (e) {
      console.warn('音频初始化失败', e);
      return false;
    }
    loadVoices();
    if (global.speechSynthesis) {
      global.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return true;
  }

  function loadVoices() {
    if (!global.speechSynthesis) return;
    voices = global.speechSynthesis.getVoices() || [];
    const pref = [
      /Tingting/i, /Ting-Ting/i, /Meijia/i, /Mei-Jia/i, /Sinji/i,
      /Xiaoxiao/i, /Huihui/i, /Yaoyao/i, /Lili/i, /female/i
    ];
    // 优先找系统里的四川话发音人（macOS 一般没有，Windows 也可能没有）
    sichuanVoice = voices.find(v =>
      /sichuan|四川|chengdu|成都|川话|川普/i.test(v.name) ||
      /sichuan|四川|chengdu|成都/i.test(v.lang)
    ) || null;
    const zh = voices.filter(v => /zh[-_]?(CN|Hans|SG)?/i.test(v.lang) || /Chinese|中文|普通话/.test(v.name));
    zhVoice = null;
    for (const p of pref) {
      const hit = zh.find(v => p.test(v.name));
      if (hit) { zhVoice = hit; break; }
    }
    if (!zhVoice && zh.length) zhVoice = zh[0];
    voiceReady = voices.length > 0;
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function gainEnv(node, t0, attack, hold, decay, peak) {
    const g = node;
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
    g.gain.setValueAtTime(Math.max(peak, 0.0002), t0 + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + decay);
  }

  function noise(dur, type, freq, q, peak, when) {
    if (!ctx) return;
    const t0 = when || now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq || 1800;
    f.Q.value = q || 1;
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(master);
    gainEnv(g, t0, 0.004, Math.max(0, dur * 0.25), Math.max(0.02, dur), peak || 0.2);
    src.start(t0);
    src.stop(t0 + dur + 0.08);
    return { src, g, f };
  }

  function tone(freq, dur, peak, type, when, slideTo) {
    if (!ctx) return;
    const t0 = when || now();
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    const g = ctx.createGain();
    o.connect(g); g.connect(master);
    gainEnv(g, t0, 0.006, Math.max(0, dur * 0.3), dur, peak || 0.15);
    o.start(t0);
    o.stop(t0 + dur + 0.08);
    return o;
  }

  /* ---------------- 音效 ---------------- */

  // 嚼东西：薯片 / 辣条 / 干脆面
  function crunch(style) {
    if (!ctx || muted) return;
    const t = now();
    if (style === 'chips') {
      noise(0.16, 'highpass', 2600 + Math.random() * 1800, 0.7, 0.22, t);
      noise(0.09, 'bandpass', 900, 1.2, 0.12, t + 0.01);
    } else if (style === 'noodle') {
      noise(0.13, 'bandpass', 1400 + Math.random() * 500, 1.5, 0.2, t);
      tone(110, 0.05, 0.05, 'square', t, 70);
    } else if (style === 'spicy') {
      noise(0.18, 'lowpass', 800, 0.8, 0.16, t);
      noise(0.1, 'bandpass', 2000, 2, 0.08, t + 0.02);
    } else {
      noise(0.12, 'bandpass', 1200, 1, 0.12, t);
    }
  }

  function sip() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.35, 'bandpass', 700, 3, 0.06, t);
    tone(420, 0.22, 0.05, 'sine', t, 260);
  }

  function gulp() {
    if (!ctx || muted) return;
    const t = now();
    tone(300, 0.12, 0.1, 'sine', t, 150);
    tone(240, 0.14, 0.08, 'sine', t + 0.17, 120);
  }

  function whoosh() {
    if (!ctx || muted) return;
    const t = now();
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(700, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(master);
    gainEnv(g, t, 0.08, 0.04, 0.28, 0.1);
    src.start(t); src.stop(t + 0.5);
  }

  function footstep() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.1, 'lowpass', 220, 0.8, 0.12, t);
    tone(85, 0.09, 0.07, 'sine', t, 55);
  }

  function chalkTick() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.07, 'bandpass', 3200 + Math.random() * 2000, 6, 0.05, t);
    if (Math.random() < 0.12) tone(2400 + Math.random() * 600, 0.09, 0.014, 'sawtooth', t, 3200);
  }

  function chalkThrow() {
    if (!ctx || muted) return;
    whoosh();
    const t = now() + 0.34;
    noise(0.06, 'highpass', 1800, 0.6, 0.3, t);
    tone(180, 0.08, 0.2, 'square', t, 90);
  }

  function heartBeat(intensity) {
    if (!ctx || muted) return;
    const t = now();
    tone(58, 0.16, 0.12 * intensity + 0.03, 'sine', t, 40);
    tone(52, 0.14, 0.07 * intensity + 0.02, 'sine', t + 0.19, 38);
  }

  function caught() {
    if (!ctx || muted) return;
    const t = now();
    tone(520, 0.2, 0.2, 'sawtooth', t, 330);
    tone(392, 0.2, 0.2, 'sawtooth', t + 0.18, 247);
    tone(262, 0.45, 0.22, 'sawtooth', t + 0.36, 98);
    noise(0.35, 'lowpass', 400, 0.7, 0.2, t);
  }

  function caughtShort() {
    if (!ctx || muted) return;
    const t = now();
    tone(760, 0.09, 0.15, 'square', t);
    tone(500, 0.14, 0.13, 'square', t + 0.1);
  }

  function bell() {
    if (!ctx || muted) return;
    const t = now();
    for (let i = 0; i < 26; i++) {
      const tt = t + i * 0.115;
      tone(1568, 0.5, 0.07, 'sine', tt);
      tone(2093, 0.4, 0.045, 'sine', tt + 0.012);
      tone(784, 0.6, 0.035, 'triangle', tt);
    }
  }

  function win() {
    if (!ctx || muted) return;
    const t = now();
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((n, i) => {
      tone(n, 0.3, 0.14, 'triangle', t + i * 0.11);
      tone(n / 2, 0.3, 0.06, 'sine', t + i * 0.11);
    });
  }

  function fail() {
    if (!ctx || muted) return;
    const t = now();
    [392, 370, 349, 330].forEach((n, i) => tone(n, 0.4, 0.12, 'sawtooth', t + i * 0.22, n * 0.96));
  }

  function stamp() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.12, 'lowpass', 500, 1, 0.35, t);
    tone(120, 0.1, 0.25, 'square', t, 60);
  }

  function ui() {
    if (!ctx || muted) return;
    tone(880, 0.06, 0.06, 'sine');
  }

  function pop() {
    if (!ctx || muted) return;
    tone(500, 0.08, 0.08, 'sine', now(), 900);
  }

  function coin() {
    if (!ctx || muted) return;
    const t = now();
    tone(1318, 0.07, 0.08, 'square', t);
    tone(1760, 0.11, 0.06, 'square', t + 0.07);
  }

  function phoneToggle(on) {
    if (!ctx || muted) return;
    const t = now();
    if (on) { tone(660, 0.06, 0.08, 'square', t); tone(990, 0.09, 0.06, 'square', t + 0.06); }
    else { tone(500, 0.06, 0.06, 'square', t); tone(300, 0.08, 0.06, 'square', t + 0.05); }
  }

  function step6() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.04, 'highpass', 3000, 0.6, 0.07, t);
  }

  /* ---------------- 环境音 / 音乐 ---------------- */

  function startAmbient() {
    if (!ctx || hum) return;
    const t = now();
    const g = ctx.createGain();
    g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.035, t + 2.5);
    g.connect(master);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 54;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 80.5;
    const g2 = ctx.createGain(); g2.gain.value = 0.4;
    o1.connect(g2); o2.connect(g2); g2.connect(g);
    o1.start(); o2.start();

    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    const ng = ctx.createGain(); ng.gain.value = 0.3;
    src.connect(f); f.connect(ng); ng.connect(g);
    src.start();

    hum = { g, o1, o2, src };
  }

  function setChalk(on) {
    if (on === chalkOn) return;
    chalkOn = on;
    if (!ctx) return;
    if (on) {
      chalkTick();
      chalkTimer = setInterval(() => {
        if (chalkOn && !muted && !document.hidden) chalkTick();
      }, 330);
    } else if (chalkTimer) {
      clearInterval(chalkTimer);
      chalkTimer = null;
    }
  }

  function scheduleMusic() {
    if (!ctx || !musicWanted) return;
    const beat = 60 / BPM;
    while (nextNoteTime < ctx.currentTime + 0.22) {
      const step = musicStep % 16;
      const t = nextNoteTime;
      if (step % 4 === 0) {
        // 低音拨弦
        const bass = [110, 110, 146.8, 98, 110, 110, 130.8, 146.8][Math.floor(step / 2) % 8];
        const o = ctx.createOscillator(); o.type = 'triangle';
        o.frequency.setValueAtTime(bass, t);
        o.frequency.exponentialRampToValueAtTime(bass * 0.7, t + 0.2);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.055, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.connect(g); g.connect(musicGainNode);
        o.start(t); o.stop(t + 0.34);
      }
      if (step === 4 || step === 12) {
        noise(0.05, 'bandpass', 1800, 2, 0.03, t);
      }
      if (step === 6 || step === 14) {
        noise(0.03, 'highpass', 6000, 0.7, 0.014, t + beat * 0.5);
      }
      nextNoteTime += beat / 2;
      musicStep++;
    }
  }

  function startMusic() {
    if (!ctx || musicWanted) return;
    if (!musicGainNode) {
      musicGainNode = ctx.createGain();
      musicGainNode.gain.value = 0.5;
      musicGainNode.connect(master);
    }
    musicWanted = true;
    nextNoteTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(scheduleMusic, 60);
    scheduleMusic();
  }

  function stopMusic() {
    musicWanted = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function startNight() {
    if (!ctx || nightAmb) return;
    const t = now();
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.05, t + 2.5);
    g.connect(master);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 36;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 55.5;
    const og = ctx.createGain(); og.gain.value = 0.5;
    o1.connect(og); o2.connect(og); og.connect(g);
    o1.start(t); o2.start(t);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    const ng = ctx.createGain(); ng.gain.value = 0.28;
    src.connect(f); f.connect(ng); ng.connect(g);
    src.start(t);
    // 缓慢的风声起伏
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.09;
    const lg = ctx.createGain(); lg.gain.value = 0.02;
    lfo.connect(lg); lg.connect(g.gain);
    lfo.start(t);
    nightAmb = { g, o1, o2, src, lfo };
  }

  function stopNight() {
    if (!nightAmb || !ctx) return;
    const t = now();
    try {
      nightAmb.g.gain.cancelScheduledValues(t);
      nightAmb.g.gain.setTargetAtTime(0.0001, t, 0.3);
      setTimeout(() => {
        try {
          nightAmb.o1.stop(); nightAmb.o2.stop(); nightAmb.src.stop(); nightAmb.lfo.stop();
        } catch (e) { /* ignore */ }
      }, 900);
    } catch (e) { /* ignore */ }
    nightAmb = null;
  }

  function jumpscare() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.55, 'highpass', 900, 0.7, 0.5, t);
    noise(0.9, 'bandpass', 320, 1.1, 0.32, t + 0.02);
    tone(180, 0.7, 0.35, 'sawtooth', t, 60);
    tone(920, 0.5, 0.18, 'sawtooth', t + 0.02, 150);
    tone(1300, 0.35, 0.12, 'square', t + 0.05, 200);
    tone(48, 1.0, 0.3, 'sine', t, 30);
  }

  function scream() {
    if (!ctx || muted) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(1400, t + 0.18);
    o.frequency.exponentialRampToValueAtTime(380, t + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2;
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + 1.05);
    noise(0.7, 'highpass', 2000, 0.6, 0.1, t);
  }

  function chomp() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.2, 'lowpass', 500, 0.9, 0.4, t);
    tone(90, 0.18, 0.3, 'square', t, 45);
    noise(0.12, 'bandpass', 1600, 1.4, 0.2, t + 0.02);
    tone(60, 0.4, 0.2, 'sine', t + 0.08, 30);
  }

  function slurp() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.5, 'bandpass', 520, 3, 0.16, t);
    tone(240, 0.4, 0.08, 'sine', t, 90);
  }

  function snitch() {
    if (!ctx || muted) return;
    const t = now();
    tone(1400, 0.07, 0.09, 'square', t);
    tone(1750, 0.09, 0.07, 'square', t + 0.09);
    noise(0.18, 'highpass', 3000, 0.8, 0.05, t);
  }

  function report() {
    if (!ctx || muted) return;
    const t = now();
    tone(880, 0.12, 0.16, 'triangle', t);
    tone(1320, 0.2, 0.12, 'triangle', t + 0.1);
    tone(220, 0.35, 0.14, 'sawtooth', t + 0.2, 140);
  }

  function bribe() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.16, 'highpass', 2400, 0.8, 0.11, t);
    noise(0.1, 'bandpass', 1500, 2, 0.08, t + 0.08);
    tone(1046, 0.08, 0.06, 'square', t + 0.12);
    tone(1568, 0.12, 0.05, 'square', t + 0.2);
  }

  function thunder() {
    if (!ctx || muted) return;
    const t = now();
    noise(1.6, 'lowpass', 150, 0.8, 0.24, t);
    noise(0.18, 'highpass', 1800, 0.7, 0.12, t);
    tone(42, 1.4, 0.18, 'sine', t, 24);
  }

  function qte() {
    if (!ctx || muted) return;
    const t = now();
    tone(220, 0.12, 0.12, 'sawtooth', t, 440);
    tone(330, 0.12, 0.11, 'sawtooth', t + 0.13, 660);
    tone(880, 0.16, 0.09, 'square', t + 0.26, 1200);
    noise(0.15, 'highpass', 3000, 0.7, 0.05, t + 0.26);
  }

  function stab() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.06, 'highpass', 2600, 0.6, 0.5, t);
    noise(0.3, 'lowpass', 300, 0.8, 0.4, t + 0.03);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(2400, t);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.32);
    tone(70, 0.42, 0.35, 'sine', t + 0.02, 35);
  }

  function gasp() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.4, 'bandpass', 650, 2.4, 0.17, t);
    tone(520, 0.35, 0.07, 'sine', t, 180);
  }

  function growl() {
    if (!ctx || muted) return;
    const t = now();
    noise(0.7, 'lowpass', 160, 0.8, 0.18, t);
    noise(0.5, 'lowpass', 130, 0.6, 0.12, t + 0.25);
    tone(48, 0.85, 0.12, 'sine', t, 34);
  }

  function setTension(v) {
    tension = Math.max(0, Math.min(1, v));
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    if (tension > 0.38 && t - lastBeat > (0.72 - tension * 0.42)) {
      heartBeat(tension);
      lastBeat = t;
    }
  }

  /* ---------------- 老师语音 ---------------- */

  // 没有川话发音人时，用正字朗读会太“普通话”。
  // 这里只在朗读层做川话发音替换，字幕仍保留正字。
  function sichuanize(text) {
    return String(text)
      .replace(/啥子/g, '撒子')
      .replace(/啥/g, '撒')
      .replace(/是/g, '四')
      .replace(/吃/g, '呲')
      .replace(/说/g, '梭')
      .replace(/去/g, '气')
      .replace(/的/g, '哩')
      .replace(/了/g, '咯')
      .replace(/这/g, '则');
  }

  function say(text, opt) {
    opt = opt || {};
    if (!global.speechSynthesis || muted) return false;
    const t = performance.now();
    if (t - lastSayAt < 350) return false;
    try {
      const speakText = sichuanVoice ? text : sichuanize(text);
      const u = new SpeechSynthesisUtterance(speakText);
      u.lang = 'zh-CN';
      // 有四川话发音人就用它；没有就用普通话女声按川话的语速/音高读（川普）
      const hasSc = !!sichuanVoice;
      u.rate = Math.max(0.5, Math.min(2, (opt.rate || 0.95) * (hasSc ? 1 : 0.93)));
      u.pitch = Math.max(0.5, Math.min(2, (opt.pitch == null ? 1.12 : opt.pitch) * (hasSc ? 1 : 0.94)));
      u.volume = opt.volume == null ? 0.95 : opt.volume;
      if (sichuanVoice) u.voice = sichuanVoice;
      else if (zhVoice) u.voice = zhVoice;
      global.speechSynthesis.cancel();
      global.speechSynthesis.speak(u);
      lastSayAt = t;
      return true;
    } catch (e) {
      return false;
    }
  }

  function stopSpeech() {
    if (global.speechSynthesis) {
      try { global.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
  }

  function setMuted(m) {
    muted = !!m;
    if (master && ctx) {
      master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.05);
    }
    if (muted) {
      stopSpeech();
      setChalk(false);
    }
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function isMuted() { return muted; }

  function availability() {
    return {
      audio: !!ctx,
      speech: !!(global.speechSynthesis && voiceReady),
      voice: zhVoice ? zhVoice.name : null,
      totalVoices: voices.length,
      sichuan: !!sichuanVoice,
      sichuanVoice: sichuanVoice ? sichuanVoice.name : null
    };
  }

  global.SFX = {
    init, startAmbient, startMusic, stopMusic,
    setChalk, setTension,
    crunch, sip, gulp, whoosh, footstep, chalkTick, chalkThrow, heartBeat,
    caught, caughtShort, bell, win, fail, stamp, ui, pop, coin, phoneToggle, step6,
    startNight, stopNight, jumpscare, scream, chomp, slurp, snitch, report, bribe, thunder,
    qte, stab, gasp, growl,
    say, stopSpeech, setMuted, toggleMute, isMuted, availability
  };
})(window);
