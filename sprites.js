// sprites.js — placeholder pixel art, defined as character grids.
// Replace any sprite with a PNG sheet by setting `png` (see README).
(() => {
  const MOCHI = (window.MOCHI = window.MOCHI || {});
  const S = 16;

  // Flat color blocking, no full-body outlines: dark hair/hat, black shoes + belt only.
  const PALETTE = {
    B: '#4a2c1c', // dark brown (hair)
    K: '#111114', // black (eyes, belt, shoes)
    S: '#f9b15a', // skin
    R: '#e02424', // red
    G: '#b9b9bd', // light gray
    Y: '#f5c431', // yellow
    U: '#3a6fd8', // blue
    N: '#3fa35a', // green
    L: '#9fd0ff', // light blue (lenses)
    T: '#8a5a32', // brown (programmer pants)
    w: '#c7cdf5', // sleepy z's
    y: '#f5d142', g: '#3fa35a', l: '#6fa8ff', o: '#e8873a', n: '#0b1a3a', // monitor code
  };

  const blank = () => '.'.repeat(S);
  const shiftRow = (row, n) =>
    n >= 0 ? ('.'.repeat(n) + row).slice(0, S) : row.slice(-n).padEnd(S, '.');
  const mirror = (row) => row.split('').reverse().join('');
  const bob = (g) => [blank(), ...g.slice(0, 14), g[15]]; // standing squash
  const bobSeated = (g) => [blank(), ...g.slice(0, 11), ...g.slice(12)];
  const jump = (g) => [...g.slice(1), blank()];
  const withLegs = (g, rows) => [...g.slice(0, 13), ...rows];
  const lean = (g, head, body) =>
    g.map((row, i) =>
      i >= 1 && i <= 6 ? shiftRow(row, head) : i >= 7 && i <= 8 ? shiftRow(row, body) : row
    );

  // ---------- Listener: blue headband, yellow sleeves, blue overalls ----------
  // ~10 px wide x 15 tall, big head, short legs, faces right.
  const L = [
    blank(),
    '....B.BBBB.B....',
    '....BBBBBBBB....',
    '..UUUUUUUUUU....',
    '..UBBSSSSKSS....',
    '..UBBSSSSKSSS...',
    '...BBSSSSSSS....',
    '...YYYUUUUYYY...',
    '...YYYUUUUYYY...',
    '...YYYUUUUYYY...',
    '...SSKKKKKKSS...',
    '....UUUUUUUU....',
    '....UUUUUUUU....',
    '....UUU..UUU....',
    '....UUU..UUU....',
    '...BBBB..BBBB...',
  ];
  const walkApart = withLegs(L, ['...UUU....UUU...', '..UUU......UUU..', '..BBBB....BBBB..']);
  const walkTogether = withLegs(L, ['.....UUUUUU.....', '.....UUUUUU.....', '....BBBBBBBB....']);

  // ---- Listener asleep: lying low on the ground; waking = lying -> crouch -> (standing) ----
  const LYING = [
    ...Array.from({ length: 12 }, blank),
    '..BBBBB.........',
    '.BUUUUUYYYUUUUBB',
    '.BSSKSSYYYUUUUUB',
    '..SSSS..........',
  ];
  const CROUCH = [
    blank(), blank(), blank(), blank(),
    ...L.slice(1, 11),
    '....UUUUUUUU....',
    '...BBBBBBBBBB...',
  ];

  // ---------- Programmer: green cap, glasses, red shirt, gray sleeves (seated, faces right) ----------
  const HEAD_P = [
    '.....NNNNN......',
    '....NNNNNNNNNN..',
    '...BBSSSSSSS....',
    '...BBSSSLKLSS...',
    '...BBSSSLLLSSS..',
    '...BBSSSSSSS....',
  ];
  const prog = (head, r10, r11) => [
    blank(),
    ...head,
    '....RRRRRR......',
    '....RRRGGR......',
    '....RRRGGR......',
    r10,
    r11,
    '....TTTTTTTTTT..',
    '....TTTTTTTTTT..',
    '...........TTT..',
    '..........BBBBB.',
  ];
  const HANDS_UP = ['....RRRGGGGGGSS.', '....KKKKKK......'];
  const HANDS_DN = ['....RRRGGGGGG...', '....KKKKKK..GSS.'];
  const PA = prog(HEAD_P, ...HANDS_UP);
  const PB = prog(HEAD_P, ...HANDS_DN);
  const PTURN = prog(HEAD_P.map(mirror), ...HANDS_UP);

  // ---- Programmer asleep: head down on folded arms at the desk ----
  const PSLEEP = [
    ...Array.from({ length: 8 }, blank),
    '....RRRR........',
    '....RRRRRRNNNN..',
    '....RRRRRBSSKSS.',
    '....RRRRRGGGGGG.',
    '....TTTTTTTTTT..',
    '....TTTTTTTTTT..',
    '...........TTT..',
    '..........BBBBB.',
  ];
  const PLIFT = [...PSLEEP.slice(0, 7), ...PSLEEP.slice(8, 12), blank(), ...PSLEEP.slice(12)];

  // ---------- Monitor: gray bezel, 3 frames of scrolling "code" ----------
  const LENS = [[6, 3, 8, 4, 7, 5], [4, 7, 3, 8, 5, 6], [7, 5, 6, 3, 8, 4]];
  const CODE = 'ylgoyl';
  const monitor = (f) => {
    const g = Array.from({ length: S }, blank);
    g[1] = '..GGGGGGGGGGGG..';
    for (let i = 0; i < 6; i++) {
      let inner = '';
      for (let c = 0; c < 10; c++) inner += c < LENS[f][i] ? CODE[i] : 'n';
      g[2 + i] = '..G' + inner + 'G..';
    }
    g[8] = '..GGGGGGGGGGGG..';
    g[9] = '......GGGG......';
    g[10] = '....KKKKKKKK....';
    return g;
  };

  // Screen dimmed and tipped down (low profile while asleep)
  const monitorOff = () => {
    const g = Array.from({ length: S }, blank);
    g[7] = '..GGGGGGGGGGGG..';
    g[8] = '..GnnnnnnnnnnG..';
    g[9] = '..GGGGGGGGGGGG..';
    g[10] = '....KKKKKKKK....';
    return g;
  };

  const ZZ0 = ['....wwww', '......w.', '.....w..', '....wwww', '........', '.ww.....', '..w.....', '.ww.....'];
  const ZZ1 = ['...wwww.', '.....w..', '....w...', '...wwww.', '........', '..ww....', '...w....', '..ww....'];

  // ---------- "!" reaction (8x8) ----------
  const BANG = [
    '...yy...', '...yy...', '...yy...', '...yy...',
    '........', '...yy...', '...yy...', '........',
  ];

  // ===================== Emotes, actions, fight: extra art =====================
  // Palette additions for the new art.
  Object.assign(PALETTE, {
    W: '#ffffff', c: '#d5d9ea', d: '#7f86a8', D: '#4a4f66',
    P: '#ff5fa2', V: '#6fc3ff', M: '#5b7fe0', O: '#ff9a2e',
  });

  // patch(grid, [[row, col, 'str'], ...]): ' ' = leave as is, '.' = erase, anything else = paint.
  const patch = (g, edits) => {
    const out = g.map((r) => r.split(''));
    for (const [row, col, str] of edits) {
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === ' ') continue;
        if (row < 0 || row >= out.length || col + i < 0 || col + i >= out[row].length) continue;
        out[row][col + i] = c;
      }
    }
    return out.map((r) => r.join(''));
  };
  // Move the head rows (lo..hi) by dx/dy and draw them over whatever is underneath.
  const headShift = (g, dx, dy, lo = 1, hi = 6) => {
    const out = g.slice();
    for (let i = lo; i <= hi; i++) out[i] = blank();
    for (let i = lo; i <= hi; i++) {
      const t = i + dy;
      if (t < 0 || t >= g.length) continue;
      const src = shiftRow(g[i], dx);
      out[t] = out[t].split('').map((c, k) => (src[k] !== '.' ? src[k] : c)).join('');
    }
    return out;
  };

  // ---- Listener poses ----
  const lArmR = (g, hx) => patch(g, [
    [10, 11, '..'], [8, 10, '...'], [9, 10, '...'],
    [7, 13, 'YY'], [5, 13, 'YY'], [6, 13, 'YY'], [3, hx, 'SS'], [4, hx, 'SS'],
  ]);
  const lArmL = (g) => patch(g, [
    [10, 3, '..'], [8, 3, '...'], [9, 3, '...'],
    [7, 0, 'YYY'], [5, 0, 'YY'], [6, 0, 'YY'], [3, 0, 'SS'], [4, 0, 'SS'],
  ]);
  const L_CHEER = lArmL(lArmR(L, 13));
  const L_COOL = patch(L, [[4, 6, 'KKKKKK'], [5, 7, 'KK'], [5, 9, 'S'], [5, 10, 'KK']]);
  const lShake = (row) => patch(L, [[row, 13, 'YSS']]);

  // ---- Programmer: seated extras ----
  const P_COOL = patch(PA, [[4, 7, 'KKKKK'], [5, 8, 'K'], [5, 9, 'S'], [5, 10, 'K']]);
  const P_SMASH_UP = patch(PA, [
    [10, 0, '....RRRGGR......'],
    [7, 1, 'GGG'], [4, 1, 'GG'], [5, 1, 'GG'], [6, 1, 'GG'], [2, 1, 'SS'], [3, 1, 'SS'],
    [7, 10, 'GGGGGG'], [4, 14, 'GG'], [5, 14, 'GG'], [6, 14, 'GG'], [2, 14, 'SS'], [3, 14, 'SS'],
  ]);
  const P_SMASH_DN = headShift(PB, 1, 1);

  // ---- Programmer: standing (faces right; mirrored by CSS when he faces left) ----
  const PST = [
    blank(),
    ...HEAD_P,
    '...GRRRRRRG.....',
    '...GRRRRRRG.....',
    '...GRRRRRRG.....',
    '...SKKKKKKS.....',
    '....TTTTTT......',
    '....TTTTTT......',
    '....TT..TT......',
    '....TT..TT......',
    '...KKK..KKK.....',
  ];
  const pWalkApart = withLegs(PST, ['...TT....TT.....', '..TT......TT....', '..KKK....KKK....']);
  const pWalkTogether = withLegs(PST, ['.....TTTT.......', '.....TTTT.......', '....KKKKKK......']);
  const pArmR = (g, hx) => patch(g, [
    [10, 10, '.'], [8, 10, '.'], [9, 10, '.'],
    [7, 10, 'GGGGGG'], [5, 14, 'GG'], [6, 14, 'GG'], [3, hx, 'SS'], [4, hx, 'SS'],
  ]);
  const pArmL = (g) => patch(g, [
    [10, 3, '.'], [8, 3, '.'], [9, 3, '.'],
    [7, 1, 'GGG'], [5, 1, 'GG'], [6, 1, 'GG'], [3, 1, 'SS'], [4, 1, 'SS'],
  ]);
  const P_CHEER = pArmL(pArmR(PST, 14));
  // handshake: right arm stretched straight out (row 8), pumped one row down on the 2nd frame
  const pShake = (row) => patch(PST, [[row, 11, 'GGSS']]);

  // ---- Monitor: damaged / new ----
  const MON_INNER = (rows, str) => rows.map((r) => [r, 3, str]);
  const monitorCrack1 = () => patch(monitor(0), [
    [2, 8, 'W'], [3, 7, 'W'], [4, 7, 'W'], [5, 6, 'W'], [6, 6, 'W'], [7, 5, 'W'],
    [4, 8, 'WW'], [5, 9, 'W'], [3, 4, 'wwww'], [6, 8, 'wwwn'],
  ]);
  const monitorCrack2 = () => patch(monitor(0), [
    ...MON_INNER([2, 3, 4, 5, 6, 7], 'nnnnnnnnnn'),
    [2, 9, 'W'], [3, 8, 'W'], [4, 7, 'W'], [5, 6, 'W'], [6, 5, 'W'], [7, 4, 'W'],
    [2, 5, 'W'], [3, 6, 'W'], [5, 8, 'W'], [6, 9, 'W'], [7, 10, 'W'], [4, 3, 'nnnnWWWWnn'],
    [1, 12, '..'], [8, 2, 'G.'], [0, 9, 'D'], [0, 11, 'D'],
  ]);
  const monitorDark = () => patch(monitor(0), MON_INNER([2, 3, 4, 5, 6, 7], 'nnnnnnnnnn'));
  const monitorBoot = () => patch(monitor(0), MON_INNER([2, 3, 4, 5, 6, 7], 'WWWWWWWWWW'));

  // ---- Emote icons (16x16 canvases; art sits just above the head) ----
  const emo = (art, ox = 0, oy = 0) => {
    const g = Array.from({ length: 16 }, () => '.'.repeat(16));
    return patch(g, art.map((line, i) => [oy + i, ox, line.replace(/\./g, ' ')]));
  };
  const SMILE = [
    '..YYYYY..', '.YYYYYYY.', 'YYKYYYKYY', 'YYKYYYKYY', 'YYYYYYYYY',
    'YKYYYYYKY', 'YYKKKKKYY', '.YYYYYYY.', '..YYYYY..',
  ];
  const rain = (f) => [
    '...MMMM....', '..MMMMMMM..', '.MMMMMMMMM.', 'MMMMMMMMMMM', '.MMMMMMMMM.',
    ...(f ? ['....V...V..', '..V...V....', '....V...V..'] : ['..V...V....', '....V...V..', '..V...V....']),
  ];
  const ANGER = [
    'RR.....RR', 'R.R...R.R', '..RR.RR..', '....R....', '..RR.RR..', 'R.R...R.R', 'RR.....RR',
  ];
  const SPARK = ['...W...', '...W...', '..WYW..', 'WWYYYWW', '..WYW..', '...W...', '...W...'];
  const SPARK2 = ['.......', '...W...', '...W...', '.WWYWW.', '...W...', '...W...', '.......'];
  const EXCL = [
    ['..YY....', '..YY....', '..YY....', '..YY....', '..YY....', '........', '..YY....'],
    ['Y.YY..Y.', '.YYY.Y..', '..YY....', '..YY....', '..YY....', '........', '..YY....'],
  ].map((a) => a.map((r) => r.slice(0, 8)));
  const thinkBubble = (n) => {
    const g = [
      '...dddddddd...', '..dWWWWWWWWd..', '.dWWWWWWWWWWd.', '.dWWWWWWWWWWd.',
      '..dWWWWWWWWd..', '...dddddddd...', '..dWd.........', '...d..........',
    ];
    const dots = [[2, 3], [2, 6], [2, 9]].slice(0, n);
    return patch(g, dots.flatMap(([r, c]) => [[r, c, 'DD'], [r + 1, c, 'DD']]));
  };
  const HEART = [
    '.PP...PP.', 'PPPP.PPPP', 'PPPPPPPPP', 'PPPPPPPPP', '.PPPPPPP.', '..PPPPP..', '...PPP...', '....P....',
  ];
  const HEART2 = [
    '.........', '..PP.PP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..', '...PPP...', '....P....', '.........',
  ];
  const NOTE = [
    '...UUUU.', '...U.UUU', '...U..U.', '...U....', '...U....', '.UUU....', 'UUUU....', '.UU.....',
  ];
  const QMARK = ['.YYY.', 'Y...Y', '....Y', '...Y.', '..Y..', '..Y..', '.....', '..Y..'];
  const FONT = {
    T: ['XXX', '.X.', '.X.', '.X.', '.X.'],
    H: ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'],
    X: ['X.X', 'X.X', '.X.', 'X.X', 'X.X'],
  };
  const thxArt = () => {
    const w = 15;
    const g = Array.from({ length: 11 }, () => Array(w).fill('.'));
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < w; x++) g[y][x] = y === 0 || y === 8 || x === 0 || x === w - 1 ? 'D' : 'W';
    }
    [[0, 0], [0, w - 1], [8, 0], [8, w - 1]].forEach(([y, x]) => (g[y][x] = '.'));
    g[8][7] = 'W'; g[9][6] = 'D'; g[9][7] = 'W'; g[9][8] = 'D'; g[10][7] = 'D';
    'THX'.split('').forEach((ch, i) => {
      FONT[ch].forEach((row, y) => row.split('').forEach((p, x) => { if (p === 'X') g[2 + y][2 + i * 4 + x] = 'U'; }));
    });
    return g.map((r) => r.join(''));
  };
  const dizzyFrame = (f) => {
    let g = emo([]);
    for (let k = 0; k < 3; k++) {
      const a = ((k / 3) + f / 8) * Math.PI * 2;
      const x = Math.round(7 + 5 * Math.cos(a)), y = Math.round(10 + 2 * Math.sin(a));
      g = patch(g, [[y - 1, x - 1, '.Y.'], [y, x - 1, 'YYY'], [y + 1, x - 1, '.Y.']]);
    }
    return g;
  };
  // Spiky impact star (for POW hits).
  const starGrid = (N, rOut, rIn, n, rot) => {
    const c = (N - 1) / 2, rows = [];
    for (let y = 0; y < N; y++) {
      let row = '';
      for (let x = 0; x < N; x++) {
        const dx = x - c, dy = y - c, d = Math.hypot(dx, dy);
        let t = ((Math.atan2(dy, dx) / (2 * Math.PI) + rot) * n) % 1;
        if (t < 0) t += 1;
        const r = rOut - (rOut - rIn) * Math.abs(t - 0.5) * 2;
        row += d > r ? '.' : d > r - 1.1 ? 'O' : d <= r * 0.4 ? 'W' : 'Y';
      }
      rows.push(row);
    }
    return rows;
  };

  // ---- Fight cloud (26x26): white dust ball with fists, boots and stars poking out ----
  const cloudFrame = (f, sc, pokes) => {
    const N = 26, cx = 12.5, cy = 13.3;
    const lumps = [[cx, cy, 7 * sc]];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + f * 0.4;
      const rr = (6.2 + ((i * 7 + f * 5) % 3) * 0.6) * sc;
      lumps.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.95, (3.8 + ((i + f) % 3) * 0.5) * sc]);
    }
    const inside = (x, y) => lumps.some(([lx, ly, r]) => (x - lx) ** 2 + (y - ly) ** 2 <= r * r);
    const g = Array.from({ length: N }, () => Array(N).fill('.'));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!inside(x, y)) continue;
        const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !inside(x + a, y + b));
        g[y][x] = edge ? 'd' : (x - cx) + (y - cy) > 7 || (x * 7 + y * 13 + f * 5) % 11 === 0 ? 'c' : 'W';
      }
    }
    const SHAPES = {
      fist: [['.SS'], ['RSS'], ['R..']],
      boot: [['KK.'], ['KKT'], ['..T']],
      star: [['.Y.'], ['YYY'], ['.Y.']],
    };
    pokes.forEach(([kind, deg]) => {
      const a = (deg * Math.PI) / 180;
      const px = Math.round(cx + Math.cos(a) * 11.5), py = Math.round(cy + Math.sin(a) * 11);
      SHAPES[kind].forEach((row, j) => row[0].split('').forEach((ch, i) => {
        const X = px - 1 + i, Y = py - 1 + j;
        if (ch !== '.' && X >= 0 && X < N && Y >= 0 && Y < N) g[Y][X] = ch;
      }));
    });
    return g.map((r) => r.join(''));
  };

  // Sheet layout for PNG replacement: one ROW per state (in the order below),
  // frames laid out left-to-right in that row.
  MOCHI.PALETTE = PALETTE;
  MOCHI.SPRITES = {
    listener: {
      png: null, // e.g. 'assets/listener/listener.png'
      size: S,
      states: {
        idle: { ms: 450, frames: [L, bob(L)] },
        listening: { ms: 100, frames: [jump(L)] },
        walking: { ms: 100, frames: [walkApart, walkTogether] },
        whispering: { ms: 140, frames: [lean(L, 2, 1), lean(L, 3, 1)] },
        sleeping: { ms: 600, frames: [LYING] },
        waking: { ms: 100, frames: [LYING, CROUCH] },
        // ---- emotions / actions (appended: keeps the old PNG row order) ----
        happy: { ms: 140, frames: [L, bob(L)] },
        sad: { ms: 700, frames: [headShift(L, 1, 1), headShift(L, 2, 1)] },
        sleepy: { ms: 450, frames: [headShift(L, 1, 1), headShift(L, 2, 2)] },
        cool: { ms: 500, frames: [L_COOL, bob(L_COOL)] },
        surprised: { ms: 100, frames: [jump(L)] },
        think: { ms: 650, frames: [L, lean(L, 1, 0)] },
        wave: { ms: 180, frames: [lArmR(L, 13), lArmR(L, 14)] },
        cheer: { ms: 130, frames: [L_CHEER, bob(L_CHEER)] },
        dance: { ms: 200, frames: [lArmR(L, 13), bob(L_CHEER), lArmL(L), bob(L_CHEER)] },
        bow: { ms: 100, frames: [L, headShift(L, 2, 1), headShift(L, 3, 3)] },
        shake: { ms: 230, frames: [lShake(8), lShake(9)] },
      },
    },
    programmer: {
      png: null, // e.g. 'assets/programmer/programmer.png'
      size: S,
      states: {
        idle: { ms: 500, frames: [PA, bobSeated(PA)] },
        typing: { ms: 110, frames: [PA, PB] },
        listening: { ms: 100, frames: [PTURN] },
        sleeping: { ms: 600, frames: [PSLEEP] },
        waking: { ms: 100, frames: [PSLEEP, PLIFT] },
        // ---- emotions / actions (appended) ----
        happy: { ms: 140, frames: [PA, bobSeated(PA)] },
        sad: { ms: 700, frames: [headShift(PB, 1, 1)] },
        sleepy: { ms: 450, frames: [headShift(PA, 1, 1), headShift(PA, 2, 2)] },
        cool: { ms: 500, frames: [P_COOL, bobSeated(P_COOL)] },
        surprised: { ms: 100, frames: [PTURN] },
        think: { ms: 800, frames: [PA, PTURN] },
        rage: { ms: 60, frames: [PA, PB] },
        smashUp: { ms: 100, frames: [P_SMASH_UP] },
        smashDn: { ms: 100, frames: [P_SMASH_DN] },
        stand: { ms: 450, frames: [PST, bob(PST)] },
        walk: { ms: 100, frames: [pWalkApart, pWalkTogether] },
        wave: { ms: 180, frames: [pArmR(PST, 14), pArmR(PST, 13)] },
        cheer: { ms: 130, frames: [P_CHEER, bob(P_CHEER)] },
        dance: { ms: 200, frames: [pArmR(PST, 14), bob(P_CHEER), pArmL(PST), bob(P_CHEER)] },
        shake: { ms: 230, frames: [pShake(8), pShake(9)] },
      },
    },
    monitor: {
      png: null, // e.g. 'assets/environment/monitor.png'
      size: S,
      states: {
        screen: { ms: 380, frames: [monitor(0), monitor(1), monitor(2)] },
        off: { ms: 600, frames: [monitorOff()] },
        crack1: { ms: 90, frames: [monitorCrack1()] },
        crack2: { ms: 90, frames: [monitorCrack2()] },
        dark: { ms: 90, frames: [monitorDark()] },
        boot: { ms: 90, frames: [monitorBoot()] },
      },
    },
    zzz: {
      png: null, // e.g. 'assets/environment/zzz.png'
      size: 8,
      states: { z: { ms: 500, frames: [ZZ0, ZZ1] } },
    },
    bang: {
      png: null, // e.g. 'assets/environment/bang.png'
      size: 8,
      states: { pop: { ms: 100, frames: [BANG] } },
    },
    // 16x16 icons that float above a head (also used as free-floating effects)
    emote: {
      png: null, // e.g. 'assets/environment/emote.png'
      size: 16,
      states: {
        smile: { ms: 300, frames: [emo(SMILE, 3, 4), emo(SMILE, 3, 3)] },
        rain: { ms: 260, frames: [emo(rain(0), 2, 5), emo(rain(1), 2, 5)] },
        anger: { ms: 160, frames: [emo(ANGER, 3, 6), emo(patch(ANGER, [[3, 3, 'RRR']]), 3, 5)] },
        spark: { ms: 220, frames: [emo(SPARK, 4, 6), emo(SPARK2, 4, 6)] },
        excl: { ms: 120, frames: EXCL.map((a) => emo(a, 4, 6)) },
        think: { ms: 450, frames: [1, 2, 3].map((n) => emo(thinkBubble(n), 1, 5)) },
        heart: { ms: 280, frames: [emo(HEART, 3, 5), emo(HEART2, 3, 5)] },
        note: { ms: 240, frames: [emo(NOTE, 4, 5), emo(NOTE.map((r) => '..' + r.slice(0, -2)), 4, 4)] },
        qmark: { ms: 300, frames: [emo(QMARK, 5, 5), emo(QMARK, 5, 4)] },
        thx: { ms: 260, frames: [emo(thxArt(), 0, 2), emo(thxArt(), 0, 1)] },
        dizzy: { ms: 120, frames: [0, 1, 2, 3, 4, 5, 6, 7].map(dizzyFrame) },
        burst: { ms: 90, frames: [emo(starGrid(13, 6.3, 3.2, 8, 0), 1, 1), emo(starGrid(13, 5.6, 2.6, 8, 1 / 16), 1, 1)] },
        bursts: { ms: 90, frames: [emo(starGrid(13, 3.8, 2.2, 6, 0), 1, 1)] },
      },
    },
    // 26x26 fight cloud
    cloud: {
      png: null, // e.g. 'assets/environment/cloud.png'
      size: 26,
      states: {
        puff: { ms: 70, frames: [cloudFrame(0, 0.45, []), cloudFrame(1, 0.75, [])] },
        fight: {
          ms: 110,
          frames: [
            cloudFrame(0, 1, [['fist', 200], ['boot', 340], ['star', 100]]),
            cloudFrame(1, 1, [['boot', 160], ['fist', 20], ['star', 270]]),
            cloudFrame(2, 1, [['fist', 300], ['star', 190], ['boot', 70]]),
          ],
        },
      },
    },
  };

  const cache = {};
  MOCHI.getSheet = (key) => {
    if (cache[key]) return cache[key];
    const def = MOCHI.SPRITES[key];
    const names = Object.keys(def.states);
    const cols = Math.max(...names.map((n) => def.states[n].frames.length));
    let source;
    if (def.png) {
      source = new Image();
      source.src = chrome.runtime.getURL(def.png);
    } else {
      source = document.createElement('canvas');
      source.width = cols * def.size;
      source.height = names.length * def.size;
      const ctx = source.getContext('2d');
      names.forEach((n, row) =>
        def.states[n].frames.forEach((grid, col) =>
          grid.forEach((line, y) => {
            for (let x = 0; x < line.length; x++) {
              const c = PALETTE[line[x]];
              if (!c) continue;
              ctx.fillStyle = c;
              ctx.fillRect(col * def.size + x, row * def.size + y, 1, 1);
            }
          })
        )
      );
    }
    return (cache[key] = { source, cols, rows: names.length });
  };
})();
