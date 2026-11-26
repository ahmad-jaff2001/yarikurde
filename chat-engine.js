// =============================================================================
// YARI KURDI - DIRECT MESSAGING SYSTEM (INSTAGRAM STYLE)
// =============================================================================

(function () {
    const state = {
        myUid: '',
        myName: 'یاریزان',
        myAvatar: 'images.png/controller.png',
        activeChatUid: null,
        activeChatName: '',
        activeChatAvatar: '',
        inboxList: [], // لیستی ئەو کەسانەی چاتت لەگەڵ کردوون
        messagesCache: {}, // پاشەکەوتی نامەکانی هەر چاتێک
        friendsList: [] // بۆ دەستپێکردنی چاتی نوێ
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
            return h + ':' + m + ' ' + ampm;
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
        return uid1 < uid2 ? uid1 + '_' + uid2 : uid2 + '_' + uid1;
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

        // وەرگرتنی زانیاری خۆم
        db.ref('players/' + uid).once('value', function(snap) {
            const d = snap.val() || {};
            state.myName = d.name || 'یاریزان';
            state.myAvatar = d.avatar || 'images.png/controller.png';
        });

        // وەرگرتنی لیستی هاوڕێکان بۆ چاتی نوێ
        db.ref('friends/' + uid).on('value', function(snap) {
            const friends = snap.val() || {};
            state.friendsList = Object.keys(friends).map(function(k) { return friends[k]; });
        });

        // گوێگرتن بۆ ئینبۆکس (دوایین نامەکان)
        db.ref('inbox/' + uid).on('value', function(snap) {
            const data = snap.val() || {};
            const arr = [];
            Object.keys(data).forEach(function(partnerUid) {
                const p = data[partnerUid];
                if (p && p.lastMessageTs) {
                    arr.push(Object.assign({ partnerUid: partnerUid }, p));
                }
            });
            arr.sort(function(a, b) { return b.lastMessageTs - a.lastMessageTs; });
            state.inboxList = arr;
            
            // ئەگەر لە لیستی چاتەکانە، ڕیفرێشی بکە
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
        
        // گوێگرتن بۆ نامەکانی ئەم چاتە دیاریکراوە
        const db = firebase.database();
        const chatId = getChatId(state.myUid, partnerUid);
        
        db.ref('messages/' + chatId).limitToLast(50).on('value', function(snap) {
            if (state.activeChatUid !== partnerUid) return; // ئەگەر چاتێکی تری کردەوە
            const msgs = snap.val() || {};
            const msgArr = Object.keys(msgs).map(function(k) { return Object.assign({ id: k }, msgs[k]); });
            msgArr.sort(function(a, b) { return a.ts - b.ts; });
            
            state.messagesCache[partnerUid] = msgArr;
            renderMessages();
            
            // ئەگەر نامەی نەخوێندراوە هەبوو بیخوێنەرەوە
            if (msgArr.length > 0) {
                const lastMsg = msgArr[msgArr.length - 1];
                if (lastMsg.senderUid !== state.myUid && !lastMsg.read) {
                    db.ref('messages/' + chatId + '/' + lastMsg.id + '/read').set(true);
                    db.ref('inbox/' + state.myUid + '/' + partnerUid + '/unread').set(0);
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
        
        // ناردنی نامەکە بۆ چاتەکە
        const newMsgRef = db.ref('messages/' + chatId).push();
        await newMsgRef.set(msgData);
        
        // نوێکردنەوەی ئینبۆکسی خۆم
        await db.ref('inbox/' + state.myUid + '/' + partnerUid).update({
            lastMessage: text,
            lastMessageTs: now,
            partnerName: state.activeChatName,
            partnerAvatar: state.activeChatAvatar,
            senderUid: state.myUid,
            unread: 0
        });
        
        // نوێکردنەوەی ئینبۆکسی بەرامبەر
        const pRef = db.ref('inbox/' + partnerUid + '/' + state.myUid);
        pRef.transaction(function(curr) {
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
        style.textContent =
            '#ykChatOverlay{position:fixed;inset:0;background:rgba(3,2,10,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:999993;display:none;align-items:flex-end;justify-content:center;direction:rtl;font-family:Vazirmatn,sans-serif;color:#fff;}' +
            '@media (min-width:520px){#ykChatOverlay{align-items:center;padding:16px;}}' +
            '#ykChatOverlay.open{display:flex;}' +
            '.yk-chat-sheet{width:100%;max-width:460px;height:90dvh;max-height:800px;background:#050505;border-top:1.5px solid rgba(255,255,255,0.1);border-radius:26px 26px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -15px 55px rgba(0,0,0,0.98);}' +
            '@media (min-width:520px){.yk-chat-sheet{border:1.5px solid rgba(255,255,255,0.1);border-radius:24px;}}' +
            
            /* هێدەری ئینستاگرام ستايل */
            '.yk-chat-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#0a0a0a;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;}' +
            '.yk-ch-title{font-size:16px;font-weight:900;color:#fff;display:flex;align-items:center;gap:10px;}' +
            '.yk-ch-back{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;cursor:pointer;background:transparent;border:none;}' +
            '.yk-ch-back:hover{background:rgba(255,255,255,0.1);}' +
            
            /* لیستی ئینبۆکس */
            '.yk-inbox-body{padding:0;overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch;}' +
            '.yk-inbox-row{display:flex;align-items:center;gap:14px;padding:12px 18px;cursor:pointer;transition:background 0.2s;}' +
            '.yk-inbox-row:active{background:rgba(255,255,255,0.05);}' +
            '.yk-inb-avatar{width:54px;height:54px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);}' +
            '.yk-inb-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;}' +
            '.yk-inb-name{font-size:14.5px;font-weight:700;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.yk-inb-msg{font-size:13px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}' +
            '.yk-inb-msg.unread{color:#fff;font-weight:800;}' +
            '.yk-inb-time{font-size:11px;color:#64748b;flex-shrink:0;}' +
            '.yk-inb-dot{width:8px;height:8px;border-radius:50%;background:#3b82f6;flex-shrink:0;}' +
            
            /* ناوەوەی چاتەکە */
            '.yk-msg-body{padding:16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;-webkit-overflow-scrolling:touch;background:#000;}' +
            '.yk-msg-wrap{display:flex;width:100%;}' +
            '.yk-msg-wrap.mine{justify-content:flex-start;}' +
            '.yk-msg-wrap.theirs{justify-content:flex-end;}' +
            '.yk-bubble{max-width:75%;padding:10px 14px;font-size:14px;line-height:1.4;word-wrap:break-word;}' +
            '.yk-bubble.mine{background:#3797f0;color:#fff;border-radius:20px 4px 20px 20px;}' + /* شینی ئینستاگرام */
            '.yk-bubble.theirs{background:#262626;color:#fff;border-radius:4px 20px 20px 20px;border:1px solid rgba(255,255,255,0.05);}' + /* ڕەشی ئینستاگرام */
            '.yk-msg-time{font-size:9.5px;color:#64748b;margin-top:4px;display:flex;align-items:center;gap:4px;}' +
            '.yk-msg-wrap.mine .yk-msg-time{justify-content:flex-start;}' +
            '.yk-msg-wrap.theirs .yk-msg-time{justify-content:flex-end;}' +
            
            /* شریتی نووسین */
            '.yk-chat-footer{padding:10px 16px 16px;background:#0a0a0a;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:10px;flex-shrink:0;}' +
            '.yk-chat-input-box{flex:1;background:#262626;border-radius:24px;display:flex;align-items:center;padding:2px 4px 2px 14px;border:1px solid rgba(255,255,255,0.05);}' +
            '.yk-chat-input-box input{flex:1;background:transparent;border:none;outline:none;color:#fff;font-size:14.5px;font-family:inherit;padding:10px 0;}' +
            '.yk-chat-input-box input::placeholder{color:#737373;}' +
            '.yk-send-btn{width:36px;height:36px;border-radius:50%;background:transparent;border:none;color:#3797f0;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.1s;}' +
            '.yk-send-btn:active{transform:scale(0.9);}';
        document.head.appendChild(style);
    }

    function renderInbox() {
        const overlay = document.getElementById('ykChatOverlay');
        if (!overlay) return;

        let listHtml = '';
        if (state.inboxList.length === 0) {
            listHtml = '<div style="text-align:center;padding:40px 20px;color:#737373;font-size:14px;"><i class="fa-solid fa-paper-plane" style="font-size:40px;margin-bottom:15px;display:block;"></i>هیچ نامەیەک نییە.<br>لە لیستی هاوڕێکانتەوە دەتوانیت چات دەستپێبکەیت.</div>';
        } else {
            listHtml = state.inboxList.map(function(chat) {
                const isUnread = chat.senderUid !== state.myUid && chat.unread > 0;
                const safeName = escapeHtml(chat.partnerName || 'یاریزان');
                const msgPreview = escapeHtml(chat.lastMessage || 'وێنەیەک نێردراوە');
                const timeStr = formatChatTime(chat.lastMessageTs);
                
                return '<div class="yk-inbox-row" onclick="YariChat.openWith(\'' + chat.partnerUid + '\', \'' + safeName + '\', \'' + escapeHtml(chat.partnerAvatar) + '\')">' +
                    '<img src="' + escapeHtml(chat.partnerAvatar || 'images.png/controller.png') + '" class="yk-inb-avatar" onerror="this.src=\'images.png/controller.png\'" alt="">' +
                    '<div class="yk-inb-info">' +
                        '<div class="yk-inb-name">' + safeName + '</div>' +
                        '<div class="yk-inb-msg ' + (isUnread ? 'unread' : '') + '">' +
                            (chat.senderUid === state.myUid ? 'تۆ: ' : '') + msgPreview + ' • ' + timeStr +
                        '</div>' +
                    '</div>' +
                    (isUnread ? '<div class="yk-inb-dot"></div>' : '') +
                '</div>';
            }).join('');
        }

        overlay.innerHTML =
            '<div class="yk-chat-sheet" onclick="event.stopPropagation()">' +
                '<div class="yk-chat-header">' +
                    '<div class="yk-ch-title">نامەکان</div>' +
                    '<button class="yk-ch-back" onclick="YariChat.close()"><i class="fa-solid fa-xmark"></i></button>' +
                '</div>' +
                '<div class="yk-inbox-body">' + listHtml + '</div>' +
            '</div>';
    }

    function renderChatWindow() {
        const overlay = document.getElementById('ykChatOverlay');
        if (!overlay) return;

        overlay.innerHTML =
            '<div class="yk-chat-sheet" onclick="event.stopPropagation()">' +
                '<div class="yk-chat-header">' +
                    '<div class="yk-ch-title" style="cursor:pointer;" onclick="window.location.href=\'profile.html?uid=' + state.activeChatUid + '\'">' +
                        '<img src="' + escapeHtml(state.activeChatAvatar || 'images.png/controller.png') + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.1);" onerror="this.src=\'images.png/controller.png\'">' +
                        escapeHtml(state.activeChatName) +
                    '</div>' +
                    '<button class="yk-ch-back" onclick="YariChat.backToInbox()"><i class="fa-solid fa-chevron-left"></i></button>' +
                '</div>' +
                '<div class="yk-msg-body" id="ykChatMessagesBox"></div>' +
                '<div class="yk-chat-footer">' +
                    '<div class="yk-chat-input-box">' +
                        '<input type="text" id="ykChatInput" placeholder="نامەیەک بنووسە..." autocomplete="off" onkeypress="if(event.key===\'Enter\') YariChat.send()">' +
                        '<button class="yk-send-btn" onclick="YariChat.send()"><i class="fa-solid fa-paper-plane"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
            
        renderMessages();
    }

    function renderMessages() {
        const box = document.getElementById('ykChatMessagesBox');
        if (!box || !state.activeChatUid) return;
        
        const msgs = state.messagesCache[state.activeChatUid] || [];
        
        if (msgs.length === 0) {
            box.innerHTML = '<div style="text-align:center;color:#737373;font-size:12.5px;padding:30px 10px;margin:auto;">چاتەکەت لێرەوە دەستپێدەکات...</div>';
            return;
        }

        const isNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100;

        let html = '';
        msgs.forEach(function(m) {
            const isMine = m.senderUid === state.myUid;
            const timeStr = formatChatTime(m.ts);
            const seenIcon = isMine && m.read ? '<i class="fa-solid fa-check-double" style="color:#34d399;font-size:9px;"></i>' : '';
            
            html +=
                '<div class="yk-msg-wrap ' + (isMine ? 'mine' : 'theirs') + '">' +
                    '<div>' +
                        '<div class="yk-bubble ' + (isMine ? 'mine' : 'theirs') + '">' + escapeHtml(m.text) + '</div>' +
                        '<div class="yk-msg-time">' + (isMine ? seenIcon : '') + timeStr + '</div>' +
                    '</div>' +
                '</div>';
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
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                open();
            }, true);
        }
    }

    window.YariChat = {
        open: open,
        close: close,
        backToInbox: backToInbox,
        openWith: openChatWith,
        send: sendMessage
    };

    window.addEventListener('DOMContentLoaded', function() {
        autoBindTrigger();

        const storedUid = localStorage.getItem('yk_player_uid');
        if (storedUid) bindFirebaseListeners(storedUid);

        if (window.firebase && firebase.auth) {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user && user.uid) {
                    localStorage.setItem('yk_player_uid', user.uid);
                    bindFirebaseListeners(user.uid);
                }
            });
        }
    });
})();