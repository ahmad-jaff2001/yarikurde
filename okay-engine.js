// ============================================================================
// YARI KURDI - ULTRA CLOSE-UP 120FPS OKEY ENGINE WITH FIDGET PHYSICS
// ============================================================================

const OKEY_COLORS = ['red', 'black', 'blue', 'yellow'];
const OKEY_COLOR_HEX = {
  red: '#dc2626',
  black: '#1e293b',
  blue: '#0284c7',
  yellow: '#d97706'
};

const RACK_COLS = 14;
const RACK_ROWS = 2;
const RACK_TOTAL_SLOTS = RACK_COLS * RACK_ROWS;

let pixiApp = null;
let okeySoundCtx = null;
let turnTimerInterval = null;

// چینەکانی گرافیکی PixiJS
let bgLayer = null;
let tableLayer = null;
let rackBgLayer = null;
let bracketsLayer = null;
let tilesLayer = null;
let fxLayer = null;

const tileTextureCache = new Map();
const activeTweens = [];
const rackSpritesMap = new Map();

// بارودۆخی فیزیایی ڕاکێشان و یاریپێکردن بە پوول (Fidget Physics & Magnetic Shift)
let dragContext = {
  active: false,
  sprite: null,
  shadow: null,
  tile: null,
  fromSlotIdx: -1,
  lastX: 0,
  lastY: 0,
  vx: 0,
  vy: 0,
  pointerStartX: 0,
  pointerStartY: 0,
  hasMoved: false,
  isTouch: false,
  hoverSlotIdx: -1,
  flipCooldown: 0,
  isFlipping3D: false,
  showingBack: false,
  lastSignX: 0,
  shakeReversals: 0
};

let selectedSlotIdx = -1;

// قەبارەی نزیک و گەورە (هاوشێوەی دیزاینی مۆبایلە مۆدێرنەکان)
let layout = {
  w: 1280,
  h: 640,
  tileW: 62,
  tileH: 90,
  slotW: 64,
  rackX: 170,
  rackY: 416,
  rackW: 924,
  rackH: 208,
  centerY: 222,
  trayX: 0,
  trayY: 0,
  trayW: 326,
  trayH: 138,
  finishPos: { x: 0, y: 0 },
  indicatorPos: { x: 0, y: 0 },
  deckPos: { x: 0, y: 0 },
  leftDiscardPos: { x: 0, y: 0 },
  rightDiscardPos: { x: 0, y: 0 },
  botPositions: [],
  botDiscardPositions: [],
  slotCoords: []
};

let okeyState = {
  round: 1,
  maxRounds: 5,
  timerSeconds: 28,
  deck: [],
  indicatorTile: null,
  jokerRule: null,
  rackSlots: new Array(RACK_TOTAL_SLOTS).fill(null),
  bots: [
    { id: 1, name: 'کۆمپیوتەر 3', rank: 'ئەڵماس', badgeCol: 0x3b82f6, score: 2900, tiles: [], discards: [] },
    { id: 2, name: 'کۆمپیوتەر 2', rank: 'زێڕ', badgeCol: 0xeab308, score: 1500, tiles: [], discards: [] },
    { id: 3, name: 'کۆمپیوتەر 1', rank: 'برۆنز', badgeCol: 0xd97706, score: 600, tiles: [], discards: [] }
  ],
  myDiscards: [],
  turn: 0,
  phase: 'play',
  winner: null,
  validTileIds: new Set(),
  validGroupsBounds: [],
  isAllValidToWin: false,
  isAnimating: false
};

// ============================================================================
// ١. دەنگی یاری (Zero-Latency Web Audio Synthesizer)
// ============================================================================
function playOkeyTileSound(type = 'clack') {
  try {
    if (!okeySoundCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      okeySoundCtx = new AudioContext();
    }
    if (okeySoundCtx.state === 'suspended') okeySoundCtx.resume();

    const now = okeySoundCtx.currentTime;
    const osc = okeySoundCtx.createOscillator();
    const gain = okeySoundCtx.createGain();
    osc.connect(gain);
    gain.connect(okeySoundCtx.destination);

    if (type === 'clack') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(145, now + 0.045);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.06);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === 'flip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = okeySoundCtx.createOscillator();
        const g = okeySoundCtx.createGain();
        o.connect(g);
        g.connect(okeySoundCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.07);
        g.gain.setValueAtTime(0.22, now + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);
        o.start(now + i * 0.07);
        o.stop(now + i * 0.07 + 0.32);
      });
    }
  } catch (e) {}
}

// ============================================================================
// ٢. سیستمی ئەنیمەیشن و فیزیای ١٢٠ فریم لە چرکەیەکدا
// ============================================================================
function addPixiTween(config) {
  activeTweens.push({
    target: config.target,
    from: { ...config.from },
    to: { ...config.to },
    duration: config.duration || 170,
    elapsed: 0,
    ease: config.ease || ((t) => 1 - Math.pow(1 - t, 3)),
    onUpdate: config.onUpdate || null,
    onComplete: config.onComplete || null
  });
}

function updateAllPixiTweensAndPhysics(deltaMS) {
  for (let i = activeTweens.length - 1; i >= 0; i--) {
    const tw = activeTweens[i];
    tw.elapsed += deltaMS;
    const rawProgress = Math.min(1, tw.elapsed / tw.duration);
    const p = tw.ease(rawProgress);

    if (tw.target && !tw.target.destroyed) {
      for (const key in tw.to) {
        tw.target[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * p;
      }
      if (tw.onUpdate) tw.onUpdate(p);
    }

    if (rawProgress >= 1) {
      activeTweens.splice(i, 1);
      if (tw.onComplete) tw.onComplete();
    }
  }

  // فیزیای زیندووی پوول لە کاتی ڕاکێشان و یاریپێکردن لەسەر مێزەکە
  if (dragContext.active && dragContext.sprite && !dragContext.sprite.destroyed) {
    const sp = dragContext.sprite;
    dragContext.vx *= 0.84;
    dragContext.vy *= 0.84;

    // لاربوونەوەی سروشتیی پوول بەپێی خێرایی پەنجەت
    const targetTilt = Math.max(-0.52, Math.min(0.52, dragContext.vx * 0.022));
    sp.rotation += (targetTilt - sp.rotation) * 0.32;

    if (dragContext.shadow && !dragContext.shadow.destroyed) {
      dragContext.shadow.position.set(sp.x + 10, sp.y + 16);
      dragContext.shadow.rotation = sp.rotation;
    }

    if (dragContext.flipCooldown > 0) {
      dragContext.flipCooldown = Math.max(0, dragContext.flipCooldown - deltaMS);
    }
  }
}

// تەقڵەلێدانی ٣ ڕەهەندیی پوول لە حەوادا کاتێک لەسەر مێزەکە ڕایدەوەشێنیت
function triggerMidAirFidgetFlip() {
  if (!dragContext.active || !dragContext.sprite || dragContext.isFlipping3D) return;
  dragContext.isFlipping3D = true;
  dragContext.flipCooldown = 360;
  const sp = dragContext.sprite;
  const baseW = layout.tileW * 1.14;

  playOkeyTileSound('flip');

  addPixiTween({
    target: sp,
    from: { width: baseW },
    to: { width: 4 },
    duration: 75,
    onComplete: () => {
      if (!sp || sp.destroyed) return;
      dragContext.showingBack = !dragContext.showingBack;
      sp.texture = dragContext.showingBack ? getTileTex(null) : getTileTex(dragContext.tile);
      addPixiTween({
        target: sp,
        from: { width: 4 },
        to: { width: baseW },
        duration: 85,
        onComplete: () => {
          dragContext.isFlipping3D = false;
        }
      });
    }
  });
}

// ============================================================================
// ٣. دروستکردنی تێکسچەری گەورە و کریستاڵیی پوولەکان لەسەر GPU
// ============================================================================
function drawRoundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStarburstEmboss(ctx, cx, cy, outerR) {
  ctx.save();
  ctx.strokeStyle = 'rgba(214, 203, 181, 0.55)';
  ctx.lineWidth = 1.6;
  const rays = 16;
  for (let i = 0; i < rays; i++) {
    const angle = (i * Math.PI * 2) / rays;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (outerR * 0.45), cy + Math.sin(angle) * (outerR * 0.45));
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }
  ctx.restore();
}

