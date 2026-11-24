// ============================================================================
// YARI KURDI - ULTRA-SMOOTH 120FPS PIXI.JS v7 YALLA-LUDO ENGINE (BOT + ONLINE)
// Bottom-Perspective Auto-Flip + 3D Hopping Physics + Capture Reverse Flight
// ============================================================================

// ڕێڕەوی ستانداردی ٥٢ خانەیی لودۆ (بە ئاڕاستەی میلی کاتژمێر)
const LUDO_MAIN_PATH = [
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0],
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6]
];

// ڕێڕەوی ناوەوە بەرەو تاجی خۆری کوردستان (Home Stretch)
const LUDO_HOME_PATHS = {
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  red:    [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]]
};

// شوێنی وەستانی ٤ داشەکە لەناو قەڵاکانیاندا
const LUDO_BASE_SOCKETS = {
  yellow: [[10.55, 1.55], [10.55, 3.45], [12.45, 1.55], [12.45, 3.45]],
  red:    [[1.55, 10.55], [1.55, 12.45], [3.45, 10.55], [3.45, 12.45]],
  pearl:  [[1.55, 1.55],  [1.55, 3.45],  [3.45, 1.55],  [3.45, 3.45]],
  green:  [[10.55, 10.55],[10.55, 12.45],[12.45, 10.55],[12.45, 12.45]]
};

// ٨ خانە ئارامەکان (ئەستێرەکان کە هیچ داشێکیان تێدا ناخورێت)
const LUDO_SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// بارودۆخی گشتی یارییەکە
const ludoState = {
  mode: 'bot', // 'bot' | 'online'
  myColor: 'yellow',
  turn: 'yellow',
  diceValue: null,
  diceRolled: false,
  isAnimating: false,
  consecutiveSixes: 0,
  turnTimerSec: 15,
  tokens: {
    yellow: [-1, -1, -1, -1],
    red:    [-1, -1, -1, -1]
  },
  winner: null
};

// گۆڕاوەکانی PixiJS v7 (120FPS)
let ludoPixiApp = null;
let boardBgLayer = null;
let ringLayer = null;
let shadowLayer = null;
let tokenLayer = null;
let fxLayer = null;
const ludoTweens = [];
const ludoTextureCache = new Map();
let lastBakedPerspective = null;
let ludoTurnInterval = null;
let pulseClock = 0;

// گۆڕاوەکانی ئۆنڵاین
let isLudoOnline = false;
let ludoMySeat = 0;
let ludoIsHost = false;
let ludoRoomRef = null;
let ludoRoomListener = null;
let ludoLastSeq = -1;
let ludoServerSeq = 0;
let ludoOppDisplayName = 'هاوڕێ';

// ============================================================================
// ١. سیستمی دەنگی Yalla Ludo (Zero-Latency Web Audio API)
// ============================================================================
let ludoAudioCtx = null;
function playLudoSfx(type) {
  try {
    if (!ludoAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ludoAudioCtx = new AudioCtx();
    }
    if (ludoAudioCtx.state === 'suspended') ludoAudioCtx.resume();
    const now = ludoAudioCtx.currentTime;

    if (type === 'hop') {
      const osc = ludoAudioCtx.createOscillator();
      const gain = ludoAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.connect(gain); gain.connect(ludoAudioCtx.destination);
      osc.start(now); osc.stop(now + 0.07);
    } else if (type === 'dice') {
      [0, 0.045, 0.09].forEach((delay, idx) => {
        const osc = ludoAudioCtx.createOscillator();
        const gain = ludoAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580 - idx * 90, now + delay);
        osc.frequency.exponentialRampToValueAtTime(220, now + delay + 0.04);
        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.045);
        osc.connect(gain); gain.connect(ludoAudioCtx.destination);
        osc.start(now + delay); osc.stop(now + delay + 0.05);
      });
    } else if (type === 'six') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ludoAudioCtx.createOscillator();
        const gain = ludoAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        gain.gain.setValueAtTime(0.2, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.16);
        osc.connect(gain); gain.connect(ludoAudioCtx.destination);
        osc.start(now + i * 0.055); osc.stop(now + i * 0.055 + 0.17);
      });
    } else if (type === 'capture') {
      const osc = ludoAudioCtx.createOscillator();
      const gain = ludoAudioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain); gain.connect(ludoAudioCtx.destination);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'home') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ludoAudioCtx.createOscillator();
        const gain = ludoAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.26, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);
        osc.connect(gain); gain.connect(ludoAudioCtx.destination);
        osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.3);
      });
    }
  } catch (e) {}
}

// ============================================================================
// ٢. سیستمی ئەنیمەیشنی 120FPS و گۆڕینی گۆشەی دیدگای یاریزان (Auto-Flip 180°)
// ============================================================================
function addLudoTween(config) {
  ludoTweens.push({
    target: config.target,
    from: { ...config.from },
    to: { ...config.to },
    duration: config.duration || 140,
    elapsed: 0,
    ease: config.ease || (t => 1 - Math.pow(1 - t, 3)),
    onUpdate: config.onUpdate || null,
    onComplete: config.onComplete || null
  });
}

