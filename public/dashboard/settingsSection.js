import { getCurrentUser, logout } from '../js/auth/authFetch.js';
import { showToast } from '../js/toast.js';
import { uploadUserAvatar, updateUserProfile, deleteUserAccount } from '../js/api/userAPI.js';
import { showDialog, showAlert } from '../js/dialog/dialog.js';

// دالة رئيسية لإعداد قسم الإعدادات
export function setupSettingsSection(user) {
  // عرض بيانات المستخدم في Settings
  populateUserData(user);
  
  // إعداد التعامل مع الصورة الشخصية
  setupAvatarHandling(user);
  
  // إعداد تحديث الملف الشخصي
  setupProfileUpdate(user);
  
  // إعداد حذف الحساب
  setupAccountDeletion();
  
  // إعداد التبديل بين الثيمات
  setupThemeToggle();
  
  // إعداد تسجيل الخروج
  setupLogout();
}

// دالة لملء بيانات المستخدم في النموذج
function populateUserData(user) {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const tiktokUserInput = document.getElementById('tiktokuser');
  const tiktokLinkInput = document.getElementById('tiktoklink');
  const phonenumberInput = document.getElementById('phonenumber');

  if (phonenumberInput) phonenumberInput.value = user.phonenumber || '';
  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (tiktokUserInput) tiktokUserInput.value = user.tiktokuser || '';
  if (tiktokLinkInput) tiktokLinkInput.value = user.tiktoklink || '';
}

// دالة للتعامل مع الصورة الشخصية
function setupAvatarHandling(user) {
  const avatarPreview = document.getElementById('settings-avatar-preview');
  const avatarImg = document.getElementById('settings-avatar-img');
  const avatarInput = document.getElementById('settings-avatar-input');
  const avatarActions = document.getElementById('avatar-actions');
  const saveAvatarBtn = document.getElementById('save-avatar');
  const discardAvatarBtn = document.getElementById('discard-avatar');

  if (!avatarPreview || !avatarImg || !avatarInput) return;

  let originalAvatar = user.avatar_url || '';
  let newAvatarFile = null;

  // عرض الصورة الحالية
  if (originalAvatar) {
    avatarImg.src = originalAvatar;
    avatarPreview.classList.add('has-image');
  }

  // فتح محدد الملفات عند النقر على المعاينة
  avatarPreview.addEventListener('click', () => {
    avatarInput.click();
  });

  // عند اختيار صورة جديدة
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        showToast('يرجى اختيار ملف صورة فقط', 'error');
        return;
      }
      
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الصورة يجب أن يكون أقل من 5MB', 'error');
        return;
      }

      newAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        avatarImg.src = event.target.result;
        avatarPreview.classList.add('has-image');
        if (avatarActions) avatarActions.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  });

  // عند الضغط على إلغاء
  if (discardAvatarBtn) {
    discardAvatarBtn.addEventListener('click', () => {
      newAvatarFile = null;
      avatarInput.value = '';
      avatarImg.src = originalAvatar || '';
      if (!originalAvatar) avatarPreview.classList.remove('has-image');
      if (avatarActions) avatarActions.style.display = 'none';
    });
  }

  // عند الضغط على حفظ
  if (saveAvatarBtn) {
    saveAvatarBtn.addEventListener('click', async () => {
      if (!newAvatarFile) {
        showToast('اختر صورة أولاً', 'error');
        return;
      }

      try {
        const newAvatarURL = URL.createObjectURL(newAvatarFile);

        // تحديث فوري في الواجهة
        avatarImg.src = newAvatarURL;
        avatarPreview.classList.add('has-image');
        if (avatarActions) avatarActions.style.display = 'none';
        avatarInput.value = '';

        // تحديث الصورة في الـ header
        const headerAvatar = document.getElementById('user-avatar');
        if (headerAvatar) headerAvatar.src = newAvatarURL;

        // رفع الصورة للسيرفر
        await uploadUserAvatar(newAvatarFile);
        showToast('✅ تم تحديث الصورة الشخصية بنجاح', 'success');
        
        // تحديث الصورة الأصلية
        originalAvatar = newAvatarURL;

      } catch (err) {
        console.error('Avatar upload failed:', err);
        showToast('❌ فشل في رفع الصورة', 'error');
      }
    });
  }
}

