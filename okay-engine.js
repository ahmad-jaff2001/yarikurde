// ============================================================================
// YARI KURDI - ULTRA-FAST 120FPS GPU-BAKED ROYAL OKEY ENGINE (PHASER 3)
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

// قەبارەی ستانداردی جێگیر بۆ هەموو شاشەیەک (هیچ شتێک تێکەڵ نابێت)
const STAGE_W = 1280;
const STAGE_H = 720;
const TILE_W = 54;
const TILE_H = 76;

let okeyGame = null;
let okeyScene = null;
let okeySoundCtx = null;

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

// دەنگی خێرای تەقەی پوول و فڕین (Zero-Latency Web Audio)
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
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.065);
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

  if (okeyScene) {
    okeyScene.syncRackSprites(true);
    okeyScene.syncCenterAndDiscards();
  }
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
      : '🟡 نۆرەی تۆیە: پوولێک فڕێ بدە بۆ خانەی چەپ (یان کۆنکان لە ناوەڕاست)';
  } else {
    const bot = okeyState.bots[okeyState.turn - 1];
    el.textContent = `⏳ نۆرەی ${bot.name}ـە...`;
  }
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
  if (okeyScene) okeyScene.syncRackSprites(false, true);
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

  if (okeyScene) {
    okeyState.isAnimating = true;
    okeyScene.syncCenterAndDiscards();
    playOkeyTileSound('whoosh');

    okeyScene.animateFlipAndFlyToRack(drawn, okeyScene.deckCoords.x, okeyScene.deckCoords.y, targetSlotIdx, () => {
      okeyState.rackSlots[targetSlotIdx] = drawn;
      okeyState.phase = 'play';
      okeyState.isAnimating = false;
      playOkeyTileSound('clack');
      evaluatePlayerRack();
      updateTurnBannerUI();
      okeyScene.syncRackSprites(false);
    });
  }
}

function okeyPlayerTakeRightDiscard() {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'draw') return;
  const rightBot = okeyState.bots[2];
  if (rightBot.discards.length === 0) return;

  const taken = rightBot.discards.pop();
  const targetSlotIdx = getFirstEmptySlotIndex();

  if (okeyScene) {
    okeyState.isAnimating = true;
    okeyScene.syncCenterAndDiscards();
    playOkeyTileSound('whoosh');

    okeyScene.animateFlipAndFlyToRack(taken, okeyScene.rightDiscardCoords.x, okeyScene.rightDiscardCoords.y, targetSlotIdx, () => {
      okeyState.rackSlots[targetSlotIdx] = taken;
      okeyState.phase = 'play';
      okeyState.isAnimating = false;
      playOkeyTileSound('clack');
      evaluatePlayerRack();
      updateTurnBannerUI();
      okeyScene.syncRackSprites(false);
    });
  }
}

function okeyPlayerDiscardTile(slotIdx, isFinishingDrop = false) {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'play') return false;
  const tile = okeyState.rackSlots[slotIdx];
  if (!tile) return false;

  const checkWithoutThis = evaluatePlayerRack(tile.uid);
  if (isFinishingDrop) {
    if (!checkWithoutThis.canWin14) {
      updateTurnBannerUI('⚠️ هێشتا هەموو ١٤ پوولەکەت نەبوونەتە سێتی تەواو! بۆ فڕێدانی ئاسایی بیخەرە خانەی لای چەپ');
      return false;
    }
    okeyState.rackSlots[slotIdx] = null;
    okeyState.winner = 'player';
    playOkeyTileSound('win');
    showOkeyWinModal(true, 'پیرۆزە! هەموو ١٤ پوولەکەت کردە سێتی دروست و بە کۆنکان یارییەکەت بردەوە!');
    return true;
  }

  const slotInfo = okeyScene.slotRects[slotIdx];
  okeyState.rackSlots[slotIdx] = null;
  okeyState.isAnimating = true;
  okeyScene.syncRackSprites(false);
  playOkeyTileSound('whoosh');

  okeyScene.animateSomersaultThrow(
    tile,
    slotInfo.cx,
    slotInfo.cy,
    okeyScene.leftDiscardCoords.x,
    okeyScene.leftDiscardCoords.y,
    () => {
      okeyState.myDiscards.push(tile);
      okeyState.isAnimating = false;
      playOkeyTileSound('clack');

      evaluatePlayerRack();
      if (okeyState.isAllValidToWin) {
        okeyState.winner = 'player';
        playOkeyTileSound('win');
        showOkeyWinModal(true, 'ئۆکەی شاهانە! هەموو پوولەکانت کردە سێتی تەواو!');
        return;
      }

      okeyState.turn = 1;
      okeyState.phase = 'draw';
      updateTurnBannerUI();
      okeyScene.syncCenterAndDiscards();
      setTimeout(runNextBotTurn, 220);
    }
  );
  return true;
}

