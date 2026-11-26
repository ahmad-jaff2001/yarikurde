// =============================================================================
// YARI KURDI - ROYAL 8-BALL POOL 120FPS ENGINE (15 TABLES + ONLINE + AI)
// =============================================================================

(function () {
    // ١٥ دیزاینی مێزی جیاواز و گرانتر
    const TABLES_15 = [
        { id: 1,  name: '١. دیوەخانی هەولێر',    currency: 'gold',     fee: 500,      prize: 1000,      felt1: '#15803d', felt2: '#064e3b', rail: '#5c2d0c', trim: '#d97706', emblem: 'ERBIL' },
        { id: 2,  name: '٢. مێزی سلێمانی',       currency: 'gold',     fee: 1500,     prize: 3000,      felt1: '#0f766e', felt2: '#115e59', rail: '#451a03', trim: '#fbbf24', emblem: 'SULI' },
        { id: 3,  name: '٣. کۆشکی دهۆک',         currency: 'gold',     fee: 5000,     prize: 10000,     felt1: '#1d4ed8', felt2: '#1e3a8a', rail: '#3b0764', trim: '#38bdf8', emblem: 'DUHOK' },
        { id: 4,  name: '٤. قەڵای کەلار',         currency: 'gold',     fee: 15000,    prize: 30000,     felt1: '#b45309', felt2: '#78350f', rail: '#27272a', trim: '#ffd000', emblem: 'KALAR' },
        { id: 5,  name: '٥. ئاگری کەرکووک',      currency: 'gold',     fee: 50000,    prize: 100000,    felt1: '#b91c1c', felt2: '#7f1d1d', rail: '#18181b', trim: '#f97316', emblem: 'KIRKUK' },
        { id: 6,  name: '٦. زمروودی هەڵەبجە',    currency: 'gold',     fee: 150000,   prize: 300000,    felt1: '#047857', felt2: '#022c22', rail: '#312e81', trim: '#34d399', emblem: 'HALABJA' },
        { id: 7,  name: '٧. پردی زاخۆ',          currency: 'gold',     fee: 400000,   prize: 800000,    felt1: '#6d28d9', felt2: '#4c1d95', rail: '#422006', trim: '#e879f9', emblem: 'ZAKHO' },
        { id: 8,  name: '٨. تاڤگەی سۆران',       currency: 'gold',     fee: 1000000,  prize: 2000000,   felt1: '#0369a1', felt2: '#082f49', rail: '#0f172a', trim: '#7dd3fc', emblem: 'SORAN' },
        { id: 9,  name: '٩. دەروازەی ڕانیە',     currency: 'gold',     fee: 3000000,  prize: 6000000,   felt1: '#4338ca', felt2: '#1e1b4b', rail: '#3f3f46', trim: '#a5b4fc', emblem: 'RANYA' },
        { id: 10, name: '١٠. تاجی خانەقین',      currency: 'gold',     fee: 10000000, prize: 20000000,  felt1: '#9d174d', felt2: '#500724', rail: '#1c1917', trim: '#f472b6', emblem: 'KHANAQIN' },
        { id: 11, name: '١١. سوڵتانی ئامەد',     currency: 'gold',     fee: 25000000, prize: 50000000,  felt1: '#374151', felt2: '#111827', rail: '#713f12', trim: '#fde047', emblem: 'AMED' },
        { id: 12, name: '١٢. یاقووتی مەهاباد',   currency: 'diamonds', fee: 100,      prize: 200,       felt1: '#991b1b', felt2: '#450a0a', rail: '#09090b', trim: '#ffd000', emblem: 'MAHABAD' },
        { id: 13, name: '١٣. ئەفسانەی سنە',      currency: 'diamonds', fee: 500,      prize: 1000,      felt1: '#5b21b6', felt2: '#2e1065', rail: '#1e1b4b', trim: '#38bdf8', emblem: 'SANANDAJ' },
        { id: 14, name: '١٤. ئیمپراتۆری کرماشان', currency: 'diamonds', fee: 2000,     prize: 4000,      felt1: '#0f172a', felt2: '#020617', rail: '#451a03', trim: '#f59e0b', emblem: 'KERMANSHAH' },
        { id: 15, name: '١٥. تەختی یاری کوردی VIP', currency: 'diamonds', fee: 10000, prize: 20000,     felt1: '#581c87', felt2: '#1e0536', rail: '#000000', trim: '#ffd000', emblem: 'YARI KURDI VIP' }
    ];

    const BALL_COLORS = {
        1: '#facc15', 2: '#2563eb', 3: '#dc2626', 4: '#7c3aed',
        5: '#ea580c', 6: '#16a34a', 7: '#881337', 8: '#09090b',
        9: '#facc15', 10: '#2563eb', 11: '#dc2626', 12: '#7c3aed',
        13: '#ea580c', 14: '#16a34a', 15: '#881337'
    };

    // قەبارەی ستانداردی مێز (ئاسۆیی یان ستوونی بۆ مۆبایل: ستوونی 360x680 زۆر گونجاوە بۆ مۆبایل)
    const LOGICAL_W = 360;
    const LOGICAL_H = 660;
    const RAIL_SIZE = 28;
    const BALL_R = 11.2;
    const POCKET_R = 20.5;

    const POCKETS = [
        { x: RAIL_SIZE + 2, y: RAIL_SIZE + 2 },
        { x: LOGICAL_W - RAIL_SIZE - 2, y: RAIL_SIZE + 2 },
        { x: RAIL_SIZE - 3, y: LOGICAL_H / 2 },
        { x: LOGICAL_W - RAIL_SIZE + 3, y: LOGICAL_H / 2 },
        { x: RAIL_SIZE + 2, y: LOGICAL_H - RAIL_SIZE - 2 },
        { x: LOGICAL_W - RAIL_SIZE - 2, y: LOGICAL_H - RAIL_SIZE - 2 }
    ];

    const canvas = document.getElementById('poolCanvas');
    const ctx = canvas.getContext('2d');

    let selectedTable = TABLES_15[0];
    let soundOn = true;
    let audioCtx = null;

    const me = {
        uid: localStorage.getItem('yk_player_uid') || 'p_' + Math.floor(100000 + Math.random() * 900000),
        name: localStorage.getItem('yk_player_name') || 'یاریزان',
        avatar: localStorage.getItem('yk_player_avatar') || 'images.png/controller.png'
    };
    localStorage.setItem('yk_player_uid', me.uid);

    let balls = [];
    let pocketingAnims = [];
    let aimAngle = -Math.PI / 2;
    let pullPower = 0; // 0 to 1
    let spinX = 0;     // -1 to 1
    let spinY = 0;     // -1 to 1

    let gameMode = 'bot'; // 'bot' | 'online'
    let matchActive = false;
    let isMoving = false;
    let ballInHand = false;
    let draggingCueBall = false;
    let aimingOnCanvas = false;

    let myPlayerNum = 1; // 1 or 2
    let currentTurn = 1; // 1 or 2
    let groupsAssigned = false;
    let playerGroups = { 1: null, 2: null }; // 'solids' | 'stripes'

    let shotFirstHitBall = null;
    let shotPocketedBalls = [];
    let cueBallPocketed = false;

    // کۆنترۆڵی ئۆنڵاین (Firebase)
    let roomRef = null;
    let activeRoomKey = null;
    let lastProcessedShotId = 0;
    let mmFallbackTimer = null;

    function fmtNum(n) {
        if (window.formatCompactNumber) return window.formatCompactNumber(n);
        return Number(n || 0).toLocaleString();
    }

    // دەنگی بێ فایلی دەرەکی (Web Audio Synthesizer)
    function playSfx(type, intensity = 1) {
        if (!soundOn) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const vol = Math.min(1, Math.max(0.05, intensity));
            if (type === 'hit') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
                gain.gain.setValueAtTime(vol * 0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'rail') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(65, now + 0.06);
                gain.gain.setValueAtTime(vol * 0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.065);
            } else if (type === 'pocket') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.start(now);
                osc.stop(now + 0.17);
            }
        } catch (e) {}
    }

    function resizeCanvas() {
        const holder = document.querySelector('.canvas-holder');
        if (!holder) return;
        const maxH = holder.clientHeight - 4;
        const maxW = holder.clientWidth - 4;
        const aspect = LOGICAL_W / LOGICAL_H;

        let cssH = maxH;
        let cssW = cssH * aspect;
        if (cssW > maxW) {
            cssW = maxW;
            cssH = cssW / aspect;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        canvas.width = Math.round(LOGICAL_W * dpr);
        canvas.height = Math.round(LOGICAL_H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('resize', resizeCanvas);

    // ڕێکخستنی ١٦ تۆپەکە لە سەرەتای یاری
    function setupRack() {
        balls = [];
        pocketingAnims = [];

        // تۆپی سپی (Cue Ball = 0) لە بەشی خوارەوە
        balls.push({
            num: 0,
            x: LOGICAL_W / 2,
            y: LOGICAL_H * 0.74,
            vx: 0, vy: 0,
            pocketed: false
        });

        // سێگۆشەی ١٥ تۆپەکە لە بەشی سەرەوە
        const apexX = LOGICAL_W / 2;
        const apexY = LOGICAL_H * 0.27;
        const rowDy = BALL_R * Math.sqrt(3) + 0.45;
        const colDx = BALL_R * 2 + 0.45;

        const rackOrder = [
            1,
            9, 2,
            3, 8, 10,
            11, 4, 12, 5,
            6, 13, 14, 7, 15
        ];

        let idx = 0;
        for (let row = 0; row < 5; row++) {
            const y = apexY - row * rowDy;
            const startX = apexX - (row * colDx) / 2;
            for (let col = 0; col <= row; col++) {
                const num = rackOrder[idx++];
                balls.push({
                    num,
                    x: startX + col * colDx,
                    y: y,
                    vx: 0, vy: 0,
                    pocketed: false
                });
            }
        }
    }

    function renderTablesLobby() {
        const box = document.getElementById('tablesListContainer');
        if (!box) return;
        box.innerHTML = TABLES_15.map(t => {
            const isSel = t.id === selectedTable.id;
            const curIcon = t.currency === 'diamonds'
                ? '<i class="fa-solid fa-gem" style="color:#38bdf8;"></i>'
                : '<i class="fa-solid fa-coins" style="color:#ffd000;"></i>';
            return `
                <div class="table-tier-card ${isSel ? 'selected' : ''}" onclick="BilliardEngine.selectTable(${t.id})">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="mini-table-preview" style="background:radial-gradient(circle, ${t.felt1}, ${t.felt2}); border-color:${t.rail};">
                            <div style="position:absolute; inset:3px; border:1px solid ${t.trim}; border-radius:4px;"></div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:13px; font-weight:900; color:#fff;">${t.name}</div>
                            <div style="font-size:10.5px; color:#cbd5e1;">چوونەژوورەوە: ${curIcon} <b>${fmtNum(t.fee)}</b></div>
                        </div>
                    </div>
                    <div style="text-align:left;">
                        <div style="font-size:10px; color:#fde047;">خەڵاتی براوە</div>
                        <div style="font-size:13.5px; font-weight:900; color:#4ade80;">${curIcon} ${fmtNum(t.prize)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function selectTable(id) {
        const found = TABLES_15.find(t => t.id === id);
        if (found) {
            selectedTable = found;
            renderTablesLobby();
            updateTableHeaderBadge();
        }
    }

    function updateTableHeaderBadge() {
        document.getElementById('activeTableNameBadge').innerText = selectedTable.name;
        document.getElementById('activePrizeAmount').innerText = fmtNum(selectedTable.prize);
        const ico = document.getElementById('activePrizeIcon');
        ico.className = selectedTable.currency === 'diamonds' ? 'fa-solid fa-gem' : 'fa-solid fa-coins';
        ico.style.color = selectedTable.currency === 'diamonds' ? '#38bdf8' : '#ffd000';
    }

    function chargeEntryFee() {
        if (!window.YariWallet) return true;
        const ok = selectedTable.currency === 'diamonds'
            ? YariWallet.spendDiamonds(selectedTable.fee)
            : YariWallet.spendGold(selectedTable.fee);
        if (!ok) {
            alert(selectedTable.currency === 'diamonds' ? 'ئەڵماسی پێویستت نییە بۆ ئەم مێزە!' : 'گۆڵدی پێویستت نییە بۆ ئەم مێزە!');
            YariWallet.openStore(selectedTable.currency);
            return false;
        }
        return true;
    }

    function rewardWinnerPrize() {
        if (!window.YariWallet) return;
        if (selectedTable.currency === 'diamonds') {
            YariWallet.addDiamonds(selectedTable.prize);
        } else {
            YariWallet.addGold(selectedTable.prize);
        }
    }

    function recordMatchStats(won) {
        if (!window.firebase || !firebase.apps || !firebase.apps.length || !me.uid) return;
        const pRef = firebase.database().ref(`players/${me.uid}`);
        pRef.child('gamesPlayed').transaction(c => (c || 0) + 1);
        if (won) pRef.child('gamesWon').transaction(c => (c || 0) + 1);
        pRef.child('xp').transaction(c => (c || 0) + (won ? 60 : 15));
    }

    function initMatchState(mode, myNum, p1Data, p2Data) {
        gameMode = mode;
        myPlayerNum = myNum;
        currentTurn = 1;
        groupsAssigned = false;
        playerGroups = { 1: null, 2: null };
        ballInHand = false;
        isMoving = false;
        matchActive = true;
        aimAngle = -Math.PI / 2;
        resetSpin();

        document.getElementById('p1Name').innerText = p1Data.name;
        document.getElementById('p1Avatar').src = p1Data.avatar || 'images.png/controller.png';
        document.getElementById('p2Name').innerText = p2Data.name;
        document.getElementById('p2Avatar').src = p2Data.avatar || 'images.png/Royal-Billiard.png';

        updateTableHeaderBadge();
        setupRack();
        updateHudUI();
        resizeCanvas();
    }

    function startBotMatch() {
        if (!chargeEntryFee()) return;
        cleanupOnlineRoom();
        document.getElementById('lobbyModal').classList.remove('open');
        document.getElementById('resultModal').classList.remove('open');

        initMatchState('bot', 1,
            { name: me.name, avatar: me.avatar },
            { name: 'پاڵەوانی زیرەک 🤖', avatar: 'images.png/Royal-Billiard.png' }
        );
        setStatus('🎱 نۆرەی تۆیە! لێدانی سەرەتا (Break) ئەنجام بدە');
    }

    // سیستمی ئۆنڵاین لە ڕێگەی Firebase
    function cleanupOnlineRoom() {
        if (mmFallbackTimer) { clearTimeout(mmFallbackTimer); mmFallbackTimer = null; }
        if (roomRef) {
            roomRef.off();
            roomRef = null;
        }
        activeRoomKey = null;
    }

    function startOnlineMatch(customCode = null) {
        if (!window.firebase || !firebase.apps || !firebase.apps.length) {
            startBotMatch();
            return;
        }
        if (!chargeEntryFee()) return;

        cleanupOnlineRoom();
        document.getElementById('lobbyModal').classList.remove('open');
        document.getElementById('resultModal').classList.remove('open');
        document.getElementById('matchmakingModal').classList.add('open');
        document.getElementById('mmPlayBotNowBtn').style.display = 'none';

        const db = firebase.database();

        if (customCode) {
            document.getElementById('mmTitle').innerText = `ژووری هاوڕێیان (کۆد: ${customCode})`;
            document.getElementById('mmSubtitle').innerText = 'ئەم کۆدە بدە بە هاوڕێکەت تا بێتە ناو هەمان مێز';
            const privKey = `priv_${selectedTable.id}_${customCode}`;
            joinOrCreateFirebaseRoom(db.ref(`billiard_matches/${privKey}`), privKey, true);
            return;
        }

        document.getElementById('mmTitle').innerText = `گەڕان لە ${selectedTable.name}...`;
        document.getElementById('mmSubtitle').innerText = 'بەستنەوە بە یاریزانانی ئۆنڵاین';

        const roomsRoot = db.ref('billiard_matches');
        roomsRoot.orderByChild('tierWait').equalTo(`t_${selectedTable.id}_waiting`).limitToFirst(1).once('value', snap => {
            const val = snap.val();
            if (val) {
                const existingKey = Object.keys(val)[0];
                const existingRoom = val[existingKey];
                if (existingRoom && existingRoom.p1 && existingRoom.p1.uid !== me.uid) {
                    joinAsPlayer2(roomsRoot.child(existingKey), existingKey, existingRoom.p1);
                    return;
                }
            }
            const newRef = roomsRoot.push();
            createAsPlayer1(newRef, newRef.key, false);
        });
    }

    function joinOrCreateFirebaseRoom(ref, key, isPrivate) {
        ref.once('value', snap => {
            const d = snap.val();
            if (d && d.status === 'waiting' && d.p1 && d.p1.uid !== me.uid) {
                joinAsPlayer2(ref, key, d.p1);
            } else {
                createAsPlayer1(ref, key, isPrivate);
            }
        });
    }

    function createAsPlayer1(ref, key, isPrivate) {
        roomRef = ref;
        activeRoomKey = key;
        const payload = {
            tableId: selectedTable.id,
            status: 'waiting',
            tierWait: isPrivate ? `priv_${key}` : `t_${selectedTable.id}_waiting`,
            p1: { uid: me.uid, name: me.name, avatar: me.avatar },
            createdAt: Date.now()
        };
        ref.set(payload);
        ref.onDisconnect().remove();

        if (!isPrivate) {
            mmFallbackTimer = setTimeout(() => {
                const btn = document.getElementById('mmPlayBotNowBtn');
                if (btn) btn.style.display = 'flex';
            }, 4500);
        }

        ref.on('value', snap => {
            const data = snap.val();
            if (!data) return;
            if (data.status === 'playing' && data.p2 && !matchActive) {
                if (mmFallbackTimer) clearTimeout(mmFallbackTimer);
                document.getElementById('matchmakingModal').classList.remove('open');
                initMatchState('online', 1, data.p1, data.p2);
                setStatus('🎱 یاریزان دۆزرایەوە! نۆرەی تۆیە لێدانی سەرەتا بکەیت');
                listenToOnlineShots(ref);
            }
        });
    }

    function joinAsPlayer2(ref, key, p1Data) {
        roomRef = ref;
        activeRoomKey = key;
        const p2Data = { uid: me.uid, name: me.name, avatar: me.avatar };
        ref.update({
            status: 'playing',
            tierWait: 'started',
            p2: p2Data
        });
        document.getElementById('matchmakingModal').classList.remove('open');
        initMatchState('online', 2, p1Data, p2Data);
        setStatus(`🎱 یاری دەستی پێکرد! نۆرەی ${p1Data.name}ـە`);
        listenToOnlineShots(ref);
    }

    function listenToOnlineShots(ref) {
        lastProcessedShotId = 0;
        ref.child('lastShot').on('value', snap => {
            const s = snap.val();
            if (!s || !s.shotId || s.shotId === lastProcessedShotId) return;
            lastProcessedShotId = s.shotId;
            if (s.byPlayer === myPlayerNum) return;

            if (s.cueBallPos) {
                const cb = getCueBall();
                if (cb) {
                    cb.x = s.cueBallPos.x;
                    cb.y = s.cueBallPos.y;
                    cb.pocketed = false;
                }
            }
            aimAngle = s.angle;
            spinX = s.spinX || 0;
            spinY = s.spinY || 0;
            executeShotPhysics(s.power, false);
        });
    }

    function fallbackToOnlineBot() {
        cleanupOnlineRoom();
        document.getElementById('matchmakingModal').classList.remove('open');
        const kurdishRivals = ['کاروان هەولێری', 'دیار سلێمانی', 'ئارام دهۆکی', 'میران کەلاری', 'شێرکۆ کەرکووکی'];
        const rName = kurdishRivals[Math.floor(Math.random() * kurdishRivals.length)];
        initMatchState('bot', 1,
            { name: me.name, avatar: me.avatar },
            { name: rName, avatar: 'images.png/controller.png' }
        );
        setStatus(`🎱 بەسترایەوە لەگەڵ ${rName}! نۆرەی تۆیە`);
    }

    function cancelMatchmaking() {
        if (roomRef) roomRef.remove();
        cleanupOnlineRoom();
        if (window.YariWallet) {
            if (selectedTable.currency === 'diamonds') YariWallet.addDiamonds(selectedTable.fee);
            else YariWallet.addGold(selectedTable.fee);
        }
        document.getElementById('matchmakingModal').classList.remove('open');
        document.getElementById('lobbyModal').classList.add('open');
    }

    function openPrivateRoomPrompt() {
        const code = prompt('کۆدێکی ٤ ژمارەیی بنووسە (تۆ و هاوڕێکەت هەمان کۆد بنووسن):', '7700');
        if (code && code.trim().length > 0) {
            startOnlineMatch(code.trim());
        }
    }

    function getCueBall() {
        return balls.find(b => b.num === 0);
    }

    function isMyTurn() {
        return matchActive && !isMoving && currentTurn === myPlayerNum;
    }

    function setStatus(txt) {
        const el = document.getElementById('gameStatusText');
        if (el) el.innerText = txt;
    }

    function updateHudUI() {
        document.getElementById('hudPlayer1').classList.toggle('active-turn', currentTurn === 1);
        document.getElementById('hudPlayer2').classList.toggle('active-turn', currentTurn === 2);
        document.getElementById('turnClockBox').innerText = currentTurn === myPlayerNum ? 'نۆرەی تۆیە' : 'نۆرەی ڕکابەر';

        [1, 2].forEach(pNum => {
            const container = document.getElementById(`p${pNum}Targets`);
            const grp = playerGroups[pNum];
            if (!grp) {
                container.innerHTML = `<span style="font-size:9.5px; color:#a49ec8;">مێز کراوەیە</span>`;
                return;
            }
            const remaining = balls.filter(b => !b.pocketed && (grp === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15)));
            if (remaining.length === 0) {
                container.innerHTML = `<span class="b-dot" style="background:#000; border-color:#ffd000;"></span> <span style="font-size:9.5px; color:#ffd000; font-weight:900;">تۆپی 8</span>`;
            } else {
                container.innerHTML = remaining.map(b => `<span class="b-dot ${b.num >= 9 ? 'stripe' : ''}" style="background:${BALL_COLORS[b.num]};"></span>`).join('');
            }
        });
    }

    // لێدانی تۆپەکە
    function executeShotPhysics(powerRatio, broadcastIfOnline = true) {
        const cb = getCueBall();
        if (!cb || cb.pocketed || isMoving) return;

        const maxSpeed = 24.5;
        const speed = Math.max(1.8, powerRatio * maxSpeed);
        cb.vx = Math.cos(aimAngle) * speed;
        cb.vy = Math.sin(aimAngle) * speed;

        shotFirstHitBall = null;
        shotPocketedBalls = [];
        cueBallPocketed = false;
        ballInHand = false;
        isMoving = true;

        playSfx('hit', powerRatio);

        if (broadcastIfOnline && gameMode === 'online' && roomRef) {
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

    // هەڵسەنگاندنی یاسای 8-Ball دوای وەستانی تۆپەکان
    function evaluateTurnEnd() {
        isMoving = false;
        const activeP = currentTurn;
        const otherP = activeP === 1 ? 2 : 1;
        const myGrp = playerGroups[activeP];

        const p8 = shotPocketedBalls.includes(8);
        if (p8) {
            const myRemaining = myGrp
                ? balls.filter(b => !b.pocketed && (myGrp === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15))).length
                : 7;
            const legal8 = !cueBallPocketed && myGrp && myRemaining === 0;
            finishMatch(legal8 ? activeP : otherP, legal8 ? 'تۆپی ٨ بە یاسایی خرایە سەبەتەوە!' : 'تۆپی ٨ بە هەڵە خرایە سەبەتەوە!');
            return;
        }

        let foul = false;
        let foulReason = '';

        if (cueBallPocketed) {
            foul = true;
            foulReason = 'فاول! تۆپی سپی کەوتە ناو سەبەتە';
            const cb = getCueBall();
            if (cb) {
                cb.pocketed = false;
                cb.vx = 0; cb.vy = 0;
                cb.x = LOGICAL_W / 2;
                cb.y = LOGICAL_H * 0.74;
            }
        } else if (!shotFirstHitBall) {
            foul = true;
            foulReason = 'فاول! تۆپی سپی بەر هیچ تۆپێک نەکەوت';
        } else if (groupsAssigned && myGrp) {
            const myRemaining = balls.filter(b => !b.pocketed && (myGrp === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15))).length;
            const hitIsSolid = shotFirstHitBall >= 1 && shotFirstHitBall <= 7;
            const hitIsStripe = shotFirstHitBall >= 9 && shotFirstHitBall <= 15;
            if (myRemaining > 0) {
                if ((myGrp === 'solids' && !hitIsSolid) || (myGrp === 'striids' && !hitIsStripe) || (myGrp === 'stripes' && !hitIsStripe)) {
                    foul = true;
                    foulReason = 'فاول! سەرەتا لە تۆپی ڕکابەرت دا';
                }
            } else if (shotFirstHitBall !== 8) {
                foul = true;
                foulReason = 'فاول! دەبوو لە تۆپی ٨ بدەیت';
            }
        }

        let scoredOwnBall = false;
        if (!foul && shotPocketedBalls.length > 0) {
            if (!groupsAssigned) {
                const firstPock = shotPocketedBalls.find(n => n !== 0 && n !== 8);
                if (firstPock) {
                    groupsAssigned = true;
                    const isSolid = firstPock >= 1 && firstPock <= 7;
                    playerGroups[activeP] = isSolid ? 'solids' : 'stripes';
                    playerGroups[otherP] = isSolid ? 'stripes' : 'solids';
                    scoredOwnBall = true;
                }
            } else {
                const currentGrp = playerGroups[activeP];
                scoredOwnBall = shotPocketedBalls.some(n => currentGrp === 'solids' ? (n >= 1 && n <= 7) : (n >= 9 && n <= 15));
            }
        }

        if (foul) {
            currentTurn = otherP;
            ballInHand = true;
            setStatus(`⚠️ ${foulReason} — تۆپی سپی بە دەست دابنێ`);
        } else if (scoredOwnBall) {
            setStatus(`🔥 نایابە! بەردەوام بە لە لێدان`);
        } else {
            currentTurn = otherP;
            setStatus(currentTurn === myPlayerNum ? '🎱 نۆرەی تۆیە!' : '⏳ نۆرەی ڕکابەرەکەتە...');
        }

        resetSpin();
        updateHudUI();

        if (matchActive && gameMode === 'bot' && currentTurn === 2) {
            setTimeout(runSmartBotShot, 900);
        }
    }

    function runSmartBotShot() {
        if (!matchActive || isMoving || currentTurn !== 2) return;
        const cb = getCueBall();
        if (!cb) return;

        const botGrp = playerGroups[2];
        let candidates = balls.filter(b => !b.pocketed && b.num !== 0 && b.num !== 8);
        if (groupsAssigned && botGrp) {
            const own = balls.filter(b => !b.pocketed && (botGrp === 'solids' ? (b.num >= 1 && b.num <= 7) : (b.num >= 9 && b.num <= 15)));
            candidates = own.length > 0 ? own : balls.filter(b => !b.pocketed && b.num === 8);
        }

        if (candidates.length === 0) return;

        // هەڵبژاردنی باشترین تۆپ و سەبەتە
        let bestAngle = 0;
        let bestScore = -Infinity;

        candidates.forEach(target => {
            POCKETS.forEach(p => {
                const dxP = p.x - target.x;
                const dyP = p.y - target.y;
                const distToPocket = Math.hypot(dxP, dyP);
                const ux = dxP / distToPocket;
                const uy = dyP / distToPocket;

                // شوێنی Ghost Ball
                const gx = target.x - ux * (BALL_R * 2);
                const gy = target.y - uy * (BALL_R * 2);

                const dxC = gx - cb.x;
                const dyC = gy - cb.y;
                const distFromCue = Math.hypot(dxC, dyC);
                const dot = (dxC / distFromCue) * ux + (dyC / distFromCue) * uy;

                const score = dot * 120 - distToPocket * 0.15 - distFromCue * 0.1;
                if (score > bestScore) {
                    bestScore = score;
                    bestAngle = Math.atan2(dyC, dxC);
                }
            });
        });

        // بڕێکی کەم هەڵەی سروشتی تا یارییەکە خۆش بێت
        aimAngle = bestAngle + (Math.random() - 0.5) * 0.035;
        const pwr = Math.min(0.92, Math.max(0.42, 0.55 + Math.random() * 0.3));
        executeShotPhysics(pwr, false);
    }

    function finishMatch(winnerNum, reasonText) {
        matchActive = false;
        const iWon = winnerNum === myPlayerNum;
        if (iWon) rewardWinnerPrize();
        recordMatchStats(iWon);

        document.getElementById('resEmoji').innerText = iWon ? '🏆' : '💔';
        document.getElementById('resTitle').innerText = iWon ? 'پیرۆزە بردتەوە!' : 'ئەمجارە دۆڕایت!';
        const curName = selectedTable.currency === 'diamonds' ? 'ئەڵماس 💎' : 'گۆڵد 🪙';
        document.getElementById('resDesc').innerText = iWon
            ? `${reasonText}\nخەڵاتی ${fmtNum(selectedTable.prize)} ${curName} خرایە سەر جزدانەکەت!`
            : `${reasonText}\nجارێکی تر هەوڵ بدەرەوە!`;
        document.getElementById('resultModal').classList.add('open');
    }

    // بزوێنەری فیزیای 120 FPS بە 8 هەنگاوی ورد (Sub-stepping)
    function stepPhysics() {
        if (!isMoving) return;

        const SUB_STEPS = 8;
        const minX = RAIL_SIZE + BALL_R;
        const maxX = LOGICAL_W - RAIL_SIZE - BALL_R;
        const minY = RAIL_SIZE + BALL_R;
        const maxY = LOGICAL_H - RAIL_SIZE - BALL_R;

        for (let step = 0; step < SUB_STEPS; step++) {
            // ١. جووڵە و لێخشاندن
            for (const b of balls) {
                if (b.pocketed) continue;
                b.x += b.vx / SUB_STEPS;
                b.y += b.vy / SUB_STEPS;

                b.vx *= Math.pow(0.9865, 1 / SUB_STEPS);
                b.vy *= Math.pow(0.9865, 1 / SUB_STEPS);

                // پشکنینی کەوتنە ناو سەبەتە (Pockets)
                for (const p of POCKETS) {
                    if (Math.hypot(b.x - p.x, b.y - p.y) < POCKET_R) {
                        b.pocketed = true;
                        b.vx = 0; b.vy = 0;
                        playSfx('pocket', 0.9);
                        pocketingAnims.push({ num: b.num, x: p.x, y: p.y, scale: 1 });
                        if (b.num === 0) {
                            cueBallPocketed = true;
                        } else {
                            shotPocketedBalls.push(b.num);
                        }
                        break;
                    }
                }
                if (b.pocketed) continue;

                // گەڕانەوە لە لێواری مێز (Cushions)
                if (b.x < minX) { b.x = minX; b.vx = -b.vx * 0.82; playSfx('rail', Math.abs(b.vx) / 15); }
                if (b.x > maxX) { b.x = maxX; b.vx = -b.vx * 0.82; playSfx('rail', Math.abs(b.vx) / 15); }
                if (b.y < minY) { b.y = minY; b.vy = -b.vy * 0.82; playSfx('rail', Math.abs(b.vy) / 15); }
                if (b.y > maxY) { b.y = maxY; b.vy = -b.vy * 0.82; playSfx('rail', Math.abs(b.vy) / 15); }
            }

            // ٢. پێکدادانی تۆپ بە تۆپ
            for (let i = 0; i < balls.length; i++) {
                const b1 = balls[i];
                if (b1.pocketed) continue;
                for (let j = i + 1; j < balls.length; j++) {
                    const b2 = balls[j];
                    if (b2.pocketed) continue;

                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const dist = Math.hypot(dx, dy);
                    const minDist = BALL_R * 2;

                    if (dist > 0 && dist < minDist) {
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const overlap = (minDist - dist) * 0.5;
                        b1.x -= nx * overlap;
                        b1.y -= ny * overlap;
                        b2.x += nx * overlap;
                        b2.y += ny * overlap;

                        const kx = b1.vx - b2.vx;
                        const ky = b1.vy - b2.vy;
                        const p = nx * kx + ny * ky;

                        if (p > 0) {
                            if (!shotFirstHitBall && (b1.num === 0 || b2.num === 0)) {
                                shotFirstHitBall = b1.num === 0 ? b2.num : b1.num;
                            }

                            b1.vx -= p * nx;
                            b1.vy -= p * ny;
                            b2.vx += p * nx;
                            b2.vy += p * ny;

                            // زیادکردنی کاریگەریی Spin لەسەر تۆپی سپی
                            if (b1.num === 0 && (spinX !== 0 || spinY !== 0)) {
                                b1.vx += (nx * spinY * 2.2) + (-ny * spinX * 1.8);
                                b1.vy += (ny * spinY * 2.2) + (nx * spinX * 1.8);
                                spinX *= 0.3; spinY *= 0.3;
                            }

                            playSfx('hit', Math.min(1, p / 12));
                        }
                    }
                }
            }
        }

        // وەستاندنی تۆپە زۆر هێواشەکان
        let anyStillMoving = false;
        for (const b of balls) {
            if (b.pocketed) continue;
            if (Math.hypot(b.vx, b.vy) < 0.045) {
                b.vx = 0; b.vy = 0;
            } else {
                anyStillMoving = true;
            }
        }

        if (!anyStillMoving) {
            evaluateTurnEnd();
        }
    }

    // وێنەکێشانی مێز و تۆپەکان و لێزەری نیشانەگرتن بە کوالێتیی 3D
    function drawScene() {
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

        // ١. چوارچێوەی دار/کانزای دەرەوەی مێزەکە
        ctx.fillStyle = selectedTable.rail;
        ctx.beginPath();
        ctx.roundRect(0, 0, LOGICAL_W, LOGICAL_H, 22);
        ctx.fill();

        // هێڵی زێڕینی چوارچێوە
        ctx.strokeStyle = selectedTable.trim;
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 6, LOGICAL_W - 12, LOGICAL_H - 12);

        // ٢. قوماشی ناوەوەی مێزەکە (Felt Gradient)
        const feltGrad = ctx.createRadialGradient(
            LOGICAL_W / 2, LOGICAL_H / 2, 20,
            LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_H * 0.65
        );
        feltGrad.addColorStop(0, selectedTable.felt1);
        feltGrad.addColorStop(1, selectedTable.felt2);
        ctx.fillStyle = feltGrad;
        ctx.fillRect(RAIL_SIZE, RAIL_SIZE, LOGICAL_W - RAIL_SIZE * 2, LOGICAL_H - RAIL_SIZE * 2);

        // سێبەری ناوەوەی قەراغەکان
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 5;
        ctx.strokeRect(RAIL_SIZE, RAIL_SIZE, LOGICAL_W - RAIL_SIZE * 2, LOGICAL_H - RAIL_SIZE * 2);

        // لۆگۆ و نەخشی ناوەڕاستی مێزەکە
        ctx.save();
        ctx.translate(LOGICAL_W / 2, LOGICAL_H / 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.font = '900 22px Vazirmatn, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑 YARI KURDI', 0, -10);
        ctx.font = '800 13px Vazirmatn, sans-serif';
        ctx.fillText(selectedTable.emblem, 0, 14);
        ctx.restore();

        // هێڵی سەرەتا (Head String)
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(RAIL_SIZE, LOGICAL_H * 0.74);
        ctx.lineTo(LOGICAL_W - RAIL_SIZE, LOGICAL_H * 0.74);
        ctx.stroke();

        // خاڵی Diamond Sights لەسەر قەراغی مێزەکە
        ctx.fillStyle = selectedTable.trim;
        for (let i = 1; i <= 3; i++) {
            const yTop = RAIL_SIZE + (LOGICAL_H / 2 - RAIL_SIZE) * (i / 4);
            const yBot = LOGICAL_H / 2 + (LOGICAL_H / 2 - RAIL_SIZE) * (i / 4);
            [yTop, yBot].forEach(yy => {
                ctx.beginPath(); ctx.arc(RAIL_SIZE / 2, yy, 2.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(LOGICAL_W - RAIL_SIZE / 2, yy, 2.2, 0, Math.PI * 2); ctx.fill();
            });
        }

        // ٣. وێنەکێشانی ٦ سەبەتەکە (Pockets)
        for (const p of POCKETS) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, POCKET_R + 2, 0, Math.PI * 2);
            ctx.fillStyle = selectedTable.trim;
            ctx.fill();

            const pGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, POCKET_R);
            pGrad.addColorStop(0, '#000000');
            pGrad.addColorStop(1, '#18181b');
            ctx.beginPath();
            ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
            ctx.fillStyle = pGrad;
            ctx.fill();
        }

        // ٤. ئەنیمەیشنی کەوتنە خوارەوەی تۆپ بۆ ناو سەبەتە
        for (let i = pocketingAnims.length - 1; i >= 0; i--) {
            const pa = pocketingAnims[i];
            pa.scale -= 0.08;
            if (pa.scale <= 0) {
                pocketingAnims.splice(i, 1);
                continue;
            }
            drawSingleBall(pa.num, pa.x, pa.y, BALL_R * pa.scale);
        }

        // ٥. وێنەکێشانی تۆپەکان
        for (const b of balls) {
            if (b.pocketed) continue;
            drawSingleBall(b.num, b.x, b.y, BALL_R);
        }

        // نیشانەی Ball-in-Hand لەسەر تۆپی سپی
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

        // ٦. هێڵی نیشانەگرتن (Aim Laser + Ghost Ball) و داری بڵیاردەکە
        if (cb && !cb.pocketed && isMyTurn() && !draggingCueBall) {
            drawAimGuideAndCue(cb);
        }
    }

    function drawSingleBall(num, x, y, r) {
        // سێبەری تۆپ
        ctx.beginPath();
        ctx.arc(x + 2, y + 3, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();

        if (num === 0) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
            // خاڵی سووری Spin لەسەر تۆپی سپی
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x + spinX * (r * 0.45), y + spinY * (r * 0.45), 2.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const baseCol = BALL_COLORS[num] || '#fbbf24';
            if (num >= 9) {
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
                ctx.fillStyle = baseCol;
                ctx.fillRect(x - r, y - r * 0.55, r * 2, r * 1.1);
            } else {
                ctx.fillStyle = baseCol;
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            }

            // بازنەی سپیی ژمارەکە
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.beginPath();
            ctx.arc(x, y, r * 0.48, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#09090b';
            ctx.font = `900 ${Math.round(r * 0.65)}px Vazirmatn, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(num), x, y + 0.5);
        }

        // بریقەی 3D لەسەر تۆپەکە
        const shine = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0.5, x, y, r);
        shine.addColorStop(0, 'rgba(255,255,255,0.55)');
        shine.addColorStop(0.35, 'rgba(255,255,255,0.08)');
        shine.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = shine;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.restore();
    }

    function drawAimGuideAndCue(cb) {
        const dx = Math.cos(aimAngle);
        const dy = Math.sin(aimAngle);

        // دۆزینەوەی نزیکترین بەرکەوتنی تۆپی سپی (Raycasting)
        let closestDist = 900;
        let hitBall = null;

        const minX = RAIL_SIZE + BALL_R;
        const maxX = LOGICAL_W - RAIL_SIZE - BALL_R;
        const minY = RAIL_SIZE + BALL_R;
        const maxY = LOGICAL_H - RAIL_SIZE - BALL_R;

        if (dx > 0.0001) closestDist = Math.min(closestDist, (maxX - cb.x) / dx);
        if (dx < -0.0001) closestDist = Math.min(closestDist, (minX - cb.x) / dx);
        if (dy > 0.0001) closestDist = Math.min(closestDist, (maxY - cb.y) / dy);
        if (dy < -0.0001) closestDist = Math.min(closestDist, (minY - cb.y) / dy);

        for (const b of balls) {
            if (b.pocketed || b.num === 0) continue;
            const fx = b.x - cb.x;
            const fy = b.y - cb.y;
            const proj = fx * dx + fy * dy;
            if (proj <= 0) continue;
            const perpSq = (fx * fx + fy * fy) - proj * proj;
            const radSum = BALL_R * 2;
            if (perpSq < radSum * radSum) {
                const dist = proj - Math.sqrt(radSum * radSum - perpSq);
                if (dist > 0 && dist < closestDist) {
                    closestDist = dist;
                    hitBall = b;
                }
            }
        }

        const endX = cb.x + dx * closestDist;
        const endY = cb.y + dy * closestDist;

        // هێڵی لێزەری سەرەکی
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cb.x, cb.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // بازنەی Ghost Ball و ئاڕاستەی تۆپی ئامانج
        ctx.strokeStyle = hitBall ? '#fde047' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(endX, endY, BALL_R, 0, Math.PI * 2);
        ctx.stroke();

        if (hitBall) {
            const tx = hitBall.x - endX;
            const ty = hitBall.y - endY;
            const tLen = Math.hypot(tx, ty) || 1;
            const ux = tx / tLen;
            const uy = ty / tLen;

            // هێڵی ڕۆیشتنی تۆپی ئامانج
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hitBall.x, hitBall.y);
            ctx.lineTo(hitBall.x + ux * 75, hitBall.y + uy * 75);
            ctx.stroke();
        }
        ctx.restore();

        // وێنەکێشانی داری بڵیاردەکە (Royal Cue Stick)
        ctx.save();
        ctx.translate(cb.x, cb.y);
        ctx.rotate(aimAngle + Math.PI);
        const pullOffset = BALL_R + 8 + pullPower * 58;

        // دارەکە
        const cueGrad = ctx.createLinearGradient(pullOffset, 0, pullOffset + 190, 0);
        cueGrad.addColorStop(0, '#f8fafc');
        cueGrad.addColorStop(0.04, '#0284c7');
        cueGrad.addColorStop(0.08, '#fde68a');
        cueGrad.addColorStop(0.55, '#b45309');
        cueGrad.addColorStop(1, '#1e1b4b');

        ctx.fillStyle = cueGrad;
        ctx.beginPath();
        ctx.moveTo(pullOffset, -2.2);
        ctx.lineTo(pullOffset + 185, -4.8);
        ctx.lineTo(pullOffset + 185, 4.8);
        ctx.lineTo(pullOffset, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // دەستکاریی نیشانەگرتن لەسەر شاشەی مێزەکە
    function getLogicalPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * LOGICAL_W,
            y: ((clientY - rect.top) / rect.height) * LOGICAL_H
        };
    }

    function onCanvasDown(e) {
        if (!isMyTurn()) return;
        const pos = getLogicalPointerPos(e);
        const cb = getCueBall();
        if (!cb) return;

        if (ballInHand && Math.hypot(pos.x - cb.x, pos.y - cb.y) < BALL_R * 2.4) {
            draggingCueBall = true;
            return;
        }
        aimingOnCanvas = true;
        aimAngle = Math.atan2(pos.y - cb.y, pos.x - cb.x);
    }

    function onCanvasMove(e) {
        if (!isMyTurn()) return;
        const pos = getLogicalPointerPos(e);
        const cb = getCueBall();
        if (!cb) return;

        if (draggingCueBall) {
            const minX = RAIL_SIZE + BALL_R + 2;
            const maxX = LOGICAL_W - RAIL_SIZE - BALL_R - 2;
            const minY = RAIL_SIZE + BALL_R + 2;
            const maxY = LOGICAL_H - RAIL_SIZE - BALL_R - 2;
            const nx = Math.min(maxX, Math.max(minX, pos.x));
            const ny = Math.min(maxY, Math.max(minY, pos.y));

            const overlaps = balls.some(b => !b.pocketed && b.num !== 0 && Math.hypot(b.x - nx, b.y - ny) < BALL_R * 2.1);
            if (!overlaps) {
                cb.x = nx;
                cb.y = ny;
            }
            return;
        }

        if (aimingOnCanvas) {
            aimAngle = Math.atan2(pos.y - cb.y, pos.x - cb.x);
        }
    }

    function onCanvasUp() {
        draggingCueBall = false;
        aimingOnCanvas = false;
    }

    canvas.addEventListener('mousedown', onCanvasDown);
    window.addEventListener('mousemove', onCanvasMove);
    window.addEventListener('mouseup', onCanvasUp);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onCanvasDown(e); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onCanvasMove(e); }, { passive: false });
    canvas.addEventListener('touchend', onCanvasUp);

    // کۆنترۆڵی شریتی هێز (Power Bar)
    const powerRail = document.getElementById('powerBarRail');
    const powerFill = document.getElementById('powerBarFill');
    const powerKnob = document.getElementById('powerBarKnob');
    let pullingPower = false;

    function updatePowerBarVisual(ratio) {
        pullPower = Math.min(1, Math.max(0, ratio));
        powerFill.style.height = `${pullPower * 100}%`;
        const maxTravel = powerRail.clientHeight - 44;
        powerKnob.style.top = `${6 + pullPower * maxTravel}px`;
    }

    function handlePowerInput(e) {
        if (!isMyTurn()) return;
        const rect = powerRail.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const ratio = (clientY - rect.top) / rect.height;
        updatePowerBarVisual(ratio);
    }

    function releasePowerBar() {
        if (!pullingPower) return;
        pullingPower = false;
        if (pullPower > 0.06 && isMyTurn()) {
            const finalPower = pullPower;
            updatePowerBarVisual(0);
            executeShotPhysics(finalPower, true);
        } else {
            updatePowerBarVisual(0);
        }
    }

    powerRail.addEventListener('mousedown', (e) => { pullingPower = true; handlePowerInput(e); });
    window.addEventListener('mousemove', (e) => { if (pullingPower) handlePowerInput(e); });
    window.addEventListener('mouseup', releasePowerBar);
    powerRail.addEventListener('touchstart', (e) => { e.preventDefault(); pullingPower = true; handlePowerInput(e); }, { passive: false });
    powerRail.addEventListener('touchmove', (e) => { e.preventDefault(); if (pullingPower) handlePowerInput(e); }, { passive: false });
    powerRail.addEventListener('touchend', releasePowerBar);

    // نیشانەگرتنی زۆر ورد بە Slider
    const fineAim = document.getElementById('fineAimRange');
    let lastFineVal = 0;
    fineAim.addEventListener('input', () => {
        if (!isMyTurn()) return;
        const cur = parseFloat(fineAim.value);
        const delta = cur - lastFineVal;
        lastFineVal = cur;
        aimAngle += delta * 0.004;
    });
    fineAim.addEventListener('change', () => {
        fineAim.value = 0;
        lastFineVal = 0;
    });

    // کۆنترۆڵی Spin
    const spinPad = document.getElementById('spinPadArea');
    let draggingSpin = false;

    function updateSpinFromEvent(e) {
        const rect = spinPad.getBoundingClientRect();
        const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left - rect.width / 2;
        const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top - rect.height / 2;
        const maxR = rect.width * 0.38;
        const dist = Math.hypot(cx, cy);
        const clampedX = dist > maxR ? (cx / dist) * maxR : cx;
        const clampedY = dist > maxR ? (cy / dist) * maxR : cy;

        spinX = clampedX / maxR;
        spinY = clampedY / maxR;
        syncSpinDots();
    }

    function syncSpinDots() {
        const bigDot = document.getElementById('spinBigDot');
        const miniDot = document.getElementById('miniSpinDot');
        if (bigDot) {
            bigDot.style.left = `${50 + spinX * 36}%`;
            bigDot.style.top = `${50 + spinY * 36}%`;
        }
        if (miniDot) {
            miniDot.style.left = `${50 + spinX * 34}%`;
            miniDot.style.top = `${50 + spinY * 34}%`;
        }
    }

    function resetSpin() {
        spinX = 0;
        spinY = 0;
        syncSpinDots();
    }

    spinPad.addEventListener('mousedown', (e) => { draggingSpin = true; updateSpinFromEvent(e); });
    window.addEventListener('mousemove', (e) => { if (draggingSpin) updateSpinFromEvent(e); });
    window.addEventListener('mouseup', () => { draggingSpin = false; });
    spinPad.addEventListener('touchstart', (e) => { e.preventDefault(); draggingSpin = true; updateSpinFromEvent(e); }, { passive: false });
    spinPad.addEventListener('touchmove', (e) => { e.preventDefault(); if (draggingSpin) updateSpinFromEvent(e); }, { passive: false });
    spinPad.addEventListener('touchend', () => { draggingSpin = false; });

    function openLobby() {
        cleanupOnlineRoom();
        matchActive = false;
        document.getElementById('resultModal').classList.remove('open');
        document.getElementById('matchmakingModal').classList.remove('open');
        renderTablesLobby();
        document.getElementById('lobbyModal').classList.add('open');
    }

    function rematch() {
        document.getElementById('resultModal').classList.remove('open');
        if (gameMode === 'online') startOnlineMatch();
        else startBotMatch();
    }

    function toggleSound() {
        soundOn = !soundOn;
        document.getElementById('soundBtn').innerHTML = soundOn
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark" style="color:#fb7185;"></i>';
    }

    // لووپی سەرەکیی 120 FPS
    function gameLoop120() {
        stepPhysics();
        drawScene();
        requestAnimationFrame(gameLoop120);
    }

    window.BilliardEngine = {
        selectTable,
        startOnlineMatch,
        startBotMatch,
        openPrivateRoomPrompt,
        fallbackToOnlineBot,
        cancelMatchmaking,
        openLobby,
        rematch,
        toggleSound,
        openSpinModal: () => document.getElementById('spinModal').classList.add('open'),
        resetSpin
    };

    window.addEventListener('DOMContentLoaded', () => {
        resizeCanvas();
        setupRack();
        renderTablesLobby();
        requestAnimationFrame(gameLoop120);
    });
})();