function bakeAllOkeyTextures() {
  const W = 164;
  const H = 238;
  const R = 24;

  const createTileCanvas = (borderCol = '#dfd5c0', borderW = 3, isJokerGlow = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // قووڵایی ٣ ڕەهەندیی خوارەوەی پوول
    drawRoundedRectPath(ctx, 3, 10, W - 6, H - 12, R);
    ctx.fillStyle = isJokerGlow ? '#d97706' : '#c4b59b';
    ctx.fill();

    // ڕووی عاجیی سەرەوەی پوول
    drawRoundedRectPath(ctx, 3, 3, W - 6, H - 15, R);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (isJokerGlow) {
      grad.addColorStop(0, '#fffbeb');
      grad.addColorStop(1, '#fef3c7');
    } else {
      grad.addColorStop(0, '#fffdf9');
      grad.addColorStop(1, '#f3ebd9');
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = borderW;
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    return { canvas, ctx };
  };

  for (const color of OKEY_COLORS) {
    const hex = OKEY_COLOR_HEX[color];
    for (let num = 1; num <= 13; num++) {
      // ١) پوولی ئاسایی
      const key = `tile_${color}_${num}`;
      const { canvas, ctx } = createTileCanvas();

      // نەخشی تیشکی خۆر لە پشتی خاڵەکە
      drawStarburstEmboss(ctx, W / 2, H * 0.72, 34);

      // ژمارەی گەورە و ڕوون
      ctx.fillStyle = hex;
      ctx.font = '900 92px "Arial Black", Vazirmatn, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), W / 2, H * 0.34);

      // چاڵی ڕەنگدار لە خوارەوەی پوولەکە
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.72, 16, 0, Math.PI * 2);
      ctx.fillStyle = hex;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.stroke();

      tileTextureCache.set(key, PIXI.Texture.from(canvas));

      // ٢) پوولی ئۆکەی ڕاستەقینە
      const jokerKey = `tile_${color}_${num}_joker`;
      const jObj = createTileCanvas('#f59e0b', 5, true);
      const jCtx = jObj.ctx;

      drawStarburstEmboss(jCtx, W / 2, H * 0.72, 34);
      jCtx.fillStyle = hex;
      jCtx.font = '900 90px "Arial Black", Vazirmatn, sans-serif';
      jCtx.textAlign = 'center';
      jCtx.textBaseline = 'middle';
      jCtx.fillText(String(num), W / 2, H * 0.35);

      jCtx.beginPath();
      jCtx.arc(W / 2, H * 0.72, 16, 0, Math.PI * 2);
      jCtx.fillStyle = hex;
      jCtx.fill();

      jCtx.font = '28px sans-serif';
      jCtx.fillText('👑', W - 28, 28);

      tileTextureCache.set(jokerKey, PIXI.Texture.from(jObj.canvas));
    }
  }

  // پوولی جۆکەری ساختە (بە وێنەی شاخ و خۆری زێڕینی کوردستان وەک وێنەکە)
  {
    const { canvas, ctx } = createTileCanvas('#d4c5a9', 3.5);

    // خۆری زێڕین لە سەرەوە
    drawStarburstEmboss(ctx, W / 2, H * 0.27, 30);
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.27, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();

    // شاخی شین و سپی لە ناوەڕاست
    ctx.beginPath();
    ctx.moveTo(22, H * 0.62);
    ctx.lineTo(W * 0.42, H * 0.42);
    ctx.lineTo(W * 0.56, H * 0.52);
    ctx.lineTo(W * 0.72, H * 0.40);
    ctx.lineTo(W - 22, H * 0.62);
    ctx.closePath();
    ctx.fillStyle = '#1d4ed8';
    ctx.fill();

    // خاڵی خوارەوە
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.75, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1d4ed8';
    ctx.fill();

    tileTextureCache.set('tile_false_joker', PIXI.Texture.from(canvas));
  }

  // پشتی پوولی سووری شاهانە (OKAY)
  {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    drawRoundedRectPath(ctx, 3, 10, W - 6, H - 12, R);
    ctx.fillStyle = '#7f1d1d';
    ctx.fill();

    drawRoundedRectPath(ctx, 3, 3, W - 6, H - 14, R);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(1, '#dc2626');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#fca5a5';
    ctx.stroke();

    ctx.save();
    ctx.translate(W / 2, H * 0.52);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OKAY', 0, 0);
    ctx.restore();

    tileTextureCache.set('tile_back_red', PIXI.Texture.from(canvas));
  }
}

function getTileTex(tile) {
  if (!tile) return tileTextureCache.get('tile_back_red');
  if (tile.isFalseJoker) return tileTextureCache.get('tile_false_joker');
  if (isRealOkeyJoker(tile)) {
    return tileTextureCache.get(`tile_${tile.color}_${tile.number}_joker`) || tileTextureCache.get(`tile_${tile.color}_${tile.number}`);
  }
  return tileTextureCache.get(`tile_${tile.color}_${tile.number}`);
}

