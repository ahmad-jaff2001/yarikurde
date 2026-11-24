// ============================================================================
// YARI KURDI - PIXI.JS v7 ULTRA-SMOOTH 120FPS ROYAL OKEY ENGINE
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

// پێکهاتەی چینەکانی PixiJS
let tableLayer = null;
let rackBgLayer = null;
let bracketsLayer = null;
let tilesLayer = null;
let fxLayer = null;

// تێکسچەری پێشوەختە ئامادەکراوی GPU بۆ هەموو پوولەکان
const tileTextureCache = new Map();
const activeTweens = [];

// قەبارە و شوێنی داینامیکی کە خۆکارانە لەگەڵ هەموو شاشەیەک دەگونجێت
let layout = {
  w: 1280,
  h: 720,
  tileW: 48,
  tileH: 66,
  slotW: 52,
  rackX: 100,
  rackY: 500,
  rackW: 800,
  rackH: 165,
  centerY: 255,
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
// ١. سیستمی دەنگیی خێرا (Zero-Latency Web Audio)
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
      osc.frequency.setValueAtTime(590, now);
      osc.frequency.exponentialRampToValueAtTime(145, now + 0.045);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(270, now);
      osc.frequency.exponentialRampToValueAtTime(690, now + 0.065);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.start(now);
      osc.stop(now + 0.07);
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
// ٢. سیستمی ئەنیمەیشنی نەرم بە خێرایی 120FPS لەگەڵ Pixi Ticker
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

// ============================================================================
// ٣. دروستکردنی تێکسچەری کوالێتی بەرزی پوولەکان لەسەر GPU
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
  const W = 136;
  const H = 190;
  const R = 24;

  const createTileCanvas = (borderCol = '#e5dccb', borderW = 3.5) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // سێبەری ژێرەوە و قووڵایی ٣ ڕەهەندی
    drawRoundedRectPath(ctx, 4, 10, W - 8, H - 12, R);
    ctx.fillStyle = '#c8bca4';
    ctx.fill();

    // ڕووی عاجیی سەرەوەی پوول
    drawRoundedRectPath(ctx, 4, 4, W - 8, H - 15, R);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f7f2e7');
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
      const key = `tile_${color}_${num}`;
      const { canvas, ctx } = createTileCanvas();

      // ژمارەی سەر پوولەکە
      ctx.fillStyle = hex;
      ctx.font = '900 72px "Arial Black", Vazirmatn, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), W / 2, H * 0.36);

      // چاڵە ڕەنگدارەکەی خوارەوەی پوول
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.72, 14, 0, Math.PI * 2);
      ctx.fillStyle = hex;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.16)';
      ctx.stroke();

      tileTextureCache.set(key, PIXI.Texture.from(canvas));
    }
  }

  // پوولی جۆکەری ساختە
  {
    const { canvas, ctx } = createTileCanvas('#f59e0b', 5);
    ctx.font = '68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', W / 2, H * 0.46);
    tileTextureCache.set('tile_false_joker', PIXI.Texture.from(canvas));
  }

  // پشتی پوولی سووری شاهانە (OKAY)
  {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    drawRoundedRectPath(ctx, 4, 8, W - 8, H - 10, R);
    ctx.fillStyle = '#450a0a';
    ctx.fill();

    drawRoundedRectPath(ctx, 4, 4, W - 8, H - 12, R);
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#facc15';
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
    const badge = document.getElementById('validTilesCounter');
    if (badge) badge.textContent = `${validCount} / 14`;
  }

  return {
    validCount,
    totalTilesCount,
    canWin14: totalTilesCount === 14 && validCount === 14
  };
}

