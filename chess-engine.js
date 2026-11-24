// ============================================================================
// YARI KURDI - PRO CHESS ENGINE (PIXI.JS v7 @ 120FPS + STOCKFISH + ONLINE)
// ============================================================================

let selectedBaseTime = 180, selectedIncrement = 0;
function selectTime(base, inc, btn) {
  selectedBaseTime = base;
  selectedIncrement = inc;
  document.querySelectorAll('.time-btn').forEach(b => {
    b.classList.remove('bg-yellow-500', 'text-[#050b18]');
    b.classList.add('bg-[#0d1933]', 'text-slate-300');
  });
  if (btn) {
    btn.classList.add('bg-yellow-500', 'text-[#050b18]');
    btn.classList.remove('bg-[#0d1933]', 'text-slate-300');
  }
}

let board = [], turn = 'w', myColor = 'w', isOnlineGame = false, gameActive = false;
let selectedSq = null, legalMoves = [], lastMove = null, premove = null;
let castling = { wK: true, wQ: true, bK: true, bQ: true }, epTarget = null;
let whiteTime = 180, blackTime = 180, clockInterval = null, moveList = [];
let opponentInfo = { id: null, name: 'Stockfish AI', elo: 2500, avatar: '' };
let roomStateRef = null, roomStateListener = null;

// PixiJS v7 120FPS Variables
let chessPixiApp = null;
let boardLayer = null, highlightLayer = null, piecesLayer = null, arrowLayer = null, fxLayer = null;
const chessTextures = new Map();
const chessTweens = [];
let chessArrows = [];
let rightClickStart = null;
let pieceSpritesMap = {};
let animHideKey = null;

let dragState = {
  active: false,
  fromR: -1,
  fromC: -1,
  piece: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  vx: 0,
  isDragging: false,
  ghost: null,
  shadow: null
};

