import { fetchWithAuth } from '../auth/authFetch.js';
import { API } from '../../config/apiconfig.js';
import { showToast } from '../toast.js';

/**
 * رفع أو تحديث صورة البروفايل
 * @param {File} avatarFile
 */
export async function uploadUserAvatar(avatarFile) {
  const formData = new FormData();
  formData.append('avatar', avatarFile);

  try {
    const response = await fetchWithAuth(API.USER.UPLOAD_AVATAR, {
      method: 'POST',
      body: formData,
    });

    if (response.status) {
      showToast('✅ تم تحديث الصورة بنجاح', 'success');
      return response.avatar;
    } else {
      showToast(response.message || 'حدث خطأ أثناء رفع الصورة', 'error');
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('uploadUserAvatar error:', error);
    showToast('❌ فشل الاتصال بالسيرفر', 'error');
    throw error;
  }
}

/**
 * تحديث بيانات المستخدم (الاسم، البريد، ...إلخ)
 * @param {Object} userData
 */
export async function updateUserProfile(userData) {
  try {
    const response = await fetchWithAuth(API.USER.UPDATE_PROFILE, {
      method: 'PUT',
      body: userData,
    });

    console.log('Update profile response:', response);

    if (response.status) {
      showToast('✅ تم تحديث الملف الشخصي بنجاح', 'success');
      // بعد التحديث الناجح، نجلب بيانات المستخدم المحدثة
      const userResponse = await fetchWithAuth(API.AUTH.ME);
      return userResponse.user || userResponse;
    } else {
      showToast(response.message || 'حدث خطأ أثناء التحديث', 'error');
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('updateUserProfile error:', error);
    showToast('❌ فشل الاتصال بالسيرفر', 'error');
    throw error;
  }
}

/**
 * حذف حساب المستخدم
 */
export async function deleteUserAccount() {
  try {
    const response = await fetchWithAuth(API.USER.DELETE_ACCOUNT, {
      method: 'DELETE',
    });

    if (response.status) {
      showToast('🧨 تم حذف الحساب بنجاح', 'success');
      return true;
    } else {
      showToast(response.message || 'حدث خطأ أثناء حذف الحساب', 'error');
      return false;
    }
  } catch (error) {
    console.error('deleteUserAccount error:', error);
    showToast('❌ فشل الاتصال بالسيرفر', 'error');
    return false;
  }
}
