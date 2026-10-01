// content.js — builds the overlay DOM, sizes it, wires the Enter key.
(() => {
  if (window.top !== window || window.__MOCHILoaded) return;
  window.__MOCHILoaded = true;

  const MOCHI = window.MOCHI;
  const { CONFIG, PixelAnimation } = MOCHI;
  let u = 1;

  const make = (tag, cls, parent) => {
    const e = document.createElement(tag);
    e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  };

  const root = make('div', 'MOCHI-root');
  make('div', 'MOCHI-chair-back', root);
  make('div', 'MOCHI-chair-seat', root);
  make('div', 'MOCHI-desk', root);
  make('div', 'MOCHI-desk-leg MOCHI-desk-leg-a', root);
  make('div', 'MOCHI-drawer', root);
  make('div', 'MOCHI-kbd', root);

  const refs = {
    monitor: make('canvas', 'MOCHI-sprite MOCHI-monitor', root),
    programmer: make('canvas', 'MOCHI-sprite MOCHI-programmer MOCHI-flip', root),
    listener: make('canvas', 'MOCHI-sprite MOCHI-listener', root),
    bang: make('canvas', 'MOCHI-sprite MOCHI-bang', root),
    zzzL: make('canvas', 'MOCHI-sprite MOCHI-zzz', root),
    zzzP: make('canvas', 'MOCHI-sprite MOCHI-zzz', root),
    // emotion icons above each head, two free-floating effects, and the fight cloud
    emoL: make('canvas', 'MOCHI-sprite MOCHI-emo', root),
    emoP: make('canvas', 'MOCHI-sprite MOCHI-emo', root),
    fx0: make('canvas', 'MOCHI-sprite MOCHI-emo', root),
    fx1: make('canvas', 'MOCHI-sprite MOCHI-emo', root),
    cloud: make('canvas', 'MOCHI-sprite MOCHI-cloud', root),
    // invisible hover hot-spots (the only parts of the scene that catch the mouse)
    hitP: make('div', 'MOCHI-hit', root),
    hitL: make('div', 'MOCHI-hit', root),
    spawnDust(x, y, color) {
      const d = make('div', 'MOCHI-dust', root);
      d.style.left = x * u + 'px';
      d.style.top = y * u + 'px';
      if (color) d.style.background = color;
      d.addEventListener('animationend', () => d.remove());
    },
    // little square that flies (dx, dy art px) and falls (`fall`), then fades
    spawnParticle(x, y, dx, dy, color, size = 1, ms = 600, fall = 6) {
      const d = make('div', 'MOCHI-pt', root);
      d.style.left = x * u + 'px';
      d.style.top = y * u + 'px';
      d.style.width = d.style.height = size * u + 'px';
      d.style.background = color;
      d.style.setProperty('--dx', dx);
      d.style.setProperty('--dy', dy);
      d.style.setProperty('--fall', fall);
      d.style.setProperty('--ms', ms + 'ms');
      d.addEventListener('animationend', () => d.remove());
    },
  };
  document.documentElement.appendChild(root);

  const anim = new PixelAnimation(refs, CONFIG);

  // ---- Anchoring: sit just above the page's main text input and follow it ----
  const EDITABLE =
    'textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"], ' +
    'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=hidden]):not([type=file])';
  let lastFocus = null;
  let anchorEl = null;
  let lastFind = 0;

  // Login / sign-up / OTP fields are never a chat composer: the scene must not sit above them.
  const AUTH_TYPES = /^(email|password|tel|url|search|number)$/i;
  const AUTH_HINT = /e-?mail|passw|user-?name|log-?in|sign-?in|sign-?up|otp|one-time|verif|phone/i;
  const authCache = new WeakMap();
  function isAuthField(el) {
    if (authCache.has(el)) return authCache.get(el);
    let auth = false;
    if (el.tagName === 'INPUT') {
      const hint = [el.type, el.autocomplete, el.name, el.id, el.placeholder, el.getAttribute('aria-label')].join(' ');
      auth = AUTH_TYPES.test(el.type || '') || AUTH_HINT.test(hint);
    }
    if (!auth) {
      const form = el.closest && el.closest('form');
      auth = !!(form && form.querySelector('input[type="password"]'));
    }
    authCache.set(el, auth);
    return auth;
  }

  const visible = (el) => {
    if (!el || !el.isConnected || root.contains(el) || isAuthField(el)) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 80 || r.height < 12 || r.bottom <= 0 || r.top >= innerHeight) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };

  addEventListener('focusin', (e) => {
    if (e.target.matches && e.target.matches(EDITABLE)) lastFocus = e.target;
  }, true);

  function findAnchor() {
    if (visible(lastFocus)) return lastFocus;
    let best = null, bestArea = 0;
    document.querySelectorAll(EDITABLE).forEach((el) => {
      if (!visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width * r.height > bestArea) { best = el; bestArea = r.width * r.height; }
    });
    return best;
  }

  // Find the whole composer card: the OUTERMOST rounded, filled/bordered ancestor of the input
  // that is still a reasonable size (so attachment chips etc. are included).
  // Returns the card's rect and element, plus `wrap`: the small container around it that also
  // holds banners/notices placed next to the composer (e.g. "You are out of free messages").
  function pillInfo(el) {
    const er = el.getBoundingClientRect();
    let node = el, best = null, bestNode = null, fallback = er, fallbackNode = el;
    for (let i = 0; i < 12 && node.parentElement && node.parentElement !== document.body; i++) {
      node = node.parentElement;
      const r = node.getBoundingClientRect();
      if (r.height > innerHeight * 0.6 || r.width > innerWidth * 0.95) break;
      const cs = getComputedStyle(node);
      const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
      const bordered = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
      if ((filled || bordered) && parseFloat(cs.borderTopLeftRadius) >= 12) { best = r; bestNode = node; }
      if (r.width <= er.width * 1.8) { fallback = r; fallbackNode = node; }
    }
    const pillNode = bestNode || fallbackNode;
    let wrap = pillNode;
    for (let i = 0; i < 8 && wrap.parentElement; i++) {
      const p = wrap.parentElement;
      if (p === document.body || p === document.documentElement) break;
      const pr = p.getBoundingClientRect();
      if (pr.height > innerHeight * 0.75 || pr.width > innerWidth * 1.02) break;
      wrap = p;
    }
    return { rect: best || fallback, node: pillNode, wrap };
  }

  // ---- Text avoidance: never cover notices/banners sitting above the composer ----
  // Only text in the composer's own container counts; text inside scrolling areas (the chat
  // messages) is "background" that is allowed to pass under the scene.
  let textRects = [];
  let textAt = 0;
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'SVG', 'CANVAS']);
  function collectText(info) {
    const out = [];
    const range = document.createRange();
    const scrollCache = new Map();
    const inScroller = (el) => {
      for (let n = el; n && n !== info.wrap.parentElement; n = n.parentElement) {
        if (scrollCache.has(n)) { if (scrollCache.get(n)) return true; continue; }
        const cs = getComputedStyle(n);
        const sc = /(auto|scroll|overlay)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 4;
        scrollCache.set(n, sc);
        if (sc) return true;
      }
      return false;
    };
    const walker = document.createTreeWalker(info.wrap, NodeFilter.SHOW_TEXT);
    let count = 0, n;
    while ((n = walker.nextNode()) && count++ < 400) {
      if (!n.nodeValue.trim()) continue;
      const pe = n.parentElement;
      if (!pe || SKIP_TAGS.has(pe.tagName.toUpperCase()) || info.node.contains(n) || root.contains(n)) continue;
      if (inScroller(pe)) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width > 2 && r.height > 2 && r.bottom <= info.rect.top + 2 && r.bottom > 0) out.push(r);
      }
    }
    return out;
  }

  let anchorInfo = null;
  function anchorRect() {
    const now = performance.now();
    if (!visible(anchorEl) || now - lastFind > 300) {
      anchorEl = document.querySelector('#prompt-textarea');
      if (!visible(anchorEl)) anchorEl = findAnchor();
      lastFind = now;
    }
    if (!anchorEl) { anchorInfo = null; textRects = []; return null; }
    anchorInfo = pillInfo(anchorEl);
    if (now - textAt > 150) { textAt = now; textRects = collectText(anchorInfo); }
    return anchorInfo.rect;
  }

  // Move the scene above any banner/notice text it would otherwise cover.
  function avoidText(left, top, w, h) {
    for (let i = 0; i < 4; i++) {
      let hit = null;
      for (const r of textRects) {
        if (r.right > left && r.left < left + w && r.bottom > top && r.top < top + h && (!hit || r.top < hit.top)) hit = r;
      }
      if (!hit) break;
      top = hit.top - h - 4;
    }
    return top;
  }

  let sceneHidden = false;
  let hideMenu = () => {};
  const applied = {};
  const setStyle = (k, v) => { if (applied[k] !== v) { applied[k] = v; root.style[k] = v; } };
  const DEFAULT_HOME = CONFIG.listener.homeX;

  // Menus/popups (e.g. the "+" menu) open in the browser's top layer, above everything.
  // If one would cover the scene, move the scene up so it sits above the popup.
  const OBSTACLES =
    '[role="menu"], [role="listbox"], [role="dialog"], [data-radix-popper-content-wrapper], [popover]';
  let obstacleEls = [];
  let obstacleAt = 0;
  function avoidObstacles(left, top, w, h) {
    const now = performance.now();
    if (now - obstacleAt > 120) {
      obstacleAt = now;
      obstacleEls = Array.from(document.querySelectorAll(OBSTACLES));
    }
    let newTop = top;
    for (const el of obstacleEls) {
      if (!el.isConnected || root.contains(el) || (anchorEl && el.contains(anchorEl))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20 || r.height > innerHeight * 0.8) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      const hit = r.right > left && r.left < left + w && r.bottom > top && r.top < top + h;
      if (hit) newTop = Math.min(newTop, r.top - h - CONFIG.anchor.gap);
    }
    return newTop;
  }

  // Computer + programmer sit above the left end of the bar (over the "+"),
  // the listener waits in the middle of the bar.
  function position() {
    const A = CONFIG.anchor;
    const box = A.enabled ? anchorRect() : null;
    let unitsW = CONFIG.scene.w, left, top = null;

    // No chat composer on this page (login screen, settings, ...): don't draw over the page.
    const noComposer = A.enabled && !box && A.fallback !== 'bottom';
    if (noComposer !== sceneHidden) {
      sceneHidden = noComposer;
      setStyle('display', noComposer ? 'none' : 'block');
      if (noComposer) hideMenu();
    }
    if (noComposer) return;

    if (box) {
      left = box.left + A.offset * u;
      top = box.top - CONFIG.scene.h * u - A.gap;
      unitsW = Math.max(CONFIG.scene.w, Math.ceil(box.width / u - A.offset));
      const centerUnits = box.width / (2 * u) - A.offset - 8; // 8 = half a sprite
      CONFIG.listener.homeX = Math.max(CONFIG.listener.whisperX + 24, Math.min(unitsW - 16, Math.round(centerUnits)));
    } else {
      left = (innerWidth - CONFIG.scene.w * u) / 2;
      CONFIG.listener.homeX = DEFAULT_HOME;
    }
    if (!anim.isBusy() && anim.x !== CONFIG.listener.homeX) {
      anim.x = CONFIG.listener.homeX;
      anim.place();
    }

    setStyle('width', unitsW * u + 'px');
    setStyle('height', CONFIG.scene.h * u + 'px');
    left = Math.max(0, Math.min(innerWidth - unitsW * u, Math.round(left)));
    if (top !== null) {
      const sw = unitsW * u, sh = CONFIG.scene.h * u;
      const clear = avoidText(left, top, sw, sh);
      if (clear !== top) top = Math.max(4, clear);
      if (top >= 0) {
        const shifted = avoidObstacles(left, top, sw, sh);
        if (shifted !== top) top = Math.max(4, shifted);
      }
    }
    setStyle('left', left + 'px');
    if (top === null || top < 0) {
      setStyle('top', 'auto');
      setStyle('bottom', '16px');
    } else {
      setStyle('bottom', 'auto');
      setStyle('top', Math.round(top) + 'px');
    }
  }

  function layout() {
    const { max, widthFraction } = CONFIG.scale;
    u = Math.max(1, Math.min(max, Math.floor((innerWidth * widthFraction) / CONFIG.scene.w)));
    root.style.setProperty('--u', u + 'px');
    anim.setScale(u);
    position();
  }
  layout();
  addEventListener('resize', layout);

  // Follow the input every frame so the scene glides with it when the page moves it.
  let followRaf = 0;
  function follow() {
    position();
    followRaf = requestAnimationFrame(follow);
  }
  follow();

  // ---- Hover menu: hover either character to pick an emotion / action / fight ----
  const menu = MOCHI.createMenu(
    (id) => {
      menu.hide();
      anim.perform(id);
    },
    (on) => {
      MOCHI.setEnabled(on);
      try { chrome.runtime.sendMessage({ type: 'mochi-set', enabled: on }, () => void chrome.runtime.lastError); } catch (e) { /* ignore */ }
    }
  );
  hideMenu = () => menu.hide();
  document.documentElement.appendChild(menu.host);
  if (!CONFIG.menu.enabled) { refs.hitP.remove(); refs.hitL.remove(); }
  let closeTimer = 0;
  const cancelClose = () => clearTimeout(closeTimer);
  const closeSoon = () => { cancelClose(); closeTimer = setTimeout(() => menu.hide(), CONFIG.menu.closeDelay); };
  [refs.hitP, refs.hitL].forEach((hit) => {
    hit.addEventListener('mouseenter', () => {
      if (anim.isBusy()) return;
      cancelClose();
      menu.show(hit.getBoundingClientRect());
    });
    hit.addEventListener('mouseleave', closeSoon);
  });
  menu.host.addEventListener('mouseenter', cancelClose);
  menu.host.addEventListener('mouseleave', closeSoon);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.hide(); }, true);

  // ---- Master ON/OFF (toggle in the menu). State lives in MOCHI.enabled; resets to ON on reload. ----
  // OFF: characters stay on screen, frozen in their resting pose (the animation loop is cancelled),
  // any running action is aborted, Enter/actions/emotions are ignored, and the menu shrinks to
  // just the Mochi toggle. Hovering a character still opens that menu so you can turn Mochi back on.
  MOCHI.setEnabled = (on) => {
    on = !!on;
    if (on === MOCHI.enabled) return;
    MOCHI.enabled = on;
    anim.setEnabled(on);
    menu.setEnabled(on);
    if (!on) root.querySelectorAll('.MOCHI-dust, .MOCHI-pt').forEach((n) => n.remove());
  };

  // ---- Hide Mochi entirely (toolbar-icon right-click menu). Scene + menu gone, both rAF loops cancelled. ----
  // Independent of the ON/OFF toggle: showing again restores whichever of those states was set.
  MOCHI.setHidden = (hide) => {
    hide = !!hide;
    if (hide === MOCHI.hidden) return;
    MOCHI.hidden = hide;
    cancelClose();
    menu.hide();
    root.classList.toggle('MOCHI-hidden', hide);
    if (hide) {
      cancelAnimationFrame(followRaf);
      followRaf = 0;
      anim.setEnabled(false); // aborts any running action and stops the animation loop
    } else {
      anim.setEnabled(MOCHI.enabled);
      if (!followRaf) follow();
    }
  };
  // Shared state (popup + other tabs) arrives from background.js; a fresh page asks for it once.
  const applyState = (st) => {
    if (!st) return;
    MOCHI.setEnabled(st.enabled !== false);
    MOCHI.setHidden(!!st.hidden);
  };
  try {
    chrome.runtime.onMessage.addListener((m) => {
      if (m && m.type === 'mochi-state') applyState(m);
    });
    chrome.runtime.sendMessage({ type: 'mochi-get-state' }, (r) => {
      void chrome.runtime.lastError;
      applyState(r);
    });
  } catch (e) { /* extension was reloaded: this old page keeps its current state */ }

  // Passive listener: never blocks or alters the page's own Enter handling.
  addEventListener(
    'keydown',
    (e) => {
      if (MOCHI.hidden || sceneHidden || e.target === menu.host) return; // Enter on a menu button picks it; don't also start the Enter run
      if (e.key === 'Enter' && !e.repeat && !e.isComposing) {
        if (anim.start()) menu.hide();
      }
    },
    true
  );
})();
