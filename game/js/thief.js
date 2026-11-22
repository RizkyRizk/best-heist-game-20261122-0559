// thief.js — Wren, the cat-burglar: movement, sneak, interaction
// (grab loot / the Sunken Star) and the smoke-pellet tool.
'use strict';

const Thief = {
  x: LEVEL.spawn.x,
  y: LEVEL.spawn.y,
  r: 13,
  angle: -Math.PI / 2, // facing up
  speed: 165,
  sneakSpeed: 95,
  sneaking: false,
  running: false,
  moving: false,
  pellets: 2,
  maxPellets: 3,
  hasStar: false,
  lootTaken: 0,
  lootValue: 0,
  stepTimer: 0,

  reset() {
    this.x = LEVEL.spawn.x;
    this.y = LEVEL.spawn.y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.pellets = 2;
    this.hasStar = false;
    this.lootTaken = 0;
    this.lootValue = 0;
    this.stepTimer = 0;
  },

  // Detection radius factor: how easy the thief is to spot right now.
  // Sneak shrinks it, running grows it.
  visibility() {
    if (this.sneaking) return 0.6;
    if (this.running) return 1.35;
    return 1.0;
  },

  // True when the thief is hidden inside a smoke cloud.
  inSmoke(smokes) {
    for (const s of smokes) {
      const dx = this.x - s.x, dy = this.y - s.y;
      if (dx * dx + dy * dy < s.r * s.r) return true;
    }
    return false;
  },

  update(dt, input, smokes) {
    let dx = 0, dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    this.sneaking = !!input.sneak;
    this.running = !this.sneaking && !!input.run;
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      this.angle = Math.atan2(dy, dx);
      const sp = this.sneaking ? this.sneakSpeed : this.speed;
      const nx = this.x + dx * sp * dt;
      const ny = this.y + dy * sp * dt;
      // Axis-separated movement so the thief slides along cover.
      if (!collidesWithWorld(nx, this.y, this.r)) this.x = nx;
      if (!collidesWithWorld(this.x, ny, this.r)) this.y = ny;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.55 : 0.34;
        if (!this.sneaking) AudioSys.step();
      }
    }
  },

  // Nearest interactable within reach (vault, loot, cache), or null.
  nearestInteractable() {
    const reach = 46;
    const v = LEVEL.vault;
    const vc = { x: v.x + v.w / 2, y: v.y + v.h / 2 };
    if (!this.hasStar && Math.hypot(this.x - vc.x, this.y - vc.y) < reach + 44) {
      return { kind: 'star', label: 'Grab the Sunken Star', x: vc.x, y: vc.y };
    }
    for (const l of LEVEL.loot) {
      if (l.taken) continue;
      if (Math.hypot(this.x - l.x, this.y - l.y) < reach) {
        return { kind: 'loot', label: 'Take ' + l.name + ' (+' + l.value + ')', loot: l, x: l.x, y: l.y };
      }
    }
    for (const c of LEVEL.caches) {
      if (c.taken) continue;
      if (Math.hypot(this.x - c.x, this.y - c.y) < reach) {
        return { kind: 'cache', label: 'Pick up smoke pellets (+1)', cache: c, x: c.x, y: c.y };
      }
    }
    return null;
  },

  interact() {
    const it = this.nearestInteractable();
    if (!it) return null;
    if (it.kind === 'star') {
      this.hasStar = true;
      AudioSys.star();
      return { kind: 'star', text: 'The Sunken Star is yours! Reach the skylight!' };
    }
    if (it.kind === 'loot') {
      it.loot.taken = true;
      this.lootTaken++;
      this.lootValue += it.loot.value;
      AudioSys.pickup();
      return { kind: 'loot', text: it.loot.name + ' pocketed (+' + it.loot.value + ')' };
    }
    if (it.kind === 'cache') {
      it.cache.taken = true;
      this.pellets = Math.min(this.maxPellets, this.pellets + 1);
      AudioSys.pickup();
      return { kind: 'cache', text: 'Smoke pellet restocked' };
    }
    return null;
  },

  // Throw a smoke pellet toward (tx,ty) — or straight ahead when no target.
  throwSmoke(tx, ty, smokes) {
    if (this.pellets <= 0) return false;
    this.pellets--;
    const a = (tx !== undefined) ? Math.atan2(ty - this.y, tx - this.x) : this.angle;
    const cx = this.x + Math.cos(a) * 70;
    const cy = this.y + Math.sin(a) * 70;
    smokes.push({ x: cx, y: cy, r: 88, t: 4.5, max: 4.5 });
    AudioSys.smoke();
    return true;
  },

  // True when the thief stands on the exit pad.
  atExit() {
    const e = LEVEL.exit;
    return this.x > e.x - 6 && this.x < e.x + e.w + 6 && this.y > e.y - 6 && this.y < e.y + e.h + 6;
  },
};
