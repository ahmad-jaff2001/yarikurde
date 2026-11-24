// ============================================================================
// YARI KURDI - ROYAL KURDISH OKEY ENGINE (PIXI.JS v7 - 120FPS MOBILE & PC)
// ============================================================================

const OKEY_COLORS = ['red', 'black', 'blue', 'yellow'];
const OKEY_COLOR_HEX = {
  red: '#e11d48',
  black: '#1e1b4b',
  blue: '#0284c7',
  yellow: '#d97706'
};

const RACK_COLS = 14;
const RACK_ROWS = 2;
const RACK_TOTAL_SLOTS = RACK_COLS * RACK_ROWS;

let pixiApp = null;
let okeySoundCtx = null;

// چینەکانی گرافیک
let tableLayer = null;
let rackBgLayer = null;
let bracketsLayer = null;
let tilesLayer = null;
let fxLayer = null;

const tileTextureCache = new Map();
const activeTweens = [];
const rackSpritesMap = new Map();

// بارودۆخی ڕاکێشان و هەڵبژاردنی پوول بۆ مۆبایل و کۆمپیوتەر
let dragContext = {
  active: false,
  sprite: null,
  fromSlotIdx: -1,
  startX: 0,
  startY: 0,
  pointerStartX: 0,
  pointerStartY: 0,
  hasMoved: false,
  isTouch: false
};
let selectedSlotIdx = -1;

// قەبارەی گۆڕەپانی بنەڕەتی کە خۆکارانە لەگەڵ درێژیی مۆبایل و کۆمپیوتەر دەگونجێت
let layout = {
  w: 1280,
  h: 720,
  tileW: 48,
  tileH: 66,
  slotW: 52,
  rackX: 256,
  rackY: 530,
  rackW: 768,
  rackH: 162,
  centerY: 265,
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
  deck: [],
  indicatorTile: null,
  jokerRule: null,
  rackSlots: new Array(RACK_TOTAL_SLOTS).fill(null),
  bots: [
    { id: 1, name: 'ئارام کوردی', rank: 'زێڕین', elo: 1480, tiles: [], discards: [] },
    { id: 2, name: 'شێرکۆ هەولێری', rank: 'زیو', elo: 1320, tiles: [], discards: [] },
    { id: 3, name: 'ڕۆژە سلێمانی', rank: 'ئەڵماس', elo: 1650, tiles: [], discards: [] }
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
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.065);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'select') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.035);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.start(now);
      osc.stop(now + 0.04);
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
// ٢. سیستمی ئەنیمەیشنی 120FPS و گەردیلەی زێڕین (Sparkle Ring FX)
// ============================================================================
function addPixiTween(config) {
  activeTweens.push({
    target: config.target,
    from: { ...config.from },
    to: { ...config.to },
    duration: config.duration || 180,
    elapsed: 0,
    ease: config.ease || ((t) => 1 - Math.pow(1 - t, 3)),
    onUpdate: config.onUpdate || null,
    onComplete: config.onComplete || null
  });
}

function updateAllPixiTweens(deltaMS) {
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
}

function spawnImpactGlow(x, y, color = 0xfacc15) {
  if (!fxLayer) return;
  const ring = new PIXI.Graphics();
  ring.lineStyle(3, color, 0.9);
  ring.drawCircle(0, 0, 22);
  ring.position.set(x, y);
  ring.scale.set(0.4);
  fxLayer.addChild(ring);

  addPixiTween({
    target: ring,
    from: { alpha: 0.95 },
    to: { alpha: 0 },
    duration: 240,
    onUpdate: (p) => {
      ring.scale.set(0.4 + p * 1.4);
    },
    onComplete: () => ring.destroy()
  });
}

// ============================================================================
// ٣. دروستکردنی تێکسچەری ٣ ڕەهەندی بۆ پوولەکان لەسەر GPU
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

