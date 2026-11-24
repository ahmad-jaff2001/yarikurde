// ============================================================================
// YARI KURDI - HALO-Y ZAGROS (PIXI.JS v7 WEBGL 120FPS ENGINE)
// ============================================================================

let pixiApp = null;
let haloAudioCtx = null;

// چینەکانی PixiJS
let skyLayer = null;
let mountainLayer = null;
let pillarsLayer = null;
let groundLayer = null;
let itemsLayer = null;
let eagleLayer = null;
let fxLayer = null;

const texCache = new Map();

// قەبارەی لۆجیکی جێگیر تا فیزیای فڕین لەسەر هەموو مۆبایل و کۆمپیوتەرێک ١٠٠٪ یەکسان بێت
let logicalW = 420;
let logicalH = 760;

// داتای هەڵۆکان و پێستەکان (Skins)
const SKINS = [
  { id: 'golden', name: 'هەڵۆی زێڕین', price: 0, body: '#78350f', wing: '#d97706', wingLight: '#fbbf24', head: '#fef3c7', beak: '#f59e0b', trailHex: 0xfbbf24 },
  { id: 'fire', name: 'هەڵۆی ئاگرین', price: 30, body: '#7f1d1d', wing: '#dc2626', wingLight: '#f97316', head: '#fef08a', beak: '#fb923c', trailHex: 0xf97316 },
  { id: 'night', name: 'هەڵۆی شەو', price: 60, body: '#1e1b4b', wing: '#4338ca', wingLight: '#38bdf8', head: '#e0f2fe', beak: '#94a3b8', trailHex: 0x38bdf8 },
  { id: 'kurd', name: 'هەڵۆی کوردستان', price: 100, body: '#14532d', wing: '#dc2626', wingLight: '#facc15', head: '#ffffff', beak: '#f59e0b', trailHex: 0xfacc15 }
];

let totalCoins = parseInt(localStorage.getItem('halo_coins') || '0', 10);
let bestScore = parseInt(localStorage.getItem('halo_best') || '0', 10);
let unlockedSkins = JSON.parse(localStorage.getItem('halo_skins') || '["golden"]');
let selectedSkin = localStorage.getItem('halo_selected') || 'golden';

// بارودۆخی یاری
let state = 'MENU';
let score = 0;
let runCoins = 0;
let gameTime = 0;
let pipeSpawnTimer = 0;
let pipesSpawned = 0;
let speed = 3.25;
let shakeTime = 0;
let shakeIntensity = 0;
let levelBannerTimer = 0;
let gameOverCooldown = 0;

// پێکهاتەی گرافیکی هەڵۆکە لە PixiJS
const eagle = {
  container: null,
  backWing: null,
  frontWing: null,
  bodySprite: null,
  shieldRing: null,
  fireRing: null,
  x: 110,
  y: 300,
  vy: 0,
  gravity: 0.42,
  jump: -7.5,
  radius: 19,
  wingPhase: 0,
  flapBoost: 0,
  shieldTimer: 0,
  fireTimer: 0,
  trail: [],
  trailGraphics: null
};

let skyGraphics = null;
let mountainGraphics = null;
let groundGraphics = null;

let pipes = [];
let items = [];
let particles = [];
let shockwaves = [];
let floatingTexts = [];
let clouds = [];
let stars = [];
let shootingStar = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 };

