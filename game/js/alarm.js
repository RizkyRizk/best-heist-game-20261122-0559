// alarm.js — the alarm meter 0-100. Rises while the thief is inside any
// vision cone (faster when close, when a camera sees, when running),
// falls slowly when hidden. At 100 the alarm trips: guards converge and
// the run is caught.
'use strict';

const Alarm = {
  value: 0,
  peak: 0,
  tripped: false,

  reset() {
    this.value = 0;
    this.peak = 0;
    this.tripped = false;
  },

  // dt seconds of exposure. guardStrength 0..1, camStrength 0..1.
  update(dt, guardStrength, camStrength, thief) {
    if (this.tripped) return;
    let rise = 0;
    if (guardStrength > 0) rise += 16 * guardStrength;
    if (camStrength > 0) rise += 30 * camStrength;
    if (rise > 0) {
      if (thief.running) rise *= 1.5;
      if (thief.sneaking) rise *= 0.6;
      this.value = Math.min(100, this.value + rise * dt);
    } else {
      this.value = Math.max(0, this.value - 6 * dt);
    }
    this.peak = Math.max(this.peak, this.value);
    if (this.value >= 100) {
      this.tripped = true;
      AudioSys.caught();
    }
  },

  // Colour of the meter: calm blue -> amber -> red.
  colour() {
    if (this.value < 40) return '#57c7ff';
    if (this.value < 70) return '#ffb020';
    return '#ff3b30';
  },

  label() {
    if (this.value < 40) return 'UNDETECTED';
    if (this.value < 70) return 'SUSPICIOUS';
    if (this.value < 100) return 'ALMOST CAUGHT';
    return 'ALARM TRIPPED';
  },
};
