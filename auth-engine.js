// auth-engine.js - سیستەمی چوونەژوورەوە بە Google و ئیمەیڵ و پاسۆرد
(function () {
    if (!window.firebase || !firebase.auth) return;
    const auth = firebase.auth();
    const db = firebase.database();

    // پاراستنی داتای یاریزان لە Firebase و مۆبایل
    async function syncUserAccount(user, customName = null) {
        if (!user) return;
        const uid = user.uid;
        const playerRef = db.ref(`players/${uid}`);
        const snap = await playerRef.once('value');
        const oldData = snap.val() || {};

        const finalName = customName || user.displayName || oldData.name || localStorage.getItem('yk_player_name') || 'یاریزان';
        const finalAvatar = user.photoURL || oldData.avatar || localStorage.getItem('yk_player_avatar') || 'images.png/controller.png';

        localStorage.setItem('yk_player_uid', uid);
        localStorage.setItem('yk_player_name', finalName);
        localStorage.setItem('yk_player_avatar', finalAvatar);
        localStorage.setItem('yk_user_email', user.email || '');

        await playerRef.update({
            uid: uid,
            name: finalName,
            email: user.email || '',
            avatar: finalAvatar,
            lastLogin: Date.now()
        });

        // هێنانەوەی باڵانسی گۆڵد و ئەڵماس ئەگەر پێشتر هەیبووبێت
        if (oldData.wallet) {
            localStorage.setItem('yk_wallet_gold', oldData.wallet.gold ?? 7000);
            localStorage.setItem('yk_wallet_diamonds', oldData.wallet.diamonds ?? 40);
            if (window.YariWallet) YariWallet.updateWalletUI();
        }
    }

    // چوونەژوورەوە بە Google
    async function loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const res = await auth.signInWithPopup(provider);
            await syncUserAccount(res.user);
            closeAuthModal();
            location.reload();
        } catch (err) {
            showAuthErr('هەڵە لە چوونەژوورەوەی Google: ' + err.message);
        }
    }

    // دروستکردنی هەژمار یان چوونەژوورەوە بە ئیمەیڵ و پاسۆرد
    async function loginOrRegisterEmail(isRegister) {
        const email = (document.getElementById('ykAuthEmail').value || '').trim();
        const pass = (document.getElementById('ykAuthPass').value || '').trim();
        const name = (document.getElementById('ykAuthName')?.value || '').trim();

        if (!email || pass.length < 6) {
            showAuthErr('تکایە ئیمەیڵێکی دروست و پاسۆردێکی لانیکەم ٦ پیتی بنووسە!');
            return;
        }

        try {
            if (isRegister) {
                const res = await auth.createUserWithEmailAndPassword(email, pass);
                if (name) await res.user.updateProfile({ displayName: name });
                await syncUserAccount(res.user, name || email.split('@')[0]);
            } else {
                const res = await auth.signInWithEmailAndPassword(email, pass);
                await syncUserAccount(res.user);
            }
            closeAuthModal();
            location.reload();
        } catch (err) {
            showAuthErr('هەڵە: ئیمەیڵ یان پاسۆرد هەڵەیە، یان پێشتر تۆمار کراوە.');
        }
    }

    async function logoutAccount() {
        await auth.signOut();
        localStorage.removeItem('yk_player_uid');
        localStorage.removeItem('yk_user_email');
        alert('لە هەژمارەکەت چوویتە دەرەوە.');
        location.reload();
    }

    function showAuthErr(msg) {
        const el = document.getElementById('ykAuthError');
        if (el) el.innerText = msg;
    }

    function openAuthModal() {
        ensureAuthModal();
        document.getElementById('ykAuthModal').classList.add('open');
    }

    function closeAuthModal() {
        const m = document.getElementById('ykAuthModal');
        if (m) m.classList.remove('open');
    }

    function ensureAuthModal() {
        if (document.getElementById('ykAuthModal')) return;
        const style = document.createElement('style');
        style.innerHTML = `
            #ykAuthModal {
                position: fixed; inset: 0; background: rgba(4, 2, 14, 0.88);
                backdrop-filter: blur(12px); z-index: 99999; display: none;
                align-items: center; justify-content: center; padding: 16px;
                direction: rtl; font-family: 'Vazirmatn', sans-serif;
            }
            #ykAuthModal.open { display: flex; }
            .yk-auth-box {
                width: 100%; max-width: 390px; background: linear-gradient(180deg, #1a0d40 0%, #0b051f 100%);
                border: 2px solid #ffb800; border-radius: 26px; padding: 22px; color: #fff; text-align: center;
            }
            .yk-auth-inp {
                width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                border-radius: 14px; padding: 11px 14px; color: #fff; font-size: 13px;
                margin-bottom: 10px; outline: none; font-family: inherit;
            }
            .yk-google-btn {
                width: 100%; background: #fff; color: #111; border: none; border-radius: 16px;
                padding: 12px; font-weight: 900; font-size: 14px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px;
            }
            .yk-gold-submit {
                width: 100%; background: linear-gradient(135deg, #ffd000, #ff8800); color: #1a0f00;
                border: none; border-radius: 16px; padding: 11px; font-weight: 900; font-size: 14px;
                cursor: pointer; margin-bottom: 8px; font-family: inherit;
            }
        `;
        document.head.appendChild(style);

        const div = document.createElement('div');
        div.id = 'ykAuthModal';
        div.onclick = (e) => { if (e.target === div) closeAuthModal(); };
        div.innerHTML = `
            <div class="yk-auth-box">
                <div style="font-size:19px; font-weight:900; color:#ffd000; margin-bottom:6px;">👑 هەژماری یاری کوردی</div>
                <div style="font-size:12px; color:#d8b4fe; margin-bottom:16px;">بچۆ ژوورەوە تا گۆڵد و ئەڵماس و ئاستەکەت پارێزراو بن</div>

                <button class="yk-google-btn" onclick="YariAuth.loginWithGoogle()">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20">
                    <span>چوونەژوورەوە بە Google</span>
                </button>

                <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;">یان بە ئیمەیڵ و پاسۆرد</div>
                <input type="text" id="ykAuthName" class="yk-auth-inp" placeholder="ناوی یاریزان (تەنها بۆ هەژماری نوێ)">
                <input type="email" id="ykAuthEmail" class="yk-auth-inp" placeholder="ئیمەیڵ (Email)">
                <input type="password" id="ykAuthPass" class="yk-auth-inp" placeholder="پاسۆرد (لانیکەم ٦ پیت)">

                <div id="ykAuthError" style="color:#fb7185; font-size:11.5px; font-weight:800; margin-bottom:8px;"></div>

                <button class="yk-gold-submit" onclick="YariAuth.loginOrRegisterEmail(false)">چوونەژوورەوە 🔑</button>
                <button class="yk-gold-submit" style="background:rgba(168,85,247,0.3); color:#fff; border:1px solid #a855f7;" onclick="YariAuth.loginOrRegisterEmail(true)">دروستکردنی هەژماری نوێ ✨</button>
                <button onclick="YariAuth.closeAuthModal()" style="background:none; border:none; color:#94a3b8; font-size:12px; margin-top:6px; cursor:pointer;">داخستن</button>
            </div>
        `;
        document.body.appendChild(div);
    }

   auth.onAuthStateChanged((user) => {
        if (user) {
            syncUserAccount(user);
            closeAuthModal();
        } else {
            openAuthModal();
        }
    });

    window.YariAuth = {
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginOrRegisterEmail,
        logoutAccount
    };
})();