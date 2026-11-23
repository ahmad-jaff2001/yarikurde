// ============================================================================
// YARI KURDI - ROYAL KURDISH OKEY / KONKAN TILE ENGINE (PHASER 3 - 106 TILES)
// ============================================================================

const OKEY_COLORS = ['red', 'black', 'blue', 'yellow'];
const OKEY_COLOR_HEX = {
  red: '#dc2626',
  black: '#1e1b4b',
  blue: '#0284c7',
  yellow: '#d97706'
};

// ٢٨ خانە لەسەر تەختەی یاریزان (٢ ڕیز × ١٤ ستوون)
const RACK_COLS = 14;
const RACK_ROWS = 2;
const RACK_TOTAL_SLOTS = RACK_COLS * RACK_ROWS;

let okeyGame = null;
let okeyScene = null;
let okeySoundCtx = null;

// دۆخی گشتیی یاری
let okeyState = {
  deck: [],
  indicatorTile: null, // پوولی پیشاندەر لە ناوەڕاست
  jokerRule: null,     // { color, number } ئەو پوولەی کە ئۆکەی ڕاستەقینەیە
  rackSlots: new Array(RACK_TOTAL_SLOTS).fill(null), // ٢٨ خانەی تەختەی یاریزان
  bots: [
    { id: 1, name: 'ئارام کوردی', rank: 'زێڕین', elo: 1480, tiles: [], discards: [] },
    { id: 2, name: 'شێرکۆ هەولێری', rank: 'زیو', elo: 1320, tiles: [], discards: [] },
    { id: 3, name: 'ڕۆژە سلێمانی', rank: 'بڕۆنز', elo: 1265, tiles: [], discards: [] }
  ],
  myDiscards: [],
  turn: 0,       // 0: یاریزان, 1: بۆتی چەپ, 2: بۆتی سەرەوە, 3: بۆتی ڕاست
  phase: 'play', // یاریزانی دەستپێک ١٥ پوولی هەیە و یەکسەر یەکێک فڕێ دەدات
  winner: null,
  validTileIds: new Set(),
  isAllValidToWin: false
};

// سیستمێکی دەنگیی ڕاستەقینەی تەقەی پوول و دار بە Web Audio API
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
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.055);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'draw') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.07);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.075);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = okeySoundCtx.createOscillator();
        const g = okeySoundCtx.createGain();
        o.connect(g);
        g.connect(okeySoundCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.09);
        g.gain.setValueAtTime(0.22, now + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.35);
        o.start(now + i * 0.09);
        o.stop(now + i * 0.09 + 0.36);
      });
    }
  } catch (e) {}
}

