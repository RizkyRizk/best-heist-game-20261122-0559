// main.js — boot, game loop, state machine (title / playing / paused /
// caught / win), input, staging (?shot=) and self-test (?selftest=1).
'use strict';

const Game = {
  canvas: null,
  state: 'title', // 'title' | 'playing' | 'paused' | 'caught' | 'win'
  time: 0,
  elapsed: 0,
  smokes: [],
  input: { up: false, down: false, left: false, right: false, sneak: false, run: false },
  mouse: { x: 640, y: 400 },
  promptText: '',
  toast: { text: '', alpha: 0, timer: 0 },
  showRoutes: false,
  frozen: false, // staged screenshot state: render but do not simulate
  selftest: null,

  init() {
    this.canvas = document.getElementById('game');
    Render.init(this.canvas);
    this.resetRun();
    this.bindInput();
    const params = new URLSearchParams(location.search);
    const shot = params.get('shot');
    if (params.get('selftest') === '1') this.runSelftest();
    else if (shot) this.stageShot(shot);
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  resetRun() {
    Thief.reset();
    Guards.reset();
    Cameras.reset();
    Alarm.reset();
    for (const l of LEVEL.loot) l.taken = false;
    for (const c of LEVEL.caches) c.taken = false;
    this.smokes = [];
    this.elapsed = 0;
    this.promptText = '';
    this.toast = { text: '', alpha: 0, timer: 0 };
    this.showRoutes = false;
  },

  startGame() {
    this.resetRun();
    this.state = 'playing';
    AudioSys.ensure();
    AudioSys.click();
  },

  restart() {
    this.startGame();
  },

  timeText() {
    const s = Math.floor(this.elapsed);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  },

  objective() {
    return UI.objectiveLine(this);
  },

  showToast(text) {
    this.toast = { text, alpha: 1, timer: 2.6 };
  },

  frame(dt) {
    this.time += dt;
    if (this.state === 'playing' && !this.frozen) {
      this.elapsed += dt;
      Thief.update(dt, this.input, this.smokes);
      // Smoke clouds decay.
      for (const s of this.smokes) s.t -= dt;
      this.smokes = this.smokes.filter((s) => s.t > 0);
      Cameras.update(dt, this.time);
      // Detection.
      let guardStrength = 0;
      for (const g of Guards.list) {
        if (g.seenNow) guardStrength = Math.max(guardStrength, Guards.seeStrength(g, Thief));
      }
      const camStrength = Cameras.sightStrength(Thief, this.smokes);
      Guards.update(dt, Thief, this.smokes, Alarm);
      Alarm.update(dt, guardStrength, camStrength, Thief);
      AudioSys.setAlarmBed(Alarm.value);
      // Interaction prompt.
      const it = Thief.nearestInteractable();
      this.promptText = it ? it.label : '';
      // Toast fade.
      if (this.toast.timer > 0) {
        this.toast.timer -= dt;
        this.toast.alpha = Math.max(0, Math.min(1, this.toast.timer));
      }
      // Win: Star + exit.
      if (Thief.hasStar && Thief.atExit()) {
        this.state = 'win';
        AudioSys.win();
        AudioSys.stopAlarmBed();
      }
      // Caught: alarm tripped.
      if (Alarm.tripped) {
        this.state = 'caught';
        AudioSys.stopAlarmBed();
      }
    } else if (!this.frozen) {
      // Menus still animate cones/cameras so screenshots stay alive.
      Cameras.update(dt, this.time);
      if (this.state === 'title') {
        for (const g of Guards.list) Guards.patrolStep(g, dt);
      }
    }
    Render.draw(this, this.time);
    if (this.state === 'title' && this.showRoutes) {
      // Routes overview: small banner only, so the three dotted routes
      // and the whole room stay visible.
      const c = Render.ctx;
      c.fillStyle = 'rgba(10,12,20,0.88)';
      c.fillRect(330, 66, 620, 38);
      c.strokeStyle = '#c9a227';
      c.lineWidth = 2;
      c.strokeRect(330, 66, 620, 38);
      c.fillStyle = '#e8c87a';
      c.font = 'bold 17px sans-serif';
      c.textAlign = 'center';
      c.fillText('THREE ROUTES TO THE VAULT — pick yours', 640, 91);
    } else if (this.state === 'title') UI.drawTitle(this);
    else if (this.state === 'paused') UI.drawPause();
    else if (this.state === 'caught') UI.drawCaught(this);
    else if (this.state === 'win') UI.drawWin(this);
  },

  bindInput() {
    const keymap = {
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
      ShiftLeft: 'sneak', ShiftRight: 'sneak',
    };
    window.addEventListener('keydown', (e) => {
      if (keymap[e.code] !== undefined) {
        this.input[keymap[e.code]] = true;
        e.preventDefault();
      }
      if (e.code === 'KeyM') {
        const m = AudioSys.toggleMute();
        this.showToast(m ? 'Sound muted' : 'Sound on');
      }
      if (e.code === 'KeyE' && this.state === 'playing') {
        const res = Thief.interact();
        if (res) this.showToast(res.text);
      }
      if ((e.code === 'KeyQ' || e.code === 'Space') && this.state === 'playing') {
        if (!Thief.throwSmoke(this.mouse.x, this.mouse.y, this.smokes)) {
          this.showToast('No smoke pellets left — find a cache!');
        }
        e.preventDefault();
      }
      if (e.code === 'Enter' && this.state === 'title') this.startGame();
      if ((e.code === 'KeyP' || e.code === 'Escape')) {
        if (this.state === 'playing') this.state = 'paused';
        else if (this.state === 'paused') this.state = 'playing';
      }
      if (e.code === 'KeyR' && (this.state === 'caught' || this.state === 'win' || this.state === 'paused')) {
        this.restart();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (keymap[e.code] !== undefined) this.input[keymap[e.code]] = false;
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (1280 / r.width);
      this.mouse.y = (e.clientY - r.top) * (720 / r.height);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      const r = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (1280 / r.width);
      const my = (e.clientY - r.top) * (720 / r.height);
      this.mouse.x = mx; this.mouse.y = my;
      if (this.state === 'title') { this.startGame(); return; }
      if (this.state === 'caught' || this.state === 'win') { this.restart(); return; }
      if (this.state === 'playing') Thief.throwSmoke(mx, my, this.smokes);
    });
  },

  // Staged states for screenshots — the game's own code rendering.
  stageShot(shot) {
    if (shot === 'cover') {
      // Dramatic mid-heist: Wren sneaking near the vault, cones sweeping,
      // alarm part-way up, one guard suspicious.
      this.state = 'playing';
      Thief.x = 470; Thief.y = 400; Thief.angle = Math.PI / 4; Thief.sneaking = true;
      Thief.lootTaken = 1; Thief.lootValue = 400;
      LEVEL.loot[0].taken = true;
      Guards.list[0].x = 560; Guards.list[0].y = 260; Guards.list[0].angle = Math.PI / 2;
      Guards.list[1].x = 760; Guards.list[1].y = 380; Guards.list[1].angle = Math.PI;
      Guards.list[1].state = 'suspicious'; Guards.list[1].stateTimer = 1.4;
      Guards.list[1].lastSeen = { x: 470, y: 400 };
      Guards.list[2].x = 500; Guards.list[2].y = 600; Guards.list[2].angle = -Math.PI / 2;
      Cameras.list[0].angle = Math.PI / 2 + 0.5;
      Alarm.value = 34; Alarm.peak = 34;
      this.elapsed = 47;
      this.frozen = true;
      this.input.sneak = true;
      this.showToast('Stay out of the cones…');
    } else if (shot === 'routes') {
      this.state = 'title';
      this.showRoutes = true;
      this.elapsed = 0;
    } else if (shot === 'caught') {
      // Near-caught: red cone on Wren, alarm ~88, a guard alert.
      this.state = 'playing';
      Thief.x = 700; Thief.y = 420; Thief.angle = Math.PI;
      Guards.list[1].x = 760; Guards.list[1].y = 380; Guards.list[1].angle = Math.atan2(40, -60);
      Guards.list[1].state = 'alert'; Guards.list[1].stateTimer = 2.5;
      Guards.list[1].lastSeen = { x: 700, y: 420 };
      Guards.list[0].x = 620; Guards.list[0].y = 260; Guards.list[0].angle = Math.PI / 2;
      Guards.list[2].x = 700; Guards.list[2].y = 560; Guards.list[2].angle = -Math.PI / 2;
      Cameras.list[0].angle = Math.PI / 2 + 0.3;
      Alarm.value = 88; Alarm.peak = 88;
      this.elapsed = 96;
      this.frozen = true;
    } else if (shot === 'win') {
      this.state = 'win';
      Thief.hasStar = true;
      Thief.lootTaken = 2; Thief.lootValue = 900;
      LEVEL.loot[0].taken = true; LEVEL.loot[1].taken = true;
      Thief.x = 1190; Thief.y = 118;
      Alarm.value = 22; Alarm.peak = 41;
      this.elapsed = 132;
    }
  },

  // Scripted headless self-test: walks the thief, checks detection,
  // alarm fall, star grab, exit win and alarm-100 caught. Reports into
  // document.title as SELFTEST:PASS:... or SELFTEST:FAIL:...
  runSelftest() {
    const results = [];
    const check = (name, ok) => results.push(name + '=' + (ok ? 'PASS' : 'FAIL'));
    this.state = 'playing';
    // 1. Thief moves.
    const x0 = Thief.x, y0 = Thief.y;
    this.input.up = true;
    for (let i = 0; i < 30; i++) Thief.update(1 / 60, this.input, this.smokes);
    this.input.up = false;
    check('move', Thief.y < y0 - 20);
    // 2. Guard cone detects and raises alarm.
    const g = Guards.list[1];
    g.x = Thief.x; g.y = Thief.y - 120; g.angle = Math.PI / 2; g.state = 'patrol';
    const sees = Guards.canSee(g, Thief, this.smokes);
    check('guardSees', sees);
    const a0 = Alarm.value;
    Alarm.update(1, 1, 0, Thief);
    check('alarmRises', Alarm.value > a0);
    // 3. Alarm falls when hidden.
    g.x = 100; g.y = 130; g.angle = 0;
    const a1 = Alarm.value;
    Alarm.update(1, 0, 0, Thief);
    check('alarmFalls', Alarm.value < a1);
    // 4. Smoke blocks vision.
    Thief.throwSmoke(Thief.x, Thief.y, this.smokes);
    // place cloud on the thief so he is inside it
    this.smokes[0].x = Thief.x; this.smokes[0].y = Thief.y;
    g.x = Thief.x; g.y = Thief.y - 120; g.angle = Math.PI / 2;
    check('smokeBlocks', !Guards.canSee(g, Thief, this.smokes));
    this.smokes = [];
    // 5. Grab the Star, reach the exit, win.
    Thief.x = 640; Thief.y = 460;
    const res = Thief.interact();
    check('grabStar', res && res.kind === 'star' && Thief.hasStar);
    Thief.x = 1195; Thief.y = 118;
    check('atExit', Thief.atExit());
    // 6. Alarm 100 = caught.
    Alarm.value = 99;
    Alarm.update(0.5, 1, 0, Thief);
    check('alarmTrips', Alarm.tripped && Alarm.value >= 100);
    // 7. Camera sees.
    Alarm.reset();
    const cam = Cameras.list[0];
    Thief.x = 640; Thief.y = 300;
    cam.angle = Math.PI / 2;
    check('cameraSees', Cameras.canSee(cam, Thief, this.smokes));
    const allPass = results.every((r) => r.endsWith('PASS'));
    document.title = 'SELFTEST:' + (allPass ? 'PASS' : 'FAIL') + ':' + results.join(',');
    this.selftest = { allPass, results };
  },
};

window.addEventListener('DOMContentLoaded', () => Game.init());