function computeResponsiveLayout() {
  // جێگیرکردنی شاشە بۆ 1280x720 تا لەسەر هیچ مۆبایلێک تێک نەچێت
  const w = 1280;
  const h = 720;
  layout.w = w;
  layout.h = h;

  layout.tileW = 46;
  layout.tileH = 64;
  layout.slotW = 50;

  layout.rackW = RACK_COLS * layout.slotW + 24;
  layout.rackH = layout.tileH * 2 + 24;
  layout.rackX = Math.round((w - layout.rackW) / 2);
  layout.rackY = h - layout.rackH - 10;

  layout.centerY = 260;

  const cSpread = 85;
  layout.finishPos = { x: Math.round(w / 2 - cSpread), y: layout.centerY };
  layout.indicatorPos = { x: Math.round(w / 2), y: layout.centerY };
  layout.deckPos = { x: Math.round(w / 2 + cSpread), y: layout.centerY };

  layout.botPositions = [
    { x: 100, y: layout.centerY },
    { x: w / 2 - 45, y: 90 },
    { x: w - 100, y: layout.centerY }
  ];

  const discardY = layout.rackY - layout.tileH * 0.75;
  layout.leftDiscardPos = { x: layout.rackX + 44, y: discardY };
  layout.rightDiscardPos = { x: layout.rackX + layout.rackW - 44, y: discardY };

  layout.botDiscardPositions = [
    { x: 240, y: layout.centerY },
    { x: w / 2 + 78, y: 90 },
    layout.rightDiscardPos
  ];

  layout.slotCoords = [];
  const startX = layout.rackX + 12 + layout.slotW / 2;
  const rowY0 = layout.rackY + 9 + layout.tileH / 2;
  const rowY1 = layout.rackY + 15 + layout.tileH * 1.5;

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

// ============================================================================
// ٦. کێشانی مێز و تەختە و پوولەکان لە PixiJS
// ============================================================================
const rackSpritesMap = new Map();

function renderFullScene(animateDeal = false, animateSlide = false) {
  if (!pixiApp) return;
  computeResponsiveLayout();

  tableLayer.removeChildren();
  rackBgLayer.removeChildren();

  const { w, h, tileW, tileH } = layout;

  // ١. کێشانی پڕۆفایلی ٣ بۆتەکان
  okeyState.bots.forEach((bot, idx) => {
    const pos = layout.botPositions[idx];
    const isActive = okeyState.turn === idx + 1;
    const card = new PIXI.Container();
    card.position.set(pos.x, pos.y);

    const bw = 136;
    const bh = 44;
    const g = new PIXI.Graphics();
    g.beginFill(0x100724, 0.9);
    g.lineStyle(isActive ? 2.5 : 1.3, isActive ? 0x22c55e : 0xfacc15, isActive ? 1 : 0.6);
    g.drawRoundedRect(-bw / 2, -bh / 2, bw, bh, 13);
    g.endFill();

    g.beginFill(0x4c1d95, 1);
    g.lineStyle(1.5, 0xfacc15, 1);
    g.drawCircle(bw / 2 - 21, 0, 14);
    g.endFill();

    // ژمارەی پوولەکانی دەستی بۆت
    g.beginFill(0xdc2626, 1);
    g.lineStyle(0);
    g.drawCircle(bw / 2 - 9, -13, 8.5);
    g.endFill();
    card.addChild(g);

    const countTxt = new PIXI.Text(String(bot.tiles.length), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 9,
      fontWeight: '900',
      fill: '#ffffff'
    });
    countTxt.anchor.set(0.5);
    countTxt.position.set(bw / 2 - 9, -13);

    const nameTxt = new PIXI.Text(bot.name, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 11,
      fontWeight: '800',
      fill: '#ffffff'
    });
    nameTxt.anchor.set(1, 0.5);
    nameTxt.position.set(bw / 2 - 40, -7);

    const rankTxt = new PIXI.Text(`${bot.rank} • ${bot.elo}`, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 9,
      fontWeight: '700',
      fill: '#fde047'
    });
    rankTxt.anchor.set(1, 0.5);
    rankTxt.position.set(bw / 2 - 40, 8);

    card.addChild(countTxt, nameTxt, rankTxt);
    tableLayer.addChild(card);
  });

  // ٢. سندووقی ناوەڕاستی مێز (کۆنکان + ئۆکەی + کۆمەڵە پوول)
  const cBoxW = tileW * 5.1;
  const cBoxH = tileH + 34;
  const centerPanel = new PIXI.Graphics();
  centerPanel.beginFill(0x0b051a, 0.88);
  centerPanel.lineStyle(2, 0xfacc15, 0.75);
  centerPanel.drawRoundedRect(w / 2 - cBoxW / 2, layout.centerY - cBoxH / 2, cBoxW, cBoxH, 18);
  centerPanel.endFill();

  // خانەی کۆنکان لە لای چەپ
  centerPanel.beginFill(0x2e1065, 0.7);
  centerPanel.lineStyle(1.8, okeyState.isAllValidToWin ? 0x22c55e : 0xa855f7, 0.95);
  centerPanel.drawRoundedRect(layout.finishPos.x - tileW / 2 - 3, layout.finishPos.y - tileH / 2 - 3, tileW + 6, tileH + 6, 9);
  centerPanel.endFill();
  tableLayer.addChild(centerPanel);

  const konkanLbl = new PIXI.Text('کۆنکان', {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 10,
    fontWeight: '800',
    fill: '#fde047'
  });
  konkanLbl.anchor.set(0.5);
  konkanLbl.position.set(layout.finishPos.x, layout.finishPos.y - tileH / 2 - 10);

  const crownIcon = new PIXI.Text('👑', { fontSize: Math.round(tileW * 0.42) });
  crownIcon.anchor.set(0.5);
  crownIcon.alpha = 0.65;
  crownIcon.position.set(layout.finishPos.x, layout.finishPos.y);
  tableLayer.addChild(konkanLbl, crownIcon);

  // پوولی پیشاندەر لە ناوەڕاست
  if (okeyState.indicatorTile) {
    const indSprite = new PIXI.Sprite(getTileTex(okeyState.indicatorTile));
    indSprite.anchor.set(0.5);
    indSprite.width = tileW;
    indSprite.height = tileH;
    indSprite.position.set(layout.indicatorPos.x, layout.indicatorPos.y);

    const jokerLbl = new PIXI.Text(`ئۆکەی: ${okeyState.jokerRule.number}`, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 10,
      fontWeight: '800',
      fill: '#fef08a'
    });
    jokerLbl.anchor.set(0.5);
    jokerLbl.position.set(layout.indicatorPos.x, layout.indicatorPos.y + tileH / 2 + 10);
    tableLayer.addChild(indSprite, jokerLbl);
  }

  // کۆمەڵە پوولی ڕاکێشان لە لای ڕاست
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
  deckBadge.drawCircle(layout.deckPos.x + tileW * 0.42, layout.deckPos.y - tileH * 0.42, 11);
  deckBadge.endFill();

  const deckCountTxt = new PIXI.Text(String(okeyState.deck.length), {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 10,
    fontWeight: '900',
    fill: '#0f172a'
  });
  deckCountTxt.anchor.set(0.5);
  deckCountTxt.position.set(layout.deckPos.x + tileW * 0.42, layout.deckPos.y - tileH * 0.42);
  tableLayer.addChild(deckSprite, deckBadge, deckCountTxt);

  // ٣. چوار خانەی فڕێدانی پوول
  const dW = Math.round(tileW * 0.88);
  const dH = Math.round(tileH * 0.88);
  drawDiscardPile(layout.leftDiscardPos.x, layout.leftDiscardPos.y, dW, dH, okeyState.myDiscards, 'فڕێدان', false);
  drawDiscardPile(layout.botDiscardPositions[0].x, layout.botDiscardPositions[0].y, dW * 0.9, dH * 0.9, okeyState.bots[0].discards, '', false);
  drawDiscardPile(layout.botDiscardPositions[1].x, layout.botDiscardPositions[1].y, dW * 0.9, dH * 0.9, okeyState.bots[1].discards, '', false);

  const canPickRight = okeyState.turn === 0 && okeyState.phase === 'draw' && okeyState.bots[2].discards.length > 0;
  drawDiscardPile(layout.rightDiscardPos.x, layout.rightDiscardPos.y, dW, dH, okeyState.bots[2].discards, 'هەڵگرتنەوە', canPickRight);

  // ٤. تەختە دارینە دوو-ڕیزییەکە
  const rackGfx = new PIXI.Graphics();
  rackGfx.beginFill(0x000000, 0.65);
  rackGfx.drawRoundedRect(layout.rackX + 3, layout.rackY + 5, layout.rackW, layout.rackH, 16);
  rackGfx.endFill();

  rackGfx.beginFill(0x4a210d, 1);
  rackGfx.lineStyle(2.6, 0xfacc15, 0.88);
  rackGfx.drawRoundedRect(layout.rackX, layout.rackY, layout.rackW, layout.rackH, 16);
  rackGfx.endFill();

  rackGfx.beginFill(0x1a0903, 0.9);
  rackGfx.drawRect(layout.rackX + 10, layout.rackY + layout.rackH / 2 - 2, layout.rackW - 20, 4);
  rackGfx.endFill();

  for (const s of layout.slotCoords) {
    rackGfx.beginFill(0x140803, 0.68);
    rackGfx.drawRoundedRect(s.cx - tileW / 2, s.cy - tileH / 2, tileW, tileH, 7);
    rackGfx.endFill();
  }
  rackBgLayer.addChild(rackGfx);

  // ٥. هاوتاکردنی پوولەکانی ناو تەختە
  syncPlayerRackSprites(animateDeal, animateSlide);
}

