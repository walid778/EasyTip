import { showWalletDialog, loadSavedWalletNumber } from './walletDialog.js';
import { loadUserData, showPageContent, hidePageContent } from './userSection.js';
import { fetchPaymentMethods, isWalletMethod } from './paymentSection.js';
import { fetchAmountOptions, displayAmountOptionsByCurrency, setupCurrencyChangeListener } from './amountsSection.js';
import {getCSRFToken} from '../js/auth/authFetch.js';

document.addEventListener('DOMContentLoaded', () => {
    const paymentMethodsContainer = document.getElementById('paymentMethods');
    const amountOptionsContainer = document.getElementById('amountOptions');
    const profileAvatar = document.querySelector('.avatar');
    const profileName = document.querySelector('.name');
    const profileTiktokId = document.querySelector('.tiktok-id');
    const profileBox = document.querySelector('.profile-box');
    const mainContent = document.querySelector('form');
    const paymentForm = document.getElementById('paymentForm');
    const resultDiv = document.getElementById('result');

    let allAmountOptions = [];
    let selectedMethod = null;
    let walletNumber = '';
    let currentUser = null; // إضافة هذا المتغير

    // دالة لعرض النتائج
    function showResult(message, type = 'success') {
        resultDiv.textContent = message;
        resultDiv.className = `result ${type}`;
        resultDiv.style.display = 'block';
        
        // إخفاء النتيجة بعد 5 ثواني
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }

    // دالة للتحقق من صحة البيانات
    function validateForm() {
        const firstName = document.getElementById('firstName').value.trim();
        const amount = document.getElementById('amount').value.trim();
        
        // إعادة تعيين الأخطاء
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        resultDiv.style.display = 'none';

        let isValid = true;

        // التحقق من الاسم
        if (!firstName) {
            document.getElementById('error-firstName').textContent = 'يرجى إدخال اسمك';
            isValid = false;
        }

        // التحقق من المبلغ
        const amountValue = parseFloat(amount);
if (!amount || isNaN(amountValue) || amountValue < 10) {
    document.getElementById('error-amount').textContent = 'يرجى إدخال مبلغ صحيح (الحد الأدنى 10)';
    isValid = false;
}

        // التحقق من طريقة الدفع
        if (!selectedMethod) {
            showResult('يرجى اختيار طريقة الدفع أولاً', 'error');
            isValid = false;
        }

        // التحقق من رقم المحفظة إذا كانت طريقة محفظة
        if (selectedMethod && isWalletMethod(selectedMethod) && !walletNumber) {
            showResult('يرجى إدخال رقم المحفظة أولاً', 'error');
            isValid = false;
        }

        return isValid;
    }

    // دالة التعامل مع إرسال النموذج
    // دالة التعامل مع إرسال النموذج
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    try {
        // جمع البيانات من النموذج
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            description: document.getElementById('description').value.trim(),
            currency: document.querySelector('input[name="currency"]:checked').value,
            amount: parseFloat(document.getElementById('amount').value),
            paymentMethod: selectedMethod.name_en,
            paymentMethodId: selectedMethod.id, // الـ ID الصحيح الآن
            redirect: selectedMethod.redirect === "true", // تحويل لـ boolean
            walletNumber: isWalletMethod(selectedMethod) ? walletNumber : undefined,
            streamerId: currentUser.id,
            streamerUsername: currentUser.tiktokuser,
            streamerName: currentUser.name,
            streamerEmail: currentUser.email, // إضافة البريد
            streamerPhone: currentUser.phonenumber // إضافة رقم الهاتف
        };

        // إظهار حالة التحميل
        const submitBtn = paymentForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'جاري المعالجة...';
        submitBtn.disabled = true;

        const csrfToken = await getCSRFToken();
        // إرسال البيانات للـ API
        //console.log('بيانات التبرع الكاملة:', formData);
        console.log('بيانات التبرع:', {
    firstName: formData.firstName,
    amount: formData.amount,
    streamer: formData.streamerName
    // بدون بيانات حساسة
});
        
        const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.status) {
            showResult('✅ تم إنشاء عملية التبرع بنجاح!', 'success');
            
            // إذا كانت طريقة دفع محتاجة redirect
            if (formData.redirect && result.paymentUrl) {
    showResult('✅ جاري توجيهك لصفحة الدفع...', 'success');
    
    // رابط يدوي كبديل
    const redirectLink = document.createElement('a');
    redirectLink.href = result.paymentUrl;
    redirectLink.textContent = 'انقر هنا إذا لم يتم التوجيه تلقائياً';
    redirectLink.style.display = 'block';
    redirectLink.style.marginTop = '10px';
    resultDiv.appendChild(redirectLink);
    
    setTimeout(() => {
        window.location.href = result.paymentUrl;
    }, 2000);
}
            
            // تنظيف النموذج
            paymentForm.reset();
            selectedMethod = null;
            walletNumber = '';
            document.querySelectorAll('.method').forEach(m => m.classList.remove('selected'));
            document.querySelectorAll('.amount-box').forEach(b => b.classList.remove('selected'));
            
        } else {
            throw new Error(result.message || 'فشل في إنشاء التبرع');
        }

    } catch (error) {
        console.error('خطأ في إرسال التبرع:', error);
        showResult('❌ حدث خطأ أثناء معالجة التبرع. يرجى المحاولة مرة أخرى', 'error');
    } finally {
        // إعادة زر الإرسال لحالته الأصلية
        const submitBtn = paymentForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'تبرع الآن';
        submitBtn.disabled = false;
    }
}

    // دالة التعامل مع اختيار طريقة الدفع
    async function handleMethodSelect(method) {
        selectedMethod = method;

        // التحقق إذا كانت طريقة دفع محفظة
        if (isWalletMethod(method)) {
            const walletNum = await showWalletDialog();
            if (walletNum) {
                walletNumber = walletNum;
            } else {
                // إذا ألغى المستخدم، نزيل التحديد
                document.querySelectorAll('.method').forEach(m => m.classList.remove('selected'));
                selectedMethod = null;
                walletNumber = '';
            }
        } else {
            walletNumber = '';
        }
    }

    // دالة التعامل مع تغيير العملة
    function handleCurrencyChange(selectedCurrency) {
        displayAmountOptionsByCurrency(amountOptionsContainer, allAmountOptions, selectedCurrency);
    }

    // دالة لتهيئة الصفحة
    async function initializePage() {
        hidePageContent(profileBox, mainContent);
        
        try {
        // جلب CSRF token عند تحميل الصفحة
        await getCSRFToken();
    } catch (error) {
        console.warn('CSRF token initialization failed:', error);
        // يمكن للصفحة أن تعمل بدون CSRF في development
    }

        // تحميل رقم المحفظة المحفوظ
        walletNumber = loadSavedWalletNumber();

        const userLoaded = await loadUserData(profileAvatar, profileName, profileTiktokId, profileBox, mainContent);
        if (!userLoaded) {
            return;
        }

        currentUser = userLoaded;

        // إضافة event listener للنموذج
        paymentForm.addEventListener('submit', handleSubmit);

        await fetchPaymentMethods(paymentMethodsContainer, handleMethodSelect);
        
        allAmountOptions = await fetchAmountOptions(amountOptionsContainer);
        if (allAmountOptions.length > 0) {
            const selectedCurrency = document.querySelector('input[name="currency"]:checked').value;
            displayAmountOptionsByCurrency(amountOptionsContainer, allAmountOptions, selectedCurrency);
        }

        setupCurrencyChangeListener(handleCurrencyChange);


        window.addEventListener('error', (event) => {
    console.error('خطأ غير متوقع:', event.error);
    showResult('❌ حدث خطأ غير متوقع في النظام', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise مرفوض:', event.reason);
    showResult('❌ حدث خطأ في المعالجة', 'error');
});
    }

    // بدء التهيئة
    initializePage();
});