function bakeAllOkeyTextures() {
  const W = 140;
  const H = 196;
  const R = 24;

  const createTileCanvas = (borderCol = '#e5dccb', borderW = 3.5, isJokerGlow = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // سێبەری دەرەکی
    drawRoundedRectPath(ctx, 4, 12, W - 8, H - 14, R);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // لێواری ٣ ڕەهەندیی خوارەوەی پوول
    drawRoundedRectPath(ctx, 4, 8, W - 8, H - 12, R);
    ctx.fillStyle = isJokerGlow ? '#d97706' : '#c7baa1';
    ctx.fill();

    // ڕووی عاجیی سەرەوەی پوول
    drawRoundedRectPath(ctx, 4, 3, W - 8, H - 15, R);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (isJokerGlow) {
      grad.addColorStop(0, '#fffbeb');
      grad.addColorStop(1, '#fef3c7');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f5efe2');
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

      ctx.fillStyle = hex;
      ctx.font = '900 74px "Arial Black", Vazirmatn, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), W / 2, H * 0.35);

      ctx.beginPath();
      ctx.arc(W / 2, H * 0.71, 14, 0, Math.PI * 2);
      ctx.fillStyle = hex;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.stroke();

      tileTextureCache.set(key, PIXI.Texture.from(canvas));

      // ٢) هەمان پوول ئەگەر ببێتە ئۆکەی ڕاستەقینە (بە تاجی زێڕینەوە)
      const jokerKey = `tile_${color}_${num}_joker`;
      const jObj = createTileCanvas('#f59e0b', 5, true);
      const jCtx = jObj.ctx;

      jCtx.fillStyle = hex;
      jCtx.font = '900 72px "Arial Black", Vazirmatn, sans-serif';
      jCtx.textAlign = 'center';
      jCtx.textBaseline = 'middle';
      jCtx.fillText(String(num), W / 2, H * 0.36);

      jCtx.beginPath();
      jCtx.arc(W / 2, H * 0.72, 13, 0, Math.PI * 2);
      jCtx.fillStyle = hex;
      jCtx.fill();

      jCtx.font = '26px sans-serif';
      jCtx.fillText('👑', W - 28, 26);

      tileTextureCache.set(jokerKey, PIXI.Texture.from(jObj.canvas));
    }
  }

  // پوولی جۆکەری ساختە
  {
    const { canvas, ctx } = createTileCanvas('#a855f7', 4.5);
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🃏', W / 2, H * 0.42);
    ctx.fillStyle = '#6b21a8';
    ctx.font = '900 22px Vazirmatn, sans-serif';
    ctx.fillText('ساختە', W / 2, H * 0.74);
    tileTextureCache.set('tile_false_joker', PIXI.Texture.from(canvas));
  }

  // پشتی پوولی سووری شاهانە (OKAY)
  {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    drawRoundedRectPath(ctx, 4, 10, W - 8, H - 12, R);
    ctx.fillStyle = '#3b0707';
    ctx.fill();

    drawRoundedRectPath(ctx, 4, 3, W - 8, H - 14, R);
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(0.5, '#991b1b');
    grad.addColorStop(1, '#650a0a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    drawRoundedRectPath(ctx, 14, 13, W - 28, H - 34, R - 8);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
    ctx.stroke();

    ctx.save();
    ctx.translate(W / 2, H / 2 - 4);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#fde047';
    ctx.font = '900 32px Georgia, serif';
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
// ٤. یاساکانی ١٠٦ پوول و پشکنینی سێتەکان
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
    const badge = document.getElementById('validTilesCounter');
    if (badge) badge.textContent = `${validCount} / 14`;
  }

  return {
    validCount,
    totalTilesCount,
    canWin14: totalTilesCount === 14 && validCount === 14
  };
}

// ============================================================================
// ٥. سیستمی زیرەکی قەبارە و پڕکردنەوەی تەواوی شاشەی مۆبایل و کۆمپیوتەر
// ============================================================================
function updateViewportAndLayout() {
  if (!pixiApp) return;
  const screenW = Math.max(320, window.innerWidth);
  const screenH = Math.max(240, window.innerHeight);
  pixiApp.renderer.resize(screenW, screenH);

  const aspect = screenW / screenH;

  // لەسەر مۆبایلی درێژ (Landscape) پانیی گۆڕەپانەکە فراوان دەبێت تا تەواوی شاشەکە پڕ بکاتەوە
  if (aspect >= 1240 / 720) {
    layout.h = 720;
    layout.w = Math.min(1680, Math.round(720 * aspect));
  } else {
    layout.w = 1240;
    layout.h = Math.min(1380, Math.round(1240 / Math.max(0.55, aspect)));
  }

  const scale = Math.min(screenW / layout.w, screenH / layout.h);
  pixiApp.stage.scale.set(scale);
  pixiApp.stage.x = Math.round((screenW - layout.w * scale) / 2);
  pixiApp.stage.y = Math.round((screenH - layout.h * scale) / 2);

  const w = layout.w;
  const h = layout.h;

  layout.tileW = 50;
  layout.tileH = 70;
  layout.slotW = 54;

  layout.rackW = RACK_COLS * layout.slotW + 28;
  layout.rackH = layout.tileH * 2 + 28;
  layout.rackX = Math.round((w - layout.rackW) / 2);
  layout.rackY = h - layout.rackH - 12;

  layout.centerY = Math.round((layout.rackY + 85) * 0.48);

  const cSpread = 92;
  layout.finishPos = { x: Math.round(w / 2 - cSpread), y: layout.centerY };
  layout.indicatorPos = { x: Math.round(w / 2), y: layout.centerY };
  layout.deckPos = { x: Math.round(w / 2 + cSpread), y: layout.centerY };

  const sideMargin = Math.max(105, Math.round(w * 0.085));
  layout.botPositions = [
    { x: sideMargin, y: layout.centerY },
    { x: Math.round(w / 2 - 55), y: 92 },
    { x: w - sideMargin, y: layout.centerY }
  ];

  const discardY = Math.round(layout.rackY - layout.tileH * 0.72);
  layout.leftDiscardPos = { x: layout.rackX + 46, y: discardY };
  layout.rightDiscardPos = { x: layout.rackX + layout.rackW - 46, y: discardY };

  layout.botDiscardPositions = [
    { x: sideMargin + 135, y: layout.centerY },
    { x: Math.round(w / 2 + 88), y: 92 },
    layout.rightDiscardPos
  ];

  layout.slotCoords = [];
  const startX = layout.rackX + 14 + layout.slotW / 2;
  const rowY0 = layout.rackY + 10 + layout.tileH / 2;
  const rowY1 = layout.rackY + 18 + layout.tileH * 1.5;

  for (let r = 0; r < RACK_ROWS; r++) {
    for (let c = 0; c < RACK_COLS; c++) {
      layout.slotCoords.push({
        idx: r * RACK_COLS + c,
        cx: Math.round(startX + c * layout.slotW),
        cy: Math.round(r === 0 ? rowY0 : rowY1)
      });
    }
  }
}

// گۆڕینی خاڵی شاشەی مۆبایل بۆ خاڵی دروستی ناو گۆڕەپانی PixiJS
function getStagePointerPos(globalPos) {
  return pixiApp.stage.toLocal(globalPos);
}

// ============================================================================
// ٦. کێشانی مێز و تەختە دارینە ٣ ڕەهەندییەکە
// ============================================================================
function renderFullScene(animateDeal = false, animateSlide = false) {
  if (!pixiApp) return;
  updateViewportAndLayout();

  tableLayer.removeChildren();
  rackBgLayer.removeChildren();

  const { w, tileW, tileH } = layout;

  // ١. کێشانی کارتی پڕۆفایلی ٣ بۆتەکان (بە دیزاینی ڕێک و بێ تێکەڵبوونی نووسین)
  okeyState.bots.forEach((bot, idx) => {
    const pos = layout.botPositions[idx];
    const isActive = okeyState.turn === idx + 1;
    const card = new PIXI.Container();
    card.position.set(pos.x, pos.y);

    const bw = 154;
    const bh = 50;
    const g = new PIXI.Graphics();

    // سێبەری کارت
    g.beginFill(0x000000, 0.45);
    g.drawRoundedRect(-bw / 2 + 2, -bh / 2 + 3, bw, bh, 15);
    g.endFill();

    // ناوەوەی کارت
    g.beginFill(0x110726, 0.92);
    g.lineStyle(isActive ? 2.8 : 1.4, isActive ? 0x22c55e : 0xfacc15, isActive ? 1 : 0.65);
    g.drawRoundedRect(-bw / 2, -bh / 2, bw, bh, 15);
    g.endFill();

    // بازنەی ئاڤاتار لە لای ڕاستی کارتەکە
    const avX = bw / 2 - 24;
    g.beginFill(0x4c1d95, 1);
    g.lineStyle(1.6, 0xfacc15, 1);
    g.drawCircle(avX, 0, 16);
    g.endFill();

    // باجی ژمارەی پوولەکانی بۆت
    g.beginFill(0xe11d48, 1);
    g.lineStyle(1.2, 0xffffff, 0.9);
    g.drawCircle(avX + 11, -14, 9.5);
    g.endFill();
    card.addChild(g);

    const avIcon = new PIXI.Text('👤', { fontSize: 15 });
    avIcon.anchor.set(0.5);
    avIcon.position.set(avX, 0);

    const countTxt = new PIXI.Text(String(bot.tiles.length), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 9.5,
      fontWeight: '900',
      fill: '#ffffff'
    });
    countTxt.anchor.set(0.5);
    countTxt.position.set(avX + 11, -14);

    const nameTxt = new PIXI.Text(bot.name, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 11.5,
      fontWeight: '800',
      fill: '#ffffff'
    });
    nameTxt.anchor.set(1, 0.5);
    nameTxt.position.set(avX - 22, -8);

    const rankTxt = new PIXI.Text(`${bot.rank} • ${bot.elo}`, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 9.5,
      fontWeight: '700',
      fill: '#fde047'
    });
    rankTxt.anchor.set(1, 0.5);
    rankTxt.position.set(avX - 22, 9);

    card.addChild(avIcon, countTxt, nameTxt, rankTxt);
    tableLayer.addChild(card);
  });

  // ٢. سندووقی ناوەڕاستی مێز (کۆنکان + ئۆکەی + کۆمەڵە پوول بە شێوەی ٣ ڕەهەندی)
  const cBoxW = 285;
  const cBoxH = tileH + 40;
  const centerPanel = new PIXI.Graphics();

  centerPanel.beginFill(0x000000, 0.5);
  centerPanel.drawRoundedRect(w / 2 - cBoxW / 2 + 3, layout.centerY - cBoxH / 2 + 4, cBoxW, cBoxH, 20);
  centerPanel.endFill();

  centerPanel.beginFill(0x0b041c, 0.9);
  centerPanel.lineStyle(2, 0xfacc15, 0.8);
  centerPanel.drawRoundedRect(w / 2 - cBoxW / 2, layout.centerY - cBoxH / 2, cBoxW, cBoxH, 20);
  centerPanel.endFill();

  // خانەی کۆنکان لە لای چەپ
  centerPanel.beginFill(0x2e1065, 0.72);
  centerPanel.lineStyle(2, okeyState.isAllValidToWin ? 0x22c55e : 0xa855f7, 0.95);
  centerPanel.drawRoundedRect(layout.finishPos.x - tileW / 2 - 3, layout.finishPos.y - tileH / 2 - 3, tileW + 6, tileH + 6, 10);
  centerPanel.endFill();
  tableLayer.addChild(centerPanel);

  const konkanLbl = new PIXI.Text('کۆنکان', {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 10.5,
    fontWeight: '800',
    fill: okeyState.isAllValidToWin ? '#4ade80' : '#fde047'
  });
  konkanLbl.anchor.set(0.5);
  konkanLbl.position.set(layout.finishPos.x, layout.finishPos.y - tileH / 2 - 11);

  const crownIcon = new PIXI.Text('👑', { fontSize: 21 });
  crownIcon.anchor.set(0.5);
  crownIcon.alpha = okeyState.isAllValidToWin ? 1 : 0.6;
  crownIcon.position.set(layout.finishPos.x, layout.finishPos.y);
  tableLayer.addChild(konkanLbl, crownIcon);

  // کلیک لە خانەی کۆنکان ئەگەر پوولێک هەڵبژێردرابێت
  const finishHit = new PIXI.Graphics();
  finishHit.beginFill(0xffffff, 0.001);
  finishHit.drawRect(layout.finishPos.x - tileW / 2 - 6, layout.finishPos.y - tileH / 2 - 6, tileW + 12, tileH + 12);
  finishHit.endFill();
  finishHit.eventMode = 'static';
  finishHit.cursor = 'pointer';
  finishHit.on('pointertap', () => {
    if (selectedSlotIdx !== -1) {
      const from = selectedSlotIdx;
      selectedSlotIdx = -1;
      okeyPlayerDiscardTile(from, true);
    }
  });
  tableLayer.addChild(finishHit);

  // پوولی پیشاندەر لە ناوەڕاست
  if (okeyState.indicatorTile) {
    const indSprite = new PIXI.Sprite(tileTextureCache.get(`tile_${okeyState.indicatorTile.color}_${okeyState.indicatorTile.number}`));
    indSprite.anchor.set(0.5);
    indSprite.width = tileW;
    indSprite.height = tileH;
    indSprite.position.set(layout.indicatorPos.x, layout.indicatorPos.y);

    const jokerLbl = new PIXI.Text(`ئۆکەی: ${okeyState.jokerRule.number}`, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 10.5,
      fontWeight: '900',
      fill: '#fef08a'
    });
    jokerLbl.anchor.set(0.5);
    jokerLbl.position.set(layout.indicatorPos.x, layout.indicatorPos.y + tileH / 2 + 11);
    tableLayer.addChild(indSprite, jokerLbl);
  }

  // کۆمەڵە پوولی ڕاکێشان بە شێوەی ٣ ڕەهەندی (چەند پوولێک لەسەر یەک)
  const stackCount = Math.min(3, Math.ceil(okeyState.deck.length / 15));
  for (let s = stackCount; s >= 1; s--) {
    const under = new PIXI.Sprite(getTileTex(null));
    under.anchor.set(0.5);
    under.width = tileW;
    under.height = tileH;
    under.tint = 0xcccccc;
    under.position.set(layout.deckPos.x + s * 2, layout.deckPos.y + s * 2.5);
    tableLayer.addChild(under);
  }

  const deckSprite = new PIXI.Sprite(getTileTex(null));
  deckSprite.anchor.set(0.5);
  deckSprite.width = tileW;
  deckSprite.height = tileH;
  deckSprite.position.set(layout.deckPos.x, layout.deckPos.y);
  deckSprite.eventMode = 'static';
  deckSprite.cursor = 'pointer';
  deckSprite.on('pointertap', () => okeyPlayerDrawFromDeck());

  const deckBadge = new PIXI.Graphics();
  deckBadge.beginFill(0xffffff, 1);
  deckBadge.lineStyle(1.5, 0xfacc15, 1);
  deckBadge.drawCircle(layout.deckPos.x + tileW * 0.44, layout.deckPos.y - tileH * 0.44, 12);
  deckBadge.endFill();

  const deckCountTxt = new PIXI.Text(String(okeyState.deck.length), {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 10.5,
    fontWeight: '900',
    fill: '#0f172a'
  });
  deckCountTxt.anchor.set(0.5);
  deckCountTxt.position.set(layout.deckPos.x + tileW * 0.44, layout.deckPos.y - tileH * 0.44);
  tableLayer.addChild(deckSprite, deckBadge, deckCountTxt);

  // ٣. چوار خانەی فڕێدانی پوول
  const dW = Math.round(tileW * 0.9);
  const dH = Math.round(tileH * 0.9);
  drawDiscardPile(layout.leftDiscardPos.x, layout.leftDiscardPos.y, dW, dH, okeyState.myDiscards, 'فڕێدان', false, true);
  drawDiscardPile(layout.botDiscardPositions[0].x, layout.botDiscardPositions[0].y, dW * 0.9, dH * 0.9, okeyState.bots[0].discards, '', false, false);
  drawDiscardPile(layout.botDiscardPositions[1].x, layout.botDiscardPositions[1].y, dW * 0.9, dH * 0.9, okeyState.bots[1].discards, '', false, false);

  const canPickRight = okeyState.turn === 0 && okeyState.phase === 'draw' && okeyState.bots[2].discards.length > 0;
  drawDiscardPile(layout.rightDiscardPos.x, layout.rightDiscardPos.y, dW, dH, okeyState.bots[2].discards, 'هەڵگرتنەوە', canPickRight, false);

  // ٤. تەختە دارینە دوو-ڕیزییە شاهانەکە (بەبێ هێڵی زەردی ناو خانە بەتاڵەکان)
  const rackGfx = new PIXI.Graphics();

  // سێبەری ژێر تەختە
  rackGfx.beginFill(0x000000, 0.68);
  rackGfx.drawRoundedRect(layout.rackX + 4, layout.rackY + 7, layout.rackW, layout.rackH, 18);
  rackGfx.endFill();

  // لێواری ٣ ڕەهەندیی خوارەوەی تەختە
  rackGfx.beginFill(0x290f04, 1);
  rackGfx.drawRoundedRect(layout.rackX, layout.rackY + 4, layout.rackW, layout.rackH, 18);
  rackGfx.endFill();

  // ڕووی دارینی تەختەکە
  rackGfx.beginFill(0x4e220d, 1);
  rackGfx.lineStyle(2.8, 0xfacc15, 0.9);
  rackGfx.drawRoundedRect(layout.rackX, layout.rackY, layout.rackW, layout.rackH, 18);
  rackGfx.endFill();

  // هێڵی جیاکەرەوەی نێوان ڕیزی سەرەوە و خوارەوە
  rackGfx.lineStyle(0);
  rackGfx.beginFill(0x210c03, 0.95);
  rackGfx.drawRect(layout.rackX + 12, layout.rackY + layout.rackH / 2 - 2, layout.rackW - 24, 4);
  rackGfx.endFill();

  // ٢٨ خانە قووڵەکەی ناو تەختەکە (بە لێواری قاوەیی تۆخی نەرم نەک زەرد!)
  for (const s of layout.slotCoords) {
    const isSel = s.idx === selectedSlotIdx;
    rackGfx.lineStyle(isSel ? 2 : 1, isSel ? 0xfacc15 : 0x2b1105, isSel ? 0.95 : 0.7);
    rackGfx.beginFill(0x180903, 0.72);
    rackGfx.drawRoundedRect(s.cx - tileW / 2, s.cy - tileH / 2, tileW, tileH, 8);
    rackGfx.endFill();
  }
  rackBgLayer.addChild(rackGfx);

  // ٥. هاوتاکردنی پوولەکانی ناو تەختە
  syncPlayerRackSprites(animateDeal, animateSlide);
}