// ============================================================================
// ١. دروستکردنی تێکسچەری زۆر ڕوون (HD 256x256) بۆ داشەکان لەسەر GPU
// ============================================================================
function bakeRoyalChessTextures() {
  if (chessTextures.size > 0) return;
  const SIZE = 256;
  const pieces = ['K', 'Q', 'R', 'B', 'N', 'P'];
  const colors = ['w', 'b'];

  for (const col of colors) {
    const isW = col === 'w';
    const fillGradTop = isW ? '#ffffff' : '#334155';
    const fillGradBot = isW ? '#e2e8f0' : '#0f172a';
    const strokeCol = isW ? '#1e293b' : '#facc15';
    const detailCol = isW ? '#334155' : '#fde047';

    for (const type of pieces) {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.save();

      // سێبەری ژێر داشەکە
      ctx.beginPath();
      ctx.ellipse(128, 224, 74, 15, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
      ctx.fill();

      const grad = ctx.createLinearGradient(0, 30, 0, 225);
      grad.addColorStop(0, fillGradTop);
      grad.addColorStop(1, fillGradBot);

      ctx.fillStyle = grad;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = isW ? 7 : 6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // بنکەی هاوبەشی داشەکان (Base)
      const drawBase = (wScale = 1) => {
        ctx.beginPath();
        ctx.roundRect(128 - 68 * wScale, 198, 136 * wScale, 22, 10);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(128 - 54 * wScale, 180, 108 * wScale, 20, 8);
        ctx.fill();
        ctx.stroke();
      };

      if (type === 'P') {
        drawBase(0.84);
        ctx.beginPath();
        ctx.moveTo(92, 180);
        ctx.quadraticCurveTo(106, 128, 112, 106);
        ctx.lineTo(144, 106);
        ctx.quadraticCurveTo(150, 128, 164, 180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(98, 96, 60, 14, 7);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(128, 70, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (type === 'R') {
        drawBase(0.95);
        ctx.beginPath();
        ctx.moveTo(86, 180);
        ctx.lineTo(96, 86);
        ctx.lineTo(160, 86);
        ctx.lineTo(170, 180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // تاجی قەڵا (Battlements)
        ctx.beginPath();
        ctx.moveTo(78, 86);
        ctx.lineTo(78, 48);
        ctx.lineTo(102, 48);
        ctx.lineTo(102, 66);
        ctx.lineTo(116, 66);
        ctx.lineTo(116, 48);
        ctx.lineTo(140, 48);
        ctx.lineTo(140, 66);
        ctx.lineTo(154, 66);
        ctx.lineTo(154, 48);
        ctx.lineTo(178, 48);
        ctx.lineTo(178, 86);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (type === 'N') {
        drawBase(0.95);
        ctx.beginPath();
        ctx.moveTo(84, 180);
        ctx.quadraticCurveTo(82, 120, 106, 86);
        ctx.lineTo(98, 46);
        ctx.lineTo(124, 62);
        ctx.quadraticCurveTo(166, 68, 178, 108);
        ctx.quadraticCurveTo(182, 126, 162, 132);
        ctx.lineTo(136, 124);
        ctx.quadraticCurveTo(148, 152, 168, 180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // چاوی ئەسپ
        ctx.beginPath();
        ctx.arc(136, 84, 6, 0, Math.PI * 2);
        ctx.fillStyle = detailCol;
        ctx.fill();
      } else if (type === 'B') {
        drawBase(0.92);
        ctx.beginPath();
        ctx.moveTo(88, 180);
        ctx.quadraticCurveTo(96, 132, 104, 114);
        ctx.lineTo(152, 114);
        ctx.quadraticCurveTo(160, 132, 168, 180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(128, 42);
        ctx.quadraticCurveTo(168, 76, 150, 114);
        ctx.lineTo(106, 114);
        ctx.quadraticCurveTo(88, 76, 128, 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(128, 32, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // هێڵی ناو فیل
        ctx.beginPath();
        ctx.moveTo(128, 66);
        ctx.lineTo(128, 96);
        ctx.moveTo(115, 80);
        ctx.lineTo(141, 80);
        ctx.strokeStyle = detailCol;
        ctx.lineWidth = 6;
        ctx.stroke();
      } else if (type === 'Q') {
        drawBase(1.0);
        ctx.beginPath();
        ctx.moveTo(86, 180);
        ctx.lineTo(68, 72);
        ctx.lineTo(102, 112);
        ctx.lineTo(128, 62);
        ctx.lineTo(154, 112);
        ctx.lineTo(188, 72);
        ctx.lineTo(170, 180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // گەوهەرەکانی سەر تاجی شاژن
        const tips = [[68, 64], [128, 52], [188, 64]];
        for (const [tx, ty] of tips) {
          ctx.beginPath();
          ctx.arc(tx, ty, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (type === 'K') {
        drawBase(1.02);
        ctx.beginPath();
        ctx.moveTo(84, 180);
        ctx.quadraticCurveTo(76, 108, 102, 86);
        ctx.lineTo(154, 86);
        ctx.quadraticCurveTo(180, 108, 172, 180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // خاچی سەر تاجی پاشا
        ctx.beginPath();
        ctx.roundRect(121, 24, 14, 52, 4);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(104, 40, 48, 14, 4);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
      chessTextures.set(col + type, PIXI.Texture.from(canvas));
    }
  }
}

// ============================================================================
// ٢. سیستمی 120FPS PixiJS v7 Ticker و ئەنیمەیشنی خلیسکانی داشەکان
// ============================================================================
function addChessTween(cfg) {
  chessTweens.push({
    target: cfg.target,
    from: { ...cfg.from },
    to: { ...cfg.to },
    duration: cfg.duration || 130,
    elapsed: 0,
    ease: cfg.ease || (t => 1 - Math.pow(1 - t, 3)),
    onComplete: cfg.onComplete || null
  });
}

function updateChessTicker(deltaMS) {
  for (let i = chessTweens.length - 1; i >= 0; i--) {
    const tw = chessTweens[i];
    tw.elapsed += deltaMS;
    const raw = Math.min(1, tw.elapsed / tw.duration);
    const p = tw.ease(raw);

    if (tw.target && !tw.target.destroyed) {
      for (const k in tw.to) {
        tw.target[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * p;
      }
    }

    if (raw >= 1) {
      chessTweens.splice(i, 1);
      if (tw.onComplete) tw.onComplete();
    }
  }

  // فیزیای لاربوونەوەی داش لە کاتی ڕاکێشاندا
  if (dragState.active && dragState.isDragging && dragState.ghost && !dragState.ghost.destroyed) {
    dragState.vx *= 0.82;
    const targetRot = Math.max(-0.35, Math.min(0.35, dragState.vx * 0.02));
    dragState.ghost.rotation += (targetRot - dragState.ghost.rotation) * 0.35;
    if (dragState.shadow && !dragState.shadow.destroyed) {
      dragState.shadow.position.set(dragState.ghost.x + 8, dragState.ghost.y + 14);
    }
  }
}

function getSqSize() {
  return chessPixiApp ? chessPixiApp.screen.width / 8 : 50;
}

function xyToSq(x, y) {
  const sqSize = getSqSize();
  const col = Math.floor(x / sqSize);
  const row = Math.floor(y / sqSize);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return {
    r: myColor === 'w' ? row : 7 - row,
    c: myColor === 'w' ? col : 7 - col
  };
}

function sqToCenter(r, c) {
  const sqSize = getSqSize();
  const dispR = myColor === 'w' ? r : 7 - r;
  const dispC = myColor === 'w' ? c : 7 - c;
  return { x: dispC * sqSize + sqSize / 2, y: dispR * sqSize + sqSize / 2, sqSize };
}

function initChessPixi() {
  const container = document.getElementById('chessBoard');
  if (!container) return;

  bakeRoyalChessTextures();

  if (!chessPixiApp) {
    container.innerHTML = '';
    const wrapper = document.getElementById('boardWrapper');
    const dim = (wrapper && wrapper.clientWidth > 100) ? wrapper.clientWidth : Math.min(window.innerWidth - 38, 442);

    chessPixiApp = new PIXI.Application({
      width: dim,
      height: dim,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      powerPreference: 'high-performance'
    });

    container.appendChild(chessPixiApp.view);
    chessPixiApp.view.addEventListener('contextmenu', e => e.preventDefault());

    boardLayer = new PIXI.Graphics();
    highlightLayer = new PIXI.Graphics();
    piecesLayer = new PIXI.Container();
    arrowLayer = new PIXI.Graphics();
    fxLayer = new PIXI.Container();

    chessPixiApp.stage.addChild(boardLayer, highlightLayer, piecesLayer, arrowLayer, fxLayer);

    setupPixiBoardEvents();

    chessPixiApp.ticker.maxFPS = 120;
    chessPixiApp.ticker.add(() => {
      updateChessTicker(chessPixiApp.ticker.deltaMS);
    });

    window.addEventListener('resize', () => {
      if (!chessPixiApp || !wrapper) return;
      const newDim = wrapper.clientWidth;
      if (newDim > 100) {
        chessPixiApp.renderer.resize(newDim, newDim);
        syncBoardVisual();
      }
    });
  }

  syncBoardVisual();
}

function setupPixiBoardEvents() {
  const stage = chessPixiApp.stage;
  stage.eventMode = 'static';
  stage.hitArea = new PIXI.Rectangle(0, 0, 2000, 2000);

  stage.on('pointerdown', (e) => {
    if (!gameActive) return;
    const pos = e.global;
    const sq = xyToSq(pos.x, pos.y);
    if (!sq) return;

    if (e.button === 2) {
      rightClickStart = sq;
      return;
    }

    if (chessArrows.length > 0) {
      chessArrows = [];
      drawChessArrows();
    }

    const p = board[sq.r][sq.c];

    if (p && p[0] === myColor) {
      if (premove) premove = null;
      selectedSq = sq;
      legalMoves = (turn === myColor) ? getLegalMovesForPiece(sq.r, sq.c) : getPremoveHintSquares(sq.r, sq.c);

      dragState = {
        active: true,
        fromR: sq.r,
        fromC: sq.c,
        piece: p,
        startX: pos.x,
        startY: pos.y,
        lastX: pos.x,
        vx: 0,
        isDragging: false,
        ghost: null,
        shadow: null
      };

      syncBoardVisual();
      return;
    }

    if (selectedSq) {
      handleDestinationAction(selectedSq.r, selectedSq.c, sq.r, sq.c);
    }
  });

  stage.on('pointermove', (e) => {
    if (!dragState.active || !gameActive) return;
    const pos = e.global;
    const dist = Math.hypot(pos.x - dragState.startX, pos.y - dragState.startY);

    if (dist > 6 && !dragState.isDragging) {
      dragState.isDragging = true;
      const origKey = `${dragState.fromR}_${dragState.fromC}`;
      if (pieceSpritesMap[origKey]) pieceSpritesMap[origKey].alpha = 0.25;

      const sqSize = getSqSize();
      const sh = new PIXI.Graphics();
      sh.beginFill(0x000000, 0.35);
      sh.drawCircle(0, 0, sqSize * 0.36);
      sh.endFill();
      sh.position.set(pos.x + 8, pos.y + 14);
      fxLayer.addChild(sh);
      dragState.shadow = sh;

      const ghost = new PIXI.Sprite(chessTextures.get(dragState.piece));
      ghost.anchor.set(0.5);
      ghost.width = sqSize * 1.12;
      ghost.height = sqSize * 1.12;
      ghost.position.set(pos.x, pos.y);
      fxLayer.addChild(ghost);
      dragState.ghost = ghost;
    }

    if (dragState.isDragging && dragState.ghost) {
      dragState.vx = pos.x - dragState.lastX;
      dragState.lastX = pos.x;
      dragState.ghost.position.set(pos.x, pos.y);
    }
  });

  const endPointer = (e) => {
    if (rightClickStart) {
      const endSq = xyToSq(e.global.x, e.global.y);
      if (endSq && (endSq.r !== rightClickStart.r || endSq.c !== rightClickStart.c)) {
        chessArrows.push({ from: rightClickStart, to: endSq });
        drawChessArrows();
      }
      rightClickStart = null;
      return;
    }

    if (dragState.active) {
      const info = dragState;
      dragState = { active: false, fromR: -1, fromC: -1, piece: null, isDragging: false, ghost: null, shadow: null };

      if (info.ghost && !info.ghost.destroyed) info.ghost.destroy();
      if (info.shadow && !info.shadow.destroyed) info.shadow.destroy();

      const origKey = `${info.fromR}_${info.fromC}`;
      if (pieceSpritesMap[origKey]) pieceSpritesMap[origKey].alpha = 1;

      if (info.isDragging) {
        const dropSq = xyToSq(e.global.x, e.global.y);
        if (dropSq && (dropSq.r !== info.fromR || dropSq.c !== info.fromC)) {
          handleDestinationAction(info.fromR, info.fromC, dropSq.r, dropSq.c);
        } else {
          syncBoardVisual();
        }
      }
    }
  };

  stage.on('pointerup', endPointer);
  stage.on('pointerupoutside', endPointer);
}

function handleDestinationAction(fromR, fromC, toR, toC) {
  if (turn !== myColor) {
    if (fromR !== toR || fromC !== toC) {
      premove = { fromR, fromC, toR, toC };
      playChessSound('move');
    }
    selectedSq = null;
    legalMoves = [];
    syncBoardVisual();
    return;
  }

  const valid = getLegalMovesForPiece(fromR, fromC).some(m => m.toR === toR && m.toC === toC);
  if (valid) {
    executeMove(fromR, fromC, toR, toC, false);
  } else {
    selectedSq = null;
    legalMoves = [];
    syncBoardVisual();
  }
}

function syncBoardVisual() {
  if (!chessPixiApp) return;
  const sqSize = getSqSize();

  // ١. کێشانی چوارگۆشەکانی تەختە
  boardLayer.clear();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const r = myColor === 'w' ? i : 7 - i;
      const c = myColor === 'w' ? j : 7 - j;
      const isLight = (r + c) % 2 === 0;
      boardLayer.beginFill(isLight ? 0xe2e8f0 : 0x2c4c6e, 1);
      boardLayer.drawRect(j * sqSize, i * sqSize, sqSize, sqSize);
      boardLayer.endFill();
    }
  }

  // ٢. ڕەنگکردنی خانە گرنگەکان
  highlightLayer.clear();

  if (lastMove) {
    [{ r: lastMove.fromR, c: lastMove.fromC }, { r: lastMove.toR, c: lastMove.toC }].forEach(pos => {
      const dr = myColor === 'w' ? pos.r : 7 - pos.r;
      const dc = myColor === 'w' ? pos.c : 7 - pos.c;
      highlightLayer.beginFill(0xfacc15, 0.36);
      highlightLayer.drawRect(dc * sqSize, dr * sqSize, sqSize, sqSize);
      highlightLayer.endFill();
    });
  }

  if (selectedSq) {
    const dr = myColor === 'w' ? selectedSq.r : 7 - selectedSq.r;
    const dc = myColor === 'w' ? selectedSq.c : 7 - selectedSq.c;
    highlightLayer.beginFill(0xd4af37, 0.62);
    highlightLayer.drawRect(dc * sqSize, dr * sqSize, sqSize, sqSize);
    highlightLayer.endFill();
  }

  if (premove) {
    [{ r: premove.fromR, c: premove.fromC, a: 0.55 }, { r: premove.toR, c: premove.toC, a: 0.72 }].forEach(pos => {
      const dr = myColor === 'w' ? pos.r : 7 - pos.r;
      const dc = myColor === 'w' ? pos.c : 7 - pos.c;
      highlightLayer.beginFill(0xef4444, pos.a);
      highlightLayer.drawRect(dc * sqSize, dr * sqSize, sqSize, sqSize);
      highlightLayer.endFill();
    });
  }

  const kingCheck = isKingInCheck(turn) ? findKing(turn) : null;
  if (kingCheck) {
    const dr = myColor === 'w' ? kingCheck.r : 7 - kingCheck.r;
    const dc = myColor === 'w' ? kingCheck.c : 7 - kingCheck.c;
    highlightLayer.beginFill(0xdc2626, 0.8);
    highlightLayer.drawRect(dc * sqSize, dr * sqSize, sqSize, sqSize);
    highlightLayer.endFill();
  }

  const isPremoveMode = (turn !== myColor);
  legalMoves.forEach(m => {
    const { x, y } = sqToCenter(m.toR, m.toC);
    if (isPremoveMode) {
      highlightLayer.beginFill(0xf87171, 0.55);
      highlightLayer.drawCircle(x, y, sqSize * 0.14);
      highlightLayer.endFill();
    } else if (board[m.toR][m.toC]) {
      highlightLayer.lineStyle(4, 0xef4444, 0.85);
      highlightLayer.drawCircle(x, y, sqSize * 0.42);
      highlightLayer.lineStyle(0);
    } else {
      highlightLayer.beginFill(0x10b981, 0.85);
      highlightLayer.drawCircle(x, y, sqSize * 0.16);
      highlightLayer.endFill();
    }
  });

  // ٣. دانانی داشەکان
  piecesLayer.removeChildren();
  pieceSpritesMap = {};

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const key = `${r}_${c}`;
      if (animHideKey === key) continue;

      const { x, y } = sqToCenter(r, c);
      const sp = new PIXI.Sprite(chessTextures.get(p));
      sp.anchor.set(0.5);
      sp.width = sqSize * 0.88;
      sp.height = sqSize * 0.88;
      sp.position.set(x, y);
      piecesLayer.addChild(sp);
      pieceSpritesMap[key] = sp;
    }
  }

  // ٤. نوێکردنەوەی نووسینی نۆرە
  const baseTurnText = turn === 'w' ? 'نۆرەی سپییە' : 'نۆرەی ڕەشە';
  const turnEl = document.getElementById('turnIndicator');
  if (turnEl) {
    if (kingCheck) {
      turnEl.textContent = `⚠️ کش! (${baseTurnText})`;
      turnEl.className = 'text-xs font-extrabold text-red-400 animate-pulse';
    } else if (premove) {
      turnEl.textContent = `⚡ Premove ئامادەیە`;
      turnEl.className = 'text-xs font-extrabold text-rose-400';
    } else if (!isOnlineGame && turn !== myColor) {
      turnEl.textContent = `🧠 بۆت بیر دەکاتەوە...`;
      turnEl.className = 'text-xs font-extrabold text-purple-300 animate-pulse';
    } else {
      turnEl.textContent = baseTurnText;
      turnEl.className = 'text-xs font-bold text-yellow-300';
    }
  }

  drawChessArrows();
}

function animateSmoothPieceGlide(fromR, fromC, toR, toC, pieceKey) {
  if (!chessPixiApp) return;
  const start = sqToCenter(fromR, fromC);
  const end = sqToCenter(toR, toC);
  const sqSize = getSqSize();

  animHideKey = `${toR}_${toC}`;
  syncBoardVisual();

  const glideSp = new PIXI.Sprite(chessTextures.get(pieceKey));
  glideSp.anchor.set(0.5);
  glideSp.width = sqSize * 0.94;
  glideSp.height = sqSize * 0.94;
  glideSp.position.set(start.x, start.y);
  fxLayer.addChild(glideSp);

  addChessTween({
    target: glideSp,
    from: { x: start.x, y: start.y },
    to: { x: end.x, y: end.y },
    duration: 125,
    onComplete: () => {
      if (!glideSp.destroyed) glideSp.destroy();
      animHideKey = null;
      syncBoardVisual();
    }
  });
}

function drawChessArrows() {
  if (!arrowLayer) return;
  arrowLayer.clear();
  arrowLayer.lineStyle(7, 0x10b981, 0.85);
  chessArrows.forEach(a => {
    const p1 = sqToCenter(a.from.r, a.from.c);
    const p2 = sqToCenter(a.to.r, a.to.c);
    arrowLayer.moveTo(p1.x, p1.y);
    arrowLayer.lineTo(p2.x, p2.y);
    arrowLayer.beginFill(0x10b981, 0.95);
    arrowLayer.drawCircle(p2.x, p2.y, 8);
    arrowLayer.endFill();
  });
}

function clearArrows() {
  chessArrows = [];
  drawChessArrows();
}

// ============================================================================
// ٣. مەکینەی STOCKFISH + ٣ ئاستی زیرەکی بۆت (لاواز، ناوەند، زۆر بەهێز)
// ============================================================================
let sfWorker = null;
let sfReady = false;
let sfPendingCallback = null;

function initStockfishEngine() {
  if (sfWorker) return;
  fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
    .then(res => res.text())
    .then(code => {
      const blob = new Blob([code], { type: 'application/javascript' });
      sfWorker = new Worker(URL.createObjectURL(blob));
      sfWorker.onmessage = (e) => {
        const line = String(e.data || '');
        if (line === 'readyok') {
          sfReady = true;
        } else if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          const moveStr = parts[1];
          if (sfPendingCallback) {
            const cb = sfPendingCallback;
            sfPendingCallback = null;
            cb(moveStr);
          }
        }
      };
      sfWorker.postMessage('uci');
      sfWorker.postMessage('setoption name Skill Level value 20');
      sfWorker.postMessage('isready');
    })
    .catch(() => {
      sfReady = false;
    });
}

// گۆڕینی تەختەی ئێستا بۆ کۆدی استاندارد FEN بۆ Stockfish
function boardToFEN() {
  let fen = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) { fen += empty; empty = 0; }
        fen += p[0] === 'w' ? p[1].toUpperCase() : p[1].toLowerCase();
      }
    }
    if (empty > 0) fen += empty;
    if (r < 7) fen += '/';
  }

  fen += ` ${turn} `;

  let castleStr = '';
  if (castling.wK && board[7][4] === 'wK' && board[7][7] === 'wR') castleStr += 'K';
  if (castling.wQ && board[7][4] === 'wK' && board[7][0] === 'wR') castleStr += 'Q';
  if (castling.bK && board[0][4] === 'bK' && board[0][7] === 'bR') castleStr += 'k';
  if (castling.bQ && board[0][4] === 'bK' && board[0][0] === 'bR') castleStr += 'q';
  fen += (castleStr || '-') + ' ';

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  if (epTarget) {
    fen += `${files[epTarget.c]}${8 - epTarget.r} `;
  } else {
    fen += '- ';
  }

  fen += `0 ${Math.floor(moveList.length / 2) + 1}`;
  return fen;
}

// خشتەی نرخ و شوێنی ستراتیژی داشەکان (Piece-Square Tables) بۆ هەڵسەنگاندنی قووڵ
const PIECE_VALUES = { P: 100, N: 320, B: 335, R: 500, Q: 950, K: 20000 };
const PST_PAWN = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 32, 32, 20, 10, 10],
  [ 5,  5, 10, 27, 27, 10,  5,  5],
  [ 0,  0,  0, 24, 24,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-22,-22, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0]
];
const PST_KNIGHT = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 12, 16, 16, 12,  0,-30],
  [-30,  5, 16, 22, 22, 16,  5,-30],
  [-30,  0, 16, 22, 22, 16,  0,-30],
  [-30,  5, 12, 16, 16, 12,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];
const PST_BISHOP = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  8, 12, 12,  8,  0,-10],
  [-10,  5,  5, 12, 12,  5,  5,-10],
  [-10,  0, 12, 12, 12, 12,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];
const PST_KING_MID = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 32, 12,  0,  0, 12, 32, 20]
];

function evaluateBoardPosition(forColor) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const col = p[0];
      const type = p[1];
      const pr = col === 'w' ? r : 7 - r;
      let val = PIECE_VALUES[type] || 0;

      if (type === 'P') val += PST_PAWN[pr][c];
      else if (type === 'N') val += PST_KNIGHT[pr][c];
      else if (type === 'B') val += PST_BISHOP[pr][c];
      else if (type === 'K') val += PST_KING_MID[pr][c];

      score += (col === forColor) ? val : -val;
    }
  }
  return score;
}

