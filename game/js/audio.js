// audio.js — tiny WebAudio synth. No audio files, everything is
// generated oscillators / noise. Mute with M.
'use strict';

const AudioSys = {
  ctx: null,
  muted: false,
  alarmOsc: null,
  alarmGain: null,

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  tone(freq, dur, type, vol, slideTo) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  },

  noise(dur, vol, lowpass) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass || 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.15, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0);
  },

  step() { this.tone(140, 0.05, 'triangle', 0.03); },
  pickup() { this.tone(660, 0.12, 'sine', 0.14); setTimeout(() => this.tone(990, 0.18, 'sine', 0.14), 90); },
  star() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'sine', 0.15), i * 100));
  },
  smoke() { this.noise(0.35, 0.18, 900); },
  alert() { this.tone(220, 0.3, 'sawtooth', 0.12, 440); this.tone(440, 0.3, 'square', 0.06, 220); },
  caught() {
    [392, 311, 233, 175].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.12), i * 160));
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.15), i * 120));
  },
  click() { this.tone(880, 0.06, 'square', 0.06); },

  // A soft pulsing alarm bed while the alarm meter is high. Call every frame.
  setAlarmBed(level) {
    if (this.muted || level < 55) { this.stopAlarmBed(); return; }
    const ctx = this.ensure();
    if (!ctx) return;
    if (!this.alarmOsc) {
      this.alarmOsc = ctx.createOscillator();
      this.alarmGain = ctx.createGain();
      this.alarmOsc.type = 'sine';
      this.alarmOsc.frequency.value = 55;
      this.alarmGain.gain.value = 0;
      this.alarmOsc.connect(this.alarmGain).connect(ctx.destination);
      this.alarmOsc.start();
    }
    const target = 0.02 + (level - 55) / 45 * 0.05;
    this.alarmGain.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
    this.alarmOsc.frequency.setTargetAtTime(55 + Math.sin(ctx.currentTime * 4) * 8, ctx.currentTime, 0.1);
  },

  stopAlarmBed() {
    if (this.alarmOsc) {
      try { this.alarmOsc.stop(); } catch (e) {}
      this.alarmOsc = null;
      this.alarmGain = null;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAlarmBed();
    return this.muted;
  },
};