function updateLudo120FPSTicker(deltaMS) {
  pulseClock += deltaMS * 0.0065;

  for (let i = ludoTweens.length - 1; i >= 0; i--) {
    const tw = ludoTweens[i];
    tw.elapsed += deltaMS;
    const raw = Math.min(1, tw.elapsed / tw.duration);
    const p = tw.ease(raw);

    if (tw.target && !tw.target.destroyed) {
      for (const k in tw.to) {
        tw.target[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * p;
      }
      if (tw.onUpdate) tw.onUpdate(raw, p);
    }

    if (raw >= 1) {
      ludoTweens.splice(i, 1);
      if (tw.onComplete) tw.onComplete();
    }
  }

  // لێدانی نەرمی ئەڵقەی درەوشاوەی داشە ئامادەکان بە 120FPS
  if (ringLayer && ringLayer.children.length > 0) {
    const s = 1 + Math.sin(pulseClock) * 0.12;
    const a = 0.65 + Math.sin(pulseClock) * 0.3;
    for (const ring of ringLayer.children) {
      ring.scale.set(s);
      ring.alpha = a;
    }
  }
}

// سووڕانەوەی ١٨٠ پلە بۆ یاریزانی دووەم (سوور) تا هەمیشە ماڵی خۆی لە خوارەوەی چەپ ببینی!
function toViewGrid(r, c) {
  if (ludoState.myColor === 'red') {
    return [14 - r, 14 - c];
  }
  return [r, c];
}

// ============================================================================
// ٣. دروستکردنی تەختەی 4K و پوولی تاجدار لەسەر GPU (PixiJS Textures)
// ============================================================================
function bakeTokenTextures() {
  if (ludoTextureCache.has('token_yellow')) return;
  const SZ = 160;
  const cx = SZ / 2;
  const cy = SZ / 2;
  const r = 60;

  const schemes = {
    yellow: { rim: '#fef08a', main: '#d97706', top: '#facc15', dark: '#78350f' },
    red:    { rim: '#fecaca', main: '#dc2626', top: '#ef4444', dark: '#7f1d1d' }
  };

  Object.entries(schemes).forEach(([col, sc]) => {
    const canvas = document.createElement('canvas');
    canvas.width = SZ;
    canvas.height = SZ;
    const ctx = canvas.getContext('2d');

    // قەراغی ٣ ڕەهەندی خوارەوەی داشەکە
    ctx.fillStyle = sc.dark;
    ctx.beginPath();
    ctx.arc(cx, cy + 6, r, 0, Math.PI * 2);
    ctx.fill();

    // چوارچێوەی زێڕین/سپی دەرەوە
    ctx.fillStyle = sc.rim;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // ناوەوەی گەوهەری
    const grad = ctx.createRadialGradient(cx - 14, cy - 16, 6, cx, cy, r * 0.85);
    grad.addColorStop(0, sc.top);
    grad.addColorStop(1, sc.main);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
    ctx.fill();

    // بریقەی شووشەیی سەرەوە
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.beginPath();
    ctx.ellipse(cx - 12, cy - 22, 26, 13, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // تاجی شاهانەی ناوەڕاست
    ctx.font = '56px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', cx, cy + 3);

    ludoTextureCache.set(`token_${col}`, PIXI.Texture.from(canvas));
  });

  // تێکسچەری سێبەری نەرمی ژێر داشەکە
  const shCanvas = document.createElement('canvas');
  shCanvas.width = 128;
  shCanvas.height = 128;
  const shCtx = shCanvas.getContext('2d');
  const shGrad = shCtx.createRadialGradient(64, 64, 8, 64, 64, 54);
  shGrad.addColorStop(0, 'rgba(0, 0, 0, 0.52)');
  shGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shCtx.fillStyle = shGrad;
  shCtx.beginPath();
  shCtx.arc(64, 64, 54, 0, Math.PI * 2);
  shCtx.fill();
  ludoTextureCache.set('token_shadow', PIXI.Texture.from(shCanvas));
}

function bakePerspectiveBoardTexture() {
  const isRedBottom = (ludoState.myColor === 'red');
  const cacheKey = isRedBottom ? 'board_red_bottom' : 'board_yellow_bottom';
  if (ludoTextureCache.has(cacheKey)) return ludoTextureCache.get(cacheKey);

  const W = 1200;
  const H = 1200;
  const cs = W / 15;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, W, H);

  const C_RED = '#d91b2e', C_RED_DARK = '#880e1b', C_RED_PATH = '#fecaca';
  const C_YEL = '#f59e0b', C_YEL_DARK = '#b45309', C_YEL_PATH = '#fef08a';
  const C_GRN = '#15803d', C_GRN_DARK = '#064e3b', C_GRN_PATH = '#bbf7d0';
  const C_PRL = '#e2d9c5', C_PRL_DARK = '#64748b', C_PRL_PATH = '#f1f5f9';

  // ئەگەر یاریزانەکە سوور بوو، ڕەنگی خوارەوە دەبێتە سوور و سەرەوە دەبێتە زەرد!
  const botCol = isRedBottom ? C_RED : C_YEL;
  const botDark = isRedBottom ? C_RED_DARK : C_YEL_DARK;
  const botPath = isRedBottom ? C_RED_PATH : C_YEL_PATH;

  const topCol = isRedBottom ? C_YEL : C_RED;
  const topDark = isRedBottom ? C_YEL_DARK : C_RED_DARK;
  const topPath = isRedBottom ? C_YEL_PATH : C_RED_PATH;

  const leftCol = isRedBottom ? C_GRN : C_PRL;
  const leftDark = isRedBottom ? C_GRN_DARK : C_PRL_DARK;
  const leftPath = isRedBottom ? C_GRN_PATH : C_PRL_PATH;

  const rightCol = isRedBottom ? C_PRL : C_GRN;
  const rightDark = isRedBottom ? C_PRL_DARK : C_GRN_DARK;
  const rightPath = isRedBottom ? C_PRL_PATH : C_GRN_PATH;

  const fillCell = (r, c, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(c * cs, r * cs, cs, cs);
  };

  for (let i = 1; i <= 5; i++) {
    fillCell(14 - i, 7, botPath);   // ڕێڕەوی خوارەوە (هی خۆت)
    fillCell(i, 7, topPath);        // ڕێڕەوی سەرەوە (بەرامبەر)
    fillCell(7, i, leftPath);       // ڕێڕەوی چەپ
    fillCell(7, 14 - i, rightPath); // ڕێڕەوی ڕاست
  }

  fillCell(13, 6, botCol);
  fillCell(1, 8, topCol);
  fillCell(6, 1, leftDark);
  fillCell(8, 13, rightCol);

  // هێڵکاری تۆڕی ١٥×١٥
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.25)';
  ctx.lineWidth = 2.5;
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const inBase = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);
      const inCenter = (r >= 6 && r <= 8 && c >= 6 && c <= 8);
      if (!inBase && !inCenter) {
        ctx.strokeRect(c * cs, r * cs, cs, cs);
      }
    }
  }

  // کێشانی ٤ قەڵا سەرەکییەکە
  const drawBaseZone = (x, y, size, mainC, darkC, sockets, isLight) => {
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, mainC);
    g.addColorStop(1, darkC);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = 'rgba(120, 53, 15, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, size, size);

    const cx = x + size / 2;
    const cy = y + size / 2;
    const ringR = size * 0.39;

    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isLight ? '#d97706' : 'rgba(254, 240, 138, 0.55)';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    const sockR = cs * 0.46;
    sockets.forEach(([sr, sc]) => {
      const sx = (sc + 0.5) * cs;
      const sy = (sr + 0.5) * cs;
      ctx.fillStyle = isLight ? '#cbd5e1' : 'rgba(0, 0, 0, 0.36)';
      ctx.beginPath();
      ctx.arc(sx, sy, sockR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isLight ? '#f59e0b' : 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = 3.2;
      ctx.stroke();
    });
  };

  drawBaseZone(0, 0, cs * 6, leftCol, leftDark, LUDO_BASE_SOCKETS.pearl, !isRedBottom);
  drawBaseZone(cs * 9, 0, cs * 6, topCol, topDark, LUDO_BASE_SOCKETS.red, false);
  drawBaseZone(0, cs * 9, cs * 6, botCol, botDark, LUDO_BASE_SOCKETS.yellow, false);
  drawBaseZone(cs * 9, cs * 9, cs * 6, rightCol, rightDark, LUDO_BASE_SOCKETS.green, isRedBottom);

  // کێشانی ٨ ئەستێرەی خانە ئارامەکان
  const drawStar = (cx, cy, outerR, col) => {
    const innerR = outerR * 0.46;
    ctx.save();
    ctx.fillStyle = col;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const starCells = [
    { r: 13, c: 6, col: '#ffffff' },
    { r: 1, c: 8, col: '#ffffff' },
    { r: 6, c: 1, col: '#ffffff' },
    { r: 8, c: 13, col: '#ffffff' },
    { r: 8, c: 2, col: '#94a3b8' },
    { r: 2, c: 6, col: '#94a3b8' },
    { r: 6, c: 12, col: '#94a3b8' },
    { r: 12, c: 8, col: '#94a3b8' }
  ];
  starCells.forEach(st => drawStar((st.c + 0.5) * cs, (st.r + 0.5) * cs, cs * 0.34, st.col));

  // چوار سێگۆشەکەی ناوەڕاست و خۆری ٢١ تیشکی کوردستان
  const cx = W / 2, cy = H / 2;
  const cL = 6 * cs, cR = 9 * cs, cT = 6 * cs, cB = 9 * cs;

  const drawTri = (x1, y1, x2, y2, c1, c2) => {
    const g = ctx.createLinearGradient(cx, cy, (x1 + x2) / 2, (y1 + y2) / 2);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  drawTri(cL, cT, cR, cT, topCol, topDark);
  drawTri(cL, cB, cR, cB, botCol, botDark);
  drawTri(cL, cT, cL, cB, leftCol, leftDark);
  drawTri(cR, cT, cR, cB, rightCol, rightDark);

  // خۆری ٢١ تیشکی کوردستان لە چەقی تەختەکەدا
  const sunOuter = cs * 0.72, sunInner = cs * 0.38;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 14;
  const sunG = ctx.createRadialGradient(cx, cy, 4, cx, cy, sunOuter);
  sunG.addColorStop(0, '#ffffff');
  sunG.addColorStop(0.45, '#fef08a');
  sunG.addColorStop(1, '#d97706');
  ctx.fillStyle = sunG;
  ctx.beginPath();
  for (let i = 0; i < 42; i++) {
    const r = i % 2 === 0 ? sunOuter : sunInner;
    const a = (i * Math.PI) / 21 - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const tex = PIXI.Texture.from(canvas);
  ludoTextureCache.set(cacheKey, tex);
  return tex;
}

// ============================================================================
// ٤. دامەزراندنی PixiJS v7 و پیشاندانی داشەکان بە دیدگای یاریزان
// ============================================================================
function initLudoPixi() {
  const container = document.getElementById('ludoBoard');
  if (!container) return;

  bakeTokenTextures();

  if (!ludoPixiApp) {
    container.innerHTML = '';
    const dim = Math.min(container.clientWidth || 390, 444);

    ludoPixiApp = new PIXI.Application({
      width: dim,
      height: dim,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      powerPreference: 'high-performance'
    });

    container.appendChild(ludoPixiApp.view);

    boardBgLayer = new PIXI.Container();
    ringLayer = new PIXI.Container();
    shadowLayer = new PIXI.Container();
    tokenLayer = new PIXI.Container();
    fxLayer = new PIXI.Container();

    ludoPixiApp.stage.addChild(boardBgLayer, ringLayer, shadowLayer, tokenLayer, fxLayer);

    ludoPixiApp.ticker.maxFPS = 120;
    ludoPixiApp.ticker.add(() => {
      updateLudo120FPSTicker(ludoPixiApp.ticker.deltaMS);
    });

    window.addEventListener('resize', () => {
      if (!ludoPixiApp || !container) return;
      const newDim = container.clientWidth;
      if (newDim > 120) {
        ludoPixiApp.renderer.resize(newDim, newDim);
        refreshBoardBackground();
        renderLudoTokens();
      }
    });
  }

  refreshBoardBackground();
  renderLudoTokens();
}

function refreshBoardBackground() {
  if (!ludoPixiApp || !boardBgLayer) return;
  boardBgLayer.removeChildren();
  const tex = bakePerspectiveBoardTexture();
  const bg = new PIXI.Sprite(tex);
  bg.width = ludoPixiApp.screen.width;
  bg.height = ludoPixiApp.screen.height;
  boardBgLayer.addChild(bg);
}

function getCellSize() {
  return ludoPixiApp ? ludoPixiApp.screen.width / 15 : 26;
}

function getStepPixelCoord(color, step, tokenIndex) {
  const cs = getCellSize();
  if (step === -1) {
    const [sr, sc] = LUDO_BASE_SOCKETS[color][tokenIndex];
    const [vr, vc] = toViewGrid(sr, sc);
    return { x: (vc + 0.5) * cs, y: (vr + 0.5) * cs, key: `base_${color}_${tokenIndex}` };
  }
  if (step >= 56) {
    const homeOffsets = [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.22], [0.22, 0.22]];
    const [ox, oy] = homeOffsets[tokenIndex];
    const isBottom = (color === ludoState.myColor);
    const baseR = isBottom ? 8.18 : 6.82;
    const baseC = 7.5;
    return { x: (baseC + ox) * cs, y: (baseR + oy) * cs, key: `home_${color}_${tokenIndex}` };
  }
  if (step >= 51) {
    const hIdx = step - 51;
    const [hr, hc] = LUDO_HOME_PATHS[color][hIdx];
    const [vr, vc] = toViewGrid(hr, hc);
    return { x: (vc + 0.5) * cs, y: (vr + 0.5) * cs, key: `h_${color}_${hIdx}` };
  }
  const offset = color === 'yellow' ? 0 : 26;
  const globalIdx = (step + offset) % 52;
  const [r, c] = LUDO_MAIN_PATH[globalIdx];
  const [vr, vc] = toViewGrid(r, c);
  return { x: (vc + 0.5) * cs, y: (vr + 0.5) * cs, key: `m_${globalIdx}` };
}

function renderLudoTokens(hideTokenKey = null) {
  if (!ludoPixiApp) return;
  ringLayer.removeChildren();
  shadowLayer.removeChildren();
  tokenLayer.removeChildren();

  const cs = getCellSize();
  const isMyTurnToMove = (
    !ludoState.isAnimating &&
    ludoState.diceRolled &&
    ludoState.turn === ludoState.myColor
  );
  const validMoves = isMyTurnToMove ? getValidLudoTokenIndices(ludoState.myColor, ludoState.diceValue) : [];

  const cellGroups = {};
  ['yellow', 'red'].forEach(col => {
    ludoState.tokens[col].forEach((step, idx) => {
      if (hideTokenKey === `${col}_${idx}`) return;
      const pos = getStepPixelCoord(col, step, idx);
      if (!cellGroups[pos.key]) cellGroups[pos.key] = [];
      cellGroups[pos.key].push({ col, idx, step, x: pos.x, y: pos.y });
    });
  });

  const stackOffsets = {
    1: [[0, 0]],
    2: [[-0.17, -0.1], [0.17, 0.1]],
    3: [[-0.19, -0.14], [0.19, -0.14], [0, 0.19]],
    4: [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]
  };

  Object.values(cellGroups).forEach(group => {
    const count = group.length;
    const scale = count > 1 ? 0.82 : 1;
    const offs = stackOffsets[Math.min(count, 4)];
    const tokSize = cs * 0.88 * scale;

    group.forEach((item, gIdx) => {
      const [ox, oy] = offs[gIdx % 4];
      const tx = item.x + ox * cs;
      const ty = item.y + oy * cs;
      const isMovable = (item.col === ludoState.myColor && validMoves.includes(item.idx));

      // ئەڵقەی درەوشاوەی ژێر داشی ئامادە بۆ جووڵان
      if (isMovable) {
        const ring = new PIXI.Graphics();
        ring.lineStyle(3, 0xffffff, 0.95);
        ring.drawCircle(0, 0, tokSize * 0.56);
        ring.lineStyle(2, 0xfacc15, 0.9);
        ring.drawCircle(0, 0, tokSize * 0.68);
        ring.position.set(tx, ty);
        ringLayer.addChild(ring);
      }

      // سێبەری ژێر داشەکە
      const sh = new PIXI.Sprite(ludoTextureCache.get('token_shadow'));
      sh.anchor.set(0.5);
      sh.width = tokSize * 0.96;
      sh.height = tokSize * 0.96;
      sh.position.set(tx + 1.5, ty + 3.5);
      shadowLayer.addChild(sh);

      // سپرایتی داشەکە
      const sp = new PIXI.Sprite(ludoTextureCache.get(`token_${item.col}`));
      sp.anchor.set(0.5);
      sp.width = tokSize;
      sp.height = tokSize;
      sp.position.set(tx, ty);

      if (isMovable) {
        sp.eventMode = 'static';
        sp.cursor = 'pointer';
        // گەورەکردنی بازنەی کلیک تا لە مۆبایلدا زۆر بە ئاسانی دەستی لێ بدرێت
        sp.hitArea = new PIXI.Circle(0, 0, 95);
        sp.on('pointertap', () => executeLudoTokenMove(item.col, item.idx));
      }

      tokenLayer.addChild(sp);
    });

    // نیشانەی (×2، ×3) کاتێک چەند داشێک لە یەک خانەدا کۆدەبنەوە وەک Yalla Ludo
    if (count > 1 && group[0].step >= 0 && group[0].step < 56) {
      const badge = new PIXI.Container();
      badge.position.set(group[0].x + cs * 0.28, group[0].y - cs * 0.28);
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0f172a, 0.92);
      bg.lineStyle(1.5, 0xfacc15, 1);
      bg.drawRoundedRect(-11, -8, 22, 16, 8);
      bg.endFill();
      const txt = new PIXI.Text(`×${count}`, {
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: 10,
        fontWeight: '900',
        fill: '#fde047'
      });
      txt.anchor.set(0.5);
      badge.addChild(bg, txt);
      tokenLayer.addChild(badge);
    }
  });
}

