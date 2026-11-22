// render.js — all canvas drawing: marble floor, cover, vision cones,
// characters, loot, the vault, smoke, and the HUD.
'use strict';

const Render = {
  canvas: null,
  ctx: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  // A filled vision cone from (x,y), facing `angle`, range and half-angle.
  cone(x, y, angle, range, half, colour) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, range, angle - half, angle + half);
    c.closePath();
    c.fillStyle = colour;
    c.fill();
    c.strokeStyle = colour.replace(/[\d.]+\)$/, '0.55)');
    c.lineWidth = 1.5;
    c.stroke();
  },

  drawFloor() {
    const c = this.ctx;
    const b = LEVEL.bounds;
    // Marble floor: checker of two warm greys + a gold border.
    for (let ty = 0; ty < 8; ty++) {
      for (let tx = 0; tx < 16; tx++) {
        c.fillStyle = (tx + ty) % 2 === 0 ? '#232733' : '#272c3a';
        c.fillRect(b.x + tx * 77, b.y + ty * 77, 77, 77);
      }
    }
    // Carpet runner down the main hall.
    c.fillStyle = '#5a1f2b';
    c.fillRect(596, b.y, 88, b.h);
    c.strokeStyle = '#c9a227';
    c.lineWidth = 2;
    c.strokeRect(596, b.y, 88, b.h);
    // Gold border around the room.
    c.strokeStyle = '#c9a227';
    c.lineWidth = 4;
    c.strokeRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16);
    // Skylight glow at the exit.
    const e = LEVEL.exit;
    const g = c.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
    g.addColorStop(0, 'rgba(140,200,255,0.55)');
    g.addColorStop(1, 'rgba(140,200,255,0.12)');
    c.fillStyle = g;
    c.fillRect(e.x, e.y, e.w, e.h);
  },

  drawCover() {
    const c = this.ctx;
    for (const o of LEVEL.cover) {
      if (o.kind === 'pillar') {
        c.fillStyle = '#3d4252';
        c.fillRect(o.x, o.y, o.w, o.h);
        c.fillStyle = '#565d73';
        c.fillRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12);
        c.strokeStyle = '#c9a227';
        c.lineWidth = 2;
        c.strokeRect(o.x, o.y, o.w, o.h);
      } else if (o.kind === 'statue') {
        c.fillStyle = '#4a4030';
        c.fillRect(o.x, o.y, o.w, o.h);
        c.fillStyle = '#c9a227';
        c.beginPath();
        c.arc(o.x + o.w / 2, o.y + o.h / 2, 16, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#7a5c1e';
        c.beginPath();
        c.arc(o.x + o.w / 2, o.y + o.h / 2, 9, 0, Math.PI * 2);
        c.fill();
      } else if (o.kind === 'planter') {
        c.fillStyle = '#2e4a2e';
        c.fillRect(o.x, o.y, o.w, o.h);
        c.fillStyle = '#3f7a3f';
        c.beginPath();
        c.arc(o.x + 16, o.y + 18, 13, 0, Math.PI * 2);
        c.arc(o.x + 36, o.y + 16, 12, 0, Math.PI * 2);
        c.arc(o.x + 26, o.y + 34, 12, 0, Math.PI * 2);
        c.fill();
      } else { // display case
        c.fillStyle = '#2b3242';
        c.fillRect(o.x, o.y, o.w, o.h);
        c.fillStyle = 'rgba(120,190,255,0.28)';
        c.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
        c.strokeStyle = '#8fa8c8';
        c.lineWidth = 2;
        c.strokeRect(o.x, o.y, o.w, o.h);
        c.fillStyle = '#c9a227';
        c.fillRect(o.x + o.w / 2 - 2, o.y + 6, 4, o.h - 12);
      }
    }
  },

  drawLootAndVault(time) {
    const c = this.ctx;
    const v = LEVEL.vault;
    const pulse = 0.5 + Math.sin(time * 3) * 0.5;
    // Vault case.
    c.fillStyle = '#1d2330';
    c.fillRect(v.x - 6, v.y - 6, v.w + 12, v.h + 12);
    c.strokeStyle = Thief.hasStar ? '#3f7a3f' : '#c9a227';
    c.lineWidth = 3;
    c.strokeRect(v.x - 6, v.y - 6, v.w + 12, v.h + 12);
    if (!Thief.hasStar) {
      // The Sunken Star: a glowing sapphire.
      const glow = c.createRadialGradient(v.x + 44, v.y + 44, 4, v.x + 44, v.y + 44, 46);
      glow.addColorStop(0, 'rgba(90,180,255,' + (0.55 + pulse * 0.35) + ')');
      glow.addColorStop(1, 'rgba(90,180,255,0)');
      c.fillStyle = glow;
      c.fillRect(v.x - 30, v.y - 30, v.w + 60, v.h + 60);
      c.fillStyle = '#57b6ff';
      c.beginPath();
      c.moveTo(v.x + 44, v.y + 16);
      c.lineTo(v.x + 68, v.y + 44);
      c.lineTo(v.x + 44, v.y + 72);
      c.lineTo(v.x + 20, v.y + 44);
      c.closePath();
      c.fill();
      c.fillStyle = '#cfeaff';
      c.beginPath();
      c.moveTo(v.x + 44, v.y + 26);
      c.lineTo(v.x + 56, v.y + 44);
      c.lineTo(v.x + 44, v.y + 62);
      c.lineTo(v.x + 32, v.y + 44);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffe9a8';
      c.font = 'bold 12px sans-serif';
      c.textAlign = 'center';
      c.fillText('SUNKEN STAR', v.x + 44, v.y + v.h + 26);
    } else {
      c.fillStyle = '#7ddb8a';
      c.font = 'bold 13px sans-serif';
      c.textAlign = 'center';
      c.fillText('STAR TAKEN', v.x + 44, v.y + 48);
    }
    // Side loot.
    for (const l of LEVEL.loot) {
      if (l.taken) continue;
      const bob = Math.sin(time * 2 + l.x) * 3;
      if (l.kind === 'painting') {
        c.fillStyle = '#6b4a1e';
        c.fillRect(l.x - 16, l.y - 12 + bob, 32, 24);
        c.fillStyle = '#8a5a2e';
        c.fillRect(l.x - 12, l.y - 8 + bob, 24, 16);
        c.fillStyle = '#e8c87a';
        c.beginPath();
        c.arc(l.x, l.y + bob, 5, 0, Math.PI * 2);
        c.fill();
      } else if (l.kind === 'gem') {
        c.fillStyle = '#1f5c33';
        c.beginPath();
        c.moveTo(l.x, l.y - 12 + bob);
        c.lineTo(l.x + 11, l.y + bob);
        c.lineTo(l.x, l.y + 12 + bob);
        c.lineTo(l.x - 11, l.y + bob);
        c.closePath();
        c.fill();
        c.fillStyle = '#57e389';
        c.beginPath();
        c.moveTo(l.x, l.y - 6 + bob);
        c.lineTo(l.x + 5, l.y + bob);
        c.lineTo(l.x, l.y + 6 + bob);
        c.lineTo(l.x - 5, l.y + bob);
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = '#d8c9a3';
        c.beginPath();
        c.arc(l.x, l.y + bob, 11, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#8a7a55';
        c.fillRect(l.x - 3, l.y - 16 + bob, 6, 8);
      }
      c.fillStyle = '#ffe9a8';
      c.font = '11px sans-serif';
      c.textAlign = 'center';
      c.fillText(l.name, l.x, l.y + 30 + bob);
    }
    // Pellet caches.
    for (const cache of LEVEL.caches) {
      if (cache.taken) continue;
      c.fillStyle = '#5c4a7a';
      c.beginPath();
      c.arc(cache.x, cache.y, 12, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#b39ddb';
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = '#e6ddff';
      c.font = 'bold 11px sans-serif';
      c.textAlign = 'center';
      c.fillText('+1', cache.x, cache.y + 4);
    }
  },

  drawExit() {
    const c = this.ctx;
    const e = LEVEL.exit;
    c.fillStyle = Thief.hasStar ? '#2e6b4a' : '#24344a';
    c.fillRect(e.x, e.y, e.w, e.h);
    c.strokeStyle = Thief.hasStar ? '#7ddb8a' : '#8fa8c8';
    c.lineWidth = 2;
    c.strokeRect(e.x, e.y, e.w, e.h);
    c.fillStyle = '#eaf6ff';
    c.font = 'bold 12px sans-serif';
    c.textAlign = 'center';
    c.fillText('SKYLIGHT EXIT', e.x + e.w / 2, e.y + e.h / 2 + 4);
    if (Thief.hasStar) {
      c.fillStyle = '#7ddb8a';
      c.font = 'bold 12px sans-serif';
      c.fillText('▼ GO!', e.x + e.w / 2, e.y + e.h + 16);
    }
  },

  drawCones() {
    const c = this.ctx;
    // Camera cones first (cyan), then guard cones (yellow / red when alert).
    for (const cam of Cameras.list) {
      const col = cam.seenNow ? 'rgba(80,220,255,0.42)' : 'rgba(80,200,255,0.20)';
      this.cone(cam.x, cam.y, cam.angle, cam.range, cam.half, col);
    }
    for (const g of Guards.list) {
      let col;
      if (g.state === 'alert') col = g.seenNow ? 'rgba(255,60,40,0.45)' : 'rgba(255,90,40,0.30)';
      else if (g.state === 'suspicious') col = 'rgba(255,176,32,0.32)';
      else col = g.seenNow ? 'rgba(255,220,80,0.38)' : 'rgba(255,220,80,0.18)';
      this.cone(g.x, g.y, g.angle, g.coneRange, g.coneHalf, col);
    }
  },

  drawSmoke(smokes) {
    const c = this.ctx;
    for (const s of smokes) {
      const alpha = Math.min(0.75, (s.t / s.max) * 0.85);
      const g = c.createRadialGradient(s.x, s.y, 8, s.x, s.y, s.r);
      g.addColorStop(0, 'rgba(200,200,215,' + alpha + ')');
      g.addColorStop(1, 'rgba(200,200,215,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      c.fill();
    }
  },

  drawThief(time) {
    const c = this.ctx;
    const t = Thief;
    // Sneak = crouched, smaller silhouette.
    const r = t.sneaking ? t.r - 2 : t.r;
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(t.x, t.y + r * 0.8, r, r * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#2b2b33';
    c.beginPath();
    c.arc(t.x, t.y, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#c9a227';
    c.lineWidth = 2;
    c.stroke();
    // Facing tick.
    c.strokeStyle = '#ffe9a8';
    c.beginPath();
    c.moveTo(t.x, t.y);
    c.lineTo(t.x + Math.cos(t.angle) * (r + 7), t.y + Math.sin(t.angle) * (r + 7));
    c.stroke();
    // Cat-ear hood + eyes.
    c.fillStyle = '#2b2b33';
    c.beginPath();
    c.moveTo(t.x - 8, t.y - 6);
    c.lineTo(t.x - 4, t.y - r - 5);
    c.lineTo(t.x - 1, t.y - 7);
    c.moveTo(t.x + 8, t.y - 6);
    c.lineTo(t.x + 4, t.y - r - 5);
    c.lineTo(t.x + 1, t.y - 7);
    c.fill();
    c.fillStyle = '#7ddb8a';
    c.beginPath();
    c.arc(t.x - 4, t.y - 1, 2, 0, Math.PI * 2);
    c.arc(t.x + 4, t.y - 1, 2, 0, Math.PI * 2);
    c.fill();
    if (t.hasStar) {
      c.fillStyle = '#57b6ff';
      c.beginPath();
      c.moveTo(t.x, t.y - r - 12);
      c.lineTo(t.x + 6, t.y - r - 4);
      c.lineTo(t.x, t.y - r + 2);
      c.lineTo(t.x - 6, t.y - r - 4);
      c.closePath();
      c.fill();
    }
    c.fillStyle = '#fff';
    c.font = 'bold 11px sans-serif';
    c.textAlign = 'center';
    c.fillText('WREN', t.x, t.y - r - (t.hasStar ? 16 : 8));
  },

  drawGuards() {
    const c = this.ctx;
    for (const g of Guards.list) {
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.beginPath();
      c.ellipse(g.x, g.y + g.r * 0.8, g.r, g.r * 0.4, 0, 0, Math.PI * 2);
      c.fill();
      const body = g.state === 'alert' ? '#7a1f1f' : g.state === 'suspicious' ? '#7a5c1e' : '#1f2a4a';
      c.fillStyle = body;
      c.beginPath();
      c.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = g.state === 'patrol' ? '#8fa8c8' : '#ffb020';
      c.lineWidth = 2;
      c.stroke();
      // Lantern / torch dot showing facing.
      c.fillStyle = '#ffe9a8';
      c.beginPath();
      c.arc(g.x + Math.cos(g.angle) * 10, g.y + Math.sin(g.angle) * 10, 3.5, 0, Math.PI * 2);
      c.fill();
      // State mark.
      if (g.state !== 'patrol') {
        c.fillStyle = g.state === 'alert' ? '#ff3b30' : '#ffb020';
        c.font = 'bold 22px sans-serif';
        c.textAlign = 'center';
        c.fillText(g.state === 'alert' ? '!' : '?', g.x, g.y - g.r - 8);
      }
      c.fillStyle = '#cfd8ea';
      c.font = '10px sans-serif';
      c.textAlign = 'center';
      c.fillText(g.name.toUpperCase(), g.x, g.y + g.r + 12);
    }
  },

  drawCameras() {
    const c = this.ctx;
    for (const cam of Cameras.list) {
      c.fillStyle = '#24344a';
      c.fillRect(cam.x - 10, cam.y - 7, 20, 14);
      c.strokeStyle = cam.seenNow ? '#ff3b30' : '#57c7ff';
      c.lineWidth = 2;
      c.strokeRect(cam.x - 10, cam.y - 7, 20, 14);
      c.fillStyle = cam.seenNow ? '#ff3b30' : '#57c7ff';
      c.beginPath();
      c.arc(cam.x + Math.cos(cam.angle) * 12, cam.y + Math.sin(cam.angle) * 12, 4, 0, Math.PI * 2);
      c.fill();
    }
  },

  // Dotted route guides (title screen + routes shot).
  drawRoutes() {
    const c = this.ctx;
    const colours = ['#7ddb8a', '#ffb020', '#57c7ff'];
    LEVEL.routes.forEach((r, i) => {
      c.strokeStyle = colours[i];
      c.lineWidth = 3;
      c.setLineDash([8, 8]);
      c.beginPath();
      r.points.forEach((p, j) => (j === 0 ? c.moveTo(p[0], p[1]) : c.lineTo(p[0], p[1])));
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = colours[i];
      c.font = 'bold 13px sans-serif';
      c.textAlign = 'left';
      const labelW = c.measureText(r.name).width;
      const lx = Math.min(r.points[1][0] + 8, 1280 - labelW - 26);
      c.fillText(r.name, lx, r.points[1][1] - 8);
    });
  },

  drawHUD(game) {
    const c = this.ctx;
    // Top bar.
    c.fillStyle = '#12141d';
    c.fillRect(0, 0, 1280, 58);
    c.strokeStyle = '#c9a227';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 58);
    c.lineTo(1280, 58);
    c.stroke();
    c.fillStyle = '#e8c87a';
    c.font = 'bold 20px sans-serif';
    c.textAlign = 'left';
    c.fillText('VELVET VAULT', 16, 26);
    c.fillStyle = '#9aa3b8';
    c.font = '12px sans-serif';
    c.fillText('Midnight at the Halcyon Gallery', 16, 44);
    // Alarm meter.
    const ax = 330, ay = 16, aw = 300, ah = 20;
    c.fillStyle = '#000';
    c.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
    c.fillStyle = '#2b3242';
    c.fillRect(ax, ay, aw, ah);
    c.fillStyle = Alarm.colour();
    c.fillRect(ax, ay, aw * (Alarm.value / 100), ah);
    c.strokeStyle = '#8fa8c8';
    c.lineWidth = 1;
    c.strokeRect(ax, ay, aw, ah);
    c.fillStyle = '#fff';
    c.font = 'bold 12px sans-serif';
    c.textAlign = 'left';
    c.fillText('ALARM ' + Math.round(Alarm.value) + '% — ' + Alarm.label(), ax, ay + ah + 15);
    // Loot / pellets / timer.
    c.fillStyle = '#fff';
    c.font = 'bold 15px sans-serif';
    c.textAlign = 'left';
    c.fillText('LOOT ' + Thief.lootTaken + '/' + LEVEL.loot.length + (Thief.hasStar ? '  ★ STAR' : ''), 680, 26);
    c.fillText('SMOKE ' + '●'.repeat(Thief.pellets) + '○'.repeat(Thief.maxPellets - Thief.pellets), 680, 46);
    c.fillStyle = '#9aa3b8';
    c.font = '13px sans-serif';
    c.fillText('TIME ' + game.timeText(), 980, 26);
    c.fillText(game.objective(), 980, 46);
    if (AudioSys.muted) {
      c.fillStyle = '#ffb020';
      c.font = 'bold 13px sans-serif';
      c.textAlign = 'right';
      c.fillText('MUTED (M)', 1264, 26);
    }
  },

  // Interaction prompt above the thief.
  drawPrompt(text) {
    if (!text) return;
    const c = this.ctx;
    c.font = 'bold 14px sans-serif';
    const w = c.measureText(text).width + 24;
    const x = Math.max(8, Math.min(1280 - w - 8, Thief.x - w / 2));
    const y = Thief.y - 52;
    c.fillStyle = 'rgba(10,12,20,0.9)';
    c.fillRect(x, y, w, 26);
    c.strokeStyle = '#c9a227';
    c.lineWidth = 1.5;
    c.strokeRect(x, y, w, 26);
    c.fillStyle = '#ffe9a8';
    c.textAlign = 'center';
    c.fillText('[E] ' + text, x + w / 2, y + 18);
  },

  // Toast message line under the HUD.
  drawToast(text, alpha) {
    if (!text) return;
    const c = this.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.font = 'bold 16px sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#ffe9a8';
    c.fillText(text, 640, 100);
    c.restore();
  },

  // Full-screen overlay panel used by menus.
  panel(title, lines, accent) {
    const c = this.ctx;
    c.fillStyle = 'rgba(8,10,18,0.82)';
    c.fillRect(0, 0, 1280, 720);
    c.strokeStyle = accent || '#c9a227';
    c.lineWidth = 3;
    c.strokeRect(300, 120, 680, 480);
    c.fillStyle = '#12141d';
    c.fillRect(300, 120, 680, 480);
    c.fillStyle = accent || '#e8c87a';
    c.font = 'bold 40px sans-serif';
    c.textAlign = 'center';
    c.fillText(title, 640, 190);
    c.font = '16px sans-serif';
    c.fillStyle = '#dfe6f2';
    lines.forEach((line, i) => {
      c.fillText(line, 640, 240 + i * 30);
    });
  },

  draw(game, time) {
    const c = this.ctx;
    c.clearRect(0, 0, 1280, 720);
    c.fillStyle = '#12141d';
    c.fillRect(0, 0, 1280, 720);
    this.drawFloor();
    this.drawExit();
    this.drawCover();
    this.drawLootAndVault(time);
    this.drawCones();
    this.drawSmoke(game.smokes);
    this.drawThief(time);
    this.drawGuards();
    this.drawCameras();
    if (game.state === 'title' || game.showRoutes) this.drawRoutes();
    this.drawHUD(game);
    if (game.state === 'playing') {
      this.drawPrompt(game.promptText);
      this.drawToast(game.toast.text, game.toast.alpha);
    }
    // Alarm flash when tripped.
    if (Alarm.tripped && game.state === 'playing') {
      c.fillStyle = 'rgba(255,40,30,' + (0.12 + Math.sin(time * 8) * 0.08) + ')';
      c.fillRect(0, 58, 1280, 662);
    }
  },
};