// دالة لتحديث الملف الشخصي
function setupProfileUpdate(user) {
  const profileForm = document.getElementById('profile-form');
  
  if (!profileForm) return;

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const tiktokuser = document.getElementById('tiktokuser').value.trim();
    const tiktoklink = document.getElementById('tiktoklink').value.trim();
    const phonenumber = document.getElementById('phonenumber').value.trim();  

    if (!name || !email || !tiktokuser) {
      showToast('❌ الرجاء ملء الحقول المطلوبة', 'error');
      return;
    }

    const userData = { name, email, tiktokuser, tiktoklink, phonenumber };

    try {
      const updatedUser = await updateUserProfile(userData);
      
      if (!updatedUser) {
        showToast('❌ لم يتم استلام بيانات المستخدم المحدثة', 'error');
        return;
      }

      // تحديث بيانات الـ header فورًا
      updateHeaderData(updatedUser);

      // إعادة تحميل الصفحة إذا تغير اسم المستخدم
      if (updatedUser.tiktokuser) {
        const currentUsername = window.location.pathname.split('/').pop();
        if (updatedUser.tiktokuser !== currentUsername) {
          showToast('✅ تم تحديث البيانات بنجاح', 'success');
          setTimeout(() => {
            window.location.href = `/dashboard/${updatedUser.tiktokuser}`;
          }, 1500);
        } else {
          showToast('✅ تم تحديث البيانات بنجاح', 'success');
        }
      }

    } catch (error) {
      console.error('Profile update error:', error);
      showToast('❌ فشل تحديث البيانات', 'error');
    }
  });
}

// دالة لتحديث بيانات الـ header
function updateHeaderData(updatedUser) {
  const userNameEl = document.getElementById('user-name');
  const userTiktokNameEl = document.getElementById('user-tiktokuser');
  const userEmailEl = document.getElementById('user-email');
  const userTiktokEl = document.getElementById('user-tiktok');
  const userPhoneEl = document.getElementById('user-phonenumber');

  if (userPhoneEl && updatedUser.phonenumber) { 
    userPhoneEl.textContent = updatedUser.phonenumber;
  }
  if (userNameEl && updatedUser.name) userNameEl.textContent = updatedUser.name;
  if (userTiktokNameEl && updatedUser.tiktokuser) userTiktokNameEl.textContent = updatedUser.tiktokuser;
  if (userEmailEl && updatedUser.email) userEmailEl.textContent = `📧 ${updatedUser.email}`;
  if (userTiktokEl && updatedUser.tiktoklink) {
    userTiktokEl.innerHTML = `🎵 <a href="${updatedUser.tiktoklink}" target="_blank">${updatedUser.tiktoklink}</a>`;
  }
}

// دالة لحذف الحساب
function setupAccountDeletion() {
  const deleteAccountBtn = document.getElementById('delete-account');
  
  if (!deleteAccountBtn) return;

  deleteAccountBtn.addEventListener('click', async () => {
    const confirmed = await showDialog({
      title: '⚠️ حذف الحساب',
      message: 'هل أنت متأكد أنك تريد حذف الحساب نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه.',
      confirmText: 'نعم، احذف الحساب',
      cancelText: 'إلغاء',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const result = await deleteUserAccount();
      if (result) {
        await showAlert({
          title: '✅ تم الحذف',
          message: 'تم حذف حسابك بنجاح. جاري توجيهك إلى الصفحة الرئيسية...',
          buttonText: 'حسناً'
        });
        
        await logout();
        window.location.href = '/home.html';
      }
    } catch (error) {
      console.error(error);
      showToast('❌ فشل حذف الحساب', 'error');
    }
  });
}

// دالة للتبديل بين الثيمات
function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme) {
    body.setAttribute("data-theme", savedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = body.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }
}

// دالة لتسجيل الخروج
function setupLogout() {
  const logoutBtn = document.getElementById("logout");
  
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await logout();
      showToast('تم تسجيل الخروج', 'success');
      window.location.href = '/home.html';
    });
  }
}