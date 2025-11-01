import { getAmounts, deleteAmount, deleteAllAmounts, addAmount } from '../js/auth/authFetch.js';
import { showToast } from '../js/toast.js';
import { showDialog } from '../js/dialog/dialog.js';

// دالة رئيسية لإعداد قسم الأموال
export function setupAmountsSection() {
  const amountForm = document.getElementById('amount-form');
  const deleteAllBtn = document.getElementById('delete-all');

  // تحميل البيانات عند فتح القسم
  const amountsSection = document.getElementById('amounts');
  if (amountsSection) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (amountsSection.classList.contains('active')) {
            loadAmounts();
          }
        }
      });
    });
    
    observer.observe(amountsSection, { attributes: true });
  }

  // إضافة مبلغ جديد
  if (amountForm) {
    amountForm.addEventListener('submit', handleAddAmount);
  }

  // حذف كل المبالغ
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', handleDeleteAllAmounts);
  }

  // تحميل البيانات أول مرة
  loadAmounts();
}

// دالة التعامل مع إضافة المبلغ
async function handleAddAmount(e) {
  e.preventDefault();
  
  const amountDollar = document.getElementById('amount-dollar').value.trim();
  const amountEgp = document.getElementById('amount-egp').value.trim();

  if (!amountDollar && !amountEgp) {
    showToast('يرجى إدخال مبلغ على الأقل', 'error');
    return;
  }

  try {
    // إضافة الدولار إذا موجود
    if (amountDollar) {
      const dollarAmount = parseFloat(amountDollar);
      if (isNaN(dollarAmount) || dollarAmount <= 0) {
        showToast('يرجى إدخال مبلغ دولار صحيح', 'error');
        return;
      }
      
      await addAmount({ amount: dollarAmount, currency: 'USD' });
      document.getElementById('amount-dollar').value = '';
    }

    // إضافة الجنيه إذا موجود
    if (amountEgp) {
      const egpAmount = parseFloat(amountEgp);
      if (isNaN(egpAmount) || egpAmount <= 0) {
        showToast('يرجى إدخال مبلغ جنيه صحيح', 'error');
        return;
      }
      
      await addAmount({ amount: egpAmount, currency: 'EGP' });
      document.getElementById('amount-egp').value = '';
    }

    showToast('تم إضافة المبالغ بنجاح', 'success');
    loadAmounts(); // إعادة تحميل القائمة
    
  } catch (error) {
    console.error('Add amount error:', error);
    showToast(error.message || 'خطأ في إضافة المبلغ', 'error');
  }
}

// دالة التعامل مع حذف كل المبالغ
async function handleDeleteAllAmounts() {
  const confirmed = await showDialog({
    title: '⚠️ حذف كل المبالغ',
    message: 'هل أنت متأكد أنك تريد حذف كل المبالغ؟ هذا الإجراء لا يمكن التراجع عنه.',
    confirmText: 'نعم، احذف الكل',
    cancelText: 'إلغاء',
    type: 'danger'
  });

  if (!confirmed) return;

  try {
    const result = await deleteAllAmounts();
    if (result.status) {
      showToast('تم حذف كل المبالغ بنجاح', 'success');
      loadAmounts();
    } else {
      showToast(result.message || 'فشل في حذف المبالغ', 'error');
    }
  } catch (error) {
    console.error('Delete all amounts error:', error);
    showToast('خطأ في حذف المبالغ', 'error');
  }
}

// دالة لجلب وعرض المبالغ
async function loadAmounts() {
  try {
    const response = await getAmounts();
    
    if (response.status) {
      displayAmounts(response.amounts);
    } else {
      showToast('فشل في تحميل البيانات', 'error');
    }
  } catch (error) {
    console.error('Load amounts error:', error);
    // لا تعرض رسالة خطأ إذا كان المستخدم غير مسجل الدخول
    if (!error.message.includes('token')) {
      showToast('خطأ في تحميل البيانات', 'error');
    }
  }
}

// دالة لعرض المبالغ في الواجهة
function displayAmounts(amounts) {
  const usdList = document.getElementById('amounts-usd-list');
  const egpList = document.getElementById('amounts-egp-list');

  if (!usdList || !egpList) return;

  // تصفية المبالغ حسب العملة
  const usdAmounts = amounts.filter(item => item.currency === 'USD');
  const egpAmounts = amounts.filter(item => item.currency === 'EGP');

  // عرض مبالغ الدولار
  if (usdAmounts.length > 0) {
    usdList.innerHTML = usdAmounts.map(item => `
      <li class="amount-item">
        <span class="amount-value">$${item.amount}</span>
        <button class="delete-btn" onclick="handleDeleteAmount(${item.id})" title="حذف المبلغ">
          🗑
        </button>
      </li>
    `).join('');
  } else {
    usdList.innerHTML = '<li class="no-data">لا توجد مبالغ بالدولار</li>';
  }

  // عرض مبالغ الجنيه
  if (egpAmounts.length > 0) {
    egpList.innerHTML = egpAmounts.map(item => `
      <li class="amount-item">
        <span class="amount-value">${item.amount} ج.م</span>
        <button class="delete-btn" onclick="handleDeleteAmount(${item.id})" title="حذف المبلغ">
          🗑
        </button>
      </li>
    `).join('');
  } else {
    egpList.innerHTML = '<li class="no-data">لا توجد مبالغ بالجنيه</li>';
  }

  // حساب وعرض المجاميع
  const usdTotal = usdAmounts.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const egpTotal = egpAmounts.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  // تحديث عناوين الأقسام بالمجاميع
  const usdTitle = usdList.parentElement.querySelector('h3');
  const egpTitle = egpList.parentElement.querySelector('h3');
  
  if (usdTitle) {
    usdTitle.textContent = `بالدولار ${usdTotal > 0 ? `(المجموع: $${usdTotal.toFixed(2)})` : ''}`;
  }
  
  if (egpTitle) {
    egpTitle.textContent = `بالجنيه ${egpTotal > 0 ? `(المجموع: ${egpTotal.toFixed(2)} ج.م)` : ''}`;
  }
}

// دالة لحذف مبلغ محدد (جعلها عامة للاستخدام في الـ HTML)
window.handleDeleteAmount = async function(amountId) {
  const confirmed = await showDialog({
    title: '🗑 حذف المبلغ',
    message: 'هل أنت متأكد أنك تريد حذف هذا المبلغ؟',
    confirmText: 'نعم، احذف',
    cancelText: 'إلغاء',
    type: 'warning'
  });

  if (!confirmed) return;

  try {
    const result = await deleteAmount(amountId);
    if (result.status) {
      showToast('تم حذف المبلغ بنجاح', 'success');
      loadAmounts();
    } else {
      showToast(result.message || 'فشل في حذف المبلغ', 'error');
    }
  } catch (error) {
    console.error('Delete amount error:', error);
    showToast('خطأ في حذف المبلغ', 'error');
  }
};