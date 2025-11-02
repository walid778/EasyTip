import { showDialog, showAlert } from '../js/dialog/dialog.js';

export function showWalletDialog() {
    return new Promise(async (resolve) => {
        const savedWalletNumber = localStorage.getItem('walletNumber') || '';

        // عرض الـ Dialog
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

        // فلترة فورية للأرقام فقط ومنع تجاوز 11 رقم
        if (walletInput) {
            walletInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
            });
        }

        if (confirmed) {
            const number = walletInput ? walletInput.value.trim() : '';

            // التحقق من إدخال الرقم
            if (!number) {
                await showAlert({
                    title: '⚠️ تنبيه',
                    message: 'يرجى إدخال رقم المحفظة أولاً',
                    buttonText: 'حسناً'
                });
                resolve(null);
                return;
            }

            // التحقق من طول الرقم
            if (number.length < 10 || number.length > 11) {
                await showAlert({
                    title: '⚠️ خطأ',
                    message: 'رقم المحفظة يجب أن يكون مكونًا من 10 إلى 11 رقمًا فقط',
                    buttonText: 'حسناً'
                });
                resolve(null);
                return;
            }

            // التحقق من أن الرقم يبدأ بـ 01
            if (!number.startsWith('01')) {
                await showAlert({
                    title: '⚠️ خطأ في الرقم',
                    message: 'رقم المحفظة يجب أن يبدأ بـ 01 (مثل 010 أو 011 أو 012 أو 015)',
                    buttonText: 'حسناً'
                });
                resolve(null);
                return;
            }

            // حفظ الرقم إذا كان صحيح
            localStorage.setItem('walletNumber', number);
            resolve(number);
        } else {
            resolve(null);
        }
    });
}

export function loadSavedWalletNumber() {
    return localStorage.getItem('walletNumber') || '';
}

export function clearWalletNumber() {
    localStorage.removeItem('walletNumber');
}