function getAllLegalMovesForSide(side) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === side) {
        const list = getLegalMovesForPiece(r, c);
        for (let i = 0; i < list.length; i++) {
          const m = list[i];
          const cap = board[m.toR][m.toC];
          const orderScore = cap ? (10 * PIECE_VALUES[cap[1]] - PIECE_VALUES[board[r][c][1]]) : 0;
          moves.push({ fromR: r, fromC: c, toR: m.toR, toC: m.toC, orderScore });
        }
      }
    }
  }
  moves.sort((a, b) => b.orderScore - a.orderScore);
  return moves;
}

function simulateFastMove(m) {
  const piece = board[m.fromR][m.fromC];
  const captured = board[m.toR][m.toC];
  let rookSwap = null;
  let epCaptured = null;

  if (piece[1] === 'P' && epTarget && m.toR === epTarget.r && m.toC === epTarget.c && !captured) {
    epCaptured = { r: m.fromR, c: m.toC, p: board[m.fromR][m.toC] };
    board[m.fromR][m.toC] = null;
  }

  if (piece[1] === 'K' && Math.abs(m.toC - m.fromC) === 2) {
    if (m.toC === 6) {
      rookSwap = { fromC: 7, toC: 5, row: m.fromR };
      board[m.fromR][5] = board[m.fromR][7];
      board[m.fromR][7] = null;
    } else if (m.toC === 2) {
      rookSwap = { fromC: 0, toC: 3, row: m.fromR };
      board[m.fromR][3] = board[m.fromR][0];
      board[m.fromR][0] = null;
    }
  }

  board[m.toR][m.toC] = piece;
  board[m.fromR][m.fromC] = null;
  if (piece === 'wP' && m.toR === 0) board[m.toR][m.toC] = 'wQ';
  if (piece === 'bP' && m.toR === 7) board[m.toR][m.toC] = 'bQ';

  return { piece, captured, rookSwap, epCaptured };
}