// ============================================================================
// ١. سیستمی دەنگی خێرا (Zero-Latency Web Audio)
// ============================================================================
function playTone(freq, endFreq, type, duration, vol = 0.11) {
  try {
    if (!haloAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      haloAudioCtx = new AudioCtx();
    }
    if (haloAudioCtx.state === 'suspended') haloAudioCtx.resume();
    const now = haloAudioCtx.currentTime;
    const osc = haloAudioCtx.createOscillator();
    const gain = haloAudioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(haloAudioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {}
}

// ============================================================================
// ٢. دروستکردنی تێکسچەری کوالێتی بەرزی هەڵۆ، باڵەکان و ئایتمەکان لەسەر GPU
// ============================================================================
function bakeAllHaloTextures() {
  // ١) تێکسچەری لاشە و سەری هەر ٤ جۆرە هەڵۆکە + باڵەکانیان
  SKINS.forEach(skin => {
    // لاشە و سەر
    {
      const c = document.createElement('canvas');
      c.width = 140;
      c.height = 100;
      const ctx = c.getContext('2d');
      ctx.translate(65, 50);

      // کلکی شاهانە
      ctx.fillStyle = skin.head;
      ctx.beginPath();
      ctx.moveTo(-14, 1);
      ctx.lineTo(-42, -13);
      ctx.lineTo(-35, 0);
      ctx.lineTo(-42, 13);
      ctx.closePath();
      ctx.fill();

      // لاشە
      const bodyGrad = ctx.createLinearGradient(-22, -14, 22, 16);
      bodyGrad.addColorStop(0, skin.body);
      bodyGrad.addColorStop(1, skin.wing);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 26, 16.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // نەخشی پەڕی سەر سنگ
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(4, 3, 13, -0.5, 0.9);
      ctx.stroke();

      // سەری هەڵۆ
      ctx.fillStyle = skin.head;
      ctx.beginPath();
      ctx.arc(18, -5, 13, 0, Math.PI * 2);
      ctx.fill();

      // دەنووکی تیژی هەڵۆ
      ctx.fillStyle = skin.beak;
      ctx.beginPath();
      ctx.moveTo(28, -9);
      ctx.quadraticCurveTo(44, -5, 38, 6);
      ctx.lineTo(27, 2);
      ctx.closePath();
      ctx.fill();

      // چاوی تیژ و برۆ
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(21, -6.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(22.2, -7.5, 1.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = skin.body;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(16, -11);
      ctx.lineTo(26, -9);
      ctx.stroke();

      texCache.set(`eagle_body_${skin.id}`, PIXI.Texture.from(c));
    }

    // باڵی پێشەوە (سەرەکی)
    {
      const c = document.createElement('canvas');
      c.width = 90;
      c.height = 90;
      const ctx = c.getContext('2d');
      ctx.translate(45, 55);

      const wingGrad = ctx.createLinearGradient(-15, -35, 15, 12);
      wingGrad.addColorStop(0, skin.wingLight);
      wingGrad.addColorStop(1, skin.wing);
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(-24, -36, 16, -24);
      ctx.quadraticCurveTo(18, 6, -6, 9);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      texCache.set(`eagle_wing_front_${skin.id}`, PIXI.Texture.from(c));
    }

    // باڵی دواوە (بۆ قووڵایی ٣ ڕەهەندی)
    {
      const c = document.createElement('canvas');
      c.width = 80;
      c.height = 80;
      const ctx = c.getContext('2d');
      ctx.translate(40, 50);

      ctx.fillStyle = skin.body;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(-14, -30, 14, -22);
      ctx.lineTo(6, 4);
      ctx.closePath();
      ctx.fill();

      texCache.set(`eagle_wing_back_${skin.id}`, PIXI.Texture.from(c));
    }
  });

  // ٢) خۆری زێڕین (Coin)
  {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.translate(32, 32);

    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    texCache.set('item_sun', PIXI.Texture.from(c));
  }

  // ٣) قەڵغانی ئاسمانی (Shield)
  {
    const c = document.createElement('canvas');
    c.width = 68;
    c.height = 68;
    const ctx = c.getContext('2d');
    ctx.translate(34, 34);

    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#bae6fd';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡️', 0, 1);

    texCache.set('item_shield', PIXI.Texture.from(c));
  }

  // ٤) ئاگری نەورۆز (Fire)
  {
    const c = document.createElement('canvas');
    c.width = 68;
    c.height = 68;
    const ctx = c.getContext('2d');
    ctx.translate(34, 34);

    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#fde047';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', 0, 1);

    texCache.set('item_fire', PIXI.Texture.from(c));
  }

  // ٥) گەردیلەی درەوشاوە
  {
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(12, 12, 1, 12, 12, 11);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 24, 24);
    texCache.set('particle_dot', PIXI.Texture.from(c));
  }
}

// ============================================================================
// ٣. گونجاندنی قەبارەی شاشە (Responsive Logical Scale)
// ============================================================================
function updateViewportScale() {
  const container = document.getElementById('game-container');
  if (!pixiApp || !container) return;

  const cw = Math.max(300, container.clientWidth);
  const ch = Math.max(460, container.clientHeight);
  pixiApp.renderer.resize(cw, ch);

  logicalH = 760;
  logicalW = Math.round(logicalH * (cw / ch));
  const scale = ch / logicalH;
  pixiApp.stage.scale.set(scale);
}

// ============================================================================
// ٤. دروستکردنی هەڵۆکە لە PixiJS و نوێکردنەوەی پێستەکەی
// ============================================================================
function buildEagleSprite() {
  eagle.container = new PIXI.Container();
  eagle.trailGraphics = new PIXI.Graphics();
  eagleLayer.addChild(eagle.trailGraphics);

  // بازنەی ئاگری نەورۆز
  eagle.fireRing = new PIXI.Graphics();
  eagle.fireRing.lineStyle(3.5, 0xfbbf24, 0.95);
  eagle.fireRing.beginFill(0xf97316, 0.16);
  eagle.fireRing.drawCircle(0, 0, 32);
  eagle.fireRing.endFill();
  eagle.fireRing.visible = false;

  // بازنەی قەڵغانی پارێزەر
  eagle.shieldRing = new PIXI.Graphics();
  eagle.shieldRing.lineStyle(3, 0x38bdf8, 0.95);
  eagle.shieldRing.beginFill(0x38bdf8, 0.16);
  eagle.shieldRing.drawCircle(0, 0, 30);
  eagle.shieldRing.endFill();
  eagle.shieldRing.visible = false;

  eagle.backWing = new PIXI.Sprite(texCache.get(`eagle_wing_back_${selectedSkin}`));
  eagle.backWing.anchor.set(0.5, 0.62);
  eagle.backWing.position.set(2, -2);

  eagle.bodySprite = new PIXI.Sprite(texCache.get(`eagle_body_${selectedSkin}`));
  eagle.bodySprite.anchor.set(0.46, 0.5);

  eagle.frontWing = new PIXI.Sprite(texCache.get(`eagle_wing_front_${selectedSkin}`));
  eagle.frontWing.anchor.set(0.5, 0.62);
  eagle.frontWing.position.set(-4, 0);

  eagle.container.addChild(
    eagle.fireRing,
    eagle.shieldRing,
    eagle.backWing,
    eagle.bodySprite,
    eagle.frontWing
  );
  eagleLayer.addChild(eagle.container);
}

function applySelectedEagleSkin() {
  eagle.backWing.texture = texCache.get(`eagle_wing_back_${selectedSkin}`);
  eagle.bodySprite.texture = texCache.get(`eagle_body_${selectedSkin}`);
  eagle.frontWing.texture = texCache.get(`eagle_wing_front_${selectedSkin}`);
}

// ============================================================================
// ٥. کێشانی ئاسمان، کێوەکانی زاگرۆس و زەوی بە WebGL
// ============================================================================
function initEnvironmentGraphics() {
  skyGraphics = new PIXI.Graphics();
  mountainGraphics = new PIXI.Graphics();
  groundGraphics = new PIXI.Graphics();

  skyLayer.addChild(skyGraphics);
  mountainLayer.addChild(mountainGraphics);
  groundLayer.addChild(groundGraphics);

  clouds = Array.from({ length: 6 }, (_, i) => ({
    x: i * 110 + Math.random() * 50,
    y: 65 + Math.random() * 200,
    scale: 0.65 + Math.random() * 0.65,
    spd: 0.25 + Math.random() * 0.35
  }));

  stars = Array.from({ length: 55 }, () => ({
    x: Math.random() * 600,
    y: Math.random() * 440,
    r: Math.random() * 1.8 + 0.6,
    a: Math.random() * Math.PI * 2
  }));
}

function renderEnvironment() {
  const w = logicalW;
  const h = logicalH;
  const phase = Math.floor(score / 15) % 3;

  // ١) ئاسمان
  skyGraphics.clear();
  if (phase === 0) {
    // شەوی زاگرۆس
    skyGraphics.beginFill(0x070b1e);
    skyGraphics.drawRect(0, 0, w, h * 0.45);
    skyGraphics.beginFill(0x13224d);
    skyGraphics.drawRect(0, h * 0.45, w, h * 0.32);
    skyGraphics.beginFill(0x1d4ed8);
    skyGraphics.drawRect(0, h * 0.77, w, h * 0.23);
  } else if (phase === 1) {
    // خۆرئاوابوونی ئاگرین
    skyGraphics.beginFill(0x1e0b36);
    skyGraphics.drawRect(0, 0, w, h * 0.42);
    skyGraphics.beginFill(0x831843);
    skyGraphics.drawRect(0, h * 0.42, w, h * 0.30);
    skyGraphics.beginFill(0xd97706);
    skyGraphics.drawRect(0, h * 0.72, w, h * 0.28);
  } else {
    // ڕۆژی ساماڵ
    skyGraphics.beginFill(0x0369a1);
    skyGraphics.drawRect(0, 0, w, h * 0.48);
    skyGraphics.beginFill(0x0ea5e9);
    skyGraphics.drawRect(0, h * 0.48, w, h * 0.30);
    skyGraphics.beginFill(0x7dd3fc);
    skyGraphics.drawRect(0, h * 0.78, w, h * 0.22);
  }
  skyGraphics.endFill();

  // ئەستێرەکان و ئەستێرەی کشاو
  if (phase !== 2) {
    for (const st of stars) {
      const alpha = 0.35 + Math.sin(gameTime * 0.04 + st.a) * 0.45;
      skyGraphics.beginFill(0xffffff, Math.max(0.1, alpha));
      skyGraphics.drawCircle(st.x % w, st.y, st.r);
      skyGraphics.endFill();
    }
    if (shootingStar.active) {
      skyGraphics.lineStyle(2, 0xffffff, shootingStar.life);
      skyGraphics.moveTo(shootingStar.x, shootingStar.y);
      skyGraphics.lineTo(shootingStar.x - shootingStar.vx * 4, shootingStar.y - shootingStar.vy * 4);
      skyGraphics.lineStyle(0);
    }
  }

  // مانگ یان خۆر
  const cx = w * 0.78;
  const cy = h * 0.16;
  if (phase === 0) {
    skyGraphics.beginFill(0xfde047, 0.18);
    skyGraphics.drawCircle(cx, cy, 38);
    skyGraphics.beginFill(0xfef9c3, 1);
    skyGraphics.drawCircle(cx, cy, 24);
    skyGraphics.endFill();
  } else {
    skyGraphics.beginFill(0xf59e0b, 0.22);
    skyGraphics.drawCircle(cx, cy, 46);
    skyGraphics.beginFill(0xfde047, 1);
    skyGraphics.drawCircle(cx, cy, 30);
    skyGraphics.endFill();
  }

  // هەورە نەرمەکان
  const cloudAlpha = phase === 0 ? 0.07 : 0.24;
  skyGraphics.beginFill(0xffffff, cloudAlpha);
  for (const c of clouds) {
    skyGraphics.drawCircle(c.x, c.y, 22 * c.scale);
    skyGraphics.drawCircle(c.x + 18 * c.scale, c.y - 6 * c.scale, 26 * c.scale);
    skyGraphics.drawCircle(c.x + 38 * c.scale, c.y, 20 * c.scale);
  }
  skyGraphics.endFill();

  // ٢) کێوەکانی زاگرۆس (دوو چین بۆ قووڵایی ٣ ڕەهەندی)
  mountainGraphics.clear();
  const m1Col = phase === 2 ? 0x1e40af : (phase === 1 ? 0x3b0764 : 0x0f172a);
  mountainGraphics.beginFill(m1Col, 1);
  mountainGraphics.moveTo(0, h);
  for (let x = -60; x <= w + 140; x += 105) {
    const off = (gameTime * 0.45) % 105;
    const px = x - off;
    const py = h - 185 - Math.sin((x + Math.floor((gameTime * 0.45) / 105) * 105) * 0.018) * 55;
    mountainGraphics.lineTo(px, py);
  }
  mountainGraphics.lineTo(w, h);
  mountainGraphics.closePath();
  mountainGraphics.endFill();

  const m2Col = phase === 2 ? 0x15803d : (phase === 1 ? 0x1e1b4b : 0x090f20);
  mountainGraphics.beginFill(m2Col, 1);
  mountainGraphics.moveTo(0, h);
  for (let x = -50; x <= w + 110; x += 82) {
    const off = (gameTime * 1.0) % 82;
    const px = x - off;
    const py = h - 110 - Math.cos((x + Math.floor((gameTime * 1.0) / 82) * 82) * 0.025) * 32;
    mountainGraphics.lineTo(px, py);
  }
  mountainGraphics.lineTo(w, h);
  mountainGraphics.closePath();
  mountainGraphics.endFill();

  // ٣) زەوی و چیمەنی خوارەوە
  groundGraphics.clear();
  groundGraphics.beginFill(0x064e3b, 1);
  groundGraphics.drawRect(0, h - 34, w, 34);
  groundGraphics.beginFill(0x10b981, 1);
  groundGraphics.drawRect(0, h - 40, w, 7);
  groundGraphics.beginFill(0x34d399, 1);
  const gOff = (gameTime * speed) % 28;
  for (let x = -28; x < w + 28; x += 28) {
    groundGraphics.drawRect(x - gOff, h - 38, 12, 2.5);
  }
  groundGraphics.endFill();
}

// ============================================================================
// ٦. دروستکردنی ستوونەکان، خۆر و هێزە تایبەتەکان
// ============================================================================
function spawnPipe() {
  pipesSpawned++;
  const gap = Math.max(142, 188 - score * 0.72);
  const minH = 85;
  const maxH = logicalH - gap - 135;
  const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
  const x = logicalW + 50;
  const width = 66;

  const isMoving = score >= 10;
  const moveSpeed = isMoving
    ? Math.min(2.3, 0.85 + (score - 10) * 0.055) * (Math.random() > 0.5 ? 1 : -1)
    : 0;

  const container = new PIXI.Container();
  container.position.set(x, 0);

  const topPillar = new PIXI.Graphics();
  const botPillar = new PIXI.Graphics();
  container.addChild(topPillar, botPillar);
  pillarsLayer.addChild(container);

  const pipeObj = {
    x,
    topH,
    gap,
    width,
    passed: false,
    shattered: false,
    vy: moveSpeed,
    container,
    topPillar,
    botPillar
  };
  redrawSinglePipe(pipeObj);
  pipes.push(pipeObj);

  // دروستکردنی خۆر، قەڵغان یان ئاگری نەورۆز لە نێوان ستوونەکان
  const cy = topH + gap / 2;
  let type = 'sun';
  if (pipesSpawned >= 10 && pipesSpawned % 12 === 0) {
    type = Math.random() > 0.5 ? 'shield' : 'fire';
  }

  const sp = new PIXI.Sprite(texCache.get(`item_${type}`));
  sp.anchor.set(0.5);
  sp.position.set(x + width / 2, cy);
  itemsLayer.addChild(sp);

  items.push({
    x: x + width / 2,
    y: cy,
    type,
    collected: false,
    sprite: sp
  });
}

function redrawSinglePipe(p) {
  const h = logicalH;
  const botY = p.topH + p.gap;

  // ستوونی سەرەوە
  p.topPillar.clear();
  p.topPillar.beginFill(0x1e293b);
  p.topPillar.drawRect(0, 0, p.width, p.topH);
  p.topPillar.beginFill(0x475569, 0.65);
  p.topPillar.drawRect(14, 0, 20, p.topH);
  // سەری زێڕینی ستوونی سەرەوە
  p.topPillar.beginFill(0xd97706);
  p.topPillar.drawRoundedRect(-5, p.topH - 18, p.width + 10, 18, 6);
  p.topPillar.beginFill(0xfde047, 0.7);
  p.topPillar.drawRoundedRect(6, p.topH - 16, 22, 14, 4);

  // ستوونی خوارەوە
  p.botPillar.clear();
  const botH = Math.max(0, h - botY - 36);
  p.botPillar.beginFill(0x1e293b);
  p.botPillar.drawRect(0, botY, p.width, botH);
  p.botPillar.beginFill(0x475569, 0.65);
  p.botPillar.drawRect(14, botY, 20, botH);
  // سەری زێڕینی ستوونی خوارەوە
  p.botPillar.beginFill(0xd97706);
  p.botPillar.drawRoundedRect(-5, botY, p.width + 10, 18, 6);
  p.botPillar.beginFill(0xfde047, 0.7);
  p.botPillar.drawRoundedRect(6, botY + 2, 22, 14, 4);

  // هێڵی زێڕین ئەگەر ستوونەکە جووڵاو بێت
  if (p.vy !== 0) {
    p.topPillar.beginFill(0xfbbf24, 0.45);
    p.topPillar.drawRect(p.width / 2 - 2, 0, 4, Math.max(0, p.topH - 18));
    p.botPillar.beginFill(0xfbbf24, 0.45);
    p.botPillar.drawRect(p.width / 2 - 2, botY + 18, 4, Math.max(0, botH - 18));
  }
  p.topPillar.endFill();
  p.botPillar.endFill();
}

// ============================================================================
// ٧. گەردیلەکان، شەپۆلی تەقینەوە و نووسینە فڕیوەکان
// ============================================================================
function triggerShake(duration, intensity) {
  shakeTime = duration;
  shakeIntensity = intensity;
}

function showBanner(text) {
  const el = document.getElementById('level-banner');
  el.textContent = text;
  el.classList.add('show');
  levelBannerTimer = 150;
}

function spawnParticles(x, y, hexColor, count = 14, speedMult = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = (Math.random() * 3.8 + 1.2) * speedMult;
    const sp = new PIXI.Sprite(texCache.get('particle_dot'));
    sp.anchor.set(0.5);
    sp.tint = hexColor;
    const size = Math.random() * 0.45 + 0.25;
    sp.scale.set(size);
    sp.position.set(x, y);
    fxLayer.addChild(sp);

    particles.push({
      sprite: sp,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      decay: 0.024 + Math.random() * 0.02
    });
  }
}

function addShockwave(x, y, hexColor, maxR = 70) {
  const g = new PIXI.Graphics();
  g.position.set(x, y);
  fxLayer.addChild(g);
  shockwaves.push({ gfx: g, r: 10, maxR, color: hexColor, life: 1 });
}

function addFloatingText(x, y, text, color = '#ffffff') {
  const txt = new PIXI.Text(text, {
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 18,
    fontWeight: '900',
    fill: color,
    stroke: '#000000',
    strokeThickness: 3.5
  });
  txt.anchor.set(0.5);
  txt.position.set(x, y);
  fxLayer.addChild(txt);
  floatingTexts.push({ sprite: txt, life: 1, vy: -1.45 });
}

// ============================================================================
// ٨. کۆنترۆڵی فڕین، دەستپێکردن، کۆتایی و فرۆشگا
// ============================================================================
function updateHUD() {
  document.getElementById('coins-hud').textContent = totalCoins + runCoins;
  document.getElementById('best-hud').textContent = bestScore;
}

function flap() {
  if (state !== 'PLAYING') return;
  eagle.vy = eagle.jump;
  eagle.flapBoost = 1;
  const skin = SKINS.find(s => s.id === selectedSkin) || SKINS[0];
  spawnParticles(eagle.x - 14, eagle.y + 6, skin.trailHex, 6, 0.75);
  playTone(290, 450, 'sine', 0.11, 0.09);
}

function startGame() {
  state = 'PLAYING';
  score = 0;
  runCoins = 0;
  pipeSpawnTimer = 55;
  pipesSpawned = 0;
  speed = 3.25;
  shakeTime = 0;

  eagle.x = Math.min(115, logicalW * 0.27);
  eagle.y = logicalH * 0.42;
  eagle.vy = 0;
  eagle.shieldTimer = 0;
  eagle.fireTimer = 0;
  eagle.trail = [];
  applySelectedEagleSkin();

  pillarsLayer.removeChildren().forEach(c => c.destroy({ children: true }));
  itemsLayer.removeChildren().forEach(c => c.destroy({ children: true }));
  fxLayer.removeChildren().forEach(c => c.destroy({ children: true }));

  pipes = [];
  items = [];
  particles = [];
  shockwaves = [];
  floatingTexts = [];

  updateHUD();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  const scEl = document.getElementById('score-display');
  scEl.classList.remove('hidden');
  scEl.textContent = '0';
  document.getElementById('level-banner').classList.remove('show');
}

function gameOver() {
  if (state === 'GAMEOVER') return;
  state = 'GAMEOVER';
  gameOverCooldown = 25;
  triggerShake(18, 9);
  playTone(190, 65, 'sawtooth', 0.35, 0.14);
  spawnParticles(eagle.x, eagle.y, 0xef4444, 32, 1.35);
  addShockwave(eagle.x, eagle.y, 0xef4444, 90);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('halo_best', String(bestScore));
  }
  totalCoins += runCoins;
  runCoins = 0;
  localStorage.setItem('halo_coins', String(totalCoins));
  updateHUD();

  document.getElementById('score-display').classList.add('hidden');
  document.getElementById('shield-bar').style.display = 'none';
  document.getElementById('fire-bar').style.display = 'none';
  document.getElementById('level-banner').classList.remove('show');
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-best').textContent = bestScore;

  // پیشاندانی خۆرە کۆکراوەکانی ئەم دەستە
  const earnedThisRun = parseInt(document.getElementById('final-coins').dataset.earned || '0', 10);
  document.getElementById('final-coins').textContent = `+${earnedThisRun} ☀️`;

  setTimeout(() => {
    if (state === 'GAMEOVER') {
      document.getElementById('gameover-screen').classList.remove('hidden');
    }
  }, 320);
}

function openShop() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
  renderShop();
}