function drawDiscardPile(x, y, w, h, pile, label, clickable) {
  const g = new PIXI.Graphics();
  g.beginFill(0x120924, 0.62);
  g.lineStyle(1.6, clickable ? 0x22c55e : 0xfacc15, clickable ? 1 : 0.5);
  g.drawRoundedRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, 9);
  g.endFill();
  tableLayer.addChild(g);

  if (label) {
    const lbl = new PIXI.Text(label, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 9,
      fontWeight: '800',
      fill: clickable ? '#4ade80' : '#fde047'
    });
    lbl.anchor.set(0.5);
    lbl.position.set(x, y - h / 2 - 10);
    tableLayer.addChild(lbl);
  }

  if (pile && pile.length > 0) {
    const topTile = pile[pile.length - 1];
    const sp = new PIXI.Sprite(getTileTex(topTile));
    sp.anchor.set(0.5);
    sp.width = w;
    sp.height = h;
    sp.position.set(x, y);
    if (clickable) {
      sp.eventMode = 'static';
      sp.cursor = 'pointer';
      sp.on('pointertap', () => okeyPlayerTakeRightDiscard());
    }
    tableLayer.addChild(sp);
  }
}

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

      setupTileDragAndDoubleTap(sprite);
      tilesLayer.addChild(sprite);
      rackSpritesMap.set(tile.uid, sprite);
    } else {
      sprite.texture = getTileTex(tile);
      sprite.width = tileW;
      sprite.height = tileH;
    }

    sprite.slotIdx = idx;

    if (animateDeal) {
      addPixiTween({
        target: sprite,
        from: { x: layout.deckPos.x, y: layout.deckPos.y },
        to: { x: slot.cx, y: slot.cy },
        duration: 210 + idx * 10
      });
    } else if (animateSlide) {
      addPixiTween({
        target: sprite,
        from: { x: sprite.x, y: sprite.y },
        to: { x: slot.cx, y: slot.cy },
        duration: 130
      });
    } else {
      sprite.position.set(slot.cx, slot.cy);
    }
  }

  for (const [uid, sp] of rackSpritesMap.entries()) {
    if (!activeUids.has(uid)) {
      sp.destroy();
      rackSpritesMap.delete(uid);
    }
  }

  // چوارچێوەی سەوزی دەوری سێتە دروستەکان
  bracketsLayer.removeChildren();
  const frame = new PIXI.Graphics();
  frame.lineStyle(2.8, 0x22c55e, 1);
  for (const b of okeyState.validGroupsBounds) {
    const first = layout.slotCoords[b.row * RACK_COLS + b.startCol];
    const last = layout.slotCoords[b.row * RACK_COLS + b.endCol];
    if (first && last) {
      const bw = (last.cx - first.cx) + tileW + 6;
      const bh = tileH + 6;
      frame.drawRoundedRect(first.cx - tileW / 2 - 3, first.cy - tileH / 2 - 3, bw, bh, 9);
    }
  }
  bracketsLayer.addChild(frame);
}

