// actions.js — emotions, actions and the fight, written as small timed "scripts".
// Each script is a generator: `yield 500` waits 500 ms, `yield* this.during(ms, fn)` runs fn every frame.
// Add your own: put a generator in SCRIPTS and a menu entry in MOCHI.MENU (see README).
(() => {
  const MOCHI = (window.MOCHI = window.MOCHI || {});
  const A = MOCHI.PixelAnimation.prototype;

  // Menu layout. (Optional `only: "programmer" | "listener"` on an item shows a small "only" badge in the menu.)
  MOCHI.MENU = {
    emotions: [
      { id: 'happy', emoji: '😊', label: 'Happy' },
      { id: 'sad', emoji: '😢', label: 'Sad' },
      { id: 'frustrated', emoji: '😡', label: 'Frustrated' },
      { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
      { id: 'cool', emoji: '😎', label: 'Cool' },
      { id: 'surprised', emoji: '😮', label: 'Surprised' },
      { id: 'thinking', emoji: '🤔', label: 'Thinking' },
    ],
    actions: [
      { id: 'wave', emoji: '👋', label: 'Wave' },
      { id: 'jump', emoji: '🦘', label: 'Jump' },
      { id: 'dance', emoji: '💃', label: 'Dance' },
      { id: 'celebrate', emoji: '❤️', label: 'Celebrate' },
      { id: 'thanks', emoji: '🙏', label: 'Thank you' },
      { id: 'handshake', emoji: '🤝', label: 'Handshake' },
      { id: 'fight', emoji: '💥', label: 'Fight', special: true },
    ],
  };

  const STAND_X = 38; // programmer's x when standing (body lines up with the chair)
  const CONFETTI = ['#e02424', '#f5c431', '#3a6fd8', '#3fa35a', '#ff5fa2', '#ffffff'];
  const bounceOut = (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };
  const arc = (p) => Math.abs(Math.sin(p * Math.PI)); // 0 -> 1 -> 0

  // ---------------------------------------------------------------- driver
  A.perform = function (id) {
    const fn = SCRIPTS[id];
    if (!fn || !MOCHI.enabled || MOCHI.hidden || this.isBusy()) return false;
    this.progForced = 'manual'; // scripts drive the programmer by hand
    this.showBang(false);
    this.act = { id, gen: fn.call(this), wait: 0 };
    return true;
  };

  A.stepAct = function (dt) {
    const a = this.act;
    const d = dt * this.cfg.speed;
    if (a.wait > 0) {
      a.wait -= d;
      if (a.wait > 0) { this.place(); return; }
    }
    let res;
    try {
      res = a.gen.next(d);
    } catch (e) {
      console.error('[mochi]', a.id, e);
      res = { done: true };
    }
    if (res.done) { this.endAct(); return; }
    a.wait = res.value === 'frame' ? 0 : res.value;
    this.place();
  };

  A.endAct = function () {
    const r = this.refs;
    this.act = null;
    this.off = { L: { x: 0, y: 0 }, P: { x: 0, y: 0 }, M: { x: 0, y: 0 } };
    this.px = this.cfg.programmer.x;
    ['emoL', 'emoP', 'fx0', 'fx1', 'cloud', 'bang'].forEach((k) => r[k].classList.remove('MOCHI-on'));
    ['listener', 'programmer', 'monitor'].forEach((k) => (r[k].style.visibility = ''));
    r.programmer.classList.add('MOCHI-flip');
    if (this.cfg.sleepAfter) this.awake = false;
    this.idle(); // back to the normal resting pose
  };

  // ---------------------------------------------------------------- helpers
  A.L = function (state, auto = true) { this.spr.listener.play(state, auto); };
  A.P = function (state, auto = true) { this.spr.programmer.play(state, auto); };
  A.M = function (state) { this.spr.monitor.play(state); };

  // Emote above a head: who = 'L' | 'P'; state = null hides it.
  A.emo = function (who, state) {
    const el = who === 'L' ? this.refs.emoL : this.refs.emoP;
    if (!state) { el.classList.remove('MOCHI-on'); return; }
    (who === 'L' ? this.spr.emoL : this.spr.emoP).play(state);
    el.classList.add('MOCHI-on');
  };
  // Free-floating effect i (0|1) with its top-left at art coords (x, y).
  A.fx = function (i, state, x, y) {
    this.fxPos[i] = { x: Math.round(x), y: Math.round(y) };
    this.spr['fx' + i].play(state);
    this.refs['fx' + i].classList.add('MOCHI-on');
  };
  A.fxOff = function (i) { this.refs['fx' + i].classList.remove('MOCHI-on'); };
  A.cloudShow = function (state, x, y) {
    this.cloudPos = { x: Math.round(x), y: Math.round(y) };
    this.spr.cloud.play(state);
    this.refs.cloud.classList.add('MOCHI-on');
  };
  A.cloudHide = function () { this.refs.cloud.classList.remove('MOCHI-on'); };
  A.hide = function (names, on) {
    names.forEach((k) => (this.refs[k].style.visibility = on ? 'hidden' : ''));
  };

  A.during = function* (ms, fn) {
    let t = 0;
    while (t < ms) { fn(t / ms, t); t += yield 'frame'; }
    fn(1, ms);
  };
  // hop(h): both (or one) characters jump h art px for ms
  A.hop = function* (h, ms, who = ['L', 'P']) {
    yield* this.during(ms, (p) => who.forEach((w) => (this.off[w].y = -Math.round(h * arc(p)))));
    who.forEach((w) => (this.off[w].y = 0));
  };
  A.footDust = function (x) { this.refs.spawnDust(x, this.cfg.floorY - 2); };

  // If they are still asleep, wake them first.
  A.$wake = function* () {
    if (this.awake) { this.flip(true); return; }
    this.showZzz(false);
    this.flip(false);
    this.M('screen');
    this.L('waking', false); this.P('waking', false);
    this.spr.listener.setFrame(0); this.spr.programmer.setFrame(0);
    yield 180;
    this.spr.listener.setFrame(1); this.spr.programmer.setFrame(1);
    yield 180;
    this.awake = true;
    this.flip(true);
    this.L('idle'); this.P('idle');
  };

  A.$standUp = function* () {
    this.refs.programmer.classList.remove('MOCHI-flip'); // faces right, toward the listener
    this.px = STAND_X;
    this.P('stand');
    this.footDust(this.px + 4);
    yield* this.hop(3, 220, ['P']);
  };
  A.$sitDown = function* () {
    yield* this.hop(2, 180, ['P']);
    this.refs.programmer.classList.add('MOCHI-flip');
    this.px = this.cfg.programmer.x;
    this.footDust(this.px + 8);
    this.P('idle');
  };

  // Walk both characters (stepped hops, like the listener's normal walk).
  A.$walk = function* (moves, ms) {
    // moves: [{ who:'L'|'P', to }]
    const start = moves.map((m) => (m.who === 'L' ? this.x : this.px));
    const dist = Math.max(...moves.map((m, i) => Math.abs(m.to - start[i])));
    const N = Math.max(6, Math.round(dist / 3));
    let last = -1;
    yield* this.during(ms, (p) => {
      const hop = Math.min(N, Math.floor(p * N));
      moves.forEach((m, i) => {
        const x = Math.round(start[i] + ((m.to - start[i]) * hop) / N);
        const spr = m.who === 'L' ? this.spr.listener : this.spr.programmer;
        if (m.who === 'L') this.x = x; else this.px = x;
        if (hop !== last) {
          spr.setFrame(hop);
          this.footDust(x + (m.to > start[i] ? 4 : 10));
        }
      });
      last = hop;
    });
    moves.forEach((m) => { if (m.who === 'L') this.x = m.to; else this.px = m.to; });
  };

  // Hit effect centred on art coords: spiky star + sparks.
  A.pow = function (cx, cy, slot = 0, sparks = 8) {
    this.fx(slot, 'burst', cx - 8, cy - 8);
    for (let i = 0; i < sparks; i++) {
      const a = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 6;
      this.refs.spawnParticle(cx, cy, Math.cos(a) * sp, Math.sin(a) * sp - 3, ['#f5c431', '#ffffff', '#ff9a2e'][i % 3], 1, 450, 6);
    }
  };
  A.confetti = function (cx, cy, n = 16) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 8 + Math.random() * 12;
      this.refs.spawnParticle(cx, cy, Math.cos(a) * sp, Math.sin(a) * sp, CONFETTI[i % CONFETTI.length], 1 + (i % 2), 900 + Math.random() * 300, 22);
    }
  };

  // ---------------------------------------------------------------- scripts
  const SCRIPTS = {
    // ===== Emotions =====
    *happy() {
      yield* this.$wake();
      this.L('happy'); this.P('happy');
      this.emo('L', 'smile'); this.emo('P', 'smile');
      for (let i = 0; i < 4; i++) {
        yield* this.during(500, (p) => { this.off.L.y = -Math.round(3 * arc(p)); this.off.P.y = -Math.round(1.5 * arc(p)); });
      }
    },

    *sad() {
      yield* this.$wake();
      this.L('sad'); this.P('sad');
      this.emo('L', 'rain'); this.emo('P', 'rain');
      this.off.L.y = 1;
      yield 3000;
    },

    // Programmer only: rage-types, smashes the computer, a new one drops in.
    *frustrated() {
      yield* this.$wake();
      const mx = this.cfg.monitor.x, my = this.cfg.monitor.y;
      this.L('idle');
      this.P('rage'); this.emo('P', 'anger');
      yield* this.during(1000, (p, t) => { this.off.P.x = Math.floor(t / 55) % 2 ? 1 : -1; });
      this.off.P.x = 0;

      // smash #1
      this.P('smashUp'); yield 380;
      this.P('smashDn'); this.M('crack1');
      this.pow(mx + 8, my + 5);
      yield* this.during(220, (p, t) => { this.off.M.x = Math.floor(t / 45) % 2 ? 1 : -1; this.off.M.y = 1; });
      this.off.M.x = this.off.M.y = 0;
      this.fxOff(0);
      yield 280;

      // smash #2: it blows up
      this.P('smashUp'); yield 320;
      this.P('smashDn'); this.M('crack2');
      this.pow(mx + 8, my + 5, 0, 12);
      yield* this.during(200, (p, t) => { this.off.M.x = Math.floor(t / 45) % 2 ? 1 : -1; });
      this.off.M.x = 0;
      this.hide(['monitor'], true);
      for (let i = 0; i < 14; i++) {
        this.refs.spawnParticle(mx + 4 + Math.random() * 8, my + 2 + Math.random() * 6,
          (Math.random() - 0.5) * 30, -4 - Math.random() * 10, ['#b9b9bd', '#3a6fd8', '#c7cdf5', '#0b1a3a'][i % 4], 1 + (i % 2), 800, 18);
      }
      for (let i = 0; i < 4; i++) this.refs.spawnDust(mx + 3 + i * 3, my + 6 - (i % 2) * 3, '#9aa0b4');
      yield 260;
      this.fxOff(0);

      // stunned silence
      this.emo('P', 'qmark'); this.P('think');
      yield 1100;
      this.emo('P', null);

      // a new computer drops in
      this.M('dark');
      this.hide(['monitor'], false);
      yield* this.during(550, (p) => { this.off.M.y = -Math.round(30 * (1 - bounceOut(p))); });
      this.off.M.y = 0;
      this.footDust(mx + 8);
      this.fx(0, 'spark', mx + 4, my - 6);
      this.M('boot'); yield 130;
      this.M('screen'); yield 250;
      this.fxOff(0);

      // happy again
      this.P('happy'); this.emo('P', 'smile');
      yield* this.hop(2, 300, ['P']);
      yield* this.hop(2, 300, ['P']);
      this.emo('P', null);
      this.P('typing');
      yield 800;
    },

    *sleepy() {
      yield* this.$wake();
      this.L('sleepy'); this.P('sleepy');
      yield 1200;
      this.flip(false);
      this.M('off');
      this.L('waking', false); this.P('waking', false);
      this.spr.listener.setFrame(1); this.spr.programmer.setFrame(1);
      yield 230;
      this.spr.listener.setFrame(0); this.spr.programmer.setFrame(0);
      yield 230;
      this.L('sleeping'); this.P('sleeping');
      this.showZzz(true);
      yield 2800;
      this.awake = false; // so $wake plays the stand-up
      yield* this.$wake();
      yield 150;
    },

    *cool() {
      yield* this.$wake();
      this.L('cool'); this.P('cool');
      this.emo('L', 'spark'); this.emo('P', 'spark');
      yield 2800;
    },

    *surprised() {
      yield* this.$wake();
      this.L('surprised'); this.P('surprised');
      this.emo('L', 'excl'); this.emo('P', 'excl');
      yield* this.during(260, (p) => { this.off.L.y = -Math.round(4 * arc(p)); this.off.P.y = -Math.round(2 * arc(p)); });
      this.off.L.y = this.off.P.y = 0;
      yield* this.during(1000, (p, t) => { this.off.L.x = Math.round(Math.sin(t / 35)); this.off.P.x = Math.round(Math.sin(t / 40)); });
      this.off.L.x = this.off.P.x = 0;
    },

    *thinking() {
      yield* this.$wake();
      this.L('think'); this.P('think');
      this.emo('L', 'think'); this.emo('P', 'think');
      yield 3000;
    },

    // ===== Actions =====
    *wave() {
      yield* this.$wake();
      yield* this.$standUp();
      this.L('wave'); this.P('wave');
      yield 2200;
      this.L('idle');
      yield* this.$sitDown();
    },

    *jump() {
      yield* this.$wake();
      yield* this.$standUp();
      this.L('cheer'); this.P('cheer');
      for (let i = 0; i < 3; i++) {
        yield* this.hop(7, 560);
        this.footDust(this.x + 4); this.footDust(this.px + 4);
        yield 60;
      }
      this.L('idle');
      yield* this.$sitDown();
    },

    *dance() {
      yield* this.$wake();
      yield* this.$standUp();
      this.L('dance'); this.P('dance');
      this.emo('L', 'note'); this.emo('P', 'note');
      yield* this.during(3600, () => {
        this.off.L.y = this.spr.listener.frame % 2 ? -1 : 0;
        this.off.P.y = this.spr.programmer.frame % 2 ? -1 : 0;
      });
      this.off.L.y = this.off.P.y = 0;
      this.emo('L', null); this.emo('P', null);
      this.L('idle');
      yield* this.$sitDown();
    },

    *celebrate() {
      yield* this.$wake();
      yield* this.$standUp();
      this.L('cheer'); this.P('cheer');
      this.emo('L', 'heart'); this.emo('P', 'heart');
      for (let i = 0; i < 4; i++) {
        this.confetti(this.x + 8, 10, 12);
        this.confetti(this.px + 8, 10, 12);
        yield* this.hop(5, 620);
      }
      this.emo('L', null); this.emo('P', null);
      this.L('idle');
      yield* this.$sitDown();
    },

    // Listener only: THX bubble + two polite bows. The programmer just keeps typing.
    *thanks() {
      yield* this.$wake();
      this.P('typing');
      this.L('bow', false); this.spr.listener.setFrame(0);
      this.emo('L', 'thx');
      yield 450;
      for (let i = 0; i < 2; i++) {
        this.spr.listener.setFrame(1); yield 150;
        this.spr.listener.setFrame(2); yield 380;
        this.spr.listener.setFrame(1); yield 150;
        this.spr.listener.setFrame(0); yield 300;
      }
      this.emo('L', 'heart');
      yield 700;
    },

    // ===== Fight: both walk up, white dust cloud, fists and boots poke out, then they limp back =====
    *fight() {
      yield* this.$wake();
      yield* this.$standUp();
      const c = this.cfg, r = this.refs;
      this.L('idle'); this.P('stand');
      this.emo('L', 'anger'); this.emo('P', 'anger');
      yield* this.during(600, (p, t) => { this.off.L.x = Math.floor(t / 60) % 2 ? 1 : 0; this.off.P.x = Math.floor(t / 60) % 2 ? 0 : 1; });
      this.off.L.x = this.off.P.x = 0;
      this.emo('L', null); this.emo('P', null);

      // walk toward each other
      const home = c.listener.homeX;
      const mid = Math.max(46, Math.round((this.px + home) / 2));
      const pTo = mid - 6, lTo = mid + 5;
      const dur = 420 + Math.max(this.x - lTo, pTo - this.px) * 9;
      this.P('walk', false); this.L('walking', false);
      yield* this.$walk([{ who: 'P', to: pTo }, { who: 'L', to: lTo }], dur);
      this.P('stand'); this.L('idle');
      yield* this.hop(3, 220);

      // POOF: the cartoon dust cloud swallows both
      const cx = (this.px + this.x) / 2 + 8;
      this.hide(['listener', 'programmer'], true);
      this.cloudShow('puff', cx - 13, 0);
      yield 150;
      this.cloudShow('fight', cx - 13, 0);
      let nextFx = 0, slot = 0;
      yield* this.during(2600, (p, t) => {
        this.cloudPos = { x: Math.round(cx - 13 + Math.sin(t / 40) * 1.3), y: Math.round(Math.cos(t / 55)) };
        if (t >= nextFx) {
          nextFx = t + 280;
          const a = Math.random() * Math.PI * 2;
          const fx = cx + Math.cos(a) * 11, fy = 13 + Math.sin(a) * 9;
          this.fx(slot, Math.random() < 0.5 ? 'burst' : 'bursts', fx - 8, fy - 8);
          slot = 1 - slot;
          this.refs.spawnParticle(fx, fy, Math.cos(a) * 7, Math.sin(a) * 7 - 3, '#ffffff', 1, 500, 8);
          this.refs.spawnDust(cx + Math.cos(a) * 10, 22 + Math.random() * 2, '#e8ebf7');
        }
      });
      this.fxOff(0); this.fxOff(1);
      this.cloudShow('puff', cx - 13, 0);
      yield 150;
      this.cloudHide();

      // they pop out, dizzy
      this.hide(['listener', 'programmer'], false);
      this.L('idle'); this.P('stand');
      this.emo('L', 'dizzy'); this.emo('P', 'dizzy');
      yield 1200;
      this.emo('L', null); this.emo('P', null);

      // limp back: listener to his spot, programmer to his chair
      this.flip(false);                                   // listener walks right
      this.refs.programmer.classList.add('MOCHI-flip');     // programmer walks left
      this.P('walk', false); this.L('walking', false);
      yield* this.$walk([{ who: 'P', to: STAND_X }, { who: 'L', to: c.listener.homeX }], dur);
      this.flip(true);
      this.L('idle');
      yield* this.$sitDown();
    },

    // ===== Handshake: both stand, walk up, shake hands (arms pump), smile, walk back =====
    *handshake() {
      yield* this.$wake();
      yield* this.$standUp();
      const c = this.cfg;
      this.L('idle'); this.P('stand');

      // walk toward each other; the listener stops 15 art px right of the programmer so the hands meet
      const home = c.listener.homeX;
      const mid = Math.max(46, Math.round((this.px + home) / 2));
      const pTo = mid - 8, lTo = pTo + 15;
      const dur = 420 + Math.max(0, this.x - lTo, pTo - this.px) * 9;
      this.P('walk', false); this.L('walking', false);
      yield* this.$walk([{ who: 'P', to: pTo }, { who: 'L', to: lTo }], dur);
      this.P('stand'); this.L('idle');
      yield 250;

      // clasp: arms out, pumping up and down, little sparkle above the hands
      this.P('shake'); this.L('shake');
      this.emo('L', 'smile'); this.emo('P', 'smile');
      const hx = this.px + 15.5; // where the hands meet
      this.fx(0, 'spark', hx - 7.5, 3);
      yield 2400;
      this.fxOff(0);
      this.confetti(hx, 15, 8);
      this.emo('L', 'heart'); this.emo('P', 'heart');
      this.L('idle'); this.P('stand');
      yield* this.hop(3, 260);
      yield 500;
      this.emo('L', null); this.emo('P', null);

      // back to their spots
      this.flip(false);
      this.refs.programmer.classList.add('MOCHI-flip');
      this.P('walk', false); this.L('walking', false);
      yield* this.$walk([{ who: 'P', to: STAND_X }, { who: 'L', to: c.listener.homeX }], dur);
      this.flip(true);
      this.L('idle');
      yield* this.$sitDown();
    },
  };

  MOCHI.SCRIPTS = SCRIPTS;
})();
