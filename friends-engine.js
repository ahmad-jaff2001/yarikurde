// =============================================================================
// YARI KURDI - LIVE FRIENDS & NOTIFICATIONS ENGINE (FIREBASE REALTIME)
// =============================================================================

(function () {
    const state = {
        myUid: '',
        myName: 'یاریزان',
        myAvatar: 'images.png/controller.png',
        myLevel: 1,
        activeTab: 'friends', // 'friends' | 'add' | 'notifications'
        friendsMap: {},
        incomingRequests: {},
        outgoingRequests: {},
        notificationsMap: {},
        onlineMap: {},
        allPlayersCache: null,
        searchQuery: '',
        searchResults: []
    };

    function getShortId(uid) {
        if (!uid) return '000000';
        const digits = String(uid).replace(/[^0-9]/g, '');
        return digits.length >= 6 ? digits.substring(0, 10) : String(uid).substring(0, 10);
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, ''');
    }

    function formatTimeAgo(ts) {
        if (!ts) return '';
        const diff = Math.max(1, Math.floor((Date.now() - ts) / 1000));
        if (diff < 60) return 'ئێستا';
        if (diff < 3600) return `${Math.floor(diff / 60)} خولەک پێش ئێستا`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} کاتژمێر پێش ئێستا`;
        return `${Math.floor(diff / 86400)} ڕۆژ پێش ئێستا`;
    }

    function showToast(msg) {
        let toast = document.getElementById('ykFriendsToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ykFriendsToast';
            toast.style.cssText = `
                position:fixed; bottom:92px; left:50%; transform:translateX(-50%);
                background:linear-gradient(135deg,#ffd000,#ff8800); color:#140a00;
                padding:10px 22px; border-radius:14px; font-weight:900; font-size:13px;
                z-index:1000010; box-shadow:0 10px 28px rgba(0,0,0,0.8);
                font-family:'Vazirmatn',sans-serif; transition:opacity 0.25s;
            `;
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._t);
        toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2400);
    }

    // نوێکردنەوەی ژمارەی سەر زەنگەکە و دوگمەی هاوڕێکان بە داتای ڕاستەقینە
    function updateAllBadges() {
        const reqCount = Object.keys(state.incomingRequests).length;
        const unreadNotifs = Object.values(state.notificationsMap).filter(n => !n.read && n.type !== 'friend_request').length;
        const totalBellCount = reqCount + unreadNotifs;

        // ١. نوێکردنەوەی ژمارەی سەر زەنگی ئاگادارکردنەوە لە هێدەری سەرەوە
        document.querySelectorAll('.fa-bell').forEach(bellIcon => {
            const btn = bellIcon.closest('button, div, a') || bellIcon.parentElement;
            if (!btn) return;
            let badge = btn.querySelector('span, .badge, .notif-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.style.cssText = `
                    position:absolute; top:-4px; right:-4px; min-width:18px; height:18px;
                    padding:0 5px; border-radius:10px; background:#ef4444; color:#fff;
                    font-size:10.5px; font-weight:900; display:flex; align-items:center; justify-content:center;
                    border:2px solid #0d091f;
                `;
                if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
                btn.appendChild(badge);
            }
            if (totalBellCount > 0) {
                badge.style.display = 'flex';
                badge.innerText = totalBellCount > 99 ? '99+' : String(totalBellCount);
            } else {
                badge.style.display = 'none';
            }
        });

        // ٢. باجی بچووک لەسەر دوگمەی هاوڕێکان ئەگەر داواکاری نوێ هەبێت
        const friendsNav = document.getElementById('ykNavFriendsTrigger');
        if (friendsNav) {
            let fBadge = friendsNav.querySelector('.yk-nav-req-dot');
            if (reqCount > 0) {
                if (!fBadge) {
                    fBadge = document.createElement('span');
                    fBadge.className = 'yk-nav-req-dot';
                    fBadge.style.cssText = `
                        position:absolute; top:4px; right:14px; min-width:16px; height:16px;
                        padding:0 4px; border-radius:9px; background:#ef4444; color:#fff;
                        font-size:9.5px; font-weight:900; display:flex; align-items:center; justify-content:center;
                    `;
                    if (getComputedStyle(friendsNav).position === 'static') friendsNav.style.position = 'relative';
                    friendsNav.appendChild(fBadge);
                }
                fBadge.innerText = reqCount;
            } else if (fBadge) {
                fBadge.remove();
            }
        }

        const overlay = document.getElementById('ykFriendsOverlay');
        if (overlay && overlay.classList.contains('open')) {
            renderModalContent();
        }
    }

    function bindFirebaseListeners(uid) {
        if (!uid || !window.firebase || !firebase.apps || !firebase.apps.length) return;
        if (state.myUid === uid && state._bound) return;
        state.myUid = uid;
        state._bound = true;

        const db = firebase.database();

        // خوێندنەوەی زانیاریی خۆم و پاشەکەوتکردنی shortId بۆ گەڕان
        db.ref(`players/${uid}`).on('value', snap => {
            const d = snap.val() || {};
            state.myName = d.name || localStorage.getItem('yk_player_name') || 'یاریزان';
            state.myAvatar = d.avatar || localStorage.getItem('yk_player_avatar') || 'images.png/controller.png';
            state.myLevel = d.level || 1;
            const sId = getShortId(uid);
            if (!d.shortId) {
                db.ref(`players/${uid}/shortId`).set(sId).catch(() => {});
            }
        });

        // ١. لیستی هاوڕێکان
        db.ref(`friends/${uid}`).on('value', snap => {
            state.friendsMap = snap.val() || {};
            updateAllBadges();
        });

        // ٢. داواکارییە هاتووەکان (Incoming Add Requests)
        db.ref(`friendRequests/${uid}`).on('value', snap => {
            state.incomingRequests = snap.val() || {};
            updateAllBadges();
        });

        // ٣. داواکارییە نێردراوەکان (Outgoing Add Requests)
        db.ref(`sentFriendRequests/${uid}`).on('value', snap => {
            state.outgoingRequests = snap.val() || {};
            const overlay = document.getElementById('ykFriendsOverlay');
            if (overlay && overlay.classList.contains('open')) renderModalContent();
        });

        // ٤. ئاگادارکردنەوەکان (Notifications)
        db.ref(`notifications/${uid}`).limitToLast(30).on('value', snap => {
            state.notificationsMap = snap.val() || {};
            updateAllBadges();
        });

        // ٥. یاریزانە ئۆنڵاینەکان
        db.ref('onlinePlayers').on('value', snap => {
            state.onlineMap = snap.val() || {};
            const overlay = document.getElementById('ykFriendsOverlay');
            if (overlay && overlay.classList.contains('open')) renderModalContent();
        });
    }

    // ناردنی داواکاری هاوڕێیەتی (Add Friend)
    async function sendFriendRequest(targetUid, targetName, targetAvatar) {
        if (!state.myUid || !targetUid || targetUid === state.myUid) return;
        if (state.friendsMap[targetUid]) {
            showToast('ئێوە پێشتر هاوڕێن ✅');
            return;
        }
        if (state.outgoingRequests[targetUid]) {
            showToast('داواکارییەکەت پێشتر نێردراوە ⏳');
            return;
        }

        const db = firebase.database();

        // پشکنین بزانە ئەو کەسە ڕێگەی بە داواکاری هاوڕێیەتی داوە
        const privSnap = await db.ref(`players/${targetUid}/privacy/allowFriends`).once('value');
        if (privSnap.val() === false) {
            showToast('ئەم یاریزانە وەرگرتنی داواکاری هاوڕێیەتی ڕاگرتووە 🔒');
            return;
        }

        const now = Date.now();
        await db.ref(`friendRequests/${targetUid}/${state.myUid}`).set({
            fromUid: state.myUid,
            fromName: state.myName,
            fromAvatar: state.myAvatar,
            fromLevel: state.myLevel || 1,
            ts: now
        });

        await db.ref(`sentFriendRequests/${state.myUid}/${targetUid}`).set({
            toUid: targetUid,
            toName: targetName || 'یاریزان',
            toAvatar: targetAvatar || 'images.png/controller.png',
            ts: now
        });

        // ناردنی ئاگادارکردنەوە بۆ زەنگەکەی ئەو کەسە
        await db.ref(`notifications/${targetUid}`).push({
            type: 'friend_request',
            title: 'داواکاری هاوڕێیەتی نوێ',
            text: `${state.myName} داواکاری هاوڕێیەتی بۆ ناردیت.`,
            fromUid: state.myUid,
            fromName: state.myName,
            fromAvatar: state.myAvatar,
            ts: now,
            read: false
        });

        showToast(`داواکاری هاوڕێیەتی نێردرا بۆ ${targetName || 'یاریزان'} ✅`);
    }

    async function cancelFriendRequest(targetUid) {
        if (!state.myUid || !targetUid) return;
        const db = firebase.database();
        await db.ref(`friendRequests/${targetUid}/${state.myUid}`).remove();
        await db.ref(`sentFriendRequests/${state.myUid}/${targetUid}`).remove();
        showToast('داواکارییەکە هەڵوەشێنرایەوە');
    }

    async function acceptFriendRequest(fromUid) {
        if (!state.myUid || !fromUid) return;
        const req = state.incomingRequests[fromUid] || {};
        const db = firebase.database();
        const now = Date.now();

        // زیادکردن بۆ لیستی هاوڕێکانی هەردوولا
        await db.ref(`friends/${state.myUid}/${fromUid}`).set({
            uid: fromUid,
            name: req.fromName || 'یاریزان',
            avatar: req.fromAvatar || 'images.png/controller.png',
            level: req.fromLevel || 1,
            since: now
        });

        await db.ref(`friends/${fromUid}/${state.myUid}`).set({
            uid: state.myUid,
            name: state.myName,
            avatar: state.myAvatar,
            level: state.myLevel || 1,
            since: now
        });

        // سڕینەوەی داواکارییەکە
        await db.ref(`friendRequests/${state.myUid}/${fromUid}`).remove();
        await db.ref(`sentFriendRequests/${fromUid}/${state.myUid}`).remove();

        // ئاگادارکردنەوەی نێرەر کە داواکارییەکەی پەسەند کراوە
        await db.ref(`notifications/${fromUid}`).push({
            type: 'friend_accepted',
            title: 'داواکاری هاوڕێیەتی پەسەند کرا',
            text: `${state.myName} داواکاری هاوڕێیەتییەکەتی پەسەند کرد.`,
            fromUid: state.myUid,
            fromName: state.myName,
            fromAvatar: state.myAvatar,
            ts: now,
            read: false
        });

        showToast(`${req.fromName || 'یاریزان'} بوو بە هاوڕێت 🎉`);
    }

    async function declineFriendRequest(fromUid) {
        if (!state.myUid || !fromUid) return;
        const db = firebase.database();
        await db.ref(`friendRequests/${state.myUid}/${fromUid}`).remove();
        await db.ref(`sentFriendRequests/${fromUid}/${state.myUid}`).remove();
        showToast('داواکارییەکە ڕەتکرایەوە');
    }

    async function removeFriend(friendUid, friendName) {
        if (!state.myUid || !friendUid) return;
        if (!confirm(`دڵنیایت دەتەوێت ${friendName} لە لیستی هاوڕێکانت بسڕیتەوە؟`)) return;
        const db = firebase.database();
        await db.ref(`friends/${state.myUid}/${friendUid}`).remove();
        await db.ref(`friends/${friendUid}/${state.myUid}`).remove();
        showToast('لە لیستی هاوڕێکان لادرا');
    }

    async function markAllNotificationsRead() {
        if (!state.myUid || !window.firebase) return;
        const db = firebase.database();
        const updates = {};
        Object.keys(state.notificationsMap).forEach(k => {
            if (!state.notificationsMap[k].read) {
                updates[`notifications/${state.myUid}/${k}/read`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            await db.ref().update(updates).catch(() => {});
        }
    }

    async function handleSearchInput(val) {
        state.searchQuery = (val || '').trim();
        if (!state.searchQuery) {
            state.searchResults = [];
            renderSearchResultsOnly();
            return;
        }

        if (!state.allPlayersCache && window.firebase && firebase.apps.length) {
            const snap = await firebase.database().ref('players').limitToLast(250).once('value');
            state.allPlayersCache = snap.val() || {};
        }

        const q = state.searchQuery.toLowerCase();
        const results = [];
        Object.entries(state.allPlayersCache || {}).forEach(([uid, p]) => {
            if (uid === state.myUid || !p) return;
            const pName = String(p.name || '').toLowerCase();
            const pShortId = String(p.shortId || getShortId(uid)).toLowerCase();
            if (pName.includes(q) || pShortId.includes(q) || uid.toLowerCase() === q) {
                results.push({
                    uid,
                    name: p.name || 'یاریزان',
                    avatar: p.avatar || 'images.png/controller.png',
                    level: p.level || 1,
                    shortId: p.shortId || getShortId(uid)
                });
            }
        });

        state.searchResults = results.slice(0, 25);
        renderSearchResultsOnly();
    }

    function renderPlayerActionBtn(uid, name, avatar) {
        const safeName = escapeHtml(name).replace(/'/g, '');
        const safeAvatar = escapeHtml(avatar).replace(/'/g, '');

        if (state.friendsMap[uid]) {
            return `<span class="yk-f-pill-done"><i class="fa-solid fa-user-check"></i> هاوڕێن</span>`;
        }
        if (state.incomingRequests[uid]) {
            return `<button class="yk-f-btn-accept" onclick="event.stopPropagation(); YariFriends.accept('${uid}')"><i class="fa-solid fa-check"></i> پەسەندکردن</button>`;
        }
        if (state.outgoingRequests[uid]) {
            return `<button class="yk-f-btn-pending" onclick="event.stopPropagation(); YariFriends.cancel('${uid}')"><i class="fa-solid fa-clock"></i> نێردراوە</button>`;
        }
        return `<button class="yk-f-btn-add" onclick="event.stopPropagation(); YariFriends.sendRequest('${uid}','${safeName}','${safeAvatar}')"><i class="fa-solid fa-user-plus"></i> زیادکردن</button>`;
    }

    function renderSearchResultsOnly() {
        const box = document.getElementById('ykFriendSearchResultsBox');
        if (!box) return;

        if (!state.searchQuery) {
            // پیشاندانی یاریزانە ئۆنڵاینەکان کاتێک گەڕان بەتاڵە
            const onlineList = Object.entries(state.onlineMap)
                .filter(([uid]) => uid !== state.myUid)
                .map(([uid, u]) => ({
                    uid,
                    name: u.name || 'یاریزان',
                    avatar: u.avatar || 'images.png/controller.png',
                    level: u.level || 1,
                    shortId: getShortId(uid)
                }));

            if (onlineList.length === 0) {
                box.innerHTML = `<div class="yk-f-empty"><i class="fa-solid fa-magnifying-glass"></i> ناو یان ئایدی (ID) هاوڕێکەت لە سەرەوە بنووسە بۆ زیادکردن.</div>`;
                return;
            }

            box.innerHTML = `
                <div class="yk-f-sec-title"><span class="yk-f-online-dot"></span> یاریزانانی ئێستا ئۆنڵاین (${onlineList.length})</div>
                ${onlineList.map(p => `
                    <div class="yk-f-row" onclick="window.location.href='profile.html?uid=${p.uid}'">
                        <div class="yk-f-user">
                            <div class="yk-f-av-wrap">
                                <img src="${escapeHtml(p.avatar)}" onerror="this.src='images.png/controller.png'" alt="">
                                <span class="yk-f-av-dot online"></span>
                            </div>
                            <div>
                                <div class="yk-f-name">${escapeHtml(p.name)}</div>
                                <div class="yk-f-meta">ID: ${p.shortId} • Lv.${p.level}</div>
                            </div>
                        </div>
                        ${renderPlayerActionBtn(p.uid, p.name, p.avatar)}
                    </div>
                `).join('')}
            `;
            return;
        }

        if (state.searchResults.length === 0) {
            box.innerHTML = `<div class="yk-f-empty"><i class="fa-solid fa-user-xmark"></i> هیچ یاریزانێک بەم ناو یان ئایدییە نەدۆزرایەوە.</div>`;
            return;
        }

        box.innerHTML = state.searchResults.map(p => {
            const isOnline = !!state.onlineMap[p.uid];
            return `
                <div class="yk-f-row" onclick="window.location.href='profile.html?uid=${p.uid}'">
                    <div class="yk-f-user">
                        <div class="yk-f-av-wrap">
                            <img src="${escapeHtml(p.avatar)}" onerror="this.src='images.png/controller.png'" alt="">
                            <span class="yk-f-av-dot ${isOnline ? 'online' : ''}"></span>
                        </div>
                        <div>
                            <div class="yk-f-name">${escapeHtml(p.name)}</div>
                            <div class="yk-f-meta">ID: ${p.shortId} • Lv.${p.level}</div>
                        </div>
                    </div>
                    ${renderPlayerActionBtn(p.uid, p.name, p.avatar)}
                </div>
            `;
        }).join('');
    }

    function injectStyles() {
        if (document.getElementById('ykFriendsStyles')) return;
        const style = document.createElement('style');
        style.id = 'ykFriendsStyles';
        style.textContent = `
            #ykFriendsOverlay {
                position: fixed; inset: 0; background: rgba(3, 2, 10, 0.88);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                z-index: 999992; display: none; align-items: flex-end; justify-content: center;
                direction: rtl; font-family: 'Vazirmatn', sans-serif; color: #fff;
            }
            @media (min-width: 520px) {
                #ykFriendsOverlay { align-items: center; padding: 16px; }
            }
            #ykFriendsOverlay.open { display: flex; }

            .yk-f-sheet {
                width: 100%; max-width: 460px; height: 86dvh; max-height: 720px;
                background: #0d091f; border-top: 2px solid #ffb800;
                border-radius: 26px 26px 0 0; display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 -15px 55px rgba(0, 0, 0, 0.96);
            }
            @media (min-width: 520px) {
                .yk-f-sheet { border: 2px solid #ffb800; border-radius: 24px; }
            }

            .yk-f-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 16px 18px 12px;
                background: linear-gradient(180deg, #1b1240 0%, #0d091f 100%);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .yk-f-title { font-size: 18px; font-weight: 900; color: #ffd000; display: flex; align-items: center; gap: 8px; }
            .yk-f-close {
                width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.16);
                background: #1b143b; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
            }

            .yk-f-tabs {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
                padding: 10px 14px; background: #080514;
                border-bottom: 1px solid rgba(255, 255, 255, 0.07);
            }
            .yk-f-tab {
                padding: 9px 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07);
                background: #151030; color: #cbd5e1; font-size: 11.5px; font-weight: 800;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;
                position: relative;
            }
            .yk-f-tab.active {
                background: linear-gradient(135deg, #ffd000, #ff8800);
                border-color: #ffe066; color: #140a00; font-weight: 900;
            }
            .yk-f-tab-badge {
                background: #ef4444; color: #fff; font-size: 10px; font-weight: 900;
                padding: 1px 6px; border-radius: 9px;
            }

            .yk-f-body {
                padding: 14px 16px 24px; overflow-y: auto; flex: 1;
                display: flex; flex-direction: column; gap: 10px;
                -webkit-overflow-scrolling: touch;
            }
            .yk-f-body::-webkit-scrollbar { width: 4px; }
            .yk-f-body::-webkit-scrollbar-thumb { background: rgba(255, 184, 0, 0.4); border-radius: 8px; }

            .yk-f-search-wrap {
                display: flex; align-items: center; gap: 8px;
                background: #151030; border: 1.5px solid rgba(255, 184, 0, 0.45);
                border-radius: 14px; padding: 9px 13px;
            }
            .yk-f-search-wrap input {
                flex: 1; background: transparent; border: none; outline: none;
                color: #fff; font-size: 13px; font-family: inherit;
            }

            .yk-f-sec-title {
                font-size: 11.5px; font-weight: 900; color: #fbbf24;
                display: flex; align-items: center; gap: 6px; padding: 2px 4px;
            }
            .yk-f-online-dot {
                width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;
            }

            .yk-f-row {
                display: flex; align-items: center; justify-content: space-between; gap: 10px;
                background: #151030; border: 1px solid rgba(255, 255, 255, 0.08);
                padding: 10px 12px; border-radius: 15px; cursor: pointer;
            }
            .yk-f-row:hover { border-color: rgba(255, 184, 0, 0.4); }
            .yk-f-user { display: flex; align-items: center; gap: 10px; min-width: 0; }
            .yk-f-av-wrap { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
            .yk-f-av-wrap img {
                width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
                border: 1.5px solid #ffb800; background: #0d091f;
            }
            .yk-f-av-dot {
                position: absolute; bottom: 1px; right: 1px; width: 11px; height: 11px;
                border-radius: 50%; background: #64748b; border: 2px solid #151030;
            }
            .yk-f-av-dot.online { background: #10b981; box-shadow: 0 0 6px #10b981; }
            .yk-f-name { font-size: 13.5px; font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .yk-f-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }

            .yk-f-btn-add {
                padding: 7px 12px; border-radius: 10px; border: none;
                background: linear-gradient(135deg, #ffd000, #ff8800); color: #140a00;
                font-size: 11.5px; font-weight: 900; cursor: pointer; flex-shrink: 0;
            }
            .yk-f-btn-pending {
                padding: 7px 11px; border-radius: 10px; border: 1px solid rgba(255,184,0,0.45);
                background: rgba(255,184,0,0.12); color: #ffd000;
                font-size: 11px; font-weight: 800; cursor: pointer; flex-shrink: 0;
            }
            .yk-f-pill-done {
                padding: 6px 10px; border-radius: 10px; background: rgba(16,185,129,0.15);
                border: 1px solid rgba(16,185,129,0.4); color: #34d399;
                font-size: 11px; font-weight: 800; flex-shrink: 0;
            }
            .yk-f-btn-accept {
                padding: 7px 11px; border-radius: 10px; border: none;
                background: #10b981; color: #041f14; font-size: 11.5px; font-weight: 900; cursor: pointer;
            }
            .yk-f-btn-decline {
                padding: 7px 10px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.45);
                background: rgba(239,68,68,0.14); color: #fca5a5; font-size: 11.5px; font-weight: 800; cursor: pointer;
            }
            .yk-f-empty {
                text-align: center; padding: 32px 14px; color: #94a3b8; font-size: 12.5px; line-height: 1.8;
            }
            .yk-f-empty i { display: block; font-size: 26px; color: #64748b; margin-bottom: 8px; }
        `;
        document.head.appendChild(style);
    }

    function renderModalContent() {
        const overlay = document.getElementById('ykFriendsOverlay');
        if (!overlay) return;

        const friendsList = Object.values(state.friendsMap).sort((a, b) => {
            const aOn = state.onlineMap[a.uid] ? 1 : 0;
            const bOn = state.onlineMap[b.uid] ? 1 : 0;
            return bOn - aOn;
        });
        const reqList = Object.values(state.incomingRequests).sort((a, b) => (b.ts || 0) - (a.ts || 0));
        const notifList = Object.entries(state.notificationsMap)
            .map(([id, n]) => ({ id, ...n }))
            .filter(n => n.type !== 'friend_request')
            .sort((a, b) => (b.ts || 0) - (a.ts || 0));

        const totalAlertCount = reqList.length + notifList.filter(n => !n.read).length;

        let bodyHtml = '';

        if (state.activeTab === 'friends') {
            if (friendsList.length === 0) {
                bodyHtml = `
                    <div class="yk-f-empty">
                        <i class="fa-solid fa-user-group"></i>
                        هێشتا هیچ هاوڕێیەکت نییە.<br>
                        بڕۆ بەشی <b>زیادکردن (Add)</b> و داواکاری بۆ هاوڕێکانت بنێرە.
                        <div style="margin-top:14px;">
                            <button class="yk-f-btn-add" style="padding:10px 22px; font-size:13px;" onclick="YariFriends.setTab('add')">
                                <i class="fa-solid fa-user-plus"></i> گەڕان و زیادکردنی هاوڕێ
                            </button>
                        </div>
                    </div>
                `;
            } else {
                bodyHtml = friendsList.map(f => {
                    const isOnline = !!state.onlineMap[f.uid];
                    const safeName = escapeHtml(f.name || 'یاریزان').replace(/'/g, '');
                    return `
                        <div class="yk-f-row" onclick="window.location.href='profile.html?uid=${f.uid}'">
                            <div class="yk-f-user">
                                <div class="yk-f-av-wrap">
                                    <img src="${escapeHtml(f.avatar || 'images.png/controller.png')}" onerror="this.src='images.png/controller.png'" alt="">
                                    <span class="yk-f-av-dot ${isOnline ? 'online' : ''}"></span>
                                </div>
                                <div>
                                    <div class="yk-f-name">${escapeHtml(f.name || 'یاریزان')}</div>
                                    <div class="yk-f-meta" style="color:${isOnline ? '#34d399' : '#94a3b8'};">
                                        ${isOnline ? 'ئێستا ئۆنڵاینە' : 'ئۆفڵاین'} • Lv.${f.level || 1}
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <button onclick="event.stopPropagation(); YariFriends.remove('${f.uid}','${safeName}')" title="سڕینەوەی هاوڕێ" style="width:32px; height:32px; border-radius:9px; border:1px solid rgba(239,68,68,0.35); background:rgba(239,68,68,0.12); color:#fca5a5; cursor:pointer;">
                                    <i class="fa-solid fa-user-minus"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } else if (state.activeTab === 'add') {
            bodyHtml = `
                <div class="yk-f-search-wrap">
                    <i class="fa-solid fa-magnifying-glass" style="color:#ffd000;"></i>
                    <input type="text" id="ykFriendSearchInput" value="${escapeHtml(state.searchQuery)}" placeholder="ناو یان ئایدی (ID) یاریزان بنووسە..." oninput="YariFriends.search(this.value)">
                </div>
                <div id="ykFriendSearchResultsBox" style="display:flex; flex-direction:column; gap:9px;"></div>
            `;
        } else {
            // بەشی داواکاری و ئاگادارکردنەوەکان (Notifications)
            const reqHtml = reqList.length > 0 ? `
                <div class="yk-f-sec-title"><i class="fa-solid fa-user-plus"></i> داواکاری هاوڕێیەتی (${reqList.length})</div>
                ${reqList.map(r => `
                    <div class="yk-f-row" style="border-color:rgba(255,184,0,0.4);" onclick="window.location.href='profile.html?uid=${r.fromUid}'">
                        <div class="yk-f-user">
                            <div class="yk-f-av-wrap">
                                <img src="${escapeHtml(r.fromAvatar || 'images.png/controller.png')}" onerror="this.src='images.png/controller.png'" alt="">
                            </div>
                            <div>
                                <div class="yk-f-name">${escapeHtml(r.fromName || 'یاریزان')}</div>
                                <div class="yk-f-meta">داواکاری هاوڕێیەتی ناردووە • ${formatTimeAgo(r.ts)}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:5px; flex-shrink:0;">
                            <button class="yk-f-btn-accept" onclick="event.stopPropagation(); YariFriends.accept('${r.fromUid}')">پەسەند</button>
                            <button class="yk-f-btn-decline" onclick="event.stopPropagation(); YariFriends.decline('${r.fromUid}')">ڕەت</button>
                        </div>
                    </div>
                `).join('')}
            ` : '';

            const notifHtml = notifList.length > 0 ? `
                <div class="yk-f-sec-title" style="margin-top:6px;"><i class="fa-solid fa-bell"></i> ئاگادارکردنەوەکانی تر</div>
                ${notifList.map(n => `
                    <div class="yk-f-row" style="cursor:default;">
                        <div class="yk-f-user">
                            <div class="yk-f-av-wrap">
                                <img src="${escapeHtml(n.fromAvatar || 'images.png/controller.png')}" onerror="this.src='images.png/controller.png'" alt="">
                            </div>
                            <div>
                                <div class="yk-f-name" style="color:#ffd000;">${escapeHtml(n.title || 'ئاگادارکردنەوە')}</div>
                                <div class="yk-f-meta" style="color:#e2e8f0;">${escapeHtml(n.text || '')}</div>
                                <div class="yk-f-meta" style="font-size:10px;">${formatTimeAgo(n.ts)}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            ` : '';

            bodyHtml = (reqHtml || notifHtml)
                ? (reqHtml + notifHtml)
                : `<div class="yk-f-empty"><i class="fa-solid fa-bell-slash"></i> هیچ داواکاری یان ئاگادارکردنەوەیەکی نوێ نییە.</div>`;
        }

        overlay.innerHTML = `
            <div class="yk-f-sheet" onclick="event.stopPropagation()">
                <div class="yk-f-header">
                    <div class="yk-f-title"><i class="fa-solid fa-user-group"></i> هاوڕێکان و ئاگادارکردنەوە</div>
                    <button class="yk-f-close" onclick="YariFriends.close()"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="yk-f-tabs">
                    <button class="yk-f-tab ${state.activeTab === 'friends' ? 'active' : ''}" onclick="YariFriends.setTab('friends')">
                        <i class="fa-solid fa-users"></i> هاوڕێکان (${friendsList.length})
                    </button>
                    <button class="yk-f-tab ${state.activeTab === 'add' ? 'active' : ''}" onclick="YariFriends.setTab('add')">
                        <i class="fa-solid fa-user-plus"></i> زیادکردن
                    </button>
                    <button class="yk-f-tab ${state.activeTab === 'notifications' ? 'active' : ''}" onclick="YariFriends.setTab('notifications')">
                        <i class="fa-solid fa-bell"></i> ئاگاداری
                        ${totalAlertCount > 0 ? `<span class="yk-f-tab-badge">${totalAlertCount}</span>` : ''}
                    </button>
                </div>

                <div class="yk-f-body">${bodyHtml}</div>
            </div>
        `;

        if (state.activeTab === 'add') {
            renderSearchResultsOnly();
        }
    }

    function open(defaultTab = 'friends') {
        state.activeTab = defaultTab;
        injectStyles();
        let overlay = document.getElementById('ykFriendsOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ykFriendsOverlay';
            overlay.onclick = close;
            document.body.appendChild(overlay);
        }
        renderModalContent();
        overlay.classList.add('open');
        if (defaultTab === 'notifications') {
            markAllNotificationsRead();
        }
    }

    function close() {
        const overlay = document.getElementById('ykFriendsOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    function setTab(tab) {
        state.activeTab = tab;
        renderModalContent();
        if (tab === 'notifications') {
            markAllNotificationsRead();
        }
    }

    // بەستنەوەی خۆکار بە دوگمەی هاوڕێکان و زەنگی ئاگادارکردنەوە لە شاشەکەدا
    function autoBindTriggers() {
        // ١. دوگمەی هاوڕێکان لە شریتی خوارەوە
        document.querySelectorAll('button, a, div').forEach(el => {
            const txt = (el.textContent || '').trim();
            if ((txt === 'هاوڕێکان' || txt === 'هەڤاڵ' || txt === 'Friends') && el.offsetHeight > 0 && el.offsetHeight < 95 && el.offsetWidth < 130) {
                el.id = 'ykNavFriendsTrigger';
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    open('friends');
                }, true);
            }
        });

        // ٢. دوگمەی زەنگەکە (Notification Bell) لە سەرەوەی شاشە
        document.querySelectorAll('.fa-bell').forEach(bell => {
            const btn = bell.closest('button, a, div') || bell.parentElement;
            if (btn && btn.offsetHeight > 0 && btn.offsetHeight < 80) {
                btn.style.cursor = 'pointer';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    open('notifications');
                }, true);
            }
        });
    }

    window.YariFriends = {
        open,
        close,
        setTab,
        search: handleSearchInput,
        sendRequest: sendFriendRequest,
        cancel: cancelFriendRequest,
        accept: acceptFriendRequest,
        decline: declineFriendRequest,
        remove: removeFriend
    };

    window.addEventListener('DOMContentLoaded', () => {
        autoBindTriggers();

        const storedUid = localStorage.getItem('yk_player_uid');
        if (storedUid) bindFirebaseListeners(storedUid);

        if (window.firebase && firebase.auth) {
            firebase.auth().onAuthStateChanged(user => {
                if (user && user.uid) {
                    localStorage.setItem('yk_player_uid', user.uid);
                    bindFirebaseListeners(user.uid);
                }
            });
        }
    });
})();