// بازدانی ٣ ڕەهەندیی هەنگاو بە هەنگاو بە جیاکردنەوەی سێبەر لەسەر تەختەکە (120FPS)
function animateTokenHopPath(color, tokenIdx, fromStep, toStep, onDone) {
  if (!ludoPixiApp) {
    if (onDone) onDone();
    return;
  }

  const cs = getCellSize();
  const baseSize = cs * 0.88;
  const hideKey = `${color}_${tokenIdx}`;
  renderLudoTokens(hideKey);

  const waypoints = [];
  if (fromStep === -1 && toStep === 0) {
    waypoints.push(getStepPixelCoord(color, 0, tokenIdx));
  } else {
    for (let s = fromStep + 1; s <= toStep; s++) {
      waypoints.push(getStepPixelCoord(color, s, tokenIdx));
    }
  }

  const startPt = getStepPixelCoord(color, fromStep, tokenIdx);

  const flyShadow = new PIXI.Sprite(ludoTextureCache.get('token_shadow'));
  flyShadow.anchor.set(0.5);
  flyShadow.width = baseSize;
  flyShadow.height = baseSize;
  flyShadow.position.set(startPt.x + 1.5, startPt.y + 3.5);
  fxLayer.addChild(flyShadow);

  const flyToken = new PIXI.Sprite(ludoTextureCache.get(`token_${color}`));
  flyToken.anchor.set(0.5);
  flyToken.width = baseSize;
  flyToken.height = baseSize;
  flyToken.position.set(startPt.x, startPt.y);
  fxLayer.addChild(flyToken);

  let curX = startPt.x;
  let curY = startPt.y;

  const hopStep = (wIdx) => {
    if (wIdx >= waypoints.length) {
      flyShadow.destroy();
      flyToken.destroy();
      if (onDone) onDone();
      return;
    }

    const nextPt = waypoints[wIdx];
    const startX = curX;
    const startY = curY;
    const jumpHeight = fromStep === -1 ? cs * 0.95 : cs * 0.62;
    const duration = fromStep === -1 ? 185 : 135;

    playLudoSfx('hop');

    const driver = { t: 0 };
    addLudoTween({
      target: driver,
      from: { t: 0 },
      to: { t: 1 },
      duration: duration,
      ease: t => t,
      onUpdate: (raw) => {
        const arc = Math.sin(raw * Math.PI);
        const groundX = startX + (nextPt.x - startX) * raw;
        const groundY = startY + (nextPt.y - startY) * raw;

        // داشەکە بۆ حەوا بەرز دەبێتەوە، سێبەرەکە لەسەر زەوی دەمێنێتەوە و بچووک دەبێتەوە!
        flyToken.position.set(groundX, groundY - arc * jumpHeight);
        const scalePop = 1 + arc * 0.26;
        flyToken.width = baseSize * scalePop;
        flyToken.height = baseSize * scalePop;

        flyShadow.position.set(groundX + arc * 6, groundY + 4 + arc * 6);
        const shScale = 1 - arc * 0.35;
        flyShadow.width = baseSize * shScale;
        flyShadow.height = baseSize * shScale;
        flyShadow.alpha = 1 - arc * 0.45;
      },
      onComplete: () => {
        curX = nextPt.x;
        curY = nextPt.y;
        hopStep(wIdx + 1);
      }
    });
  };

  hopStep(0);
}

