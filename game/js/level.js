// level.js — the Halcyon Gallery: one fixed 1280x720 room.
// All geometry lives here: walls, cover (blocks line of sight), loot,
// the vault, the skylight exit, guard waypoints and camera mounts.
'use strict';

const LEVEL = {
  width: 1280,
  height: 720,
  hudHeight: 58,
  // Playable bounds (inside the outer walls).
  bounds: { x: 24, y: 82, w: 1232, h: 614 },

  // Cover objects: solid rectangles that block movement AND guard sight.
  // name, x, y, w, h, kind ('case' | 'statue' | 'planter' | 'pillar').
  cover: [
    { name: 'Marble Pillar', x: 210, y: 190, w: 46, h: 46, kind: 'pillar' },
    { name: 'Marble Pillar', x: 210, y: 520, w: 46, h: 46, kind: 'pillar' },
    { name: 'Marble Pillar', x: 1024, y: 190, w: 46, h: 46, kind: 'pillar' },
    { name: 'Marble Pillar', x: 1024, y: 520, w: 46, h: 46, kind: 'pillar' },
    { name: 'Display Case A', x: 330, y: 170, w: 130, h: 54, kind: 'case' },
    { name: 'Display Case B', x: 820, y: 170, w: 130, h: 54, kind: 'case' },
    { name: 'Display Case C', x: 330, y: 540, w: 130, h: 54, kind: 'case' },
    { name: 'Display Case D', x: 820, y: 540, w: 130, h: 54, kind: 'case' },
    { name: 'Bronze Statue', x: 560, y: 150, w: 60, h: 60, kind: 'statue' },
    { name: 'Bronze Statue', x: 660, y: 560, w: 60, h: 60, kind: 'statue' },
    { name: 'Planter', x: 90, y: 330, w: 52, h: 52, kind: 'planter' },
    { name: 'Planter', x: 1138, y: 330, w: 52, h: 52, kind: 'planter' },
    { name: 'Long Case West', x: 300, y: 330, w: 56, h: 130, kind: 'case' },
    { name: 'Long Case East', x: 924, y: 330, w: 56, h: 130, kind: 'case' },
  ],

  // The central vault case holding the Sunken Star.
  vault: { x: 596, y: 336, w: 88, h: 88, name: 'The Sunken Star' },

  // Side loot: optional, adds score. kind: 'painting' | 'gem' | 'relic'.
  loot: [
    { id: 'painting', name: 'Moonlit Portrait', kind: 'painting', x: 96, y: 150, value: 400 },
    { id: 'gem', name: 'Emerald Brooch', kind: 'gem', x: 1140, y: 560, value: 600 },
    { id: 'relic', name: 'Ivory Relic', kind: 'relic', x: 96, y: 600, value: 500 },
  ],

  // Smoke-pellet caches: walking over one refills 1 pellet.
  caches: [
    { id: 'cache1', x: 470, y: 640, taken: false },
    { id: 'cache2', x: 810, y: 120, taken: false },
  ],

  // Skylight exit door (top-right). Win only after grabbing the Star.
  exit: { x: 1150, y: 96, w: 96, h: 44, name: 'Skylight Exit' },

  // Thief spawn: bottom-left service door.
  spawn: { x: 90, y: 640 },

  // Three distinct routes to the vault, drawn as guide dashes on the title
  // screen and used by the routes screenshot: main hall (centre), west
  // corridor (behind the west cases), east service passage.
  routes: [
    { name: 'Main Hall', points: [[90, 640], [640, 640], [640, 470]] },
    { name: 'West Corridor', points: [[90, 640], [90, 260], [280, 260], [280, 380], [560, 380]] },
    { name: 'Service Passage', points: [[90, 640], [1180, 640], [1180, 260], [980, 260], [700, 380]] },
  ],

  // Guard patrol loops (waypoints in room coordinates).
  guardRoutes: [
    // Warden Mara — sweeps the top hall, past the vault's north side.
    [[300, 130], [980, 130], [980, 260], [300, 260]],
    // Warden Cole — circles the vault clockwise.
    [[520, 300], [760, 300], [760, 480], [520, 480]],
    // Warden Ivo — sweeps the bottom hall.
    [[980, 620], [300, 620], [300, 470], [980, 470]],
  ],

  // Wall-mounted cameras: fixed mount, sweep arc (centre angle, half sweep).
  cameras: [
    { x: 640, y: 92, baseAngle: Math.PI / 2, sweep: 0.85, range: 300, name: 'Cam North' },
    { x: 60, y: 400, baseAngle: 0, sweep: 0.7, range: 280, name: 'Cam West' },
  ],
};

// True when point (px,py) is inside any cover rect (with a small margin).
function pointInCover(px, py, margin) {
  const m = margin || 0;
  for (const c of LEVEL.cover) {
    if (px > c.x - m && px < c.x + c.w + m && py > c.y - m && py < c.y + c.h + m) return c;
  }
  return null;
}

// True when the circle at (x,y) radius r collides with a wall, the vault
// case, or any cover object. The vault case is solid until the Star is taken.
function collidesWithWorld(x, y, r) {
  const b = LEVEL.bounds;
  if (x - r < b.x || x + r > b.x + b.w || y - r < b.y || y + r > b.y + b.h) return true;
  const v = LEVEL.vault;
  if (x + r > v.x && x - r < v.x + v.w && y + r > v.y && y - r < v.y + v.h) return true;
  for (const c of LEVEL.cover) {
    if (x + r > c.x && x - r < c.x + c.w && y + r > c.y && y - r < c.y + c.h) return true;
  }
  return false;
}

// Segment (x1,y1)-(x2,y2) vs axis-aligned rect: true when the segment
// touches or crosses the rect. Used for line-of-sight checks.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) return false;
  // Endpoint inside the rect.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const dx = x2 - x1, dy = y2 - y1;
  // Intersect with each of the four edges.
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const den = dx * (ey2 - ey1) - dy * (ex2 - ex1);
    if (Math.abs(den) < 1e-9) continue;
    const t = ((ex1 - x1) * (ey2 - ey1) - (ey1 - y1) * (ex2 - ex1)) / den;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

// True when nothing (cover or vault case) blocks the sight line.
function lineOfSightClear(x1, y1, x2, y2) {
  for (const c of LEVEL.cover) {
    if (segmentHitsRect(x1, y1, x2, y2, c)) return false;
  }
  if (segmentHitsRect(x1, y1, x2, y2, LEVEL.vault)) return false;
  return true;
}
