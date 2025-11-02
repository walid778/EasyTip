import { showDialog, showAlert } from '../js/dialog/dialog.js';

// -------------------------
// Phone Input Restriction
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  const phoneInput = document.getElementById("signup-phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  }
});

// -------------------------
// Wallet Dialog Functions
// -------------------------
export async function showWalletDialog() {
  const savedWalletNumber = loadSavedWalletNumber();

  const confirmed = await showDialog({
    title: '📱 رقم المحفظة',
    message: `
      <div style="text-align: center; padding: 10px 0;">
        <h4 style="margin-bottom: 15px; color: #04c20e; font-size: 1.1rem;">أدخل رقم المحفظة</h4>
        <input 
          type="text" 
          id="walletInput" 
          placeholder="أدخل رقم المحفظة هنا..." 
          value="${savedWalletNumber}"
          maxlength="11"
          style="
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            text-align: center;
            direction: ltr;
            margin-bottom: 15px;
            font-family: inherit;
          "
          autocomplete="off"
        />
        <small style="color: #666; display: block; margin-top: 5px; font-size: 0.85rem;">
          سيتم استخدام هذا الرقم لإتمام عملية الدفع
        </small>
      </div>
    `,
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    type: 'info',
    html: true
  });

  const walletInput = document.getElementById('walletInput');
  if (walletInput) {
    walletInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    walletInput.focus();
  }

  if (!confirmed) return null;

  const number = walletInput ? walletInput.value.trim() : '';
  const validationError = validateWalletNumber(number);
  if (validationError) {
    await showAlert({
      title: '⚠️ خطأ',
      message: validationError,
      buttonText: 'حسناً'
    });
    return null;
  }

  localStorage.setItem('walletNumber', number);
  return number;
}

function validateWalletNumber(number) {
  if (!number) return 'يرجى إدخال رقم المحفظة أولاً';
  if (number.length < 10 || number.length > 11) return 'رقم المحفظة يجب أن يكون مكونًا من 10 إلى 11 رقمًا فقط';
  if (!number.startsWith('01')) return 'رقم المحفظة يجب أن يبدأ بـ 01 (مثل 010 أو 011 أو 012 أو 015)';
  return null;
}

export function loadSavedWalletNumber() {
  return localStorage.getItem('walletNumber') || '';
}

export function clearWalletNumber() {
  localStorage.removeItem('walletNumber');
}
