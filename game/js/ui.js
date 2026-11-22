// ui.js — menus, HUD text, win/caught screens, input help.
'use strict';

const UI = {
  // Objective line shown in the HUD (right side).
  objectiveLine(game) {
    if (!Thief.hasStar) return 'Steal the Sunken Star, then reach the skylight';
    return 'Star secured — reach the SKYLIGHT EXIT!';
  },

  rating(game) {
    const t = game.elapsed;
    const alarm = Alarm.peak;
    const loot = Thief.lootValue + (Thief.hasStar ? 1000 : 0);
    let score = loot;
    if (t < 90) score += 300;
    else if (t < 150) score += 150;
    if (alarm < 30) score += 300;
    else if (alarm < 60) score += 150;
    if (score >= 1900) return 'S — GHOST';
    if (score >= 1500) return 'A — SHADOW';
    if (score >= 1100) return 'B — PRO';
    return 'C — LOUD';
  },

  drawTitle(game) {
    Render.panel('VELVET VAULT', [
      'Midnight at the Halcyon Gallery — steal the Sunken Star.',
      '',
      'WASD / Arrows — move      Shift — sneak (slow, harder to spot)',
      'E — grab loot / the Star      Q or Space or Click — smoke pellet',
      'P / Esc — pause      M — mute      R — retry when caught',
      '',
      'Wardens patrol with vision cones. Cameras sweep in cyan.',
      'Stay out of the cones — the alarm rises while you are seen.',
      'Three routes reach the vault: Main Hall, West Corridor, Service Passage.',
      '',
      'Press ENTER or click to begin the heist.',
    ], '#c9a227');
  },

  drawPause() {
    Render.panel('PAUSED', [
      'The gallery holds its breath.',
      '',
      'P / Esc — resume      R — restart the room',
      'M — mute sound',
    ], '#8fa8c8');
  },

  drawCaught(game) {
    Render.panel('CAUGHT!', [
      'The alarm hit 100% — the Night Wardens closed in.',
      '',
      'Tip: sneak (Shift) past cones, and smoke (Q) buys you seconds.',
      'Cover blocks line of sight — plan your route first.',
      '',
      'Press R or click to retry the room.',
    ], '#ff3b30');
  },

  drawWin(game) {
    const loot = Thief.lootValue + 1000;
    Render.panel('CLEAN GETAWAY!', [
      'Wren slips out through the skylight with the Sunken Star.',
      '',
      'Time: ' + game.timeText() + '      Loot value: $' + loot,
      'Alarm peak: ' + Math.round(Alarm.peak) + '%      Side loot: ' + Thief.lootTaken + '/' + LEVEL.loot.length,
      'Rating: ' + this.rating(game),
      '',
      'Press R or click to play again.',
    ], '#7ddb8a');
  },
};