function runNextBotTurn() {
  if (okeyState.winner || okeyState.turn === 0 || !okeyScene) return;

  const botIdx = okeyState.turn - 1;
  const bot = okeyState.bots[botIdx];

  if (okeyState.deck.length === 0) {
    showOkeyWinModal(false, 'پوولەکانی ناوەڕاست تەواو بوون و کەس کۆنکانی نەکرد!');
    return;
  }

  okeyState.isAnimating = true;
  const drawn = okeyState.deck.pop();
  bot.tiles.push(drawn);
  okeyScene.syncCenterAndDiscards();

  const botPos = okeyScene.botCoords[botIdx];
  const discardTarget = okeyScene.botDiscardCoords[botIdx];

  playOkeyTileSound('whoosh');
  okeyScene.animateBotDrawSwoop(okeyScene.deckCoords.x, okeyScene.deckCoords.y, botPos.x, botPos.y, () => {
    playOkeyTileSound('clack');

    let discardIdx = bot.tiles.findIndex(t => !isRealOkeyJoker(t));
    if (discardIdx === -1) discardIdx = 0;
    const discarded = bot.tiles.splice(discardIdx, 1)[0];

    setTimeout(() => {
      playOkeyTileSound('whoosh');
      okeyScene.animateSomersaultThrow(
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
            okeyScene.syncCenterAndDiscards();
            setTimeout(runNextBotTurn, 220);
          } else {
            okeyState.turn = 0;
            okeyState.phase = 'draw';
            updateTurnBannerUI();
            okeyScene.syncCenterAndDiscards();
          }
        }
      );
    }, 120);
  });
}

function showOkeyWinModal(iWon, message) {
  const modal = document.getElementById('okeyWinModal');
  document.getElementById('winModalIcon').textContent = iWon ? '🏆' : '🎲';
  document.getElementById('winModalTitle').textContent = iWon ? 'ئۆکەی شاهانە!' : 'کۆتایی دەستەکە';
  document.getElementById('winModalDesc').textContent = message;
  modal.classList.remove('hidden');
}

