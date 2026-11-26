// =============================================================================
// YARI KURDI - ROYAL SETTINGS, SECURITY & MULTI-LANGUAGE ENGINE
// Languages: Kurdish Sorani, Kurdish Badini, English
// =============================================================================

(function () {
    const TRANSLATIONS = {
        sorani: {
            dir: 'rtl',
            langCode: 'ku',
            settingsTitle: '⚙️ ڕێکخستنەکانی یاری کوردی',
            tabAccount: 'هەژمار و پاراستن',
            tabGeneral: 'گشتی و زمان',
            tabPrivacy: 'تایبەتمەندی',
            tabSupport: 'پشتگیری',
            langSectionTitle: '🌐 زمانی بەرنامە (Language)',
            langDesc: 'زمانی دڵخوازت هەڵبژێرە بۆ هەموو بەشەکانی یاری کوردی:',
            audioSectionTitle: '🔊 دەنگ و جووڵە',
            sfxLabel: 'دەنگی کاریگەرییەکانی یاری (SFX)',
            bgmLabel: 'میوزیکی باکگراوند',
            vibrateLabel: 'لەرزینی مۆبایل (Vibration)',
            testSoundBtn: '🔔 تاقیکردنەوەی دەنگ',
            accInfoTitle: '🛡️ زانیاری و پاراستنی هەژمار',
            accStatusSecure: 'پارێزراوە بە هەژماری فەرمی ✅',
            accStatusGuest: 'هەژماری میوان (پێویستە بیبەستیتەوە) ⚠️',
            emailLabel: 'ئیمەیڵ:',
            idLabel: 'ئایدی یاریزان:',
            verifiedYes: 'پشتڕاستکراوە ✅',
            verifiedNo: 'پشتڕاستنەکراوە ⚠️',
            verifyEmailBtn: 'ناردنی لینکی پشتڕاستکردنەوە',
            changePassBtn: '🔑 گۆڕینی وشەی نهێنی (Password)',
            linkAccBtn: '🔗 بەستنەوەی هەژمار (Google / Email)',
            logoutBtn: '🚪 دەرچوون لە هەژمار (Log Out)',
            logoutConfirm: 'دڵنیایت دەتەوێت لە هەژمارەکەت دەربچیت؟',
            privacyTitle: '🔒 ڕێکخستنی تایبەتمەندی',
            allowFriendsLabel: 'وەرگرتنی داواکاری هاوڕێیەتی',
            allowInvitesLabel: 'وەرگرتنی بانگهێشتنامەی یاری و ژوور',
            stealthModeLabel: 'شاردنەوەی دۆخی ئۆنڵاین',
            blockedTitle: '🚫 یاریزانە بلۆککراوەکان',
            noBlockedText: 'هیچ یاریزانێک بلۆک نەکراوە.',
            unblockBtn: 'لادانی بلۆک',
            toolsTitle: '🛠️ ئامراز و پشتگیری',
            clearCacheBtn: '🧹 خاوێنکردنەوەی کاش و خێراکردن',
            supportPlaceholder: 'کێشە یان پێشنیارەکەت لێرە بنووسە بۆ ئادمین...',
            sendSupportBtn: 'ناردن بۆ پشتگیری 📩',
            savedToast: 'گۆڕانکارییەکە پاشەکەوت کرا ✅',
            navHome: 'سەرەکی',
            navGames: 'یارییەکان',
            navRank: 'ڕیزبەندی',
            navFriends: 'هاوڕێکان',
            navSettings: 'ڕێکخستن'
        },
        badini: {
            dir: 'rtl',
            langCode: 'ku',
            settingsTitle: '⚙️ ڕێکخستنێن یاری کوردی',
            tabAccount: 'هەژمار و پاراستن',
            tabGeneral: 'گشتی و زمان',
            tabPrivacy: 'تایبەتمەندی',
            tabSupport: 'پشتەڤانی',
            langSectionTitle: '🌐 زمانێ بەرنامەی (Language)',
            langDesc: 'زمانێ خۆ یێ دڵخواز هەلبژێرە بۆ هەمی پشکێن یاری کوردی:',
            audioSectionTitle: '🔊 دەنگ و لڤین',
            sfxLabel: 'دەنگێ کارتێکرنێن یاریێ (SFX)',
            bgmLabel: 'مۆزیکا پاشبنەمای',
            vibrateLabel: 'لەرزینا مۆبایلێ (Vibration)',
            testSoundBtn: '🔔 تاقیکرنا دەنگی',
            accInfoTitle: '🛡️ پێزانین و پاراستنا هەژماری',
            accStatusSecure: 'پاراستییە ب هەژمارێ فەرمی ✅',
            accStatusGuest: 'هەژمارێ مێهڤان (پێدڤییە گرێبدەی) ⚠️',
            emailLabel: 'ئیمەیڵ:',
            idLabel: 'ئایدیێ یاریزانی:',
            verifiedYes: 'پشتڕاستکرییە ✅',
            verifiedNo: 'نەهاتییە پشتڕاستکرن ⚠️',
            verifyEmailBtn: 'هنارتنا لینکێ پشتڕاستکرنێ',
            changePassBtn: '🔑 گوهۆڕینا پەیڤا نهێنی (Password)',
            linkAccBtn: '🔗 گرێدانا هەژماری (Google / Email)',
            logoutBtn: '🚪 دەرکەفتن ژ هەژماری (Log Out)',
            logoutConfirm: 'تۆ پشتڕاستی دڤێت ژ هەژمارێ خۆ دەربکەڤی؟',
            privacyTitle: '🔒 ڕێکخستنا تایبەتمەندیێ',
            allowFriendsLabel: 'وەرگرتنا داخوازێن هەڤالینیێ',
            allowInvitesLabel: 'وەرگرتنا داخوازنامێن یاری و ژووران',
            stealthModeLabel: 'ڤەشارتنا ڕەوشا ئۆنڵاین',
            blockedTitle: '🚫 یاریزانێن بلۆککری',
            noBlockedText: 'چ یاریزان نەهاتینە بلۆککرن.',
            unblockBtn: 'لادانا بلۆکی',
            toolsTitle: '🛠️ ئامراز و پشتەڤانی',
            clearCacheBtn: '🧹 پاقژکرنا کاشی و بلەزکرن',
            supportPlaceholder: 'ئاریشە یان پێشنیارا خۆ ل ڤێرێ بنڤیسە بۆ ئادمینی...',
            sendSupportBtn: 'هنارتن بۆ پشتەڤانیێ 📩',
            savedToast: 'گوهۆڕین هاتە پاراستن ✅',
            navHome: 'سەرەکی',
            navGames: 'یاری',
            navRank: 'ڕێزبەندی',
            navFriends: 'هەڤاڵ',
            navSettings: 'ڕێکخستن'
        },
        english: {
            dir: 'ltr',
            langCode: 'en',
            settingsTitle: '⚙️ Yari Kurdi Settings',
            tabAccount: 'Account & Security',
            tabGeneral: 'General & Language',
            tabPrivacy: 'Privacy',
            tabSupport: 'Support',
            langSectionTitle: '🌐 App Language',
            langDesc: 'Choose your preferred language across Yari Kurdi:',
            audioSectionTitle: '🔊 Audio & Haptics',
            sfxLabel: 'Game Sound Effects (SFX)',
            bgmLabel: 'Background Music',
            vibrateLabel: 'Vibration / Haptics',
            testSoundBtn: '🔔 Test Audio',
            accInfoTitle: '🛡️ Account & Security Status',
            accStatusSecure: 'Protected Official Account ✅',
            accStatusGuest: 'Guest Account (Link to save progress) ⚠️',
            emailLabel: 'Email:',
            idLabel: 'Player ID:',
            verifiedYes: 'Verified ✅',
            verifiedNo: 'Not Verified ⚠️',
            verifyEmailBtn: 'Send Verification Email',
            changePassBtn: '🔑 Reset / Change Password',
            linkAccBtn: '🔗 Link Account (Google / Email)',
            logoutBtn: '🚪 Log Out of Account',
            logoutConfirm: 'Are you sure you want to log out of your account?',
            privacyTitle: '🔒 Privacy Controls',
            allowFriendsLabel: 'Allow Friend Requests',
            allowInvitesLabel: 'Allow Game & Voice Room Invites',
            stealthModeLabel: 'Hide Online Status (Stealth)',
            blockedTitle: '🚫 Blocked Players',
            noBlockedText: 'No blocked players.',
            unblockBtn: 'Unblock',
            toolsTitle: '🛠️ Tools & Support',
            clearCacheBtn: '🧹 Clear Cache & Boost Speed',
            supportPlaceholder: 'Describe your issue or suggestion for the admin team...',
            sendSupportBtn: 'Send to Support 📩',
            savedToast: 'Settings saved ✅',
            navHome: 'Home',
            navGames: 'Games',
            navRank: 'Ranking',
            navFriends: 'Friends',
            navSettings: 'Settings'
        }
    };

    const state = {
        lang: localStorage.getItem('yk_lang') || 'sorani',
        sfx: localStorage.getItem('yk_sfx_enabled') !== 'false',
        bgm: localStorage.getItem('yk_bgm_enabled') !== 'false',
        vibrate: localStorage.getItem('yk_vibrate_enabled') !== 'false',
        allowFriends: true,
        allowInvites: true,
        stealthMode: false,
        activeTab: 'account'
    };

    function t(key) {
        const pack = TRANSLATIONS[state.lang] || TRANSLATIONS.sorani;
        return pack[key] || TRANSLATIONS.sorani[key] || key;
    }

    function showToast(msg) {
        let toast = document.getElementById('ykSettingsToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ykSettingsToast';
            toast.style.cssText = `
                position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
                background:linear-gradient(135deg,#ffd000,#ff8800); color:#1a0f00;
                padding:9px 20px; border-radius:20px; font-weight:900; font-size:13px;
                z-index:1000001; box-shadow:0 8px 25px rgba(0,0,0,0.6); transition:opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._t);
        toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2400);
    }

    function applyLanguageToPage() {
        const pack = TRANSLATIONS[state.lang] || TRANSLATIONS.sorani;
        document.documentElement.dir = pack.dir;
        document.documentElement.lang = pack.langCode;

        // نوێکردنەوەی ناوی دوگمەکانی شریتی خوارەوە
        const navLabels = [
            { keys: ['سەرەکی', 'Home'], val: pack.navHome },
            { keys: ['یارییەکان', 'یاری', 'Games'], val: pack.navGames },
            { keys: ['ڕیزبەندی', 'ڕێزبەندی', 'Ranking'], val: pack.navRank },
            { keys: ['هاوڕێکان', 'هەڤاڵ', 'Friends'], val: pack.navFriends },
            { keys: ['ڕێکخستن', 'Settings'], val: pack.navSettings }
        ];

        document.querySelectorAll('nav span, .bottom-nav span, .nav-item span, footer span, div').forEach(el => {
            if (el.children.length === 0) {
                const txt = el.textContent.trim();
                for (const item of navLabels) {
                    if (item.keys.includes(txt)) {
                        el.textContent = item.val;
                    }
                }
            }
        });
    }

    function setLanguage(newLang) {
        if (!TRANSLATIONS[newLang]) return;
        state.lang = newLang;
        localStorage.setItem('yk_lang', newLang);
        applyLanguageToPage();
        renderModalContent();
        showToast(t('savedToast'));
    }

    function toggleLocalSetting(key, storageKey) {
        state[key] = !state[key];
        localStorage.setItem(storageKey, String(state[key]));
        if (key === 'vibrate' && state.vibrate && navigator.vibrate) {
            navigator.vibrate(60);
        }
        renderModalContent();
        showToast(t('savedToast'));
    }

    function togglePrivacySetting(key) {
        state[key] = !state[key];
        renderModalContent();
        showToast(t('savedToast'));

        const uid = localStorage.getItem('yk_player_uid');
        if (uid && window.firebase && firebase.apps && firebase.apps.length) {
            firebase.database().ref(`players/${uid}/privacy`).update({
                allowFriends: state.allowFriends,
                allowInvites: state.allowInvites,
                stealthMode: state.stealthMode
            }).catch(() => {});
        }
    }

    function playTestBeep() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.26);
        } catch (e) {}
        if (state.vibrate && navigator.vibrate) navigator.vibrate([50, 40, 50]);
        showToast('🔊 ' + t('testSoundBtn'));
    }

    async function handleVerifyEmail() {
        if (!window.firebase || !firebase.auth().currentUser) return;
        try {
            await firebase.auth().currentUser.sendEmailVerification();
            alert(state.lang === 'english'
                ? 'Verification link sent to your email!'
                : 'لینکی پشتڕاستکردنەوە نێردرا بۆ ئیمەیڵەکەت! تکایە سەیری Inbox یان Spam بکە.');
        } catch (err) {
            alert(err.message);
        }
    }

    async function handlePasswordReset() {
        if (!window.firebase || !firebase.auth().currentUser) return;
        const user = firebase.auth().currentUser;
        if (!user.email) {
            alert(state.lang === 'english'
                ? 'No email attached to this account.'
                : 'ئەم هەژمارە ئیمەیڵی لەسەر نییە.');
            return;
        }
        try {
            await firebase.auth().sendPasswordResetEmail(user.email);
            alert(state.lang === 'english'
                ? `Password reset link sent to ${user.email}`
                : `لینکی گۆڕینی وشەی نهێنی نێردرا بۆ: ${user.email}`);
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleLogout() {
        if (!confirm(t('logoutConfirm'))) return;
        try {
            const uid = localStorage.getItem('yk_player_uid');
            if (uid && window.firebase && firebase.apps && firebase.apps.length) {
                await firebase.database().ref(`onlinePlayers/${uid}`).remove().catch(() => {});
            }
            if (window.firebase && firebase.auth) {
                await firebase.auth().signOut();
            }
        } catch (e) {}
        localStorage.removeItem('yk_player_uid');
        close();
        window.location.reload();
    }

    async function sendSupportTicket() {
        const inp = document.getElementById('ykSupportInput');
        if (!inp || !inp.value.trim()) return;
        const msg = inp.value.trim();
        const uid = localStorage.getItem('yk_player_uid') || 'guest';
        const name = localStorage.getItem('yk_player_name') || 'یاریزان';

        if (window.firebase && firebase.apps && firebase.apps.length) {
            await firebase.database().ref('supportTickets').push({
                uid,
                name,
                message: msg,
                lang: state.lang,
                ts: Date.now()
            }).catch(() => {});
        }
        inp.value = '';
        showToast(t('savedToast'));
    }

    function injectStyles() {
        if (document.getElementById('ykSettingsStyles')) return;
        const style = document.createElement('style');
        style.id = 'ykSettingsStyles';
        style.textContent = `
            #ykSettingsOverlay {
                position: fixed; inset: 0; background: rgba(4, 2, 14, 0.88);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                z-index: 999990; display: none; align-items: center; justify-content: center;
                padding: 14px; font-family: 'Vazirmatn', sans-serif; color: #fff;
            }
            #ykSettingsOverlay.open { display: flex; }
            .yk-set-card {
                width: 100%; max-width: 440px; max-height: 88dvh;
                background: linear-gradient(180deg, #1a0d40 0%, #0b0520 100%);
                border: 2px solid #ffb800; border-radius: 26px;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.92), 0 0 30px rgba(255, 184, 0, 0.25);
            }
            .yk-set-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 15px 18px; background: rgba(255, 184, 0, 0.1);
                border-bottom: 1px solid rgba(255, 184, 0, 0.28);
            }
            .yk-set-title { font-size: 16.5px; font-weight: 900; color: #ffd000; }
            .yk-set-close {
                width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
                background: rgba(255,255,255,0.08); color: #fff; font-size: 15px; cursor: pointer;
            }
            .yk-set-tabs {
                display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;
                padding: 10px 12px; background: rgba(0, 0, 0, 0.35);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .yk-set-tab {
                padding: 8px 4px; border-radius: 12px; border: 1px solid transparent;
                background: rgba(255, 255, 255, 0.05); color: #cbd5e1;
                font-size: 11px; font-weight: 800; cursor: pointer; text-align: center;
                transition: all 0.2s;
            }
            .yk-set-tab.active {
                background: linear-gradient(135deg, #ffd000, #ff8800);
                color: #1a0f00; font-weight: 900;
            }
            .yk-set-body {
                padding: 16px; overflow-y: auto; flex: 1;
                display: flex; flex-direction: column; gap: 12px;
            }
            .yk-set-box {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(168, 85, 247, 0.35);
                border-radius: 18px; padding: 14px;
            }
            .yk-set-box-title {
                font-size: 13.5px; font-weight: 900; color: #fde047; margin-bottom: 8px;
            }
            .yk-lang-grid {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;
            }
            .yk-lang-btn {
                padding: 10px 6px; border-radius: 14px;
                border: 1.5px solid rgba(255,255,255,0.16);
                background: rgba(12, 6, 32, 0.8); color: #fff;
                font-size: 12px; font-weight: 800; cursor: pointer; text-align: center;
            }
            .yk-lang-btn.active {
                border-color: #ffd000; background: rgba(255, 184, 0, 0.22); color: #ffd000;
            }
            .yk-switch-row {
                display: flex; align-items: center; justify-content: space-between;
                padding: 9px 0; border-bottom: 1px dashed rgba(255,255,255,0.1);
                font-size: 12.5px; font-weight: 700;
            }
            .yk-switch-row:last-child { border-bottom: none; }
            .yk-toggle {
                width: 46px; height: 25px; border-radius: 20px;
                background: #334155; position: relative; cursor: pointer;
                transition: background 0.25s; flex-shrink: 0;
            }
            .yk-toggle.on { background: #10b981; }
            .yk-toggle::after {
                content: ''; position: absolute; top: 3px; left: 3px;
                width: 19px; height: 19px; border-radius: 50%; background: #fff;
                transition: transform 0.25s;
            }
            .yk-toggle.on::after { transform: translateX(21px); }
            .yk-action-btn {
                width: 100%; padding: 11px; border-radius: 14px; border: none;
                font-size: 13px; font-weight: 900; cursor: pointer; margin-top: 8px;
            }
            .yk-btn-gold { background: linear-gradient(135deg, #ffd000, #ff8800); color: #1a0f00; }
            .yk-btn-purple { background: rgba(168, 85, 247, 0.25); border: 1.5px solid #a855f7; color: #fff; }
            .yk-btn-danger { background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; }
        `;
        document.head.appendChild(style);
    }

    function renderModalContent() {
        const overlay = document.getElementById('ykSettingsOverlay');
        if (!overlay) return;
        overlay.dir = t('dir');

        const user = (window.firebase && firebase.apps && firebase.apps.length) ? firebase.auth().currentUser : null;
        const uid = (user && user.uid) || localStorage.getItem('yk_player_uid') || '---';
        const shortId = uid.replace(/[^0-9]/g, '').substring(0, 10) || uid.substring(0, 10);
        const isGuest = !user || user.isAnonymous;
        const email = (user && user.email) ? user.email : '---';
        const isVerified = user && user.emailVerified;

        let bodyHtml = '';

        if (state.activeTab === 'account') {
            bodyHtml = `
                <div class="yk-set-box">
                    <div class="yk-set-box-title">${t('accInfoTitle')}</div>
                    <div style="background:rgba(0,0,0,0.4); padding:10px 12px; border-radius:12px; font-size:12px; line-height:1.9;">
                        <div style="color:${isGuest ? '#fbbf24' : '#4ade80'}; font-weight:900;">
                            ${isGuest ? t('accStatusGuest') : t('accStatusSecure')}
                        </div>
                        <div><b>${t('idLabel')}</b> <span style="color:#ffd000;">${shortId}</span></div>
                        <div><b>${t('emailLabel')}</b> <span style="color:#e9d5ff;">${email}</span></div>
                        ${!isGuest && user.email ? `
                            <div><b>Email Status:</b> <span style="color:${isVerified ? '#4ade80' : '#fb7185'};">${isVerified ? t('verifiedYes') : t('verifiedNo')}</span></div>
                        ` : ''}
                    </div>

                    ${isGuest ? `
                        <button class="yk-action-btn yk-btn-gold" onclick="YariSettings.close(); if(window.YariAuth) YariAuth.openAuthModal();">
                            ${t('linkAccBtn')}
                        </button>
                    ` : `
                        ${(!isVerified && user.email) ? `
                            <button class="yk-action-btn yk-btn-purple" onclick="YariSettings.verifyEmail()">
                                ${t('verifyEmailBtn')}
                            </button>
                        ` : ''}
                        <button class="yk-action-btn yk-btn-purple" onclick="YariSettings.resetPassword()">
                            ${t('changePassBtn')}
                        </button>
                    `}
                </div>

                <div class="yk-set-box" style="border-color:rgba(239,68,68,0.45);">
                    <button class="yk-action-btn yk-btn-danger" style="margin-top:0;" onclick="YariSettings.logout()">
                        ${t('logoutBtn')}
                    </button>
                </div>
            `;
        } else if (state.activeTab === 'general') {
            bodyHtml = `
                <div class="yk-set-box">
                    <div class="yk-set-box-title">${t('langSectionTitle')}</div>
                    <div style="font-size:11.5px; color:#cbd5e1;">${t('langDesc')}</div>
                    <div class="yk-lang-grid">
                        <button class="yk-lang-btn ${state.lang === 'sorani' ? 'active' : ''}" onclick="YariSettings.setLang('sorani')">
                            کوردی<br><span style="font-size:10px; opacity:0.85;">(سۆرانی)</span>
                        </button>
                        <button class="yk-lang-btn ${state.lang === 'badini' ? 'active' : ''}" onclick="YariSettings.setLang('badini')">
                            کوردی<br><span style="font-size:10px; opacity:0.85;">(بادینی)</span>
                        </button>
                        <button class="yk-lang-btn ${state.lang === 'english' ? 'active' : ''}" onclick="YariSettings.setLang('english')">
                            English<br><span style="font-size:10px; opacity:0.85;">(Global)</span>
                        </button>
                    </div>
                </div>

                <div class="yk-set-box">
                    <div class="yk-set-box-title">${t('audioSectionTitle')}</div>
                    <div class="yk-switch-row">
                        <span>${t('sfxLabel')}</span>
                        <div class="yk-toggle ${state.sfx ? 'on' : ''}" onclick="YariSettings.toggleLocal('sfx','yk_sfx_enabled')"></div>
                    </div>
                    <div class="yk-switch-row">
                        <span>${t('bgmLabel')}</span>
                        <div class="yk-toggle ${state.bgm ? 'on' : ''}" onclick="YariSettings.toggleLocal('bgm','yk_bgm_enabled')"></div>
                    </div>
                    <div class="yk-switch-row">
                        <span>${t('vibrateLabel')}</span>
                        <div class="yk-toggle ${state.vibrate ? 'on' : ''}" onclick="YariSettings.toggleLocal('vibrate','yk_vibrate_enabled')"></div>
                    </div>
                    <button class="yk-action-btn yk-btn-purple" onclick="YariSettings.testSound()">
                        ${t('testSoundBtn')}
                    </button>
                </div>
            `;
        } else if (state.activeTab === 'privacy') {
            bodyHtml = `
                <div class="yk-set-box">
                    <div class="yk-set-box-title">${t('privacyTitle')}</div>
                    <div class="yk-switch-row">
                        <span>${t('allowFriendsLabel')}</span>
                        <div class="yk-toggle ${state.allowFriends ? 'on' : ''}" onclick="YariSettings.togglePrivacy('allowFriends')"></div>
                    </div>
                    <div class="yk-switch-row">
                        <span>${t('allowInvitesLabel')}</span>
                        <div class="yk-toggle ${state.allowInvites ? 'on' : ''}" onclick="YariSettings.togglePrivacy('allowInvites')"></div>
                    </div>
                    <div class="yk-switch-row">
                        <span>${t('stealthModeLabel')}</span>
                        <div class="yk-toggle ${state.stealthMode ? 'on' : ''}" onclick="YariSettings.togglePrivacy('stealthMode')"></div>
                    </div>
                </div>

                <div class="yk-set-box">
                    <div class="yk-set-box-title">${t('blockedTitle')}</div>
                    <div style="font-size:12px; color:#94a3b8; text-align:center; padding:8px 0;">
                        ${t('noBlockedText')}
                    </div>
                </div>
            `;
        } else if (state.activeTab === 'support') {
            bodyHtml = `
                <div class="yk-set-box">
                    <div class="yk-set-box-title">${t('toolsTitle')}</div>
                    <textarea id="ykSupportInput" rows="3" placeholder="${t('supportPlaceholder')}" style="width:100%; background:rgba(0,0,0,0.45); border:1px solid rgba(255,255,255,0.2); border-radius:12px; padding:10px; color:#fff; font-size:12px; outline:none; resize:none;"></textarea>
                    <button class="yk-action-btn yk-btn-gold" onclick="YariSettings.sendSupport()">
                        ${t('sendSupportBtn')}
                    </button>
                    <button class="yk-action-btn yk-btn-purple" onclick="window.location.reload(true)">
                        ${t('clearCacheBtn')}
                    </button>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div class="yk-set-card" onclick="event.stopPropagation()">
                <div class="yk-set-header">
                    <div class="yk-set-title">${t('settingsTitle')}</div>
                    <button class="yk-set-close" onclick="YariSettings.close()">✕</button>
                </div>
                <div class="yk-set-tabs">
                    <button class="yk-set-tab ${state.activeTab === 'account' ? 'active' : ''}" onclick="YariSettings.setTab('account')">${t('tabAccount')}</button>
                    <button class="yk-set-tab ${state.activeTab === 'general' ? 'active' : ''}" onclick="YariSettings.setTab('general')">${t('tabGeneral')}</button>
                    <button class="yk-set-tab ${state.activeTab === 'privacy' ? 'active' : ''}" onclick="YariSettings.setTab('privacy')">${t('tabPrivacy')}</button>
                    <button class="yk-set-tab ${state.activeTab === 'support' ? 'active' : ''}" onclick="YariSettings.setTab('support')">${t('tabSupport')}</button>
                </div>
                <div class="yk-set-body">${bodyHtml}</div>
            </div>
        `;
    }

    function open(defaultTab) {
        if (defaultTab) state.activeTab = defaultTab;
        injectStyles();
        let overlay = document.getElementById('ykSettingsOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ykSettingsOverlay';
            overlay.onclick = close;
            document.body.appendChild(overlay);
        }
        renderModalContent();
        overlay.classList.add('open');
    }

    function close() {
        const overlay = document.getElementById('ykSettingsOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    function setTab(tab) {
        state.activeTab = tab;
        renderModalContent();
    }

    // بەستنەوەی خۆکار بە دوگمەی ڕێکخستنی شریتی خوارەوەی شاشەکە
    function autoBindBottomSettingsButton() {
        const candidates = document.querySelectorAll('button, a, div');
        candidates.forEach(el => {
            const txt = (el.textContent || '').trim();
            const hasGear = el.querySelector('.fa-gear, .fa-cog');
            if ((txt === 'ڕێکخستن' || txt === 'Settings' || hasGear) && el.offsetHeight > 0 && el.offsetHeight < 90 && el.offsetWidth < 120) {
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    open();
                });
            }
        });
    }

    window.YariSettings = {
        open,
        close,
        setTab,
        setLang: setLanguage,
        toggleLocal: toggleLocalSetting,
        togglePrivacy: togglePrivacySetting,
        testSound: playTestBeep,
        verifyEmail: handleVerifyEmail,
        resetPassword: handlePasswordReset,
        logout: handleLogout,
        sendSupport: sendSupportTicket,
        getLang: () => state.lang,
        isSfxOn: () => state.sfx,
        isVibrateOn: () => state.vibrate
    };

    window.addEventListener('DOMContentLoaded', () => {
        applyLanguageToPage();
        autoBindBottomSettingsButton();
    });
})();