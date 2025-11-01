import { API } from '../config/apiconfig.js';

export async function fetchPaymentMethods(paymentMethodsContainer, onMethodSelect) {
    try {
        const response = await fetch(API.PAYMENT_METHOD.GET_BY_USER, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status && data.paymentMethods.length) {
            paymentMethodsContainer.innerHTML = '';
            data.paymentMethods.forEach(method => {
                const methodDiv = document.createElement('div');
                methodDiv.className = 'method';
                methodDiv.innerHTML = `
                    <img src="${method.logo}" alt="${method.name_ar}" />
                    <p>${method.name_ar}</p>
                `;

                methodDiv.addEventListener('click', async () => {
                    document.querySelectorAll('.method').forEach(m => m.classList.remove('selected'));
                    methodDiv.classList.add('selected');
                    
                    // استدعاء الدالة الممررة من الملف الرئيسي مع البيانات المعدلة
                    await onMethodSelect({
                        id: method.paymentId, // تحويل paymentId إلى id
                        name_en: method.name_en,
                        name_ar: method.name_ar,
                        redirect: method.redirect,
                        logo: method.logo
                    });
                });

                paymentMethodsContainer.appendChild(methodDiv);
            });
        } else {
            paymentMethodsContainer.innerHTML = '<p>لا توجد طرق دفع متاحة حالياً</p>';
        }
    } catch (err) {
        console.error('خطأ في جلب طرق الدفع:', err);
        paymentMethodsContainer.innerHTML = '<p>خطأ في تحميل طرق الدفع</p>';
    }
}

// التحقق إذا كانت طريقة دفع محفظة
export function isWalletMethod(method) {
    return method.name_en && (
        method.name_en.toLowerCase().includes('wallet') ||
        method.name_en.toLowerCase().includes('cash') ||
        method.name_en.toLowerCase().includes('vodafone') ||
        method.name_en.toLowerCase().includes('orange') ||
        method.name_en.toLowerCase().includes('etisalat') ||
        method.name_en.toLowerCase().includes('mobilewallets') // إضافة هذا
    );
}