// ============================================================================
// ٤. یاساکانی ١٠٦ پوول و ناسینەوەی سێت و زنجیرەکان
// ============================================================================
function buildOkey106Deck() {
  const deck = [];
  let uid = 1;
  for (let copy = 0; copy < 2; copy++) {
    for (const color of OKEY_COLORS) {
      for (let num = 1; num <= 13; num++) {
        deck.push({ uid: `t_${uid++}`, color, number: num, isFalseJoker: false });
      }
    }
  }
  deck.push({ uid: `t_${uid++}`, color: 'false_joker', number: 0, isFalseJoker: true });
  deck.push({ uid: `t_${uid++}`, color: 'false_joker', number: 0, isFalseJoker: true });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function isRealOkeyJoker(tile) {
  if (!tile || tile.isFalseJoker || !okeyState.jokerRule) return false;
  return tile.color === okeyState.jokerRule.color && tile.number === okeyState.jokerRule.number;
}

function getEffectiveTileValue(tile) {
  if (!tile) return null;
  if (tile.isFalseJoker) {
    return { color: okeyState.jokerRule.color, number: okeyState.jokerRule.number, isWild: false };
  }
  if (isRealOkeyJoker(tile)) {
    return { color: tile.color, number: tile.number, isWild: true };
  }
  return { color: tile.color, number: tile.number, isWild: false };
}

function isValidOkeyGroup(group) {
  if (!group || group.length < 3) return false;
  const eff = group.map(getEffectiveTileValue);
  const normals = eff.filter(t => !t.isWild);
  if (normals.length === 0) return true;

  if (group.length <= 4) {
    const targetNum = normals[0].number;
    const allSameNum = normals.every(t => t.number === targetNum);
    const uniqueColors = new Set(normals.map(t => t.color)).size === normals.length;
    if (allSameNum && uniqueColors) return true;
  }

  const targetColor = normals[0].color;
  if (!normals.every(t => t.color === targetColor)) return false;

  for (let startNum = 1; startNum <= 13; startNum++) {
    if (startNum + group.length - 1 > 14) continue;
    let matches = true;
    for (let i = 0; i < group.length; i++) {
      const item = eff[i];
      if (item.isWild) continue;
      let expected = startNum + i;
      if (expected === 14) expected = 1;
      if (item.number !== expected) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

function evaluatePlayerRack(ignoreUid = null) {
  const validIds = new Set();
  const validGroupsBounds = [];
  const groups = [];

  for (let r = 0; r < RACK_ROWS; r++) {
    let currentGroup = [];
    for (let c = 0; c < RACK_COLS; c++) {
      const idx = r * RACK_COLS + c;
      const tile = okeyState.rackSlots[idx];
      if (tile && tile.uid !== ignoreUid) {
        currentGroup.push({ tile, idx, r, c });
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup);
  }

  let validCount = 0;
  let allGroupsValid = true;
  let totalTilesCount = 0;

  for (const grp of groups) {
    totalTilesCount += grp.length;
    const tilesOnly = grp.map(g => g.tile);
    if (isValidOkeyGroup(tilesOnly)) {
      grp.forEach(g => validIds.add(g.tile.uid));
      validCount += grp.length;
      validGroupsBounds.push({
        row: grp[0].r,
        startCol: grp[0].c,
        endCol: grp[grp.length - 1].c
      });
    } else {
      allGroupsValid = false;
    }
  }

  if (!allGroupsValid && groups.length === 7 && groups.every(g => g.length === 2)) {
    let allPairsOk = true;
    for (const grp of groups) {
      const t1 = getEffectiveTileValue(grp[0].tile);
      const t2 = getEffectiveTileValue(grp[1].tile);
      if (!(t1.isWild || t2.isWild || (t1.number === t2.number && t1.color === t2.color))) {
        allPairsOk = false;
        break;
      }
    }
    if (allPairsOk) {
      validGroupsBounds.length = 0;
      groups.forEach(grp => {
        grp.forEach(g => validIds.add(g.tile.uid));
        validGroupsBounds.push({ row: grp[0].r, startCol: grp[0].c, endCol: grp[1].c });
      });
      validCount = 14;
      allGroupsValid = true;
    }
  }

  if (!ignoreUid) {
    okeyState.validTileIds = validIds;
    okeyState.validGroupsBounds = validGroupsBounds;
    okeyState.isAllValidToWin = (totalTilesCount === 14 && validCount === 14);
  }

  return {
    validCount,
    totalTilesCount,
    canWin14: totalTilesCount === 14 && validCount === 14
  };
}

// ============================================================================
// ٥. قەبارەی نزیک و گەورە بۆ پڕکردنەوەی تەواوی شاشەی مۆبایل و کۆمپیوتەر
// ============================================================================
function updateViewportAndLayout() {
  if (!pixiApp) return;
  const screenW = Math.max(320, window.innerWidth);
  const screenH = Math.max(240, window.innerHeight);
  pixiApp.renderer.resize(screenW, screenH);

  const aspect = screenW / screenH;
  const minW = 1260;
  const baseH = 630;

  if (aspect >= minW / baseH) {
    layout.h = baseH;
    layout.w = Math.min(1560, Math.round(baseH * aspect));
  } else {
    layout.w = minW;
    layout.h = Math.min(1300, Math.round(minW / Math.max(0.55, aspect)));
  }

  const scale = Math.min(screenW / layout.w, screenH / layout.h);
  pixiApp.stage.scale.set(scale);
  pixiApp.stage.x = Math.round((screenW - layout.w * scale) / 2);
  pixiApp.stage.y = Math.round((screenH - layout.h * scale) / 2);

  const w = layout.w;
  const h = layout.h;

  // پوولی یەکجار گەورە و ڕوون وەک وێنەکە
  layout.tileW = 62;
  layout.tileH = 90;
  layout.slotW = 64;

  layout.rackW = RACK_COLS * layout.slotW + 28;
  layout.rackH = layout.tileH * 2 + 26;
  layout.rackX = Math.round((w - layout.rackW) / 2);
  layout.rackY = h - layout.rackH - 8;

  // سینی ناوەڕاستی مێز
  layout.centerY = Math.round((layout.rackY + 64) * 0.49);
  layout.trayW = 326;
  layout.trayH = 142;
  layout.trayX = Math.round(w / 2 - layout.trayW / 2);
  layout.trayY = Math.round(layout.centerY - layout.trayH / 2);

  layout.finishPos = { x: Math.round(w / 2 - 96), y: layout.centerY + 6 };
  layout.indicatorPos = { x: Math.round(w / 2 + 4), y: layout.centerY + 8 };
  layout.deckPos = { x: Math.round(w / 2 + 98), y: layout.centerY + 4 };

  // شوێنی هەر ٣ بۆتەکان (چەپ، سەرەوە، ڕاست)
  const sideMargin = Math.max(96, Math.round(w * 0.08));
  layout.botPositions = [
    { x: sideMargin, y: layout.centerY + 10 },       // کۆمپیوتەر 3 (چەپ)
    { x: Math.round(w / 2), y: 52 },                 // کۆمپیوتەر 2 (سەرەوە)
    { x: w - sideMargin, y: layout.centerY + 10 }    // کۆمپیوتەر 1 (ڕاست)
  ];

  // خانەکانی فڕێدانی پوول
  const discardY = Math.round(layout.rackY - layout.tileH * 0.58);
  layout.leftDiscardPos = { x: layout.rackX + 58, y: discardY };
  layout.rightDiscardPos = { x: layout.rackX + layout.rackW - 58, y: discardY };

  layout.botDiscardPositions = [
    { x: sideMargin + 112, y: layout.centerY + 10 },
    { x: Math.round(w / 2 + 170), y: 74 },
    layout.rightDiscardPos
  ];

  // ٢٨ خانەکەی تەختە دوو-ڕیزییەکە
  layout.slotCoords = [];
  const startX = layout.rackX + 14 + layout.slotW / 2;
  const rowY0 = layout.rackY + 9 + layout.tileH / 2;
  const rowY1 = layout.rackY + 17 + layout.tileH * 1.5;

  for (let r = 0; r < RACK_ROWS; r++) {
    for (let c = 0; c < RACK_COLS; c++) {
      layout.slotCoords.push({
        idx: r * RACK_COLS + c,
        row: r,
        col: c,
        cx: Math.round(startX + c * layout.slotW),
        cy: Math.round(r === 0 ? rowY0 : rowY1)
      });
    }
  }
}

function getStagePointerPos(globalPos) {
  return pixiApp.stage.toLocal(globalPos);
}

// ============================================================================
// ٦. کێشانی مێزی مەخمەڵی (سوور و شین)، لێوارە دارینەکان، تەختە و دوگمەکان
// ============================================================================
function renderFullScene(animateDeal = false, animateSlide = false) {
  if (!pixiApp) return;
  updateViewportAndLayout();

  bgLayer.removeChildren();
  tableLayer.removeChildren();
  rackBgLayer.removeChildren();

  const { w, h, tileW, tileH } = layout;

  // ١. کێشانی لێوارە تەختە دارینەکانی چەپ و ڕاستی مێزەکە + چوارچێوەی مەخمەڵی
  const tableGfx = new PIXI.Graphics();

  // لێواری دارینی لای چەپ (بە گۆشەی ٣ ڕەهەندی وەک وێنەکە)
  tableGfx.beginFill(0x3d1e0c, 0.95);
  tableGfx.moveTo(0, 0);
  tableGfx.lineTo(54, 0);
  tableGfx.lineTo(14, h);
  tableGfx.lineTo(0, h);
  tableGfx.closePath();
  tableGfx.endFill();

  // هێڵی زێڕینی تەنیشت لێواری چەپ
  tableGfx.lineStyle(2, 0xf59e0b, 0.35);
  tableGfx.moveTo(54, 0);
  tableGfx.lineTo(14, h);

  // لێواری دارینی لای ڕاست
  tableGfx.lineStyle(0);
  tableGfx.beginFill(0x3d1e0c, 0.95);
  tableGfx.moveTo(w, 0);
  tableGfx.lineTo(w - 54, 0);
  tableGfx.lineTo(w - 14, h);
  tableGfx.lineTo(w, h);
  tableGfx.closePath();
  tableGfx.endFill();

  tableGfx.lineStyle(2, 0xf59e0b, 0.35);
  tableGfx.moveTo(w - 54, 0);
  tableGfx.lineTo(w - 14, h);

  bgLayer.addChild(tableGfx);

  // ٢. کێشانی ٣ بۆتەکە (ڕێک بە ستایلی وێنەکە: بازنەی سپی 'ک' + پلە + خاڵ)
  drawBotProfile(0, 'vertical');   // کۆمپیوتەر 3 (چەپ)
  drawBotProfile(1, 'horizontal'); // کۆمپیوتەر 2 (سەرەوە)
  drawBotProfile(2, 'vertical');   // کۆمپیوتەر 1 (ڕاست)

  // ٣. سینی تاریکی ناوەڕاستی مێز (فڕێدان/کۆنکان + پیشاندەر + دەستە پوولی سوور)
  const trayGfx = new PIXI.Graphics();
  trayGfx.beginFill(0x090612, 0.82);
  trayGfx.lineStyle(1.8, 0xffffff, 0.14);
  trayGfx.drawRoundedRect(layout.trayX, layout.trayY, layout.trayW, layout.trayH, 22);
  trayGfx.endFill();

  // چوارگۆشەی کۆنکان / فڕێدانی کۆتایی لە لای چەپی سینیەکە
  const fBoxW = tileW + 18;
  const fBoxH = tileH + 10;
  trayGfx.beginFill(0x280d22, 0.85);
  trayGfx.lineStyle(1.8, okeyState.isAllValidToWin ? 0x22c55e : 0x6b2146, 0.9);
  trayGfx.drawRoundedRect(layout.finishPos.x - fBoxW / 2, layout.finishPos.y - fBoxH / 2, fBoxW, fBoxH, 14);
  trayGfx.endFill();
  tableLayer.addChild(trayGfx);

  const finishTitle = new PIXI.Text('فڕێدان', {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 12,
    fontWeight: '800',
    fill: '#e2e8f0'
  });
  finishTitle.anchor.set(0.5);
  finishTitle.position.set(layout.finishPos.x, layout.finishPos.y - fBoxH / 2 - 11);

  const diamondIcon = new PIXI.Text('❖', {
    fontSize: 20,
    fill: okeyState.isAllValidToWin ? '#4ade80' : '#64748b'
  });
  diamondIcon.anchor.set(0.5);
  diamondIcon.position.set(layout.finishPos.x, layout.finishPos.y);
  tableLayer.addChild(finishTitle, diamondIcon);

  // پوولی پیشاندەر لە ناوەڕاستی سینیەکە
  if (okeyState.indicatorTile) {
    const indSprite = new PIXI.Sprite(tileTextureCache.get(`tile_${okeyState.indicatorTile.color}_${okeyState.indicatorTile.number}`));
    indSprite.anchor.set(0.5);
    indSprite.width = tileW * 0.86;
    indSprite.height = tileH * 0.86;
    indSprite.position.set(layout.indicatorPos.x, layout.indicatorPos.y);
    tableLayer.addChild(indSprite);
  }

  // ستوونی ٣ ڕەهەندیی دەستە پوولە سوورەکە لە لای ڕاستی سینیەکە
  const stackLayers = Math.min(7, Math.max(1, Math.ceil(okeyState.deck.length / 8)));
  for (let s = stackLayers; s >= 1; s--) {
    const layerSp = new PIXI.Sprite(getTileTex(null));
    layerSp.anchor.set(0.5);
    layerSp.width = tileW * 0.88;
    layerSp.height = tileH * 0.88;
    layerSp.tint = s % 2 === 0 ? 0xdddddd : 0xeeeeee;
    layerSp.position.set(layout.deckPos.x, layout.deckPos.y - s * 2.5 + 8);
    tableLayer.addChild(layerSp);
  }

  const deckSprite = new PIXI.Sprite(getTileTex(null));
  deckSprite.anchor.set(0.5);
  deckSprite.width = tileW * 0.88;
  deckSprite.height = tileH * 0.88;
  deckSprite.position.set(layout.deckPos.x, layout.deckPos.y + 8);
  deckSprite.eventMode = 'static';
  deckSprite.cursor = 'pointer';
  deckSprite.on('pointertap', () => okeyPlayerDrawFromDeck());
  tableLayer.addChild(deckSprite);

  // باجی سپی ژمارەی پوولەکانی ماوە (وەک 48 لە وێنەکەدا)
  const badgeX = layout.deckPos.x + tileW * 0.38;
  const badgeY = layout.deckPos.y - tileH * 0.48;
  const deckBadge = new PIXI.Graphics();
  deckBadge.beginFill(0xffffff, 1);
  deckBadge.lineStyle(1.5, 0x0f172a, 0.25);
  deckBadge.drawCircle(badgeX, badgeY, 14);
  deckBadge.endFill();

  const deckCountTxt = new PIXI.Text(String(okeyState.deck.length), {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 11.5,
    fontWeight: '900',
    fill: '#0f172a'
  });
  deckCountTxt.anchor.set(0.5);
  deckCountTxt.position.set(badgeX, badgeY);
  tableLayer.addChild(deckBadge, deckCountTxt);

  // ٤. خانەکانی فڕێدانی پوول لە دەوری مێزەکە
  const dW = Math.round(tileW * 0.82);
  const dH = Math.round(tileH * 0.82);
  drawDiscardPile(layout.leftDiscardPos.x, layout.leftDiscardPos.y, dW, dH, okeyState.myDiscards, 'فڕێدانی تۆ', false, true);
  drawDiscardPile(layout.botDiscardPositions[0].x, layout.botDiscardPositions[0].y, dW * 0.88, dH * 0.88, okeyState.bots[0].discards, '', false, false);
  drawDiscardPile(layout.botDiscardPositions[1].x, layout.botDiscardPositions[1].y, dW * 0.88, dH * 0.88, okeyState.bots[1].discards, '', false, false);

  const canPickRight = okeyState.turn === 0 && okeyState.phase === 'draw' && okeyState.bots[2].discards.length > 0;
  drawDiscardPile(layout.rightDiscardPos.x, layout.rightDiscardPos.y, dW, dH, okeyState.bots[2].discards, 'هەڵگرتنەوە', canPickRight, false);

  // ٥. تەختە دوو-ڕیزییە گەورە و نزیکەکە
  const rackGfx = new PIXI.Graphics();

  // سێبەری تەختە
  rackGfx.beginFill(0x000000, 0.72);
  rackGfx.drawRoundedRect(layout.rackX + 4, layout.rackY + 8, layout.rackW, layout.rackH, 12);
  rackGfx.endFill();

  // چوارچێوەی دەرەوەی تەختەی دارینی تۆخ
  rackGfx.beginFill(0x281009, 1);
  rackGfx.lineStyle(2, 0x4c2114, 1);
  rackGfx.drawRoundedRect(layout.rackX, layout.rackY, layout.rackW, layout.rackH, 12);
  rackGfx.endFill();

  // ٢٨ خانە ڕەشە قووڵەکەی ناو تەختەکە (ڕێک وەک خانە تاریکەکانی ناو وێنەکەت)
  for (const s of layout.slotCoords) {
    const isHover = s.idx === dragContext.hoverSlotIdx;
    const isSel = s.idx === selectedSlotIdx;
    rackGfx.lineStyle(isHover || isSel ? 2.2 : 1, isHover ? 0x38bdf8 : (isSel ? 0xfacc15 : 0x1e0c07), 0.95);
    rackGfx.beginFill(isHover ? 0x1e293b : 0x0c0503, 0.92);
    rackGfx.drawRoundedRect(s.cx - tileW / 2, s.cy - tileH / 2, tileW, tileH, 8);
    rackGfx.endFill();
  }

  // هێڵی جیاکەرەوەی نێوان ڕیزی سەرەوە و خوارەوە
  rackGfx.lineStyle(0);
  rackGfx.beginFill(0x3a180e, 1);
  rackGfx.drawRect(layout.rackX + 6, layout.rackY + layout.rackH / 2 - 2.5, layout.rackW - 12, 5);
  rackGfx.endFill();

  rackBgLayer.addChild(rackGfx);

  // ٦. چوار دوگمە سپییە گەورەکەی تەنیشت چەپ و ڕاستی تەختەکە (ڕێک وەک وێنەکە)
  drawRackSideButtons();

  // ٧. هاوتاکردنی پوولەکان
  syncPlayerRackSprites(animateDeal, animateSlide);
}

function drawBotProfile(botIdx, mode) {
  const bot = okeyState.bots[botIdx];
  const pos = layout.botPositions[botIdx];
  const isActive = okeyState.turn === botIdx + 1;

  const container = new PIXI.Container();
  container.position.set(pos.x, pos.y);

  const g = new PIXI.Graphics();

  // بازنەی سپی ئاڤاتاری بۆت ('ک')
  const avX = mode === 'horizontal' ? 56 : 0;
  const avY = mode === 'horizontal' ? 0 : -28;

  g.beginFill(0xffffff, 1);
  g.lineStyle(isActive ? 3.5 : 2, isActive ? 0x22c55e : 0xcbd5e1, 1);
  g.drawCircle(avX, avY, 22);
  g.endFill();

  // باجی ڕەشی ژمارەی پوولەکان (14)
  g.beginFill(0x1e293b, 1);
  g.lineStyle(1.5, 0xffffff, 0.9);
  g.drawCircle(avX + 16, avY - 15, 10);
  g.endFill();
  container.addChild(g);

  const kTxt = new PIXI.Text('ک', {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 17,
    fontWeight: '900',
    fill: '#dc2626'
  });
  kTxt.anchor.set(0.5);
  kTxt.position.set(avX, avY - 1);

  const cntTxt = new PIXI.Text(String(bot.tiles.length), {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 10,
    fontWeight: '900',
    fill: '#ffffff'
  });
  cntTxt.anchor.set(0.5);
  cntTxt.position.set(avX + 16, avY - 15);
  container.addChild(kTxt, cntTxt);

  // ناوی بۆت + پلە + خاڵ
  const nameTxt = new PIXI.Text(bot.name, {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 12.5,
    fontWeight: '800',
    fill: '#ffffff'
  });

  if (mode === 'horizontal') {
    nameTxt.anchor.set(0.5);
    nameTxt.position.set(-12, 2);
    container.addChild(nameTxt);

    const rankBadge = new PIXI.Graphics();
    rankBadge.beginFill(0x0f172a, 0.85);
    rankBadge.lineStyle(1.5, bot.badgeCol, 1);
    rankBadge.drawRoundedRect(-118, -20, 48, 20, 10);
    rankBadge.endFill();

    rankBadge.beginFill(0x0f172a, 0.9);
    rankBadge.lineStyle(0);
    rankBadge.drawRoundedRect(-118, 3, 48, 18, 9);
    rankBadge.endFill();
    container.addChild(rankBadge);

    const rTxt = new PIXI.Text(bot.rank, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 10.5,
      fontWeight: '800',
      fill: '#fde047'
    });
    rTxt.anchor.set(0.5);
    rTxt.position.set(-94, -10);

    const sTxt = new PIXI.Text(String(bot.score), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 10.5,
      fontWeight: '900',
      fill: '#ffffff'
    });
    sTxt.anchor.set(0.5);
    sTxt.position.set(-94, 12);
    container.addChild(rTxt, sTxt);
  } else {
    nameTxt.anchor.set(0.5);
    nameTxt.position.set(0, 6);
    container.addChild(nameTxt);

    const rankBadge = new PIXI.Graphics();
    rankBadge.beginFill(0x0f172a, 0.85);
    rankBadge.lineStyle(1.5, bot.badgeCol, 1);
    rankBadge.drawRoundedRect(-32, 19, 64, 21, 10);
    rankBadge.endFill();

    rankBadge.beginFill(0x0f172a, 0.9);
    rankBadge.lineStyle(0);
    rankBadge.drawRoundedRect(-28, 44, 56, 19, 9);
    rankBadge.endFill();
    container.addChild(rankBadge);

    const rTxt = new PIXI.Text(bot.rank, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 10.5,
      fontWeight: '800',
      fill: '#93c5fd'
    });
    rTxt.anchor.set(0.5);
    rTxt.position.set(0, 29.5);

    const sTxt = new PIXI.Text(String(bot.score), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 11,
      fontWeight: '900',
      fill: '#ffffff'
    });
    sTxt.anchor.set(0.5);
    sTxt.position.set(0, 53.5);
    container.addChild(rTxt, sTxt);
  }

  tableLayer.addChild(container);
}

function drawRackSideButtons() {
  const btnW = 136;
  const btnH = 48;
  const leftX = layout.rackX - btnW / 2 - 16;
  const rightX = layout.rackX + layout.rackW + btnW / 2 + 16;
  const topBtnY = layout.rackY + layout.rackH - 82;
  const botBtnY = layout.rackY + layout.rackH - 24;

  const createPillButton = (cx, cy, label, subColor, onClick, isHighlighted = false) => {
    const c = new PIXI.Container();
    c.position.set(cx, cy);
    c.eventMode = 'static';
    c.cursor = 'pointer';

    const g = new PIXI.Graphics();
    g.beginFill(0x000000, 0.38);
    g.drawRoundedRect(-btnW / 2 + 2, -btnH / 2 + 4, btnW, btnH, 24);
    g.endFill();

    g.beginFill(isHighlighted ? 0xfef08a : 0xffffff, 1);
    g.lineStyle(2, isHighlighted ? 0xf59e0b : 0xe2e8f0, 1);
    g.drawRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 24);
    g.endFill();
    c.addChild(g);

    const txt = new PIXI.Text(label, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 15,
      fontWeight: '900',
      fill: subColor || '#0f172a'
    });
    txt.anchor.set(0.5);
    c.addChild(txt);

    c.on('pointertap', () => {
      playOkeyTileSound('clack');
      onClick();
    });
    rackBgLayer.addChild(c);
  };

  // دوو دوگمەکەی لای چەپی تەختەکە (جووتەکان + کۆنکان 👑)
  createPillButton(leftX, topBtnY, 'جووتەکان', '#334155', () => okeyAutoSortRack('pairs'));
  createPillButton(leftX, botBtnY, '👑 کۆنکان', '#0f172a', () => okeyTryInstantKonkanBtn(), okeyState.isAllValidToWin);

  // دوو دوگمەکەی لای ڕاستی تەختەکە (ژمێرەری سێت + ڕیزکردن)
  const validCount = okeyState.validTileIds ? okeyState.validTileIds.size : 0;
  createPillButton(rightX, topBtnY, `${validCount} / 14`, validCount === 14 ? '#16a34a' : '#dc2626', () => okeyAutoSortRack('runs'));
  createPillButton(rightX, botBtnY, 'ڕیزکردن', '#0f172a', () => okeyAutoSortRack('runs'));
}

