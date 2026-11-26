// wallet-engine.js - کۆنترۆڵی تەواو و بێ گەڕانەوەی باڵانس
(function () {
    const DEFAULT_GOLD = 7000;
    const DEFAULT_DIAMONDS = 40;

    const DIAMOND_PACKAGES = [
        { id: 'd400', type: 'diamonds', amount: 400, label: '400', tag: 'HOT', usd: '$0.99', iqd: '1,500 دینار' },
        { id: 'd1800', type: 'diamonds', amount: 1800, label: '1,800', tag: '', usd: '$3.99', iqd: '6,000 دینار' },
        { id: 'd5000', type: 'diamonds', amount: 5000, label: '5,000', tag: '', usd: '$9.99', iqd: '15,000 دینار' },
        { id: 'd16k', type: 'diamonds', amount: 16000, label: '16.0K', tag: 'Popular', usd: '$29.99', iqd: '45,000 دینار' },
        { id: 'd53k', type: 'diamonds', amount: 53700, label: '53.7K', tag: '', usd: '$99.99', iqd: '150,000 دینار' },
        { id: 'd217k', type: 'diamonds', amount: 217000, label: '217.0K', tag: 'BEST', usd: '$399.99', iqd: '600,000 دینار' }
    ];

    const GOLD_PACKAGES = [
        { id: 'g33k', type: 'gold', amount: 33000, label: '33.0K', tag: '', usd: '$0.99', iqd: '1,500 دینار' },
        { id: 'g130k', type: 'gold', amount: 130000, label: '130.0K', tag: '', usd: '$2.99', iqd: '4,500 دینار' },
        { id: 'g670k', type: 'gold', amount: 670000, label: '670.0K', tag: 'Popular', usd: '$8.99', iqd: '13,500 دینار' },
        { id: 'g2m', type: 'gold', amount: 2700000, label: '2.7M', tag: '', usd: '$18.99', iqd: '28,500 دینار' },
        { id: 'g7m', type: 'gold', amount: 7700000, label: '7.7M', tag: '', usd: '$39.99', iqd: '60,000 دینار' },
        { id: 'g17m', type: 'gold', amount: 17000000, label: '17.0M', tag: 'BEST', usd: '$69.99', iqd: '105,000 دینار' }
    ];

    let selectedPkg = null;
    let selectedMethod = 'card';

    function getWallet() {
        let gold = localStorage.getItem('yk_wallet_gold');
        let diamonds = localStorage.getItem('yk_wallet_diamonds');

        if (gold === null || isNaN(parseInt(gold, 10))) {
            gold = DEFAULT_GOLD;
            localStorage.setItem('yk_wallet_gold', gold);
        }
        if (diamonds === null || isNaN(parseInt(diamonds, 10))) {
            diamonds = DEFAULT_DIAMONDS;
            localStorage.setItem('yk_wallet_diamonds', diamonds);
        }

        // هاوکاتکردن لەگەڵ کلیلە کۆنەکانی index.html تا نەیگەڕێنێتەوە
        localStorage.setItem('yk_gold', gold);
        localStorage.setItem('yk_diamonds', diamonds);
        localStorage.setItem('playerGold', gold);
        localStorage.setItem('playerDiamonds', diamonds);

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
        localStorage.setItem('yk_gold', gold);
        localStorage.setItem('yk_diamonds', diamonds);
        localStorage.setItem('playerGold', gold);
        localStorage.setItem('playerDiamonds', diamonds);

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
        saveWallet(w.gold + Number(amount), w.diamonds);
        return true;
    }

    function spendGold(amount) {
        const w = getWallet();
        if (w.gold < amount) return false;
        saveWallet(w.gold - Number(amount), w.diamonds);
        return true;
    }

    function addDiamonds(amount) {
        const w = getWallet();
        saveWallet(w.gold, w.diamonds + Number(amount));
        return true;
    }

    function spendDiamonds(amount) {
        const w = getWallet();
        if (w.diamonds < amount) return false;
        saveWallet(w.gold, w.diamonds - Number(amount));
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
        const goldFormatted = w.gold.toLocaleString();
        const diaFormatted = w.diamonds.toLocaleString();

        // نوێکردنەوەی هەموو شوێنە ئەگەرییەکانی گۆڵد و ئەڵماس لە پەڕەکەدا
        document.querySelectorAll('[data-wallet="gold"], #goldAmount, #userGold, #profileGold, .gold-count').forEach(el => {
            if (el.innerText !== goldFormatted) el.innerText = goldFormatted;
        });
        document.querySelectorAll('[data-wallet="diamonds"], #diamondAmount, #userDiamonds, #profileDiamonds, .diamond-count').forEach(el => {
            if (el.innerText !== diaFormatted) el.innerText = diaFormatted;
        });

        const modalGold = document.getElementById('yk-modal-gold');
        const modalDia = document.getElementById('yk-modal-diamonds');
        if (modalGold) modalGold.innerText = goldFormatted;
        if (modalDia) modalDia.innerText = diaFormatted;
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

        // چاودێریی بەردەوام تا هیچ کۆدێکی کۆن ژمارەکە نەگەڕێنێتەوە
        setInterval(() => {
            updateWalletUI();
            bindPlusButtons();
        }, 600);
    }

    function bindPlusButtons() {
        document.querySelectorAll('[data-wallet="gold"], #goldAmount, #userGold').forEach(el => {
            const btn = el.parentElement && el.parentElement.querySelector('button');
            if (btn && !btn.dataset.ykBound) {
                btn.dataset.ykBound = '1';
                btn.removeAttribute('onclick');
                btn.onclick = (e) => {
                    e.stopPropagation();
                    openStore('gold');
                };
            }
        });
        document.querySelectorAll('[data-wallet="diamonds"], #diamondAmount, #userDiamonds').forEach(el => {
            const btn = el.parentElement && el.parentElement.querySelector('button');
            if (btn && !btn.dataset.ykBound) {
                btn.dataset.ykBound = '1';
                btn.removeAttribute('onclick');
                btn.onclick = (e) => {
                    e.stopPropagation();
                    openStore('diamonds');
                };
            }
        });
    }

    function ensureStoreModal() {
        if (document.getElementById('yk-store-overlay')) return;

        const style = document.createElement('style');
        style.innerHTML = `
            #yk-store-overlay {
                position: fixed; inset: 0; background: rgba(4, 2, 14, 0.85);
                backdrop-filter: blur(10px); z-index: 9999; display: none;
                align-items: center; justify-content: center; padding: 14px;
                direction: rtl; font-family: 'Vazirmatn', sans-serif;
            }
            #yk-store-overlay.open { display: flex; }
            .yk-store-box {
                width: 100%; max-width: 440px; background: linear-gradient(180deg, #160c36 0%, #0b061f 100%);
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
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px;
            }
            .yk-pkg-card {
                background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.12);
                border-radius: 16px; padding: 12px 6px 10px; text-align: center; cursor: pointer;
                transition: 0.2s; position: relative;
            }
            .yk-pkg-card:hover, .yk-pkg-card:active {
                border-color: #ffb800; background: rgba(255,184,0,0.12); transform: translateY(-2px);
            }
            .yk-pkg-tag {
                position: absolute; top: -7px; right: 6px; color: #fff;
                font-size: 9px; font-weight: 900; padding: 1px 7px; border-radius: 8px;
            }
            .tag-HOT { background: linear-gradient(135deg, #f97316, #ef4444); }
            .tag-Popular { background: linear-gradient(135deg, #a855f7, #ec4899); }
            .tag-BEST { background: linear-gradient(135deg, #ef4444, #b91c1c); }
            .yk-pkg-price-btn {
                margin-top: 7px; background: linear-gradient(135deg, #22c55e, #16a34a);
                color: #fff; font-weight: 900; font-size: 11.5px; padding: 4px 8px;
                border-radius: 10px; display: inline-block; width: 90%;
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
                        <button id="yk-tab-diamonds" class="yk-tab-btn active" onclick="YariWallet.switchStoreTab('diamonds')">💎 ئەڵماس</button>
                        <button id="yk-tab-gold" class="yk-tab-btn" onclick="YariWallet.switchStoreTab('gold')">🪙 گۆڵد</button>
                    </div>
                    <div id="yk-store-content"></div>
                </div>

                <div id="yk-store-step2" style="display:none; margin-top:12px;">
                    <button onclick="YariWallet.backToPackages()" style="background:none; border:none; color:#ffd000; font-size:12.5px; font-weight:800; cursor:pointer; margin-bottom:10px;">➔ گەڕانەوە بۆ پاکێجەکان</button>
                    <div id="yk-selected-summary" style="background:rgba(255,184,0,0.12); border:1px solid rgba(255,184,0,0.4); border-radius:14px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"></div>

                    <div style="font-size:12px; font-weight:800; color:#e9d5ff;">شێوازی پارەدان هەڵبژێرە:</div>
                    <div class="yk-pay-methods">
                        <div id="yk-m-card" class="yk-method-card active" onclick="YariWallet.selectPayMethod('card')">💳 کارتی بانکی</div>
                        <div id="yk-m-wallet" class="yk-method-card" onclick="YariWallet.selectPayMethod('wallet')">📲 FIB / QiCard</div>
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

    function renderGrid(list) {
        return `
            <div class="yk-pkg-grid">
                ${list.map(p => `
                    <div class="yk-pkg-card" onclick="YariWallet.startCheckout('${p.id}')">
                        ${p.tag ? `<div class="yk-pkg-tag tag-${p.tag}">${p.tag}</div>` : ''}
                        <div style="font-size:26px;">${p.type === 'diamonds' ? '💎' : '🪙'}</div>
                        <div style="font-size:15px; font-weight:900; color:${p.type === 'diamonds' ? '#38bdf8' : '#ffd000'}; margin-top:2px;">${p.label}</div>
                        <div style="font-size:10px; color:#a49ec8;">${p.iqd}</div>
                        <div class="yk-pkg-price-btn">${p.usd}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function switchStoreTab(tab) {
        const btnDia = document.getElementById('yk-tab-diamonds');
        const btnGold = document.getElementById('yk-tab-gold');
        const content = document.getElementById('yk-store-content');
        if (!content) return;

        btnDia.classList.toggle('active', tab === 'diamonds');
        btnGold.classList.toggle('active', tab === 'gold');
        content.innerHTML = tab === 'diamonds' ? renderGrid(DIAMOND_PACKAGES) : renderGrid(GOLD_PACKAGES);
    }

    function startCheckout(pkgId) {
        selectedPkg = [...DIAMOND_PACKAGES, ...GOLD_PACKAGES].find(p => p.id === pkgId);
        if (!selectedPkg) return;

        document.getElementById('yk-store-step1').style.display = 'none';
        document.getElementById('yk-store-step2').style.display = 'block';

        const icon = selectedPkg.type === 'diamonds' ? '💎' : '🪙';
        const unitName = selectedPkg.type === 'diamonds' ? 'ئەڵماس' : 'گۆڵد';
        document.getElementById('yk-selected-summary').innerHTML = `
            <div>
                <div style="font-size:14px; font-weight:900; color:${selectedPkg.type === 'diamonds' ? '#38bdf8' : '#ffd000'};">${icon} ${selectedPkg.label} ${unitName}</div>
                <div style="font-size:11px; color:#a49ec8;">پاکێجی هەڵبژێردراو</div>
            </div>
            <div style="text-align:left;">
                <div style="font-size:15px; font-weight:900; color:#4ade80;">${selectedPkg.usd}</div>
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
                <input type="text" id="yk-card-name" class="yk-input" placeholder="ناوی خاوەن کارت">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <input type="text" id="yk-card-exp" class="yk-input" maxlength="5" placeholder="بەسەرچوون (MM/YY)">
                    <input type="password" id="yk-card-cvv" class="yk-input" maxlength="4" placeholder="CVV (٣ ژمارە)">
                </div>
                <button class="yk-submit-btn" onclick="YariWallet.submitPayment()">🔒 پارەدان (${selectedPkg.usd})</button>
            `;
        } else if (method === 'wallet') {
            area.innerHTML = `
                <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.35); border-radius:12px; padding:10px; font-size:11.5px; line-height:1.6; margin-bottom:10px;">
                    بڕی <b>${selectedPkg.iqd}</b> بنێرە بۆ هەژماری <b>FIB</b> یان <b>QiCard</b>ـی ئەپەکە و ژمارەی مۆبایلەکەت یان کۆدی حەواڵەکە لێرە بنووسە:
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

        if (selectedMethod === 'card') {
            const num = (document.getElementById('yk-card-num').value || '').replace(/\s+/g, '');
            const exp = (document.getElementById('yk-card-exp').value || '').trim();
            const cvv = (document.getElementById('yk-card-cvv').value || '').trim();

            if (num.length < 16 || !exp || cvv.length < 3) {
                alert('تکایە زانیارییەکانی کارتی بانکی بە تەواوی بنووسە!');
                return;
            }
            if (window.firebase && firebase.apps.length) {
                firebase.database().ref('topup_requests').push({
                    uid, playerName, method: 'bank_card', cardLast4: num.slice(-4),
                    itemType: selectedPkg.type, amount: selectedPkg.amount, priceUsd: selectedPkg.usd,
                    status: 'pending_gateway', createdAt: Date.now()
                });
            }
            alert('داواکاریی پارەدان بە کارتی بانکی تۆمارکرا!');
            closeStore();
        } else if (selectedMethod === 'wallet') {
            const ref = (document.getElementById('yk-wallet-phone').value || '').trim();
            if (ref.length < 6) {
                alert('تکایە ژمارەی مۆبایل یان کۆدی حەواڵەکە بە دروستی بنووسە!');
                return;
            }
            if (window.firebase && firebase.apps.length) {
                firebase.database().ref('topup_requests').push({
                    uid, playerName, method: 'fib_qicard', reference: ref,
                    itemType: selectedPkg.type, amount: selectedPkg.amount, priceIqd: selectedPkg.iqd,
                    status: 'pending_admin', createdAt: Date.now()
                });
            }
            alert('داواکارییەکەت بۆ ئەدمین نێردرا! دوای گەیشتنی پارەکە، باڵانسەکەت زیاد دەبێت.');
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
                    if (data && !data.used && (data.diamonds > 0 || data.gold > 0)) {
                        firebase.database().ref(`recharge_codes/${code}`).update({ used: true, usedBy: uid, usedAt: Date.now() });
                        if (data.diamonds) addDiamonds(data.diamonds);
                        if (data.gold) addGold(data.gold);
                        alert('پیرۆزە! کارتەکە بە سەرکەوتوویی چالاک کرا!');
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
window.formatCompactNumber = function (num) {
        num = Number(num) || 0;
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    };
    window.YariWallet = {
        getWallet, addGold, spendGold, addDiamonds, spendDiamonds,
        exchangeDiamondsToGold, updateWalletUI, syncFromServer,
        openStore, closeStore, switchStoreTab, backToPackages,
        startCheckout, selectPayMethod, submitPayment
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncFromServer);
    } else {
        syncFromServer();
    }
})();