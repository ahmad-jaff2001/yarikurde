// ============================================================================
// YARI KURDI - ROYAL KURDISH OKEY ENGINE (FAST 3D FLIP ANIMATIONS & CLEAN UI)
// ============================================================================

const OKEY_COLORS = ['red', 'black', 'blue', 'yellow'];
const OKEY_COLOR_HEX = {
  red: '#dc2626',
  black: '#1e1b4b',
  blue: '#0284c7',
  yellow: '#d97706'
};

const RACK_COLS = 14;
const RACK_ROWS = 2;
const RACK_TOTAL_SLOTS = RACK_COLS * RACK_ROWS;

let okeyGame = null;
let okeyScene = null;
let okeySoundCtx = null;

let okeyState = {
  deck: [],
  indicatorTile: null,
  jokerRule: null,
  rackSlots: new Array(RACK_TOTAL_SLOTS).fill(null),
  bots: [
    { id: 1, name: 'کۆمپیوتەر ١', rank: 'زێڕین', elo: 1480, tiles: [], discards: [] },
    { id: 2, name: 'کۆمپیوتەر ٢', rank: 'زیو', elo: 1320, tiles: [], discards: [] },
    { id: 3, name: 'کۆمپیوتەر ٣', rank: 'ئەڵماس', elo: 2900, tiles: [], discards: [] }
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

// دەنگی تەقەی دار و پوول بە Web Audio API
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
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.05);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.055);
    } else if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = okeySoundCtx.createOscillator();
        const g = okeySoundCtx.createGain();
        o.connect(g);
        g.connect(okeySoundCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0.22, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32);
        o.start(now + i * 0.08);
        o.stop(now + i * 0.08 + 0.34);
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

  // ١. سێتی هاوژمارە بە ڕەنگی جیاواز (وەک 7-7-7)
  if (group.length <= 4) {
    const targetNum = normals[0].number;
    const allSameNum = normals.every(t => t.number === targetNum);
    const uniqueColors = new Set(normals.map(t => t.color)).size === normals.length;
    if (allSameNum && uniqueColors) return true;
  }

  // ٢. زنجیرەی یەک ڕەنگ بە دوای یەکدا (وەک 9-10-11 یان 12-13-1)
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

  // پشکنینی ٧ جووت
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

  if (okeyScene) okeyScene.renderTable(true);
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
      : '🟡 نۆرەی تۆیە: پوولێک فڕێ بدە بۆ لای چەپ (یان بۆ ناوەڕاست بۆ کۆنکان)';
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
    // زنجیرەکان
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

    // سێتی هاوژمارە
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
  if (okeyScene) okeyScene.renderTable(false);
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

// ڕاکێشانی پوول لە ناوەڕاست بە ئەنیمەیشنی خێرا و تەقڵەلێدان
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
    playOkeyTileSound('whoosh');
    okeyScene.animateFlipAndFlyToRack(drawn, okeyScene.deckCoords.x, okeyScene.deckCoords.y, targetSlotIdx, () => {
      okeyState.rackSlots[targetSlotIdx] = drawn;
      okeyState.phase = 'play';
      okeyState.isAnimating = false;
      playOkeyTileSound('clack');
      evaluatePlayerRack();
      updateTurnBannerUI();
      okeyScene.renderTable(false);
    });
  }
}

// هەڵگرتنەوەی پوولی فڕێدراوی لای ڕاست بە ئەنیمەیشن
function okeyPlayerTakeRightDiscard() {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'draw') return;
  const rightBot = okeyState.bots[2];
  if (rightBot.discards.length === 0) return;

  const taken = rightBot.discards.pop();
  const targetSlotIdx = getFirstEmptySlotIndex();

  if (okeyScene) {
    okeyState.isAnimating = true;
    playOkeyTileSound('whoosh');
    okeyScene.animateFlipAndFlyToRack(taken, okeyScene.rightDiscardCoords.x, okeyScene.rightDiscardCoords.y, targetSlotIdx, () => {
      okeyState.rackSlots[targetSlotIdx] = taken;
      okeyState.phase = 'play';
      okeyState.isAnimating = false;
      playOkeyTileSound('clack');
      evaluatePlayerRack();
      updateTurnBannerUI();
      okeyScene.renderTable(false);
    });
  }
}