function undoFastMove(m, snap) {
  board[m.fromR][m.fromC] = snap.piece;
  board[m.toR][m.toC] = snap.captured;
  if (snap.epCaptured) {
    board[snap.epCaptured.r][snap.epCaptured.c] = snap.epCaptured.p;
  }
  if (snap.rookSwap) {
    board[snap.rookSwap.row][snap.rookSwap.fromC] = board[snap.rookSwap.row][snap.rookSwap.toC];
    board[snap.rookSwap.row][snap.rookSwap.toC] = null;
  }
}

// Quiescence Search (پشکنینی قووڵی گرتنی داشەکان تا هەڵەی تاکتیکی نەکات)
function quiescenceSearch(alpha, beta, side, qDepth = 0) {
  const standPat = evaluateBoardPosition(side);
  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;
  if (qDepth >= 3) return alpha;

  const opp = side === 'w' ? 'b' : 'w';
  const moves = getAllLegalMovesForSide(side).filter(m => board[m.toR][m.toC] !== null);

  for (const m of moves) {
    const snap = simulateFastMove(m);
    const score = -quiescenceSearch(-beta, -alpha, opp, qDepth + 1);
    undoFastMove(m, snap);

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// Negamax + Alpha-Beta Pruning
function negamaxSearch(depth, alpha, beta, side) {
  if (depth === 0) {
    return quiescenceSearch(alpha, beta, side, 0);
  }

  const moves = getAllLegalMovesForSide(side);
  if (moves.length === 0) {
    if (isKingInCheck(side)) return -90000 - depth * 100;
    return 0;
  }

  const opp = side === 'w' ? 'b' : 'w';
  let best = -Infinity;

  for (const m of moves) {
    const snap = simulateFastMove(m);
    const val = -negamaxSearch(depth - 1, -beta, -alpha, opp);
    undoFastMove(m, snap);

    if (val > best) best = val;
    if (val > alpha) alpha = val;
    if (alpha >= beta) break;
  }
  return best;
}

function findBestMoveLocalAI(depth, randomness = 0) {
  const moves = getAllLegalMovesForSide(turn);
  if (moves.length === 0) return null;

  const opp = turn === 'w' ? 'b' : 'w';
  const scored = [];

  for (const m of moves) {
    const snap = simulateFastMove(m);
    let score = -negamaxSearch(depth - 1, -Infinity, Infinity, opp);
    undoFastMove(m, snap);

    if (randomness > 0) {
      score += (Math.random() - 0.5) * randomness;
    }
    scored.push({ move: m, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

function makeBotMove() {
  if (!gameActive || isOnlineGame || turn === myColor) return;

  const level = Number(document.getElementById('botLevelSelect')?.value || 2);

  // ئاستی ١: لاواز (سەرەتایی)
  if (level === 1) {
    const chosen = findBestMoveLocalAI(1, 240);
    if (chosen) executeMove(chosen.fromR, chosen.fromC, chosen.toR, chosen.toC, false);
    return;
  }

  // ئاستی ٢: ناوەند (پڕۆفیشناڵ - Alpha-Beta Depth 2)
  if (level === 2) {
    const chosen = findBestMoveLocalAI(2, 35);
    if (chosen) executeMove(chosen.fromR, chosen.fromC, chosen.toR, chosen.toC, false);
    return;
  }

  // ئاستی ٣: زۆر بەهێز (Stockfish 2500+ Elo)
  if (sfWorker && sfReady) {
    let finished = false;
    const fallbackTimer = setTimeout(() => {
      if (!finished && gameActive && turn !== myColor) {
        finished = true;
        sfPendingCallback = null;
        const backup = findBestMoveLocalAI(3, 0);
        if (backup) executeMove(backup.fromR, backup.fromC, backup.toR, backup.toC, false);
      }
    }, 2400);

    sfPendingCallback = (bestMoveStr) => {
      if (finished || !gameActive || turn === myColor) return;
      finished = true;
      clearTimeout(fallbackTimer);

      if (bestMoveStr && bestMoveStr.length >= 4) {
        const fromC = bestMoveStr.charCodeAt(0) - 97;
        const fromR = 8 - parseInt(bestMoveStr[1], 10);
        const toC = bestMoveStr.charCodeAt(2) - 97;
        const toR = 8 - parseInt(bestMoveStr[3], 10);
        const promo = bestMoveStr[4] ? bestMoveStr[4].toUpperCase() : null;

        const isLegal = getLegalMovesForPiece(fromR, fromC).some(m => m.toR === toR && m.toC === toC);
        if (isLegal) {
          executeMove(fromR, fromC, toR, toC, false, promo);
          return;
        }
      }

      const backup = findBestMoveLocalAI(3, 0);
      if (backup) executeMove(backup.fromR, backup.fromC, backup.toR, backup.toC, false);
    };

    const fen = boardToFEN();
    sfWorker.postMessage(`position fen ${fen}`);
    sfWorker.postMessage('go movetime 650');
  } else {
    // ئەگەر ئینتەرنێت نەبێت، مەکینەی قووڵی ناوخۆیی کار دەکات
    const chosen = findBestMoveLocalAI(3, 0);
    if (chosen) executeMove(chosen.fromR, chosen.fromC, chosen.toR, chosen.toC, false);
  }
}

// ============================================================================
// ٤. یاساکانی یاری، کاتژمێر و ئۆنڵاین
// ============================================================================
function getPremoveHintSquares(r, c) {
  const p = board[r][c];
  if (!p) return [];
  const color = p[0], type = p[1], moves = [];
  const inBounds = (nr, nc) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1, startRow = color === 'w' ? 6 : 1;
    if (inBounds(r + dir, c)) moves.push({ fromR: r, fromC: c, toR: r + dir, toC: c });
    if (r === startRow && inBounds(r + dir * 2, c)) moves.push({ fromR: r, fromC: c, toR: r + dir * 2, toC: c });
    [-1, 1].forEach(dc => { if (inBounds(r + dir, c + dc)) moves.push({ fromR: r, fromC: c, toR: r + dir, toC: c + dc }); });
  } else if (type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
      if (inBounds(r + dr, c + dc)) moves.push({ fromR: r, fromC: c, toR: r + dr, toC: c + dc });
    });
  } else if (type === 'K') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if ((dr !== 0 || dc !== 0) && inBounds(r + dr, c + dc)) moves.push({ fromR: r, fromC: c, toR: r + dr, toC: c + dc });
    }
    const row = color === 'w' ? 7 : 0;
    if (r === row && c === 4) {
      moves.push({ fromR: row, fromC: 4, toR: row, toC: 6 });
      moves.push({ fromR: row, fromC: 4, toR: row, toC: 2 });
    }
  } else {
    const dirs = [];
    if (type === 'R' || type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    if (type === 'B' || type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    dirs.forEach(([dr, dc]) => {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
        nr += dr; nc += dc;
      }
    });
  }
  return moves;
}

function initBoardArray() {
  board = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
  ];
  turn = 'w'; selectedSq = null; legalMoves = []; lastMove = null; premove = null; animHideKey = null;
  castling = { wK: true, wQ: true, bK: true, bQ: true }; epTarget = null; moveList = [];
  const mh = document.getElementById('moveHistoryBox');
  if (mh) mh.innerHTML = '';
  setTimeout(initChessPixi, 50);
}

function getMyChessElo() {
  return Number(localStorage.getItem('yk_chess_elo') || 1200);
}

function calculateAndSaveElo(gameKey, oppElo, score) {
  const oldElo = getMyChessElo();
  const expected = 1 / (1 + Math.pow(10, ((oppElo || 1200) - oldElo) / 400));
  const delta = Math.round(32 * (score - expected));
  const newElo = Math.max(100, oldElo + delta);
  localStorage.setItem('yk_chess_elo', String(newElo));
  if (window.YariOnline && YariOnline.submitScore) {
    YariOnline.submitScore(gameKey, newElo);
  }
  return { oldElo, newElo, delta };
}

function updateSelfPlayerUI() {
  const me = window.YariOnline ? YariOnline.getPlayer() : { name: 'تۆ (یاری کوردی)', avatar: '' };
  const nameEl = document.getElementById('selfName');
  const avatarEl = document.getElementById('selfAvatar');
  const colorEl = document.getElementById('selfColorLabel');

  if (nameEl) nameEl.textContent = me.name || 'تۆ (یاری کوردی)';
  if (avatarEl && me.avatar) {
    avatarEl.innerHTML = `<img src="${escapeHtml(me.avatar)}" class="w-full h-full object-cover" alt="">`;
  }
  if (colorEl) {
    colorEl.textContent = myColor === 'w' ? 'داشە سپییەکان ♔' : 'داشە ڕەشەکان ♚';
  }
}

function openChessOnlineLobby() {
  if (!window.YariOnline) return;
  YariOnline.openLobby({
    gameType: 'chess',
    gameTitle: 'شەترەنجی شاهانە',
    maxPlayers: 2,
    initialState: {
      baseTime: selectedBaseTime,
      inc: selectedIncrement,
      lastMove: null,
      winner: null
    },
    onGameStart: ({ roomCode, mySeat, players, state }) => {
      const color = mySeat === 0 ? 'w' : 'b';
      const opp = players.find(p => p.seat !== mySeat) || { name: 'یاریزان', avatar: 'images.png/controller.png' };
      if (state && state.baseTime) {
        selectedBaseTime = state.baseTime;
        selectedIncrement = state.inc || 0;
      }
      startOnlineGameSession(roomCode, color, opp);
    }
  });
}

function startOnlineGameSession(roomCode, color, opp) {
  document.getElementById('chessSetupPanel').classList.add('hidden');
  document.getElementById('activeGameArea').classList.remove('hidden');

  isOnlineGame = true;
  myColor = color;
  opponentInfo = {
    id: opp.uid || null,
    name: opp.name || 'یاریزان',
    elo: opp.elo || 1200,
    avatar: opp.avatar || 'images.png/controller.png'
  };

  whiteTime = selectedBaseTime;
  blackTime = selectedBaseTime;
  gameActive = true;

  updateSelfPlayerUI();
  document.getElementById('oppName').textContent = opponentInfo.name;
  document.getElementById('oppEloBadge').textContent = `(ژوور: ${roomCode})`;
  const oppAvatarEl = document.getElementById('oppAvatar');
  if (oppAvatarEl) {
    oppAvatarEl.innerHTML = `<img src="${escapeHtml(opponentInfo.avatar)}" class="w-full h-full object-cover" alt="">`;
  }

  document.getElementById('selfClock').textContent = formatClock(myColor === 'w' ? whiteTime : blackTime);
  document.getElementById('oppClock').textContent = formatClock(myColor === 'w' ? blackTime : whiteTime);

  initBoardArray();
  startClock();

  if (roomStateRef && roomStateListener) {
    roomStateRef.off('value', roomStateListener);
  }
  roomStateRef = ykDB.ref(`rooms/chess/${roomCode}/state`);
  roomStateListener = roomStateRef.on('value', snap => {
    const data = snap.val();
    if (!data) return;

    if (data.lastMove && data.lastMove.by !== myColor) {
      const m = data.lastMove;
      if (!lastMove || lastMove.moveNum !== m.moveNum) {
        executeMove(m.fromR, m.fromC, m.toR, m.toC, true, m.promo || null);
      }
    }

    if (data.winner && gameActive) {
      if (data.winner === myColor) {
        endGame(true, 'بەرامبەر خۆی بەدەستەوە دا');
      } else if (data.winner === 'draw') {
        endGame('draw', 'یاری یەکسان بوو');
      }
    }
  });
}

function startBotGame() {
  document.getElementById('chessSetupPanel').classList.add('hidden');
  document.getElementById('activeGameArea').classList.remove('hidden');

  const level = Number(document.getElementById('botLevelSelect')?.value || 2);
  const botMeta = {
    1: { name: 'بۆتی سەرەتایی', elo: 800, icon: '🟢' },
    2: { name: 'بۆتی پڕۆفیشناڵ', elo: 1500, icon: '🟡' },
    3: { name: 'Stockfish AI', elo: 2500, icon: '🔥' }
  }[level];

  isOnlineGame = false;
  myColor = 'w';
  opponentInfo = { id: null, name: botMeta.name, elo: botMeta.elo, avatar: '' };
  whiteTime = selectedBaseTime;
  blackTime = selectedBaseTime;
  gameActive = true;

  updateSelfPlayerUI();
  document.getElementById('oppName').textContent = botMeta.name;
  document.getElementById('oppAvatar').textContent = botMeta.icon;
  document.getElementById('oppEloBadge').textContent = `(${botMeta.elo})`;
  document.getElementById('selfClock').textContent = formatClock(whiteTime);
  document.getElementById('oppClock').textContent = formatClock(blackTime);

  initBoardArray();
  startClock();
}

function executeMove(fromR, fromC, toR, toC, isRemote = false, promoType = null) {
  if (!gameActive) return;
  const piece = board[fromR][fromC];
  if (!piece) return;
  const targetPiece = board[toR][toC];
  let isCapture = !!targetPiece;

  if (piece[1] === 'P' && epTarget && toR === epTarget.r && toC === epTarget.c) {
    board[fromR][toC] = null;
    isCapture = true;
  }

  if (piece[1] === 'P' && Math.abs(toR - fromR) === 2) {
    epTarget = { r: (fromR + toR) / 2, c: fromC };
  } else {
    epTarget = null;
  }

  if (piece[1] === 'K' && Math.abs(toC - fromC) === 2) {
    if (toC === 6) { board[fromR][5] = board[fromR][7]; board[fromR][7] = null; }
    if (toC === 2) { board[fromR][3] = board[fromR][0]; board[fromR][0] = null; }
  }

  if (piece === 'wK') { castling.wK = false; castling.wQ = false; }
  if (piece === 'bK') { castling.bK = false; castling.bQ = false; }
  if (fromR === 7 && fromC === 0) castling.wQ = false;
  if (fromR === 7 && fromC === 7) castling.wK = false;
  if (fromR === 0 && fromC === 0) castling.bQ = false;
  if (fromR === 0 && fromC === 7) castling.bK = false;

  let finalPiece = piece;
  if (piece === 'wP' && toR === 0) finalPiece = 'w' + (promoType || 'Q');
  if (piece === 'bP' && toR === 7) finalPiece = 'b' + (promoType || 'Q');

  board[toR][toC] = finalPiece;
  board[fromR][fromC] = null;

  if (!isRemote && turn === 'w') whiteTime += selectedIncrement;
  if (!isRemote && turn === 'b') blackTime += selectedIncrement;

  moveList.push({ fromR, fromC, toR, toC, piece: finalPiece });
  const files = ['a','b','c','d','e','f','g','h'];
  const notation = `${piece[1] === 'P' ? '' : piece[1]}${isCapture ? 'x' : ''}${files[toC]}${8 - toR}`;
  const histBox = document.getElementById('moveHistoryBox');
  if (histBox) {
    histBox.innerHTML += `<span class="inline-block bg-white/5 px-1.5 py-0.5 rounded ml-1 text-slate-200">${moveList.length}. ${notation}</span>`;
    histBox.scrollLeft = histBox.scrollWidth;
  }

  const currentMoveNum = moveList.length;
  lastMove = { fromR, fromC, toR, toC, moveNum: currentMoveNum };
  selectedSq = null;
  legalMoves = [];
  clearArrows();

  turn = (turn === 'w') ? 'b' : 'w';

  const inCheck = isKingInCheck(turn);
  if (inCheck) playChessSound('check');
  else if (isCapture) playChessSound('capture');
  else playChessSound('move');

  // ئەنیمەیشنی خلیسکانی نەرم بە 120FPS
  animateSmoothPieceGlide(fromR, fromC, toR, toC, finalPiece);

  if (isOnlineGame && !isRemote && roomStateRef) {
    roomStateRef.child('lastMove').set({ fromR, fromC, toR, toC, by: myColor, moveNum: currentMoveNum, promo: promoType || null });
  }

  let hasAnyLegalMove = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === turn && getLegalMovesForPiece(r, c).length > 0) {
        hasAnyLegalMove = true;
        break;
      }
    }
    if (hasAnyLegalMove) break;
  }

  if (!hasAnyLegalMove) {
    if (inCheck) {
      const playerWon = (turn !== myColor);
      if (isOnlineGame && roomStateRef && playerWon) roomStateRef.child('winner').set(myColor);
      endGame(playerWon, playerWon ? 'کش و مات! تۆ یارییەکەت بردەوە' : 'کش و مات! بەرامبەر یارییەکەی بردەوە');
    } else {
      if (isOnlineGame && roomStateRef) roomStateRef.child('winner').set('draw');
      endGame('draw', 'یارییەکە بە یەکسانی (Stalemate) کۆتایی هات');
    }
    return;
  }

  if (turn === myColor && premove) {
    const pm = premove;
    premove = null;
    if (board[pm.fromR][pm.fromC] && board[pm.fromR][pm.fromC][0] === myColor &&
        getLegalMovesForPiece(pm.fromR, pm.fromC).some(m => m.toR === pm.toR && m.toC === pm.toC)) {
      setTimeout(() => executeMove(pm.fromR, pm.fromC, pm.toR, pm.toC, false), 60);
      return;
    } else {
      syncBoardVisual();
    }
  }

  if (!isOnlineGame && turn !== myColor && gameActive) {
    setTimeout(makeBotMove, 180);
  }
}

