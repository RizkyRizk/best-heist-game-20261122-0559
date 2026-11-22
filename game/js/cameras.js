// cameras.js — wall-mounted security cameras: fixed mounts sweeping a
// fixed arc, cyan cones. Being seen by a camera raises the alarm faster
// than a guard glimpse.
'use strict';

function makeCamera(cfg) {
  return {
    name: cfg.name,
    x: cfg.x,
    y: cfg.y,
    baseAngle: cfg.baseAngle,
    sweep: cfg.sweep,
    range: cfg.range,
    half: 0.42,
    angle: cfg.baseAngle,
    phase: Math.random() * Math.PI * 2,
    seenNow: false,
  };
}

const Cameras = {
  list: [],

  reset() {
    this.list = LEVEL.cameras.map(makeCamera);
  },

  update(dt, time) {
    for (const c of this.list) {
      c.angle = c.baseAngle + Math.sin(time * 0.55 + c.phase) * c.sweep;
    }
  },

  canSee(c, thief, smokes) {
    if (thief.inSmoke(smokes)) return false;
    const dx = thief.x - c.x, dy = thief.y - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist > c.range * thief.visibility()) return false;
    let da = Math.atan2(dy, dx) - c.angle;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    if (Math.abs(da) > c.half) return false;
    return lineOfSightClear(c.x, c.y, thief.x, thief.y);
  },

  // Returns the strongest camera sighting this frame (0..1), or 0.
  sightStrength(thief, smokes) {
    let best = 0;
    for (const c of this.list) {
      c.seenNow = this.canSee(c, thief, smokes);
      if (c.seenNow) {
        const dist = Math.hypot(thief.x - c.x, thief.y - c.y);
        best = Math.max(best, Math.max(0.3, 1 - dist / c.range));
      }
    }
    return best;
  },
};
