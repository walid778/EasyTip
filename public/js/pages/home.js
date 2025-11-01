import { showToast } from '../toast.js';
import { 

  login, 
  register, 
  logout, 
  getCurrentUser,
  isAuthenticated,
  forgotPassword
} from '../auth/authFetch.js';

// -------------------------
// Modal & Navigation
// -------------------------
const modal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const closeBtn = document.getElementById("close-btn");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const dashboardLink = document.getElementById("dashboard-link");

// Forms & containers
const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const forgotPasswordContainer = document.getElementById("forgot-password-container");
const signupForm = document.getElementById("signup-form");
const forgotPasswordForm = document.getElementById("forgot-password-form");

// Navigation links
const signupLink = document.getElementById("signup-link");
const loginLink = document.getElementById("login-link");
const forgotPasswordLink = document.getElementById("forgot-password-link");
const backToLogin = document.getElementById("back-to-login");

// Avatar elements
const avatarInput = document.getElementById("avatar-input");
const avatarPreview = document.getElementById("avatar-preview");
const avatarPreviewContainer = document.getElementById('avatar-preview-container');

// -------------------------
// Helper Functions
// -------------------------

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// إدارة حالة التحميل
function setLoading(formElement, isLoading) {
  const submitBtn = formElement.querySelector('button[type="submit"]');
  const inputs = formElement.querySelectorAll('input');
  
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="loading-spinner"></i> Loading...';
    inputs.forEach(input => input.disabled = true);
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'Submit';
    inputs.forEach(input => input.disabled = false);
  }
}

// حفظ النص الأصلي للأزرار
document.addEventListener('DOMContentLoaded', () => {
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  submitButtons.forEach(btn => {
    btn.setAttribute('data-original-text', btn.textContent);
  });
});

// -------------------------
// Modal controls
// -------------------------
loginBtn.addEventListener("click", () => {
  modal.style.display = "block";
  showLoginForm();
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modal) modal.style.display = "none";
});

// -------------------------
// Avatar Upload
// -------------------------
avatarInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast("Image size must be less than 5MB", "error");
    avatarInput.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    showToast("Please select an image file only", "error");
    avatarInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.src = e.target.result;
    avatarPreviewContainer.classList.add('has-image');
  };
  reader.readAsDataURL(file);
});

avatarPreviewContainer.addEventListener('dblclick', removeAvatar);
avatarPreviewContainer.addEventListener('contextmenu', (event) => { 
  event.preventDefault(); 
  removeAvatar(); 
  return false; 
});

function removeAvatar() {
  if (avatarPreviewContainer.classList.contains('has-image')) {
    avatarInput.value = '';
    avatarPreview.src = '';
    avatarPreviewContainer.classList.remove('has-image');
    showToast("Image removed", "success");
  }
}

// -------------------------
// Login Form
// -------------------------
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }

  setLoading(loginForm, true);

  try {
    const data = await login(email, password);
    if (data.status) {
      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      
      // جلب بيانات المستخدم بعد Login مباشرة
      const userData = await getCurrentUser();
      showToast(`Welcome back, ${userData.name || userData.tiktokuser}!`, "success");
      
      modal.style.display = "none";
      updateNavbar(true);
      //updateUserProfile(userData);
    } else {
      showToast(data.message, "error");
    }
  } catch (error) {
  console.error("Login error:", error);
  showToast(error.message || "Error during login", "error");
}
 finally {
    setLoading(loginForm, false);
  }
});