function drawDiscardPile(x, y, w, h, pile, label, clickablePickup, isMyLeftDiscard) {
  const g = new PIXI.Graphics();
  g.beginFill(0x090612, 0.55);
  g.lineStyle(1.8, clickablePickup ? 0x22c55e : 0xffffff, clickablePickup ? 0.95 : 0.22);
  g.drawRoundedRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, 12);
  g.endFill();

  if (isMyLeftDiscard || clickablePickup) {
    g.eventMode = 'static';
    g.cursor = 'pointer';
    g.on('pointertap', () => {
      if (isMyLeftDiscard && selectedSlotIdx !== -1) {
        const from = selectedSlotIdx;
        selectedSlotIdx = -1;
        okeyPlayerDiscardTile(from, false);
      } else if (clickablePickup) {
        okeyPlayerTakeRightDiscard();
      }
    });
  }
  tableLayer.addChild(g);

  if (label) {
    const lbl = new PIXI.Text(label, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 10.5,
      fontWeight: '800',
      fill: clickablePickup ? '#4ade80' : '#cbd5e1'
    });
    lbl.anchor.set(0.5);
    lbl.position.set(x, y - h / 2 - 12);
    tableLayer.addChild(lbl);
  }

  if (pile && pile.length > 0) {
    if (pile.length > 1) {
      const prevTile = pile[pile.length - 2];
      const underSp = new PIXI.Sprite(getTileTex(prevTile));
      underSp.anchor.set(0.5);
      underSp.width = w;
      underSp.height = h;
      underSp.tint = 0xcccccc;
      underSp.rotation = -0.07;
      underSp.position.set(x - 3, y + 2);
      tableLayer.addChild(underSp);
    }

    const topTile = pile[pile.length - 1];
    const sp = new PIXI.Sprite(getTileTex(topTile));
    sp.anchor.set(0.5);
    sp.width = w;
    sp.height = h;
    sp.position.set(x, y);

    if (clickablePickup || isMyLeftDiscard) {
      sp.eventMode = 'static';
      sp.cursor = 'pointer';
      sp.on('pointertap', () => {
        if (isMyLeftDiscard && selectedSlotIdx !== -1) {
          const from = selectedSlotIdx;
          selectedSlotIdx = -1;
          okeyPlayerDiscardTile(from, false);
        } else if (clickablePickup) {
          okeyPlayerTakeRightDiscard();
        }
      });
    }
    tableLayer.addChild(sp);
  }
}

