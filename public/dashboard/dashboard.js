import { getCurrentUser, logout, isAuthenticated, getHeaders  } from '../js/auth/authFetch.js';
import { showToast } from '../js/toast.js';
import { setupAmountsSection } from './amountsSection.js';
import { setupSettingsSection } from './settingsSection.js';
import {API} from '../config/apiconfig.js';

// دالة لإعداد القائمة الموبايل
function setupMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');
  const menuLinks = document.querySelectorAll('.menu li a');

  // فتح/إغلاق القائمة
  mobileMenuBtn.addEventListener('click', function() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  });

  // إغلاق القائمة عند النقر على overlay
  sidebarOverlay.addEventListener('click', function() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  // إغلاق القائمة عند النقر على رابط
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // إغلاق القائمة عند تغيير حجم النافذة
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // إغلاق القائمة عند النقر خارجها
  document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('active') &&
        !sidebar.contains(event.target) && 
        !mobileMenuBtn.contains(event.target)) {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// دالة لإعداد التنقل بين الأقسام
function setupNavigation() {
  const menuLinks = document.querySelectorAll(".menu li a");
  const sections = document.querySelectorAll(".section");

  menuLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // إزالة النشاط من جميع الأقسام والروابط
      sections.forEach(sec => sec.classList.remove("active"));
      menuLinks.forEach(l => l.classList.remove("active"));

      // إضافة النشاط للقسم والرابط المحدد
      const sectionId = link.getAttribute("data-section");
      if (sectionId) {
        document.getElementById(sectionId).classList.add("active");
        link.classList.add("active");
      }
    });
  });
}

async function initDashboard() {
  try {
    // التحقق من المصادقة
    const auth = await isAuthenticated();
    if (!auth) {
      showToast('يرجى تسجيل الدخول أولاً', 'error');
      window.location.href = '/home.html';
      return;
    }

    // جلب بيانات المستخدم
    const user = await getCurrentUser();
    
    if (!user) {
      showToast('فشل في تحميل بيانات المستخدم', 'error');
      window.location.href = '/home.html';
      return;
    }

    const currentUsername = window.location.pathname.split('/').pop();
    
     // التحقق من الوصول باستخدام API منفصل
    const accessResponse = await fetch(`/api/dashboard/access/${currentUsername}`, {
      headers: getHeaders()
    });
    
    const accessData = await accessResponse.json();
    
    if (!accessData.status) {
      showToast('🚫 لا يمكنك الوصول إلى لوحة مستخدم آخر', 'error');
      window.location.href = `/dashboard/${user.tiktokuser}`;
      return;
    }

    // إعداد القائمة الموبايل والتنقل
    setupMobileMenu();
    setupNavigation();
    setupAmountsSection();
    setupSettingsSection(user);
    
    // عرض بيانات المستخدم في header
    displayHeaderData(user);

    updateDonationURL(user);

  } catch (err) {
    console.error(err);
    showToast('حدث خطأ أثناء تحميل البيانات', 'error');
    window.location.href = '/home.html';
  }
}

// دالة لعرض بيانات المستخدم في الـ header
function displayHeaderData(user) {
  document.querySelector('#user-tiktokuser').textContent = user.tiktokuser;
  
  const userNameEl = document.getElementById('user-name');
  const userTiktokNameEl = document.getElementById('user-tiktokuser');
  const userEmailEl = document.getElementById('user-email');
  const userTiktokEl = document.getElementById('user-tiktok');
  const userAvatarEl = document.getElementById('user-avatar');
  const userPhoneEl = document.getElementById('user-phonenumber');

  if (userPhoneEl) userPhoneEl.textContent = user.phonenumber || 'لم يتم إضافة رقم';
  if (userNameEl) userNameEl.textContent = user.name;
  if (userTiktokNameEl) userTiktokNameEl.textContent = user.tiktokuser;
  if (userEmailEl) userEmailEl.textContent = `📧 ${user.email}`;
  if (userTiktokEl) userTiktokEl.innerHTML = `🎵 <a href="${user.tiktoklink}" target="_blank">${user.tiktoklink}</a>`;
  if (user.avatar_url && userAvatarEl) {
    userAvatarEl.src = user.avatar_url;
    userAvatarEl.style.display = 'block';
  } else if (userAvatarEl) {
    userAvatarEl.style.display = 'none';
  }
}

// دالة لتحديث وعرض رابط التبرع
function updateDonationURL(user) {
  const urlElement = document.getElementById('overlay-url');
  const copyBtn = document.getElementById('copy-url-btn');

  if (!urlElement || !copyBtn) return;

  // 1. تحديث الرابط بالنص الفعلي
  const donationURL = `${API.DONATION_LINK.GET}/${user.tiktokuser}`;
  urlElement.textContent = donationURL;

  // 2. إعداد وظيفة النسخ
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(donationURL)
      .then(() => {
        showToast('✅ تم نسخ الرابط بنجاح', 'success');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('❌ فشل في نسخ الرابط', 'error');
      });
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);