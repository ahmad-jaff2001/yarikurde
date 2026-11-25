// wallet-engine.js - سیستمی گۆڵد و ئەڵماس بۆ یاری کوردی
(function () {
    const DEFAULT_GOLD = 5000;    // دیاری سەرەتا بۆ یاریزانی نوێ
    const DEFAULT_DIAMONDS = 50;  // ئەڵماسی سەرەتا بۆ یاریزانی نوێ

    // خوێندنەوەی باڵانسی ئێستا
    function getWallet() {
        let gold = localStorage.getItem('yk_wallet_gold');
        let diamonds = localStorage.getItem('yk_wallet_diamonds');

        if (gold === null) {
            gold = DEFAULT_GOLD;
            localStorage.setItem('yk_wallet_gold', gold);
        }
        if (diamonds === null) {
            diamonds = DEFAULT_DIAMONDS;
            localStorage.setItem('yk_wallet_diamonds', diamonds);
        }

        return {
            gold: parseInt(gold, 10) || 0,
            diamonds: parseInt(diamonds, 10) || 0
        };
    }

    // پاشەکەوتکردن لە مۆبایل و سێرڤەری Firebase
    function saveWallet(gold, diamonds) {
        gold = Math.max(0, Math.floor(gold));
        diamonds = Math.max(0, Math.floor(diamonds));

        localStorage.setItem('yk_wallet_gold', gold);
        localStorage.setItem('yk_wallet_diamonds', diamonds);

        // ئەگەر Firebase پەیوەست بوو، لە سێرڤەریش خەزنی بکە
        const uid = localStorage.getItem('yk_player_uid');
        if (window.firebase && firebase.apps.length && uid) {
            firebase.database().ref(`players/${uid}/wallet`).update({
                gold: gold,
                diamonds: diamonds,
                updatedAt: Date.now()
            });
        }

        updateWalletUI();
    }

    // زیادکردنی گۆڵد (بۆ نموونە لە کاتی بردنەوەی یاری)
    function addGold(amount) {
        const w = getWallet();
        saveWallet(w.gold + amount, w.diamonds);
        return true;
    }

    // خەرجکردنی گۆڵد (بۆ نموونە بۆ چوونە ناو یاری یان دیاری سادە)
    function spendGold(amount) {
        const w = getWallet();
        if (w.gold < amount) return false; // گۆڵدی پێویستی نییە
        saveWallet(w.gold - amount, w.diamonds);
        return true;
    }

    // زیادکردنی ئەڵماس
    function addDiamonds(amount) {
        const w = getWallet();
        saveWallet(w.gold, w.diamonds + amount);
        return true;
    }

    // خەرجکردنی ئەڵماس (بۆ دیارییە گەورەکانی ژووری دەنگی)
    function spendDiamonds(amount) {
        const w = getWallet();
        if (w.diamonds < amount) return false; // ئەڵماسی پێویستی نییە
        saveWallet(w.gold, w.diamonds - amount);
        return true;
    }

    // گۆڕینەوەی ئەڵماس بە گۆڵد (١ ئەڵماس = ١٠٠ گۆڵد)
    function exchangeDiamondsToGold(diamondAmount) {
        const w = getWallet();
        if (w.diamonds < diamondAmount || diamondAmount <= 0) return false;
        const goldGained = diamondAmount * 100;
        saveWallet(w.gold + goldGained, w.diamonds - diamondAmount);
        return true;
    }

    // خەڵاتی ڕۆژانە (هەموو ٢٤ کاتژمێر جارێک ١٠٠٠ گۆڵد)
    function claimDailyGold() {
        const lastClaim = parseInt(localStorage.getItem('yk_last_daily_gold') || '0', 10);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (now - lastClaim < oneDay) {
            return { success: false, message: 'ئەمڕۆ خەڵاتی ڕۆژانەت وەرگرتووە!' };
        }

        localStorage.setItem('yk_last_daily_gold', now.toString());
        addGold(1000);
        return { success: true, message: 'پیرۆزە! ١,٠٠٠ گۆڵدی خۆڕایت وەرگرت 🪙' };
    }

    // نوێکردنەوەی ژمارەکان لەسەر شاشە بە شێوەی خودکار
    function updateWalletUI() {
        const w = getWallet();
        document.querySelectorAll('[data-wallet="gold"]').forEach(el => {
            el.innerText = w.gold.toLocaleString();
        });
        document.querySelectorAll('[data-wallet="diamonds"]').forEach(el => {
            el.innerText = w.diamonds.toLocaleString();
        });
    }

    // هاوکاتکردن لەگەڵ Firebase لە کاتی کردنەوەی پەڕەدا
    function syncFromServer() {
        const uid = localStorage.getItem('yk_player_uid');
        if (window.firebase && firebase.apps.length && uid) {
            firebase.database().ref(`players/${uid}/wallet`).on('value', (snap) => {
                const data = snap.val();
                if (data) {
                    if (typeof data.gold === 'number') localStorage.setItem('yk_wallet_gold', data.gold);
                    if (typeof data.diamonds === 'number') localStorage.setItem('yk_wallet_diamonds', data.diamonds);
                    updateWalletUI();
                } else {
                    const w = getWallet();
                    saveWallet(w.gold, w.diamonds);
                }
            });
        }
        updateWalletUI();
    }

    window.YariWallet = {
        getWallet,
        addGold,
        spendGold,
        addDiamonds,
        spendDiamonds,
        exchangeDiamondsToGold,
        claimDailyGold,
        updateWalletUI,
        syncFromServer
    };

    window.addEventListener('DOMContentLoaded', syncFromServer);
})();