// گەڕانەوەی خێرای داشی خوراو بە فڕین و سووڕانەوە بۆ ناو قەڵاکەی
function animateCapturedTokenFlight(color, tokenIdx, fromStep, onDone) {
  if (!ludoPixiApp) {
    if (onDone) onDone();
    return;
  }
  const cs = getCellSize();
  const baseSize = cs * 0.88;
  const startPt = getStepPixelCoord(color, fromStep, tokenIdx);
  const endPt = getStepPixelCoord(color, -1, tokenIdx);

  const flyToken = new PIXI.Sprite(ludoTextureCache.get(`token_${color}`));
  flyToken.anchor.set(0.5);
  flyToken.width = baseSize;
  flyToken.height = baseSize;
  flyToken.position.set(startPt.x, startPt.y);
  fxLayer.addChild(flyToken);

  const driver = { t: 0 };
  addLudoTween({
    target: driver,
    from: { t: 0 },
    to: { t: 1 },
    duration: 340,
    ease: t => 1 - Math.pow(1 - t, 2),
    onUpdate: (raw) => {
      const arc = Math.sin(raw * Math.PI);
      const gx = startPt.x + (endPt.x - startPt.x) * raw;
      const gy = startPt.y + (endPt.y - startPt.y) * raw - arc * cs * 1.6;
      flyToken.position.set(gx, gy);
      flyToken.rotation = raw * Math.PI * 4;
    },
    onComplete: () => {
      flyToken.destroy();
      if (onDone) onDone();
    }
  });
}