function findKing(color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === color + 'K') return { r, c };
  return null;
}

function isSquareAttacked(r, c, byColor) {
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      const p = board[i][j];
      if (p && p[0] === byColor && getPseudoMoves(i, j, true).some(m => m.toR === r && m.toC === c)) return true;
    }
  return false;
}

function isKingInCheck(color) {
  const k = findKing(color);
  return k ? isSquareAttacked(k.r, k.c, color === 'w' ? 'b' : 'w') : false;
}

function getPseudoMoves(r, c, attackOnly = false) {
  const p = board[r][c];
  if (!p) return [];
  const color = p[0], type = p[1], moves = [];
  const inBounds = (nr, nc) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1, startRow = color === 'w' ? 6 : 1;
    if (!attackOnly && inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push({ fromR: r, fromC: c, toR: r + dir, toC: c });
      if (r === startRow && !board[r + dir * 2][c]) moves.push({ fromR: r, fromC: c, toR: r + dir * 2, toC: c });
    }
    [-1, 1].forEach(dc => {
      const nr = r + dir, nc = c + dc;
      if (inBounds(nr, nc)) {
        if (board[nr][nc] && board[nr][nc][0] !== color) moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
        else if (!attackOnly && epTarget && epTarget.r === nr && epTarget.c === nc) moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
      }
    });
  } else if (type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc][0] !== color)) moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
    });
  } else if (type === 'K') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc][0] !== color)) moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
    }
    if (!attackOnly && !isKingInCheck(color)) {
      const opp = color === 'w' ? 'b' : 'w';
      const row = color === 'w' ? 7 : 0;
      if (r === row && c === 4) {
        if (castling[color + 'K'] && board[row][7] === color + 'R' && !board[row][5] && !board[row][6]) {
          if (!isSquareAttacked(row, 5, opp) && !isSquareAttacked(row, 6, opp)) moves.push({ fromR: row, fromC: 4, toR: row, toC: 6 });
        }
        if (castling[color + 'Q'] && board[row][0] === color + 'R' && !board[row][1] && !board[row][2] && !board[row][3]) {
          if (!isSquareAttacked(row, 3, opp) && !isSquareAttacked(row, 2, opp)) moves.push({ fromR: row, fromC: 4, toR: row, toC: 2 });
        }
      }
    }
  } else {
    const dirs = [];
    if (type === 'R' || type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    if (type === 'B' || type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    dirs.forEach(([dr, dc]) => {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        if (!board[nr][nc]) moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
        else { if (board[nr][nc][0] !== color) moves.push({ fromR: r, fromC: c, toR: nr, toC: nc }); break; }
        nr += dr; nc += dc;
      }
    });
  }
  return moves;
}