// ============================================================================
// PHASER 3 SCENE - GPU TEXTURE ATLAS & PERSISTENT SPRITES (120 FPS)
// ============================================================================
class RoyalOkeyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RoyalOkeyScene' });
    this.slotRects = [];
    this.tileSpritesByUid = new Map();
    this.botBadgeGlows = [];
    this.botCountTexts = [];
    this.discardSprites = [null, null, null, null];
  }

  preload() {
    this.load.image('okey_custom_bg', 'images.png/okay-bg.png');
  }

  create() {
    okeyScene = this;

    // ١. دروستکردنی هەموو پوولەکان لەسەر GPU تەنها یەک جار بۆ خێرایی 120FPS
    this.bakeAllTileTexturesToGPU();

    this.bgLayer = this.add.container(0, 0);
    this.staticUiLayer = this.add.container(0, 0);
    this.dynamicCenterLayer = this.add.container(0, 0);
    this.rackLayer = this.add.container(0, 0);
    this.bracketsLayer = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0);

    // ٢. کێشانی تەختە و مێزەکە تەنها یەک جار (هەرگیز دووبارە ناکێشرێتەوە)
    this.buildStaticTableLayout();

    okeyStartNewRound();
  }

  // دروستکردنی تێکسچەری هەموو پوولەکان بە Canvas 2D و خەزنکردنی لە GPU
  bakeAllTileTexturesToGPU() {
    const dpr = 2;
    const w = TILE_W * dpr;
    const h = TILE_H * dpr;
    const r = 10 * dpr;

    const drawBaseTile = (ctx, borderCol = '#e2d9c5', borderW = 2) => {
      ctx.clearRect(0, 0, w, h);

      // بنکەی ٣ ڕەهەندی
      this.roundRect(ctx, 2, 4, w - 4, h - 4, r);
      ctx.fillStyle = '#cfc3ac';
      ctx.fill();

      // ڕووی عاجی سپی
      this.roundRect(ctx, 2, 2, w - 4, h - 7, r);
      ctx.fillStyle = '#fffdf8';
      ctx.fill();
      ctx.lineWidth = borderW * dpr;
      ctx.strokeStyle = borderCol;
      ctx.stroke();
    };

    // دروستکردنی ٥٢ جۆری پوول (٤ ڕەنگ × ١٣ ژمارە)
    for (const color of OKEY_COLORS) {
      const hex = OKEY_COLOR_HEX[color];
      for (let num = 1; num <= 13; num++) {
        const key = `tile_${color}_${num}`;
        if (this.textures.exists(key)) continue;
        const tex = this.textures.createCanvas(key, w, h);
        const ctx = tex.getContext();
        drawBaseTile(ctx);

        ctx.fillStyle = hex;
        ctx.font = `900 ${Math.round(TILE_W * 0.52 * dpr)}px "Arial Black", Vazirmatn, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), w / 2, h * 0.37);

        // خاڵە ڕەنگدارەکەی خوارەوەی پوول
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.72, 6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = hex;
        ctx.fill();

        tex.refresh();
      }
    }

    // پوولی جۆکەری ساختە
    if (!this.textures.exists('tile_false_joker')) {
      const tex = this.textures.createCanvas('tile_false_joker', w, h);
      const ctx = tex.getContext();
      drawBaseTile(ctx, '#f59e0b', 2.5);
      ctx.font = `${Math.round(TILE_W * 0.52 * dpr)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', w / 2, h * 0.48);
      tex.refresh();
    }

    // پشتی پوولی سووری شاهانە
    if (!this.textures.exists('tile_back_red')) {
      const tex = this.textures.createCanvas('tile_back_red', w, h);
      const ctx = tex.getContext();
      this.roundRect(ctx, 2, 2, w - 4, h - 4, r);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#b91c1c');
      grad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2.5 * dpr;
      ctx.strokeStyle = '#facc15';
      ctx.stroke();

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#fde047';
      ctx.font = `bold ${14 * dpr}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OKAY', 0, 0);
      ctx.restore();
      tex.refresh();
    }
  }

  roundRect(ctx, x, y, w, h, r) {
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

  getTileTextureKey(tile) {
    if (!tile) return 'tile_back_red';
    if (tile.isFalseJoker) return 'tile_false_joker';
    return `tile_${tile.color}_${tile.number}`;
  }

  buildStaticTableLayout() {
    const w = STAGE_W;
    const h = STAGE_H;

    // باکگراوند
    if (this.textures.exists('okey_custom_bg') && this.textures.get('okey_custom_bg').key !== '__MISSING') {
      const img = this.add.image(w / 2, h / 2, 'okey_custom_bg');
      const scale = Math.max(w / img.width, h / img.height);
      img.setScale(scale);
      this.bgLayer.add(img);

      const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x060212, 0.25);
      this.bgLayer.add(overlay);
    } else {
      const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x12072b);
      this.bgLayer.add(bg);
    }

    // قەبارەی تەختە دارینە دوو-ڕیزییەکە لە خوارەوەی شاشە
    const slotW = TILE_W + 6;
    const rackW = RACK_COLS * slotW + 32;
    const rackH = TILE_H * 2 + 34;
    const rackX = (w - rackW) / 2;
    const rackY = h - rackH - 14;

    // شوێنی جێگیری ٣ بۆتەکان
    this.botCoords = [
      { x: 115, y: 270 },         // بۆتی چەپ
      { x: w / 2, y: 88 },        // بۆتی سەرەوە
      { x: w - 115, y: 270 }      // بۆتی ڕاست
    ];

    okeyState.bots.forEach((bot, i) => {
      this.createStaticBotBadge(this.botCoords[i].x, this.botCoords[i].y, bot, i);
    });

    // سندووقی ناوەڕاست (پاقژ و جێگیر)
    const centerY = 270;
    const boxW = 290;
    const boxH = 124;

    const cPanel = this.add.graphics();
    cPanel.fillStyle(0x0b051a, 0.88);
    cPanel.fillRoundedRect(w / 2 - boxW / 2, centerY - boxH / 2, boxW, boxH, 22);
    cPanel.lineStyle(2, 0xfacc15, 0.75);
    cPanel.strokeRoundedRect(w / 2 - boxW / 2, centerY - boxH / 2, boxW, boxH, 22);
    this.staticUiLayer.add(cPanel);

    // ١) خانەی کۆنکان (چەپی ناوەڕاست)
    const finishX = w / 2 - 86;
    const fBox = this.add.graphics();
    fBox.fillStyle(0x2e1065, 0.65);
    fBox.fillRoundedRect(finishX - TILE_W / 2 - 4, centerY - TILE_H / 2 - 4, TILE_W + 8, TILE_H + 8, 10);
    fBox.lineStyle(1.8, 0xa855f7, 0.9);
    fBox.strokeRoundedRect(finishX - TILE_W / 2 - 4, centerY - TILE_H / 2 - 4, TILE_W + 8, TILE_H + 8, 10);
    const fLbl = this.add.text(finishX, centerY - TILE_H / 2 - 14, 'کۆنکان', {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fde047'
    }).setOrigin(0.5);
    const fIcon = this.add.text(finishX, centerY, '👑', { fontSize: '22px' }).setOrigin(0.5).setAlpha(0.5);
    this.staticUiLayer.add([fBox, fLbl, fIcon]);
    this.centerFinishZone = new Phaser.Geom.Rectangle(finishX - TILE_W, centerY - TILE_H, TILE_W * 2, TILE_H * 2);

    // ٢) شوێنی پوولی ئۆکەی (ناوەڕاست)
    this.indicatorCoords = { x: w / 2, y: centerY };
    this.jokerRuleText = this.add.text(w / 2, centerY + TILE_H / 2 + 12, 'ئۆکەی: -', {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);
    this.staticUiLayer.add(this.jokerRuleText);

    // ٣) کۆمەڵە پوولی ڕاکێشان (ڕاستی ناوەڕاست)
    const deckX = w / 2 + 86;
    this.deckCoords = { x: deckX, y: centerY };
    const deckSprite = this.add.image(deckX, centerY, 'tile_back_red').setDisplaySize(TILE_W, TILE_H);
    deckSprite.setInteractive({ useHandCursor: true });
    deckSprite.on('pointerup', () => okeyPlayerDrawFromDeck());

    const countBg = this.add.circle(deckX + 24, centerY - 34, 14, 0xffffff);
    this.deckCountText = this.add.text(deckX + 24, centerY - 34, '48', {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#0f172a'
    }).setOrigin(0.5);
    this.staticUiLayer.add([deckSprite, countBg, this.deckCountText]);

    // چوار خانەی فڕێدانی پوول لە چوار گۆشەی مێزەکە (دوور لە یەکتر)
    this.leftDiscardCoords = { x: rackX + 46, y: rackY - 56 };
    this.rightDiscardCoords = { x: rackX + rackW - 46, y: rackY - 56 };
    this.botDiscardCoords = [
      { x: 255, y: 270 },         // فڕێدراوی بۆتی چەپ
      { x: w / 2 + 155, y: 88 },  // فڕێدراوی بۆتی سەرەوە
      this.rightDiscardCoords     // فڕێدراوی بۆتی ڕاست (کە یاریزان دەتوانێت هەڵیبگرێتەوە)
    ];

    this.createStaticDiscardSlot(this.leftDiscardCoords.x, this.leftDiscardCoords.y, 'فڕێدانی تۆ', false);
    this.createStaticDiscardSlot(this.botDiscardCoords[0].x, this.botDiscardCoords[0].y, '', false);
    this.createStaticDiscardSlot(this.botDiscardCoords[1].x, this.botDiscardCoords[1].y, '', false);
    this.createStaticDiscardSlot(this.rightDiscardCoords.x, this.rightDiscardCoords.y, 'هەڵگرتنەوە', true);

    this.leftDiscardZone = new Phaser.Geom.Rectangle(
      this.leftDiscardCoords.x - TILE_W * 1.4,
      this.leftDiscardCoords.y - TILE_H * 1.4,
      TILE_W * 2.8,
      TILE_H * 2.8
    );

    // تەختە دارینە دوو-ڕیزییەکە لە خوارەوە
    const rackGfx = this.add.graphics();
    rackGfx.fillStyle(0x000000, 0.65);
    rackGfx.fillRoundedRect(rackX + 4, rackY + 6, rackW, rackH, 20);
    rackGfx.fillGradientStyle(0x5c2d16, 0x5c2d16, 0x2b1206, 0x2b1206, 1);
    rackGfx.fillRoundedRect(rackX, rackY, rackW, rackH, 20);
    rackGfx.lineStyle(3, 0xfacc15, 0.88);
    rackGfx.strokeRoundedRect(rackX, rackY, rackW, rackH, 20);
    rackGfx.fillStyle(0x1a0903, 0.92);
    rackGfx.fillRect(rackX + 12, rackY + rackH / 2 - 2, rackW - 24, 5);
    this.staticUiLayer.add(rackGfx);

    const startX = rackX + 16 + slotW / 2;
    const rowY0 = rackY + 13 + TILE_H / 2;
    const rowY1 = rackY + 21 + TILE_H * 1.5;

    for (let r = 0; r < RACK_ROWS; r++) {
      for (let c = 0; c < RACK_COLS; c++) {
        const idx = r * RACK_COLS + c;
        const cx = startX + c * slotW;
        const cy = r === 0 ? rowY0 : rowY1;

        const slotBg = this.add.graphics();
        slotBg.fillStyle(0x140803, 0.65);
        slotBg.fillRoundedRect(cx - TILE_W / 2, cy - TILE_H / 2, TILE_W, TILE_H, 8);
        this.staticUiLayer.add(slotBg);

        this.slotRects.push({ idx, cx, cy });
      }
    }
  }

  createStaticBotBadge(x, y, bot, idx) {
    const bw = 160;
    const bh = 56;
    const bg = this.add.graphics();
    bg.fillStyle(0x100824, 0.92);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 16);
    this.staticUiLayer.add(bg);

    const glow = this.add.graphics();
    this.staticUiLayer.add(glow);
    this.botBadgeGlows[idx] = { glow, x, y, bw, bh };

    const avatar = this.add.circle(x + bw / 2 - 26, y, 18, 0x4c1d95).setStrokeStyle(1.5, 0xfacc15);
    const icon = this.add.text(x + bw / 2 - 26, y, '👤', { fontSize: '18px' }).setOrigin(0.5);

    const badge = this.add.circle(x + bw / 2 - 12, y - 16, 10, 0xdc2626);
    const countTxt = this.add.text(x + bw / 2 - 12, y - 16, '14', {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.botCountTexts[idx] = countTxt;

    const nameTxt = this.add.text(x + bw / 2 - 50, y - 9, bot.name, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const rankTxt = this.add.text(x + bw / 2 - 50, y + 10, `${bot.rank} • ${bot.elo}`, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '10px',
      color: '#fde047'
    }).setOrigin(1, 0.5);

    this.staticUiLayer.add([avatar, icon, badge, countTxt, nameTxt, rankTxt]);
  }

  createStaticDiscardSlot(x, y, label, isRightPickup) {
    const g = this.add.graphics();
    g.fillStyle(0x120924, 0.65);
    g.fillRoundedRect(x - TILE_W / 2 - 4, y - TILE_H / 2 - 4, TILE_W + 8, TILE_H + 8, 10);
    g.lineStyle(1.6, isRightPickup ? 0x22c55e : 0xfacc15, 0.65);
    g.strokeRoundedRect(x - TILE_W / 2 - 4, y - TILE_H / 2 - 4, TILE_W + 8, TILE_H + 8, 10);
    this.staticUiLayer.add(g);

    if (label) {
      const txt = this.add.text(x, y + TILE_H / 2 + 13, label, {
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: isRightPickup ? '#4ade80' : '#fde047'
      }).setOrigin(0.5);
      this.staticUiLayer.add(txt);
    }

    if (isRightPickup) {
      const hit = this.add.rectangle(x, y, TILE_W + 12, TILE_H + 12, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => okeyPlayerTakeRightDiscard());
      this.staticUiLayer.add(hit);
    }
  }

  // نوێکردنەوەی خێرای ناوەڕاست و فڕێدراوەکان بەبێ دروستکردنەوەی مێزەکە
  syncCenterAndDiscards() {
    this.dynamicCenterLayer.removeAll(true);

    // پوولی پیشاندەر
    if (okeyState.indicatorTile) {
      const key = this.getTileTextureKey(okeyState.indicatorTile);
      const ind = this.add.image(this.indicatorCoords.x, this.indicatorCoords.y, key).setDisplaySize(TILE_W, TILE_H);
      this.dynamicCenterLayer.add(ind);
      this.jokerRuleText.setText(`ئۆکەی: ${okeyState.jokerRule.number}`);
    }

    this.deckCountText.setText(String(okeyState.deck.length));

    // چوارچێوەی نۆرەی بۆتەکان
    okeyState.bots.forEach((bot, i) => {
      const info = this.botBadgeGlows[i];
      info.glow.clear();
      const active = okeyState.turn === i + 1;
      info.glow.lineStyle(active ? 2.5 : 1.3, active ? 0x22c55e : 0xfacc15, active ? 1 : 0.55);
      info.glow.strokeRoundedRect(info.x - info.bw / 2, info.y - info.bh / 2, info.bw, info.bh, 16);
      this.botCountTexts[i].setText(String(bot.tiles.length));
    });

    // پوولە فڕێدراوەکانی سەرەوە
    const piles = [
      { pile: okeyState.myDiscards, pos: this.leftDiscardCoords },
      { pile: okeyState.bots[0].discards, pos: this.botDiscardCoords[0] },
      { pile: okeyState.bots[1].discards, pos: this.botDiscardCoords[1] },
      { pile: okeyState.bots[2].discards, pos: this.rightDiscardCoords }
    ];

    piles.forEach(item => {
      if (item.pile.length > 0) {
        const top = item.pile[item.pile.length - 1];
        const img = this.add.image(item.pos.x, item.pos.y, this.getTileTextureKey(top)).setDisplaySize(TILE_W, TILE_H);
        this.dynamicCenterLayer.add(img);
      }
    });
  }

  // هاوتاکردنی پوولەکانی سەر تەختەکە بە خێرایی 120FPS (بەبێ سڕینەوە)
  syncRackSprites(animateDeal = false, animateSlide = false) {
    const activeUids = new Set();

    for (let idx = 0; idx < RACK_TOTAL_SLOTS; idx++) {
      const tile = okeyState.rackSlots[idx];
      if (!tile) continue;
      activeUids.add(tile.uid);

      const slot = this.slotRects[idx];
      let sprite = this.tileSpritesByUid.get(tile.uid);

      if (!sprite) {
        sprite = this.add.image(
          animateDeal ? this.deckCoords.x : slot.cx,
          animateDeal ? this.deckCoords.y : slot.cy,
          this.getTileTextureKey(tile)
        ).setDisplaySize(TILE_W, TILE_H);

        sprite.setInteractive({ draggable: true, useHandCursor: true });
        this.input.setDraggable(sprite);

        sprite.on('dragstart', () => {
          if (okeyState.isAnimating) return;
          playOkeyTileSound('clack');
          this.fxLayer.add(sprite);
          sprite.setScale(1.12);
        });

        sprite.on('drag', (pointer, dragX, dragY) => {
          if (okeyState.isAnimating) return;
          sprite.setPosition(dragX, dragY);
        });

        sprite.on('dragend', (pointer) => {
          sprite.setDisplaySize(TILE_W, TILE_H);
          this.rackLayer.add(sprite);
          this.handleTileDrop(sprite.currentSlotIdx, pointer.x, pointer.y);
        });

        this.rackLayer.add(sprite);
        this.tileSpritesByUid.set(tile.uid, sprite);
      }

      sprite.currentSlotIdx = idx;

      if (animateDeal) {
        this.tweens.add({
          targets: sprite,
          x: slot.cx,
          y: slot.cy,
          duration: 220 + idx * 10,
          ease: 'Back.easeOut'
        });
      } else if (animateSlide) {
        this.tweens.add({
          targets: sprite,
          x: slot.cx,
          y: slot.cy,
          duration: 140,
          ease: 'Cubic.easeOut'
        });
      } else {
        sprite.setPosition(slot.cx, slot.cy);
      }
    }

    // سڕینەوەی ئەو پوولانەی کە چیتر لەسەر تەختەکە نەماون (فڕێدراون)
    for (const [uid, sprite] of this.tileSpritesByUid.entries()) {
      if (!activeUids.has(uid)) {
        sprite.destroy();
        this.tileSpritesByUid.delete(uid);
      }
    }

    // کێشانی چوارچێوەی سەوزی دەوری سێتە دروستەکان
    this.bracketsLayer.removeAll(true);
    const grpFrame = this.add.graphics();
    grpFrame.lineStyle(3, 0x22c55e, 1);

    for (const bound of okeyState.validGroupsBounds) {
      const firstSlot = this.slotRects[bound.row * RACK_COLS + bound.startCol];
      const lastSlot = this.slotRects[bound.row * RACK_COLS + bound.endCol];
      if (firstSlot && lastSlot) {
        const boxW = (lastSlot.cx - firstSlot.cx) + TILE_W + 6;
        const boxH = TILE_H + 6;
        grpFrame.strokeRoundedRect(firstSlot.cx - TILE_W / 2 - 3, firstSlot.cy - TILE_H / 2 - 3, boxW, boxH, 10);
      }
    }
    this.bracketsLayer.add(grpFrame);
  }

  // تەقڵەلێدانی خێرای پوول لە کاتی فڕێدان (120FPS GPU Tween)
  animateSomersaultThrow(tile, fromX, fromY, toX, toY, onComplete) {
    const flyer = this.add.image(fromX, fromY, this.getTileTextureKey(tile)).setDisplaySize(TILE_W, TILE_H);
    this.fxLayer.add(flyer);

    const midX = (fromX + toX) / 2;
    const midY = Math.min(fromY, toY) - 60;

    this.tweens.add({
      targets: flyer,
      x: midX,
      y: midY,
      scaleX: 0.08,
      scaleY: 0.65,
      angle: 180,
      duration: 120,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: flyer,
          x: toX,
          y: toY,
          scaleX: 0.5,
          scaleY: 0.5,
          angle: 360,
          duration: 130,
          ease: 'Back.easeOut',
          onComplete: () => {
            flyer.destroy();
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  // هەڵگەڕانەوەی ٣ ڕەهەندی لە کاتی ڕاکێشانی پوول بۆ ناو تەختە
  animateFlipAndFlyToRack(tile, fromX, fromY, targetSlotIdx, onComplete) {
    const targetSlot = this.slotRects[targetSlotIdx];
    const flyer = this.add.image(fromX, fromY, 'tile_back_red').setDisplaySize(TILE_W, TILE_H);
    this.fxLayer.add(flyer);

    const midX = (fromX + targetSlot.cx) / 2;
    const midY = (fromY + targetSlot.cy) / 2 - 45;

    this.tweens.add({
      targets: flyer,
      x: midX,
      y: midY,
      scaleX: 0.04,
      duration: 110,
      ease: 'Sine.easeIn',
      onComplete: () => {
        flyer.setTexture(this.getTileTextureKey(tile));
        this.tweens.add({
          targets: flyer,
          x: targetSlot.cx,
          y: targetSlot.cy,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 125,
          ease: 'Back.easeOut',
          onComplete: () => {
            flyer.destroy();
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  animateBotDrawSwoop(fromX, fromY, toX, toY, onComplete) {
    const flyer = this.add.image(fromX, fromY, 'tile_back_red').setDisplaySize(TILE_W * 0.85, TILE_H * 0.85);
    this.fxLayer.add(flyer);

    this.tweens.add({
      targets: flyer,
      x: toX,
      y: toY,
      angle: 180,
      alpha: 0.6,
      duration: 160,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        flyer.destroy();
        if (onComplete) onComplete();
      }
    });
  }

  handleTileDrop(fromSlotIdx, dropX, dropY) {
    if (this.centerFinishZone && this.centerFinishZone.contains(dropX, dropY)) {
      if (okeyPlayerDiscardTile(fromSlotIdx, true)) return;
    }

    if (this.leftDiscardZone && this.leftDiscardZone.contains(dropX, dropY)) {
      if (okeyPlayerDiscardTile(fromSlotIdx, false)) return;
    }

    let targetSlot = null;
    let minDist = Infinity;
    for (const s of this.slotRects) {
      const d = Phaser.Math.Distance.Between(dropX, dropY, s.cx, s.cy);
      if (d < minDist && d < 55) {
        minDist = d;
        targetSlot = s;
      }
    }

    if (targetSlot && targetSlot.idx !== fromSlotIdx) {
      const movingTile = okeyState.rackSlots[fromSlotIdx];
      const existingTile = okeyState.rackSlots[targetSlot.idx];
      okeyState.rackSlots[targetSlot.idx] = movingTile;
      okeyState.rackSlots[fromSlotIdx] = existingTile;
      playOkeyTileSound('clack');
      evaluatePlayerRack();
      this.syncRackSprites(false, true);
    } else {
      this.syncRackSprites(false, true);
    }
  }
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

window.addEventListener('DOMContentLoaded', () => {
  okeyGame = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'okeyPhaserStage',
    width: STAGE_W,
    height: STAGE_H,
    transparent: true,
    powerPreference: 'high-performance',
    fps: {
      target: 120,
      forceSetTimeOut: false
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [RoyalOkeyScene]
  });
});