function spawnGoldBurst(x, y) {
  if (!ludoPixiApp || !fxLayer) return;
  for (let i = 0; i < 18; i++) {
    const p = new PIXI.Graphics();
    p.beginFill(i % 2 === 0 ? 0xfacc15 : 0xffffff, 1);
    p.drawCircle(0, 0, 3.5);
    p.endFill();
    p.position.set(x, y);
    fxLayer.addChild(p);

    const ang = (Math.PI * 2 * i) / 18 + Math.random() * 0.25;
    const dist = 24 + Math.random() * 38;
    addLudoTween({
      target: p,
      from: { x: x, y: y, alpha: 1 },
      to: { x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist, alpha: 0 },
      duration: 420,
      onComplete: () => p.destroy()
    });
  }
}

// ============================================================================
// ٥. یاساکانی Yalla Ludo، کاتژمێری ١٥ چرکەیی، و ژیریی دەستکرد (Bot AI)
// ============================================================================
function startLudoTurnTimer() {
  clearInterval(ludoTurnInterval);
  ludoState.turnTimerSec = 15;
  updateTimerPills();

  ludoTurnInterval = setInterval(() => {
    if (ludoState.winner) {
      clearInterval(ludoTurnInterval);
      return;
    }
    if (ludoState.isAnimating) return;

    ludoState.turnTimerSec = Math.max(0, ludoState.turnTimerSec - 1);
    updateTimerPills();

    // ئەگەر کاتی نۆرەی خۆت تەواو بوو، خۆکارانە زار هەڵبدە یان یەکەم داش بجووڵێنە
    if (ludoState.turnTimerSec === 0 && ludoState.turn === ludoState.myColor) {
      if (!ludoState.diceRolled) {
        rollLudoDice();
      } else {
        const valid = getValidLudoTokenIndices(ludoState.myColor, ludoState.diceValue);
        if (valid.length > 0) executeLudoTokenMove(ludoState.myColor, valid[0]);
      }
    }
  }, 1000);
}

function updateTimerPills() {
  const myT = document.getElementById('ludoMyTimer');
  const oppT = document.getElementById('ludoOppTimer');
  const isMyTurn = (ludoState.turn === ludoState.myColor);
  if (myT) {
    myT.textContent = isMyTurn ? `${ludoState.turnTimerSec}s` : '--';
    myT.style.opacity = isMyTurn ? '1' : '0.4';
  }
  if (oppT) {
    oppT.textContent = !isMyTurn ? `${ludoState.turnTimerSec}s` : '--';
    oppT.style.opacity = !isMyTurn ? '1' : '0.4';
  }
}

function getValidLudoTokenIndices(color, diceVal) {
  if (!diceVal) return [];
  const valid = [];
  ludoState.tokens[color].forEach((step, idx) => {
    if (step === -1) {
      if (diceVal === 6) valid.push(idx);
    } else if (step + diceVal <= 56) {
      valid.push(idx);
    }
  });
  return valid;
}

function rollLudoDice() {
  if (ludoState.isAnimating || ludoState.diceRolled || ludoState.winner) return;
  if (ludoState.turn !== ludoState.myColor) return;

  performDiceRollAnimation(ludoState.myColor);
}

function performDiceRollAnimation(color, forcedRemoteVal = null) {
  ludoState.isAnimating = true;
  playLudoSfx('dice');

  const isMyColor = (color === ludoState.myColor);
  const diceBox = document.getElementById(isMyColor ? 'ludoDiceBox' : 'ludoOppDiceBox');
  if (diceBox) {
    diceBox.classList.add('dice-rolling');
    setTimeout(() => diceBox.classList.remove('dice-rolling'), 350);
  }

  setTimeout(() => {
    let val = forcedRemoteVal;
    if (!val) {
      const allInBase = ludoState.tokens[color].every(s => s === -1);
      val = Math.floor(Math.random() * 6) + 1;
      if (allInBase && val !== 6 && Math.random() < 0.28) val = 6;
    }

    if (val === 6) playLudoSfx('six');

    ludoState.diceValue = val;
    ludoState.diceRolled = true;
    ludoState.isAnimating = false;

    // ناردنی ئەنجامی زارەکە بۆ بەرامبەر لە یاری ئۆنڵایندا
    if (isLudoOnline && color === ludoState.myColor && !forcedRemoteVal && ludoRoomRef) {
      ludoServerSeq++;
      ludoLastSeq = ludoServerSeq;
      ludoRoomRef.update({
        turn: ludoState.turn,
        diceValue: val,
        diceRolled: true,
        seq: ludoServerSeq,
        lastAction: { type: 'roll', by: ludoMySeat, val: val }
      });
    }

    if (val === 6) {
      ludoState.consecutiveSixes++;
      if (ludoState.consecutiveSixes >= 3) {
        updateLudoHUD('٣ شەشی لەسەریەک! نۆرە دەگۆڕێت ⚠️');
        setTimeout(passLudoTurn, 850);
        return;
      }
    } else {
      ludoState.consecutiveSixes = 0;
    }

    const validMoves = getValidLudoTokenIndices(color, val);
    updateLudoHUD(
      validMoves.length > 0
        ? (color === ludoState.myColor ? `ژمارە ${val} هات — داشێک بجووڵێنە` : `بەرامبەر ژمارە ${val}ی هێنا`)
        : `ژمارە ${val} هات (جووڵە نییە)`
    );

    renderLudoTokens();

    if (validMoves.length === 0) {
      if (!isLudoOnline || color === ludoState.myColor) {
        setTimeout(passLudoTurn, 850);
      }
      return;
    }

    // ئەگەر هەموو داشە شیاوەکان لە یەک شوێندا بن (وەک کاتێک تەنها ١ داش دەجووڵێت یان هەمووی لە قەڵادایە)، خۆکارانە بیجووڵێنە!
    if (color === ludoState.myColor) {
      const uniqueSteps = new Set(validMoves.map(i => ludoState.tokens[color][i]));
      if (validMoves.length === 1 || uniqueSteps.size === 1) {
        setTimeout(() => executeLudoTokenMove(color, validMoves[0]), 260);
      }
    } else if (ludoState.mode === 'bot') {
      setTimeout(() => chooseAndMoveBotLudoToken(color, validMoves), 550);
    }
  }, 350);
}