// ============================================================================
// ٧. ڕاکێشانی فیزیایی، ڕاوەشاندنی پوول لەسەر مێز، و خلیسکانی ئۆتۆماتیکی (Auto-Shift)
// ============================================================================
function syncPlayerRackSprites(animateDeal = false, animateSlide = false) {
  const { tileW, tileH } = layout;
  const activeUids = new Set();

  for (let idx = 0; idx < RACK_TOTAL_SLOTS; idx++) {
    const tile = okeyState.rackSlots[idx];
    if (!tile) continue;
    activeUids.add(tile.uid);

    const slot = layout.slotCoords[idx];
    let sprite = rackSpritesMap.get(tile.uid);

    if (!sprite) {
      sprite = new PIXI.Sprite(getTileTex(tile));
      sprite.anchor.set(0.5);
      sprite.width = tileW;
      sprite.height = tileH;
      sprite.position.set(animateDeal ? layout.deckPos.x : slot.cx, animateDeal ? layout.deckPos.y : slot.cy);
      sprite.eventMode = 'static';
      sprite.cursor = 'grab';

      bindTileInteraction(sprite);
      tilesLayer.addChild(sprite);
      rackSpritesMap.set(tile.uid, sprite);
    } else if (!dragContext.active || dragContext.sprite !== sprite) {
      sprite.texture = getTileTex(tile);
      sprite.width = tileW;
      sprite.height = tileH;
      sprite.rotation = 0;
    }

    sprite.slotIdx = idx;
    sprite.tileData = tile;

    if (dragContext.active && dragContext.sprite === sprite) continue;

    const isSelected = (idx === selectedSlotIdx);
    const targetY = isSelected ? slot.cy - 14 : slot.cy;

    if (animateDeal) {
      addPixiTween({
        target: sprite,
        from: { x: layout.deckPos.x, y: layout.deckPos.y },
        to: { x: slot.cx, y: targetY },
        duration: 210 + idx * 10
      });
    } else if (animateSlide) {
      addPixiTween({
        target: sprite,
        from: { x: sprite.x, y: sprite.y },
        to: { x: slot.cx, y: targetY },
        duration: 120
      });
    } else {
      sprite.position.set(slot.cx, targetY);
    }
  }

  for (const [uid, sp] of rackSpritesMap.entries()) {
    if (!activeUids.has(uid)) {
      sp.destroy();
      rackSpritesMap.delete(uid);
    }
  }

  // چوارچێوەی سووری گەش لە دەوری سێتە دروستەکان (ڕێک وەک چوارچێوەی [12 12 12 12] لە وێنەکەدا)
  bracketsLayer.removeChildren();
  const frame = new PIXI.Graphics();
  for (const b of okeyState.validGroupsBounds) {
    const first = layout.slotCoords[b.row * RACK_COLS + b.startCol];
    const last = layout.slotCoords[b.row * RACK_COLS + b.endCol];
    if (first && last) {
      const bw = (last.cx - first.cx) + tileW + 6;
      const bh = tileH + 6;
      frame.lineStyle(3.8, 0xef4444, 1);
      frame.drawRoundedRect(first.cx - tileW / 2 - 3, first.cy - tileH / 2 - 3, bw, bh, 10);
    }
  }
  bracketsLayer.addChild(frame);
}

function bindTileInteraction(sprite) {
  let lastTapTime = 0;

  sprite.on('pointerdown', (e) => {
    if (okeyState.isAnimating) return;
    e.stopPropagation();

    const now = performance.now();
    // دووجار پەنجەپێدانان بۆ فڕێدانی خێرا
    if (now - lastTapTime < 290 && okeyState.turn === 0 && okeyState.phase === 'play') {
      selectedSlotIdx = -1;
      okeyPlayerDiscardTile(sprite.slotIdx, false);
      return;
    }
    lastTapTime = now;

    const stagePos = getStagePointerPos(e.global);
    dragContext.active = true;
    dragContext.sprite = sprite;
    dragContext.tile = sprite.tileData;
    dragContext.fromSlotIdx = sprite.slotIdx;
    dragContext.lastX = stagePos.x;
    dragContext.lastY = stagePos.y;
    dragContext.vx = 0;
    dragContext.vy = 0;
    dragContext.pointerStartX = stagePos.x;
    dragContext.pointerStartY = stagePos.y;
    dragContext.hasMoved = false;
    dragContext.isTouch = (e.pointerType === 'touch');
    dragContext.hoverSlotIdx = -1;
    dragContext.isFlipping3D = false;
    dragContext.showingBack = false;
    dragContext.lastSignX = 0;
    dragContext.shakeReversals = 0;

    // سێبەری جووڵاوی ژێر پوولەکە کاتێک بەرزی دەکەیتەوە
    const sh = new PIXI.Graphics();
    sh.beginFill(0x000000, 0.42);
    sh.drawRoundedRect(-layout.tileW * 0.56, -layout.tileH * 0.56, layout.tileW * 1.12, layout.tileH * 1.12, 12);
    sh.endFill();
    sh.position.set(sprite.x + 10, sprite.y + 16);
    fxLayer.addChild(sh);
    dragContext.shadow = sh;

    playOkeyTileSound('clack');
    fxLayer.addChild(sprite);
    sprite.width = layout.tileW * 1.14;
    sprite.height = layout.tileH * 1.14;
  });
}

