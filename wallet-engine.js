// wallet-engine.js - سیستمی گۆڵد، ئەڵماس و پەنجەرەی کڕین و پارەدان
(function () {
    const DEFAULT_GOLD = 5000;
    const DEFAULT_DIAMONDS = 50;

    const DIAMOND_PACKAGES = [
        { id: 'd100', diamonds: 100, bonus: 0, usd: '$0.99', iqd: '1,500 دینار' },
        { id: 'd350', diamonds: 350, bonus: 25, usd: '$2.99', iqd: '4,500 دینار' },
        { id: 'd750', diamonds: 750, bonus: 75, usd: '$5.99', iqd: '9,000 دینار' },
        { id: 'd1600', diamonds: 1600, bonus: 200, usd: '$11.99', iqd: '18,000 دینار' },
        { id: 'd3500', diamonds: 3500, bonus: 500, usd: '$24.99', iqd: '37,500 دینار' },
        { id: 'd8000', diamonds: 8000, bonus: 1500, usd: '$49.99', iqd: '75,000 دینار' }
    ];

    const GOLD_EXCHANGE_PACKAGES = [
        { diamonds: 10, gold: 1000 },
        { diamonds: 50, gold: 5500 },
        { diamonds: 100, gold: 12000 },
        { diamonds: 250, gold: 32000 }
    ];

    let selectedPkg = null;
    let selectedMethod = 'card';

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

    function saveWallet(gold, diamonds) {
        gold = Math.max(0, Math.floor(gold));
        diamonds = Math.max(0, Math.floor(diamonds));

        localStorage.setItem('yk_wallet_gold', gold);
        localStorage.setItem('yk_wallet_diamonds', diamonds);

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

    function addGold(amount) {
        const w = getWallet();
        saveWallet(w.gold + amount, w.diamonds);
        return true;
    }

    function spendGold(amount) {
        const w = getWallet();
        if (w.gold < amount) return false;
        saveWallet(w.gold - amount, w.diamonds);
        return true;
    }

    function addDiamonds(amount) {
        const w = getWallet();
        saveWallet(w.gold, w.diamonds + amount);
        return true;
    }

    function spendDiamonds(amount) {
        const w = getWallet();
        if (w.diamonds < amount) return false;
        saveWallet(w.gold, w.diamonds - amount);
        return true;
    }

    function exchangeDiamondsToGold(diamondAmount, customGoldOut) {
        const w = getWallet();
        if (w.diamonds < diamondAmount || diamondAmount <= 0) return false;
        const goldGained = customGoldOut || (diamondAmount * 100);
        saveWallet(w.gold + goldGained, w.diamonds - diamondAmount);
        return true;
    }

    function updateWalletUI() {
        const w = getWallet();
        document.querySelectorAll('[data-wallet="gold"]').forEach(el => {
            el.innerText = w.gold.toLocaleString();
        });
        document.querySelectorAll('[data-wallet="diamonds"]').forEach(el => {
            el.innerText = w.diamonds.toLocaleString();
        });
        const modalGold = document.getElementById('yk-modal-gold');
        const modalDia = document.getElementById('yk-modal-diamonds');
        if (modalGold) modalGold.innerText = w.gold.toLocaleString();
        if (modalDia) modalDia.innerText = w.diamonds.toLocaleString();
    }

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
        bindPlusButtons();
    }

    // بەستنەوەی خودکاری دوگمەکانی + لە هەموو پەڕەکاندا بە فرۆشگاوە
    function bindPlusButtons() {
        document.querySelectorAll('[data-wallet="gold"]').forEach(el => {
            const btn = el.parentElement && el.parentElement.querySelector('button');
            if (btn) {
                btn.removeAttribute('onclick');
                btn.onclick = (e) => {
                    e.stopPropagation();
                    openStore('gold');
                };
            }
        });
        document.querySelectorAll('[data-wallet="diamonds"]').forEach(el => {
            const btn = el.parentElement && el.parentElement.querySelector('button');
            if (btn) {
                btn.removeAttribute('onclick');
                btn.onclick = (e) => {
                    e.stopPropagation();
                    openStore('diamonds');
                };
            }
        });
    }

    // دروستکردنی پەنجەرەی فرۆشگا و پارەدان
    function ensureStoreModal() {
        if (document.getElementById('yk-store-overlay')) return;

        const style = document.createElement('style');
        style.innerHTML = `
            #yk-store-overlay {
                position: fixed; inset: 0; background: rgba(4, 2, 14, 0.84);
                backdrop-filter: blur(10px); z-index: 9999; display: none;
                align-items: center; justify-content: center; padding: 14px;
                direction: rtl; font-family: 'Vazirmatn', sans-serif;
            }
            #yk-store-overlay.open { display: flex; }
            .yk-store-box {
                width: 100%; max-width: 430px; background: linear-gradient(180deg, #160c36 0%, #0b061f 100%);
                border: 1.5px solid rgba(255, 184, 0, 0.55); border-radius: 26px;
                padding: 18px; color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.9);
                max-height: 88vh; overflow-y: auto;
            }
            .yk-store-head {
                display: flex; justify-content: space-between; align-items: center;
                padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .yk-store-tabs {
                display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 14px 0;
                background: rgba(0,0,0,0.45); padding: 5px; border-radius: 16px;
            }
            .yk-tab-btn {
                border: none; border-radius: 12px; padding: 9px; font-weight: 900;
                font-size: 13px; cursor: pointer; background: transparent; color: #a49ec8;
                font-family: inherit; transition: 0.2s;
            }
            .yk-tab-btn.active {
                background: linear-gradient(135deg, #ffd000, #ff8800); color: #1a0f00;
                box-shadow: 0 4px 12px rgba(255,184,0,0.35);
            }
            .yk-pkg-grid {
                display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
            }
            .yk-pkg-card {
                background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.12);
                border-radius: 18px; padding: 12px 10px; text-align: center; cursor: pointer;
                transition: 0.2s; position: relative;
            }
            .yk-pkg-card:hover, .yk-pkg-card:active {
                border-color: #ffb800; background: rgba(255,184,0,0.12); transform: translateY(-2px);
            }
            .yk-pkg-bonus {
                position: absolute; top: -8px; left: 10px; background: #ef4444; color: #fff;
                font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 10px;
            }
            .yk-pkg-price-btn {
                margin-top: 8px; background: linear-gradient(135deg, #38bdf8, #0284c7);
                color: #fff; font-weight: 900; font-size: 12px; padding: 5px 10px;
                border-radius: 12px; display: inline-block;
            }
            .yk-pay-methods {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0;
            }
            .yk-method-card {
                background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.14);
                border-radius: 14px; padding: 10px 6px; text-align: center; font-size: 11.5px;
                font-weight: 800; cursor: pointer;
            }
            .yk-method-card.active {
                border-color: #ffd000; background: rgba(255,184,0,0.18); color: #ffd000;
            }
            .yk-input {
                width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                border-radius: 12px; padding: 10px 12px; color: #fff; font-size: 13px;
                margin-bottom: 10px; outline: none; font-family: inherit;
            }
            .yk-input:focus { border-color: #ffb800; }
            .yk-submit-btn {
                width: 100%; background: linear-gradient(135deg, #ffd000, #ff8800);
                color: #1a0f00; border: none; border-radius: 16px; padding: 12px;
                font-size: 14px; font-weight: 900; cursor: pointer; font-family: inherit;
            }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'yk-store-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) closeStore(); };
        overlay.innerHTML = `
            <div class="yk-store-box">
                <div class="yk-store-head">
                    <div>
                        <div style="font-size:16px; font-weight:900; color:#ffd000;">👑 فرۆشگای یاری کوردی</div>
                        <div style="font-size:11px; color:#a49ec8; margin-top:2px;">
                            باڵانس: 🪙 <b id="yk-modal-gold" style="color:#ffd000;">0</b> • 💎 <b id="yk-modal-diamonds" style="color:#38bdf8;">0</b>
                        </div>
                    </div>
                    <button onclick="YariWallet.closeStore()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer;">✕</button>
                </div>

                <div id="yk-store-step1">
                    <div class="yk-store-tabs">
                        <button id="yk-tab-diamonds" class="yk-tab-btn active" onclick="YariWallet.switchStoreTab('diamonds')">💎 کڕینی ئەڵماس</button>
                        <button id="yk-tab-gold" class="yk-tab-btn" onclick="YariWallet.switchStoreTab('gold')">🪙 گۆڕینەوە بۆ گۆڵد</button>
                    </div>
                    <div id="yk-store-content"></div>
                </div>

                <div id="yk-store-step2" style="display:none; margin-top:12px;">
                    <button onclick="YariWallet.backToPackages()" style="background:none; border:none; color:#ffd000; font-size:12.5px; font-weight:800; cursor:pointer; margin-bottom:10px;">➔ گەڕانەوە بۆ پاکێجەکان</button>
                    <div id="yk-selected-summary" style="background:rgba(255,184,0,0.12); border:1px solid rgba(255,184,0,0.4); border-radius:14px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"></div>

                    <div style="font-size:12px; font-weight:800; color:#e9d5ff;">شێوازی پارەدان هەڵبژێرە:</div>
                    <div class="yk-pay-methods">
                        <div id="yk-m-card" class="yk-method-card active" onclick="YariWallet.selectPayMethod('card')">💳 کارتی بانکی</div>
                        <div id="yk-m-wallet" class="yk-method-card" onclick="YariWallet.selectPayMethod('wallet')">📲 FIB / FastPay</div>
                        <div id="yk-m-code" class="yk-method-card" onclick="YariWallet.selectPayMethod('code')">🎟️ کارتی شەحن</div>
                    </div>

                    <div id="yk-pay-form-area"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function openStore(tab = 'diamonds') {
        ensureStoreModal();
        updateWalletUI();
        backToPackages();
        switchStoreTab(tab);
        document.getElementById('yk-store-overlay').classList.add('open');
    }

    function closeStore() {
        const el = document.getElementById('yk-store-overlay');
        if (el) el.classList.remove('open');
    }

    function backToPackages() {
        const s1 = document.getElementById('yk-store-step1');
        const s2 = document.getElementById('yk-store-step2');
        if (s1) s1.style.display = 'block';
        if (s2) s2.style.display = 'none';
    }

    function switchStoreTab(tab) {
        const btnDia = document.getElementById('yk-tab-diamonds');
        const btnGold = document.getElementById('yk-tab-gold');
        const content = document.getElementById('yk-store-content');
        if (!content) return;

        btnDia.classList.toggle('active', tab === 'diamonds');
        btnGold.classList.toggle('active', tab === 'gold');

        if (tab === 'diamonds') {
            content.innerHTML = `
                <div style="font-size:11.5px; color:#d8b4fe; margin-bottom:10px;">پاکێجێک هەڵبژێرە بۆ کڕین لە ڕێگەی کارتی بانکی یان جزدانە ئەلیکترۆنییەکان:</div>
                <div class="yk-pkg-grid">
                    ${DIAMOND_PACKAGES.map(p => `
                        <div class="yk-pkg-card" onclick="YariWallet.startCheckout('${p.id}')">
                            ${p.bonus > 0 ? `<div class="yk-pkg-bonus">+${p.bonus} دیاری</div>` : ''}
                            <div style="font-size:28px;">💎</div>
                            <div style="font-size:16px; font-weight:900; color:#38bdf8; margin-top:2px;">${p.diamonds.toLocaleString()}</div>
                            <div style="font-size:10.5px; color:#a49ec8;">${p.iqd}</div>
                            <div class="yk-pkg-price-btn">${p.usd}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            content.innerHTML = `
                <div style="font-size:11.5px; color:#d8b4fe; margin-bottom:10px;">ئەڵماسەکانت بگۆڕەوە بۆ گۆڵد (ئەگەر ئەڵماست نەبێت سەرەتا ئەڵماس بکڕە):</div>
                <div class="yk-pkg-grid">
                    ${GOLD_EXCHANGE_PACKAGES.map(g => `
                        <div class="yk-pkg-card" onclick="YariWallet.buyGoldWithDiamonds(${g.diamonds}, ${g.gold})">
                            <div style="font-size:28px;">🪙</div>
                            <div style="font-size:16px; font-weight:900; color:#ffd000; margin-top:2px;">${g.gold.toLocaleString()} گۆڵد</div>
                            <div class="yk-pkg-price-btn" style="background:linear-gradient(135deg,#ffd000,#ff8800); color:#1a0f00;">💎 ${g.diamonds} ئەڵماس</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function buyGoldWithDiamonds(diaCost, goldAmount) {
        if (exchangeDiamondsToGold(diaCost, goldAmount)) {
            alert(`پیرۆزە! ${diaCost} ئەڵماس گۆڕدرا بۆ ${goldAmount.toLocaleString()} گۆڵد 🪙`);
        } else {
            alert('ئەڵماسی پێویستت نییە! تکایە سەرەتا لە بەشی کڕینی ئەڵماس باڵانس پڕ بکەرەوە.');
            switchStoreTab('diamonds');
        }
    }

    function startCheckout(pkgId) {
        selectedPkg = DIAMOND_PACKAGES.find(p => p.id === pkgId);
        if (!selectedPkg) return;

        document.getElementById('yk-store-step1').style.display = 'none';
        document.getElementById('yk-store-step2').style.display = 'block';

        const totalDia = selectedPkg.diamonds + selectedPkg.bonus;
        document.getElementById('yk-selected-summary').innerHTML = `
            <div>
                <div style="font-size:13px; font-weight:900; color:#38bdf8;">💎 ${totalDia.toLocaleString()} ئەڵماس</div>
                <div style="font-size:11px; color:#a49ec8;">پاکێجی هەڵبژێردراو</div>
            </div>
            <div style="text-align:left;">
                <div style="font-size:15px; font-weight:900; color:#ffd000;">${selectedPkg.usd}</div>
                <div style="font-size:10.5px; color:#fde68a;">${selectedPkg.iqd}</div>
            </div>
        `;

        selectPayMethod('card');
    }

    function selectPayMethod(method) {
        selectedMethod = method;
        ['card', 'wallet', 'code'].forEach(m => {
            const el = document.getElementById(`yk-m-${m}`);
            if (el) el.classList.toggle('active', m === method);
        });

        const area = document.getElementById('yk-pay-form-area');
        if (method === 'card') {
            area.innerHTML = `
                <input type="text" id="yk-card-num" class="yk-input" maxlength="19" placeholder="ژمارەی کارتی بانکی (16 ژمارە) - Visa / MasterCard">
                <input type="text" id="yk-card-name" class="yk-input" placeholder="ناوی خاوەن کارت (وەک سەر کارتەکە)">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <input type="text" id="yk-card-exp" class="yk-input" maxlength="5" placeholder="بەسەرچوون (MM/YY)">
                    <input type="password" id="yk-card-cvv" class="yk-input" maxlength="4" placeholder="CVV (٣ ژمارە)">
                </div>
                <button class="yk-submit-btn" onclick="YariWallet.submitPayment()">🔒 پارەدان (${selectedPkg.usd}) و کڕینی ئەڵماس</button>
            `;
        } else if (method === 'wallet') {
            area.innerHTML = `
                <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.35); border-radius:12px; padding:10px; font-size:11.5px; line-height:1.6; margin-bottom:10px;">
                    بڕی <b>${selectedPkg.iqd}</b> بنێرە بۆ ژمارەی FIB / FastPay / ZainCashـی ئەپەکە و ژمارەی مۆبایلەکەت یان کۆدی حەواڵەکە لێرە بنووسە:
                </div>
                <input type="text" id="yk-wallet-phone" class="yk-input" placeholder="ژمارەی مۆبایلی نێرەر یان کۆدی حەواڵە (Transaction ID)">
                <button class="yk-submit-btn" onclick="YariWallet.submitPayment()">ناردنی داواکاریی شەحنکردن 📲</button>
            `;
        } else {
            area.innerHTML = `
                <div style="font-size:11.5px; color:#d8b4fe; margin-bottom:8px;">کۆدی کارتی شەحنی «یاری کوردی» لێرە بنووسە:</div>
                <input type="text" id="yk-redeem-code" class="yk-input" placeholder="نموونە: YARI-2026-XXXX">
                <button class="yk-submit-btn" onclick="YariWallet.submitPayment()">چالاککردنی کۆد 🎟️</button>
            `;
        }
    }

    function submitPayment() {
        if (!selectedPkg) return;
        const uid = localStorage.getItem('yk_player_uid') || 'guest_' + Date.now();
        const playerName = localStorage.getItem('yk_player_name') || 'یاریزان';
        const totalDiamonds = selectedPkg.diamonds + selectedPkg.bonus;

        if (selectedMethod === 'card') {
            const num = (document.getElementById('yk-card-num').value || '').replace(/\s+/g, '');
            const exp = (document.getElementById('yk-card-exp').value || '').trim();
            const cvv = (document.getElementById('yk-card-cvv').value || '').trim();

            if (num.length < 16 || !exp || cvv.length < 3) {
                alert('تکایە زانیارییەکانی کارتی بانکی (١٦ ژمارەی کارت، بەروار، و CVV) بە تەواوی بنووسە!');
                return;
            }

            if (window.firebase && firebase.apps.length) {
                firebase.database().ref('topup_requests').push({
                    uid, playerName, method: 'bank_card',
                    cardLast4: num.slice(-4),
                    diamonds: totalDiamonds, priceUsd: selectedPkg.usd,
                    status: 'pending_gateway', createdAt: Date.now()
                });
            }

            alert('داواکاریی پارەدان بە کارتی بانکی وەرگیرا! پێویستە دەروازەی پارەدانی بانکی (Stripe / Visa) بە سێرڤەرەوە ببەسترێتەوە تا پارەکە ڕابکێشرێت و ئەڵماسەکان بچنە سەر هەژمارەکەت.');
            closeStore();
        } else if (selectedMethod === 'wallet') {
            const ref = (document.getElementById('yk-wallet-phone').value || '').trim();
            if (ref.length < 6) {
                alert('تکایە ژمارەی مۆبایل یان کۆدی حەواڵەکە بە دروستی بنووسە!');
                return;
            }

            if (window.firebase && firebase.apps.length) {
                firebase.database().ref('topup_requests').push({
                    uid, playerName, method: 'fib_fastpay',
                    reference: ref,
                    diamonds: totalDiamonds, priceIqd: selectedPkg.iqd,
                    status: 'pending_admin', createdAt: Date.now()
                });
            }

            alert('داواکارییەکەت بۆ ئەدمین نێردرا! دوای دڵنیابوونەوە لە گەیشتنی پارەکە، ئەڵماسەکان دەچنە سەر هەژمارەکەت.');
            closeStore();
        } else {
            const code = (document.getElementById('yk-redeem-code').value || '').trim().toUpperCase();
            if (!code) {
                alert('تکایە کۆدی کارتی شەحنەکە بنووسە!');
                return;
            }

            if (window.firebase && firebase.apps.length) {
                firebase.database().ref(`recharge_codes/${code}`).once('value', (snap) => {
                    const data = snap.val();
                    if (data && !data.used && data.diamonds > 0) {
                        firebase.database().ref(`recharge_codes/${code}`).update({ used: true, usedBy: uid, usedAt: Date.now() });
                        addDiamonds(data.diamonds);
                        alert(`پیرۆزە! کارتەکە سەرکەوتوو بوو و ${data.diamonds} ئەڵماس چووە سەر هەژمارەکەت 💎`);
                        closeStore();
                    } else {
                        alert('ئەم کۆدە هەڵەیە یان پێشتر بەکارهێنراوە!');
                    }
                });
            } else {
                alert('ئەم کۆدە هەڵەیە یان پێشتر بەکارهێنراوە!');
            }
        }
    }

    window.YariWallet = {
        getWallet,
        addGold,
        spendGold,
        addDiamonds,
        spendDiamonds,
        exchangeDiamondsToGold,
        updateWalletUI,
        syncFromServer,
        openStore,
        closeStore,
        switchStoreTab,
        backToPackages,
        buyGoldWithDiamonds,
        startCheckout,
        selectPayMethod,
        submitPayment
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncFromServer);
    } else {
        syncFromServer();
    }
})();