function chooseAndMoveBotLudoToken(color, validMoves) {
  const diceVal = ludoState.diceValue;
  const oppColor = color === 'yellow' ? 'red' : 'yellow';
  let bestIdx = validMoves[0];
  let bestScore = -9999;

  validMoves.forEach(idx => {
    const curStep = ludoState.tokens[color][idx];
    const nextStep = curStep === -1 ? 0 : curStep + diceVal;
    let score = nextStep * 1.2;

    if (nextStep === 56) score += 160;
    if (curStep === -1 && diceVal === 6) score += 95;

    if (nextStep <= 50) {
      const myGlobal = (nextStep + (color === 'yellow' ? 0 : 26)) % 52;
      if (LUDO_SAFE_INDICES.includes(myGlobal)) {
        score += 45;
      } else {
        const oppOffset = oppColor === 'yellow' ? 0 : 26;
        const oppAtTarget = ludoState.tokens[oppColor].filter(os => os >= 0 && os <= 50 && ((os + oppOffset) % 52) === myGlobal);
        if (oppAtTarget.length === 1) score += 200; // خواردنی داشی بەرامبەر!
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });

  executeLudoTokenMove(color, bestIdx);
}

function executeLudoTokenMove(color, tokenIdx) {
  if (ludoState.isAnimating || !ludoState.diceRolled || ludoState.winner) return;
  const diceVal = ludoState.diceValue;
  const validMoves = getValidLudoTokenIndices(color, diceVal);
  if (!validMoves.includes(tokenIdx)) return;

  ludoState.isAnimating = true;
  const fromStep = ludoState.tokens[color][tokenIdx];
  const toStep = fromStep === -1 ? 0 : fromStep + diceVal;

  animateTokenHopPath(color, tokenIdx, fromStep, toStep, () => {
    ludoState.tokens[color][tokenIdx] = toStep;
    let earnedBonusTurn = (diceVal === 6);
    let capturedInfo = null;

    // ١. گەیشتن بە تاجی خۆری ناوەڕاست (Home = 56)
    if (toStep === 56) {
      playLudoSfx('home');
      earnedBonusTurn = true;
      const pt = getStepPixelCoord(color, 56, tokenIdx);
      spawnGoldBurst(pt.x, pt.y);
    }

    // ٢. پشکنینی خواردنی داشی بەرامبەر (Capture)
    if (toStep >= 0 && toStep <= 50) {
      const myOffset = color === 'yellow' ? 0 : 26;
      const myGlobal = (toStep + myOffset) % 52;

      if (!LUDO_SAFE_INDICES.includes(myGlobal)) {
        const oppColor = color === 'yellow' ? 'red' : 'yellow';
        const oppOffset = oppColor === 'yellow' ? 0 : 26;
        const oppIndicesHere = [];

        ludoState.tokens[oppColor].forEach((os, oIdx) => {
          if (os >= 0 && os <= 50 && ((os + oppOffset) % 52) === myGlobal) {
            oppIndicesHere.push({ idx: oIdx, step: os });
          }
        });

        // لە Yalla Ludo ئەگەر ١ داشی بەرامبەر لە خانەیەکی نائارام بێت، دەخورێت!
        if (oppIndicesHere.length === 1) {
          const victim = oppIndicesHere[0];
          ludoState.tokens[oppColor][victim.idx] = -1;
          earnedBonusTurn = true;
          capturedInfo = { oppColor, idx: victim.idx, fromStep: victim.step };
          playLudoSfx('capture');
          const pt = getStepPixelCoord(color, toStep, tokenIdx);
          spawnGoldBurst(pt.x, pt.y);
        }
      }
    }

    const finalizeAfterCapture = () => {
      ludoState.isAnimating = false;
      renderLudoTokens();

      // پشکنینی بردنەوەی یاری (٤ تاج)
      const homeCount = ludoState.tokens[color].filter(s => s === 56).length;
      if (homeCount === 4) {
        ludoState.winner = color;
        clearInterval(ludoTurnInterval);
        const iWon = (color === ludoState.myColor);
        updateLudoHUD(iWon ? '🏆 پیرۆزە! یارییەکەت بردەوە!' : 'بەرامبەر یارییەکەی بردەوە!');

        if (isLudoOnline && color === ludoState.myColor) {
          pushOnlineLudoMoveState(color, tokenIdx, fromStep, toStep, capturedInfo);
        }
        showLudoWinModal(iWon);
        return;
      }

      if (earnedBonusTurn) {
        ludoState.diceRolled = false;
        ludoState.diceValue = null;
        startLudoTurnTimer();
        updateLudoHUD(color === ludoState.myColor ? '🎁 نۆرەی زیادە! دووبارە زار هەڵبدە 🎲' : 'بەرامبەر نۆرەی زیادەی وەرگرت...');
        renderLudoTokens();

        if (isLudoOnline && color === ludoState.myColor) {
          pushOnlineLudoMoveState(color, tokenIdx, fromStep, toStep, capturedInfo);
        }

        if (color !== ludoState.myColor && ludoState.mode === 'bot') {
          setTimeout(() => performDiceRollAnimation(color), 750);
        }
      } else {
        if (isLudoOnline && color === ludoState.myColor) {
          ludoState.turn = ludoState.turn === 'yellow' ? 'red' : 'yellow';
          ludoState.diceValue = null;
          ludoState.diceRolled = false;
          ludoState.consecutiveSixes = 0;
          startLudoTurnTimer();
          updateLudoHUD(`نۆرەی ${ludoOppDisplayName}ـە...`);
          renderLudoTokens();
          pushOnlineLudoMoveState(color, tokenIdx, fromStep, toStep, capturedInfo);
        } else {
          passLudoTurn();
        }
      }
    };

    if (capturedInfo) {
      animateCapturedTokenFlight(capturedInfo.oppColor, capturedInfo.idx, capturedInfo.fromStep, finalizeAfterCapture);
    } else {
      finalizeAfterCapture();
    }
  });
}

function passLudoTurn() {
  ludoState.turn = ludoState.turn === 'yellow' ? 'red' : 'yellow';
  ludoState.diceValue = null;
  ludoState.diceRolled = false;
  ludoState.consecutiveSixes = 0;
  startLudoTurnTimer();

  updateLudoHUD(
    ludoState.turn === ludoState.myColor
      ? 'نۆرەی تۆیە — کلیک لە زارەکە بکە 🎲'
      : (isLudoOnline ? `نۆرەی ${ludoOppDisplayName}ـە...` : 'نۆرەی بۆتە...')
  );
  renderLudoTokens();

  if (isLudoOnline && ludoRoomRef) {
    ludoServerSeq++;
    ludoLastSeq = ludoServerSeq;
    ludoRoomRef.set({
      turn: ludoState.turn,
      diceValue: null,
      diceRolled: false,
      tokens: ludoState.tokens,
      winner: ludoState.winner || null,
      seq: ludoServerSeq,
      lastAction: { type: 'pass', by: ludoMySeat }
    });
  }

  if (ludoState.mode === 'bot' && ludoState.turn !== ludoState.myColor && !ludoState.winner) {
    setTimeout(() => performDiceRollAnimation(ludoState.turn), 700);
  }
}

// ============================================================================
// ٦. ڕووکاری زاری ٣ ڕەهەندی، پانێڵی یاریزانەکان، و مۆداڵی سەرکەوتن
// ============================================================================
function get3DDicePipHTML(val, isTurnArrow = false) {
  const pipPositions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };
  const active = pipPositions[val] || [];
  let gridHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);width:36px;height:36px;padding:3px;gap:2px;">';
  for (let i = 0; i < 9; i++) {
    if (active.includes(i)) {
      const col = (val === 1 || val === 6) ? '#dc2626' : '#0f172a';
      const sz = val === 1 ? '10px' : '7.5px';
      gridHTML += `<span style="width:${sz};height:${sz};border-radius:999px;background:${col};margin:auto;box-shadow:inset 0 1px 1px rgba(255,255,255,0.4);"></span>`;
    } else {
      gridHTML += '<span></span>';
    }
  }
  gridHTML += '</div>';

  const arrowHTML = isTurnArrow
    ? `<span style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:18px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));" class="animate-bounce">⬇️</span>`
    : '';

  return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${arrowHTML}${gridHTML}</div>`;
}

function updateLudoHUD(statusMsg) {
  const isMyTurn = (ludoState.turn === ludoState.myColor);
  const myCol = ludoState.myColor;
  const oppCol = myCol === 'yellow' ? 'red' : 'yellow';

  const turnBadge = document.getElementById('ludoTurnBadge');
  if (turnBadge) {
    const colLabel = ludoState.turn === 'yellow' ? 'زەردی خۆری' : 'سووری ئاڵا';
    turnBadge.textContent = isMyTurn
      ? `نۆرەی تۆیە (${colLabel})`
      : `نۆرەی ${isLudoOnline ? ludoOppDisplayName : 'بۆت'} (${colLabel})`;
  }

  const stText = document.getElementById('ludoStatusText');
  if (stText && statusMsg) stText.textContent = statusMsg;

  const myHome = ludoState.tokens[myCol].filter(s => s === 56).length;
  const oppHome = ludoState.tokens[oppCol].filter(s => s === 56).length;
  const myCrownsEl = document.getElementById('ludoMyCrowns');
  const oppCrownsEl = document.getElementById('ludoOppCrowns');
  if (myCrownsEl) myCrownsEl.textContent = `تاج: ${myHome}/4 👑`;
  if (oppCrownsEl) oppCrownsEl.textContent = `تاج: ${oppHome}/4 👑`;

  const panelMe = document.getElementById('ludoPanelMe');
  const panelOpp = document.getElementById('ludoPanelOpp');
  if (panelMe) panelMe.classList.toggle('panel-active-turn', isMyTurn);
  if (panelOpp) panelOpp.classList.toggle('panel-active-turn', !isMyTurn);

  const myDiceBox = document.getElementById('ludoDiceBox');
  const oppDiceBox = document.getElementById('ludoOppDiceBox');

  if (myDiceBox) {
    if (isMyTurn && ludoState.diceValue) {
      myDiceBox.innerHTML = get3DDicePipHTML(ludoState.diceValue, false);
    } else {
      myDiceBox.innerHTML = get3DDicePipHTML(6, isMyTurn && !ludoState.diceRolled);
    }
    myDiceBox.style.opacity = isMyTurn ? '1' : '0.5';
    myDiceBox.classList.toggle('dice-ready-glow', isMyTurn && !ludoState.diceRolled);
  }

  if (oppDiceBox) {
    if (!isMyTurn && ludoState.diceValue) {
      oppDiceBox.innerHTML = get3DDicePipHTML(ludoState.diceValue, false);
    } else {
      oppDiceBox.innerHTML = '🎲';
    }
    oppDiceBox.style.opacity = !isMyTurn ? '1' : '0.55';
  }
}

function showSpeechBubble(targetId, text) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function sendLudoQuickReaction(txt) {
  showSpeechBubble('ludoMyBubble', txt);
  playLudoSfx('hop');
  if (isLudoOnline && ludoRoomRef) {
    ludoServerSeq++;
    ludoLastSeq = ludoServerSeq;
    ludoRoomRef.update({
      seq: ludoServerSeq,
      lastAction: { type: 'reaction', by: ludoMySeat, text: txt }
    });
  }
}

function showLudoWinModal(iWon) {
  const modal = document.getElementById('ludoWinModal');
  const icon = document.getElementById('ludoWinIcon');
  const title = document.getElementById('ludoWinTitle');
  const desc = document.getElementById('ludoWinDesc');
  if (!modal) return;

  playLudoSfx('home');
  icon.textContent = iWon ? '🏆' : '⚔️';
  title.textContent = iWon ? 'پیرۆزە پاڵەوان!' : 'کۆتایی یاری';
  desc.textContent = iWon
    ? 'هەر ٤ داشەکەت گەیاندە تاجی خۆری کوردستان و یارییەکەت بردەوە!'
    : `${isLudoOnline ? ludoOppDisplayName : 'بۆت'} هەر ٤ داشەکەی گەیاندە تاجی ناوەڕاست و بردیەوە.`;
  modal.classList.remove('hidden');
}

function closeLudoWinModal() {
  document.getElementById('ludoWinModal')?.classList.add('hidden');
  initLudoGame();
}

function initLudoGame() {
  if (isLudoOnline) {
    if (ludoIsHost && ludoRoomRef) {
      ludoServerSeq++;
      ludoLastSeq = ludoServerSeq;
      ludoState.turn = 'yellow';
      ludoState.diceValue = null;
      ludoState.diceRolled = false;
      ludoState.isAnimating = false;
      ludoState.consecutiveSixes = 0;
      ludoState.tokens = { yellow: [-1, -1, -1, -1], red: [-1, -1, -1, -1] };
      ludoState.winner = null;

      ludoRoomRef.set({
        turn: 'yellow',
        diceValue: null,
        diceRolled: false,
        tokens: ludoState.tokens,
        winner: null,
        seq: ludoServerSeq,
        lastAction: { type: 'start', by: ludoMySeat }
      });
      startLudoTurnTimer();
      updateLudoHUD(ludoState.myColor === 'yellow' ? 'نۆرەی تۆیە — کلیک لە زارەکە بکە 🎲' : `نۆرەی ${ludoOppDisplayName}ـە...`);
      renderLudoTokens();
    } else {
      updateLudoHUD('تەنها دروستکەری ژوور دەتوانێت یارییەکە نوێ بکاتەوە');
    }
    return;
  }

  ludoState.mode = 'bot';
  ludoState.myColor = 'yellow';
  ludoState.turn = 'yellow';
  ludoState.diceValue = null;
  ludoState.diceRolled = false;
  ludoState.isAnimating = false;
  ludoState.consecutiveSixes = 0;
  ludoState.tokens = {
    yellow: [-1, -1, -1, -1],
    red:    [-1, -1, -1, -1]
  };
  ludoState.winner = null;

  const me = window.YariOnline ? YariOnline.getPlayer() : { name: 'تۆ', avatar: '' };
  const myNameEl = document.getElementById('ludoMyName');
  const oppNameEl = document.getElementById('ludoOppName');
  const myAvEl = document.getElementById('ludoMyAvatar');
  const oppAvEl = document.getElementById('ludoOppAvatar');

  if (myNameEl) myNameEl.textContent = `${me.name} (زەردی خۆری)`;
  if (oppNameEl) oppNameEl.textContent = 'بۆتی YariKurdi (سوور)';
  if (myAvEl) {
    myAvEl.className = 'avatar-box avatar-yellow';
    myAvEl.innerHTML = me.avatar ? `<img src="${me.avatar}" alt="">` : '☀️';
  }
  if (oppAvEl) {
    oppAvEl.className = 'avatar-box avatar-red';
    oppAvEl.innerHTML = '🤖';
  }

  startLudoTurnTimer();
  updateLudoHUD('کلیک لە زارەکە بکە 🎲');
  setTimeout(initLudoPixi, 30);
}

// ============================================================================
// ٧. سیستمی یاری ئۆنڵاین (بەستراو بە online-engine.js + سووڕانەوەی ١٨٠ پلە)
// ============================================================================
function openLudoOnlineLobby() {
  if (!window.YariOnline) {
    alert('فایلی online-engine.js نەدۆزرایەوە!');
    return;
  }
  YariOnline.openLobby({
    gameType: 'ludo',
    gameTitle: 'لودۆی شاهانە',
    maxPlayers: 2,
    initialState: { started: false },
    onGameStart: ({ roomCode, isHost, mySeat, players }) => {
      startLudoOnlineSession(roomCode, isHost, mySeat, players);
    }
  });
}

function startLudoOnlineSession(roomCode, isHost, mySeat, players) {
  isLudoOnline = true;
  ludoIsHost = isHost;
  ludoMySeat = mySeat;
  ludoLastSeq = -1;
  ludoServerSeq = 0;

  const myCol = mySeat === 0 ? 'yellow' : 'red';
  const me = YariOnline.getPlayer();
  const opp = players.find(p => p.seat !== mySeat) || { name: 'هاوڕێ', avatar: '' };
  ludoOppDisplayName = opp.name || 'هاوڕێ';

  ludoState.mode = 'online';
  ludoState.myColor = myCol;
  ludoState.turn = 'yellow';
  ludoState.diceValue = null;
  ludoState.diceRolled = false;
  ludoState.isAnimating = false;
  ludoState.consecutiveSixes = 0;
  ludoState.tokens = { yellow: [-1, -1, -1, -1], red: [-1, -1, -1, -1] };
  ludoState.winner = null;

  const myNameEl = document.getElementById('ludoMyName');
  const oppNameEl = document.getElementById('ludoOppName');
  const myAvEl = document.getElementById('ludoMyAvatar');
  const oppAvEl = document.getElementById('ludoOppAvatar');

  if (myNameEl) myNameEl.textContent = `${me.name} (${myCol === 'yellow' ? 'زەرد' : 'سوور'})`;
  if (oppNameEl) oppNameEl.textContent = `${ludoOppDisplayName} (${myCol === 'yellow' ? 'سوور' : 'زەرد'})`;

  if (myAvEl && oppAvEl) {
    myAvEl.className = `avatar-box ${myCol === 'yellow' ? 'avatar-yellow' : 'avatar-red'}`;
    myAvEl.innerHTML = me.avatar ? `<img src="${me.avatar}" alt="">` : (myCol === 'yellow' ? '☀️' : '🔴');

    oppAvEl.className = `avatar-box ${myCol === 'yellow' ? 'avatar-red' : 'avatar-yellow'}`;
    oppAvEl.innerHTML = opp.avatar ? `<img src="${opp.avatar}" alt="">` : (myCol === 'yellow' ? '🔴' : '☀️');
  }

  initLudoPixi();
  refreshBoardBackground();
  renderLudoTokens();
  startLudoTurnTimer();
  updateLudoHUD(myCol === 'yellow' ? 'نۆرەی تۆیە — کلیک لە زارەکە بکە 🎲' : `نۆرەی ${ludoOppDisplayName}ـە...`);

  if (ludoRoomRef && ludoRoomListener) {
    ludoRoomRef.off('value', ludoRoomListener);
  }
  ludoRoomRef = ykDB.ref(`rooms/ludo/${roomCode}/state`);

  if (isHost) {
    ludoRoomRef.set({
      turn: 'yellow',
      diceValue: null,
      diceRolled: false,
      tokens: { yellow: [-1, -1, -1, -1], red: [-1, -1, -1, -1] },
      winner: null,
      seq: 1,
      lastAction: { type: 'start', by: -1 }
    });
  }

  ludoRoomListener = ludoRoomRef.on('value', snap => {
    const st = snap.val();
    if (!st || !st.tokens) return;
    applyOnlineLudoSnapshot(st);
  });
}

function pushOnlineLudoMoveState(color, tokenIdx, fromStep, toStep, capturedInfo) {
  if (!isLudoOnline || !ludoRoomRef) return;
  ludoServerSeq++;
  ludoLastSeq = ludoServerSeq;
  ludoRoomRef.set({
    turn: ludoState.turn,
    diceValue: ludoState.diceValue,
    diceRolled: ludoState.diceRolled,
    tokens: ludoState.tokens,
    winner: ludoState.winner || null,
    seq: ludoServerSeq,
    lastAction: {
      type: 'move',
      by: ludoMySeat,
      color,
      tokenIdx,
      fromStep,
      toStep,
      captured: capturedInfo || null
    }
  });
}

function applyOnlineLudoSnapshot(st) {
  if (st.seq === ludoLastSeq) return;
  ludoLastSeq = st.seq;
  ludoServerSeq = st.seq || 0;

  const act = st.lastAction || {};
  const fromOpp = (act.by !== undefined && act.by !== -1 && act.by !== ludoMySeat);

  if (fromOpp && act.type === 'reaction') {
    showSpeechBubble('ludoOppBubble', act.text);
    playLudoSfx('hop');
    return;
  }

  if (fromOpp && act.type === 'roll') {
    const oppColor = ludoState.myColor === 'yellow' ? 'red' : 'yellow';
    performDiceRollAnimation(oppColor, act.val);
    return;
  }

  const syncBoardState = () => {
    ludoState.turn = st.turn || 'yellow';
    ludoState.diceValue = st.diceValue || null;
    ludoState.diceRolled = !!st.diceRolled;
    ludoState.tokens = {
      yellow: Array.isArray(st.tokens.yellow) ? st.tokens.yellow : [-1, -1, -1, -1],
      red: Array.isArray(st.tokens.red) ? st.tokens.red : [-1, -1, -1, -1]
    };
    ludoState.winner = st.winner || null;

    startLudoTurnTimer();
    updateLudoHUD(
      ludoState.winner
        ? (ludoState.winner === ludoState.myColor ? '🏆 پیرۆزە! یارییەکەت بردەوە!' : `${ludoOppDisplayName} یارییەکەی بردەوە!`)
        : (ludoState.turn === ludoState.myColor ? 'نۆرەی تۆیە — کلیک لە زارەکە بکە 🎲' : `نۆرەی ${ludoOppDisplayName}ـە...`)
    );
    renderLudoTokens();

    if (ludoState.winner) {
      clearInterval(ludoTurnInterval);
      showLudoWinModal(ludoState.winner === ludoState.myColor);
    }
  };

  if (fromOpp && act.type === 'move') {
    ludoState.isAnimating = true;
    animateTokenHopPath(act.color, act.tokenIdx, act.fromStep, act.toStep, () => {
      if (act.toStep === 56) {
        playLudoSfx('home');
        const pt = getStepPixelCoord(act.color, 56, act.tokenIdx);
        spawnGoldBurst(pt.x, pt.y);
      }
      if (act.captured) {
        playLudoSfx('capture');
        const pt = getStepPixelCoord(act.color, act.toStep, act.tokenIdx);
        spawnGoldBurst(pt.x, pt.y);
        animateCapturedTokenFlight(act.captured.oppColor, act.captured.idx, act.captured.fromStep, () => {
          ludoState.isAnimating = false;
          syncBoardState();
        });
      } else {
        ludoState.isAnimating = false;
        syncBoardState();
      }
    });
  } else {
    syncBoardState();
  }
}

window.addEventListener('beforeunload', () => {
  if (isLudoOnline && window.YariOnline) YariOnline.leaveRoom();
});