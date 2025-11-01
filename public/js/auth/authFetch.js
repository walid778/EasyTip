import { showToast } from '../toast.js';
import { API } from '../../config/apiconfig.js';

// -------------------------
// Token Management Functions
// -------------------------

export function getToken() {
  return localStorage.getItem("token");
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function setTokens(accessToken, refreshToken) {
  localStorage.setItem("token", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
}

export function getHeaders() {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// -------------------------
// Fetch with automatic token refresh - IMPROVED VERSION
// -------------------------
export async function fetchWithAuth(url, options = {}) {
  try {
    let token = getToken();
    const refreshToken = getRefreshToken();

    // إذا لا يوجد توكن، ارمي خطأ مباشرة
    if (!token && url !== API.AUTH.LOGIN && url !== API.AUTH.REGISTER) {
      throw new Error('No token available');
    }

    options.headers = options.headers || {};
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    // ⭐⭐ الإصلاح: تحقق من نوع البيانات قبل الـ stringify
    const originalBody = options.body;
    if (options.body && 
        !(options.body instanceof FormData) && 
        !(typeof options.body === 'string')) {
      options.body = JSON.stringify(options.body);
    }

    let response = await fetch(url, options);
    
    // إذا كان الرد غير ناجح، حاول تحليل JSON للتحقق من requiresRefresh
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // إذا فشل تحليل JSON، ارمي خطأ بالحالة
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // إذا طلب السيرفر تحديث التوكن
    if (data.requiresRefresh || response.status === 401) {
      console.log('Token requires refresh, attempting refresh...');
      
      if (!refreshToken) {
        clearTokens();
        throw new Error('No refresh token available');
      }

      const refreshResponse = await fetch(API.AUTH.REFRESH, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const refreshData = await refreshResponse.json();

      if (refreshData.status && refreshData.accessToken) {
        console.log('Token refreshed successfully');
        
        // حفظ التوكنات الجديدة
        setTokens(refreshData.accessToken, refreshData.refreshToken);

        // إعادة إنشاء الطلب الأصلي مع التوكن الجديد
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${refreshData.accessToken}`
          }
        };

        // إعادة تعيين الـ body بشكل صحيح
        if (originalBody) {
          if (originalBody instanceof FormData) {
            newOptions.body = originalBody;
          } else {
            newOptions.body = JSON.stringify(originalBody);
          }
        } else {
          // إذا لم يكن هناك body أصلي، تأكد من إزالته
          delete newOptions.body;
        }

        const newResponse = await fetch(url, newOptions);
        
        if (!newResponse.ok) {
          throw new Error(`HTTP error after refresh! status: ${newResponse.status}`);
        }
        
        return await newResponse.json();
      } else {
        console.error('Token refresh failed:', refreshData);
        throw new Error('Token refresh failed: ' + (refreshData.message || 'Unknown error'));
      }
    }

    // إذا كان الرد غير ناجح وليس 401، ارمي خطأ
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, message: ${data.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error("fetchWithAuth failed:", error);
    
    // إذا كان الخطأ متعلقاً بالتوكن، نظف localStorage
    if (error.message.includes('token') || error.message.includes('401') || error.message.includes('403')) {
      clearTokens();
      
      // فقط أظهر Toast إذا لم يكن المستخدم في صفحة Login
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login') && !currentPath.includes('home')) {
        showToast("Session expired, please login again", "error");
      }
    }
    
    throw error;
  }
}

// -------------------------
// Auth functions
// -------------------------
export async function login(email, password) {
  const response = await fetch(API.AUTH.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function register(formData) {
  const response = await fetch(API.AUTH.REGISTER, {
    method: "POST",
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function logout() {
  const token = getToken();
  if (!token) {
    return { status: false, message: 'No token found' };
  }

  try {
    const response = await fetch(API.AUTH.LOGOUT, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Logout request failed:', error);
    // حتى إذا فشل الطلب، نقوم بتنظيف localStorage
    clearTokens();
    return { status: false, message: 'Logout failed but local session cleared' };
  }
}

// -------------------------
// Forgot Password Function
// -------------------------
export async function forgotPassword(email) {
  const response = await fetch(API.AUTH.FORGOT_PASSWORD, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// -------------------------
// Token Validation Functions
// -------------------------

// دالة للتحقق من صحة التوكن
export async function checkTokenValidity() {
  try {
    const data = await fetchWithAuth(API.AUTH.VERIFY);
    return data.status;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// دالة للحصول على بيانات المستخدم
export async function getCurrentUser() {
  try {
    const data = await fetchWithAuth(API.AUTH.ME);
    
    if (data.status) {
      return data.user; // إرجاع بيانات المستخدم فقط
    } else {
      throw new Error(data.message || 'Failed to get user data');
    }
  } catch (error) {
    console.error('Get current user failed:', error);
    
    // إذا كان الخطأ بسبب التوكن، نظف localStorage
    if (error.message.includes('token') || error.message.includes('401') || error.message.includes('403')) {
      clearTokens();
    }
    
    throw error;
  }
}

// دالة للتحقق إذا كان المستخدم مسجل الدخول
export async function isAuthenticated() {
  const token = getToken();
  const refreshToken = getRefreshToken();
  
  if (!token || !refreshToken) {
    return false;
  }

  return await checkTokenValidity();
}

// دالة لتحديث التوكن يدوياً
export async function refreshTokens() {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(API.AUTH.REFRESH, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();

  if (data.status && data.accessToken) {
    setTokens(data.accessToken, data.refreshToken);
    return data;
  } else {
    throw new Error(data.message || 'Token refresh failed');
  }
}

// -------------------------
// Amount Management Functions
// -------------------------

// جلب كل المبالغ
export async function getAmounts() {
  try {
    const data = await fetchWithAuth(`${API.AMOUNT.GET_MY_AMOUNT}`);
    return data;
  } catch (error) {
    console.error('Get amounts error:', error);
    throw error;
  }
}

// إضافة مبلغ جديد
export async function addAmount(amountData) {
  try {
    const data = await fetchWithAuth(`${API.AMOUNT.ADD_AMOUNT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(amountData)
    });
    return data;
  } catch (error) {
    console.error('Add amount error:', error);
    throw error;
  }
}

// حذف مبلغ محدد
export async function deleteAmount(amountId) {
  try {
    // ⭐ استخدام المسار الصحيح مع الباراميتر
    const data = await fetchWithAuth(`${API.AMOUNT.DELETE_AMOUNT}/${amountId}`, {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    console.error('Delete amount error:', error);
    throw error;
  }
}

// حذف كل المبالغ
export async function deleteAllAmounts() {
  try {
    const data = await fetchWithAuth(`${API.AMOUNT.DELETE_ALL}`, {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    console.error('Delete all amounts error:', error);
    throw error;
  }
}

// دالة لجلب CSRF Token من الخادم
// دالة لجلب CSRF Token من الخادم
export async function getCSRFToken() {
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'include' // ⭐ مهم لإرسال cookies
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status && data.csrfToken) {
            return data.csrfToken;
        } else {
            throw new Error('Invalid CSRF token response');
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        // في حالة failure، يمكنك استخدام fallback أو إعادة المحاولة
        return 'fallback-csrf-token-' + Date.now();
    }
}