function getLegalMovesForPiece(r, c) {
  const p = board[r][c];
  if (!p) return [];
  const color = p[0];
  return getPseudoMoves(r, c, false).filter(m => {
    const sf = board[m.fromR][m.fromC], st = board[m.toR][m.toC];
    board[m.toR][m.toC] = sf; board[m.fromR][m.fromC] = null;
    const chk = isKingInCheck(color);
    board[m.fromR][m.fromC] = sf; board[m.toR][m.toC] = st;
    return !chk;
  });
}

function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function startClock() {
  clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    if (!gameActive) return;
    if (turn === 'w') whiteTime--; else blackTime--;
    document.getElementById('selfClock').textContent = formatClock(myColor === 'w' ? whiteTime : blackTime);
    document.getElementById('oppClock').textContent = formatClock(myColor === 'w' ? blackTime : whiteTime);
    if (whiteTime <= 0) endGame(myColor === 'b', 'کاتی سپی تەواو بوو!');
    else if (blackTime <= 0) endGame(myColor === 'w', 'کاتی ڕەش تەواو بوو!');
  }, 1000);
}

function resignGame() {
  if (isOnlineGame && roomStateRef) {
    roomStateRef.child('winner').set(myColor === 'w' ? 'b' : 'w');
  }
  endGame(false, 'خۆت بەدەستەوە دا');
}

