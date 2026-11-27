// =============================================================================
// YARI KURDI - 8 BALL POOL LANDSCAPE 120FPS ENGINE (CLEAN 3D CUES)
// =============================================================================

(function () {
    const TABLES_15 = [
        { id: 1,  name: '١. دیوەخانی شاهانەی یاری کوردی', currency: 'gold', fee: 1000,     prize: 2000,      img: 'images.png/billiard-table-1.png', felt1: '#c81e1e', felt2: '#7f1111', wood: '#3a1408', gold: '#eab308' },
        { id: 2,  name: '٢. کۆشکی هەولێر',                currency: 'gold', fee: 2500,     prize: 5000,      img: 'images.png/billiard-table-1.png', felt1: '#15803d', felt2: '#064e3b', wood: '#451a03', gold: '#fbbf24' },
        { id: 3,  name: '٣. مێزی سلێمانی',                currency: 'gold', fee: 5000,     prize: 10000,     img: 'images.png/billiard-table-1.png', felt1: '#0f766e', felt2: '#134e4a', wood: '#271206', gold: '#fde047' },
        { id: 4,  name: '٤. دەریای دهۆک',                 currency: 'gold', fee: 15000,    prize: 30000,     img: 'images.png/billiard-table-1.png', felt1: '#1d4ed8', felt2: '#1e3a8a', wood: '#1e1b4b', gold: '#38bdf8' },
        { id: 5,  name: '٥. قەڵای کەلار',                 currency: 'gold', fee: 50000,    prize: 100000,    img: 'images.png/billiard-table-1.png', felt1: '#b45309', felt2: '#78350f', wood: '#1c1917', gold: '#ffd000' },
        { id: 6,  name: '٦. ئاگری کەرکووک',               currency: 'gold', fee: 150000,   prize: 300000,    img: 'images.png/billiard-table-1.png', felt1: '#991b1b', felt2: '#450a0a', wood: '#09090b', gold: '#f59e0b' },
        { id: 7,  name: '٧. زمروودی هەڵەبجە',             currency: 'gold', fee: 400000,   prize: 800000,    img: 'images.png/billiard-table-1.png', felt1: '#047857', felt2: '#022c22', wood: '#312e81', gold: '#34d399' },
        { id: 8,  name: '٨. پردی زاخۆ',                   currency: 'gold', fee: 1000000,  prize: 2000000,   img: 'images.png/billiard-table-1.png', felt1: '#6d28d9', felt2: '#3b0764', wood: '#2e1065', gold: '#e879f9' },
        { id: 9,  name: '٩. تاڤگەی سۆران',                currency: 'gold', fee: 2500000,  prize: 5000000,   img: 'images.png/billiard-table-1.png', felt1: '#0369a1', felt2: '#082f49', wood: '#0f172a', gold: '#7dd3fc' },
        { id: 10, name: '١٠. دەروازەی ڕانیە',             currency: 'gold', fee: 5000000,  prize: 10000000,  img: 'images.png/billiard-table-1.png', felt1: '#4338ca', felt2: '#1e1b4b', wood: '#18181b', gold: '#a5b4fc' },
        { id: 11, name: '١١. سوڵتانی ئامەد',              currency: 'gold', fee: 10000000, prize: 20000000,  img: 'images.png/billiard-table-1.png', felt1: '#be123c', felt2: '#4c0519', wood: '#1c1917', gold: '#ffd000' },
        { id: 12, name: '١٢. یاقووتی مەهاباد',            currency: 'diamonds', fee: 100,  prize: 200,       img: 'images.png/billiard-table-1.png', felt1: '#b91c1c', felt2: '#450a0a', wood: '#09090b', gold: '#ffd000' },
        { id: 13, name: '١٣. ئەفسانەی سنە',               currency: 'diamonds', fee: 500,  prize: 1000,      img: 'images.png/billiard-table-1.png', felt1: '#5b21b6', felt2: '#2e1065', wood: '#0f0724', gold: '#38bdf8' },
        { id: 14, name: '١٤. ئیمپراتۆری کرماشان',          currency: 'diamonds', fee: 2000, prize: 4000,      img: 'images.png/billiard-table-1.png', felt1: '#0f172a', felt2: '#020617', wood: '#3a1408', gold: '#f59e0b' },
        { id: 15, name: '١٥. تەختی یاری کوردی VIP',       currency: 'diamonds', fee: 10000,prize: 20000,     img: 'images.png/billiard-table-1.png', felt1: '#7f1d1d', felt2: '#1e0505', wood: '#000000', gold: '#ffd000' }
    ];

    const CUE_STICKS = [
        // Pack 1: Classic & Pro
        { id: 'bamboo',       name: 'بامبۆ (Bamboo)',              tier: 'classic',   currency: 'gold',     price: 0,       force: 2, aim: 2, spin: 2, pack: 1, row: 0, col: 0, colors: ['#38bdf8','#fde047','#ca8a04','#854d0e'] },
        { id: 'broom',        name: 'گسکی جادوویی (Broom)',        tier: 'classic',   currency: 'gold',     price: 0,       force: 2, aim: 2, spin: 3, pack: 1, row: 0, col: 1, colors: ['#f8fafc','#b45309','#78350f','#451a03'] },
        { id: 'floral',       name: 'چرای زێڕین (Floral)',         tier: 'classic',   currency: 'gold',     price: 1500,    force: 3, aim: 2, spin: 2, pack: 1, row: 0, col: 2, colors: ['#fde047','#dc2626','#f59e0b','#7f1d1d'] },
        { id: 'heart',        name: 'دڵە سوورەکان (Heart)',        tier: 'classic',   currency: 'gold',     price: 2500,    force: 3, aim: 3, spin: 2, pack: 1, row: 0, col: 3, colors: ['#fb7185','#27272a','#f43f5e','#09090b'] },
        { id: 'polar',        name: 'جەمسەری (Polar)',             tier: 'classic',   currency: 'gold',     price: 5000,    force: 4, aim: 3, spin: 3, pack: 1, row: 1, col: 0, colors: ['#38bdf8','#f8fafc','#dc2626','#991b1b'] },
        { id: 'crystal',      name: 'کریستاڵی شین (Crystal)',      tier: 'pro',       currency: 'gold',     price: 15000,   force: 5, aim: 4, spin: 4, pack: 1, row: 1, col: 1, colors: ['#e0f2fe','#38bdf8','#0284c7','#0c4a6e'] },
        { id: 'royal_purp',   name: 'مۆری شاهانە (Royal)',         tier: 'pro',       currency: 'gold',     price: 50000,   force: 6, aim: 5, spin: 5, pack: 1, row: 1, col: 2, colors: ['#fde047','#9333ea','#eab308','#3b0764'] },
        { id: 'obsidian',     name: 'ئۆبسیدیان (Obsidian)',        tier: 'pro',       currency: 'gold',     price: 150000,  force: 7, aim: 6, spin: 6, pack: 1, row: 1, col: 3, colors: ['#f8fafc','#cbd5e1','#334155','#09090b'] },

        // Pack 2: Legendary VIP
        { id: 'lightning',    name: 'بروسکە (Lightning)',          tier: 'legendary', currency: 'diamonds', price: 25,      force: 8, aim: 7, spin: 7, pack: 2, row: 0, col: 0, colors: ['#38bdf8','#0284c7','#e0f2fe','#09090b'] },
        { id: 'samurai',      name: 'شمشێری سامورای (Samurai)',   tier: 'legendary', currency: 'diamonds', price: 40,      force: 8, aim: 8, spin: 7, pack: 2, row: 0, col: 1, colors: ['#f8fafc','#cbd5e1','#eab308','#991b1b'] },
        { id: 'achilles',     name: 'ئەخیلیس (Achilles)',          tier: 'legendary', currency: 'diamonds', price: 60,      force: 8, aim: 7, spin: 8, pack: 2, row: 0, col: 2, colors: ['#fde047','#fef3c7','#d97706','#78350f'] },
        { id: 'water_orb',    name: 'گۆی ئاو (Water Orb)',         tier: 'legendary', currency: 'diamonds', price: 80,      force: 7, aim: 8, spin: 8, pack: 2, row: 0, col: 3, colors: ['#bae6fd','#0ea5e9','#38bdf8','#0369a1'] },
        { id: 'pharaoh',      name: 'فیرعەون (Pharaoh)',           tier: 'legendary', currency: 'diamonds', price: 120,     force: 8, aim: 8, spin: 8, pack: 2, row: 1, col: 0, colors: ['#fde047','#eab308','#1d4ed8','#1e3a8a'] },
        { id: 'viking',       name: 'تەوری ڤایکینگ (Viking)',      tier: 'legendary', currency: 'diamonds', price: 160,     force: 8, aim: 8, spin: 8, pack: 2, row: 1, col: 1, colors: ['#f8fafc','#94a3b8','#e2e8f0','#334155'] },
        { id: 'dragon',       name: 'ئەژدیهای زێڕین (Dragon)',     tier: 'legendary', currency: 'diamonds', price: 250,     force: 8, aim: 8, spin: 8, pack: 2, row: 1, col: 2, colors: ['#fde047','#eab308','#18181b','#09090b'] },
        { id: 'crown',        name: 'تاجی زێڕین (Royal Crown)',    tier: 'legendary', currency: 'diamonds', price: 500,     force: 9, aim: 9, spin: 8, pack: 2, row: 1, col: 3, colors: ['#ffffff','#ffd000','#f59e0b','#b45309'] },

        // Pack 3: Mythical VIP
        { id: 'magma',        name: 'گڕکانی فینیکس (Magma)',       tier: 'legendary', currency: 'diamonds', price: 800,     force: 9, aim: 8, spin: 9, pack: 3, row: 0, col: 0, colors: ['#fde047','#f97316','#dc2626','#450a0a'] },
        { id: 'galaxy',       name: 'گەردوونی ئەڵماس (Galaxy)',    tier: 'legendary', currency: 'diamonds', price: 1000,    force: 8, aim: 9, spin: 9, pack: 3, row: 0, col: 1, colors: ['#e0f2fe','#818cf8','#4f46e5','#1e1b4b'] },
        { id: 'jade_viper',   name: 'ماری زمروود (Jade Viper)',    tier: 'legendary', currency: 'diamonds', price: 1200,    force: 9, aim: 9, spin: 8, pack: 3, row: 0, col: 2, colors: ['#bbf7d0','#22c55e','#eab308','#14532d'] },
        { id: 'clockwork',    name: 'کاتژمێری زێڕین (Clockwork)',  tier: 'legendary', currency: 'diamonds', price: 1500,    force: 9, aim: 9, spin: 9, pack: 3, row: 0, col: 3, colors: ['#fde68a','#d97706','#f59e0b','#78350f'] },
        { id: 'cyber',        name: 'سایبەر پلازما (Cyber)',       tier: 'legendary', currency: 'diamonds', price: 2000,    force: 10, aim: 9, spin: 9, pack: 3, row: 1, col: 0, colors: ['#a855f7','#38bdf8','#1e293b','#09090b'] },
        { id: 'angel',        name: 'باڵی فریشتە (Angel Wings)',   tier: 'legendary', currency: 'diamonds', price: 3000,    force: 9, aim: 10, spin: 9, pack: 3, row: 1, col: 1, colors: ['#ffffff','#f8fafc','#eab308','#cbd5e1'] },
        { id: 'glacial',      name: 'سەهۆڵی یاقووت (Glacial)',     tier: 'legendary', currency: 'diamonds', price: 5000,    force: 10, aim: 9, spin: 10, pack: 3, row: 1, col: 2, colors: ['#e0f2fe','#38bdf8','#0284c7','#1e3a8a'] },
        { id: 'eclipse',      name: 'خۆرگیرانی ڕەش (Eclipse)',     tier: 'legendary', currency: 'diamonds', price: 10000,   force: 10, aim: 10, spin: 10, pack: 3, row: 1, col: 3, colors: ['#f97316','#18181b','#ea580c','#000000'] }
    ];

    const QUICK_CHATS = [
        'لێدانێکی نایاب بوو! 🔥',
        'بەختێکی باش هاوڕێ 🤝',
        'ئافەرم دەستخۆش! 👏',
        'ئاگاداربە نۆرەی منە 😎',
        'زۆر نزیک بوو! 😮',
        'یارییەکی خۆش بوو 🏆'
    ];

    const BALL_COLORS = {
        1: '#facc15', 2: '#2563eb', 3: '#dc2626', 4: '#7c3aed',
        5: '#ea580c', 6: '#16a34a', 7: '#881337', 8: '#09090b',
        9: '#facc15', 10: '#2563eb', 11: '#dc2626', 12: '#7c3aed',
        13: '#ea580c', 14: '#16a34a', 15: '#881337'
    };

    const TABLE_W = 680;
    const TABLE_H = 380;
    const TRACK_AREA_W = 46;
    const LOGICAL_W = TABLE_W + TRACK_AREA_W;
    const LOGICAL_H = TABLE_H;

    const RAIL_X = 40;
    const RAIL_Y = 44;
    const BALL_R = 11.2;
    const POCKET_R = 25;

    const POCKETS = [
        { x: 42, y: 46 },
        { x: TABLE_W / 2, y: 31 },
        { x: TABLE_W - 42, y: 46 },
        { x: 42, y: TABLE_H - 46 },
        { x: TABLE_W / 2, y: TABLE_H - 31 },
        { x: TABLE_W - 42, y: TABLE_H - 46 }
    ];

    const imageCache = {};
    function getImg(src) {
        if (!src) return null;
        if (!imageCache[src]) {
            const im = new Image();
            im.src = src;
            imageCache[src] = im;
        }
        return imageCache[src];
    }

    // دەرهێنانی دارە ٣ ڕەهەندییەکان و سڕینەوەی تەواوی پاشبنەمای مۆر (BFS Flood-Fill)
    const cueSprites = {};

    function processCueCell(img, cue) {
        try {
            const cw = Math.floor(img.naturalWidth / 4);
            const ch = Math.floor(img.naturalHeight / 2);
            if (cw < 20 || ch < 20) return;

            const cellCanvas = document.createElement('canvas');
            cellCanvas.width = cw;
            cellCanvas.height = ch;
            const cctx = cellCanvas.getContext('2d');
            cctx.drawImage(img, cue.col * cw, cue.row * ch, cw, ch, 0, 0, cw, ch);

            const imgData = cctx.getImageData(0, 0, cw, ch);
            const d = imgData.data;
            const total = cw * ch;

            // وەرگرتنی ڕەنگی پاشبنەمای مۆر لە گۆشەکانی خانەکەوە (٥ پیکسڵ ناوەوە تا هێڵی جیاکەرەوە تێکەڵ نەبێت)
            const samples = [
                (5 * cw + 5) * 4,
                (5 * cw + (cw - 6)) * 4,
                ((ch - 6) * cw + 5) * 4,
                ((ch - 6) * cw + (cw - 6)) * 4
            ];
            let bgR = 0, bgG = 0, bgB = 0;
            samples.forEach(p => { bgR += d[p]; bgG += d[p + 1]; bgB += d[p + 2]; });
            bgR /= 4; bgG /= 4; bgB /= 4;

            function isPurpleBg(idx) {
                const p = idx * 4;
                const dist = Math.hypot(d[p] - bgR, d[p + 1] - bgG, d[p + 2] - bgB);
                return dist < 34;
            }

            // سڕینەوەی تەواوی باکگراوندە مۆرەکە لە هەموو لێوارەکانەوە (BFS Flood-Fill)
            const visited = new Uint8Array(total);
            const queue = new Int32Array(total);
            let head = 0, tail = 0;

            for (let x = 0; x < cw; x++) {
                const topIdx = x;
                const botIdx = (ch - 1) * cw + x;
                if (!visited[topIdx] && isPurpleBg(topIdx)) { visited[topIdx] = 1; queue[tail++] = topIdx; }
                if (!visited[botIdx] && isPurpleBg(botIdx)) { visited[botIdx] = 1; queue[tail++] = botIdx; }
            }
            for (let y = 0; y < ch; y++) {
                const leftIdx = y * cw;
                const rightIdx = y * cw + (cw - 1);
                if (!visited[leftIdx] && isPurpleBg(leftIdx)) { visited[leftIdx] = 1; queue[tail++] = leftIdx; }
                if (!visited[rightIdx] && isPurpleBg(rightIdx)) { visited[rightIdx] = 1; queue[tail++] = rightIdx; }
            }

            while (head < tail) {
                const cur = queue[head++];
                d[cur * 4 + 3] = 0;
                const cx = cur % cw;
                const cy = (cur - cx) / cw;

                if (cx > 0) { const n = cur - 1; if (!visited[n] && isPurpleBg(n)) { visited[n] = 1; queue[tail++] = n; } }
                if (cx < cw - 1) { const n = cur + 1; if (!visited[n] && isPurpleBg(n)) { visited[n] = 1; queue[tail++] = n; } }
                if (cy > 0) { const n = cur - cw; if (!visited[n] && isPurpleBg(n)) { visited[n] = 1; queue[tail++] = n; } }
                if (cy < ch - 1) { const n = cur + cw; if (!visited[n] && isPurpleBg(n)) { visited[n] = 1; queue[tail++] = n; } }
            }

            // نەرمکردنی لێوارەکانی دارەکە
            for (let y = 1; y < ch - 1; y++) {
                for (let x = 1; x < cw - 1; x++) {
                    const idx = y * cw + x;
                    if (visited[idx]) continue;
                    if (visited[idx - 1] || visited[idx + 1] || visited[idx - cw] || visited[idx + cw]) {
                        const p = idx * 4;
                        const dist = Math.hypot(d[p] - bgR, d[p + 1] - bgG, d[p + 2] - bgB);
                        if (dist < 52) d[p + 3] = Math.round(((dist - 34) / 18) * 255);
                    }
                }
            }

            cctx.putImageData(imgData, 0, 0);

            // دۆزینەوەی ناوەڕاست و گۆشەی ڕاستەقینەی دارەکە بەرەو سەرەوەی ڕاست
            let sumX = 0, sumY = 0, count = 0;
            for (let y = 0; y < ch; y++) {
                for (let x = 0; x < cw; x++) {
                    if (d[(y * cw + x) * 4 + 3] > 140) { sumX += x; sumY += y; count++; }
                }
            }

            let theta = -Math.PI / 4;
            let meanX = cw / 2, meanY = ch / 2;
            let uMin = -Math.hypot(cw, ch) * 0.4, uMax = Math.hypot(cw, ch) * 0.4;

            if (count > 30) {
                meanX = sumX / count;
                meanY = sumY / count;
                let cxx = 0, cyy = 0, cxy = 0;
                for (let y = 0; y < ch; y++) {
                    for (let x = 0; x < cw; x++) {
                        if (d[(y * cw + x) * 4 + 3] > 140) {
                            const dx = x - meanX, dy = y - meanY;
                            cxx += dx * dx; cyy += dy * dy; cxy += dx * dy;
                        }
                    }
                }
                let calcTheta = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
                if (Math.cos(calcTheta) - Math.sin(calcTheta) < 0) calcTheta += Math.PI;
                if (Math.abs(Math.sin(calcTheta + Math.PI / 4)) < 0.35) theta = calcTheta;

                const cosT = Math.cos(theta), sinT = Math.sin(theta);
                uMin = Infinity; uMax = -Infinity;
                for (let y = 0; y < ch; y++) {
                    for (let x = 0; x < cw; x++) {
                        if (d[(y * cw + x) * 4 + 3] > 140) {
                            const u = (x - meanX) * cosT + (y - meanY) * sinT;
                            if (u < uMin) uMin = u;
                            if (u > uMax) uMax = u;
                        }
                    }
                }
            }

            const cueLen = Math.max(40, uMax - uMin);
            const targetLen = 375;
            const scale = targetLen / cueLen;

            // دانانی دارەکە بە درێژیی تەواو و باریکتر (0.62) لەسەر مێزەکە
            const tableCanvas = document.createElement('canvas');
            tableCanvas.width = 410;
            tableCanvas.height = 76;
            const tctx = tableCanvas.getContext('2d');
            tctx.imageSmoothingEnabled = true;
            tctx.imageSmoothingQuality = 'high';

            const tipXInCell = meanX + uMax * Math.cos(theta);
            const tipYInCell = meanY + uMax * Math.sin(theta);

            tctx.translate(14, tableCanvas.height / 2);
            tctx.scale(scale, scale * 0.62);
            tctx.rotate(Math.PI - theta);
            tctx.translate(-tipXInCell, -tipYInCell);
            tctx.drawImage(cellCanvas, 0, 0);

            cueSprites[cue.id] = {
                tableCanvas,
                tipX: 14,
                shopDataUrl: cellCanvas.toDataURL('image/png')
            };

            if (document.getElementById('cueModal')?.classList.contains('open')) {
                openCueModal();
            }
        } catch (e) {}
    }

    function loadCuePack(packNum) {
        const candidates = [
            `images.png/cues-pack-${packNum}.png`,
            `images.png/cues-pack${packNum}.png`,
            `images.png/cues-pack-${packNum}.jpeg`,
            `images.png/cues-pack-${packNum}.jpg`
        ];
        let idx = 0;
        const img = new Image();
        img.onload = () => {
            CUE_STICKS.filter(c => c.pack === packNum).forEach(c => processCueCell(img, c));
        };
        img.onerror = () => {
            idx++;
            if (idx < candidates.length) img.src = candidates[idx];
        };
        img.src = candidates[0];
    }

    loadCuePack(1);
    loadCuePack(2);
    loadCuePack(3);

    const canvas = document.getElementById('poolCanvas');
    const ctx = canvas.getContext('2d');

    let selectedTable = TABLES_15[0];
    let ownedCueIds = JSON.parse(localStorage.getItem('yk_owned_cues') || '["bamboo","broom"]');
    let savedCueId = localStorage.getItem('yk_equipped_cue') || 'bamboo';
    let selectedCue = CUE_STICKS.find(c => c.id === savedCueId) || CUE_STICKS[0];
    let activeCueFilter = 'all';
    let soundOn = true;
    let audioCtx = null;

    const me = {
        uid: localStorage.getItem('yk_player_uid') || 'p_' + Math.floor(100000 + Math.random() * 900000),
        name: localStorage.getItem('yk_player_name') || 'Ahmad',
        avatar: localStorage.getItem('yk_player_avatar') || 'images.png/controller.png',
        level: parseInt(localStorage.getItem('yk_player_level') || '1', 10)
    };
    localStorage.setItem('yk_player_uid', me.uid);

    let balls = [];
    let tubeBalls = [];
    let aimAngle = 0;
    let pullPower = 0;
    let spinX = 0;
    let spinY = 0;

    let gameMode = 'bot';
    let matchActive = false;
    let isMoving = false;
    let ballInHand = false;
    let draggingCueBall = false;
    let aimingOnCanvas = false;

    let myPlayerNum = 1;
    let currentTurn = 1;
    let groupsAssigned = false;
    let playerGroups = { 1: null, 2: null };

    let shotFirstHitBall = null;
    let shotPocketedBalls = [];
    let cueBallPocketed = false;

    let roomRef = null;
    let lastProcessedShotId = 0;
    let mmTimer = null;

    function fmtNum(n) {
        if (window.formatCompactNumber) return window.formatCompactNumber(n);
        n = Number(n) || 0;
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n);
    }

   function playSfx(type, intensity = 1) {
        if (!soundOn) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const now = audioCtx.currentTime;
            const vol = Math.min(1, Math.max(0.06, intensity));

            if (type === 'cue') {
                // دەنگی لێدانی سەری چەرمی دارەکە لە تۆپی سپی
                const bufSize = Math.floor(audioCtx.sampleRate * 0.035);
                const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
                const noise = audioCtx.createBufferSource();
                noise.buffer = buf;

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1400, now);
                filter.Q.setValueAtTime(2.5, now);

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(vol * 0.75, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

                noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
                noise.start(now);

                const thud = audioCtx.createOscillator();
                const tGain = audioCtx.createGain();
                thud.type = 'sine';
                thud.frequency.setValueAtTime(280, now);
                thud.frequency.exponentialRampToValueAtTime(95, now + 0.04);
                tGain.gain.setValueAtTime(vol * 0.45, now);
                tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                thud.connect(tGain); tGain.connect(audioCtx.destination);
                thud.start(now); thud.stop(now + 0.045);

            } else if (type === 'hit') {
                // دەنگی بەیەکدادانی تۆپە عاجییەکان (Phenolic Clack)
                [2380, 3820, 5490].forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.84, now + 0.032);
                    gain.gain.setValueAtTime((vol * 0.36) / (idx + 1), now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.start(now); osc.stop(now + 0.035);
                });

            } else if (type === 'rail') {
                // دەنگی بەرکەوتنی تۆپ بە قەراغی لاستیکیی مێزەکە
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(135, now);
                osc.frequency.exponentialRampToValueAtTime(52, now + 0.075);
                gain.gain.setValueAtTime(vol * 0.42, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(now); osc.stop(now + 0.08);

            } else if (type === 'pocket') {
                // دەنگی کەوتنەخوارەوە و گلۆربوونەوەی تۆپ لە ناو کونەکەدا
                [0, 0.075, 0.14].forEach((delay, idx) => {
                    const t = now + delay;
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(220 - idx * 35, t);
                    osc.frequency.exponentialRampToValueAtTime(68, t + 0.09);
                    gain.gain.setValueAtTime(0.45 / (idx + 1), t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.start(t); osc.stop(t + 0.095);
                });
            }
        } catch (e) {}
    }

    function resizeCanvas() {
        const holder = document.getElementById('tableStageHolder');
        if (!holder) return;
        const isPortraitRotated = window.innerHeight > window.innerWidth;
        const maxW = (isPortraitRotated ? holder.clientHeight : holder.clientWidth) - 4;
        const maxH = (isPortraitRotated ? holder.clientWidth : holder.clientHeight) - 4;
        if (maxW <= 10 || maxH <= 10) return;

        const aspect = LOGICAL_W / LOGICAL_H;
        let cssW = maxW;
        let cssH = cssW / aspect;
        if (cssH > maxH) {
            cssH = maxH;
            cssW = cssH * aspect;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        canvas.width = Math.round(LOGICAL_W * dpr);
        canvas.height = Math.round(LOGICAL_H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('resize', resizeCanvas);

    function setupHorizontalRack() {
        balls = [];
        tubeBalls = [];

        balls.push({
            num: 0,
            x: RAIL_X + (TABLE_W - RAIL_X * 2) * 0.25,
            y: TABLE_H / 2,
            vx: 0, vy: 0,
            pocketed: false
        });

        const apexX = RAIL_X + (TABLE_W - RAIL_X * 2) * 0.74;
        const apexY = TABLE_H / 2;
        const colDx = BALL_R * Math.sqrt(3) + 0.45;
        const rowDy = BALL_R * 2 + 0.45;

        const rackOrder = [
            1,
            2, 9,
            10, 8, 3,
            4, 14, 7, 11,
            12, 6, 15, 13, 5
        ];

        let idx = 0;
        for (let col = 0; col < 5; col++) {
            const x = apexX + col * colDx;
            const startY = apexY - (col * rowDy) / 2;
            for (let row = 0; row <= col; row++) {
                const num = rackOrder[idx++];
                balls.push({
                    num,
                    x: x,
                    y: startY + row * rowDy,
                    vx: 0, vy: 0,
                    pocketed: false
                });
            }
        }
    }

    function renderLobbyCarousel() {
        const box = document.getElementById('tablesCarousel');
        if (!box) return;
        box.innerHTML = TABLES_15.map(t => {
            const sel = t.id === selectedTable.id;
            const icon = t.currency === 'diamonds'
                ? '<i class="fa-solid fa-gem" style="color:#38bdf8;"></i>'
                : '<i class="fa-solid fa-coins" style="color:#ffd000;"></i>';
            return `
                <div class="table-city-card ${sel ? 'selected' : ''}" onclick="Billiard8BP.selectTable(${t.id})">
                    <div style="font-size:11.5px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.name}</div>
                    <div class="mini-felt-box" style="background:url('${t.img}') center/cover no-repeat, radial-gradient(circle, ${t.felt1}, ${t.felt2}); border-color:${t.gold};"></div>
                    <div style="font-size:10px; color:#cbd5e1;">چوونەژوورەوە: ${icon} <b>${fmtNum(t.fee)}</b></div>
                    <div style="font-size:12px; font-weight:900; color:#4ade80; margin-top:2px;">خەڵات: ${icon} ${fmtNum(t.prize)}</div>
                </div>
            `;
        }).join('');
    }

    function selectTable(id) {
        const f = TABLES_15.find(t => t.id === id);
        if (f) {
            selectedTable = f;
            getImg(f.img);
            document.getElementById('potPrizeTxt').innerText = fmtNum(selectedTable.prize);
            renderLobbyCarousel();
        }
    }

    function chargeEntryFee() {
        if (!window.YariWallet) return true;
        const ok = selectedTable.currency === 'diamonds'
            ? YariWallet.spendDiamonds(selectedTable.fee)
            : YariWallet.spendGold(selectedTable.fee);
        if (!ok) {
            alert(selectedTable.currency === 'diamonds' ? 'ئەڵماسی پێویستت نییە!' : 'گۆڵدی پێویستت نییە!');
            YariWallet.openStore(selectedTable.currency);
            return false;
        }
        return true;
    }

    function rewardWinner() {
        if (!window.YariWallet) return;
        if (selectedTable.currency === 'diamonds') YariWallet.addDiamonds(selectedTable.prize);
        else YariWallet.addGold(selectedTable.prize);
    }

    function recordStats(won) {
        if (!window.firebase || !firebase.apps || !firebase.apps.length || !me.uid) return;
        const ref = firebase.database().ref(`players/${me.uid}`);
        ref.child('gamesPlayed').transaction(c => (c || 0) + 1);
        if (won) ref.child('gamesWon').transaction(c => (c || 0) + 1);
        ref.child('xp').transaction(c => (c || 0) + (won ? 60 : 15));
    }

    function initMatch(mode, myNum, p1, p2) {
        gameMode = mode;
        myPlayerNum = myNum;
        currentTurn = 1;
        groupsAssigned = false;
        playerGroups = { 1: null, 2: null };
        ballInHand = false;
        isMoving = false;
        matchActive = true;
        aimAngle = 0;
        resetSpin();

        document.getElementById('p1NameTxt').innerText = p1.name;
        document.getElementById('p1AvatarImg').src = p1.avatar || 'images.png/controller.png';
        document.getElementById('p1LvlBadge').innerText = `★ ${p1.level || 1}`;

        document.getElementById('p2NameTxt').innerText = p2.name;
        document.getElementById('p2AvatarImg').src = p2.avatar || 'images.png/Royal-Billiard.png';
        document.getElementById('p2LvlBadge').innerText = `★ ${p2.level || 1}`;

        document.getElementById('potPrizeTxt').innerText = fmtNum(selectedTable.prize);

        setupHorizontalRack();
        updateHudSlots();
        setTimeout(resizeCanvas, 50);
    }

    function startBotMatch() {
        if (!chargeEntryFee()) return;
        cleanupOnline();
        document.getElementById('lobbyModal').classList.remove('open');
        document.getElementById('resultModal').classList.remove('open');

        initMatch('bot', 1,
            { name: me.name, avatar: me.avatar, level: me.level },
            { name: 'Leopaul', avatar: 'images.png/Royal-Billiard.png', level: 114 }
        );
        showToast('نۆرەی تۆیە — دارەکە ئاڕاستە بکە و لێدانی سەرەتا بکە');
    }

    function cleanupOnline() {
        if (mmTimer) { clearTimeout(mmTimer); mmTimer = null; }
        if (roomRef) { roomRef.off(); roomRef = null; }
    }

    function startOnlineMatch(privCode = null) {
        if (!window.firebase || !firebase.apps || !firebase.apps.length) {
            startBotMatch();
            return;
        }
        if (!chargeEntryFee()) return;

        cleanupOnline();
        document.getElementById('lobbyModal').classList.remove('open');
        document.getElementById('resultModal').classList.remove('open');
        document.getElementById('matchmakingModal').classList.add('open');
        document.getElementById('mmQuickStartBtn').style.display = 'none';

        const db = firebase.database();

        if (privCode) {
            document.getElementById('mmTitleTxt').innerText = `ژووری هاوڕێیان (کۆد: ${privCode})`;
            document.getElementById('mmSubTxt').innerText = 'هەمان کۆد بدە بە هاوڕێکەت تا بێتە ناو یارییەکە';
            const ref = db.ref(`billiard_live/priv_${selectedTable.id}_${privCode}`);
            ref.once('value', snap => {
                const d = snap.val();
                if (d && d.status === 'waiting' && d.p1 && d.p1.uid !== me.uid) {
                    joinOnlineAsP2(ref, d.p1);
                } else {
                    createOnlineAsP1(ref, true);
                }
            });
            return;
        }

        document.getElementById('mmTitleTxt').innerText = `گەڕان لە ${selectedTable.name}...`;
        document.getElementById('mmSubTxt').innerText = 'بەستنەوە بە یاریزانانی ئۆنڵاین';

        const root = db.ref('billiard_live');
        root.orderByChild('waitKey').equalTo(`t_${selectedTable.id}_wait`).limitToFirst(1).once('value', snap => {
            const val = snap.val();
            if (val) {
                const key = Object.keys(val)[0];
                const rm = val[key];
                if (rm && rm.p1 && rm.p1.uid !== me.uid) {
                    joinOnlineAsP2(root.child(key), rm.p1);
                    return;
                }
            }
            createOnlineAsP1(root.push(), false);
        });
    }

    function createOnlineAsP1(ref, isPriv) {
        roomRef = ref;
        ref.set({
            status: 'waiting',
            waitKey: isPriv ? 'private' : `t_${selectedTable.id}_wait`,
            p1: { uid: me.uid, name: me.name, avatar: me.avatar, level: me.level },
            createdAt: Date.now()
        });
        ref.onDisconnect().remove();

        if (!isPriv) {
            mmTimer = setTimeout(() => {
                const b = document.getElementById('mmQuickStartBtn');
                if (b) b.style.display = 'block';
            }, 4000);
        }

        ref.on('value', snap => {
            const d = snap.val();
            if (!d) return;
            if (d.status === 'playing' && d.p2 && !matchActive) {
                if (mmTimer) clearTimeout(mmTimer);
                document.getElementById('matchmakingModal').classList.remove('open');
                initMatch('online', 1, d.p1, d.p2);
                showToast('یاری دەستی پێکرد! نۆرەی تۆیە');
                bindOnlineEvents(ref);
            }
        });
    }

    function joinOnlineAsP2(ref, p1Data) {
        roomRef = ref;
        const p2Data = { uid: me.uid, name: me.name, avatar: me.avatar, level: me.level };
        ref.update({ status: 'playing', waitKey: 'started', p2: p2Data });
        document.getElementById('matchmakingModal').classList.remove('open');
        initMatch('online', 2, p1Data, p2Data);
        showToast(`بەسترایەوە لەگەڵ ${p1Data.name}! چاوەڕوانی لێدانی سەرەتا بە`);
        bindOnlineEvents(ref);
    }

    function bindOnlineEvents(ref) {
        lastProcessedShotId = 0;

        ref.child('lastShot').on('value', snap => {
            const s = snap.val();
            if (!s || !s.shotId || s.shotId === lastProcessedShotId) return;
            lastProcessedShotId = s.shotId;
            if (s.byPlayer === myPlayerNum) return;

            if (s.cueBallPos) {
                const cb = getCueBall();
                if (cb) { cb.x = s.cueBallPos.x; cb.y = s.cueBallPos.y; cb.pocketed = false; }
                
            }
            aimAngle = s.angle;
            spinX = s.spinX || 0;
            spinY = s.spinY || 0;
            launchShot(s.power, false);
        });

        ref.child('syncState').on('value', snap => {
            const st = snap.val();
            if (!st || st.byPlayer === myPlayerNum || isMoving) return;
            if (Array.isArray(st.balls)) {
                st.balls.forEach(sb => {
                    const localB = balls.find(b => b.num === sb.num);
                    if (localB) {
                        localB.x = sb.x;
                        localB.y = sb.y;
                        localB.vx = 0;
                        localB.vy = 0;
                        localB.pocketed = !!sb.pocketed;
                    }
                });
            }
            if (Array.isArray(st.tubeBalls)) tubeBalls = st.tubeBalls;
            currentTurn = st.currentTurn;
            groupsAssigned = !!st.groupsAssigned;
            if (st.playerGroups) playerGroups = st.playerGroups;
            ballInHand = !!st.ballInHand;
            updateHudSlots();
        });

        ref.child('reaction').on('value', snap => {
            const r = snap.val();
            if (!r || !r.ts || Date.now() - r.ts > 5000) return;
            showSpeechBubble(r.byPlayer === myPlayerNum ? 'left' : 'right', r.text);
        });

        ref.on('value', snap => {
            if (!snap.exists() && matchActive) {
                finishGame(myPlayerNum, 'ڕکابەرەکەت لە یارییەکە دەرچوو!');
            }
        });
    }

    function fallbackToRival() {
        if (roomRef) roomRef.remove();
        cleanupOnline();
        document.getElementById('matchmakingModal').classList.remove('open');
        const names = ['شێرکۆ', 'کاروان', 'دیار', 'ئارام', 'سۆران'];
        const rName = names[Math.floor(Math.random() * names.length)];
        initMatch('bot', 1,
            { name: me.name, avatar: me.avatar, level: me.level },
            { name: rName, avatar: 'images.png/controller.png', level: 88 }
        );
        showToast(`بەسترایەوە لەگەڵ ${rName}! نۆرەی تۆیە`);
    }

    function cancelMatchmaking() {
        if (roomRef) roomRef.remove();
        cleanupOnline();
        if (window.YariWallet) {
            if (selectedTable.currency === 'diamonds') YariWallet.addDiamonds(selectedTable.fee);
            else YariWallet.addGold(selectedTable.fee);
        }
        document.getElementById('matchmakingModal').classList.remove('open');
        document.getElementById('lobbyModal').classList.add('open');
    }

    function openPrivateRoom() {
        const code = prompt('کۆدێکی ٤ ژمارەیی بنووسە بۆ یاریکردن لەگەڵ هاوڕێکەت:', '8899');
        if (code && code.trim()) startOnlineMatch(code.trim());
    }

    function updateHudSlots() {
        const p1Turn = currentTurn === myPlayerNum;
        document.getElementById('p1AvatarFrame').classList.toggle('active-turn', p1Turn);
        document.getElementById('p2AvatarFrame').classList.toggle('active-turn', !p1Turn);

        render7Slots('p1BallSlots', playerGroups[myPlayerNum]);
        render7Slots('p2BallSlots', playerGroups[myPlayerNum === 1 ? 2 : 1]);
    }

    function render7Slots(elId, group) {
        const container = document.getElementById(elId);
        if (!container) return;
        if (!group) {
            container.innerHTML = Array(7).fill('<div class="ball-slot-circle"></div>').join('');
            return;
        }
        const nums = group === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
        container.innerHTML = nums.map(n => {
            const bObj = balls.find(b => b.num === n);
            const isGone = !bObj || bObj.pocketed;
            if (isGone) return '<div class="ball-slot-circle"></div>';
            const isStripe = n >= 9;
            const col = BALL_COLORS[n];
            return `<div class="ball-slot-circle ${isStripe ? 'stripe' : ''}" style="--bcol:${col}; background:${isStripe ? '#fff' : col};"><span>${n}</span></div>`;
        }).join('');
    }

    function showToast(msg) {
        const el = document.getElementById('gameStatusToast');
        if (el) el.innerText = msg;
    }

    function showSpeechBubble(side, text) {
        const parent = document.getElementById(side === 'left' ? 'leftPlayerHud' : 'rightPlayerHud');
        if (!parent) return;
        const old = parent.querySelector('.floating-speech');
        if (old) old.remove();
        const div = document.createElement('div');
        div.className = 'floating-speech';
        div.style[side === 'left' ? 'right' : 'left'] = '0px';
        div.innerText = text;
        parent.appendChild(div);
        setTimeout(() => div.remove(), 2600);
    }

    function sendCheer() {
        const txt = '👍 دەستخۆش! یارییەکی ناوازەیە!';
        showSpeechBubble('left', txt);
        if (gameMode === 'online' && roomRef) {
            roomRef.child('reaction').set({ byPlayer: myPlayerNum, text: txt, ts: Date.now() });
        }
    }

    function openQuickChat() {
        const grid = document.getElementById('quickChatGrid');
        grid.innerHTML = QUICK_CHATS.map(c => `
            <button class="btn-8bp-blue" style="font-size:11px; padding:8px;" onclick="Billiard8BP.sendQuickChat('${c}')">${c}</button>
        `).join('');
        document.getElementById('quickChatModal').classList.add('open');
    }

    function sendQuickChat(text) {
        document.getElementById('quickChatModal').classList.remove('open');
        showSpeechBubble('left', text);
        if (gameMode === 'online' && roomRef) {
            roomRef.child('reaction').set({ byPlayer: myPlayerNum, text, ts: Date.now() });
        }
    }

    function getCueBall() { return balls.find(b => b.num === 0); }
    function isMyTurn() { return matchActive && !isMoving && currentTurn === myPlayerNum; }

    function launchShot(powerRatio, broadcast = true) {
        const cb = getCueBall();
        if (!cb || cb.pocketed || isMoving) return;

        const maxCueSpeed = 22.0 + (selectedCue.force || 3) * 0.7;
        const speed = Math.max(2.0, powerRatio * maxCueSpeed);
        cb.vx = Math.cos(aimAngle) * speed;
        cb.vy = Math.sin(aimAngle) * speed;

        shotFirstHitBall = null;
        shotPocketedBalls = [];
        cueBallPocketed = false;
        ballInHand = false;
        isMoving = true;

        playSfx('cue', powerRatio);

        if (broadcast && gameMode === 'online' && roomRef) {
            const shotId = Date.now();
            lastProcessedShotId = shotId;
            roomRef.child('lastShot').set({
                shotId,
                byPlayer: myPlayerNum,
                angle: aimAngle,
                power: powerRatio,
                spinX,
                spinY,
                cueBallPos: { x: cb.x, y: cb.y }
            });
        }
    }

    function onBallsStopped() {
        isMoving = false;
        const activeP = currentTurn;
        const otherP = activeP === 1 ? 2 : 1;
        const myGrp = playerGroups[activeP];

        if (shotPocketedBalls.includes(8)) {
            const rem = myGrp
                ? balls.filter(b => !b.pocketed && (myGrp === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15))).length
                : 7;
            const win = !cueBallPocketed && myGrp && rem === 0;
            finishGame(win ? activeP : otherP, win ? 'تۆپی ٨ بە یاسایی خرایە ناو سەبەتەوە!' : 'تۆپی ٨ پێش وادەی خۆی کەوتە خوارەوە!');
            return;
        }

        let foul = false;
        let reason = '';

        if (cueBallPocketed) {
            foul = true;
            reason = 'فاول! تۆپی سپی کەوتە ناو سەبەتە';
            const cb = getCueBall();
           if (cb) {
            cb.pocketed = false;
            cb.sinking = null;
            cb.vx = 0; cb.vy = 0;
            cb.x = RAIL_X + (TABLE_W - RAIL_X * 2) * 0.25;
            cb.y = TABLE_H / 2;
        }
        } else if (!shotFirstHitBall) {
            foul = true;
            reason = 'فاول! تۆپی سپی بەر هیچ تۆپێک نەکەوت';
        } else if (groupsAssigned && myGrp) {
            const rem = balls.filter(b => !b.pocketed && (myGrp === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15))).length;
            const isSolid = shotFirstHitBall >= 1 && shotFirstHitBall <= 7;
            const isStripe = shotFirstHitBall >= 9 && shotFirstHitBall <= 15;
            if (rem > 0) {
                if ((myGrp === 'solids' && !isSolid) || (myGrp === 'stripes' && !isStripe)) {
                    foul = true;
                    reason = 'فاول! سەرەتا لە تۆپی ڕکابەرت دا';
                }
            } else if (shotFirstHitBall !== 8) {
                foul = true;
                reason = 'فاول! دەبوو لە تۆپی ٨ بدەیت';
            }
        }

        let scoredOwn = false;
        if (!foul && shotPocketedBalls.length > 0) {
            if (!groupsAssigned) {
                const first = shotPocketedBalls.find(n => n !== 0 && n !== 8);
                if (first) {
                    groupsAssigned = true;
                    const solid = first >= 1 && first <= 7;
                    playerGroups[activeP] = solid ? 'solids' : 'stripes';
                    playerGroups[otherP] = solid ? 'stripes' : 'solids';
                    scoredOwn = true;
                }
            } else {
                const g = playerGroups[activeP];
                scoredOwn = shotPocketedBalls.some(n => g === 'solids' ? (n >= 1 && n <= 7) : (n >= 9 && n <= 15));
            }
        }

        if (foul) {
            currentTurn = otherP;
            ballInHand = true;
            showToast(`⚠️ ${reason} — تۆپی سپی بە دەست دابنێ`);
        } else if (scoredOwn) {
            showToast('🔥 نایابە! بەردەوام بە لە لێدان');
        } else {
            currentTurn = otherP;
            showToast(currentTurn === myPlayerNum ? '🎱 نۆرەی تۆیە!' : '⏳ نۆرەی ڕکابەرەکەتە...');
        }

        resetSpin();
        updateHudSlots();

        if (gameMode === 'online' && roomRef && activeP === myPlayerNum) {
            roomRef.child('syncState').set({
                byPlayer: myPlayerNum,
                balls: balls.map(b => ({ num: b.num, x: b.x, y: b.y, pocketed: b.pocketed })),
                tubeBalls,
                currentTurn,
                groupsAssigned,
                playerGroups,
                ballInHand,
                ts: Date.now()
            });
        }

        if (matchActive && gameMode === 'bot' && currentTurn === 2) {
            setTimeout(runAiTurn, 850);
        }
    }

    function runAiTurn() {
        if (!matchActive || isMoving || currentTurn !== 2) return;
        const cb = getCueBall();
        if (!cb) return;

        const grp = playerGroups[2];
        let targets = balls.filter(b => !b.pocketed && b.num !== 0 && b.num !== 8);
        if (groupsAssigned && grp) {
            const own = balls.filter(b => !b.pocketed && (grp === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15)));
            targets = own.length > 0 ? own : balls.filter(b => !b.pocketed && b.num === 8);
        }
        if (!targets.length) return;

        let bestAng = 0;
        let bestVal = -Infinity;

        targets.forEach(t => {
            POCKETS.forEach(p => {
                const dxP = p.x - t.x;
                const dyP = p.y - t.y;
                const dP = Math.hypot(dxP, dyP) || 1;
                const ux = dxP / dP;
                const uy = dyP / dP;

                const gx = t.x - ux * (BALL_R * 2);
                const gy = t.y - uy * (BALL_R * 2);

                const dxC = gx - cb.x;
                const dyC = gy - cb.y;
                const dC = Math.hypot(dxC, dyC) || 1;
                const align = (dxC / dC) * ux + (dyC / dC) * uy;

                const val = align * 130 - dP * 0.12 - dC * 0.08;
                if (val > bestVal) {
                    bestVal = val;
                    bestAng = Math.atan2(dyC, dxC);
                }
            });
        });

        aimAngle = bestAng + (Math.random() - 0.5) * 0.03;
        launchShot(0.58 + Math.random() * 0.28, false);
    }

    function finishGame(winnerNum, msg) {
        matchActive = false;
        const won = winnerNum === myPlayerNum;
        if (won) rewardWinner();
        recordStats(won);

        document.getElementById('resEmojiTxt').innerText = won ? '🏆' : '💔';
        document.getElementById('resTitleTxt').innerText = won ? 'پیرۆزە بردتەوە!' : 'ئەمجارە دۆڕایت!';
        const unit = selectedTable.currency === 'diamonds' ? 'ئەڵماس 💎' : 'گۆڵد 🪙';
        document.getElementById('resDescTxt').innerText = won
            ? `${msg}\nخەڵاتی ${fmtNum(selectedTable.prize)} ${unit} خرایە سەر جزدانەکەت!`
            : `${msg}\nجارێکی تر هەوڵ بدەرەوە!`;
        document.getElementById('resultModal').classList.add('open');
    }

    function stepPhysics() {
        if (!isMoving) return;

        const STEPS = 8;
        const minX = RAIL_X + BALL_R;
        const maxX = TABLE_W - RAIL_X - BALL_R;
        const minY = RAIL_Y + BALL_R;
        const maxY = TABLE_H - RAIL_Y - BALL_R;

        for (let s = 0; s < STEPS; s++) {
            for (const b of balls) {
                if (b.pocketed) continue;
                b.x += b.vx / STEPS;
                b.y += b.vy / STEPS;
                b.vx *= Math.pow(0.9865, 1 / STEPS);
                b.vy *= Math.pow(0.9865, 1 / STEPS);

                for (const p of POCKETS) {
                    if (Math.hypot(b.x - p.x, b.y - p.y) < POCKET_R) {
                        b.pocketed = true;
                        b.sinking = { px: p.x, py: p.y, startX: b.x, startY: b.y, t: 0 };
                        b.vx = 0; b.vy = 0;
                        playSfx('pocket', 0.9);
                        if (b.num === 0) {
                            cueBallPocketed = true;
                        } else {
                            shotPocketedBalls.push(b.num);
                            tubeBalls.push({ num: b.num, progress: 0 });
                        }
                    break;
                    }
                }
                if (b.pocketed) continue;

                if (b.x < minX) { b.x = minX; b.vx = -b.vx * 0.82; playSfx('rail', Math.abs(b.vx) / 15); }
                if (b.x > maxX) { b.x = maxX; b.vx = -b.vx * 0.82; playSfx('rail', Math.abs(b.vx) / 15); }
                if (b.y < minY) { b.y = minY; b.vy = -b.vy * 0.82; playSfx('rail', Math.abs(b.vy) / 15); }
                if (b.y > maxY) { b.y = maxY; b.vy = -b.vy * 0.82; playSfx('rail', Math.abs(b.vy) / 15); }
            }

            for (let i = 0; i < balls.length; i++) {
                const b1 = balls[i];
                if (b1.pocketed) continue;
                for (let j = i + 1; j < balls.length; j++) {
                    const b2 = balls[j];
                    if (b2.pocketed) continue;

                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const dist = Math.hypot(dx, dy);
                    const minD = BALL_R * 2;

                    if (dist > 0 && dist < minD) {
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const ov = (minD - dist) * 0.5;
                        b1.x -= nx * ov; b1.y -= ny * ov;
                        b2.x += nx * ov; b2.y += ny * ov;

                        const kx = b1.vx - b2.vx;
                        const ky = b1.vy - b2.vy;
                        const p = nx * kx + ny * ky;

                        if (p > 0) {
                            if (!shotFirstHitBall && (b1.num === 0 || b2.num === 0)) {
                                shotFirstHitBall = b1.num === 0 ? b2.num : b1.num;
                            }
                            b1.vx -= p * nx; b1.vy -= p * ny;
                            b2.vx += p * nx; b2.vy += p * ny;

                           if ((b1.num === 0 || b2.num === 0) && (spinX !== 0 || spinY !== 0)) {
                                const cueB = b1.num === 0 ? b1 : b2;
                                const dirX = b1.num === 0 ? nx : -nx;
                                const dirY = b1.num === 0 ? ny : -ny;
                                const spinForce = (2.5 + (selectedCue.spin || 3) * 0.45) * (p / 12);

                                // خاڵ لە خوارەوە (spinY > 0) = گەڕانەوە بۆ دواوە (Backspin) | خاڵ لە سەرەوە (spinY < 0) = پێشەوە (Topspin)
                                cueB.vx += (-dirX * spinY * spinForce * 1.45) + (-dirY * spinX * spinForce);
                                cueB.vy += (-dirY * spinY * spinForce * 1.45) + (dirX * spinX * spinForce);
                                spinX *= 0.15;
                                spinY *= 0.15;
                            }
                            playSfx('hit', Math.min(1, p / 12));
                        }
                    }
                }
            }
        }
let movingAny = false;
        for (const b of balls) {
            if (b.pocketed) continue;
            if (Math.hypot(b.vx, b.vy) < 0.045) {
                b.vx = 0; b.vy = 0;
            } else {
                movingAny = true;
            }
        }
        if (!movingAny) onBallsStopped();
    }

    function drawScene() {
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

        drawRightBallReturnTube();

        const tableImg = getImg(selectedTable.img);
        if (tableImg && tableImg.complete && tableImg.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(0, 0, TABLE_W, TABLE_H, 16);
            ctx.clip();
            ctx.drawImage(tableImg, 0, 0, TABLE_W, TABLE_H);
            ctx.restore();
        } else {
            ctx.fillStyle = selectedTable.wood;
            ctx.beginPath();
            ctx.roundRect(0, 0, TABLE_W, TABLE_H, 16);
            ctx.fill();
            ctx.fillStyle = selectedTable.felt1;
            ctx.fillRect(RAIL_X, RAIL_Y, TABLE_W - RAIL_X * 2, TABLE_H - RAIL_Y * 2);
        }

        const headX = RAIL_X + (TABLE_W - RAIL_X * 2) * 0.25;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(headX, RAIL_Y);
        ctx.lineTo(headX, TABLE_H - RAIL_Y);
        ctx.stroke();
        // قووڵایی تاریکی ٦ کونەکەی سەر مێزەکە
        for (const p of POCKETS) {
            const pg = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, POCKET_R - 2);
            pg.addColorStop(0, '#000000');
            pg.addColorStop(0.75, 'rgba(0, 0, 0, 0.92)');
            pg.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(p.x, p.y, POCKET_R - 2, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const b of balls) {
            if (b.sinking) {
                b.sinking.t += 0.065;
                const t = Math.min(1, b.sinking.t);
                const ease = 1 - Math.pow(1 - t, 2);
                const sx = b.sinking.startX + (b.sinking.px - b.sinking.startX) * ease;
                const sy = b.sinking.startY + (b.sinking.py - b.sinking.startY) * ease;
                const sr = Math.max(2.5, BALL_R * (1 - t * 0.75));

                draw3DBall(b.num, sx, sy, sr);

                ctx.save();
                ctx.beginPath();
                ctx.arc(sx, sy, sr + 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 0, 0, ${t * 0.88})`;
                ctx.fill();
                ctx.restore();

                if (t >= 1) b.sinking = null;
            } else if (!b.pocketed) {
                draw3DBall(b.num, b.x, b.y, BALL_R);
            }
        }

        const cb = getCueBall();
        if (cb && !cb.pocketed && ballInHand && isMyTurn()) {
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(cb.x, cb.y, BALL_R + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (cb && !cb.pocketed && isMyTurn() && !draggingCueBall) {
            drawAimAndCueStick(cb);
        }
    }

    function drawRightBallReturnTube() {
        const startX = TABLE_W - 2;
        const tubeX = TABLE_W + 22;
        const topY = 66;
        const botY = TABLE_H - 36;

        ctx.save();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 24;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, topY);
        ctx.lineTo(tubeX, topY);
        ctx.lineTo(tubeX, botY);
        ctx.stroke();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(startX, topY);
        ctx.lineTo(tubeX, topY);
        ctx.lineTo(tubeX, botY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 2;
        for (let y = topY + 14; y < botY - 8; y += 14) {
            ctx.beginPath();
            ctx.moveTo(tubeX - 8, y);
            ctx.lineTo(tubeX + 8, y);
            ctx.stroke();
        }

        tubeBalls.forEach((tb, idx) => {
            const targetY = botY - 4 - idx * 17;
            if (tb.progress < 1) tb.progress = Math.min(1, tb.progress + 0.06);
            const curY = topY + (targetY - topY) * tb.progress;
            draw3DBall(tb.num, tubeX, curY, 8.2);
        });
        ctx.restore();
    }
function draw3DBall(num, x, y, r) {
        // سێبەری قووڵی تۆپەکە لەسەر مێزەکە
        ctx.beginPath();
        ctx.arc(x + 2.2, y + 3, r * 1.02, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();

        if (num === 0) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
            // خاڵە سوورەکەی Spin لەسەر تۆپی سپی
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(x + spinX * (r * 0.45), y + spinY * (r * 0.45), 2.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const col = BALL_COLORS[num] || '#facc15';
            if (num >= 9) {
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
                ctx.fillStyle = col;
                ctx.fillRect(x - r, y - r * 0.56, r * 2, r * 1.12);
            } else {
                ctx.fillStyle = col;
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            }

            // بازنەی سپی ناوەڕاست بۆ ژمارەکە
            ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
            ctx.beginPath();
            ctx.arc(x, y, r * 0.48, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#09090b';
            ctx.font = `900 ${Math.round(r * 0.68)}px Vazirmatn, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(num), x, y + 0.6);
        }

        // سێبەری دەوری تۆپەکە و بریقەی سەرەوەی چەپ (3D Glossy Specular)
        const shade = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
        shade.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        shade.addColorStop(0.65, 'rgba(0, 0, 0, 0.05)');
        shade.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        ctx.fillStyle = shade;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);

        // خاڵی بریقەی ڕووناکی سەر تۆپەکە
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.34, y - r * 0.36, r * 0.26, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    function drawAimAndCueStick(cb) {
        const dx = Math.cos(aimAngle);
        const dy = Math.sin(aimAngle);

        let closest = 1000;
        let hitBall = null;
        const minX = RAIL_X + BALL_R, maxX = TABLE_W - RAIL_X - BALL_R;
        const minY = RAIL_Y + BALL_R, maxY = TABLE_H - RAIL_Y - BALL_R;

        if (dx > 0.0001) closest = Math.min(closest, (maxX - cb.x) / dx);
        if (dx < -0.0001) closest = Math.min(closest, (minX - cb.x) / dx);
        if (dy > 0.0001) closest = Math.min(closest, (maxY - cb.y) / dy);
        if (dy < -0.0001) closest = Math.min(closest, (minY - cb.y) / dy);

        for (const b of balls) {
            if (b.pocketed || b.num === 0) continue;
            const fx = b.x - cb.x, fy = b.y - cb.y;
            const proj = fx * dx + fy * dy;
            if (proj <= 0) continue;
            const perpSq = (fx * fx + fy * fy) - proj * proj;
            const rSum = BALL_R * 2;
            if (perpSq < rSum * rSum) {
                const d = proj - Math.sqrt(rSum * rSum - perpSq);
                if (d > 0 && d < closest) { closest = d; hitBall = b; }
            }
        }

        const ex = cb.x + dx * closest;
        const ey = cb.y + dy * closest;

        let illegalTarget = false;
        if (hitBall && groupsAssigned && playerGroups[myPlayerNum]) {
            const g = playerGroups[myPlayerNum];
            const rem = balls.filter(b => !b.pocketed && (g === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15))).length;
            if (rem > 0) {
                if (hitBall.num === 8 || (g === 'solids' && hitBall.num >= 9) || (g === 'stripes' && hitBall.num <= 7)) illegalTarget = true;
            } else if (hitBall.num !== 8) {
                illegalTarget = true;
            }
        }

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(cb.x, cb.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        

        ctx.strokeStyle = illegalTarget ? '#ef4444' : '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(ex, ey, BALL_R, 0, Math.PI * 2);
        ctx.stroke();

        if (hitBall && !illegalTarget) {
            const tx = hitBall.x - ex, ty = hitBall.y - ey;
            const tl = Math.hypot(tx, ty) || 1;
            const nx = tx / tl, ny = ty / tl;
            const aimLen = 42 + (selectedCue.aim || 3) * 13;

            // ١. هێڵی ئاڕاستەی تۆپە لێدراوەکە (زەرد)
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2.1;
            ctx.beginPath();
            ctx.moveTo(hitBall.x, hitBall.y);
            ctx.lineTo(hitBall.x + nx * aimLen, hitBall.y + ny * aimLen);
            ctx.stroke();

            // ٢. هێڵی ئاڕاستەی تۆپی سپی خۆت دوای بەرکەوتن (بەپێی گۆشە و Spin)
            const dot = dx * nx + dy * ny;
            let cbx = dx - dot * nx;
            let cby = dy - dot * ny;
            const spinPower = (0.45 + (selectedCue.spin || 3) * 0.06);
            cbx += (-nx * spinY * spinPower) + (-ny * spinX * spinPower * 0.8);
            cby += (-ny * spinY * spinPower) + (nx * spinX * spinPower * 0.8);

            const cbLen = Math.hypot(cbx, cby);
            if (cbLen > 0.04) {
                const cueLineLen = aimLen * 0.72;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.lineWidth = 1.7;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex + (cbx / cbLen) * cueLineLen, ey + (cby / cbLen) * cueLineLen);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        ctx.restore();

        // وێنەکێشانی دارە ٣ ڕەهەندییەکە بەبێ هیچ باکگراوندێک و ڕێک لەسەر هێڵی نیشانەگرتن
        ctx.save();
        ctx.translate(cb.x, cb.y);
        ctx.rotate(aimAngle + Math.PI);
        const offset = BALL_R + 6 + pullPower * 65;

        const sprite = cueSprites[selectedCue.id];
        if (sprite && sprite.tableCanvas) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
            ctx.shadowBlur = 7;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 5;
            ctx.drawImage(sprite.tableCanvas, offset - sprite.tipX, -sprite.tableCanvas.height / 2);
        } else {
            const [cTip, cShaft, cInlay, cButt] = selectedCue.colors || ['#38bdf8', '#fde68a', '#eab308', '#1c1917'];
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 4;

            const grad = ctx.createLinearGradient(offset, -4, offset, 4);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, cShaft);
            grad.addColorStop(1, '#111827');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(offset + 6, -2.2);
            ctx.lineTo(offset + 235, -5.6);
            ctx.lineTo(offset + 235, 5.6);
            ctx.lineTo(offset + 6, 2.2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = cButt;
            ctx.beginPath();
            ctx.moveTo(offset + 125, -3.9);
            ctx.lineTo(offset + 235, -5.6);
            ctx.lineTo(offset + 235, 5.6);
            ctx.lineTo(offset + 125, 3.9);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = cInlay;
            ctx.fillRect(offset + 123, -4.0, 5, 8.0);
            ctx.fillRect(offset + 228, -5.6, 5, 11.2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(offset + 2, -2.2, 4, 4.4);
            ctx.fillStyle = cTip;
            ctx.fillRect(offset, -2.1, 2.5, 4.2);
        }
        ctx.restore();
    }

    function clientToLogical(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const isPortraitRotated = window.innerHeight > window.innerWidth;
        const vx = (clientX - rect.left) / rect.width;
        const vy = (clientY - rect.top) / rect.height;

        if (isPortraitRotated) {
            return { x: vy * LOGICAL_W, y: (1 - vx) * LOGICAL_H };
        }
        return { x: vx * LOGICAL_W, y: vy * LOGICAL_H };
    }

    function onPointerDown(e) {
        if (!isMyTurn()) return;
        const pt = e.touches ? e.touches[0] : e;
        const pos = clientToLogical(pt.clientX, pt.clientY);
        const cb = getCueBall();
        if (!cb) return;

        if (ballInHand && Math.hypot(pos.x - cb.x, pos.y - cb.y) < BALL_R * 2.5) {
            draggingCueBall = true;
            return;
        }
        aimingOnCanvas = true;
        aimAngle = Math.atan2(pos.y - cb.y, pos.x - cb.x);
    }

    function onPointerMove(e) {
        if (!isMyTurn()) return;
        const pt = e.touches ? e.touches[0] : e;
        const pos = clientToLogical(pt.clientX, pt.clientY);
        const cb = getCueBall();
        if (!cb) return;

        if (draggingCueBall) {
            const nx = Math.min(TABLE_W - RAIL_X - BALL_R - 2, Math.max(RAIL_X + BALL_R + 2, pos.x));
            const ny = Math.min(TABLE_H - RAIL_Y - BALL_R - 2, Math.max(RAIL_Y + BALL_R + 2, pos.y));
            const hit = balls.some(b => !b.pocketed && b.num !== 0 && Math.hypot(b.x - nx, b.y - ny) < BALL_R * 2.1);
            if (!hit) { cb.x = nx; cb.y = ny; }
            return;
        }

        if (aimingOnCanvas) {
            aimAngle = Math.atan2(pos.y - cb.y, pos.x - cb.x);
        }
    }

    function onPointerUp() {
        draggingCueBall = false;
        aimingOnCanvas = false;
    }

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onPointerMove(e); }, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);

    const pRail = document.getElementById('powerSliderRail');
    const pFill = document.getElementById('powerSliderFill');
    const pKnob = document.getElementById('powerSliderKnob');
    let pullingPower = false;

    function setPowerVisual(ratio) {
        pullPower = Math.min(1, Math.max(0, ratio));
        pFill.style.height = `${pullPower * 100}%`;
        const maxT = pRail.clientHeight - 42;
        pKnob.style.top = `${4 + pullPower * maxT}px`;
    }

    function updatePowerFromClient(e) {
        if (!isMyTurn()) return;
        const pt = e.touches ? e.touches[0] : e;
        const rect = pRail.getBoundingClientRect();
        const isPortraitRotated = window.innerHeight > window.innerWidth;
        const ratio = isPortraitRotated
            ? 1 - (pt.clientX - rect.left) / rect.width
            : (pt.clientY - rect.top) / rect.height;
        setPowerVisual(ratio);
    }

    function releasePower() {
        if (!pullingPower) return;
        pullingPower = false;
        if (pullPower > 0.06 && isMyTurn()) {
            const p = pullPower;
            setPowerVisual(0);
            launchShot(p, true);
        } else {
            setPowerVisual(0);
        }
    }

    pRail.addEventListener('mousedown', (e) => { pullingPower = true; updatePowerFromClient(e); });
    window.addEventListener('mousemove', (e) => { if (pullingPower) updatePowerFromClient(e); });
    window.addEventListener('mouseup', releasePower);
    pRail.addEventListener('touchstart', (e) => { e.preventDefault(); pullingPower = true; updatePowerFromClient(e); }, { passive: false });
    pRail.addEventListener('touchmove', (e) => { e.preventDefault(); if (pullingPower) updatePowerFromClient(e); }, { passive: false });
    pRail.addEventListener('touchend', releasePower);

    const spinOrb = document.getElementById('spinOrbArea');
    let draggingSpin = false;

    function updateSpin(e) {
        const pt = e.touches ? e.touches[0] : e;
        const rect = spinOrb.getBoundingClientRect();
        const isPortraitRotated = window.innerHeight > window.innerWidth;
        const vx = (pt.clientX - rect.left) / rect.width - 0.5;
        const vy = (pt.clientY - rect.top) / rect.height - 0.5;

        const nx = isPortraitRotated ? vy * 2 : vx * 2;
        const ny = isPortraitRotated ? -vx * 2 : vy * 2;
        const d = Math.hypot(nx, ny);
        const clamped = d > 0.78 ? 0.78 / d : 1;

        spinX = nx * clamped;
        spinY = ny * clamped;
        syncSpinVisual();
    }

    function syncSpinVisual() {
        const orbDot = document.getElementById('spinOrbDot');
        const hudDot = document.getElementById('hudSpinDot');
        if (orbDot) { orbDot.style.left = `${50 + spinX * 42}%`; orbDot.style.top = `${50 + spinY * 42}%`; }
        if (hudDot) { hudDot.style.left = `${50 + spinX * 38}%`; hudDot.style.top = `${50 + spinY * 38}%`; }
    }

    function resetSpin() { spinX = 0; spinY = 0; syncSpinVisual(); }

    spinOrb.addEventListener('mousedown', (e) => { draggingSpin = true; updateSpin(e); });
    window.addEventListener('mousemove', (e) => { if (draggingSpin) updateSpin(e); });
    window.addEventListener('mouseup', () => { draggingSpin = false; });
    spinOrb.addEventListener('touchstart', (e) => { e.preventDefault(); draggingSpin = true; updateSpin(e); }, { passive: false });
    spinOrb.addEventListener('touchmove', (e) => { e.preventDefault(); if (draggingSpin) updateSpin(e); }, { passive: false });
    spinOrb.addEventListener('touchend', () => { draggingSpin = false; });

    function buildCueCardDiv(c) {
        const sprite = cueSprites[c.id];
        if (sprite && sprite.shopDataUrl) {
            return `
                <div class="cue-svg-box">
                    <img src="${sprite.shopDataUrl}" alt="${c.name}" style="width:100%; height:100%; object-fit:contain; transform:scale(1.18);">
                </div>
            `;
        }
        const [cTip, cShaft, cInlay, cButt] = c.colors || ['#38bdf8', '#fde68a', '#eab308', '#1c1917'];
        return `
            <div class="cue-svg-box">
                <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
                    <defs>
                        <linearGradient id="g_${c.id}" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="${cButt}"/>
                            <stop offset="45%" stop-color="${cInlay}"/>
                            <stop offset="92%" stop-color="${cShaft}"/>
                            <stop offset="97%" stop-color="#ffffff"/>
                            <stop offset="100%" stop-color="${cTip}"/>
                        </linearGradient>
                    </defs>
                    <line x1="12" y1="88" x2="88" y2="12" stroke="url(#g_${c.id})" stroke-width="6.5" stroke-linecap="round"/>
                </svg>
            </div>
        `;
    }

    function renderStatSegments(val) {
        let html = '';
        for (let i = 1; i <= 10; i++) {
            html += `<span class="seg-bar ${i <= val ? 'filled' : ''}"></span>`;
        }
        return html;
    }

    function filterCues(filter, btnEl) {
        activeCueFilter = filter;
        if (btnEl) {
            document.querySelectorAll('#cueFilterTabs .cue-tab-pill').forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }
        openCueModal();
    }

    function openCueModal() {
        const box = document.getElementById('cueListContainer');
        if (!box) return;

        const list = CUE_STICKS.filter(c => {
            if (activeCueFilter === 'owned') return ownedCueIds.includes(c.id);
            if (activeCueFilter === 'all') return true;
            return c.tier === activeCueFilter;
        });

        box.innerHTML = list.map(c => {
            const isOwned = ownedCueIds.includes(c.id);
            const isEq = selectedCue.id === c.id;

            let btnHtml = '';
            if (isEq) {
                btnHtml = `<button class="cue-action-btn active">دیاریکراوە ✓</button>`;
            } else if (isOwned) {
                btnHtml = `<button class="cue-action-btn equip" onclick="Billiard8BP.selectCue('${c.id}')">هەڵبژاردن</button>`;
            } else {
                const icon = c.currency === 'diamonds'
                    ? '<i class="fa-solid fa-gem" style="color:#38bdf8;"></i>'
                    : '<i class="fa-solid fa-coins" style="color:#ffd000;"></i>';
                btnHtml = `<button class="cue-action-btn buy" onclick="Billiard8BP.selectCue('${c.id}')">${icon} ${fmtNum(c.price)}</button>`;
            }

            return `
                <div class="royal-cue-card ${isEq ? 'equipped' : ''}">
                    <i class="fa-solid fa-crown cue-card-watermark"></i>
                    <div class="cue-card-title">${c.name}</div>
                    <div class="cue-card-middle">
                        ${buildCueCardDiv(c)}
                        <div class="cue-stats-col">
                            <div class="cue-stat-line" title="هێز (Force)">
                                <span class="cue-stat-ico">⚡</span>
                                <div class="cue-stat-segs">${renderStatSegments(c.force)}</div>
                            </div>
                            <div class="cue-stat-line" title="نیشانە (Aim)">
                                <span class="cue-stat-ico">🎯</span>
                                <div class="cue-stat-segs">${renderStatSegments(c.aim)}</div>
                            </div>
                            <div class="cue-stat-line" title="سوڕان (Spin)">
                                <span class="cue-stat-ico">🔴</span>
                                <div class="cue-stat-segs">${renderStatSegments(c.spin)}</div>
                            </div>
                        </div>
                    </div>
                    ${btnHtml}
                </div>
            `;
        }).join('');

        document.getElementById('cueModal').classList.add('open');
    }

    function selectCue(id) {
        const cue = CUE_STICKS.find(c => c.id === id);
        if (!cue) return;

        if (!ownedCueIds.includes(cue.id)) {
            if (window.YariWallet) {
                const ok = cue.currency === 'diamonds'
                    ? YariWallet.spendDiamonds(cue.price)
                    : YariWallet.spendGold(cue.price);
                if (!ok) {
                    alert(cue.currency === 'diamonds' ? 'ئەڵماسی پێویستت نییە بۆ کڕینی ئەم دارە!' : 'گۆڵدی پێویستت نییە بۆ کڕینی ئەم دارە!');
                    YariWallet.openStore(cue.currency);
                    return;
                }
            }
            ownedCueIds.push(cue.id);
            localStorage.setItem('yk_owned_cues', JSON.stringify(ownedCueIds));
        }

        selectedCue = cue;
        localStorage.setItem('yk_equipped_cue', cue.id);
        openCueModal();
    }

    function openLobby() {
        cleanupOnline();
        matchActive = false;
        document.getElementById('resultModal').classList.remove('open');
        document.getElementById('matchmakingModal').classList.remove('open');
        renderLobbyCarousel();
        document.getElementById('lobbyModal').classList.add('open');
    }

    function rematch() {
        document.getElementById('resultModal').classList.remove('open');
        if (gameMode === 'online') startOnlineMatch();
        else startBotMatch();
    }

    function toggleSound() {
        soundOn = !soundOn;
        document.getElementById('soundToggleMenuBtn').innerText = soundOn ? '🔊 دەنگ: کراوەیە' : '🔇 دەنگ: بێدەنگە';
    }

    function loop120FPS() {
        stepPhysics();
        drawScene();
        requestAnimationFrame(loop120FPS);
    }

    window.Billiard8BP = {
        selectTable,
        startOnlineMatch,
        startBotMatch,
        openPrivateRoom,
        fallbackToRival,
        cancelMatchmaking,
        openLobby,
        rematch,
        toggleSound,
        sendCheer,
        openQuickChat,
        sendQuickChat,
        filterCues,
        openCueModal,
        selectCue,
        openPauseMenu: () => document.getElementById('pauseModal').classList.add('open'),
        openSpinModal: () => document.getElementById('spinModal').classList.add('open'),
        resetSpin
    };

    window.addEventListener('DOMContentLoaded', () => {
        resizeCanvas();
        setupHorizontalRack();
        renderLobbyCarousel();
        render7Slots('p1BallSlots', null);
        render7Slots('p2BallSlots', null);
        requestAnimationFrame(loop120FPS);
    });
})();