function setupGlobalStagePointerEvents() {
  pixiApp.stage.eventMode = 'static';
  pixiApp.stage.hitArea = new PIXI.Rectangle(-4000, -4000, 10000, 10000);

  pixiApp.stage.on('pointermove', (e) => {
    if (!dragContext.active || !dragContext.sprite || okeyState.isAnimating) return;
    const pos = getStagePointerPos(e.global);
    const dxTotal = pos.x - dragContext.pointerStartX;
    const dyTotal = pos.y - dragContext.pointerStartY;

    if (!dragContext.hasMoved && Math.hypot(dxTotal, dyTotal) > 6) {
      dragContext.hasMoved = true;
      selectedSlotIdx = -1;
    }

    if (dragContext.hasMoved) {
      const stepDx = pos.x - dragContext.lastX;
      const stepDy = pos.y - dragContext.lastY;
      dragContext.vx = stepDx;
      dragContext.vy = stepDy;
      dragContext.lastX = pos.x;
      dragContext.lastY = pos.y;

      const touchLift = dragContext.isTouch ? -18 : 0;
      const curX = pos.x;
      const curY = pos.y + touchLift;
      dragContext.sprite.position.set(curX, curY);

      // ئەگەر یاریزان لە ناوەڕاستی مێزەکە بە خێرایی پوولەکەی بە چەپ و ڕاستدا ڕاوەشاند، تەقڵە لێدەدات!
      if (curY < layout.rackY - 15 && Math.abs(stepDx) > 13) {
        const sign = Math.sign(stepDx);
        if (dragContext.lastSignX !== 0 && sign !== dragContext.lastSignX) {
          dragContext.shakeReversals++;
          if (dragContext.shakeReversals >= 2 && dragContext.flipCooldown <= 0) {
            dragContext.shakeReversals = 0;
            triggerMidAirFidgetFlip();
          }
        }
        dragContext.lastSignX = sign;
      }

      // دیاریکردنی خانەی ژێر پەنجە لەناو تەختەکە
      let nearestIdx = -1;
      let minDist = Infinity;
      for (const s of layout.slotCoords) {
        const d = Math.hypot(curX - s.cx, curY - s.cy);
        if (d < minDist && d < layout.slotW * 0.95) {
          minDist = d;
          nearestIdx = s.idx;
        }
      }
      if (nearestIdx !== dragContext.hoverSlotIdx) {
        dragContext.hoverSlotIdx = nearestIdx;
      }
    }
  });

  const finishPointerDrag = () => {
    if (!dragContext.active || !dragContext.sprite) return;
    const sp = dragContext.sprite;
    const fromIdx = dragContext.fromSlotIdx;
    const moved = dragContext.hasMoved;

    if (dragContext.shadow) {
      dragContext.shadow.destroy();
      dragContext.shadow = null;
    }

    dragContext.active = false;
    dragContext.sprite = null;
    dragContext.hoverSlotIdx = -1;
    dragContext.isFlipping3D = false;

    sp.texture = getTileTex(sp.tileData);
    sp.width = layout.tileW;
    sp.height = layout.tileH;
    sp.rotation = 0;
    tilesLayer.addChild(sp);

    if (!moved) {
      if (selectedSlotIdx === -1) {
        selectedSlotIdx = fromIdx;
        playOkeyTileSound('flip');
      } else if (selectedSlotIdx === fromIdx) {
        selectedSlotIdx = -1;
      } else {
        insertTileWithMagneticShift(selectedSlotIdx, fromIdx);
        selectedSlotIdx = -1;
      }
      renderFullScene(false, true);
      return;
    }

    handleTileDrop(fromIdx, sp.x, sp.y);
  };

  pixiApp.stage.on('pointerup', finishPointerDrag);
  pixiApp.stage.on('pointerupoutside', finishPointerDrag);
  pixiApp.stage.on('pointercancel', finishPointerDrag);

  pixiApp.stage.on('pointerdown', (e) => {
    if (okeyState.isAnimating || dragContext.active || selectedSlotIdx === -1) return;
    const pos = getStagePointerPos(e.global);

    let bestSlot = null;
    let minDist = Infinity;
    for (const s of layout.slotCoords) {
      const d = Math.hypot(pos.x - s.cx, pos.y - s.cy);
      if (d < minDist && d < layout.slotW * 0.92) {
        minDist = d;
        bestSlot = s;
      }
    }

    if (bestSlot && bestSlot.idx !== selectedSlotIdx) {
      insertTileWithMagneticShift(selectedSlotIdx, bestSlot.idx);
      selectedSlotIdx = -1;
      renderFullScene(false, true);
    }
  });
}

// خلیسکانی ئۆتۆماتیکیی پوولەکانی ناو تەختە کاتێک پوولێک دەخەیتە نێوانیانەوە
function insertTileWithMagneticShift(fromIdx, targetIdx) {
  if (fromIdx === targetIdx) return;
  const movingTile = okeyState.rackSlots[fromIdx];
  if (!movingTile) return;

  okeyState.rackSlots[fromIdx] = null;

  // ئەگەر خانەی ئامانج بەتاڵ بوو، ڕاستەوخۆ تێیدا دابنێ
  if (!okeyState.rackSlots[targetIdx]) {
    okeyState.rackSlots[targetIdx] = movingTile;
    playOkeyTileSound('clack');
    evaluatePlayerRack();
    return;
  }

  // ئەگەر پڕ بوو، لە هەمان ڕیزدا نزیکترین خانەی بەتاڵ بدۆزەرەوە و پوولەکانی تر بخلیسکێنە
  const row = Math.floor(targetIdx / RACK_COLS);
  const rowStart = row * RACK_COLS;
  const rowEnd = rowStart + RACK_COLS - 1;

  let emptyRight = -1;
  for (let i = targetIdx; i <= rowEnd; i++) {
    if (!okeyState.rackSlots[i]) {
      emptyRight = i;
      break;
    }
  }

  let emptyLeft = -1;
  for (let i = targetIdx; i >= rowStart; i--) {
    if (!okeyState.rackSlots[i]) {
      emptyLeft = i;
      break;
    }
  }

  if (emptyRight !== -1 && (emptyLeft === -1 || (emptyRight - targetIdx) <= (targetIdx - emptyLeft))) {
    for (let i = emptyRight; i > targetIdx; i--) {
      okeyState.rackSlots[i] = okeyState.rackSlots[i - 1];
    }
    okeyState.rackSlots[targetIdx] = movingTile;
  } else if (emptyLeft !== -1) {
    for (let i = emptyLeft; i < targetIdx; i++) {
      okeyState.rackSlots[i] = okeyState.rackSlots[i + 1];
    }
    okeyState.rackSlots[targetIdx] = movingTile;
  } else {
    // ئەگەر تەواوی ڕیزەکە پڕ بوو، جێگۆڕکێ بکە
    okeyState.rackSlots[fromIdx] = okeyState.rackSlots[targetIdx];
    okeyState.rackSlots[targetIdx] = movingTile;
  }

  playOkeyTileSound('clack');
  evaluatePlayerRack();
}

function handleTileDrop(fromSlotIdx, dropX, dropY) {
  // ١. پشکنینی فڕێدان بۆ خانەی کۆنکان لە ناوەڕاستی سینیەکە
  const distFinish = Math.hypot(dropX - layout.finishPos.x, dropY - layout.finishPos.y);
  if (distFinish < layout.tileH * 0.95) {
    if (okeyPlayerDiscardTile(fromSlotIdx, true)) return;
  }

  // ٢. پشکنینی فڕێدان بۆ خانەی فڕێدانی لای چەپ
  const distLeftDiscard = Math.hypot(dropX - layout.leftDiscardPos.x, dropY - layout.leftDiscardPos.y);
  if (distLeftDiscard < layout.tileH * 1.15) {
    if (okeyPlayerDiscardTile(fromSlotIdx, false)) return;
  }

  // ٣. پشکنینی دانان لەناو ٢٨ خانەکەی تەختەکەدا (بە خلیسکانی ئۆتۆماتیکی)
  let bestSlot = null;
  let minDist = Infinity;
  for (const s of layout.slotCoords) {
    const d = Math.hypot(dropX - s.cx, dropY - s.cy);
    if (d < minDist && d < layout.slotW * 1.25) {
      minDist = d;
      bestSlot = s;
    }
  }

  if (bestSlot && bestSlot.idx !== fromSlotIdx) {
    insertTileWithMagneticShift(fromSlotIdx, bestSlot.idx);
  } else {
    playOkeyTileSound('clack');
  }

  renderFullScene(false, true);
}