function endGame(result, reason) {
  gameActive = false;
  clearInterval(clockInterval);
  playChessSound('end');
  if (roomStateRef && roomStateListener) {
    roomStateRef.off('value', roomStateListener);
    roomStateListener = null;
  }
  document.getElementById('modalIcon').textContent = result === true ? '🏆' : '⚔️';
  document.getElementById('modalTitle').textContent = result === true ? 'سەرکەوتن!' : 'کۆتایی یاری';
  document.getElementById('modalSubtitle').textContent = reason;
  if (isOnlineGame) {
    document.getElementById('eloChangeBox').classList.remove('hidden');
    const res = calculateAndSaveElo('chess', opponentInfo.elo, result === true ? 1 : (result === 'draw' ? 0.5 : 0));
    document.getElementById('eloChangeText').textContent = `${res.oldElo} ➔ ${res.newElo} (${res.delta >= 0 ? '+' : ''}${res.delta})`;
  } else {
    document.getElementById('eloChangeBox').classList.add('hidden');
  }
  document.getElementById('gameOverModal').classList.remove('hidden');
}

function closeGameOverModal() {
  if (isOnlineGame && window.YariOnline) {
    YariOnline.leaveRoom();
  }
  isOnlineGame = false;
  myColor = 'w';
  document.getElementById('gameOverModal').classList.add('hidden');
  document.getElementById('activeGameArea').classList.add('hidden');
  document.getElementById('chessSetupPanel').classList.remove('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
  initStockfishEngine();
});

window.addEventListener('beforeunload', () => {
  if (isOnlineGame && window.YariOnline) {
    YariOnline.leaveRoom();
  }
});