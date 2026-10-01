// animation.js — sprite player + state machine. No DOM creation, no styling.
(() => {
  const MOCHI = (window.MOCHI = window.MOCHI || {});
  MOCHI.enabled = true; // master ON/OFF (toggle in the hover menu); resets to ON on reload
  MOCHI.hidden = false; // whole scene hidden (toolbar-icon menu "Hide Mochi"); characters are not drawn


  // ===== Tweak me: positions, timing, scale (units are logical art pixels) =====
  const CONFIG = {
    scene: { w: 108, h: 26 },
    floorY: 25,
    listener: { homeX: 92, whisperX: 52, y: 9 },
    programmer: { x: 36, y: 9 }, // drawn mirrored: faces left toward the monitor
    monitor: { x: 18, y: 10 },
    bang: { dx: 4, y: 1 },
    zzz: { listener: { dx: 1, y: 13 }, programmer: { dx: 0, y: 9 } }, // sleepy z's
    timings: { wake: 350, sleepDown: 350, listen: 260, walkTo: 750, whisper: 420, walkBack: 750 }, // ms
    walkHops: 10, // stepped walking: the listener moves in this many jumps
    speed: 1, // global multiplier: 2 = twice as fast
    scale: { max: 4, widthFraction: 0.25 }, // integer scale so pixels stay crisp
    // gap in px; offset in art units (negative = shift left so the monitor sits over the "+")
    // fallback: 'hide' = no scene on pages without a chat composer (login, settings); 'bottom' = pin to page bottom
    anchor: { enabled: true, gap: 16, offset: -14, fallback: 'hide' },
    menu: { enabled: true, closeDelay: 400 }, // hover menu (emotions / actions / fight); closeDelay in ms
    sleepAfter: false, // true = they lie back down after each run; false = stay awake after the first Enter
  };

  // Plays frames of one sprite sheet onto a <canvas>.
  class Sprite {
    constructor(canvas, key) {
      this.canvas = canvas;
      this.def = MOCHI.SPRITES[key];
      this.sheet = MOCHI.getSheet(key);
      this.names = Object.keys(this.def.states);
      this.size = this.def.size;
      canvas.width = canvas.height = this.size;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.state = null;
      this.frame = 0;
      this.t = 0;
      this.auto = true;
      if (this.sheet.source instanceof HTMLImageElement && !this.sheet.source.complete) {
        this.sheet.source.addEventListener('load', () => this.render());
      }
    }
    setScale(u) {
      this.canvas.style.width = this.canvas.style.height = this.size * u + 'px';
    }
    play(state, auto = true) {
      if (this.state === state && this.auto === auto) return;
      this.state = state;
      this.auto = auto;
      this.frame = 0;
      this.t = 0;
      this.render();
    }
    setFrame(i) {
      this.auto = false;
      this.frame = i % this.def.states[this.state].frames.length;
      this.render();
    }
    update(dt) {
      if (!this.auto || !this.state) return;
      const st = this.def.states[this.state];
      if (st.frames.length < 2) return;
      this.t += dt;
      if (this.t >= st.ms) {
        this.t -= st.ms;
        this.frame = (this.frame + 1) % st.frames.length;
        this.render();
      }
    }
    render() {
      const src = this.sheet.source;
      if (!this.state || (src instanceof HTMLImageElement && !src.complete)) return;
      const s = this.size;
      const row = this.names.indexOf(this.state);
      this.ctx.clearRect(0, 0, s, s);
      this.ctx.drawImage(src, this.frame * s, row * s, s, s, 0, 0, s, s);
    }
  }

  // IDLE (asleep) -> WAKING -> LISTENING -> WALKING_TO_PROGRAMMER -> WHISPERING -> WALKING_BACK -> IDLE
  const FLOW = {
    WAKING: { next: 'LISTENING', time: 'wake' },
    LISTENING: { next: 'WALKING_TO_PROGRAMMER', time: 'listen' },
    WALKING_TO_PROGRAMMER: { next: 'WHISPERING', time: 'walkTo' },
    WHISPERING: { next: 'WALKING_BACK', time: 'whisper' },
    WALKING_BACK: { next: 'FALLING_ASLEEP', time: 'walkBack' },
    FALLING_ASLEEP: { next: 'IDLE', time: 'sleepDown' },
  };

  class PixelAnimation {
    // refs: { listener, programmer, monitor, bang (canvases), spawnDust(x, y) }
    constructor(refs, config = CONFIG) {
      this.refs = refs;
      this.cfg = config;
      this.u = 1;
      this.spr = {
        listener: new Sprite(refs.listener, 'listener'),
        programmer: new Sprite(refs.programmer, 'programmer'),
        monitor: new Sprite(refs.monitor, 'monitor'),
        bang: new Sprite(refs.bang, 'bang'),
        zzzL: new Sprite(refs.zzzL, 'zzz'),
        zzzP: new Sprite(refs.zzzP, 'zzz'),
        emoL: new Sprite(refs.emoL, 'emote'),
        emoP: new Sprite(refs.emoP, 'emote'),
        fx0: new Sprite(refs.fx0, 'emote'),
        fx1: new Sprite(refs.fx1, 'emote'),
        cloud: new Sprite(refs.cloud, 'cloud'),
      };
      // per-character offsets (art px) used by emotions/actions, programmer x, cloud + fx spots
      this.off = { L: { x: 0, y: 0 }, P: { x: 0, y: 0 }, M: { x: 0, y: 0 } };
      this.px = config.programmer.x;
      this.cloudPos = { x: 0, y: 0 };
      this.fxPos = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
      this.act = null;
      this.spr.zzzL.play('z');
      this.spr.zzzP.play('z');
      this.spr.zzzP.t = 250;
      this.spr.monitor.play('screen');
      this.spr.bang.play('pop');
      this.phase = 'IDLE';
      this.awake = false;
      this.phaseTime = 0;
      this.x = config.listener.homeX;
      this.progForced = null;
      this.burstIn = 1500;
      this.burstLeft = 0;
      this.lastHop = -1;
      this.idle();
      this.last = performance.now();
      this._tick = this._tick.bind(this);
      this._raf = requestAnimationFrame(this._tick);
    }

    setScale(u) {
      this.u = u;
      Object.values(this.spr).forEach((s) => s.setScale(u));
      const r = this.refs, c = this.cfg;
      if (r.hitP) { r.hitP.style.width = (c.programmer.x + 16 - c.monitor.x) * u + 'px'; r.hitP.style.height = 16 * u + 'px'; }
      if (r.hitL) { r.hitL.style.width = r.hitL.style.height = 16 * u + 'px'; }
      this.place();
    }

    place() {
      const u = this.u, c = this.cfg, r = this.refs, o = this.off;
      const at = (el, x, y) => { el.style.left = x * u + 'px'; el.style.top = y * u + 'px'; };
      at(r.programmer, this.px + o.P.x, c.programmer.y + o.P.y);
      at(r.monitor, c.monitor.x + o.M.x, c.monitor.y + o.M.y);
      at(r.listener, this.x + o.L.x, c.listener.y + o.L.y);
      at(r.bang, this.x + c.bang.dx + o.L.x, c.bang.y + o.L.y);
      at(r.zzzL, this.x + c.zzz.listener.dx, c.zzz.listener.y);
      at(r.zzzP, c.programmer.x + c.zzz.programmer.dx, c.zzz.programmer.y);
      // emotes float just above each head (art bottom sits on canvas row 12)
      at(r.emoL, this.x + o.L.x - 1, c.listener.y + o.L.y - 13);
      at(r.emoP, this.px + o.P.x - 1, c.programmer.y + o.P.y - 13);
      at(r.cloud, this.cloudPos.x, this.cloudPos.y);
      at(r.fx0, this.fxPos[0].x, this.fxPos[0].y);
      at(r.fx1, this.fxPos[1].x, this.fxPos[1].y);
      // hover hot-spots: programmer + computer, and the listener
      if (r.hitP) at(r.hitP, c.monitor.x, c.programmer.y);
      if (r.hitL) at(r.hitL, this.x, c.listener.y);
    }

    isBusy() { return this.phase !== 'IDLE' || !!this.act; }

    // Enter pressed. Ignored while a run is in progress.
    start() {
      if (!MOCHI.enabled || MOCHI.hidden || this.isBusy()) return false;
      this.enter(this.awake ? 'LISTENING' : 'WAKING');
      return true;
    }

    enter(phase) {
      this.phase = phase;
      this.phaseTime = 0;
      ({
        WAKING: () => this.wake(),
        FALLING_ASLEEP: () => this.fallAsleep(),
        LISTENING: () => this.listen(),
        WALKING_TO_PROGRAMMER: () => this.walkToProgrammer(),
        WHISPERING: () => this.whisper(),
        WALKING_BACK: () => this.walkBack(),
        IDLE: () => this.idle(),
      })[phase]();
    }

    // ---- phase entry hooks ----
    // Resting state: asleep until the first Enter, then standing around (unless sleepAfter).
    idle() {
      this.x = this.cfg.listener.homeX;
      this.showBang(false);
      if (this.awake) {
        this.flip(true);
        this.showZzz(false);
        this.progForced = null;
        this.spr.listener.play('idle');
        this.spr.monitor.play('screen');
      } else {
        this.flip(false);
        this.showZzz(true);
        this.progForced = 'sleeping';
        this.spr.listener.play('sleeping');
        this.spr.monitor.play('off');
      }
      this.place();
    }
    wake() {
      this.showZzz(false);
      this.flip(false);
      this.progForced = 'manual';
      this.spr.monitor.play('screen');
      this.spr.listener.play('waking', false);
      this.spr.programmer.play('waking', false);
      this.spr.listener.setFrame(0);
      this.spr.programmer.setFrame(0);
    }
    fallAsleep() {
      this.awake = false;
      this.flip(false);
      this.progForced = 'manual';
      this.spr.monitor.play('off');
      this.spr.listener.play('waking', false);
      this.spr.programmer.play('waking', false);
      this.spr.listener.setFrame(1);
      this.spr.programmer.setFrame(1);
    }
    listen() {
      this.awake = true;
      this.progForced = null;
      this.burstLeft = 0;
      this.burstIn = 1500;
      this.flip(true);
      this.showBang(true);
      this.spr.listener.play('listening');
    }
    walkToProgrammer() {
      this.showBang(false);
      this.from = this.cfg.listener.homeX;
      this.to = this.cfg.listener.whisperX;
      this.lastHop = -1;
      this.flip(true);
      this.spr.listener.play('walking', false);
    }
    whisper() {
      this.x = this.cfg.listener.whisperX;
      this.spr.listener.play('whispering');
      this.place();
    }
    walkBack() {
      this.progForced = null;
      this.burstLeft = 500; // programmer resumes typing for a moment
      this.from = this.cfg.listener.whisperX;
      this.to = this.cfg.listener.homeX;
      this.lastHop = -1;
      this.flip(false);
      this.spr.listener.play('walking', false);
    }

    // ---- ON/OFF: OFF cancels the rAF loop entirely (no per-frame work); ON restarts it ----
    setEnabled(on) {
      if (!on) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
        this.abort();
      } else if (!this._raf) {
        this.last = performance.now(); // avoid a huge dt on the first frame back
        this._raf = requestAnimationFrame(this._tick);
      }
    }
    // Stop whatever is playing and return to the resting pose.
    abort() {
      if (this.act) {
        try { this.act.gen.return(); } catch (e) { /* ignore */ }
        this.endAct();
      }
      this.phase = 'IDLE';
      this.phaseTime = 0;
      this.burstLeft = 0;
      this.burstIn = 1500;
      this.idle();
    }

    // ---- helpers ----
    flip(on) { this.refs.listener.classList.toggle('MOCHI-flip', on); }
    showBang(on) { this.refs.bang.classList.toggle('MOCHI-on', on); }
    showZzz(on) {
      this.refs.zzzL.classList.toggle('MOCHI-on', on);
      this.refs.zzzP.classList.toggle('MOCHI-on', on);
    }

    walkStep(p) {
      const N = this.cfg.walkHops;
      const hop = Math.min(N, Math.floor(p * N));
      this.x = Math.round(this.from + ((this.to - this.from) * hop) / N);
      if (hop !== this.lastHop) {
        this.lastHop = hop;
        this.spr.listener.setFrame(hop);
        this.refs.spawnDust(this.x + (this.to > this.from ? 4 : 10), this.cfg.floorY - 2);
      }
      this.place();
    }

    onPhaseUpdate(p) {
      if (this.phase === 'WALKING_TO_PROGRAMMER' || this.phase === 'WALKING_BACK') {
        this.walkStep(p);
      } else if (this.phase === 'WAKING' || this.phase === 'FALLING_ASLEEP') {
        const f = (p < 0.5) === (this.phase === 'WAKING') ? 0 : 1;
        this.spr.listener.setFrame(f);
        this.spr.programmer.setFrame(f);
      } else if (this.phase === 'WHISPERING') {
        // typing -> turns to listen -> (walkBack returns him to typing)
        this.progForced = p < 0.15 ? 'typing' : p < 0.85 ? 'listening' : 'typing';
      }
    }

    updateProgrammer(dt) {
      const pr = this.spr.programmer;
      if (this.progForced === 'manual') return;
      if (this.progForced) {
        pr.play(this.progForced);
      } else if (this.burstLeft > 0) {
        this.burstLeft -= dt;
        pr.play('typing');
        if (this.burstLeft <= 0) this.burstIn = 1200 + Math.random() * 2000;
      } else {
        this.burstIn -= dt;
        pr.play('idle');
        if (this.burstIn <= 0) this.burstLeft = 500 + Math.random() * 400;
      }
    }

    _tick(now) {
      this._raf = 0;
      if (!MOCHI.enabled || MOCHI.hidden) return;
      const dt = Math.min(now - this.last, 100);
      this.last = now;
      Object.values(this.spr).forEach((s) => s.update(dt));
      if (this.act) {
        this.stepAct(dt); // emotion / action / fight script (see actions.js)
        this._raf = requestAnimationFrame(this._tick);
        return;
      }
      this.updateProgrammer(dt);

      if (this.phase !== 'IDLE') {
        const flow = FLOW[this.phase];
        const dur = this.cfg.timings[flow.time] / this.cfg.speed;
        this.phaseTime += dt;
        this.onPhaseUpdate(Math.min(1, this.phaseTime / dur));
        if (this.phaseTime >= dur) {
          const skipSleep = this.phase === 'WALKING_BACK' && !this.cfg.sleepAfter;
          this.enter(skipSleep ? 'IDLE' : flow.next);
        }
      }
      this._raf = requestAnimationFrame(this._tick);
    }
  }

  MOCHI.CONFIG = CONFIG;
  MOCHI.PixelAnimation = PixelAnimation;
})();
