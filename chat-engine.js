// =============================================================================
// YARI KURDI - DIRECT MESSAGING SYSTEM (INSTAGRAM / MESSENGER STYLE)
// =============================================================================

(function () {
    const state = {
        myUid: '',
        myName: 'یاریزان',
        myAvatar: 'images.png/controller.png',
        activeChatUid: null,
        activeChatName: '',
        activeChatAvatar: '',
        inboxList: [], 
        messagesCache: {}, 
        friendsList: []
    };

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str || '');
        return div.innerHTML.replace(/"/g, '"');
    }

    function formatChatTime(ts) {
        if (!ts) return '';
        const date = new Date(ts);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        if (isToday) {
            let h = date.getHours();
            const m = String(date.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
        } else {
            const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) return 'دوێنێ';
            if (diffDays < 7) {
                const days = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
                return days[date.getDay()];
            }
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        }
    }

    function getChatId(uid1, uid2) {
        return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    }

    function scrollToBottom() {
        const box = document.getElementById('ykChatMessagesBox');
        if (box) box.scrollTop = box.scrollHeight;
    }

    function bindFirebaseListeners(uid) {
        if (!uid || !window.firebase || !firebase.apps || !firebase.apps.length) return;
        if (state.myUid === uid && state._bound) return;
        state.myUid = uid;
        state._bound = true;

        const db = firebase.database();

        db.ref(`players/${uid}`).once('value', snap => {
            const d = snap.val() || {};
            state.myName = d.name || 'یاریزان';
            state.myAvatar = d.avatar || 'images.png/controller.png';
        });

        db.ref(`friends/${uid}`).on('value', snap => {
            const friends = snap.val() || {};
            state.friendsList = Object.keys(friends).map(k => friends[k]);
            const overlay = document.getElementById('ykChatOverlay');
            if (overlay && overlay.classList.contains('open') && !state.activeChatUid) {
                renderInbox();
            }
        });

        db.ref(`inbox/${uid}`).on('value', snap => {
            const data = snap.val() || {};
            const arr = [];
            Object.keys(data).forEach(partnerUid => {
                const p = data[partnerUid];
                if (p && p.lastMessageTs) {
                    arr.push({ partnerUid, ...p });
                }
            });
            arr.sort((a, b) => b.lastMessageTs - a.lastMessageTs);
            state.inboxList = arr;
            
            const overlay = document.getElementById('ykChatOverlay');
            if (overlay && overlay.classList.contains('open') && !state.activeChatUid) {
                renderInbox();
            }
        });
    }

    function openChatWith(partnerUid, partnerName, partnerAvatar) {
        state.activeChatUid = partnerUid;
        state.activeChatName = partnerName;
        state.activeChatAvatar = partnerAvatar;
        
        renderChatWindow();
        
        const db = firebase.database();
        const chatId = getChatId(state.myUid, partnerUid);
        
        db.ref(`messages/${chatId}`).limitToLast(50).on('value', snap => {
            if (state.activeChatUid !== partnerUid) return; 
            const msgs = snap.val() || {};
            const msgArr = Object.keys(msgs).map(k => ({ id: k, ...msgs[k] }));
            msgArr.sort((a, b) => a.ts - b.ts);
            
            state.messagesCache[partnerUid] = msgArr;
            renderMessages();
            
            if (msgArr.length > 0) {
                const lastMsg = msgArr[msgArr.length - 1];
                if (lastMsg.senderUid !== state.myUid && !lastMsg.read) {
                    db.ref(`messages/${chatId}/${lastMsg.id}/read`).set(true);
                    db.ref(`inbox/${state.myUid}/${partnerUid}/unread`).set(0);
                }
            }
        });
    }

    async function sendMessage() {
        const inp = document.getElementById('ykChatInput');
        if (!inp) return;
        const text = inp.value.trim();
        if (!text || !state.activeChatUid || !state.myUid) return;
        
        inp.value = '';
        const partnerUid = state.activeChatUid;
        const db = firebase.database();
        const chatId = getChatId(state.myUid, partnerUid);
        const now = Date.now();
        
        const msgData = {
            senderUid: state.myUid,
            text: text,
            ts: now,
            read: false
        };
        
        await db.ref(`messages/${chatId}`).push().set(msgData);
        
        await db.ref(`inbox/${state.myUid}/${partnerUid}`).update({
            lastMessage: text,
            lastMessageTs: now,
            partnerName: state.activeChatName,
            partnerAvatar: state.activeChatAvatar,
            senderUid: state.myUid,
            unread: 0
        });
        
        db.ref(`inbox/${partnerUid}/${state.myUid}`).transaction(curr => {
            if (!curr) curr = {};
            curr.lastMessage = text;
            curr.lastMessageTs = now;
            curr.partnerName = state.myName;
            curr.partnerAvatar = state.myAvatar;
            curr.senderUid = state.myUid;
            curr.unread = (curr.unread || 0) + 1;
            return curr;
        });
    }

    function injectStyles() {
        if (document.getElementById('ykChatStyles')) return;
        const style = document.createElement('style');
        style.id = 'ykChatStyles';
        style.textContent = `
            #ykChatOverlay {
                position: fixed; inset: 0; background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
                z-index: 999993; display: none; align-items: flex-end; justify-content: center;
                direction: rtl; font-family: 'Vazirmatn', sans-serif; color: #fff;
            }
            @media (min-width: 520px) { #ykChatOverlay { align-items: center; padding: 16px; } }
            #ykChatOverlay.open { display: flex; }

            .yk-chat-sheet {
                width: 100%; max-width: 480px; height: 92dvh; max-height: 850px;
                background: #000; border-top: 1px solid #262626;
                border-radius: 20px 20px 0 0; display: flex; flex-direction: column; overflow: hidden;
            }
            @media (min-width: 520px) { .yk-chat-sheet { border: 1px solid #262626; border-radius: 20px; } }
            
            /* ئینبۆکس و هاوڕێکان */
            .yk-chat-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 14px 18px; background: #000; border-bottom: 1px solid #262626; flex-shrink: 0;
            }
            .yk-inbox-friends-strip {
                display: flex; align-items: flex-start; gap: 16px; padding: 16px 18px;
                overflow-x: auto; border-bottom: 1px solid #262626; -webkit-overflow-scrolling: touch; flex-shrink: 0;
            }
            .yk-inbox-friends-strip::-webkit-scrollbar { display: none; }
            .yk-af-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; width: 62px; flex-shrink: 0; }
            .yk-af-avatar-wrap {
                position: relative; width: 62px; height: 62px; border-radius: 50%; padding: 2.5px;
                background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
            }
            .yk-af-avatar-wrap img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2.5px solid #000; }
            .yk-af-name { font-size: 11.5px; color: #f5f5f5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center; }

            .yk-inbox-body { padding: 0; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; }
            .yk-inbox-row { display: flex; align-items: center; gap: 14px; padding: 12px 18px; cursor: pointer; }
            .yk-inbox-row:active { background: #1a1a1a; }
            .yk-inb-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
            .yk-inb-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
            .yk-inb-name { font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .yk-inb-msg { font-size: 13.5px; color: #a3a3a3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
            .yk-inb-msg.unread { color: #fff; font-weight: 800; }
            .yk-inb-dot { width: 8px; height: 8px; border-radius: 50%; background: #0084ff; flex-shrink: 0; }
            
            /* ناوەوەی چات و نامەکان (شێوازی ئینستاگرام/مەسنجەر) */
            .yk-msg-body {
                padding: 20px 16px; overflow-y: auto; flex: 1; display: flex;
                flex-direction: column; gap: 12px; background: #000; -webkit-overflow-scrolling: touch;
            }
            .yk-msg-wrapper {
                display: flex; align-items: flex-end; gap: 8px; width: 100%;
            }
            /* نامەی من دەکەوێتە لای ڕاست (flex-start لە RTL) */
            .yk-msg-wrapper.mine { justify-content: flex-start; }
            /* نامەی بەرامبەر دەکەوێتە لای چەپ (flex-end لە RTL) */
            .yk-msg-wrapper.theirs { justify-content: flex-end; }
            
            .yk-msg-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
            
            .yk-msg-col { display: flex; flex-direction: column; max-width: 72%; }
            .yk-msg-wrapper.mine .yk-msg-col { align-items: flex-start; }
            .yk-msg-wrapper.theirs .yk-msg-col { align-items: flex-end; }
            
            .yk-bubble {
                padding: 10px 15px; font-size: 14.5px; line-height: 1.5; color: #fff;
                word-break: break-word; white-space: pre-wrap; width: fit-content; text-align: right;
            }
            .yk-msg-wrapper.mine .yk-bubble {
                background: linear-gradient(135deg, #0084ff, #0066ff);
                border-radius: 20px 20px 4px 20px;
            }
            .yk-msg-wrapper.theirs .yk-bubble {
                background: #262626;
                border-radius: 20px 20px 20px 4px;
            }
            
            .yk-msg-time { font-size: 10px; color: #737373; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
            
            /* شریتی نووسینی خوارەوە */
            .yk-chat-footer {
                padding: 10px 16px 16px; background: #000; border-top: 1px solid #262626;
                display: flex; align-items: center; gap: 12px; flex-shrink: 0;
            }
            .yk-cam-btn {
                width: 38px; height: 38px; border-radius: 50%; background: #0084ff; color: #fff;
                border: none; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
            }
            .yk-chat-input-box {
                flex: 1; background: #262626; border-radius: 24px; display: flex; align-items: center; padding: 4px 14px;
            }
            .yk-chat-input-box input {
                flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 14.5px; padding: 8px 0;
            }
            .yk-chat-input-box input::placeholder { color: #737373; }
            .yk-send-btn { background: transparent; border: none; color: #0084ff; font-size: 20px; cursor: pointer; padding: 0 4px; }
        `;
        document.head.appendChild(style);
    }

    function renderInbox() {
        const overlay = document.getElementById('ykChatOverlay');
        if (!overlay) return;

        let friendsHtml = '';
        if (state.friendsList && state.friendsList.length > 0) {
            const fList = state.friendsList.map(f => {
                const safeName = escapeHtml(f.name || 'یاریزان');
                const safeAv = escapeHtml(f.avatar || 'images.png/controller.png');
                return `
                    <div class="yk-af-item" onclick="YariChat.openWith('${f.uid}', '${safeName}', '${safeAv}')">
                        <div class="yk-af-avatar-wrap">
                            <img src="${safeAv}" onerror="this.src='images.png/controller.png'" alt="">
                        </div>
                        <div class="yk-af-name">${safeName}</div>
                    </div>
                `;
            }).join('');
            friendsHtml = `<div class="yk-inbox-friends-strip">${fList}</div>`;
        }

        let listHtml = '';
        if (state.inboxList.length === 0) {
            listHtml = `<div style="text-align:center;padding:50px 20px;color:#737373;font-size:15px;"><i class="fa-brands fa-instagram" style="font-size:45px;margin-bottom:15px;display:block;"></i>هیچ نامەیەک نییە.<br>لە سەرەوە هاوڕێیەک هەڵبژێرە بۆ دەستپێکردنی چات.</div>`;
        } else {
            listHtml = state.inboxList.map(chat => {
                const isUnread = chat.senderUid !== state.myUid && chat.unread > 0;
                const safeName = escapeHtml(chat.partnerName || 'یاریزان');
                const msgPreview = escapeHtml(chat.lastMessage || 'وێنەیەک نێردراوە');
                const timeStr = formatChatTime(chat.lastMessageTs);
                
                return `
                    <div class="yk-inbox-row" onclick="YariChat.openWith('${chat.partnerUid}', '${safeName}', '${escapeHtml(chat.partnerAvatar)}')">
                        <img src="${escapeHtml(chat.partnerAvatar || 'images.png/controller.png')}" class="yk-inb-avatar" onerror="this.src='images.png/controller.png'">
                        <div class="yk-inb-info">
                            <div class="yk-inb-name">${safeName}</div>
                            <div class="yk-inb-msg ${isUnread ? 'unread' : ''}">
                                ${chat.senderUid === state.myUid ? 'تۆ: ' : ''}${msgPreview} • ${timeStr}
                            </div>
                        </div>
                        ${isUnread ? '<div class="yk-inb-dot"></div>' : ''}
                    </div>
                `;
            }).join('');
        }

        overlay.innerHTML = `
            <div class="yk-chat-sheet" onclick="event.stopPropagation()">
                <div class="yk-chat-header">
                    <div style="font-size:18px; font-weight:900; color:#fff; display:flex; align-items:center; gap:8px;">
                        ${escapeHtml(state.myName)} <i class="fa-solid fa-chevron-down" style="font-size:12px;"></i>
                    </div>
                    <div style="display:flex; gap:16px; font-size:22px; color:#fff;">
                        <i class="fa-solid fa-video" style="cursor:pointer;" onclick="YariChat.close()"></i>
                        <i class="fa-solid fa-pen-to-square" style="cursor:pointer;" onclick="YariChat.close()"></i>
                    </div>
                </div>
                ${friendsHtml}
                <div class="yk-inbox-body">${listHtml}</div>
            </div>
        `;
    }

   function renderChatWindow() {
        const overlay = document.getElementById('ykChatOverlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="yk-chat-sheet" onclick="event.stopPropagation()">
                <div class="yk-chat-header">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button style="background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer;" onclick="YariChat.backToInbox()">
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                        <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.location.href='profile.html?uid=${state.activeChatUid}'">
                            <img src="${escapeHtml(state.activeChatAvatar || 'images.png/controller.png')}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" onerror="this.src='images.png/controller.png'">
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-size:15px; font-weight:900; color:#fff;">${escapeHtml(state.activeChatName)}</span>
                                <span style="font-size:11.5px; color:#a3a3a3;">یاری کوردی</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="yk-msg-body" id="ykChatMessagesBox"></div>
                
                <div class="yk-chat-footer">
                    <div class="yk-chat-input-box">
                        <input type="text" id="ykChatInput" placeholder="نامە بنووسە..." autocomplete="off" onkeypress="if(event.key==='Enter') YariChat.send()">
                        <button class="yk-send-btn" onclick="YariChat.send()"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        `;
            
        renderMessages();
    }

    function renderMessages() {
        const box = document.getElementById('ykChatMessagesBox');
        if (!box || !state.activeChatUid) return;
        
        const msgs = state.messagesCache[state.activeChatUid] || [];
        
        if (msgs.length === 0) {
            box.innerHTML = `<div style="text-align:center;color:#737373;font-size:13px;padding:40px 10px;margin:auto;">چاتەکەت لێرەوە دەستپێدەکات...</div>`;
            return;
        }

        const isNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100;

        let html = '';
        msgs.forEach(m => {
            const isMine = m.senderUid === state.myUid;
            const timeStr = formatChatTime(m.ts);
            const seenIcon = isMine && m.read ? `<i class="fa-solid fa-check-double" style="color:#34d399;font-size:10px;"></i>` : '';
            
            if (isMine) {
                html += `
                    <div class="yk-msg-wrapper mine">
                        <div class="yk-msg-col">
                            <div class="yk-bubble">${escapeHtml(m.text)}</div>
                            <div class="yk-msg-time">${seenIcon} ${timeStr}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="yk-msg-wrapper theirs">
                        <div class="yk-msg-col">
                            <div class="yk-bubble">${escapeHtml(m.text)}</div>
                            <div class="yk-msg-time">${timeStr}</div>
                        </div>
                        <img src="${escapeHtml(state.activeChatAvatar)}" class="yk-msg-avatar" onerror="this.src='images.png/controller.png'">
                    </div>
                `;
            }
        });

        box.innerHTML = html;
        if (isNearBottom || msgs.length <= 15) scrollToBottom();
    }

    function open() {
        injectStyles();
        let overlay = document.getElementById('ykChatOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ykChatOverlay';
            overlay.onclick = close;
            document.body.appendChild(overlay);
        }
        
        state.activeChatUid = null;
        renderInbox();
        overlay.classList.add('open');
    }

    function close() {
        const overlay = document.getElementById('ykChatOverlay');
        if (overlay) overlay.classList.remove('open');
        state.activeChatUid = null;
    }

    function backToInbox() {
        state.activeChatUid = null;
        renderInbox();
    }

    function autoBindTrigger() {
        const trigger = document.getElementById('ykNavChatTrigger');
        if (trigger) {
            trigger.addEventListener('click', e => {
                e.preventDefault();
                e.stopImmediatePropagation();
                open();
            }, true);
        }
    }

    window.YariChat = { open, close, backToInbox, openWith: openChatWith, send: sendMessage };

    window.addEventListener('DOMContentLoaded', () => {
        autoBindTrigger();
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