// -------------------------
// Signup Form
// -------------------------
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const tiktokuser = document.getElementById("signup-tiktokuser").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const tiktoklink = document.getElementById("signup-tiktok").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  const phonenumber = document.getElementById("signup-phone").value;

  const avatarFile = avatarInput.files[0];

  if (!name || !tiktokuser || !email || !tiktoklink || !password || !confirmPassword || !phonenumber) {
    showToast("Please fill all fields", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  if (phonenumber.length < 10) {
    showToast("PhoneNumber must be at least 10 characters", "error");
    return;
  }

  setLoading(signupForm, true);

  const formData = new FormData();
  formData.append('name', name);
  formData.append('tiktokuser', tiktokuser);
  formData.append('email', email);
  formData.append('tiktoklink', tiktoklink);
  formData.append('password', password);
    formData.append('phonenumber', phonenumber);
  
  
    if (avatarFile) {
    // تحقق إضافي من نوع وحجم الصورة
    if (!avatarFile.type.startsWith('image/')) {
      showToast("Please select a valid image file", "error");
      setLoading(signupForm, false);
      return;
    }
    if (avatarFile.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      setLoading(signupForm, false);
      return;
    }
    formData.append('avatar', avatarFile);
  }

  try {
    const data = await register(formData);
    if (data.status) {
      showToast("Account created successfully! You can login now.", "success");
      showLoginForm();
      // إغلاق المودال بعد 2 ثانية
      setTimeout(() => {
        modal.style.display = "none";
      }, 2000);
    } else {
      showToast(data.message, "error");
    }
  } catch (error) {
  console.error("Signup error:", error);
  showToast(error.message || "Error during account creation", "error");
}
finally {
    setLoading(signupForm, false);
  }
});

// -------------------------
// Forgot Password
// -------------------------
forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("reset-email").value.trim();

  if (!email) {
    showToast("Please enter your email", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  setLoading(forgotPasswordForm, true);

  try {
    const data = await forgotPassword(email);  // ← استخدام الدالة الجديدة

    if (data.status) {
      showToast("Password reset link sent to your email", "success");
      showLoginForm();
    } else {
      showToast(data.message, "error");
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    showToast("Error during password reset", "error");
  } finally {
    setLoading(forgotPasswordForm, false);
  }
});
// -------------------------
// Logout
// -------------------------
logoutBtn.addEventListener("click", async () => {
  try {
    const data = await logout();
    if (data && data.status) {
      showToast("Logged out successfully", "success");
    } else if (data && data.message) {
      showToast(data.message, "error");
    }
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Error during logout", "error");
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    updateNavbar(false);
    setTimeout(() => { window.location.href = "home.html"; }, 1500);
  }
});

// -------------------------
// Navigation between forms
// -------------------------
signupLink.addEventListener("click", (e) => { e.preventDefault(); showSignupForm(); });
loginLink.addEventListener("click", (e) => { e.preventDefault(); showLoginForm(); });
forgotPasswordLink.addEventListener("click", (e) => { e.preventDefault(); showForgotPasswordForm(); });
backToLogin.addEventListener("click", (e) => { e.preventDefault(); showLoginForm(); });

// -------------------------
// Form visibility
// -------------------------
function showLoginForm() {
  loginFormContainer.classList.remove('hidden-item');
  signupFormContainer.classList.add('hidden-item');
  forgotPasswordContainer.classList.add('hidden-item');
  clearForms();
}
function showSignupForm() {
  loginFormContainer.classList.add('hidden-item');
  signupFormContainer.classList.remove('hidden-item');
  forgotPasswordContainer.classList.add('hidden-item');
  clearForms();
}
function showForgotPasswordForm() {
  loginFormContainer.classList.add('hidden-item');
  signupFormContainer.classList.add('hidden-item');
  forgotPasswordContainer.classList.remove('hidden-item');
  clearForms();
}

// -------------------------
// Clear forms
// -------------------------
function clearForms() {
  loginForm.reset();
  signupForm.reset();
  forgotPasswordForm.reset();
  avatarInput.value = '';
  avatarPreview.src = '';
  avatarPreviewContainer.classList.remove('has-image');
}

// -------------------------
// Navbar state
// -------------------------
function updateNavbar(isLoggedIn) {
  if (isLoggedIn) {
    loginBtn.classList.add('hidden-item');
    logoutBtn.classList.remove('hidden-item');
    dashboardLink.classList.remove('hidden-item');
  } else {
    loginBtn.classList.remove('hidden-item');
    logoutBtn.classList.add('hidden-item');
    dashboardLink.classList.add('hidden-item');
  }
}

// -------------------------
// Initialize
// -------------------------
async function initializeApp() {
  try {
    const isAuth = await isAuthenticated();
    updateNavbar(isAuth);
  } catch (error) {
    console.error('Initialization error:', error);
    updateNavbar(false);
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);