// ============================================================================
// ٨. ئەنیمەیشنەکانی تەقڵەلێدانی فڕێدان و ڕاکێشان بە 120FPS
// ============================================================================
function animateSomersaultThrow(tile, fromX, fromY, toX, toY, onComplete) {
  const sp = new PIXI.Sprite(getTileTex(tile));
  sp.anchor.set(0.5);
  sp.width = layout.tileW;
  sp.height = layout.tileH;
  sp.position.set(fromX, fromY);
  fxLayer.addChild(sp);

  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 65;

  addPixiTween({
    target: sp,
    from: { x: fromX, y: fromY, width: layout.tileW, height: layout.tileH, rotation: 0 },
    to: { x: midX, y: midY, width: layout.tileW * 0.14, height: layout.tileH * 1.18, rotation: Math.PI },
    duration: 115,
    onComplete: () => {
      addPixiTween({
        target: sp,
        from: { x: midX, y: midY, width: layout.tileW * 0.14, height: layout.tileH * 1.18, rotation: Math.PI },
        to: { x: toX, y: toY, width: layout.tileW * 0.82, height: layout.tileH * 0.82, rotation: Math.PI * 2 },
        duration: 115,
        onComplete: () => {
          sp.destroy();
          if (onComplete) onComplete();
        }
      });
    }
  });
}

function animateFlipAndFlyToRack(tile, fromX, fromY, targetSlotIdx, onComplete) {
  const targetSlot = layout.slotCoords[targetSlotIdx];
  const sp = new PIXI.Sprite(getTileTex(null));
  sp.anchor.set(0.5);
  sp.width = layout.tileW;
  sp.height = layout.tileH;
  sp.position.set(fromX, fromY);
  fxLayer.addChild(sp);

  const midX = (fromX + targetSlot.cx) / 2;
  const midY = (fromY + targetSlot.cy) / 2 - 48;

  addPixiTween({
    target: sp,
    from: { x: fromX, y: fromY, width: layout.tileW },
    to: { x: midX, y: midY, width: 4 },
    duration: 100,
    onComplete: () => {
      sp.texture = getTileTex(tile);
      addPixiTween({
        target: sp,
        from: { x: midX, y: midY, width: 4 },
        to: { x: targetSlot.cx, y: targetSlot.cy, width: layout.tileW },
        duration: 115,
        onComplete: () => {
          sp.destroy();
          if (onComplete) onComplete();
        }
      });
    }
  });
}

function animateBotDrawSwoop(fromX, fromY, toX, toY, onComplete) {
  const sp = new PIXI.Sprite(getTileTex(null));
  sp.anchor.set(0.5);
  sp.width = layout.tileW * 0.82;
  sp.height = layout.tileH * 0.82;
  sp.position.set(fromX, fromY);
  fxLayer.addChild(sp);

  addPixiTween({
    target: sp,
    from: { x: fromX, y: fromY, rotation: 0, alpha: 1 },
    to: { x: toX, y: toY, rotation: Math.PI, alpha: 0.6 },
    duration: 145,
    onComplete: () => {
      sp.destroy();
      if (onComplete) onComplete();
    }
  });
}

// ============================================================================
// ٩. بەڕێوەبردنی گەڕەکانی یاری، کاتژمێری نۆرە، و بۆتەکان
// ============================================================================
function startTurnCountdown() {
  if (turnTimerInterval) clearInterval(turnTimerInterval);
  okeyState.timerSeconds = 28;
  const badge = document.getElementById('turnTimerBadge');
  if (badge) badge.textContent = '28';

  turnTimerInterval = setInterval(() => {
    if (okeyState.winner) {
      clearInterval(turnTimerInterval);
      return;
    }
    okeyState.timerSeconds = Math.max(0, okeyState.timerSeconds - 1);
    if (badge) badge.textContent = String(okeyState.timerSeconds);
  }, 1000);
}

function updateTopHudStatus(customSub = null) {
  const titleEl = document.getElementById('turnTitleText');
  const subEl = document.getElementById('turnSubText');
  const jokerNumEl = document.getElementById('hudJokerNumber');
  const jokerDotEl = document.getElementById('hudJokerDot');
  const roundEl = document.getElementById('hudRoundText');

  if (okeyState.jokerRule && jokerNumEl && jokerDotEl) {
    jokerNumEl.textContent = String(okeyState.jokerRule.number);
    jokerDotEl.style.backgroundColor = OKEY_COLOR_HEX[okeyState.jokerRule.color];
  }
  if (roundEl) {
    roundEl.textContent = `${okeyState.round}/${okeyState.maxRounds}`;
  }

  if (!titleEl || !subEl) return;
  if (customSub) {
    subEl.textContent = customSub;
    return;
  }

  if (okeyState.turn === 0) {
    titleEl.textContent = 'نۆرەی تۆیە!';
    titleEl.className = 'text-[11px] font-black text-emerald-600';
    subEl.textContent = okeyState.phase === 'draw' ? 'پوولێک ڕابکێشە' : 'پوولێک فڕێ بدە';
  } else {
    const bot = okeyState.bots[okeyState.turn - 1];
    titleEl.textContent = bot.name;
    titleEl.className = 'text-[11px] font-black text-amber-600';
    subEl.textContent = 'بیر دەکاتەوە...';
  }
}

function okeyStartNewRound() {
  const fullDeck = buildOkey106Deck();
  const indIdx = fullDeck.findIndex(t => !t.isFalseJoker);
  const indicator = fullDeck.splice(indIdx, 1)[0];
  const jokerNum = indicator.number === 13 ? 1 : indicator.number + 1;

  okeyState.indicatorTile = indicator;
  okeyState.jokerRule = { color: indicator.color, number: jokerNum };

  okeyState.rackSlots = new Array(RACK_TOTAL_SLOTS).fill(null);
  const myInitialTiles = fullDeck.splice(0, 15);
  myInitialTiles.forEach((t, i) => {
    const slotIdx = i < 8 ? i + 2 : RACK_COLS + (i - 8) + 2;
    okeyState.rackSlots[slotIdx] = t;
  });

  okeyState.bots.forEach(b => {
    b.tiles = fullDeck.splice(0, 14);
    b.discards = [];
  });

  okeyState.deck = fullDeck;
  okeyState.myDiscards = [];
  okeyState.turn = 0;
  okeyState.phase = 'play';
  okeyState.winner = null;
  okeyState.isAnimating = false;
  selectedSlotIdx = -1;

  evaluatePlayerRack();
  updateTopHudStatus();
  startTurnCountdown();
  playOkeyTileSound('whoosh');
  renderFullScene(true, false);
}

function getFirstEmptySlotIndex() {
  for (let i = RACK_COLS; i < RACK_TOTAL_SLOTS; i++) {
    if (!okeyState.rackSlots[i]) return i;
  }
  for (let i = 0; i < RACK_COLS; i++) {
    if (!okeyState.rackSlots[i]) return i;
  }
  return 0;
}

function okeyPlayerDrawFromDeck() {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'draw') return;
  if (okeyState.deck.length === 0) {
    okeyStartNewRound();
    return;
  }

  const drawn = okeyState.deck.pop();
  const targetSlotIdx = getFirstEmptySlotIndex();

  okeyState.isAnimating = true;
  selectedSlotIdx = -1;
  renderFullScene(false, false);
  playOkeyTileSound('whoosh');

  animateFlipAndFlyToRack(drawn, layout.deckPos.x, layout.deckPos.y, targetSlotIdx, () => {
    okeyState.rackSlots[targetSlotIdx] = drawn;
    okeyState.phase = 'play';
    okeyState.isAnimating = false;
    playOkeyTileSound('clack');
    evaluatePlayerRack();
    updateTopHudStatus();
    renderFullScene(false, false);
  });
}

function okeyPlayerTakeRightDiscard() {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'draw') return;
  const rightBot = okeyState.bots[2];
  if (rightBot.discards.length === 0) return;

  const taken = rightBot.discards.pop();
  const targetSlotIdx = getFirstEmptySlotIndex();

  okeyState.isAnimating = true;
  selectedSlotIdx = -1;
  renderFullScene(false, false);
  playOkeyTileSound('whoosh');

  animateFlipAndFlyToRack(taken, layout.rightDiscardPos.x, layout.rightDiscardPos.y, targetSlotIdx, () => {
    okeyState.rackSlots[targetSlotIdx] = taken;
    okeyState.phase = 'play';
    okeyState.isAnimating = false;
    playOkeyTileSound('clack');
    evaluatePlayerRack();
    updateTopHudStatus();
    renderFullScene(false, false);
  });
}

function okeyTryInstantKonkanBtn() {
  if (okeyState.turn !== 0 || okeyState.phase !== 'play') {
    updateTopHudStatus('لە نۆرەی خۆتدا ١٤ پوول بکە سێت!');
    return;
  }
  for (let i = 0; i < RACK_TOTAL_SLOTS; i++) {
    const t = okeyState.rackSlots[i];
    if (t && evaluatePlayerRack(t.uid).canWin14) {
      okeyPlayerDiscardTile(i, true);
      return;
    }
  }
  updateTopHudStatus('هێشتا ١٤ پوولەکەت نەبوونەتە سێت!');
}