function setupTileDragAndDoubleTap(sprite) {
  let dragging = false;
  let lastTapTime = 0;

  sprite.on('pointerdown', (e) => {
    if (okeyState.isAnimating) return;

    const now = performance.now();
    if (now - lastTapTime < 280 && okeyState.turn === 0 && okeyState.phase === 'play') {
      okeyPlayerDiscardTile(sprite.slotIdx, false);
      return;
    }
    lastTapTime = now;

    dragging = true;
    playOkeyTileSound('clack');
    fxLayer.addChild(sprite);
    sprite.width = layout.tileW * 1.12;
    sprite.height = layout.tileH * 1.12;
    const pos = e.data.getLocalPosition(sprite.parent);
    sprite.position.set(pos.x, pos.y);
  });

  sprite.on('globalpointermove', (e) => {
    if (!dragging || okeyState.isAnimating) return;
    const pos = e.data.getLocalPosition(sprite.parent);
    sprite.position.set(pos.x, pos.y);
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    sprite.width = layout.tileW;
    sprite.height = layout.tileH;
    tilesLayer.addChild(sprite);
    handleTileDrop(sprite.slotIdx, sprite.x, sprite.y);
  };

  sprite.on('pointerup', endDrag);
  sprite.on('pointerupoutside', endDrag);
}
function handleTileDrop(fromSlotIdx, dropX, dropY) {
  // ١. پشکنینی فڕێدان بۆ خانەی کۆنکان لە ناوەڕاست
  const distFinish = Math.hypot(dropX - layout.finishPos.x, dropY - layout.finishPos.y);
  if (distFinish < layout.tileH * 0.95) {
    if (okeyPlayerDiscardTile(fromSlotIdx, true)) return;
  }

  // ٢. پشکنینی فڕێدان بۆ خانەی فڕێدانی لای چەپ
  const distLeftDiscard = Math.hypot(dropX - layout.leftDiscardPos.x, dropY - layout.leftDiscardPos.y);
  if (distLeftDiscard < layout.tileH * 1.15) {
    if (okeyPlayerDiscardTile(fromSlotIdx, false)) return;
  }

  // ٣. جێگۆڕکێ یان گواستنەوە لەناو ٢٨ خانەکەی تەختەکەدا
  let bestSlot = null;
  let minDist = Infinity;
  for (const s of layout.slotCoords) {
    const d = Math.hypot(dropX - s.cx, dropY - s.cy);
    if (d < minDist && d < layout.slotW * 1.15) {
      minDist = d;
      bestSlot = s;
    }
  }

  if (bestSlot && bestSlot.idx !== fromSlotIdx) {
    const movingTile = okeyState.rackSlots[fromSlotIdx];
    const existingTile = okeyState.rackSlots[bestSlot.idx];
    okeyState.rackSlots[bestSlot.idx] = movingTile;
    okeyState.rackSlots[fromSlotIdx] = existingTile;
    playOkeyTileSound('clack');
    evaluatePlayerRack();
  }

  syncPlayerRackSprites(false, true);
}

// ============================================================================
// ٧. ئەنیمەیشنەکانی تەقڵەلێدان و فڕینی پوول بە 120FPS (وەک ڤیدیۆکە)
// ============================================================================
function animateSomersaultThrow(tile, fromX, fromY, toX, toY, onComplete) {
  const sp = new PIXI.Sprite(getTileTex(tile));
  sp.anchor.set(0.5);
  sp.width = layout.tileW;
  sp.height = layout.tileH;
  sp.position.set(fromX, fromY);
  fxLayer.addChild(sp);

  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 55;

  // قۆناغی یەکەم: بەرزبوونەوە و تەقڵەلێدان
  addPixiTween({
    target: sp,
    from: { x: fromX, y: fromY, width: layout.tileW, height: layout.tileH, rotation: 0 },
    to: { x: midX, y: midY, width: layout.tileW * 0.14, height: layout.tileH * 1.18, rotation: Math.PI },
    duration: 115,
    onComplete: () => {
      // قۆناغی دووەم: تەواوکردنی تەقڵەکە و نیشتنەوە
      addPixiTween({
        target: sp,
        from: { x: midX, y: midY, width: layout.tileW * 0.14, height: layout.tileH * 1.18, rotation: Math.PI },
        to: { x: toX, y: toY, width: layout.tileW * 0.88, height: layout.tileH * 0.88, rotation: Math.PI * 2 },
        duration: 120,
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
  const midY = (fromY + targetSlot.cy) / 2 - 42;

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
    duration: 150,
    onComplete: () => {
      sp.destroy();
      if (onComplete) onComplete();
    }
  });
}

// ============================================================================
// ٨. بەڕێوەبردنی گەڕەکانی یاری و بۆتەکان
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
      ? '🟢 نۆرەی تۆیە: کلیک لە پوولی ناوەڕاست یان لای ڕاست بکە'
      : '🟡 نۆرەی تۆیە: پوولێک فڕێ بدە بۆ چەپ (یان دووجار کلیکی لێ بکە)';
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
      setTimeout(runNextBotTurn, 200);
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
            setTimeout(runNextBotTurn, 200);
          } else {
            okeyState.turn = 0;
            okeyState.phase = 'draw';
            updateTurnBannerUI();
            renderFullScene(false, false);
          }
        }
      );
    }, 100);
  });
}

