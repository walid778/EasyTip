const axios = require('axios');
const dotenv = require('dotenv');
const db = require('../config/db');
const logger = require('../utils/logger');

dotenv.config();

const GetPaymentMethod = async (req, res) => {
    try {
        const response = await axios.get(process.env.PAYMENT_METHODS_URL, {
            headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({
            status: true,
            paymentMethods: response.data.data
        });
    } catch (error) {
        logger.error('Error fetching payment methods', {
            status: error.response?.status,
            message: error.message
        });
        res.status(500).json({
            status: false,
            message: 'Failed to fetch payment methods',
            error: error.response ? error.response.data : error.message
        });
    }
};

const CreatePayment = async (req, res) => {
    let donationId;

    const {
        firstName,
        description,
        currency,
        amount,
        paymentMethod,
        paymentMethodId,
        redirect,
        walletNumber,
        streamerId,
        streamerUsername,
        streamerName,
        streamerEmail,
        streamerPhone
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!firstName || !currency || !amount || !paymentMethod || !paymentMethodId || !streamerId) {
        logger.warn('بيانات ناقصة في طلب الدفع', {
            hasFirstName: !!firstName,
            hasCurrency: !!currency,
            hasAmount: !!amount,
            hasPaymentMethod: !!paymentMethod,
            hasPaymentMethodId: !!paymentMethodId,
            hasStreamerId: !!streamerId
        });
        return res.status(400).json({
            status: false,
            message: 'بيانات ناقصة: يرجى التأكد من إدخال جميع البيانات المطلوبة'
        });
    }

    try {
        // 1. حفظ التبرع في قاعدة البيانات
        const requiresRedirect = redirect === true || redirect === 'true';
        const parsedAmount = parseFloat(amount);
        const parsedPaymentMethodId = parseInt(paymentMethodId);
        const parsedStreamerId = parseInt(streamerId);

        const query = `
            INSERT INTO donations 
            (donor_name, message, currency, amount, payment_method, payment_method_id, 
             requires_redirect, wallet_number, streamer_id, streamer_username, streamer_name, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const values = [
            firstName,
            description || '',
            currency.toUpperCase(),
            parsedAmount,
            paymentMethod,
            parsedPaymentMethodId,
            requiresRedirect,
            walletNumber || null,
            parsedStreamerId,
            streamerUsername,
            streamerName
        ];

        const [dbResult] = await db.execute(query, values);
        donationId = dbResult.insertId;

        logger.database('تم حفظ التبرع في قاعدة البيانات', { donationId });

        // 2. إنشاء فاتورة في Fawaterk
        const fawaterkData = {
            cartItems: [{
                name: `تبرع لـ ${streamerName}`,
                price: parsedAmount,
                quantity: 1
            }],
            cartTotal: parsedAmount,
            shipping: 0,
            customer: {
                first_name: firstName, // 🔴 التصحيح: استخدام اسم المتبرع وليس الستريمر
                last_name: "المتبرع", 
                email: streamerEmail || `${streamerUsername}@donations.com`,
                phone: streamerPhone ? streamerPhone.toString() : "01000000000",
                address: `تبرع لـ ${streamerName}`
            },
            currency: currency.toUpperCase(),
            payLoad: {
                donation_id: donationId,
                streamer_id: streamerId,
                streamer_name: streamerName,
                streamer_username: streamerUsername,
                donor_name: firstName,
                donor_message: description,
                wallet_number: walletNumber
            },
            sendEmail: false,
            sendSMS: false,
            redirectionUrls: {
                successUrl: `${process.env.BASE_URL}/api/payments/success/${donationId}`,
                failUrl: `${process.env.BASE_URL}/api/payments/failed/${donationId}`,
                pendingUrl: `${process.env.BASE_URL}/api/payments/pending/${donationId}`,
                webhookUrl: `${process.env.BASE_URL}/api/payments/webhook/paid`
            },
            payment_method_id: parsedPaymentMethodId
        };

        // إضافة رقم المحفظة إذا كانت طريقة محفظة
        if (walletNumber && (paymentMethod.toLowerCase().includes('wallet') || 
                             paymentMethod.toLowerCase().includes('mobile'))) {
            fawaterkData.payLoad.wallet_number = walletNumber;
        }

        logger.payment('بيانات Fawaterk المرسلة', {
            donationId: donationId,
            customer: fawaterkData.customer,
            amount: parsedAmount,
            paymentMethodId: parsedPaymentMethodId
        });

        const fawaterkResponse = await axios.post(
            'https://staging.fawaterk.com/api/v2/createInvoiceLink',
            fawaterkData,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.API_KEY}`,
                    'Content-Type': 'application/json',
                    'lang': 'ar'
                },
                timeout: 30000
            }
        );

        logger.payment('استجابة Fawaterk الكاملة', fawaterkResponse.data);

        // 🔴 التحقق من استجابة Fawaterk بشكل صحيح
        if (fawaterkResponse.data && fawaterkResponse.data.status === 'success' && fawaterkResponse.data.data) {
            
            // 🔴 التحقق من وجود البيانات المطلوبة
            if (!fawaterkResponse.data.data.url || !fawaterkResponse.data.data.invoiceKey || !fawaterkResponse.data.data.invoiceId) {
                logger.error('بيانات الفاتورة ناقصة في استجابة Fawaterk', {
                    response: fawaterkResponse.data
                });
                throw new Error('بيانات الفاتورة ناقصة من Fawaterk');
            }

            // 3. تحديث حالة التبرع
            await db.execute(
                'UPDATE donations SET invoice_url = ?, invoice_key = ?, invoice_id = ?, status = ? WHERE id = ?',
                [
                    fawaterkResponse.data.data.url,
                    fawaterkResponse.data.data.invoiceKey,
                    fawaterkResponse.data.data.invoiceId,
                    'processing', 
                    donationId
                ]
            );

            logger.success('تم إنشاء التبرع والفاتورة بنجاح', { 
                donationId, 
                invoiceId: fawaterkResponse.data.data.invoiceId,
                invoiceUrl: fawaterkResponse.data.data.url,
                customer: `${firstName} - ${fawaterkData.customer.email}`
            });

            res.status(201).json({
                status: true,
                message: 'تم إنشاء التبرع بنجاح',
                donationId: donationId,
                paymentUrl: fawaterkResponse.data.data.url,
                invoiceKey: fawaterkResponse.data.data.invoiceKey,
                invoiceId: fawaterkResponse.data.data.invoiceId
            });
        } else {
            // 🔴 تسجيل الخطأ بالتفصيل
            const errorMessage = fawaterkResponse.data?.message || 'فشل في إنشاء الفاتورة';
            logger.error('فشل في إنشاء الفاتورة في Fawaterk', {
                status: fawaterkResponse.data?.status,
                message: errorMessage,
                data: fawaterkResponse.data
            });
            throw new Error(errorMessage);
        }

    } catch (error) {
        logger.error('Error creating donation', {
            error: error.message,
            donationId: donationId,
            stack: error.stack
        });
        
        // تسجيل تفاصيل الخطأ
        if (error.response) {
            logger.error('Fawaterk API Error Details', {
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers,
                data: error.response.data
            });
        } else if (error.request) {
            logger.error('No response received from Fawaterk', {
                request: error.request
            });
        }
        
        if (donationId) {
            await db.execute(
                'UPDATE donations SET status = ? WHERE id = ?',
                ['failed', donationId]
            );
            logger.warn('تم تحديث حالة التبرع إلى failed', { donationId });
        }

        res.status(500).json({
            status: false,
            message: 'فشل في إنشاء التبرع',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            donationId: donationId // إضافة donationId للاستدلال
        });
    }
}

module.exports = {
    GetPaymentMethod,
    CreatePayment
};