function closeShop() {
  document.getElementById('shop-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
}

function renderShop() {
  document.getElementById('shop-coins').textContent = totalCoins;
  const grid = document.getElementById('skins-container');
  grid.innerHTML = '';
  SKINS.forEach(s => {
    const owned = unlockedSkins.includes(s.id);
    const active = selectedSkin === s.id;
    const div = document.createElement('div');
    div.className = 'skin-item' + (active ? ' active' : '');
    div.innerHTML = `
      <div class="skin-swatch" style="background:linear-gradient(135deg,${s.wingLight},${s.body});border:2.5px solid ${s.head};"></div>
      <div class="skin-name">${s.name}</div>
      <div class="skin-price">${active ? '✓ هەڵبژێردراوە' : owned ? 'کراوەتەوە' : s.price + ' ☀️'}</div>
    `;
    div.onclick = () => {
      if (owned) {
        selectedSkin = s.id;
        localStorage.setItem('halo_selected', selectedSkin);
        applySelectedEagleSkin();
        playTone(500, 720, 'sine', 0.1, 0.08);
        renderShop();
      } else if (totalCoins >= s.price) {
        totalCoins -= s.price;
        unlockedSkins.push(s.id);
        selectedSkin = s.id;
        localStorage.setItem('halo_coins', String(totalCoins));
        localStorage.setItem('halo_skins', JSON.stringify(unlockedSkins));
        localStorage.setItem('halo_selected', selectedSkin);
        applySelectedEagleSkin();
        updateHUD();
        renderShop();
        playTone(520, 880, 'triangle', 0.22, 0.12);
      }
    };
    grid.appendChild(div);
  });
}

// ============================================================================
// ٩. نوێکردنەوەی هەموو چوارچێوەیەک بە خێرایی 120 FPS
// ============================================================================
function updateGameFrame(dt) {
  gameTime += dt;
  eagle.wingPhase += 0.28 * dt;
  if (eagle.flapBoost > 0) eagle.flapBoost = Math.max(0, eagle.flapBoost - 0.08 * dt);
  if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
  if (gameOverCooldown > 0) gameOverCooldown = Math.max(0, gameOverCooldown - dt);

  if (levelBannerTimer > 0) {
    levelBannerTimer -= dt;
    if (levelBannerTimer <= 0) document.getElementById('level-banner').classList.remove('show');
  }

  for (const c of clouds) {
    c.x -= c.spd * dt;
    if (c.x < -80) c.x = logicalW + 60;
  }

  if (!shootingStar.active && Math.random() < 0.004 * dt) {
    shootingStar = { active: true, x: Math.random() * logicalW, y: Math.random() * 140, vx: -6, vy: 3, life: 1 };
  }
  if (shootingStar.active) {
    shootingStar.x += shootingStar.vx * dt;
    shootingStar.y += shootingStar.vy * dt;
    shootingStar.life -= 0.03 * dt;
    if (shootingStar.life <= 0) shootingStar.active = false;
  }

  // گەردیلەکان
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.sprite.x += pt.vx * dt;
    pt.sprite.y += pt.vy * dt;
    pt.life -= pt.decay * dt;
    pt.sprite.alpha = Math.max(0, pt.life);
    if (pt.life <= 0) {
      pt.sprite.destroy();
      particles.splice(i, 1);
    }
  }

  // شەپۆلەکان
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.r += (sw.maxR - sw.r) * 0.14 * dt;
    sw.life -= 0.045 * dt;
    sw.gfx.clear();
    sw.gfx.lineStyle(3, sw.color, Math.max(0, sw.life));
    sw.gfx.drawCircle(0, 0, sw.r);
    if (sw.life <= 0) {
      sw.gfx.destroy();
      shockwaves.splice(i, 1);
    }
  }

  // نووسینە فڕیوەکان
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.sprite.y += ft.vy * dt;
    ft.life -= 0.022 * dt;
    ft.sprite.alpha = Math.max(0, ft.life);
    if (ft.life <= 0) {
      ft.sprite.destroy();
      floatingTexts.splice(i, 1);
    }
  }

  // جووڵەی باڵەکانی هەڵۆکە لە هەموو بارەکاندا
  const flapAngle = Math.sin(eagle.wingPhase) * 0.55 - eagle.flapBoost * 0.45;
  eagle.frontWing.rotation = flapAngle;
  eagle.backWing.rotation = flapAngle * 0.85 - 0.15;

  if (state === 'MENU') {
    eagle.x = logicalW * 0.5;
    eagle.y = logicalH * 0.22 + Math.sin(gameTime * 0.06) * 12;
    eagle.container.position.set(eagle.x, eagle.y);
    eagle.container.rotation = Math.sin(gameTime * 0.06) * 0.06;
    eagle.shieldRing.visible = false;
    eagle.fireRing.visible = false;
    eagle.trailGraphics.clear();
    return;
  }

  if (state !== 'PLAYING') {
    eagle.container.position.set(eagle.x, eagle.y);
    return;
  }

  // فیزیای هەڵۆکە لە کاتی یاریکردندا
  eagle.vy += eagle.gravity * dt;
  eagle.y += eagle.vy * dt;
  eagle.trail.push({ x: eagle.x - 14, y: eagle.y });
  if (eagle.trail.length > 11) eagle.trail.shift();

  eagle.container.position.set(eagle.x, eagle.y);
  eagle.container.rotation = Math.max(-0.48, Math.min(0.7, eagle.vy * 0.068));

  // کلکی ڕەنگاوڕەنگی هەڵۆکە
  const skin = SKINS.find(s => s.id === selectedSkin) || SKINS[0];
  eagle.trailGraphics.clear();
  const tColor = eagle.fireTimer > 0 ? 0xf97316 : skin.trailHex;
  for (let i = 0; i < eagle.trail.length; i++) {
    const t = eagle.trail[i];
    const ratio = i / eagle.trail.length;
    eagle.trailGraphics.beginFill(tColor, ratio * 0.42);
    eagle.trailGraphics.drawCircle(t.x, t.y, 3.5 + ratio * 8.5);
  }
  eagle.trailGraphics.endFill();

  // پشکنینی هێزی قەڵغان و ئاگری نەورۆز
  if (eagle.shieldTimer > 0) {
    eagle.shieldTimer = Math.max(0, eagle.shieldTimer - dt);
    eagle.shieldRing.visible = true;
    document.getElementById('shield-bar').style.display = 'block';
    document.getElementById('shield-fill').style.width = ((eagle.shieldTimer / 600) * 100) + '%';
  } else {
    eagle.shieldRing.visible = false;
    document.getElementById('shield-bar').style.display = 'none';
  }

  if (eagle.fireTimer > 0) {
    eagle.fireTimer = Math.max(0, eagle.fireTimer - dt);
    eagle.fireRing.visible = true;
    eagle.fireRing.scale.set(1 + Math.sin(gameTime * 0.35) * 0.09);
    document.getElementById('fire-bar').style.display = 'block';
    document.getElementById('fire-fill').style.width = ((eagle.fireTimer / 300) * 100) + '%';
    if (Math.random() < 0.55) spawnParticles(eagle.x - 18, eagle.y, 0xf97316, 1, 0.65);
  } else {
    eagle.fireRing.visible = false;
    document.getElementById('fire-bar').style.display = 'none';
  }

  // دروستکردنی ستوونەکان
  pipeSpawnTimer -= dt;
  if (pipeSpawnTimer <= 0) {
    spawnPipe();
    pipeSpawnTimer = Math.max(68, 94 - score * 0.55);
  }

  // نوێکردنەوەی ستوونەکان و پێکدادان
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= speed * dt;
    p.container.x = p.x;

    if (p.vy !== 0 && !p.shattered) {
      p.topH += p.vy * dt;
      if (p.topH < 75 || p.topH > logicalH - p.gap - 115) {
        p.vy *= -1;
      }
      redrawSinglePipe(p);
    }

    if (!p.passed && p.x + p.width < eagle.x) {
      p.passed = true;
      score++;
      speed = Math.min(6.0, 3.25 + score * 0.045);
      const scEl = document.getElementById('score-display');
      scEl.textContent = score;
      scEl.classList.add('pop');
      setTimeout(() => scEl.classList.remove('pop'), 110);
      playTone(540, 680, 'sine', 0.08, 0.07);

      if (score === 10) showBanner('ئاستی نوێ: ستوونەکان دەجوڵێن! 🔥');
      else if (score === 25) showBanner('خێرایی زیاتر بوو! ⚡');
    }

    if (!p.shattered) {
      const hitX = eagle.x + eagle.radius - 4 > p.x && eagle.x - eagle.radius + 4 < p.x + p.width;
      const hitY = eagle.y - eagle.radius + 4 < p.topH || eagle.y + eagle.radius - 4 > p.topH + p.gap;
      if (hitX && hitY) {
        if (eagle.fireTimer > 0) {
          p.shattered = true;
          p.container.visible = false;
          score += 2;
          document.getElementById('score-display').textContent = score;
          triggerShake(12, 7);
          spawnParticles(p.x + 33, eagle.y, 0xf97316, 28, 1.4);
          addShockwave(p.x + 33, eagle.y, 0xfbbf24, 90);
          addFloatingText(p.x + 33, eagle.y - 20, '+2 🔥', '#fbbf24');
          playTone(220, 90, 'square', 0.22, 0.14);
        } else if (eagle.shieldTimer > 0) {
          p.shattered = true;
          p.container.visible = false;
          eagle.shieldTimer = 0;
          triggerShake(10, 5);
          spawnParticles(eagle.x, eagle.y, 0x38bdf8, 22, 1.2);
          addShockwave(eagle.x, eagle.y, 0x38bdf8, 75);
          addFloatingText(eagle.x, eagle.y - 25, 'پارێزرایت! 🛡️', '#38bdf8');
          playTone(340, 600, 'triangle', 0.2, 0.14);
        } else {
          document.getElementById('final-coins').dataset.earned = String(runCoins);
          gameOver();
          return;
        }
      }
    }

    if (p.x + p.width < -80) {
      p.container.destroy({ children: true });
      pipes.splice(i, 1);
    }
  }

  // کۆکردنەوەی خۆر و هێزە تایبەتەکان
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.x -= speed * dt;
    const bob = Math.sin(gameTime * 0.09) * 5;
    it.sprite.position.set(it.x, it.y + bob);

    if (!it.collected) {
      const dist = Math.hypot(eagle.x - it.x, eagle.y - (it.y + bob));
      if (dist < eagle.radius + 19) {
        it.collected = true;
        if (it.type === 'sun') {
          runCoins++;
          document.getElementById('final-coins').dataset.earned = String(runCoins);
          updateHUD();
          spawnParticles(it.x, it.y, 0xfbbf24, 12);
          addFloatingText(it.x, it.y - 12, '+1 ☀️', '#fde047');
          playTone(760, 1050, 'sine', 0.1, 0.09);
        } else if (it.type === 'shield') {
          eagle.shieldTimer = 600;
          spawnParticles(it.x, it.y, 0x38bdf8, 18);
          addShockwave(it.x, it.y, 0x38bdf8, 65);
          addFloatingText(it.x, it.y - 15, 'قەڵغان! 🛡️', '#38bdf8');
          playTone(520, 820, 'triangle', 0.18, 0.12);
        } else if (it.type === 'fire') {
          eagle.fireTimer = 300;
          spawnParticles(it.x, it.y, 0xef4444, 22);
          addShockwave(it.x, it.y, 0xf97316, 75);
          addFloatingText(it.x, it.y - 15, 'ئاگری نەورۆز! 🔥', '#fb923c');
          playTone(380, 720, 'sawtooth', 0.22, 0.11);
        }
      }
    }

    if (it.collected || it.x < -60) {
      it.sprite.destroy();
      items.splice(i, 1);
    }
  }

  // بەرکەوتن بە زەوی یان سەقف
  if (eagle.y + eagle.radius >= logicalH - 36) {
    document.getElementById('final-coins').dataset.earned = String(runCoins);
    gameOver();
    return;
  }
  if (eagle.y - eagle.radius < 0) {
    eagle.y = eagle.radius;
    eagle.vy = 0;
  }
}