function okeyAutoSortRack(mode = 'runs') {
  if (okeyState.isAnimating) return;
  const allTiles = okeyState.rackSlots.filter(Boolean);
  if (allTiles.length === 0) return;

  okeyState.rackSlots = new Array(RACK_TOTAL_SLOTS).fill(null);
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
  syncPlayerRackSprites(false, true);
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

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('okeyPixiStage');

  pixiApp = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2)
  });

  container.appendChild(pixiApp.view);
  bakeAllOkeyTextures();

  tableLayer = new PIXI.Container();
  rackBgLayer = new PIXI.Container();
  bracketsLayer = new PIXI.Container();
  tilesLayer = new PIXI.Container();
  fxLayer = new PIXI.Container();

  pixiApp.stage.addChild(tableLayer, rackBgLayer, bracketsLayer, tilesLayer, fxLayer);

  // سیستمی زیرەکی زوومکردن بۆ مۆبایل
  const resizeStage = () => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    pixiApp.renderer.resize(screenW, screenH);

    // یارییەکە بە تەواوی پڕ بە شاشەکە دەکات
    const scale = Math.min(screenW / 1280, screenH / 720);
    pixiApp.stage.scale.set(scale);
    pixiApp.stage.x = (screenW - 1280 * scale) / 2;
    pixiApp.stage.y = (screenH - 720 * scale) / 2;
  };

  window.addEventListener('resize', resizeStage);
  resizeStage();

  pixiApp.ticker.maxFPS = 120;
  pixiApp.ticker.add(() => {
    updateAllPixiTweens(pixiApp.ticker.deltaMS);
  });

  okeyStartNewRound();
});