// فڕێدانی پوول لەلایەن یاریزانەوە بە ئەنیمەیشنی خێرا
function okeyPlayerDiscardTile(slotIdx, isFinishingDrop = false) {
  if (okeyState.isAnimating || okeyState.turn !== 0 || okeyState.phase !== 'play') return false;
  const tile = okeyState.rackSlots[slotIdx];
  if (!tile) return false;

  const checkWithoutThis = evaluatePlayerRack(tile.uid);
  if (isFinishingDrop) {
    if (!checkWithoutThis.canWin14) {
      updateTurnBannerUI('⚠️ هێشتا هەموو ١٤ پوولەکەت نەبوونەتە سێتی تەواو! بۆ فڕێدانی ئاسایی بیخەرە گۆشەی خوارەوەی چەپ');
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
  playOkeyTileSound('whoosh');

  okeyScene.animateSomersaultThrow(
    tile,
    slotInfo.cx,
    slotInfo.cy,
    okeyScene.leftDiscardCoords.x,
    okeyScene.leftDiscardCoords.y,
    true,
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
      okeyScene.renderTable(false);
      setTimeout(runNextBotTurn, 380);
    }
  );
  return true;
}

// جووڵەی خێرا و ئەنیمەیشنی تەقڵەلێدانی ٣ بۆتەکان (وەک ڤیدیۆکە)
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

  const botPos = okeyScene.botCoords[botIdx];
  const discardTarget = okeyScene.botDiscardCoords[botIdx];

  playOkeyTileSound('whoosh');
  // ١. ڕاکێشانی خێرای پوول لە ناوەڕاستەوە بۆ لای بۆتەکە
  okeyScene.animateBotDrawSwoop(okeyScene.deckCoords.x, okeyScene.deckCoords.y, botPos.x, botPos.y, () => {
    playOkeyTileSound('clack');

    // هەڵبژاردنی پوولێک بۆ فڕێدان
    let discardIdx = bot.tiles.findIndex(t => !isRealOkeyJoker(t));
    if (discardIdx === -1) discardIdx = 0;
    const discarded = bot.tiles.splice(discardIdx, 1)[0];

    // ٢. فڕێدانی پوولەکە بە تەقڵەلێدانی ٣ ڕەهەندی بۆ خانەی فڕێدان
    setTimeout(() => {
      playOkeyTileSound('whoosh');
      okeyScene.animateSomersaultThrow(
        discarded,
        botPos.x,
        botPos.y,
        discardTarget.x,
        discardTarget.y,
        true,
        () => {
          bot.discards.push(discarded);
          okeyState.isAnimating = false;
          playOkeyTileSound('clack');

          if (okeyState.turn < 3) {
            okeyState.turn++;
            updateTurnBannerUI();
            okeyScene.renderTable(false);
            setTimeout(runNextBotTurn, 320);
          } else {
            okeyState.turn = 0;
            okeyState.phase = 'draw';
            updateTurnBannerUI();
            okeyScene.renderTable(false);
          }
        }
      );
    }, 180);
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
// PHASER 3 SCENE - CLEAN 4-PLAYER TABLE & 3D SOMERSAULT ANIMATIONS
// ============================================================================
class RoyalOkeyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RoyalOkeyScene' });
    this.slotRects = [];
    this.leftDiscardZone = null;
    this.centerFinishZone = null;
    this.deckCoords = { x: 0, y: 0 };
    this.leftDiscardCoords = { x: 0, y: 0 };
    this.rightDiscardCoords = { x: 0, y: 0 };
    this.botCoords = [];
    this.botDiscardCoords = [];
    this.tileSize = { w: 46, h: 64 };
  }

  preload() {
    this.load.image('okey_custom_bg', 'images.png/okay-bg.png');
  }

  create() {
    okeyScene = this;
    this.bgLayer = this.add.container(0, 0);
    this.tableLayer = this.add.container(0, 0);
    this.rackLayer = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0);

    this.scale.on('resize', () => this.renderTable(false));
    okeyStartNewRound();
  }

  drawRoyalBackground(w, h) {
    this.bgLayer.removeAll(true);

    if (this.textures.exists('okey_custom_bg') && this.textures.get('okey_custom_bg').key !== '__MISSING') {
      const img = this.add.image(w / 2, h / 2, 'okey_custom_bg');
      const scale = Math.max(w / img.width, h / img.height);
      img.setScale(scale).setAlpha(0.95);
      this.bgLayer.add(img);

      const overlay = this.add.graphics();
      overlay.fillStyle(0x060212, 0.28);
      overlay.fillRect(0, 0, w, h);
      this.bgLayer.add(overlay);
    } else {
      const gfx = this.add.graphics();
      gfx.fillGradientStyle(0x13072e, 0x13072e, 0x060212, 0x060212, 1);
      gfx.fillRect(0, 0, w, h);
      this.bgLayer.add(gfx);
    }
  }

  // دروستکردنی پوولێکی عاجیی شاهانە بە قەبارەی ڕێک و پاقژ
  createOkeyTileContainer(tile, tileW, tileH, isHighlighted = false) {
    const c = this.add.container(0, 0);
    const rad = Math.max(6, Math.round(tileW * 0.16));
    const g = this.add.graphics();

    // سێبەر
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(-tileW / 2 + 2, -tileH / 2 + 3, tileW, tileH, rad);

    // بنکەی ٣ ڕەهەندی
    g.fillStyle(0xd6ccb8, 1);
    g.fillRoundedRect(-tileW / 2, -tileH / 2 + 2, tileW, tileH, rad);

    // ڕووی سپی عاجی
    g.fillStyle(0xfffdf8, 1);
    g.fillRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH - 2, rad);

    if (isHighlighted) {
      g.lineStyle(2.5, 0x10b981, 1);
      g.strokeRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH - 2, rad);
    } else {
      g.lineStyle(1.2, 0xe2d9c5, 1);
      g.strokeRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH - 2, rad);
    }
    c.add(g);

    const isJoker = isRealOkeyJoker(tile);

    if (tile.isFalseJoker) {
      const star = this.add.text(0, -tileH * 0.12, '☀️', {
        fontSize: `${Math.round(tileW * 0.42)}px`
      }).setOrigin(0.5);
      const lbl = this.add.text(0, tileH * 0.22, `${okeyState.jokerRule.number}`, {
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: `${Math.round(tileW * 0.34)}px`,
        fontStyle: 'bold',
        color: OKEY_COLOR_HEX[okeyState.jokerRule.color]
      }).setOrigin(0.5);
      c.add([star, lbl]);
    } else {
      const hex = OKEY_COLOR_HEX[tile.color];
      const numTxt = this.add.text(0, -tileH * 0.14, String(tile.number), {
        fontFamily: 'Arial Black, Vazirmatn, sans-serif',
        fontSize: `${Math.round(tileW * 0.48)}px`,
        fontStyle: 'bold',
        color: hex
      }).setOrigin(0.5);

      const dot = this.add.graphics();
      const dotColorInt = Phaser.Display.Color.HexStringToColor(hex).color;
      dot.fillStyle(dotColorInt, 1);
      dot.fillCircle(0, tileH * 0.22, Math.max(3.5, tileW * 0.11));
      c.add([numTxt, dot]);

      if (isJoker) {
        const crown = this.add.text(tileW * 0.26, -tileH * 0.32, '👑', {
          fontSize: `${Math.round(tileW * 0.24)}px`
        }).setOrigin(0.5);
        c.add(crown);
      }
    }

    c.setSize(tileW, tileH);
    return c;
  }

  // پشتی پوولی سووری شاهانە (بۆ کاتی تەقڵەلێدان و ڕاکێشان)
  createTileBackContainer(tileW, tileH) {
    const c = this.add.container(0, 0);
    const rad = Math.max(6, Math.round(tileW * 0.16));
    const g = this.add.graphics();

    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(-tileW / 2 + 2, -tileH / 2 + 3, tileW, tileH, rad);

    g.fillStyle(0x991b1b, 1);
    g.fillRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH, rad);
    g.lineStyle(1.8, 0xfacc15, 0.9);
    g.strokeRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH, rad);

    const lbl = this.add.text(0, 0, 'OKAY', {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.round(tileW * 0.26)}px`,
      fontStyle: 'bold',
      color: '#fde047'
    }).setOrigin(0.5).setRotation(-Math.PI / 2);

    c.add([g, lbl]);
    return c;
  }

  // ئەنیمەیشنی ١: تەقڵەلێدانی ٣ ڕەهەندی لە کاتی فڕێدانی پوول (وەک ڤیدیۆکە)
  animateSomersaultThrow(tile, fromX, fromY, toX, toY, faceUpAtEnd, onComplete) {
    const { w: tw, h: th } = this.tileSize;
    const flyer = this.createOkeyTileContainer(tile, tw, th, false);
    flyer.setPosition(fromX, fromY);
    this.fxLayer.add(flyer);

    const midX = (fromX + toX) / 2;
    const midY = Math.min(fromY, toY) - 55; // بەرزبوونەوەی کەوانەیی لە حەوادا

    // قۆناغی یەکەم: فڕین بۆ سەرەوە و تەقڵەلێدان (سووڕانەوە و تەسکبوونەوەی ٣ ڕەهەندی)
    this.tweens.add({
      targets: flyer,
      x: midX,
      y: midY,
      scaleX: 0.15,
      scaleY: 1.28,
      angle: 190,
      duration: 145,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // قۆناغی دووەم: تەواوکردنی تەقڵەکە و نیشتنەوە لەسەر خانەکە
        this.tweens.add({
          targets: flyer,
          x: toX,
          y: toY,
          scaleX: 1,
          scaleY: 1,
          angle: 360,
          duration: 155,
          ease: 'Back.easeOut',
          onComplete: () => {
            flyer.destroy();
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  // ئەنیمەیشنی ٢: ڕاکێشانی پوول لە ناوەڕاستەوە و هەڵگەڕانەوەی لە حەوادا بۆ ناو تەختەکەت
  animateFlipAndFlyToRack(tile, fromX, fromY, targetSlotIdx, onComplete) {
    const { w: tw, h: th } = this.tileSize;
    const targetSlot = this.slotRects[targetSlotIdx];
    const backSprite = this.createTileBackContainer(tw, th);
    backSprite.setPosition(fromX, fromY);
    this.fxLayer.add(backSprite);

    const midX = (fromX + targetSlot.cx) / 2;
    const midY = (fromY + targetSlot.cy) / 2 - 40;

    // نیوەی یەکەم: پشتی پوولەکە دەفڕێت و دەنوشتێتەوە
    this.tweens.add({
      targets: backSprite,
      x: midX,
      y: midY,
      scaleX: 0.05,
      scaleY: 1.2,
      angle: -15,
      duration: 130,
      ease: 'Sine.easeIn',
      onComplete: () => {
        backSprite.destroy();
        // نیوەی دووەم: ڕووی پوولەکە دەردەکەوێت و دەنیشێتە ناو خانەکەی تەختە
        const frontSprite = this.createOkeyTileContainer(tile, tw, th, false);
        frontSprite.setPosition(midX, midY);
        frontSprite.setScale(0.05, 1.2);
        this.fxLayer.add(frontSprite);

        this.tweens.add({
          targets: frontSprite,
          x: targetSlot.cx,
          y: targetSlot.cy,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
          duration: 150,
          ease: 'Back.easeOut',
          onComplete: () => {
            frontSprite.destroy();
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  // ئەنیمەیشنی ٣: فڕینی خێرای پوول بۆ لای بۆتەکان
  animateBotDrawSwoop(fromX, fromY, toX, toY, onComplete) {
    const { w: tw, h: th } = this.tileSize;
    const cardBack = this.createTileBackContainer(tw * 0.85, th * 0.85);
    cardBack.setPosition(fromX, fromY);
    this.fxLayer.add(cardBack);

    this.tweens.add({
      targets: cardBack,
      x: toX,
      y: toY,
      scale: 0.55,
      angle: 180,
      alpha: 0.7,
      duration: 210,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        cardBack.destroy();
        if (onComplete) onComplete();
      }
    });
  }

  // کارتی پڕۆفایلی پاقژ و بچووکی یاریزانەکان لە گۆشەکاندا
  drawBotBadge(x, y, bot, isActiveTurn) {
    const grp = this.add.container(x, y);
    const bw = 136;
    const bh = 46;

    const bg = this.add.graphics();
    bg.fillStyle(0x100824, 0.9);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 14);
    bg.lineStyle(isActiveTurn ? 2.5 : 1.2, isActiveTurn ? 0x22c55e : 0xfacc15, isActiveTurn ? 1 : 0.6);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 14);

    const avatarCircle = this.add.circle(bw / 2 - 22, 0, 15, 0x4c1d95);
    avatarCircle.setStrokeStyle(1.5, 0xfacc15);
    const avatarIcon = this.add.text(bw / 2 - 22, 0, '👤', { fontSize: '15px' }).setOrigin(0.5);

    const countBadge = this.add.circle(bw / 2 - 10, -14, 9, 0xdc2626);
    const countTxt = this.add.text(bw / 2 - 10, -14, String(bot.tiles.length), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const nameTxt = this.add.text(bw / 2 - 42, -8, bot.name, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const rankTxt = this.add.text(bw / 2 - 42, 9, `${bot.rank} • ${bot.elo}`, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '9px',
      color: '#fde047'
    }).setOrigin(1, 0.5);

    grp.add([bg, avatarCircle, avatarIcon, countBadge, countTxt, nameTxt, rankTxt]);
    this.tableLayer.add(grp);
  }

  renderTable(animateDeal = false) {
    const w = this.scale.width;
    const h = this.scale.height;

    this.drawRoyalBackground(w, h);
    this.tableLayer.removeAll(true);
    this.rackLayer.removeAll(true);
    this.slotRects = [];

    // حیسابکردنی وردی قەبارەی تەختە و پوولەکان بەپێی قەبارەی شاشە
    const rackMaxW = Math.min(w - 220, 820);
    const rackW = Math.max(rackMaxW, Math.min(w - 20, 480));
    const slotW = Math.floor((rackW - 24) / RACK_COLS);
    const tileW = Math.max(28, Math.min(slotW - 3, 52));
    const tileH = Math.round(tileW * 1.36);
    this.tileSize = { w: tileW, h: tileH };

    const rackH = tileH * 2 + 24;
    const rackX = (w - rackW) / 2;
    const rackY = h - rackH - 10;

    // شوێنی پڕۆفایلی ٣ بۆتەکان (دوور لە ناوەڕاست تا هیچ تێکەڵبوونێک نەبێت)
    this.botCoords = [
      { x: 82, y: h * 0.42 },       // بۆتی ١ (چەپ)
      { x: w / 2, y: 66 },          // بۆتی ٢ (سەرەوە)
      { x: w - 82, y: h * 0.42 }    // بۆتی ٣ (ڕاست)
    ];

    this.drawBotBadge(this.botCoords[0].x, this.botCoords[0].y, okeyState.bots[0], okeyState.turn === 1);
    this.drawBotBadge(this.botCoords[1].x, this.botCoords[1].y, okeyState.bots[1], okeyState.turn === 2);
    this.drawBotBadge(this.botCoords[2].x, this.botCoords[2].y, okeyState.bots[2], okeyState.turn === 3);

    // سندووقی ناوەڕاستی مێز (تەنها ٣ شت: کۆنکان + پوولی پیشاندەر + کۆمەڵە پوولی ڕاکێشان)
    const centerY = Math.max(148, (rackY + 95) / 2);
    const cTileW = Math.round(tileW * 0.92);
    const cTileH = Math.round(tileH * 0.92);
    const centerBoxW = cTileW * 3.8 + 40;
    const centerBoxH = cTileH + 34;

    const cPanel = this.add.graphics();
    cPanel.fillStyle(0x0b051a, 0.86);
    cPanel.fillRoundedRect(w / 2 - centerBoxW / 2, centerY - centerBoxH / 2, centerBoxW, centerBoxH, 18);
    cPanel.lineStyle(1.8, 0xfacc15, 0.7);
    cPanel.strokeRoundedRect(w / 2 - centerBoxW / 2, centerY - centerBoxH / 2, centerBoxW, centerBoxH, 18);
    this.tableLayer.add(cPanel);

    // ١) خانەی کۆنکان لە چەپی ناوەڕاست
    const finishX = w / 2 - cTileW * 1.25;
    const fBox = this.add.graphics();
    fBox.fillStyle(0x2e1065, 0.7);
    fBox.fillRoundedRect(finishX - cTileW / 2 - 3, centerY - cTileH / 2 - 3, cTileW + 6, cTileH + 6, 9);
    fBox.lineStyle(1.6, okeyState.isAllValidToWin ? 0x22c55e : 0xa855f7, 0.95);
    fBox.strokeRoundedRect(finishX - cTileW / 2 - 3, centerY - cTileH / 2 - 3, cTileW + 6, cTileH + 6, 9);
    const fLbl = this.add.text(finishX, centerY - cTileH / 2 - 12, 'کۆنکان', {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fde047'
    }).setOrigin(0.5);
    const fIcon = this.add.text(finishX, centerY, '👑', { fontSize: '18px' }).setOrigin(0.5).setAlpha(0.65);
    this.tableLayer.add([fBox, fLbl, fIcon]);
    this.centerFinishZone = new Phaser.Geom.Rectangle(finishX - cTileW, centerY - cTileH, cTileW * 2, cTileH * 2);

    // ٢) پوولی ئۆکەی (پیشاندەر) لە ناوەڕاست
    if (okeyState.indicatorTile) {
      const indTile = this.createOkeyTileContainer(okeyState.indicatorTile, cTileW, cTileH, false);
      indTile.setPosition(w / 2, centerY);
      const jLbl = this.add.text(w / 2, centerY + cTileH / 2 + 10, `ئۆکەی: ${okeyState.jokerRule.number}`, {
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#fef08a'
      }).setOrigin(0.5);
      this.tableLayer.add([indTile, jLbl]);
    }

    // ٣) کۆمەڵە پوولەکانی ڕاکێشان لە ڕاستی ناوەڕاست
    const deckX = w / 2 + cTileW * 1.25;
    this.deckCoords = { x: deckX, y: centerY };

    const deckBack = this.createTileBackContainer(cTileW, cTileH);
    deckBack.setPosition(deckX, centerY);

    const countBubble = this.add.circle(deckX + cTileW * 0.42, centerY - cTileH * 0.44, 12, 0xffffff);
    const countNum = this.add.text(deckX + cTileW * 0.42, centerY - cTileH * 0.44, String(okeyState.deck.length), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#0f172a'
    }).setOrigin(0.5);

    const deckHit = this.add.rectangle(deckX, centerY, cTileW + 14, cTileH + 14, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    deckHit.on('pointerup', () => okeyPlayerDrawFromDeck());

    this.tableLayer.add([deckBack, countBubble, countNum, deckHit]);

    // شوێنی فڕێدانی پوولەکانی ٤ یاریزانەکە (بە ڕێکی لە چوار گۆشەی ناوەوە)
    const dTileW = Math.round(tileW * 0.84);
    const dTileH = Math.round(tileH * 0.84);

    this.leftDiscardCoords = { x: rackX + dTileW * 0.7, y: rackY - dTileH * 0.68 };
    this.rightDiscardCoords = { x: rackX + rackW - dTileW * 0.7, y: rackY - dTileH * 0.68 };

    this.botDiscardCoords = [
      { x: 185, y: h * 0.42 },        // فڕێدراوی بۆتی ١ (چەپ)
      { x: w / 2 + 105, y: 66 },      // فڕێدراوی بۆتی ٢ (سەرەوە)
      this.rightDiscardCoords         // فڕێدراوی بۆتی ٣ (خوارەوەی ڕاست بۆ هەڵگرتنەوە)
    ];

    this.drawDiscardSlot(this.leftDiscardCoords.x, this.leftDiscardCoords.y, dTileW, dTileH, okeyState.myDiscards, 'فڕێدان', false);
    this.leftDiscardZone = new Phaser.Geom.Rectangle(
      this.leftDiscardCoords.x - dTileW * 1.1,
      this.leftDiscardCoords.y - dTileH * 1.1,
      dTileW * 2.2,
      dTileH * 2.2
    );

    this.drawDiscardSlot(this.botDiscardCoords[0].x, this.botDiscardCoords[0].y, dTileW * 0.9, dTileH * 0.9, okeyState.bots[0].discards, '', false);
    this.drawDiscardSlot(this.botDiscardCoords[1].x, this.botDiscardCoords[1].y, dTileW * 0.9, dTileH * 0.9, okeyState.bots[1].discards, '', false);

    const canPickRight = okeyState.turn === 0 && okeyState.phase === 'draw' && okeyState.bots[2].discards.length > 0;
    this.drawDiscardSlot(this.rightDiscardCoords.x, this.rightDiscardCoords.y, dTileW, dTileH, okeyState.bots[2].discards, 'هەڵگرتنەوە', canPickRight);

    // تەختە دارینە دوو-ڕیزییەکەی یاریزان لە خوارەوە
    const rackGfx = this.add.graphics();
    rackGfx.fillStyle(0x000000, 0.65);
    rackGfx.fillRoundedRect(rackX + 3, rackY + 5, rackW, rackH, 16);

    rackGfx.fillGradientStyle(0x5c2d16, 0x5c2d16, 0x2b1206, 0x2b1206, 1);
    rackGfx.fillRoundedRect(rackX, rackY, rackW, rackH, 16);
    rackGfx.lineStyle(2.5, 0xfacc15, 0.85);
    rackGfx.strokeRoundedRect(rackX, rackY, rackW, rackH, 16);

    rackGfx.fillStyle(0x1a0903, 0.9);
    rackGfx.fillRect(rackX + 8, rackY + rackH / 2 - 2, rackW - 16, 4);
    this.rackLayer.add(rackGfx);

    const startX = rackX + (rackW - RACK_COLS * slotW) / 2 + slotW / 2;
    const rowY0 = rackY + 10 + tileH / 2;
    const rowY1 = rackY + 15 + tileH * 1.5;

    for (let r = 0; r < RACK_ROWS; r++) {
      for (let c = 0; c < RACK_COLS; c++) {
        const idx = r * RACK_COLS + c;
        const cx = startX + c * slotW;
        const cy = r === 0 ? rowY0 : rowY1;

        const slotBg = this.add.graphics();
        slotBg.fillStyle(0x140803, 0.65);
        slotBg.fillRoundedRect(cx - tileW / 2, cy - tileH / 2, tileW, tileH, 6);
        this.rackLayer.add(slotBg);

        const rect = new Phaser.Geom.Rectangle(cx - slotW / 2, cy - tileH / 2 - 4, slotW, tileH + 8);
        this.slotRects.push({ idx, cx, cy, rect });

        const tileData = okeyState.rackSlots[idx];
        if (tileData) {
          const isValid = okeyState.validTileIds.has(tileData.uid);
          const tileSprite = this.createOkeyTileContainer(tileData, tileW, tileH, isValid);
          tileSprite.setPosition(animateDeal ? w / 2 : cx, animateDeal ? centerY : cy);
          tileSprite.setInteractive({ draggable: true, useHandCursor: true });

          if (animateDeal) {
            this.tweens.add({
              targets: tileSprite,
              x: cx,
              y: cy,
              duration: 240 + idx * 12,
              ease: 'Back.easeOut'
            });
          }

          this.input.setDraggable(tileSprite);

          tileSprite.on('dragstart', () => {
            if (okeyState.isAnimating) return;
            playOkeyTileSound('clack');
            this.fxLayer.add(tileSprite);
            tileSprite.setScale(1.12);
          });

          tileSprite.on('drag', (pointer, dragX, dragY) => {
            if (okeyState.isAnimating) return;
            tileSprite.setPosition(dragX, dragY);
          });

          tileSprite.on('dragend', (pointer) => {
            tileSprite.setScale(1);
            this.handleTileDrop(idx, pointer.x, pointer.y);
          });

          this.rackLayer.add(tileSprite);
        }
      }
    }

    // چوارچێوەی دەوری سێتە دروستەکان (وەک ڤیدیۆکە)
    for (const bound of okeyState.validGroupsBounds) {
      const firstSlot = this.slotRects[bound.row * RACK_COLS + bound.startCol];
      const lastSlot = this.slotRects[bound.row * RACK_COLS + bound.endCol];
      if (firstSlot && lastSlot) {
        const boxW = (lastSlot.cx - firstSlot.cx) + tileW + 6;
        const boxH = tileH + 6;
        const grpFrame = this.add.graphics();
        grpFrame.lineStyle(2.5, 0x22c55e, 0.95);
        grpFrame.strokeRoundedRect(firstSlot.cx - tileW / 2 - 3, firstSlot.cy - tileH / 2 - 3, boxW, boxH, 8);
        this.rackLayer.add(grpFrame);
      }
    }
  }

  drawDiscardSlot(x, y, tw, th, pile, label, clickable) {
    const g = this.add.graphics();
    g.fillStyle(0x120924, 0.6);
    g.fillRoundedRect(x - tw / 2 - 3, y - th / 2 - 3, tw + 6, th + 6, 9);
    g.lineStyle(1.6, clickable ? 0x22c55e : 0xfacc15, clickable ? 1 : 0.5);
    g.strokeRoundedRect(x - tw / 2 - 3, y - th / 2 - 3, tw + 6, th + 6, 9);
    this.tableLayer.add(g);

    if (label) {
      const txt = this.add.text(x, y + th / 2 + 11, label, {
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: clickable ? '#4ade80' : '#fde047'
      }).setOrigin(0.5);
      this.tableLayer.add(txt);
    }

    if (pile && pile.length > 0) {
      const topTile = pile[pile.length - 1];
      const sprite = this.createOkeyTileContainer(topTile, tw, th, clickable);
      sprite.setPosition(x, y);
      if (clickable) {
        sprite.setInteractive({ useHandCursor: true });
        sprite.on('pointerup', () => okeyPlayerTakeRightDiscard());
      }
      this.tableLayer.add(sprite);
    }
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
      if (d < minDist && d < 65) {
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
    }

    this.renderTable(false);
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
    type: Phaser.AUTO,
    parent: 'okeyPhaserStage',
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [RoyalOkeyScene]
  });
});