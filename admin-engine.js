// admin-engine.js - پەنێڵی دەسەڵاتی گشتیی ئەدمین بۆ تەواوی ئەپەکە
(function () {
    const ADMIN_PIN = '2026'; // دەتوانیت ئەم کۆدە نهێنییە بگۆڕیت بۆ هەر ژمارەیەک بتەوێت

    function isAdmin() {
        return localStorage.getItem('yk_is_super_admin') === 'true';
    }

    function applyGlobalAdminChanges() {
        // ١. گۆڕینی ناوی ئەپ ئەگەر ئەدمین گۆڕیبێتی
        const customAppName = localStorage.getItem('yk_admin_app_name');
        if (customAppName) {
            document.querySelectorAll('.brand-title, .host-pill-title').forEach(el => {
                el.innerText = customAppName;
            });
        }

        // ٢. گۆڕینی باکگراوندی ژووری دەنگی ئەگەر ئەدمین گۆڕیبێتی
        const customRoomBg = localStorage.getItem('yk_admin_room_bg');
        const roomBgEl = document.querySelector('.room-bg');
        if (customRoomBg && roomBgEl) {
            roomBgEl.style.backgroundImage = `linear-gradient(180deg, rgba(8,3,24,0.55), rgba(6,2,18,0.92)), url('${customRoomBg}')`;
        }

        // ٣. گۆڕینی لۆگۆی ئەپ ئەگەر ئەدمین گۆڕیبێتی
        const customLogo = localStorage.getItem('yk_admin_logo');
        if (customLogo) {
            document.querySelectorAll('.brand-logo img, #topHostAvatar').forEach(img => {
                img.src = customLogo;
            });
        }
    }

    function injectAdminButtonAndModal() {
        if (document.getElementById('yk-super-admin-btn')) return;

        const style = document.createElement('style');
        style.innerHTML = `
            #yk-super-admin-btn {
                position: fixed;
                bottom: 78px;
                left: 14px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ffd000, #ff6b00);
                color: #1a0f00;
                border: 2px solid #fff;
                box-shadow: 0 4px 20px rgba(255, 184, 0, 0.65);
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9998;
                transition: transform 0.2s;
            }
            #yk-super-admin-btn:active { transform: scale(0.9); }

            #yk-admin-modal {
                position: fixed;
                inset: 0;
                background: rgba(4, 2, 14, 0.88);
                backdrop-filter: blur(12px);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 14px;
                direction: rtl;
                font-family: 'Vazirmatn', sans-serif;
            }
            #yk-admin-modal.open { display: flex; }

            .yk-adm-card {
                width: 100%;
                max-width: 440px;
                background: linear-gradient(180deg, #1b0e42 0%, #0b051f 100%);
                border: 2px solid #ffb800;
                border-radius: 24px;
                padding: 18px;
                color: #fff;
                max-height: 88vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.95);
            }
            .yk-adm-section {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 184, 0, 0.25);
                border-radius: 16px;
                padding: 12px;
                margin-bottom: 12px;
            }
            .yk-adm-title {
                font-size: 13px;
                font-weight: 900;
                color: #ffd000;
                margin-bottom: 8px;
            }
            .yk-adm-input {
                width: 100%;
                background: rgba(0, 0, 0, 0.55);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                padding: 8px 10px;
                color: #fff;
                font-size: 12px;
                margin-bottom: 8px;
                outline: none;
                font-family: inherit;
            }
            .yk-adm-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            .yk-adm-btn {
                width: 100%;
                background: linear-gradient(135deg, #ffd000, #ff8800);
                color: #1a0f00;
                border: none;
                border-radius: 12px;
                padding: 9px;
                font-size: 12.5px;
                font-weight: 900;
                cursor: pointer;
                font-family: inherit;
            }
            .yk-adm-btn.blue {
                background: linear-gradient(135deg, #38bdf8, #0284c7);
                color: #fff;
            }
            .yk-adm-btn.red {
                background: rgba(239, 68, 68, 0.25);
                border: 1px solid #ef4444;
                color: #fca5a5;
            }
        `;
        document.head.appendChild(style);

        // دوگمەی تاجی ئەدمین لە گۆشەی خوارەوە
        const btn = document.createElement('button');
        btn.id = 'yk-super-admin-btn';
        btn.innerHTML = '👑';
        btn.title = 'پەنێڵی دەسەڵاتی ئەدمین';
        btn.onclick = openSuperAdmin;
        document.body.appendChild(btn);

        // پەنجەرەی کۆنتڕۆڵی گشتیی ئەدمین
        const modal = document.createElement('div');
        modal.id = 'yk-admin-modal';
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
        modal.innerHTML = `
            <div class="yk-adm-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-size:16px; font-weight:900; color:#ffd000;">👑 کۆنتڕۆڵی گشتیی ئەدمین</div>
                    <button onclick="document.getElementById('yk-admin-modal').classList.remove('open')" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:32px; height:32px; border-radius:50%; cursor:pointer;">✕</button>
                </div>

                <!-- ١. زیادکردنی ئەڵماس و گۆڵد بۆ خۆت -->
                <div class="yk-adm-section">
                    <div class="yk-adm-title">١. زیادکردنی ئەڵماس و گۆڵد (خۆڕایی بۆ ئەدمین)</div>
                    <div class="yk-adm-grid" style="margin-bottom:8px;">
                        <button class="yk-adm-btn blue" onclick="YariAdmin.giveMeDiamonds(5000)">+5,000 💎 ئەڵماس</button>
                        <button class="yk-adm-btn blue" onclick="YariAdmin.giveMeDiamonds(50000)">+50,000 💎 ئەڵماس</button>
                        <button class="yk-adm-btn" onclick="YariAdmin.giveMeGold(100000)">+100,000 🪙 گۆڵد</button>
                        <button class="yk-adm-btn" onclick="YariAdmin.giveMeGold(1000000)">+1,000,000 🪙 گۆڵد</button>
                    </div>
                    <div class="yk-adm-grid">
                        <input type="number" id="admCustomAmount" class="yk-adm-input" style="margin:0;" placeholder="بڕی دڵخواز بنووسە...">
                        <button class="yk-adm-btn blue" onclick="YariAdmin.giveCustomDiamonds()">زیادکردنی ئەڵماس 💎</button>
                    </div>
                </div>

                <!-- ٢. گۆڕینی وێنە و ناوی ئەپ و ژوور -->
                <div class="yk-adm-section">
                    <div class="yk-adm-title">٢. گۆڕینی وێنە، لۆگۆ و باکگراوندی ژوور</div>
                    <input type="text" id="admAppName" class="yk-adm-input" placeholder="ناوی نوێی ئەپ یان ژوور (نموونە: یاری کوردی VIP)">
                    <div style="font-size:11px; color:#d8b4fe; margin-bottom:4px;">وێنەی نوێی باکگراوندی ژووری دەنگی:</div>
                    <input type="file" id="admRoomBgFile" accept="image/*" class="yk-adm-input">
                    <div style="font-size:11px; color:#d8b4fe; margin-bottom:4px;">وێنەی نوێی پڕۆفایل / لۆگۆی ئەدمین:</div>
                    <input type="file" id="admLogoFile" accept="image/*" class="yk-adm-input">
                    <div class="yk-adm-grid">
                        <button class="yk-adm-btn" onclick="YariAdmin.saveAppearance()">پاشەکەوتکردن ✨</button>
                        <button class="yk-adm-btn red" onclick="YariAdmin.resetAppearance()">گەڕاندنەوەی سەرەتا</button>
                    </div>
                </div>

                <!-- ٣. زیادکردنی دیاریی نوێ (وێنە یان ڤیدیۆ) -->
                <div class="yk-adm-section">
                    <div class="yk-adm-title">٣. زیادکردنی دیاریی نوێ بۆ سندوقی ژوور</div>
                    <input type="text" id="admGiftName" class="yk-adm-input" placeholder="ناوی دیاری (نموونە: کۆشکی زێڕین)">
                    <div class="yk-adm-grid">
                        <input type="text" id="admGiftIcon" class="yk-adm-input" placeholder="ئیمۆجی (🏰)">
                        <input type="number" id="admGiftPrice" class="yk-adm-input" placeholder="نرخ بە ئەڵماس (1000)">
                    </div>
                    <input type="text" id="admGiftVideoPath" class="yk-adm-input" placeholder="ناوی ڤیدیۆ لە images.png (نموونە: images.png/castle.mp4)">
                    <button class="yk-adm-btn blue" onclick="YariAdmin.addCustomGift()">+ زیادکردنی دیاری</button>
                </div>

                <!-- ٤. دەرچوون لە دۆخی ئەدمین -->
                <button class="yk-adm-btn red" onclick="YariAdmin.logoutAdmin()">قوفڵدانی پەنێڵی ئەدمین 🔒</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function openSuperAdmin() {
        if (!isAdmin()) {
            const entered = prompt('کۆدی نهێنیی ئەدمین بنووسە (2026):');
            if (entered !== ADMIN_PIN) {
                alert('کۆدەکە هەڵەیە! تەنها خاوەنی ئەپ دەسەڵاتی هەیە.');
                return;
            }
            localStorage.setItem('yk_is_super_admin', 'true');
            // زیادکردنی نیشانەی VIP بۆ ناوەکەت
            const curName = localStorage.getItem('yk_player_name') || 'یاریزان';
            if (!curName.includes('👑')) {
                localStorage.setItem('yk_player_name', '👑 ' + curName);
            }
        }
        document.getElementById('yk-admin-modal').classList.add('open');
    }

    function giveMeDiamonds(amount) {
        if (window.YariWallet) {
            YariWallet.addDiamonds(amount);
            alert(`${amount.toLocaleString()} ئەڵماس چووە سەر هەژمارەکەت 💎`);
        }
    }

    function giveMeGold(amount) {
        if (window.YariWallet) {
            YariWallet.addGold(amount);
            alert(`${amount.toLocaleString()} گۆڵد چووە سەر هەژمارەکەت 🪙`);
        }
    }

    function giveCustomDiamonds() {
        const val = parseInt(document.getElementById('admCustomAmount').value, 10);
        if (val > 0) giveMeDiamonds(val);
    }

    function saveAppearance() {
        const newName = document.getElementById('admAppName').value.trim();
        if (newName) localStorage.setItem('yk_admin_app_name', newName);

        const bgFile = document.getElementById('admRoomBgFile').files[0];
        const logoFile = document.getElementById('admLogoFile').files[0];

        const finish = () => {
            applyGlobalAdminChanges();
            alert('هەموو گۆڕانکارییەکان بە سەرکەوتوویی جێگیر کران!');
        };

        if (bgFile) {
            const r1 = new FileReader();
            r1.onload = (e) => {
                localStorage.setItem('yk_admin_room_bg', e.target.result);
                if (!logoFile) finish();
            };
            r1.readAsDataURL(bgFile);
        }

        if (logoFile) {
            const r2 = new FileReader();
            r2.onload = (e) => {
                localStorage.setItem('yk_admin_logo', e.target.result);
                localStorage.setItem('yk_player_avatar', e.target.result);
                finish();
            };
            r2.readAsDataURL(logoFile);
        }

        if (!bgFile && !logoFile) finish();
    }

    function resetAppearance() {
        localStorage.removeItem('yk_admin_app_name');
        localStorage.removeItem('yk_admin_room_bg');
        localStorage.removeItem('yk_admin_logo');
        alert('هەموو شتێک گەڕایەوە سەر دۆخی سەرەتایی، پەڕەکە Refresh بکەرەوە.');
        location.reload();
    }

    function addCustomGift() {
        const name = document.getElementById('admGiftName').value.trim();
        const icon = document.getElementById('admGiftIcon').value.trim() || '🎁';
        const price = parseInt(document.getElementById('admGiftPrice').value, 10) || 500;
        const video = document.getElementById('admGiftVideoPath').value.trim();

        if (!name) { alert('ناوی دیاری بنووسە!'); return; }

        const list = JSON.parse(localStorage.getItem('yk_admin_extra_gifts') || '[]');
        list.push({
            id: 'adm_g_' + Date.now(),
            name, icon, currency: 'diamonds', price, duration: 5, video
        });
        localStorage.setItem('yk_admin_extra_gifts', JSON.stringify(list));
        alert(`دیاری "${name}" زیادکرا بۆ سندوقی دیارییەکان!`);
    }

    function logoutAdmin() {
        localStorage.removeItem('yk_is_super_admin');
        document.getElementById('yk-admin-modal').classList.remove('open');
        alert('پەنێڵی ئەدمین قوفڵ درا.');
    }

    window.YariAdmin = {
        isAdmin,
        openSuperAdmin,
        giveMeDiamonds,
        giveMeGold,
        giveCustomDiamonds,
        saveAppearance,
        resetAppearance,
        addCustomGift,
        logoutAdmin
    };

    window.addEventListener('DOMContentLoaded', () => {
        injectAdminButtonAndModal();
        applyGlobalAdminChanges();
    });
})();