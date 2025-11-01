import { API } from '../../config/apiconfig.js';

export async function fetchAmountOptions(amountOptionsContainer) {
    try {
        let username;

        const urlParams = new URLSearchParams(window.location.search);
        username = urlParams.get('username');

        if (!username) {
            const pathParts = window.location.pathname.split('/');
            username = pathParts.pop() || pathParts.pop();
        }

        if (username && username.startsWith('@')) {
            username = username.slice(1);
        }

        if (!username) {
            amountOptionsContainer.innerHTML = '<p>لا يمكن تحميل المبالغ - اسم المستخدم غير متاح</p>';
            return [];
        }

        const response = await fetch(`${API.AMOUNT.GET_BY_USER}/${username}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.status && data.amounts && data.amounts.length) {
            return data.amounts;
        } else {
            amountOptionsContainer.innerHTML = '<p>لا توجد مبالغ مقترحة</p>';
            return [];
        }
    } catch (err) {
        console.error('خطأ في جلب المبالغ المقترحة:', err);
        amountOptionsContainer.innerHTML = '<p>خطأ في تحميل المبالغ المقترحة</p>';
        return [];
    }
}

export function displayAmountOptionsByCurrency(amountOptionsContainer, allAmountOptions, selectedCurrency) {
    if (!allAmountOptions.length) {
        amountOptionsContainer.innerHTML = '<p>لا توجد مبالغ مقترحة</p>';
        return;
    }

    const filteredAmounts = allAmountOptions.filter(option =>
        option.currency === selectedCurrency
    );

    amountOptionsContainer.innerHTML = '';

    if (filteredAmounts.length === 0) {
        amountOptionsContainer.innerHTML = `<p>لا توجد مبالغ مقترحة للعملة ${selectedCurrency}</p>`;
        return;
    }

    filteredAmounts.forEach(option => {
        const box = document.createElement('div');
        box.className = 'amount-box';

        const amount = parseFloat(option.amount) || 0;
        const currency = option.currency || 'EGP';
        const currencySymbol = currency === 'USD' ? '$' : 'ج.م';

        box.textContent = amount + ' ' + currencySymbol;

        box.addEventListener('click', () => {
            document.getElementById('amount').value = amount;
            document.querySelectorAll('.amount-box').forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
        });

        amountOptionsContainer.appendChild(box);
    });
}

export function setupCurrencyChangeListener(onCurrencyChange) {
    const currencyRadios = document.querySelectorAll('input[name="currency"]');

    currencyRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                onCurrencyChange(e.target.value);
            }
        });
    });
}