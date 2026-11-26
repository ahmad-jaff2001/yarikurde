// =============================================================================
// YARI KURDI - ULTRA-CRISP AAA SETTINGS, SECURITY & MULTI-LANGUAGE ENGINE
// =============================================================================

(function () {
    const TRANSLATIONS = {
        sorani: {
            dir: 'rtl',
            settingsTitle: 'ڕێکخستنەکان',
            settingsSub: 'کۆنترۆڵی هەژمار، زمان و تایبەتمەندییەکان',
            secLang: 'زمان (LANGUAGE)',
            secAccount: 'هەژمار و پاراستن (SECURITY)',
            secAudio: 'دەنگ و جووڵە (AUDIO)',
            secPrivacy: 'تایبەتمەندی (PRIVACY)',
            secSupport: 'پشتگیری و سیستەم',
            sfxLabel: 'دەنگی کاریگەرییەکانی یاری',
            sfxSub: 'دەنگی جووڵەی پارچەکان و بردنەوە',
            bgmLabel: 'میوزیکی باکگراوند',
            bgmSub: 'ئاوازی ناو ژوور و یارییەکان',
            vibrateLabel: 'لەرزینی مۆبایل (Haptics)',
            vibrateSub: 'لەرزین لە کاتی نۆرە و کلیککردن',
            testSoundBtn: 'تاقیکردنەوەی دەنگ و لەرزین',
            accStatusSecure: 'هەژمارەکەت پارێزراوە',
            accStatusGuest: 'هەژماری میوان (پێویستە بیبەستیتەوە)',
            emailLabel: 'ئیمەیڵ',
            idLabel: 'ئایدی (ID)',
            copyDone: 'کۆپی کرا ✅',
            verifiedYes: 'پشتڕاستکراوە',
            verifiedNo: 'پشتڕاستنەکراوە',
            verifyEmailBtn: 'ناردنی لینکی پشتڕاستکردنەوەی ئیمەیڵ',
            changePassBtn: 'گۆڕینی وشەی نهێنی (Password)',
            linkAccBtn: 'بەستنەوەی هەژمار بە Google یان Email',
            logoutBtn: 'دەرچوون لە هەژمار (Log Out)',
            logoutConfirm: 'دڵنیایت دەتەوێت لە هەژمارەکەت دەربچیت؟',
            allowFriendsLabel: 'وەرگرتنی داواکاری هاوڕێیەتی',
            allowFriendsSub: 'ڕێگەدان بە یاریزانان داواکاریت بۆ بنێرن',
            allowInvitesLabel: 'وەرگرتنی بانگهێشتنامە',
            allowInvitesSub: 'بانگهێشتکردن بۆ یاری و ژوورە دەنگییەکان',
            stealthModeLabel: 'دۆخی شاراوە (Stealth)',
            stealthModeSub: 'شاردنەوەی ئۆنڵاینبوونت لە هاوڕێکانت',
            clearCacheBtn: 'خاوێنکردنەوەی کاش و خێراکردن',
            supportPlaceholder: 'کێشە یان پێشنیارەکەت بنووسە بۆ تیمی یاری کوردی...',
            sendSupportBtn: 'ناردن بۆ پشتگیری',
            savedToast: 'گۆڕانکارییەکە پاشەکەوت کرا ✅',
            // وەرگێڕانی ماڵپەڕی سەرەکی
            siteTitle: 'یاری کوردی',
            voiceTitle: 'ژووری گفتوگۆ',
            voiceSub: 'قسە بکە و هاوڕێی نوێ بناسە',
            joinNow: 'ئێستا بەشداربە',
            chessTitle: 'شەترەنج',
            chessSub: 'ستراتیژی و زیرەکی',
            dominoTitle: 'دۆمینە',
            dominoSub: 'یارییە کلاسیکییەکە',
            ludoTitle: 'لۆدۆ',
            ludoSub: 'پێکەوە یاری بکەن',
            okeyTitle: 'ئۆکەی',
            okeySub: 'کۆنکانی تەختە و پوول',
            flappyTitle: 'هەڵۆ',
            flappySub: 'بەرز بفڕە و خاڵ کۆبکەرەوە',
            navHome: 'سەرەکی',
            navGames: 'یارییەکان',
            navRank: 'ڕیزبەندی',
            navFriends: 'هاوڕێکان',
            navSettings: 'ڕێکخستن'
        },
        badini: {
            dir: 'rtl',
            settingsTitle: 'ڕێکخستن',
            settingsSub: 'کۆنترۆڵا هەژماری، زمان و تایبەتمەندیان',
            secLang: 'زمان (LANGUAGE)',
            secAccount: 'هەژمار و پاراستن (SECURITY)',
            secAudio: 'دەنگ و لڤین (AUDIO)',
            secPrivacy: 'تایبەتمەندی (PRIVACY)',
            secSupport: 'پشتەڤانی و سیستەم',
            sfxLabel: 'دەنگێ کارتێکرنێن یاریێ',
            sfxSub: 'دەنگێ لڤینا پارچان و برنێ',
            bgmLabel: 'مۆزیکا پاشبنەمای',
            bgmSub: 'ئاوازێ ناڤ ژوور و یاریان',
            vibrateLabel: 'لەرزینا مۆبایلێ (Haptics)',
            vibrateSub: 'لەرزین د دەمێ نۆرە و کلیککرنێ دا',
            testSoundBtn: 'تاقیکرنا دەنگ و لەرزینێ',
            accStatusSecure: 'هەژمارێ تە پاراستییە',
            accStatusGuest: 'هەژمارێ مێهڤان (پێدڤییە گرێبدەی)',
            emailLabel: 'ئیمەیڵ',
            idLabel: 'ئایدی (ID)',
            copyDone: 'هاتە کۆپیکرن ✅',
            verifiedYes: 'پشتڕاستکرییە',
            verifiedNo: 'نەهاتییە پشتڕاستکرن',
            verifyEmailBtn: 'هنارتنا لینکێ پشتڕاستکرنا ئیمەیڵی',
            changePassBtn: 'گوهۆڕینا پەیڤا نهێنی (Password)',
            linkAccBtn: 'گرێدانا هەژماری ب Google یان Email',
            logoutBtn: 'دەرکەفتن ژ هەژماری (Log Out)',
            logoutConfirm: 'تۆ پشتڕاستی دڤێت ژ هەژمارێ خۆ دەربکەڤی؟',
            allowFriendsLabel: 'وەرگرتنا داخوازێن هەڤالینیێ',
            allowFriendsSub: 'ڕێگەدان ب یاریزانان داخوازیێ بۆ تە بهنێرن',
            allowInvitesLabel: 'وەرگرتنا داخوازنامان',
            allowInvitesSub: 'داخوازکرن بۆ یاری و ژوورێن دەنگی',
            stealthModeLabel: 'ڕەوشا ڤەشارتی (Stealth)',
            stealthModeSub: 'ڤەشارتنا ئۆنڵاینبوونا تە ژ هەڤالێن تە',
            clearCacheBtn: 'پاقژکرنا کاشی و بلەزکرن',
            supportPlaceholder: 'ئاریشە یان پێشنیارا خۆ بنڤیسە بۆ تیمێ یاری کوردی...',
            sendSupportBtn: 'هنارتن بۆ پشتەڤانیێ',
            savedToast: 'گوهۆڕین هاتە پاراستن ✅',
            siteTitle: 'یاری کوردی',
            voiceTitle: 'ژوورێن دەنگی',
            voiceSub: 'بئاخڤە و هەڤالێن نوو بناسە',
            joinNow: 'نها پشکداربە',
            chessTitle: 'شەترەنج',
            chessSub: 'ستراتیژی و زیرەکی',
            dominoTitle: 'دۆمینە',
            dominoSub: 'یارییا کلاسیکی',
            ludoTitle: 'لۆدۆ',
            ludoSub: 'پێکڤە یاری بکەن',
            okeyTitle: 'ئۆکەی',
            okeySub: 'کۆنکانێ تەختە و پوولان',
            flappyTitle: 'هەڵۆ',
            flappySub: 'بلند بفڕە و خالان کۆمبکە',
            navHome: 'سەرەکی',
            navGames: 'یاری',
            navRank: 'ڕێزبەندی',
            navFriends: 'هەڤاڵ',
            navSettings: 'ڕێکخستن'
        },
        english: {
            dir: 'ltr',
            settingsTitle: 'Settings',
            settingsSub: 'Account security, language & preferences',
            secLang: 'LANGUAGE',
            secAccount: 'ACCOUNT & SECURITY',
            secAudio: 'AUDIO & HAPTICS',
            secPrivacy: 'PRIVACY & SAFETY',
            secSupport: 'SUPPORT & SYSTEM',
            sfxLabel: 'Game Sound Effects',
            sfxSub: 'Board moves, dice & victory sounds',
            bgmLabel: 'Background Music',
            bgmSub: 'Ambient music in lobby & rooms',
            vibrateLabel: 'Vibration / Haptics',
            vibrateSub: 'Tactile feedback on turns and taps',
            testSoundBtn: 'Test Audio & Vibration',
            accStatusSecure: 'Protected Official Account',
            accStatusGuest: 'Guest Account (Link to protect data)',
            emailLabel: 'Email',
            idLabel: 'Player ID',
            copyDone: 'Copied ✅',
            verifiedYes: 'Verified',
            verifiedNo: 'Unverified',
            verifyEmailBtn: 'Send Verification Email',
            changePassBtn: 'Reset / Change Password',
            linkAccBtn: 'Link Account (Google / Email)',
            logoutBtn: 'Log Out of Account',
            logoutConfirm: 'Are you sure you want to log out?',
            allowFriendsLabel: 'Friend Requests',
            allowFriendsSub: 'Allow other players to add you',
            allowInvitesLabel: 'Game & Room Invites',
            allowInvitesSub: 'Receive live match & voice invites',
            stealthModeLabel: 'Stealth Mode',
            stealthModeSub: 'Hide your online status from friends',
            clearCacheBtn: 'Clear Cache & Refresh App',
            supportPlaceholder: 'Write your issue or feedback for the Yari Kurdi team...',
            sendSupportBtn: 'Send Message',
            savedToast: 'Settings saved ✅',
            siteTitle: 'Yari Kurdi',
            voiceTitle: 'Voice Rooms',
            voiceSub: 'Talk live & meet new friends',
            joinNow: 'Join Now',
            chessTitle: 'Chess',
            chessSub: 'Strategy & intellect',
            dominoTitle: 'Dominoes',
            dominoSub: 'Classic board game',
            ludoTitle: 'Ludo',
            ludoSub: 'Play together live',
            okeyTitle: 'Okey',
            okeySub: 'Classic tile rummy',
            flappyTitle: 'Eagle',
            flappySub: 'Fly high & score points',
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
        stealthMode: false
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
                position:fixed; bottom:92px; left:50%; transform:translateX(-50%);
                background:#ffd000; color:#120900; padding:10px 22px; border-radius:14px;
                font-weight:900; font-size:13px; z-index:1000005;
                box-shadow:0 10px 28px rgba(0,0,0,0.75); transition:opacity 0.25s;
            `;
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._t);
        toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
    }

    // وەرگێڕانی نووسینەکانی ناو شاشە بێ تێکدانی دیزاین و وێنەکان
    function applyLanguageToPage() {
        const pack = TRANSLATIONS[state.lang] || TRANSLATIONS.sorani;
        // ئاڕاستەی لاپەڕەی سەرەکی وەک خۆی دەهێڵینەوە تا کارەکتەرەکان تێکنەچن
        document.documentElement.dir = 'rtl';

        const textDictionary = [
            { key: 'voiceTitle', variants: ['ژووری گفتوگۆ', 'ژوورێن دەنگی', 'Voice Rooms'] },
            { key: 'voiceSub', variants: ['قسە بکە و هاوڕێی نوێ بناسە', 'بئاخڤە و هەڤالێن نوو بناسە', 'Talk live & meet new friends'] },
            { key: 'joinNow', variants: ['ئێستا بەشداربە', 'نها پشکداربە', 'Join Now'] },
            { key: 'chessTitle', variants: ['شەترەنج', 'Chess'] },
            { key: 'chessSub', variants: ['ستراتیژی و زیرەکی', 'Strategy & intellect'] },
            { key: 'dominoTitle', variants: ['دۆمینە', 'Dominoes'] },
            { key: 'dominoSub', variants: ['یارییە کلاسیکییەکە', 'یارییا کلاسیکی', 'Classic board game'] },
            { key: 'ludoTitle', variants: ['لۆدۆ', 'Ludo'] },
            { key: 'ludoSub', variants: ['پێکەوە یاری بکەن', 'پێکڤە یاری بکەن', 'Play together live'] },
            { key: 'okeyTitle', variants: ['ئۆکەی', 'Okey'] },
            { key: 'okeySub', variants: ['کۆنکانی تەختە و پوول', 'کۆنکانێ تەختە و پوولان', 'Classic tile rummy'] },
            { key: 'flappyTitle', variants: ['هەڵۆ', 'Eagle'] },
            { key: 'flappySub', variants: ['بەرز بفڕە و خاڵ کۆبکەرەوە', 'بلند بفڕە و خالان کۆمبکە', 'Fly high & score points'] },
            { key: 'navHome', variants: ['سەرەکی', 'Home'] },
            { key: 'navGames', variants: ['یارییەکان', 'یاری', 'Games'] },
            { key: 'navRank', variants: ['ڕیزبەندی', 'ڕێزبەندی', 'Ranking'] },
            { key: 'navFriends', variants: ['هاوڕێکان', 'هەڤاڵ', 'Friends'] },
            { key: 'navSettings', variants: ['ڕێکخستن', 'Settings'] }
        ];

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            if (node.parentElement && node.parentElement.closest('#ykSettingsOverlay')) continue;
            const raw = node.nodeValue.trim();
            if (!raw) continue;
            for (const item of textDictionary) {
                if (item.variants.includes(raw)) {
                    node.nodeValue = node.nodeValue.replace(raw, pack[item.key]);
                    break;
                }
            }
        }
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
        if (key === 'vibrate' && state.vibrate && navigator.vibrate) navigator.vibrate(50);
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

    function copyPlayerId(idText) {
        navigator.clipboard?.writeText(idText);
        showToast(t('copyDone'));
    }

    function playTestBeep() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.16);
            gain.gain.setValueAtTime(0.28, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.24);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
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
                : 'لینکی پشتڕاستکردنەوە نێردرا بۆ ئیمەیڵەکەت! سەیری Inbox یان Spam بکە.');
        } catch (err) {
            alert(err.message);
        }
    }

    async function handlePasswordReset() {
        if (!window.firebase || !firebase.auth().currentUser) return;
        const user = firebase.auth().currentUser;
        if (!user.email) return;
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
        const uid = localStorage.getItem('yk_player_uid') || 'guest';
        const name = localStorage.getItem('yk_player_name') || 'یاریزان';

        if (window.firebase && firebase.apps && firebase.apps.length) {
            await firebase.database().ref('supportTickets').push({
                uid, name, message: inp.value.trim(), lang: state.lang, ts: Date.now()
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
                position: fixed; inset: 0;
                background: rgba(3, 2, 10, 0.86);
                z-index: 999990; display: none; align-items: flex-end; justify-content: center;
                font-family: 'Vazirmatn', sans-serif; color: #ffffff;
                -webkit-font-smoothing: antialiased;
            }
            @media (min-width: 520px) {
                #ykSettingsOverlay { align-items: center; padding: 16px; }
            }
            #ykSettingsOverlay.open { display: flex; }

            .yk-set-sheet {
                width: 100%; max-width: 460px; max-height: 90dvh;
                background: #0d091f;
                border-top: 2px solid #ffb800;
                border-radius: 28px 28px 0 0;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 -15px 50px rgba(0, 0, 0, 0.95);
                animation: ykSheetUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @media (min-width: 520px) {
                .yk-set-sheet { border: 2px solid #ffb800; border-radius: 26px; }
            }
            @keyframes ykSheetUp {
                from { transform: translateY(40px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .yk-set-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 18px 20px 14px;
                background: linear-gradient(180deg, #191238 0%, #0d091f 100%);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                flex-shrink: 0;
            }
            .yk-set-title { font-size: 19px; font-weight: 900; color: #ffffff; letter-spacing: -0.2px; }
            .yk-set-subtitle { font-size: 11.5px; color: #94a3b8; margin-top: 2px; font-weight: 600; }
            .yk-set-close {
                width: 36px; height: 36px; border-radius: 50%;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: #1c153d; color: #ffffff;
                font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;
            }

            .yk-set-body {
                padding: 14px 18px 28px; overflow-y: auto; flex: 1;
                display: flex; flex-direction: column; gap: 18px;
                -webkit-overflow-scrolling: touch;
            }
            .yk-set-body::-webkit-scrollbar { width: 4px; }
            .yk-set-body::-webkit-scrollbar-thumb { background: rgba(255, 184, 0, 0.4); border-radius: 8px; }

            .yk-sec-label {
                font-size: 11px; font-weight: 900; color: #fbbf24;
                letter-spacing: 0.6px; margin-bottom: 8px; padding: 0 4px;
            }

            .yk-group-card {
                background: #151030;
                border: 1px solid rgba(255, 255, 255, 0.09);
                border-radius: 20px; overflow: hidden;
            }

            .yk-lang-seg {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px;
            }
            .yk-lang-pill {
                padding: 12px 6px; border-radius: 14px;
                border: 1.5px solid rgba(255, 255, 255, 0.1);
                background: #0d091f; color: #cbd5e1;
                font-size: 13px; font-weight: 800; cursor: pointer; text-align: center;
                transition: all 0.2s;
            }
            .yk-lang-pill.active {
                background: linear-gradient(135deg, #ffd000 0%, #ff8c00 100%);
                border-color: #ffe680; color: #140a00; font-weight: 900;
                box-shadow: 0 4px 16px rgba(255, 184, 0, 0.35);
            }

            .yk-row {
                display: flex; align-items: center; justify-content: space-between; gap: 12px;
                padding: 13px 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            .yk-row:last-child { border-bottom: none; }
            .yk-row-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
            .yk-ico-badge {
                width: 36px; height: 36px; border-radius: 11px;
                display: flex; align-items: center; justify-content: center;
                font-size: 15px; color: #fff; flex-shrink: 0;
            }
            .yk-row-title { font-size: 13.5px; font-weight: 800; color: #f8fafc; }
            .yk-row-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

            .yk-switch {
                width: 48px; height: 26px; border-radius: 20px;
                background: #2b234d; position: relative; cursor: pointer;
                transition: background 0.25s; flex-shrink: 0;
            }
            .yk-switch.on { background: #10b981; }
            .yk-switch::after {
                content: ''; position: absolute; top: 3px; left: 3px;
                width: 20px; height: 20px; border-radius: 50%; background: #ffffff;
                box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .yk-switch.on::after { transform: translateX(22px); }

            .yk-btn-row {
                width: 100%; padding: 13px 15px; background: transparent; border: none;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
                color: #ffd000; font-size: 13px; font-weight: 900;
                display: flex; align-items: center; justify-content: space-between;
                cursor: pointer; text-align: inherit;
            }
            .yk-btn-row:active { background: rgba(255, 255, 255, 0.04); }

            .yk-logout-btn {
                width: 100%; padding: 14px; border-radius: 18px;
                background: rgba(239, 68, 68, 0.14);
                border: 1.5px solid rgba(239, 68, 68, 0.55);
                color: #fca5a5; font-size: 14px; font-weight: 900;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .yk-logout-btn:active { background: rgba(239, 68, 68, 0.25); }
        `;
        document.head.appendChild(style);
    }

    function renderModalContent() {
        const overlay = document.getElementById('ykSettingsOverlay');
        if (!overlay) return;
        const prevScroll = overlay.querySelector('.yk-set-body')?.scrollTop || 0;
        const sheetDir = t('dir');

        const user = (window.firebase && firebase.apps && firebase.apps.length) ? firebase.auth().currentUser : null;
        const uid = (user && user.uid) || localStorage.getItem('yk_player_uid') || '---';
        const shortId = uid.replace(/[^0-9]/g, '').substring(0, 10) || uid.substring(0, 10);
        const isGuest = !user || user.isAnonymous;
        const email = (user && user.email) ? user.email : '---';
        const isVerified = user && user.emailVerified;

        overlay.innerHTML = `
            <div class="yk-set-sheet" dir="${sheetDir}" onclick="event.stopPropagation()">
                <div class="yk-set-header">
                    <div>
                        <div class="yk-set-title">${t('settingsTitle')}</div>
                        <div class="yk-set-subtitle">${t('settingsSub')}</div>
                    </div>
                    <button class="yk-set-close" onclick="YariSettings.close()"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="yk-set-body">
                    <!-- ١. بەشی زمان -->
                    <div>
                        <div class="yk-sec-label">${t('secLang')}</div>
                        <div class="yk-group-card">
                            <div class="yk-lang-seg">
                                <button class="yk-lang-pill ${state.lang === 'sorani' ? 'active' : ''}" onclick="YariSettings.setLang('sorani')">
                                    کوردی<br><span style="font-size:10.5px; opacity:0.85;">سۆرانی</span>
                                </button>
                                <button class="yk-lang-pill ${state.lang === 'badini' ? 'active' : ''}" onclick="YariSettings.setLang('badini')">
                                    کوردی<br><span style="font-size:10.5px; opacity:0.85;">بادینی</span>
                                </button>
                                <button class="yk-lang-pill ${state.lang === 'english' ? 'active' : ''}" onclick="YariSettings.setLang('english')">
                                    English<br><span style="font-size:10.5px; opacity:0.85;">Global</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ٢. بەشی هەژمار و پاراستن -->
                    <div>
                        <div class="yk-sec-label">${t('secAccount')}</div>
                        <div class="yk-group-card">
                            <div class="yk-row">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:${isGuest ? '#d97706' : '#059669'};">
                                        <i class="fa-solid ${isGuest ? 'fa-user-clock' : 'fa-shield-halved'}"></i>
                                    </div>
                                    <div>
                                        <div class="yk-row-title" style="color:${isGuest ? '#fbbf24' : '#34d399'};">
                                            ${isGuest ? t('accStatusGuest') : t('accStatusSecure')}
                                        </div>
                                        <div class="yk-row-sub">${t('emailLabel')}: <span style="color:#e2e8f0;">${email}</span></div>
                                    </div>
                                </div>
                                ${(!isGuest && user.email) ? `
                                    <span style="font-size:10.5px; font-weight:900; padding:3px 9px; border-radius:10px; background:${isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}; color:${isVerified ? '#34d399' : '#fb7185'};">
                                        ${isVerified ? t('verifiedYes') : t('verifiedNo')}
                                    </span>
                                ` : ''}
                            </div>

                            <div class="yk-row" style="cursor:pointer;" onclick="YariSettings.copyId('${shortId}')">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:#2563eb;"><i class="fa-solid fa-id-badge"></i></div>
                                    <div>
                                        <div class="yk-row-title">${t('idLabel')}</div>
                                        <div class="yk-row-sub" style="color:#ffd000; font-weight:900; font-size:12.5px;">${shortId}</div>
                                    </div>
                                </div>
                                <i class="fa-regular fa-copy" style="color:#94a3b8;"></i>
                            </div>

                            ${isGuest ? `
                                <button class="yk-btn-row" onclick="YariSettings.close(); if(window.YariAuth) YariAuth.openAuthModal();">
                                    <span><i class="fa-solid fa-link"></i> ${t('linkAccBtn')}</span>
                                    <i class="fa-solid fa-chevron-${sheetDir === 'rtl' ? 'left' : 'right'}"></i>
                                </button>
                            ` : `
                                ${(!isVerified && user.email) ? `
                                    <button class="yk-btn-row" onclick="YariSettings.verifyEmail()">
                                        <span><i class="fa-solid fa-envelope-circle-check"></i> ${t('verifyEmailBtn')}</span>
                                        <i class="fa-solid fa-chevron-${sheetDir === 'rtl' ? 'left' : 'right'}"></i>
                                    </button>
                                ` : ''}
                                <button class="yk-btn-row" onclick="YariSettings.resetPassword()">
                                    <span><i class="fa-solid fa-key"></i> ${t('changePassBtn')}</span>
                                    <i class="fa-solid fa-chevron-${sheetDir === 'rtl' ? 'left' : 'right'}"></i>
                                </button>
                            `}
                        </div>
                    </div>

                    <!-- ٣. بەشی دەنگ و جووڵە -->
                    <div>
                        <div class="yk-sec-label">${t('secAudio')}</div>
                        <div class="yk-group-card">
                            <div class="yk-row">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:#7c3aed;"><i class="fa-solid fa-volume-high"></i></div>
                                    <div>
                                        <div class="yk-row-title">${t('sfxLabel')}</div>
                                        <div class="yk-row-sub">${t('sfxSub')}</div>
                                    </div>
                                </div>
                                <div class="yk-switch ${state.sfx ? 'on' : ''}" onclick="YariSettings.toggleLocal('sfx','yk_sfx_enabled')"></div>
                            </div>

                            <div class="yk-row">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:#db2777;"><i class="fa-solid fa-music"></i></div>
                                    <div>
                                        <div class="yk-row-title">${t('bgmLabel')}</div>
                                        <div class="yk-row-sub">${t('bgmSub')}</div>
                                    </div>
                                </div>
                                <div class="yk-switch ${state.bgm ? 'on' : ''}" onclick="YariSettings.toggleLocal('bgm','yk_bgm_enabled')"></div>
                            </div>

                            <div class="yk-row">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:#ea580c;"><i class="fa-solid fa-mobile-screen-button"></i></div>
                                    <div>
                                        <div class="yk-row-title">${t('vibrateLabel')}</div>
                                        <div class="yk-row-sub">${t('vibrateSub')}</div>
                                    </div>
                                </div>
                                <div class="yk-switch ${state.vibrate ? 'on' : ''}" onclick="YariSettings.toggleLocal('vibrate','yk_vibrate_enabled')"></div>
                            </div>

                            <button class="yk-btn-row" onclick="YariSettings.testSound()">
                                <span><i class="fa-solid fa-bell"></i> ${t('testSoundBtn')}</span>
                                <i class="fa-solid fa-play"></i>
                            </button>
                        </div>
                    </div>

                    <!-- ٤. بەشی تایبەتمەندی -->
                    <div>
                        <div class="yk-sec-label">${t('secPrivacy')}</div>
                        <div class="yk-group-card">
                            <div class="yk-row">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:#0284c7;"><i class="fa-solid fa-user-plus"></i></div>
                                    <div>
                                        <div class="yk-row-title">${t('allowFriendsLabel')}</div>
                                        <div class="yk-row-sub">${t('allowFriendsSub')}</div>
                                    </div>
                                </div>
                                <div class="yk-switch ${state.allowFriends ? 'on' : ''}" onclick="YariSettings.togglePrivacy('allowFriends')"></div>
                            </div>

                            <div class="yk-row">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:#0d9488;"><i class="fa-solid fa-gamepad"></i></div>
                                    <div>
                                        <div class="yk-row-title">${t('allowInvitesLabel')}</div>
                                        <div class="yk-row-sub">${t('allowInvitesSub')}</div>
                                    </div>
                                </div>
                                <div class="yk-switch ${state.allowInvites ? 'on' : ''}" onclick="YariSettings.togglePrivacy('allowInvites')"></div>
                            </div>

                            <div class="yk-row">
                                <div class="yk-row-left">
                                    <div class="yk-ico-badge" style="background:#4f46e5;"><i class="fa-solid fa-eye-slash"></i></div>
                                    <div>
                                        <div class="yk-row-title">${t('stealthModeLabel')}</div>
                                        <div class="yk-row-sub">${t('stealthModeSub')}</div>
                                    </div>
                                </div>
                                <div class="yk-switch ${state.stealthMode ? 'on' : ''}" onclick="YariSettings.togglePrivacy('stealthMode')"></div>
                            </div>
                        </div>
                    </div>

                    <!-- ٥. پشتگیری و خاوێنکردنەوە -->
                    <div>
                        <div class="yk-sec-label">${t('secSupport')}</div>
                        <div class="yk-group-card" style="padding:14px;">
                            <textarea id="ykSupportInput" rows="2" placeholder="${t('supportPlaceholder')}" style="width:100%; background:#0d091f; border:1px solid rgba(255,255,255,0.14); border-radius:14px; padding:11px; color:#fff; font-size:12.5px; outline:none; resize:none; margin-bottom:10px;"></textarea>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                <button onclick="YariSettings.sendSupport()" style="padding:11px; border-radius:13px; border:none; background:linear-gradient(135deg,#ffd000,#ff8800); color:#140a00; font-weight:900; font-size:12.5px; cursor:pointer;">
                                    <i class="fa-solid fa-paper-plane"></i> ${t('sendSupportBtn')}
                                </button>
                                <button onclick="window.location.reload(true)" style="padding:11px; border-radius:13px; border:1px solid rgba(255,255,255,0.16); background:#1c153d; color:#e2e8f0; font-weight:800; font-size:12px; cursor:pointer;">
                                    <i class="fa-solid fa-broom"></i> ${t('clearCacheBtn')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ٦. دەرچوون -->
                    <button class="yk-logout-btn" onclick="YariSettings.logout()">
                        <i class="fa-solid fa-right-from-bracket"></i> ${t('logoutBtn')}
                    </button>
                </div>
            </div>
        `;

        const newBody = overlay.querySelector('.yk-set-body');
        if (newBody) newBody.scrollTop = prevScroll;
    }

    function open() {
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
        setLang: setLanguage,
        toggleLocal: toggleLocalSetting,
        togglePrivacy: togglePrivacySetting,
        copyId: copyPlayerId,
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