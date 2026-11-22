// guards.js — the Night Wardens: waypoint patrols, vision cones,
// suspicion ("?") and alert ("!") AI, line-of-sight vs cover.
'use strict';

const GUARD_NAMES = ['Mara', 'Cole', 'Ivo'];

function makeGuard(i) {
  const route = LEVEL.guardRoutes[i];
  return {
    name: GUARD_NAMES[i],
    x: route[0][0],
    y: route[0][1],
    r: 14,
    wp: 1,
    route,
    angle: 0,
    state: 'patrol', // 'patrol' | 'suspicious' | 'alert'
    speed: 62,
    alertSpeed: 128,
    coneRange: 225,
    coneHalf: 0.62, // ~35 degrees each side
    stateTimer: 0,
    lastSeen: null,
    lookTimer: 0,
    lookAngle: 0,
    pauseTimer: 0,
    seenNow: false,
  };
}

const Guards = {
  list: [],
  alertCooldown: 0,

  reset() {
    this.list = LEVEL.guardRoutes.map((_, i) => makeGuard(i));
    this.alertCooldown = 0;
  },

  // Can this guard see the thief right now? Cone + range + LOS + smoke.
  canSee(g, thief, smokes) {
    if (thief.inSmoke(smokes)) return false;
    const dx = thief.x - g.x, dy = thief.y - g.y;
    const dist = Math.hypot(dx, dy);
    const range = g.coneRange * thief.visibility();
    if (dist > range) return false;
    if (dist < 26) return lineOfSightClear(g.x, g.y, thief.x, thief.y); // bumped into
    let da = Math.atan2(dy, dx) - g.angle;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    if (Math.abs(da) > g.coneHalf) return false;
    return lineOfSightClear(g.x, g.y, thief.x, thief.y);
  },

  // How strongly this guard sees the thief: 0..1 (1 = point blank).
  seeStrength(g, thief) {
    const dist = Math.hypot(thief.x - g.x, thief.y - g.y);
    const range = g.coneRange * thief.visibility();
    return Math.max(0.25, 1 - dist / range);
  },

  update(dt, thief, smokes, alarm) {
    this.alertCooldown = Math.max(0, this.alertCooldown - dt);
    for (const g of this.list) {
      g.seenNow = this.canSee(g, thief, smokes);
      const strength = g.seenNow ? this.seeStrength(g, thief) : 0;

      if (g.state === 'patrol') {
        if (g.seenNow) {
          if (strength > 0.62) {
            this.goAlert(g, thief);
          } else {
            g.state = 'suspicious';
            g.stateTimer = 1.6;
            g.lastSeen = { x: thief.x, y: thief.y };
            AudioSys.alert();
          }
        } else {
          this.patrolStep(g, dt);
        }
      } else if (g.state === 'suspicious') {
        // Freeze, stare at the glimpse, then look around.
        g.angle = Math.atan2(g.lastSeen.y - g.y, g.lastSeen.x - g.x);
        g.stateTimer -= dt;
        if (g.seenNow && strength > 0.62) {
          this.goAlert(g, thief);
        } else if (g.stateTimer <= 0) {
          if (g.seenNow) { // still a faint glimpse: stay curious a bit longer
            g.stateTimer = 0.8;
            g.lastSeen = { x: thief.x, y: thief.y };
          } else {
            g.state = 'patrol';
          }
        }
      } else { // alert: chase the last seen position
        g.stateTimer -= dt;
        if (g.seenNow) {
          g.lastSeen = { x: thief.x, y: thief.y };
          g.stateTimer = 3.0;
        }
        const tx = g.lastSeen.x, ty = g.lastSeen.y;
        const dx = tx - g.x, dy = ty - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 8) {
          g.angle = Math.atan2(dy, dx);
          const nx = g.x + (dx / dist) * g.alertSpeed * dt;
          const ny = g.y + (dy / dist) * g.alertSpeed * dt;
          if (!collidesWithWorld(nx, g.y, g.r)) g.x = nx;
          if (!collidesWithWorld(g.x, ny, g.r)) g.y = ny;
        }
        if (g.stateTimer <= 0) {
          g.state = 'suspicious';
          g.stateTimer = 1.2;
        }
      }
    }
  },

  goAlert(g, thief) {
    g.state = 'alert';
    g.stateTimer = 3.0;
    g.lastSeen = { x: thief.x, y: thief.y };
    if (this.alertCooldown <= 0) {
      AudioSys.alert();
      this.alertCooldown = 2.5;
    }
  },

  patrolStep(g, dt) {
    // Pause briefly at each waypoint and look around before moving on.
    if (g.pauseTimer > 0) {
      g.pauseTimer -= dt;
      g.lookTimer -= dt;
      if (g.lookTimer <= 0) {
        g.lookTimer = 0.7;
        g.lookAngle = g.angle + (Math.random() - 0.5) * 1.6;
      }
      g.angle += (g.lookAngle - g.angle) * Math.min(1, dt * 4);
      return;
    }
    const target = g.route[g.wp];
    const dx = target[0] - g.x, dy = target[1] - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      g.wp = (g.wp + 1) % g.route.length;
      g.pauseTimer = 0.9;
      g.lookTimer = 0;
      return;
    }
    g.angle = Math.atan2(dy, dx);
    const nx = g.x + (dx / dist) * g.speed * dt;
    const ny = g.y + (dy / dist) * g.speed * dt;
    if (!collidesWithWorld(nx, g.y, g.r)) g.x = nx;
    if (!collidesWithWorld(g.x, ny, g.r)) g.y = ny;
  },

  // Any guard currently alert? (drives the HUD warning colour)
  anyAlert() {
    return this.list.some((g) => g.state === 'alert');
  },
  anySuspicious() {
    return this.list.some((g) => g.state !== 'patrol');
  },
};