// ============================================================================
// ١٠. دەستپێکردنی PixiJS v7 Application
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  const stageHost = document.getElementById('haloPixiStage');

  pixiApp = new PIXI.Application({
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: 0x070b1e,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    powerPreference: 'high-performance'
  });

  stageHost.appendChild(pixiApp.view);

  bakeAllHaloTextures();

  skyLayer = new PIXI.Container();
  mountainLayer = new PIXI.Container();
  pillarsLayer = new PIXI.Container();
  groundLayer = new PIXI.Container();
  itemsLayer = new PIXI.Container();
  eagleLayer = new PIXI.Container();
  fxLayer = new PIXI.Container();

  pixiApp.stage.addChild(
    skyLayer,
    mountainLayer,
    pillarsLayer,
    groundLayer,
    itemsLayer,
    eagleLayer,
    fxLayer
  );

  updateViewportScale();
  initEnvironmentGraphics();
  buildEagleSprite();
  updateHUD();

  // کۆنترۆڵی پەنجە و ماوس و کیبۆرد
  stageHost.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state === 'PLAYING') flap();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (state === 'PLAYING') flap();
    }
  });

  window.addEventListener('resize', () => {
    setTimeout(updateViewportScale, 40);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(updateViewportScale, 80);
  });

  pixiApp.ticker.maxFPS = 120;
  pixiApp.ticker.add(() => {
    const rawDt = pixiApp.ticker.deltaMS / 16.6667;
    const dt = Math.min(rawDt, 2.2);

    updateGameFrame(dt);
    renderEnvironment();

    if (shakeTime > 0) {
      const scale = pixiApp.stage.scale.x;
      pixiApp.stage.x = (Math.random() - 0.5) * shakeIntensity * scale;
      pixiApp.stage.y = (Math.random() - 0.5) * shakeIntensity * scale;
    } else {
      pixiApp.stage.x = 0;
      pixiApp.stage.y = 0;
    }
  });
});