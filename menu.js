// menu.js — the hover menu (Emotions / Actions). Lives in a shadow DOM so the chat site's CSS can't touch it.
// Look: dark navy panel, stepped pixel border, yellow headings, pixel-art icons, pointer tail toward the character.
(() => {
  const MOCHI = (window.MOCHI = window.MOCHI || {});

  const BORDER = '#3a40a0';
  const NOTCH_OUT =
    'polygon(4px 0, calc(100% - 4px) 0, calc(100% - 4px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 4px, 100% 4px,' +
    ' 100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px),' +
    ' calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 2px), 2px calc(100% - 2px), 2px calc(100% - 4px), 0 calc(100% - 4px),' +
    ' 0 4px, 2px 4px, 2px 2px, 4px 2px)';
  const NOTCH_IN =
    'polygon(2px 0, calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px),' +
    ' calc(100% - 2px) 100%, 2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px), 0 2px, 2px 2px)';

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .wrap {
      position: relative; display: block; width: max-content;
      filter: drop-shadow(2px 2px 0 rgba(0,0,0,.45));
      animation: pop .1s steps(2);
      user-select: none; -webkit-user-select: none;
      font: 700 11px/1 "Courier New", ui-monospace, monospace; color: #e6e8ff;
    }
    @keyframes pop { from { transform: translateY(3px); opacity: 0; } to { transform: none; opacity: 1; } }
    .frame { position: relative; padding: 2px; background: ${BORDER}; clip-path: ${NOTCH_OUT}; }
    .panel {
      display: flex; flex-direction: column; gap: 0; padding: 8px 8px 8px; background: #111335; clip-path: ${NOTCH_IN};
      overflow: hidden; min-height: 0;
    }
    /* only the emotion/action columns scroll when space is tight; the Mochi toggle below stays pinned */
    .cols { display: flex; flex: 1 1 auto; min-height: 0; overflow: auto; scrollbar-width: none; }
    .cols::-webkit-scrollbar { display: none; }
    /* bright pixel at each corner of the border */
    .cn { position: absolute; width: 2px; height: 2px; background: #9aa2ff; z-index: 2; }
    .cn.tl { left: 2px; top: 2px; } .cn.tr { right: 2px; top: 2px; }
    .cn.bl { left: 2px; bottom: 2px; } .cn.br { right: 2px; bottom: 2px; }
    .col { display: flex; flex-direction: column; gap: 3px; min-width: 112px; }
    .col + .col { margin-left: 9px; padding-left: 9px; border-left: 1px solid #2a2f6e; }
    h3 {
      display: flex; align-items: center; gap: 5px; height: 20px; margin: 0 0 1px; padding: 0 2px;
      font: 700 10px/1 "Courier New", monospace; letter-spacing: 1.2px; color: #f5c431; text-transform: uppercase;
    }
    .ico { width: 14px; height: 14px; image-rendering: pixelated; flex: none; display: block; }
    .ico-h { width: 14px; height: 14px; }
    .ico-t { font-size: 12px; line-height: 14px; width: 14px; text-align: center; flex: none; }
    /* pixel-rounded buttons: 1px stepped corners drawn with box-shadow */
    button {
      all: unset; box-sizing: border-box; cursor: pointer; position: relative;
      display: flex; align-items: center; gap: 6px; height: 20px; margin: 1px; padding: 0 6px 0 4px;
      background: #1b1e4d; color: #e6e8ff; white-space: nowrap;
      box-shadow: 0 -1px 0 0 #2d3274, 0 1px 0 0 #2d3274, -1px 0 0 0 #2d3274, 1px 0 0 0 #2d3274;
      font: 700 11px/1 "Courier New", ui-monospace, monospace;
    }
    button:hover, button:focus-visible {
      background: #232969;
      box-shadow: 0 -1px 0 0 #6f8cf5, 0 1px 0 0 #6f8cf5, -1px 0 0 0 #6f8cf5, 1px 0 0 0 #6f8cf5;
    }
    button:active { background: #2c3480; }
    .l { flex: 1; }
    .tag {
      font: 700 8px/1 "Courier New", monospace; padding: 2px 3px; color: #36e6e6; background: #04060f; letter-spacing: 0;
      box-shadow: 0 -1px 0 0 #146a78, 0 1px 0 0 #146a78, -1px 0 0 0 #146a78, 1px 0 0 0 #146a78; margin: 1px;
    }
    .special { background: #2c1233; color: #ffd6dc; box-shadow: 0 -1px 0 0 #d81f48, 0 1px 0 0 #d81f48, -1px 0 0 0 #d81f48, 1px 0 0 0 #d81f48; }
    .special:hover, .special:focus-visible { background: #43183f; box-shadow: 0 -1px 0 0 #ff5a7a, 0 1px 0 0 #ff5a7a, -1px 0 0 0 #ff5a7a, 1px 0 0 0 #ff5a7a; }
    .special:active { background: #55204c; }
    .sep { height: 1px; background: #2a2f6e; margin: 1px 4px; }
    /* Mochi ON/OFF row: divider + label on the left, small pixel switch on the right */
    .sep-foot { flex: none; margin: 6px 2px 4px; }
    .tog { flex: none; height: 18px; padding: 0 4px 0 4px; }
    .tog .l { color: #e6e8ff; }
    .tog.off .l { color: #7c809c; }
    .sw { position: relative; flex: none; display: block; width: 22px; height: 10px; background: #0a0c24;
      box-shadow: 0 -1px 0 0 #2d3274, 0 1px 0 0 #2d3274, -1px 0 0 0 #2d3274, 1px 0 0 0 #2d3274; }
    .knob { position: absolute; top: 1px; left: 1px; width: 8px; height: 8px; background: #7c809c; }
    .tog.on .sw { background: #146a78;
      box-shadow: 0 -1px 0 0 #36e6e6, 0 1px 0 0 #36e6e6, -1px 0 0 0 #36e6e6, 1px 0 0 0 #36e6e6; }
    .tog.on .knob { left: 13px; background: #36e6e6; }
    .tog:hover .sw, .tog:focus-visible .sw { box-shadow: 0 -1px 0 0 #6f8cf5, 0 1px 0 0 #6f8cf5, -1px 0 0 0 #6f8cf5, 1px 0 0 0 #6f8cf5; }
    .tog.on:hover .sw, .tog.on:focus-visible .sw { box-shadow: 0 -1px 0 0 #8ff5f5, 0 1px 0 0 #8ff5f5, -1px 0 0 0 #8ff5f5, 1px 0 0 0 #8ff5f5; }
    /* OFF: hide emotions/actions + divider, keep only the Mochi toggle row */
    .wrap.off .cols, .wrap.off .sep-foot { display: none; }
    .wrap.off .tog { min-width: 96px; }
    /* pointer tail toward the character (stepped, like the border) */
    .tail { position: absolute; bottom: -10px; left: 24px; width: 22px; height: 12px; display: block; shape-rendering: crispEdges; }
  `;

  const TAG = {
    programmer: ['💻only', 'Only the programmer does this one'],
    listener: ['🗣️only', 'Only the listener does this one'],
  };

  // 14x14 pixel-art icons, one string per row ('.' = transparent). Keys match the ids in MOCHI.MENU.
  const ICON_PAL = {"k": "#1a1030", "y": "#ffc83d", "o": "#f29a1f", "w": "#ffffff", "r": "#e5383b", "R": "#a31d2b", "b": "#4aa8ff", "B": "#2a63c9", "p": "#ff5fa2", "P": "#c92f78", "s": "#ffd2a0", "S": "#e8955a", "c": "#9fe8ff", "g": "#5bd45b", "n": "#8a5a32", "a": "#cfd2e6", "d": "#7c809c", "Y": "#fff27a", "W": "#ffffff", "m": "#ff8a1f", "v": "#9b6bff", "V": "#5a35c9", "t": "#d98a3a", "T": "#a35f1f"};
  const ICONS = {
    happy: ['......kk......', '...kkkyykkk...', '..kyyyyyyyyk..', '.kyyyyyyyyyyk.', '.kyykyyyykyok.', '.kyykyyyykook.', 'kyyyyyyyyooook', 'kyypyyyyoopook', '.kyykyyookook.', '.kyyykkkkoook.', '.kyyyoooooook.', '..kyoooooook..', '...kkkookkk...', '......kk......'],
    sad: ['......kk......', '...kkkyykkk...', '..kyyyyyyyyk..', '.kyyyyyyyyyyk.', '.kyyyyyyyyyok.', '.kyykyyyykook.', 'kyyykyyyykoook', 'kyyybyyyoooook', '.kyybyyoooook.', '.kyyykkkkoook.', '.kyykooookook.', '..kyoooooook..', '...kkkookkk...', '......kk......'],
    frustrated: ['......kk......', '...kkkrrkkk...', '..krrrrrrrrk..', '.kkkrrrrrrkkk.', '.krrkkrrkkrRk.', '.krrrrrrrrRRk.', 'krrrkrrrrkRRRk', 'krrrkrrrRkRRRk', '.krrrrrRRRRRk.', '.krrrkkkkRRRk.', '.krrkwwwwkRRk.', '..krRRRRRRRk..', '...kkkRRkkk...', '......kk......'],
    sleepy: ['......kk.ccc..', '...kkkyykkc...', '..kyyyyyyccc..', '.kyyyyyyyyyyk.', '.kyyyyyyyyyok.', '.kykkkyykkkok.', 'kyyyyyyyyooook', 'kyyyyyyyoooook', '.kyyyyyoooook.', '.kyyyykkooook.', '.kyyyoooooook.', '..kyoooooook..', '...kkkookkk...', '......kk......'],
    cool: ['......kk......', '...kkkyykkk...', '..kyyyyyyyyk..', '.kyyyyyyyyyyk.', '.kkkkkkkkkkkk.', '.kykbkyykbkok.', 'kyyyyyyyyooook', 'kyyyyyyyoooook', '.kyyyyyoooook.', '.kyykyoookook.', '.kyyykkkkoook.', '..kyoooooook..', '...kkkookkk...', '......kk......'],
    surprised: ['......kk......', '...kkkyykkk...', '..kooyyyyook..', '.kyyyyyyyyyyk.', '.kyykyyyykyok.', '.kyykyyyykook.', 'kyyyyyyyyooook', 'kyyyyyyyoooook', '.kyyyykkooook.', '.kyyykRRkoook.', '.kyyyokkooook.', '..kyoooooook..', '...kkkookkk...', '......kk......'],
    thinking: ['......kk......', '...kkkyykkk...', '..kyyyyyyyyk..', '.kykkkyyyyyyk.', '.kyyyyyyyyyok.', '.kyykyyyykook.', 'kyyykyyyykoook', 'kyyyyyyyoooook', '.kyyyyyoooook.', '.kyyykkkkoook.', '.kyyyookssskk.', '..kyoooksssk..', '...kkkooksk...', '......kk......'],
    wave: ['..............', '....kk.kk.....', '...kssksskk...', '...kssksskssk.', '..kkssksskssk.', '.kssksssskssk.', '.kssksssssssk.', '.kssssssssssk.', '..ksssssssssk.', '..kssssssssSk.', '...kssssssSk..', '....kssssSk...', '.....kkkkk....', '..............'],
    jump: ['..............', '......kk......', '..a.kkmmkk.a..', '..akYYmmmmka..', '...kYmmmmmk...', '..kmmmmmmmTk..', '..kmmmmmmTTk..', '...kmmmmTTk...', '..akmmmTTTka..', '....kkTTkk....', '......kk......', '....dddddd....', '...dddddddd...', '..............'],
    dance: ['.....kkkkkkk..', '....kvvvvvvvk.', '....kvvvvvvvk.', '....kvVkkkkVk.', '....kvVk..kVk.', '...kkvVkkkkVk.', '..kvvvVkvvvVk.', '.kvvvvVkvvvvVk', '..kvvVk.kvvVk.', '...kkk...kkk..', '..............', '..............', '..............', '..............'],
    celebrate: ['..............', '..kkkk..kkkk..', '.krrrrkkrrrrk.', 'krrWrrrrrrrrrk', 'krWrrrrrrrrrRk', 'krrrrrrrrrrrRk', 'krrrrrrrrrrRRk', '.krrrrrrrrrRk.', '..krrrrrrrRk..', '...krrrrrRk...', '....krrrRk....', '.....krRk.....', '......kk......', '..............'],
    thanks: ['......kk......', '.....kssk.....', '....ksssSk....', '....ksssSk....', '...kssssSsk...', '...kssssSsk...', '...kssssSsk...', '..ksssssSssk..', '..ksssssSssk..', '..kvvvvvvvvk..', '..kvvvvvvvVk..', '..kvvvvvvvVk..', '...kkkkkkkk...', '..............'],
    fight: ['....krk...k...', '....krrk.krk..', '.kkkkmmkkmrk..', 'krrrkmmrmmrk..', '.kmmmmYmYmkkkk', '..kmYYYYYmmmrr', '.kkrmYYYYYmmrk', 'krmmYYYYYmrkk.', 'rrmmmYYYYYmk..', 'kkkkmYmYmmmmk.', '..krmmrmmkrrrk', '..krmkkmmkkkk.', '..krk.krrk....', '...k...krk....'],
    handshake: ['..............', '..............', '..............', '.kkk.kkkk.kkk.', 'kbbbksssskvvvk', 'kbbbsssssssvvk', 'kbbbsSsSsSsvvk', 'kbbbsssssssvvk', 'kbbbkssssskvvk', '.kkkksSsSskkk.', '.....kkkkk....', '..............', '..............', '..............'],
    h_emotions: ['......kk......', '...kkkyykkk...', '..kyyyyyyyyk..', '.kyyyyyyyyyyk.', '.kyykyyyykyok.', '.kyykyyyykook.', 'kyyyyyyyyooook', 'kyypyyyyoopook', '.kyykyyookook.', '.kyyykkkkoook.', '.kyyyoooooook.', '..kyoooooook..', '...kkkookkk...', '......kk......'],
    h_actions: ['.......kkk....', '......kyyyk...', '.....kyyyk....', '....kyyykkk...', '...kyyyyyyok..', '....kkyyyok...', '....kyyyok....', '...kyyokk.....', '..kyokk.......', '...kk.........', '..............', '..............', '..............', '..............'],
  };
  const HEADER_ICON = { Emotions: 'h_emotions', Actions: 'h_actions' };

  // Draw an icon grid onto a tiny canvas; shown 1:1 with pixelated scaling so every art pixel stays crisp.
  const iconCache = {};
  function pixelIcon(id, cls, fallback) {
    const grid = ICONS[id];
    if (grid) {
      try {
        if (!iconCache[id]) {
          const c = document.createElement('canvas');
          c.width = c.height = 14;
          const g = c.getContext('2d');
          grid.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
              const col = ICON_PAL[row[x]];
              if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
            }
          });
          iconCache[id] = c.toDataURL();
        }
        const im = document.createElement('img');
        im.className = 'ico ' + (cls || '');
        im.src = iconCache[id];
        im.alt = '';
        im.draggable = false;
        return im;
      } catch (e) { /* fall through to the emoji */ }
    }
    const s = document.createElement('span');
    s.className = 'ico-t';
    s.textContent = fallback || '';
    return s;
  }

  MOCHI.createMenu = (onPick, onToggle) => {
    const host = document.createElement('div');
    host.setAttribute('data-MOCHI-menu', '');
    host.style.cssText = 'all:initial;position:fixed;left:0;top:0;z-index:2147483647;display:none;';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    const el = (tag, cls, text, parent) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      if (parent) parent.appendChild(n);
      return n;
    };

    const wrap = el('div', 'wrap', '', shadow);
    const frame = el('div', 'frame', '', wrap);
    ['tl', 'tr', 'bl', 'br'].forEach((k) => el('i', 'cn ' + k, '', frame));
    const panel = el('div', 'panel', '', frame);
    panel.setAttribute('role', 'menu');

    // stepped pointer tail (SVG so every step is a crisp pixel)
    const NS = 'http://www.w3.org/2000/svg';
    const tail = document.createElementNS(NS, 'svg');
    tail.setAttribute('class', 'tail');
    tail.setAttribute('viewBox', '0 0 11 6');
    const rect = (x, y, w, fill) => {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', 1);
      r.setAttribute('fill', fill);
      tail.appendChild(r);
    };
    for (let i = 0; i < 6; i++) {
      rect(i, i, 11 - 2 * i, BORDER);      // outline row
      if (i < 5) rect(i + 1, i, 9 - 2 * i, '#111335'); // fill row (row 0 also hides the frame border under the tail)
    }
    wrap.appendChild(tail);

    const cols = el('div', 'cols', '', panel);
    const column = (title, items) => {
      const col = el('div', 'col', '', cols);
      const h = el('h3', '', '', col);
      h.appendChild(pixelIcon(HEADER_ICON[title], 'ico-h'));
      el('span', '', title, h);
      items.forEach((it) => {
        if (it.special) el('div', 'sep', '', col);
        const b = el('button', it.special ? 'special' : '', '', col);
        b.setAttribute('role', 'menuitem');
        b.appendChild(pixelIcon(it.id, '', it.emoji)); // new menu items without art fall back to their emoji
        el('span', 'l', it.label, b);
        if (it.only) {
          const t = el('span', 'tag', 'only', b);
          b.title = TAG[it.only][1];
          t.setAttribute('aria-hidden', 'true');
        }
        b.addEventListener('click', () => onPick(it.id));
      });
    };
    column('Emotions', MOCHI.MENU.emotions);
    column('Actions', MOCHI.MENU.actions);

    // Mochi ON/OFF toggle (state lives in MOCHI.enabled; content.js applies it)
    el('div', 'sep sep-foot', '', panel);
    const tog = el('button', 'tog', '', panel);
    tog.setAttribute('role', 'switch');
    el('span', 'l', 'Mochi', tog);
    el('i', 'knob', '', el('i', 'sw', '', tog));
    let lastAnchor = null, api = null;
    const syncToggle = (on) => {
      wrap.classList.toggle('off', !on);
      tog.classList.toggle('on', on);
      tog.classList.toggle('off', !on);
      tog.setAttribute('aria-checked', on ? 'true' : 'false');
      tog.title = on ? 'Mochi is ON \u2014 click to turn off' : 'Mochi is OFF \u2014 click to turn on';
      if (api && api.isOpen() && lastAnchor) api.show(lastAnchor); // menu changed size: re-place it
    };
    syncToggle(MOCHI.enabled !== false);
    tog.addEventListener('click', () => { if (onToggle) onToggle(MOCHI.enabled === false); });

    // Keep keyboard focus in the chat box while clicking the menu.
    panel.addEventListener('mousedown', (e) => e.preventDefault());

    api = {
      host,
      isOpen: () => host.style.display !== 'none',
      // anchor = DOMRect of the thing being hovered; the menu opens just above it, tail pointing at it.
      show(anchor) {
        lastAnchor = anchor;
        const bottom = anchor.top - 6;
        panel.style.maxHeight = Math.max(100, bottom - 8 - 12) + 'px';
        host.style.display = 'block';
        const w = wrap.offsetWidth, h = wrap.offsetHeight;
        const cx = anchor.left + anchor.width / 2;
        const left = Math.max(8, Math.min(innerWidth - w - 8, cx - w / 2));
        host.style.left = Math.round(left) + 'px';
        host.style.top = Math.round(Math.max(8, bottom - h - 8)) + 'px';
        const tx = Math.max(10, Math.min(w - 32, cx - left - 11));
        tail.style.left = Math.round(tx) + 'px';
      },
      hide() { host.style.display = 'none'; },
      setEnabled: syncToggle,
    };
    syncToggle(MOCHI.enabled !== false);
    return api;
  };
})();