function okeyPlayerDiscardTile(slotIdx, isFinishingDrop = false) {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'play') return false;
  const tile = okeyState.rackSlots[slotIdx];
  if (!tile) return false;

  const checkWithoutThis = evaluatePlayerRack(tile.uid);
  if (isFinishingDrop) {
    if (!checkWithoutThis.canWin14) {
      updateTopHudStatus('هێشتا ١٤ پوول نەبوونەتە سێت!');
      return false;
    }
    okeyState.rackSlots[slotIdx] = null;
    okeyState.winner = 'player';
    playOkeyTileSound('win');
    renderFullScene(false, false);
    showOkeyWinModal(true, 'پیرۆزە! هەموو ١٤ پوولەکەت کردە سێتی تەواو و بە کۆنکان بردتەوە!');
    return true;
  }

  const slotInfo = layout.slotCoords[slotIdx];
  okeyState.rackSlots[slotIdx] = null;
  okeyState.isAnimating = true;
  selectedSlotIdx = -1;
  syncPlayerRackSprites(false, false);
  playOkeyTileSound('whoosh');

  animateSomersaultThrow(
    tile,
    slotInfo.cx,
    slotInfo.cy,
    layout.leftDiscardPos.x,
    layout.leftDiscardPos.y,
    () => {
      okeyState.myDiscards.push(tile);
      okeyState.isAnimating = false;
      playOkeyTileSound('clack');

      evaluatePlayerRack();
      if (okeyState.isAllValidToWin) {
        okeyState.winner = 'player';
        playOkeyTileSound('win');
        renderFullScene(false, false);
        showOkeyWinModal(true, 'ئۆکەی شاهانە! هەموو پوولەکانت کردە سێتی تەواو!');
        return;
      }

      okeyState.turn = 1;
      okeyState.phase = 'draw';
      startTurnCountdown();
      updateTopHudStatus();
      renderFullScene(false, false);
      setTimeout(runNextBotTurn, 190);
    }
  );
  return true;
}

function runNextBotTurn() {
  if (okeyState.winner || okeyState.turn === 0) return;

  const botIdx = okeyState.turn - 1;
  const bot = okeyState.bots[botIdx];

  if (okeyState.deck.length === 0) {
    showOkeyWinModal(false, 'پوولەکانی ناوەڕاست تەواو بوون و کەس کۆنکانی نەکرد!');
    return;
  }

  okeyState.isAnimating = true;
  const drawn = okeyState.deck.pop();
  bot.tiles.push(drawn);
  renderFullScene(false, false);

  const botPos = layout.botPositions[botIdx];
  const discardTarget = layout.botDiscardPositions[botIdx];

  playOkeyTileSound('whoosh');
  animateBotDrawSwoop(layout.deckPos.x, layout.deckPos.y, botPos.x, botPos.y, () => {
    playOkeyTileSound('clack');

    let discardIdx = bot.tiles.findIndex(t => !isRealOkeyJoker(t));
    if (discardIdx === -1) discardIdx = 0;
    const discarded = bot.tiles.splice(discardIdx, 1)[0];

    setTimeout(() => {
      playOkeyTileSound('whoosh');
      animateSomersaultThrow(
        discarded,
        botPos.x,
        botPos.y,
        discardTarget.x,
        discardTarget.y,
        () => {
          bot.discards.push(discarded);
          okeyState.isAnimating = false;
          playOkeyTileSound('clack');

          if (okeyState.turn < 3) {
            okeyState.turn++;
            startTurnCountdown();
            updateTopHudStatus();
            renderFullScene(false, false);
            setTimeout(runNextBotTurn, 190);
          } else {
            okeyState.turn = 0;
            okeyState.phase = 'draw';
            startTurnCountdown();
            updateTopHudStatus();
            renderFullScene(false, false);
          }
        }
      );
    }, 95);
  });
}

function okeyAutoSortRack(mode = 'runs') {
  if (okeyState.isAnimating) return;
  const allTiles = okeyState.rackSlots.filter(Boolean);
  if (allTiles.length === 0) return;

  okeyState.rackSlots = new Array(RACK_TOTAL_SLOTS).fill(null);
  selectedSlotIdx = -1;
  const used = new Set();
  const placedGroups = [];

  if (mode === 'pairs') {
    for (let i = 0; i < allTiles.length; i++) {
      if (used.has(allTiles[i].uid)) continue;
      const t1 = getEffectiveTileValue(allTiles[i]);
      for (let j = i + 1; j < allTiles.length; j++) {
        if (used.has(allTiles[j].uid)) continue;
        const t2 = getEffectiveTileValue(allTiles[j]);
        if (t1.color === t2.color && t1.number === t2.number) {
          placedGroups.push([allTiles[i], allTiles[j]]);
          used.add(allTiles[i].uid);
          used.add(allTiles[j].uid);
          break;
        }
      }
    }
  } else {
    for (const color of OKEY_COLORS) {
      const byColor = allTiles
        .filter(t => !used.has(t.uid) && getEffectiveTileValue(t).color === color && !getEffectiveTileValue(t).isWild)
        .sort((a, b) => getEffectiveTileValue(a).number - getEffectiveTileValue(b).number);

      let seq = [];
      for (const tile of byColor) {
        const num = getEffectiveTileValue(tile).number;
        if (seq.length === 0) seq.push(tile);
        else {
          const prevNum = getEffectiveTileValue(seq[seq.length - 1]).number;
          if (num === prevNum + 1) seq.push(tile);
          else if (num > prevNum + 1) {
            if (seq.length >= 3) {
              placedGroups.push([...seq]);
              seq.forEach(s => used.add(s.uid));
            }
            seq = [tile];
          }
        }
      }
      if (seq.length >= 3) {
        placedGroups.push([...seq]);
        seq.forEach(s => used.add(s.uid));
      }
    }

    for (let num = 1; num <= 13; num++) {
      const sameNum = allTiles.filter(t => !used.has(t.uid) && getEffectiveTileValue(t).number === num && !getEffectiveTileValue(t).isWild);
      const uniqueByColor = [];
      const seenCol = new Set();
      for (const t of sameNum) {
        const c = getEffectiveTileValue(t).color;
        if (!seenCol.has(c)) {
          seenCol.add(c);
          uniqueByColor.push(t);
        }
      }
      if (uniqueByColor.length >= 3) {
        placedGroups.push(uniqueByColor);
        uniqueByColor.forEach(u => used.add(u.uid));
      }
    }
  }

  const leftovers = allTiles
    .filter(t => !used.has(t.uid))
    .sort((a, b) => {
      const ea = getEffectiveTileValue(a);
      const eb = getEffectiveTileValue(b);
      if (ea.isWild !== eb.isWild) return ea.isWild ? -1 : 1;
      return ea.color.localeCompare(eb.color) || ea.number - eb.number;
    });

  let row = 0;
  let col = 0;
  for (const grp of placedGroups) {
    if (col + grp.length > RACK_COLS) {
      row = 1;
      col = 0;
    }
    for (const tile of grp) {
      if (row < RACK_ROWS && col < RACK_COLS) {
        okeyState.rackSlots[row * RACK_COLS + col] = tile;
        col++;
      }
    }
    col++;
  }

  for (const tile of leftovers) {
    for (let idx = RACK_TOTAL_SLOTS - 1; idx >= 0; idx--) {
      if (!okeyState.rackSlots[idx]) {
        okeyState.rackSlots[idx] = tile;
        break;
      }
    }
  }

  playOkeyTileSound('clack');
  evaluatePlayerRack();
  renderFullScene(false, true);
}

function showOkeyWinModal(iWon, message) {
  const modal = document.getElementById('okeyWinModal');
  document.getElementById('winModalIcon').textContent = iWon ? '🏆' : '🎲';
  document.getElementById('winModalTitle').textContent = iWon ? 'ئۆکەی شاهانە!' : 'کۆتایی دەستەکە';
  document.getElementById('winModalDesc').textContent = message;
  modal.classList.remove('hidden');
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ============================================================================
// ١٠. دەستپێکردنی PixiJS v7 Application
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('okeyPixiStage');

  pixiApp = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    powerPreference: 'high-performance'
  });

  container.appendChild(pixiApp.view);
  bakeAllOkeyTextures();

  bgLayer = new PIXI.Container();
  tableLayer = new PIXI.Container();
  rackBgLayer = new PIXI.Container();
  bracketsLayer = new PIXI.Container();
  tilesLayer = new PIXI.Container();
  fxLayer = new PIXI.Container();

  pixiApp.stage.addChild(bgLayer, tableLayer, rackBgLayer, bracketsLayer, tilesLayer, fxLayer);

  setupGlobalStagePointerEvents();

  const handleViewportChange = () => {
    setTimeout(() => renderFullScene(false, false), 50);
  };

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange);
  }

  pixiApp.ticker.maxFPS = 120;
  pixiApp.ticker.add(() => {
    updateAllPixiTweensAndPhysics(pixiApp.ticker.deltaMS);
  });

  okeyStartNewRound();
});