// دروستکردنی ١٠٦ پوولی تەواوی ئۆکەی
function buildOkey106Deck() {
  const deck = [];
  let uid = 1;
  for (let copy = 0; copy < 2; copy++) {
    for (const color of OKEY_COLORS) {
      for (let num = 1; num <= 13; num++) {
        deck.push({
          uid: `t_${uid++}`,
          color,
          number: num,
          isFalseJoker: false
        });
      }
    }
  }
  // ٢ پوولی جۆکەری ساختە (False Okey)
  deck.push({ uid: `t_${uid++}`, color: 'false_joker', number: 0, isFalseJoker: true });
  deck.push({ uid: `t_${uid++}`, color: 'false_joker', number: 0, isFalseJoker: true });

  // تێکەڵکردنی فیشەر-یەیتس
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// پشکنینی ئەوەی کام پوولە ئۆکەی ڕاستەقینەیە (Wildcard Joker)
function isRealOkeyJoker(tile) {
  if (!tile || tile.isFalseJoker || !okeyState.jokerRule) return false;
  return tile.color === okeyState.jokerRule.color && tile.number === okeyState.jokerRule.number;
}

// بەهای ڕاستەقینەی پوول (جۆکەری ساختە بەهای پوولە ئۆکەیەکە وەردەگرێت)
function getEffectiveTileValue(tile) {
  if (!tile) return null;
  if (tile.isFalseJoker) {
    return {
      color: okeyState.jokerRule.color,
      number: okeyState.jokerRule.number,
      isWild: false
    };
  }
  if (isRealOkeyJoker(tile)) {
    return {
      color: tile.color,
      number: tile.number,
      isWild: true
    };
  }
  return {
    color: tile.color,
    number: tile.number,
    isWild: false
  };
}

// پشکنینی گرووپێک پوولی تەنیشت یەک لەسەر تەختەکە (سێت یان زنجیرە)
function isValidOkeyGroup(group) {
  if (!group || group.length < 3) return false;
  const eff = group.map(getEffectiveTileValue);
  const wildCount = eff.filter(t => t.isWild).length;
  const normals = eff.filter(t => !t.isWild);

  if (normals.length === 0) return true;

  // ١. پشکنینی سێتی هاوژمارە (٣ یان ٤ پوولی هەمان ژمارە بە ڕەنگی جیاواز: 7-7-7)
  if (group.length <= 4) {
    const targetNum = normals[0].number;
    const allSameNum = normals.every(t => t.number === targetNum);
    const uniqueColors = new Set(normals.map(t => t.color)).size === normals.length;
    if (allSameNum && uniqueColors) return true;
  }

  // ٢. پشکنینی زنجیرەی هەمان ڕەنگ (وەک 4-5-6 یان 12-13-1)
  const targetColor = normals[0].color;
  if (!normals.every(t => t.color === targetColor)) return false;

  // تاقیکردنەوەی هەموو شوێنە گونجاوەکان بۆ دەستپێکی زنجیرەکە (1 تا 13، لەگەڵ 1 وەک 14 لە دوای 13)
  for (let startNum = 1; startNum <= 13; startNum++) {
    if (startNum + group.length - 1 > 14) continue;
    let matches = true;
    for (let i = 0; i < group.length; i++) {
      const item = eff[i];
      if (item.isWild) continue;
      let expected = startNum + i;
      if (expected === 14) expected = 1; // 12 - 13 - 1
      if (item.number !== expected) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }

  return false;
}

// شیکردنەوەی تەختەی یاریزان بۆ دیاریکردنی سێتە دروستەکان و ئامادەبوون بۆ بردنەوە
function evaluatePlayerRack(ignoreUid = null) {
  const validIds = new Set();
  const groups = [];

  for (let r = 0; r < RACK_ROWS; r++) {
    let currentGroup = [];
    for (let c = 0; c < RACK_COLS; c++) {
      const idx = r * RACK_COLS + c;
      const tile = okeyState.rackSlots[idx];
      if (tile && tile.uid !== ignoreUid) {
        currentGroup.push({ tile, idx });
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

  // پشکنینی سێت و زنجیرەکان
  for (const grp of groups) {
    totalTilesCount += grp.length;
    const tilesOnly = grp.map(g => g.tile);
    if (isValidOkeyGroup(tilesOnly)) {
      grp.forEach(g => validIds.add(g.tile.uid));
      validCount += grp.length;
    } else {
      allGroupsValid = false;
    }
  }

  // پشکنینی دۆخی ٧ جووت (7 Pairs)
  let pairsCount = 0;
  if (!allGroupsValid && groups.every(g => g.length === 2)) {
    let allPairsOk = true;
    for (const grp of groups) {
      const t1 = getEffectiveTileValue(grp[0].tile);
      const t2 = getEffectiveTileValue(grp[1].tile);
      if (t1.isWild || t2.isWild || (t1.number === t2.number && t1.color === t2.color)) {
        pairsCount++;
      } else {
        allPairsOk = false;
        break;
      }
    }
    if (allPairsOk && pairsCount === 7) {
      groups.forEach(grp => grp.forEach(g => validIds.add(g.tile.uid)));
      validCount = 14;
      allGroupsValid = true;
    }
  }

  if (!ignoreUid) {
    okeyState.validTileIds = validIds;
    okeyState.isAllValidToWin = (totalTilesCount === 14 && validCount === 14);
    const badge = document.getElementById('validTilesCounter');
    if (badge) badge.textContent = `${validCount} / 14`;
  }

  return {
    validCount,
    totalTilesCount,
    canWin14: totalTilesCount === 14 && validCount === 14,
    groups
  };
}

// دەستپێکردنی دەستێکی نوێ
function okeyStartNewRound() {
  const fullDeck = buildOkey106Deck();

  // هەڵبژاردنی پوولی پیشاندەر (نابێت جۆکەری ساختە بێت)
  let indIdx = fullDeck.findIndex(t => !t.isFalseJoker);
  const indicator = fullDeck.splice(indIdx, 1)[0];

  const jokerNum = indicator.number === 13 ? 1 : indicator.number + 1;
  okeyState.indicatorTile = indicator;
  okeyState.jokerRule = { color: indicator.color, number: jokerNum };

  // پاککردنەوەی تەختەی یاریزان و پێدانی ١٥ پوول بۆ دەستپێک
  okeyState.rackSlots = new Array(RACK_TOTAL_SLOTS).fill(null);
  const myInitialTiles = fullDeck.splice(0, 15);
  myInitialTiles.forEach((t, i) => {
    const slotIdx = i < 8 ? i + 2 : RACK_COLS + (i - 8) + 2;
    okeyState.rackSlots[slotIdx] = t;
  });

  // پێدانی ١٤ پوول بە هەریەک لە ٣ بۆتەکان
  okeyState.bots.forEach(b => {
    b.tiles = fullDeck.splice(0, 14);
    b.discards = [];
  });

  okeyState.deck = fullDeck;
  okeyState.myDiscards = [];
  okeyState.turn = 0;
  okeyState.phase = 'play'; // یاریزان ١٥ پوولی هەیە، یەکسەر دەتوانێت ١ پوول فڕێ بدات
  okeyState.winner = null;

  evaluatePlayerRack();
  updateTurnBannerUI();
  playOkeyTileSound('draw');

  if (okeyScene) okeyScene.renderTable();
}

function updateTurnBannerUI(customMsg = null) {
  const el = document.getElementById('turnBanner');
  if (!el) return;

  if (customMsg) {
    el.textContent = customMsg;
    return;
  }

  if (okeyState.turn === 0) {
    if (okeyState.phase === 'draw') {
      el.textContent = '🟢 نۆرەی تۆیە: پوولێک لە ناوەڕاست یان لە فڕێدراوی لای ڕاست ڕابکێشە';
    } else {
      el.textContent = '🟡 نۆرەی تۆیە: پوولەکان ڕێک بخە و ١ پوول فڕێ بدە بۆ لای چەپ (یان بۆ ناوەڕاست بۆ کۆنکان)';
    }
  } else {
    const bot = okeyState.bots[okeyState.turn - 1];
    el.textContent = `⏳ نۆرەی ${bot.name}ـە...`;
  }
}

// ڕیزکردنی زیرەکی پوولەکان لەسەر تەختەی دوو-ڕیزی
function okeyAutoSortRack(mode = 'runs') {
  const allTiles = okeyState.rackSlots.filter(Boolean);
  if (allTiles.length === 0) return;

  okeyState.rackSlots = new Array(RACK_TOTAL_SLOTS).fill(null);
  const used = new Set();
  const placedGroups = [];

  if (mode === 'pairs') {
    // دۆزینەوەی جووتە هاوشێوەکان
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
    // ١. دۆزینەوەی زنجیرەی هەمان ڕەنگ (Runs)
    for (const color of OKEY_COLORS) {
      const byColor = allTiles
        .filter(t => !used.has(t.uid) && getEffectiveTileValue(t).color === color && !getEffectiveTileValue(t).isWild)
        .sort((a, b) => getEffectiveTileValue(a).number - getEffectiveTileValue(b).number);

      let seq = [];
      for (const tile of byColor) {
        const num = getEffectiveTileValue(tile).number;
        if (seq.length === 0) {
          seq.push(tile);
        } else {
          const prevNum = getEffectiveTileValue(seq[seq.length - 1]).number;
          if (num === prevNum + 1) {
            seq.push(tile);
          } else if (num > prevNum + 1) {
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

    // ٢. دۆزینەوەی سێتی هەمان ژمارە و ڕەنگ جیاواز (Sets)
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

  // پاشماوەی پوولەکان
  const leftovers = allTiles
    .filter(t => !used.has(t.uid))
    .sort((a, b) => {
      const ea = getEffectiveTileValue(a);
      const eb = getEffectiveTileValue(b);
      if (ea.isWild !== eb.isWild) return ea.isWild ? -1 : 1;
      return ea.color.localeCompare(eb.color) || ea.number - eb.number;
    });

  // دانانەوەی سێتەکان لە ڕیزی سەرەوە و خوارەوە بە بۆشایی ١ خانە لە نێوانیاندا
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
    col++; // خانەیەک بۆشایی لە نێوان دوو سێتدا
  }

  // دانانی پوولە تاکەکان لە ڕیزی دووەم لە لای چەپەوە
  for (const tile of leftovers) {
    let placed = false;
    for (let idx = RACK_TOTAL_SLOTS - 1; idx >= 0; idx--) {
      if (!okeyState.rackSlots[idx]) {
        okeyState.rackSlots[idx] = tile;
        placed = true;
        break;
      }
    }
    if (!placed) break;
  }

  playOkeyTileSound('clack');
  evaluatePlayerRack();
  if (okeyScene) okeyScene.renderTable();
}

// ڕاکێشانی پوول لە کۆمەڵەی ناوەڕاست
function okeyPlayerDrawFromDeck() {
  if (okeyState.turn !== 0 || okeyState.phase !== 'draw') return;
  if (okeyState.deck.length === 0) {
    okeyStartNewRound();
    return;
  }
  const drawn = okeyState.deck.pop();
  placeTileInFirstEmptySlot(drawn);
  okeyState.phase = 'play';
  playOkeyTileSound('draw');
  evaluatePlayerRack();
  updateTurnBannerUI();
  if (okeyScene) okeyScene.renderTable();
}

// هەڵگرتنەوەی پوولی فڕێدراوی یاریزانی لای ڕاست (Bot 3)
function okeyPlayerTakeRightDiscard() {
  if (okeyState.turn !== 0 || okeyState.phase !== 'draw') return;
  const rightBot = okeyState.bots[2];
  if (rightBot.discards.length === 0) return;

  const taken = rightBot.discards.pop();
  placeTileInFirstEmptySlot(taken);
  okeyState.phase = 'play';
  playOkeyTileSound('draw');
  evaluatePlayerRack();
  updateTurnBannerUI();
  if (okeyScene) okeyScene.renderTable();
}

function placeTileInFirstEmptySlot(tile) {
  // هەوڵدەدات لە خانەی بەتاڵی ڕیزی دووەم دایبنێت
  for (let i = RACK_COLS; i < RACK_TOTAL_SLOTS; i++) {
    if (!okeyState.rackSlots[i]) {
      okeyState.rackSlots[i] = tile;
      return;
    }
  }
  for (let i = 0; i < RACK_COLS; i++) {
    if (!okeyState.rackSlots[i]) {
      okeyState.rackSlots[i] = tile;
      return;
    }
  }
}

// فڕێدانی پوول لەلایەن یاریزانەوە
function okeyPlayerDiscardTile(slotIdx, isFinishingDrop = false) {
  if (okeyState.turn !== 0 || okeyState.phase !== 'play') return false;
  const tile = okeyState.rackSlots[slotIdx];
  if (!tile) return false;

  // ئەگەر فڕێیدایە ناوەڕاست بۆ تەواوکردن (کۆنکان / ئۆکەی)
  const checkWithoutThis = evaluatePlayerRack(tile.uid);
  if (isFinishingDrop) {
    if (!checkWithoutThis.canWin14) {
      updateTurnBannerUI('⚠️ هێشتا هەموو ١٤ پوولەکەت نەبوونەتە سێتی تەواو! بۆ فڕێدانی ئاسایی بیخەرە گۆشەی خوارەوەی چەپ');
      return false;
    }
    // بردنەوەی یاری!
    okeyState.rackSlots[slotIdx] = null;
    okeyState.winner = 'player';
    playOkeyTileSound('win');
    showOkeyWinModal(true, 'پیرۆزە! هەموو ١٤ پوولەکەت کردە سێتی دروست و بە کۆنکان یارییەکەت بردەوە!');
    return true;
  }

  // فڕێدانی ئاسایی بۆ لای چەپ
  okeyState.rackSlots[slotIdx] = null;
  okeyState.myDiscards.push(tile);
  playOkeyTileSound('clack');

  // ئەگەر ١٤ پوولەکەی تری تەواو بوون، تەنانەت بە فڕێدانی ئاساییش دەیباتەوە
  evaluatePlayerRack();
  if (okeyState.isAllValidToWin) {
    okeyState.winner = 'player';
    playOkeyTileSound('win');
    showOkeyWinModal(true, 'ئۆکەی شاهانە! هەموو پوولەکانت کردە سێتی تەواو!');
    return true;
  }

  okeyState.turn = 1;
  okeyState.phase = 'draw';
  updateTurnBannerUI();
  if (okeyScene) okeyScene.renderTable();
  setTimeout(runNextBotTurn, 700);
  return true;
}

// زیرەکی دەستکردی ٣ بۆتەکان
function runNextBotTurn() {
  if (okeyState.winner || okeyState.turn === 0) return;

  const botIdx = okeyState.turn - 1;
  const bot = okeyState.bots[botIdx];

  if (okeyState.deck.length === 0) {
    showOkeyWinModal(false, 'پوولەکانی ناوەڕاست تەواو بوون و کەس کۆنکانی نەکرد!');
    return;
  }

  // بۆت پوولێک ڕادەکێشێت
  const drawn = okeyState.deck.pop();
  bot.tiles.push(drawn);

  // هەڵبژاردنی پوولێکی تاک بۆ فڕێدان (ئۆکەی فڕێ نادات)
  let discardIdx = bot.tiles.findIndex(t => !isRealOkeyJoker(t));
  if (discardIdx === -1) discardIdx = 0;
  const discarded = bot.tiles.splice(discardIdx, 1)[0];
  bot.discards.push(discarded);

  playOkeyTileSound('clack');

  // پشکنینی نۆرەی دواتر
  if (okeyState.turn < 3) {
    okeyState.turn++;
    updateTurnBannerUI();
    if (okeyScene) okeyScene.renderTable();
    setTimeout(runNextBotTurn, 700);
  } else {
    okeyState.turn = 0;
    okeyState.phase = 'draw';
    updateTurnBannerUI();
    if (okeyScene) okeyScene.renderTable();
  }
}

function showOkeyWinModal(iWon, message) {
  const modal = document.getElementById('okeyWinModal');
  document.getElementById('winModalIcon').textContent = iWon ? '🏆' : '🎲';
  document.getElementById('winModalTitle').textContent = iWon ? 'ئۆکەی شاهانە!' : 'کۆتایی دەستەکە';
  document.getElementById('winModalDesc').textContent = message;
  modal.classList.remove('hidden');
}

// ============================================================================
// PHASER 3 SCENE - ROYAL OKEY 4K TABLE & INTERACTIVE 2-ROW RACK
// ============================================================================
class RoyalOkeyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RoyalOkeyScene' });
    this.slotRects = [];
    this.leftDiscardZone = null;
    this.centerFinishZone = null;
    this.rightPickupZone = null;
  }

  preload() {
    this.load.image('okey_custom_bg', 'images.png/okay-bg.png');
  }

  create() {
    okeyScene = this;
    this.bgLayer = this.add.container(0, 0);
    this.tableLayer = this.add.container(0, 0);
    this.rackLayer = this.add.container(0, 0);
    this.dragLayer = this.add.container(0, 0);

    this.scale.on('resize', () => this.renderTable());
    okeyStartNewRound();
  }

  drawRoyalBackground(w, h) {
    this.bgLayer.removeAll(true);

    if (this.textures.exists('okey_custom_bg') && this.textures.get('okey_custom_bg').key !== '__MISSING') {
      const img = this.add.image(w / 2, h / 2, 'okey_custom_bg');
      const scale = Math.max(w / img.width, h / img.height);
      img.setScale(scale).setAlpha(0.92);
      this.bgLayer.add(img);

      // تاریککردنی نەرمی ناوەڕاست بۆ زەقبوونەوەی پوولەکان
      const overlay = this.add.graphics();
      overlay.fillStyle(0x070314, 0.32);
      overlay.fillRect(0, 0, w, h);
      this.bgLayer.add(overlay);
    } else {
      // مێزی شاهانەی مۆر و زێڕین (ئەگەر وێنەکە بار نەکرابوو)
      const gfx = this.add.graphics();
      gfx.fillGradientStyle(0x13072e, 0x13072e, 0x060212, 0x060212, 1);
      gfx.fillRect(0, 0, w, h);

      gfx.fillStyle(0x2e1065, 0.7);
      gfx.fillRoundedRect(24, 52, w - 48, h - 68, 28);
      gfx.lineStyle(3, 0xfacc15, 0.75);
      gfx.strokeRoundedRect(24, 52, w - 48, h - 68, 28);
      this.bgLayer.add(gfx);
    }
  }

  // دروستکردنی پوولێکی ئۆکەی عاجی ٣ ڕەهەندی بە ژمارە و چاڵی ڕەنگاوڕەنگ
  createOkeyTileContainer(tile, tileW, tileH, isHighlighted = false) {
    const c = this.add.container(0, 0);
    const rad = Math.max(7, Math.round(tileW * 0.16));

    const g = this.add.graphics();

    // سێبەری ژێر پوولەکە
    g.fillStyle(0x000000, 0.48);
    g.fillRoundedRect(-tileW / 2 + 2, -tileH / 2 + 4, tileW, tileH, rad);

    // قەبارەی ٣ ڕەهەندی بنکەی عاجی
    g.fillStyle(0xd6ccb8, 1);
    g.fillRoundedRect(-tileW / 2, -tileH / 2 + 3, tileW, tileH, rad);

    // ڕووی سەرەوەی پوولە عاجییەکە
    g.fillStyle(0xfffdf7, 1);
    g.fillRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH - 2, rad);

    // چوارچێوەی زێڕین/سەوز ئەگەر لەناو سێتێکی دروستدا بێت
    if (isHighlighted) {
      g.lineStyle(2.6, 0x10b981, 1);
      g.strokeRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH - 2, rad);
    } else {
      g.lineStyle(1.2, 0xe2d9c5, 1);
      g.strokeRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH - 2, rad);
    }
    c.add(g);

    const isJoker = isRealOkeyJoker(tile);

    if (tile.isFalseJoker) {
      // پوولی جۆکەری ساختە (نەخشی چیا و خۆری کوردستان)
      const star = this.add.text(0, -tileH * 0.1, '☀️', {
        fontSize: `${Math.round(tileW * 0.44)}px`
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

      // ژمارەی سەر پوولەکە
      const numTxt = this.add.text(0, -tileH * 0.14, String(tile.number), {
        fontFamily: 'Arial Black, Vazirmatn, sans-serif',
        fontSize: `${Math.round(tileW * 0.5)}px`,
        fontStyle: 'bold',
        color: hex
      }).setOrigin(0.5);

      // بازنە ڕەنگدارەکەی خوارەوەی پوولی ئۆکەی
      const dot = this.add.graphics();
      const dotColorInt = Phaser.Display.Color.HexStringToColor(hex).color;
      dot.fillStyle(dotColorInt, 1);
      dot.fillCircle(0, tileH * 0.22, Math.max(4, tileW * 0.11));
      dot.lineStyle(1, 0x000000, 0.18);
      dot.strokeCircle(0, tileH * 0.22, Math.max(4, tileW * 0.11));

      c.add([numTxt, dot]);

      // تاجی زێڕین لەسەر پوولی ئۆکەی ڕاستەقینە
      if (isJoker) {
        const crown = this.add.text(tileW * 0.28, -tileH * 0.33, '👑', {
          fontSize: `${Math.round(tileW * 0.25)}px`
        }).setOrigin(0.5);
        c.add(crown);
      }
    }

    c.setSize(tileW, tileH);
    return c;
  }

  // دروستکردنی کارتی پڕۆفایلی ٣ بۆتەکان وەک وێنەی ئۆنلاینەکە
  drawBotBadge(x, y, bot, isActiveTurn) {
    const grp = this.add.container(x, y);
    const bw = 152;
    const bh = 54;

    const bg = this.add.graphics();
    bg.fillStyle(0x110926, 0.88);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 16);
    bg.lineStyle(isActiveTurn ? 2.5 : 1.3, isActiveTurn ? 0x22c55e : 0xfacc15, isActiveTurn ? 1 : 0.55);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 16);

    const avatarCircle = this.add.circle(bw / 2 - 26, 0, 18, 0x4c1d95);
    avatarCircle.setStrokeStyle(1.5, 0xfacc15);
    const avatarIcon = this.add.text(bw / 2 - 26, 0, '👤', { fontSize: '18px' }).setOrigin(0.5);

    // ژمارەی پوولەکانی دەستی
    const countBadge = this.add.circle(bw / 2 - 12, -16, 10, 0xdc2626);
    const countTxt = this.add.text(bw / 2 - 12, -16, String(bot.tiles.length), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const nameTxt = this.add.text(bw / 2 - 52, -10, bot.name, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const rankTxt = this.add.text(bw / 2 - 52, 10, `${bot.rank} • ${bot.elo}`, {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '10px',
      color: '#fde047'
    }).setOrigin(1, 0.5);

    grp.add([bg, avatarCircle, avatarIcon, countBadge, countTxt, nameTxt, rankTxt]);
    this.tableLayer.add(grp);
  }

  renderTable() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.drawRoyalBackground(w, h);
    this.tableLayer.removeAll(true);
    this.rackLayer.removeAll(true);
    this.slotRects = [];

    // قەبارەی گونجاوی تەختەی دوو-ڕیزی لە خوارەوەی شاشە
    const rackMaxW = Math.min(w - 190, 920);
    const rackW = Math.max(rackMaxW, Math.min(w - 24, 520));
    const slotW = Math.floor((rackW - 28) / RACK_COLS);
    const tileW = Math.max(30, slotW - 3);
    const tileH = Math.round(tileW * 1.38);
    const rackH = tileH * 2 + 28;
    const rackX = (w - rackW) / 2;
    const rackY = h - rackH - 10;

    // ١. کێشانی پڕۆفایلی ٣ یاریزانەکەی تر (چەپ، سەرەوە، ڕاست)
    this.drawBotBadge(94, h * 0.34, okeyState.bots[0], okeyState.turn === 1); // چەپ
    this.drawBotBadge(w / 2, 78, okeyState.bots[1], okeyState.turn === 2);    // سەرەوە
    this.drawBotBadge(w - 94, h * 0.34, okeyState.bots[2], okeyState.turn === 3); // ڕاست

    // ٢. ناوەڕاستی مێزەکە (خانەی فڕێدان/کۆنکان + پوولی پیشاندەر + کۆمەڵە پوولی ڕاکێشان)
    const centerY = Math.max(155, (rackY + 85) / 2);
    const centerBoxW = tileW * 4.4 + 44;
    const centerBoxH = tileH + 38;

    const cPanel = this.add.graphics();
    cPanel.fillStyle(0x0c061c, 0.82);
    cPanel.fillRoundedRect(w / 2 - centerBoxW / 2, centerY - centerBoxH / 2, centerBoxW, centerBoxH, 20);
    cPanel.lineStyle(2, 0xfacc15, 0.65);
    cPanel.strokeRoundedRect(w / 2 - centerBoxW / 2, centerY - centerBoxH / 2, centerBoxW, centerBoxH, 20);
    this.tableLayer.add(cPanel);

    // ا) خانەی کۆنکان / تەواوکردن لە لای چەپی ناوەڕاست
    const finishX = w / 2 - tileW * 1.45;
    const fBox = this.add.graphics();
    fBox.fillStyle(0x2e1065, 0.65);
    fBox.fillRoundedRect(finishX - tileW / 2 - 4, centerY - tileH / 2 - 4, tileW + 8, tileH + 8, 10);
    fBox.lineStyle(1.8, okeyState.isAllValidToWin ? 0x22c55e : 0xa855f7, 0.9);
    fBox.strokeRoundedRect(finishX - tileW / 2 - 4, centerY - tileH / 2 - 4, tileW + 8, tileH + 8, 10);
    const fLbl = this.add.text(finishX, centerY - tileH / 2 - 14, 'کۆنکان', {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#fde047'
    }).setOrigin(0.5);
    const fIcon = this.add.text(finishX, centerY, '👑', { fontSize: '20px' }).setOrigin(0.5).setAlpha(0.55);
    this.tableLayer.add([fBox, fLbl, fIcon]);
    this.centerFinishZone = new Phaser.Geom.Rectangle(finishX - tileW, centerY - tileH, tileW * 2, tileH * 2);

    // ب) پوولی پیشاندەر (Indicator) لە ناوەڕاست
    if (okeyState.indicatorTile) {
      const indTile = this.createOkeyTileContainer(okeyState.indicatorTile, tileW, tileH, false);
      indTile.setPosition(w / 2, centerY);
      const jLbl = this.add.text(w / 2, centerY + tileH / 2 + 11, `ئۆکەی: ${okeyState.jokerRule.number}`, {
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fef08a'
      }).setOrigin(0.5);
      this.tableLayer.add([indTile, jLbl]);
    }

    // ج) کۆمەڵە پوولەکانی ڕاکێشان (Deck Stack) لە لای ڕاستی ناوەڕاست
    const deckX = w / 2 + tileW * 1.45;
    const deckGfx = this.add.graphics();
    deckGfx.fillStyle(0x991b1b, 1);
    deckGfx.fillRoundedRect(deckX - tileW / 2, centerY - tileH / 2, tileW, tileH, 9);
    deckGfx.lineStyle(2, 0xfacc15, 1);
    deckGfx.strokeRoundedRect(deckX - tileW / 2, centerY - tileH / 2, tileW, tileH, 9);

    const deckTitle = this.add.text(deckX, centerY, 'OKAY', {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.round(tileW * 0.28)}px`,
      fontStyle: 'bold',
      color: '#fde047'
    }).setOrigin(0.5).setRotation(-Math.PI / 2);

    const countBubble = this.add.circle(deckX + tileW * 0.42, centerY - tileH * 0.45, 13, 0xffffff);
    const countNum = this.add.text(deckX + tileW * 0.42, centerY - tileH * 0.45, String(okeyState.deck.length), {
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#0f172a'
    }).setOrigin(0.5);

    const deckHit = this.add.rectangle(deckX, centerY, tileW + 12, tileH + 12, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    deckHit.on('pointerup', () => okeyPlayerDrawFromDeck());

    this.tableLayer.add([deckGfx, deckTitle, countBubble, countNum, deckHit]);

    // ٣. چوار گۆشەی پوولە فڕێدراوەکان (Discards)
    const leftDiscardPos = { x: Math.max(150, rackX + 45), y: rackY - tileH * 0.72 };
    const topLeftDiscardPos = { x: Math.max(175, rackX + 75), y: centerY - tileH * 0.65 };
    const topRightDiscardPos = { x: Math.min(w - 175, rackX + rackW - 75), y: centerY - tileH * 0.65 };
    const rightDiscardPos = { x: Math.min(w - 150, rackX + rackW - 45), y: rackY - tileH * 0.72 };

    // خانەی فڕێدانی یاریزان (خوارەوەی چەپ)
    this.drawDiscardSlot(leftDiscardPos.x, leftDiscardPos.y, tileW, tileH, okeyState.myDiscards, 'فڕێدانی تۆ', false);
    this.leftDiscardZone = new Phaser.Geom.Rectangle(leftDiscardPos.x - tileW, leftDiscardPos.y - tileH, tileW * 2, tileH * 2);

    // خانەی فڕێدانی بۆتی ١ و ٢
    this.drawDiscardSlot(topLeftDiscardPos.x, topLeftDiscardPos.y, tileW * 0.88, tileH * 0.88, okeyState.bots[0].discards, '', false);
    this.drawDiscardSlot(topRightDiscardPos.x, topRightDiscardPos.y, tileW * 0.88, tileH * 0.88, okeyState.bots[1].discards, '', false);

    // خانەی فڕێدانی بۆتی ٣ (لای ڕاست - یاریزان دەتوانێت هەڵیبگرێتەوە)
    const canPickRight = okeyState.turn === 0 && okeyState.phase === 'draw' && okeyState.bots[2].discards.length > 0;
    this.drawDiscardSlot(rightDiscardPos.x, rightDiscardPos.y, tileW, tileH, okeyState.bots[2].discards, 'هەڵگرتنەوە', canPickRight);

    // ٤. تەختەی دارینی دوو-ڕیزی شاهانەی یاریزان لە خوارەوە
    const rackGfx = this.add.graphics();
    // سێبەری تەختە
    rackGfx.fillStyle(0x000000, 0.65);
    rackGfx.fillRoundedRect(rackX + 4, rackY + 6, rackW, rackH, 18);

    // دارگوێزی شاهانەی تەختە
    rackGfx.fillGradientStyle(0x5c2d16, 0x5c2d16, 0x2b1206, 0x2b1206, 1);
    rackGfx.fillRoundedRect(rackX, rackY, rackW, rackH, 18);
    rackGfx.lineStyle(2.8, 0xfacc15, 0.85);
    rackGfx.strokeRoundedRect(rackX, rackY, rackW, rackH, 18);

    // هێڵی جیاکەرەوەی ناوەڕاستی دوو ڕیزەکە
    rackGfx.fillStyle(0x1a0903, 0.9);
    rackGfx.fillRect(rackX + 10, rackY + rackH / 2 - 2, rackW - 20, 5);
    this.rackLayer.add(rackGfx);

    // دروستکردنی ٢٨ خانەکە و پوولەکانی ناوی
    const startX = rackX + (rackW - RACK_COLS * slotW) / 2 + slotW / 2;
    const rowY0 = rackY + 11 + tileH / 2;
    const rowY1 = rackY + 17 + tileH * 1.5;

    for (let r = 0; r < RACK_ROWS; r++) {
      for (let c = 0; c < RACK_COLS; c++) {
        const idx = r * RACK_COLS + c;
        const cx = startX + c * slotW;
        const cy = r === 0 ? rowY0 : rowY1;

        // خانەی تاریکی ژێر پوول
        const slotBg = this.add.graphics();
        slotBg.fillStyle(0x140803, 0.65);
        slotBg.fillRoundedRect(cx - tileW / 2, cy - tileH / 2, tileW, tileH, 7);
        this.rackLayer.add(slotBg);

        const rect = new Phaser.Geom.Rectangle(cx - slotW / 2, cy - tileH / 2 - 4, slotW, tileH + 8);
        this.slotRects.push({ idx, cx, cy, rect });

        const tileData = okeyState.rackSlots[idx];
        if (tileData) {
          const isValid = okeyState.validTileIds.has(tileData.uid);
          const tileSprite = this.createOkeyTileContainer(tileData, tileW, tileH, isValid);
          tileSprite.setPosition(cx, cy);
          tileSprite.setInteractive({ draggable: true, useHandCursor: true });

          this.input.setDraggable(tileSprite);

          tileSprite.on('dragstart', () => {
            playOkeyTileSound('clack');
            this.dragLayer.add(tileSprite);
            tileSprite.setScale(1.12);
          });

          tileSprite.on('drag', (pointer, dragX, dragY) => {
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
  }

  drawDiscardSlot(x, y, tw, th, pile, label, clickable) {
    const g = this.add.graphics();
    g.fillStyle(0x120924, 0.55);
    g.fillRoundedRect(x - tw / 2 - 4, y - th / 2 - 4, tw + 8, th + 8, 10);
    g.lineStyle(1.6, clickable ? 0x22c55e : 0xfacc15, clickable ? 1 : 0.45);
    g.strokeRoundedRect(x - tw / 2 - 4, y - th / 2 - 4, tw + 8, th + 8, 10);
    this.tableLayer.add(g);

    if (label) {
      const txt = this.add.text(x, y + th / 2 + 12, label, {
        fontFamily: 'Vazirmatn, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: clickable ? '#4ade80' : '#cbd5e1'
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
    // ١. پشکنینی فڕێدان بۆ خانەی کۆنکان لە ناوەڕاست
    if (this.centerFinishZone && this.centerFinishZone.contains(dropX, dropY)) {
      if (okeyPlayerDiscardTile(fromSlotIdx, true)) return;
    }

    // ٢. پشکنینی فڕێدانی ئاسایی بۆ گۆشەی چەپ
    if (this.leftDiscardZone && this.leftDiscardZone.contains(dropX, dropY)) {
      if (okeyPlayerDiscardTile(fromSlotIdx, false)) return;
    }

    // ٣. جێگۆڕکێ یان گواستنەوە بۆ یەکێک لە ٢٨ خانەکەی تەختەکە
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

    this.renderTable();
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
  const stage = document.getElementById('okeyPhaserStage');
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