function drawDiscardPile(x, y, w, h, pile, label, clickablePickup, isMyLeftDiscard) {
  const g = new PIXI.Graphics();
  g.beginFill(0x120924, 0.65);
  g.lineStyle(1.8, clickablePickup ? 0x22c55e : 0xfacc15, clickablePickup ? 1 : 0.55);
  g.drawRoundedRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, 10);
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
      fontSize: 10,
      fontWeight: '800',
      fill: clickablePickup ? '#4ade80' : '#fde047'
    });
    lbl.anchor.set(0.5);
    lbl.position.set(x, y - h / 2 - 11);
    tableLayer.addChild(lbl);
  }

  if (pile && pile.length > 0) {
    // ئەگەر زیاتر لە پوولێک فڕێدرابوو، پوولی ژێرەوەش بە تۆزێک لاری پیشان بدە
    if (pile.length > 1) {
      const prevTile = pile[pile.length - 2];
      const underSp = new PIXI.Sprite(getTileTex(prevTile));
      underSp.anchor.set(0.5);
      underSp.width = w;
      underSp.height = h;
      underSp.tint = 0xdddddd;
      underSp.rotation = -0.08;
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
// ٧. ڕاکێشان و جووڵاندنی ١٢٠ فریم لەسەر مۆبایل و کۆمپیوتەر
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
    } else {
      sprite.texture = getTileTex(tile);
      sprite.width = tileW;
      sprite.height = tileH;
    }

    sprite.slotIdx = idx;
    const isSelected = (idx === selectedSlotIdx);
    const targetY = isSelected ? slot.cy - 12 : slot.cy;

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
        duration: 125
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

  // کێشانی چوارچێوەی سەوزی بریسکەدار لە دەوری سێتە دروستەکان
  bracketsLayer.removeChildren();
  const frame = new PIXI.Graphics();
  for (const b of okeyState.validGroupsBounds) {
    const first = layout.slotCoords[b.row * RACK_COLS + b.startCol];
    const last = layout.slotCoords[b.row * RACK_COLS + b.endCol];
    if (first && last) {
      const bw = (last.cx - first.cx) + tileW + 6;
      const bh = tileH + 6;
      frame.lineStyle(3.2, 0x10b981, 1);
      frame.beginFill(0x10b981, 0.08);
      frame.drawRoundedRect(first.cx - tileW / 2 - 3, first.cy - tileH / 2 - 3, bw, bh, 10);
      frame.endFill();
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
    // دووجار کلیک لەسەریەک بۆ فڕێدانی خێرا
    if (now - lastTapTime < 300 && okeyState.turn === 0 && okeyState.phase === 'play') {
      selectedSlotIdx = -1;
      okeyPlayerDiscardTile(sprite.slotIdx, false);
      return;
    }
    lastTapTime = now;

    const stagePos = getStagePointerPos(e.global);
    dragContext.active = true;
    dragContext.sprite = sprite;
    dragContext.fromSlotIdx = sprite.slotIdx;
    dragContext.startX = sprite.x;
    dragContext.startY = sprite.y;
    dragContext.pointerStartX = stagePos.x;
    dragContext.pointerStartY = stagePos.y;
    dragContext.hasMoved = false;
    dragContext.isTouch = (e.pointerType === 'touch');

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
    const dx = pos.x - dragContext.pointerStartX;
    const dy = pos.y - dragContext.pointerStartY;

    if (!dragContext.hasMoved && Math.hypot(dx, dy) > 6) {
      dragContext.hasMoved = true;
      selectedSlotIdx = -1;
    }

    if (dragContext.hasMoved) {
      // لەسەر مۆبایل پوولەکە تۆزێک بەرزتر لە پەنجە دەڕوات تا بە پەنجەت نەشاردرێتەوە
      const touchLift = dragContext.isTouch ? -16 : 0;
      dragContext.sprite.position.set(pos.x, pos.y + touchLift);
    }
  });

  const finishPointerDrag = (e) => {
    if (!dragContext.active || !dragContext.sprite) return;
    const sp = dragContext.sprite;
    const fromIdx = dragContext.fromSlotIdx;
    const moved = dragContext.hasMoved;

    dragContext.active = false;
    dragContext.sprite = null;

    sp.width = layout.tileW;
    sp.height = layout.tileH;
    tilesLayer.addChild(sp);

    if (!moved) {
      // ئەگەر تەنها یەک کلیک کرا لەسەر پوولەکە (Tap-to-Select)
      if (selectedSlotIdx === -1) {
        selectedSlotIdx = fromIdx;
        playOkeyTileSound('select');
      } else if (selectedSlotIdx === fromIdx) {
        selectedSlotIdx = -1;
      } else {
        // جێگۆڕکێی نێوان دوو پوول بە کلیک
        swapOrMoveRackSlot(selectedSlotIdx, fromIdx);
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

  // کلیککردن لە خانە بەتاڵەکانی تەختەکە بۆ گواستنەوەی پوولی هەڵبژێردراو
  pixiApp.stage.on('pointerdown', (e) => {
    if (okeyState.isAnimating || dragContext.active || selectedSlotIdx === -1) return;
    const pos = getStagePointerPos(e.global);

    let bestSlot = null;
    let minDist = Infinity;
    for (const s of layout.slotCoords) {
      const d = Math.hypot(pos.x - s.cx, pos.y - s.cy);
      if (d < minDist && d < layout.slotW * 0.9) {
        minDist = d;
        bestSlot = s;
      }
    }

    if (bestSlot && bestSlot.idx !== selectedSlotIdx) {
      swapOrMoveRackSlot(selectedSlotIdx, bestSlot.idx);
      selectedSlotIdx = -1;
      renderFullScene(false, true);
    }
  });
}

function swapOrMoveRackSlot(fromIdx, toIdx) {
  const movingTile = okeyState.rackSlots[fromIdx];
  const existingTile = okeyState.rackSlots[toIdx];
  okeyState.rackSlots[toIdx] = movingTile;
  okeyState.rackSlots[fromIdx] = existingTile;
  playOkeyTileSound('clack');
  evaluatePlayerRack();
}

function handleTileDrop(fromSlotIdx, dropX, dropY) {
  // ١. پشکنینی فڕێدان بۆ خانەی کۆنکان لە ناوەڕاست
  const distFinish = Math.hypot(dropX - layout.finishPos.x, dropY - layout.finishPos.y);
  if (distFinish < layout.tileH * 1.1) {
    if (okeyPlayerDiscardTile(fromSlotIdx, true)) return;
  }

  // ٢. پشکنینی فڕێدان بۆ خانەی فڕێدانی لای چەپ
  const distLeftDiscard = Math.hypot(dropX - layout.leftDiscardPos.x, dropY - layout.leftDiscardPos.y);
  if (distLeftDiscard < layout.tileH * 1.35) {
    if (okeyPlayerDiscardTile(fromSlotIdx, false)) return;
  }

  // ٣. جێگۆڕکێ یان گواستنەوە لەناو ٢٨ خانەکەی تەختەکەدا
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
    swapOrMoveRackSlot(fromSlotIdx, bestSlot.idx);
  }

  syncPlayerRackSprites(false, true);
}

// ============================================================================
// ٨. ئەنیمەیشنەکانی تەقڵەلێدان و فڕینی پوول بە 120FPS
// ============================================================================
function animateSomersaultThrow(tile, fromX, fromY, toX, toY, onComplete) {
  const sp = new PIXI.Sprite(getTileTex(tile));
  sp.anchor.set(0.5);
  sp.width = layout.tileW;
  sp.height = layout.tileH;
  sp.position.set(fromX, fromY);
  fxLayer.addChild(sp);

  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 60;

  addPixiTween({
    target: sp,
    from: { x: fromX, y: fromY, width: layout.tileW, height: layout.tileH, rotation: 0 },
    to: { x: midX, y: midY, width: layout.tileW * 0.14, height: layout.tileH * 1.2, rotation: Math.PI },
    duration: 115,
    onComplete: () => {
      addPixiTween({
        target: sp,
        from: { x: midX, y: midY, width: layout.tileW * 0.14, height: layout.tileH * 1.2, rotation: Math.PI },
        to: { x: toX, y: toY, width: layout.tileW * 0.9, height: layout.tileH * 0.9, rotation: Math.PI * 2 },
        duration: 120,
        onComplete: () => {
          sp.destroy();
          spawnImpactGlow(toX, toY, 0xfacc15);
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
  const midY = (fromY + targetSlot.cy) / 2 - 45;

  addPixiTween({
    target: sp,
    from: { x: fromX, y: fromY, width: layout.tileW },
    to: { x: midX, y: midY, width: 4 },
    duration: 105,
    onComplete: () => {
      sp.texture = getTileTex(tile);
      addPixiTween({
        target: sp,
        from: { x: midX, y: midY, width: 4 },
        to: { x: targetSlot.cx, y: targetSlot.cy, width: layout.tileW },
        duration: 115,
        onComplete: () => {
          sp.destroy();
          spawnImpactGlow(targetSlot.cx, targetSlot.cy, 0x10b981);
          if (onComplete) onComplete();
        }
      });
    }
  });
}

function animateBotDrawSwoop(fromX, fromY, toX, toY, onComplete) {
  const sp = new PIXI.Sprite(getTileTex(null));
  sp.anchor.set(0.5);
  sp.width = layout.tileW * 0.85;
  sp.height = layout.tileH * 0.85;
  sp.position.set(fromX, fromY);
  fxLayer.addChild(sp);

  addPixiTween({
    target: sp,
    from: { x: fromX, y: fromY, rotation: 0, alpha: 1 },
    to: { x: toX, y: toY, rotation: Math.PI, alpha: 0.65 },
    duration: 145,
    onComplete: () => {
      sp.destroy();
      if (onComplete) onComplete();
    }
  });
}

// ============================================================================
// ٩. بەڕێوەبردنی گەڕەکانی یاری و بۆتەکان
// ============================================================================
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
  updateTurnBannerUI();
  playOkeyTileSound('whoosh');
  renderFullScene(true, false);
}

function updateTurnBannerUI(customMsg = null) {
  const el = document.getElementById('turnBanner');
  if (!el) return;
  if (customMsg) {
    el.textContent = customMsg;
    return;
  }
  if (okeyState.turn === 0) {
    el.textContent = okeyState.phase === 'draw'
      ? '🟢 نۆرەی تۆیە: پوولێک لە ناوەڕاست یان لای ڕاست ڕابکێشە'
      : '🟡 نۆرەی تۆیە: پوولێک فڕێ بدە بۆ چەپ (یان دووجار پەنجەی پێدا بنێ)';
  } else {
    const bot = okeyState.bots[okeyState.turn - 1];
    el.textContent = `⏳ نۆرەی ${bot.name}ـە...`;
  }
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
    updateTurnBannerUI();
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
    updateTurnBannerUI();
    renderFullScene(false, false);
  });
}

function okeyPlayerDiscardTile(slotIdx, isFinishingDrop = false) {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'play') return false;
  const tile = okeyState.rackSlots[slotIdx];
  if (!tile) return false;

  const checkWithoutThis = evaluatePlayerRack(tile.uid);
  if (isFinishingDrop) {
    if (!checkWithoutThis.canWin14) {
      updateTurnBannerUI('⚠️ هێشتا ١٤ پوولەکەت نەبوونەتە سێت! بیخەرە خانەی فڕێدانی لای چەپ');
      return false;
    }
    okeyState.rackSlots[slotIdx] = null;
    okeyState.winner = 'player';
    playOkeyTileSound('win');
    renderFullScene(false, false);
    showOkeyWinModal(true, 'پیرۆزە! هەموو ١٤ پوولەکەت کردە سێتی دروست و بە کۆنکان یارییەکەت بردەوە!');
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
      updateTurnBannerUI();
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
            updateTurnBannerUI();
            renderFullScene(false, false);
            setTimeout(runNextBotTurn, 190);
          } else {
            okeyState.turn = 0;
            okeyState.phase = 'draw';
            updateTurnBannerUI();
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

  tableLayer = new PIXI.Container();
  rackBgLayer = new PIXI.Container();
  bracketsLayer = new PIXI.Container();
  tilesLayer = new PIXI.Container();
  fxLayer = new PIXI.Container();

  pixiApp.stage.addChild(tableLayer, rackBgLayer, bracketsLayer, tilesLayer, fxLayer);

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
    updateAllPixiTweens(pixiApp.ticker.deltaMS);
  });

  okeyStartNewRound();
});