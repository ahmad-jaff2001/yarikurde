// ==========================================
// YARI KURDI - CENTRAL ONLINE MULTIPLAYER ENGINE
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDt7to-7ofdESfV0U1NoQdOJBJ7NCMTroI",
    authDomain: "yarikurde.firebaseapp.com",
    databaseURL: "https://yarikurde-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "yarikurde",
    storageBucket: "yarikurde.firebasestorage.app",
    messagingSenderId: "990747008402",
    appId: "1:990747008402:web:433ecfb50feb8e923b354b",
    measurementId: "G-DY42TBSC0X"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const ykDB = firebase.database();

window.YariOnline = (function () {
    let currentRoomRef = null;
    let currentGame = null;
    let currentCode = null;
    let mySeat = 0;
    let isHost = false;
    let stateListener = null;
    let roomListener = null;
    let lobbyCallbacks = null;
    let matchStarted = false;

    function getPlayer() {
        let uid = localStorage.getItem('yk_player_uid');
        if (!uid) {
            uid = 'yk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
            localStorage.setItem('yk_player_uid', uid);
        }
        return {
            uid: uid,
            name: localStorage.getItem('yk_player_name') || 'یاریزان',
            avatar: localStorage.getItem('yk_player_avatar') || 'images.png/controller.png'
        };
    }

    async function leaveRoom() {
        if (currentRoomRef) {
            if (roomListener) currentRoomRef.off('value', roomListener);
            if (stateListener) currentRoomRef.child('state').off('value', stateListener);
            const me = getPlayer();
            try {
                if (isHost && !matchStarted) {
                    await currentRoomRef.remove();
                } else {
                    await currentRoomRef.child('players/' + me.uid + '/online').set(false);
                }
            } catch (e) {}
        }
        currentRoomRef = null;
        currentCode = null;
        roomListener = null;
        stateListener = null;
        matchStarted = false;
    }

    async function createRoom(gameType, maxPlayers = 2, initialState = {}) {
        await leaveRoom();
        const me = getPlayer();
        let code = '';
        let exists = true;

        while (exists) {
            code = Math.floor(1000 + Math.random() * 9000).toString();
            const snap = await ykDB.ref(`rooms/${gameType}/${code}`).once('value');
            exists = snap.exists();
        }

        currentGame = gameType;
        currentCode = code;
        isHost = true;
        mySeat = 0;
        matchStarted = false;
        currentRoomRef = ykDB.ref(`rooms/${gameType}/${code}`);

        const roomData = {
            code: code,
            game: gameType,
            status: 'waiting',
            maxPlayers: maxPlayers,
            hostId: me.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            players: {
                [me.uid]: {
                    uid: me.uid,
                    name: me.name,
                    avatar: me.avatar,
                    seat: 0,
                    online: true,
                    joinedAt: Date.now()
                }
            },
            state: initialState
        };

        await currentRoomRef.set(roomData);
        currentRoomRef.onDisconnect().remove();
        return { code, seat: 0, isHost: true };
    }

    async function joinRoom(gameType, code) {
        await leaveRoom();
        const cleanCode = code.trim();
        const ref = ykDB.ref(`rooms/${gameType}/${cleanCode}`);
        const snap = await ref.once('value');

        if (!snap.exists()) {
            throw new Error('ئەم کۆدی ژوورە بوونی نییە!');
        }

        const room = snap.val();
        if (room.status !== 'waiting') {
            throw new Error('ئەم یارییە پێشتر دەستی پێکردووە!');
        }

        const playersObj = room.players || {};
        const me = getPlayer();
        const takenSeats = Object.values(playersObj).map(p => p.seat);

        if (playersObj[me.uid]) {
            mySeat = playersObj[me.uid].seat;
        } else {
            if (Object.keys(playersObj).length >= (room.maxPlayers || 2)) {
                throw new Error('ئەم ژوورە پڕ بووەتەوە!');
            }
            mySeat = 0;
            while (takenSeats.includes(mySeat)) {
                mySeat++;
            }
        }

        currentGame = gameType;
        currentCode = cleanCode;
        isHost = (room.hostId === me.uid);
        matchStarted = false;
        currentRoomRef = ref;

        await ref.child(`players/${me.uid}`).set({
            uid: me.uid,
            name: me.name,
            avatar: me.avatar,
            seat: mySeat,
            online: true,
            joinedAt: Date.now()
        });

        ref.child(`players/${me.uid}/online`).onDisconnect().set(false);
        return { code: cleanCode, seat: mySeat, isHost };
    }

    async function quickMatch(gameType, maxPlayers = 2, initialState = {}) {
        const snap = await ykDB.ref(`rooms/${gameType}`).orderByChild('status').equalTo('waiting').once('value');
        const now = Date.now();
        let targetCode = null;

        if (snap.exists()) {
            snap.forEach(child => {
                const r = child.val();
                const count = r.players ? Object.keys(r.players).length : 0;
                const isFresh = !r.createdAt || (now - r.createdAt < 10 * 60 * 1000);
                if (!targetCode && count < (r.maxPlayers || maxPlayers) && isFresh) {
                    targetCode = child.key;
                }
            });
        }

        if (targetCode) {
            return await joinRoom(gameType, targetCode);
        } else {
            return await createRoom(gameType, maxPlayers, initialState);
        }
    }

   async function startMatch(initialState = null) {
        if (!currentRoomRef || !isHost) return;
        currentRoomRef.onDisconnect().cancel();
        const me = getPlayer();
        currentRoomRef.child(`players/${me.uid}/online`).onDisconnect().set(false);

        const updates = { status: 'playing' };
        if (initialState) updates.state = initialState;
        await currentRoomRef.update(updates);
    }
    async function updateState(newState) {
        if (!currentRoomRef) return;
        await currentRoomRef.child('state').update(newState);
    }

    async function setState(fullState) {
        if (!currentRoomRef) return;
        await currentRoomRef.child('state').set(fullState);
    }

    function onStateChange(callback) {
        if (!currentRoomRef) return;
        if (stateListener) currentRoomRef.child('state').off('value', stateListener);
        stateListener = currentRoomRef.child('state').on('value', snap => {
            if (snap.exists()) callback(snap.val());
        });
    }

    async function submitScore(gameType, score) {
        const me = getPlayer();
        const ref = ykDB.ref(`leaderboard/${gameType}/${me.uid}`);
        const snap = await ref.once('value');
        const oldScore = snap.exists() ? (snap.val().score || 0) : 0;
        if (score > oldScore) {
            await ref.set({
                name: me.name,
                avatar: me.avatar,
                score: score,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    }

    function injectLobbyStyles() {
        if (document.getElementById('yk-online-styles')) return;
        const style = document.createElement('style');
        style.id = 'yk-online-styles';
        style.textContent = `
            .yk-modal-backdrop {
                position: fixed; inset: 0; background: rgba(5, 3, 15, 0.88);
                backdrop-filter: blur(10px); z-index: 99999;
                display: flex; align-items: center; justify-content: center;
                padding: 16px; font-family: 'Vazirmatn', sans-serif; direction: rtl;
            }
            .yk-modal-card {
                width: 100%; max-width: 400px; background: #120d2b;
                border: 1.5px solid rgba(255, 184, 0, 0.45); border-radius: 26px;
                padding: 22px; color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.85);
                text-align: center; position: relative;
            }
            .yk-close-btn {
                position: absolute; top: 14px; left: 14px; width: 34px; height: 34px;
                border-radius: 50%; border: none; background: rgba(255,255,255,0.1);
                color: #fff; font-size: 16px; cursor: pointer;
            }
            .yk-title { font-size: 21px; font-weight: 900; color: #ffd000; margin-bottom: 6px; }
            .yk-sub { font-size: 13px; color: #a49ec8; margin-bottom: 18px; }
            .yk-btn {
                width: 100%; padding: 13px; border-radius: 16px; border: none;
                font-family: 'Vazirmatn', sans-serif; font-size: 15px; font-weight: 800;
                cursor: pointer; margin-bottom: 10px; transition: transform 0.15s;
            }
            .yk-btn:active { transform: scale(0.97); }
            .yk-btn-gold { background: linear-gradient(135deg, #ffd000, #ff8800); color: #1a0f00; }
            .yk-btn-purple { background: rgba(139, 92, 246, 0.25); border: 1.5px solid #a855f7; color: #fff; }
            .yk-btn-green { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
            .yk-join-row { display: flex; gap: 8px; margin-top: 8px; }
            .yk-input {
                flex: 1; padding: 12px; border-radius: 14px; border: 1.5px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.4); color: #ffd000; font-size: 18px; font-weight: 900;
                text-align: center; letter-spacing: 4px; outline: none;
            }
            .yk-code-box {
                background: rgba(255, 184, 0, 0.12); border: 1.5px dashed #ffb800;
                border-radius: 18px; padding: 14px; margin: 12px 0;
            }
            .yk-code-num { font-size: 32px; font-weight: 900; color: #ffd000; letter-spacing: 6px; }
            .yk-players-list { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
            .yk-player-item {
                display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.06);
                padding: 8px 12px; border-radius: 14px;
            }
            .yk-player-item img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid #ffd000; }
            .yk-error { color: #ff5277; font-size: 13px; font-weight: 700; margin-top: 8px; min-height: 18px; }
        `;
        document.head.appendChild(style);
    }

    function openLobby({ gameType, gameTitle, maxPlayers = 2, initialState = {}, onGameStart }) {
        injectLobbyStyles();
        lobbyCallbacks = { gameType, gameTitle, maxPlayers, initialState, onGameStart };

        const existing = document.getElementById('ykOnlineModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'ykOnlineModal';
        modal.className = 'yk-modal-backdrop';
        modal.innerHTML = `
            <div class="yk-modal-card">
                <button class="yk-close-btn" id="ykCloseModal">✕</button>
                <div class="yk-title">🌐 یاری ئۆنڵاین - ${gameTitle}</div>
                <div class="yk-sub">لەگەڵ هاوڕێکانت یان یاریزانانی تر پێکەوە یاری بکە</div>

                <div id="ykLobbyMenu">
                    <button class="yk-btn yk-btn-gold" id="ykQuickBtn">⚡ یاری خێرا (Quick Match)</button>
                    <button class="yk-btn yk-btn-purple" id="ykCreateBtn">➕ دروستکردنی ژووری نوێ</button>
                    <div class="yk-join-row">
                        <input type="tel" maxlength="4" class="yk-input" id="ykCodeInput" placeholder="کۆدی ژوور">
                        <button class="yk-btn yk-btn-green" style="width:auto; padding:0 20px; margin:0;" id="ykJoinBtn">چوونەژوور</button>
                    </div>
                    <div class="yk-error" id="ykLobbyErr"></div>
                </div>

                <div id="ykWaitingRoom" style="display:none;">
                    <div class="yk-code-box">
                        <div style="font-size:12px; color:#a49ec8;">ئەم کۆدە بدە بە هاوڕێکەت:</div>
                        <div class="yk-code-num" id="ykDisplayCode">----</div>
                        <button class="yk-btn yk-btn-purple" style="padding:6px 14px; font-size:12px; width:auto; margin:6px 0 0;" id="ykCopyCodeBtn">📋 کۆپیکردنی کۆد</button>
                    </div>
                    <div class="yk-players-list" id="ykPlayersList"></div>
                    <div style="font-size:13px; color:#a49ec8; margin-bottom:10px;" id="ykWaitStatus">چاوەڕێی هاتنی یاریزانین...</div>
                    <button class="yk-btn yk-btn-green" id="ykStartNowBtn" style="display:none;">▶ دەستپێکردنی یاری</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const errEl = document.getElementById('ykLobbyErr');
        document.getElementById('ykCloseModal').onclick = async () => {
            await leaveRoom();
            modal.remove();
        };

        document.getElementById('ykQuickBtn').onclick = async () => {
            errEl.textContent = 'گەڕان بەدوای یاریزاندا...';
            try {
                const res = await quickMatch(gameType, maxPlayers, initialState);
                enterWaitingView(res.code);
            } catch (e) { errEl.textContent = e.message; }
        };

        document.getElementById('ykCreateBtn').onclick = async () => {
            errEl.textContent = 'دروستکردنی ژوور...';
            try {
                const res = await createRoom(gameType, maxPlayers, initialState);
                enterWaitingView(res.code);
            } catch (e) { errEl.textContent = e.message; }
        };

        document.getElementById('ykJoinBtn').onclick = async () => {
            const codeVal = document.getElementById('ykCodeInput').value.trim();
            if (codeVal.length !== 4) {
                errEl.textContent = 'تکایە کۆدە ٤ ژمارەییەکە بنووسە!';
                return;
            }
            errEl.textContent = 'چوونە ناو ژوور...';
            try {
                const res = await joinRoom(gameType, codeVal);
                enterWaitingView(res.code);
            } catch (e) { errEl.textContent = e.message; }
        };
    }

    function enterWaitingView(code) {
        document.getElementById('ykLobbyMenu').style.display = 'none';
        document.getElementById('ykWaitingRoom').style.display = 'block';
        document.getElementById('ykDisplayCode').textContent = code;

        document.getElementById('ykCopyCodeBtn').onclick = () => {
            navigator.clipboard?.writeText(code);
            document.getElementById('ykCopyCodeBtn').textContent = '✅ کۆپی کرا!';
        };

        const startBtn = document.getElementById('ykStartNowBtn');
        startBtn.onclick = () => startMatch();

        roomListener = currentRoomRef.on('value', snap => {
            if (!snap.exists()) {
                const modal = document.getElementById('ykOnlineModal');
                if (modal) modal.remove();
                return;
            }
            const room = snap.val();
            const players = Object.values(room.players || {}).sort((a, b) => a.seat - b.seat);

            const listEl = document.getElementById('ykPlayersList');
            if (listEl) {
                listEl.innerHTML = players.map(p => `
                    <div class="yk-player-item">
                        <img src="${p.avatar || 'images.png/controller.png'}" alt="">
                        <div style="flex:1; text-align:right; font-weight:800;">${p.name} ${p.uid === room.hostId ? '👑' : ''}</div>
                        <div style="font-size:12px; color:#00e676;">● ئامادەیە</div>
                    </div>
                `).join('');
            }

            if (isHost && players.length >= 2) {
                startBtn.style.display = 'block';
            }

            if (isHost && players.length >= (room.maxPlayers || 2) && room.status === 'waiting') {
                startMatch();
            }

            if (room.status === 'playing' && !matchStarted) {
                matchStarted = true;
                currentRoomRef.onDisconnect().cancel();
                const modal = document.getElementById('ykOnlineModal');
                if (modal) modal.remove();
                if (lobbyCallbacks && lobbyCallbacks.onGameStart) {
                    lobbyCallbacks.onGameStart({
                        roomCode: code,
                        isHost: isHost,
                        mySeat: mySeat,
                        players: players,
                        state: room.state || {}
                    });
                }
            }
        });
    }

    return {
        getPlayer,
        createRoom,
        joinRoom,
        quickMatch,
        startMatch,
        updateState,
        setState,
        onStateChange,
        leaveRoom,
        submitScore,
        openLobby,
        getInfo: () => ({ currentCode, mySeat, isHost, currentGame })
    };
})();