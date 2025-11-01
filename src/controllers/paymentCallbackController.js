const db = require('../config/db');
const verifyWebhookSignature = require('../middlewares/verifyWebhook');
const logger = require('../utils/logger');

const PaymentCallbackController = {
    // معالجة الدفع الناجح
    handleSuccess: async (req, res) => {
        try {
            const { donationId } = req.params;
            await db.execute('UPDATE donations SET status = ? WHERE id = ?', ['completed', donationId]);
             logger.success('تم تحديث التبرع لـ completed', { donationId });
            res.redirect(`/payments/success?donation=${donationId}`);
        } catch (error) {
            logger.error('Error in handleSuccess', error);
            res.redirect('/payments/error.html');
        }
    },

    // معالجة الدفع الفاشل
    handleFailed: async (req, res) => {
        try {
            const { donationId } = req.params;
            await db.execute('UPDATE donations SET status = ? WHERE id = ?', ['failed', donationId]);
             logger.warn('تم تحديث التبرع لـ failed', { donationId });
            res.redirect(`/payments/failed?donation=${donationId}`);
        } catch (error) {
            logger.error('Error in handleFailed', error);
            res.redirect('/payments/error.html');
        }
    },

    // معالجة الدفع المعلق
    handlePending: async (req, res) => {
        try {
            const { donationId } = req.params;
            await db.execute('UPDATE donations SET status = ? WHERE id = ?', ['pending', donationId]);
            logger.info('تم تحديث التبرع لـ pending', { donationId });
            res.redirect(`/payments/pending?donation=${donationId}`);
        } catch (error) {
            logger.error('Error in handlePending', error);
            res.redirect('/payments/error.html');
        }
    },

    // صفحة الخطأ العامة
    handleError: async (req, res) => {
        try {
            res.send(`
                <!DOCTYPE html>
                <html dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>خطأ</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f0f0; }
                        .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="error">❌ حدث خطأ في النظام</div>
                    <p>يرجى المحاولة مرة أخرى لاحقاً</p>
                    <a href="/">العودة للصفحة الرئيسية</a>
                </body>
                </html>
            `);
        } catch (error) {
            logger.error('Error in handleError', error);
            res.status(500).send('خطأ في الخادم');
        }
    },

    // معالجة ويب هوك الدفع الناجح (مع Middleware)
    handleWebhook: [
        verifyWebhookSignature,
        async (req, res) => {
            try {
                const webhookData = req.body;

                // التحقق من صحة البيانات
                const requiredFields = ['invoice_id', 'status', 'amount', 'currency'];
                for (const field of requiredFields) {
                    if (!webhookData[field]) {
                        logger.warn(`Missing required field in webhook: ${field}`, webhookData);
                        return res.status(400).json({ error: `Missing field: ${field}` });
                    }
                }

                if (webhookData.amount <= 0) {
                    logger.warn('Invalid amount in webhook', { amount: webhookData.amount });
                    return res.status(400).json({ error: 'Invalid amount' });
                }

                logger.webhook('استلام ويب هوك من Fawaterk', {
                    invoiceId: webhookData.invoice_id,
                    status: webhookData.status,
                    amount: webhookData.amount,
                    paymentMethod: webhookData.payment_method
                });

                // Idempotency Key
                const idempotencyKey = req.headers['idempotency-key'] || webhookData.id || webhookData.invoice_id;
                if (idempotencyKey) {
                    try {
                        const [processed] = await db.execute(
                            'SELECT id FROM processed_webhooks WHERE idempotency_key = ?',
                            [idempotencyKey.toString()]
                        );
                        if (processed.length > 0) {
                            logger.warn('Webhook already processed', { idempotencyKey });
                            return res.status(200).json({ status: 'success', message: 'Already processed' });
                        }
                    } catch (error) {
                        logger.error('Error checking idempotency', error);
                    }
                }

                // تحديث حالة التبرع
                if (webhookData.status === 'paid' && webhookData.invoice_id) {
                    const [existing] = await db.execute(
                        'SELECT status FROM donations WHERE invoice_id = ?', 
                        [webhookData.invoice_id.toString()]
                    );
                    
                    if (existing.length > 0 && existing[0].status === 'completed') {
                        logger.warn('التبرع مكتمل مسبقاً', { invoiceId: webhookData.invoice_id });
                        
                        if (idempotencyKey) {
                            await this.saveIdempotencyKey(idempotencyKey);
                        }
                        
                        return res.status(200).json({ status: 'success', message: 'Already completed' });
                    }

                    const [result] = await db.execute(
                        'UPDATE donations SET status = ? WHERE invoice_id = ?',
                        ['completed', webhookData.invoice_id.toString()]
                    );
                    
                    if (result.affectedRows > 0) {
                        logger.success('تم تحديث التبرع عبر ويب هوك', { invoiceId: webhookData.invoice_id });
                        
                        if (idempotencyKey) {
                            await this.saveIdempotencyKey(idempotencyKey);
                        }
                        
                        await PaymentCallbackController.notifyStreamer(webhookData);
                    } else {
                        logger.warn('لم يتم العثور على التبرع', { invoiceId: webhookData.invoice_id });
                    }
                }

                res.status(200).json({ status: 'success', message: 'Webhook received' });

            } catch (error) {
                logger.error('Error in webhook processing', error);
                res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
            }
        }
    ],

    // معالجة ويب هوك الدفع الفاشل (مع Middleware)
    handleFailedWebhook: [
    verifyWebhookSignature,
    async (req, res) => {
        try {
            const webhookData = req.body;

            // التحقق من صحة البيانات
            if (!webhookData.invoice_id || !webhookData.status) {
                logger.warn('Missing required fields in failed webhook', webhookData);
                return res.status(400).json({ error: 'Missing required fields' });
            }

            logger.webhook('استلام ويب هوك فاشل من Fawaterk', {
                invoiceId: webhookData.invoice_id,
                status: webhookData.status
            });

            // Idempotency Key
            const idempotencyKey = req.headers['idempotency-key'] || webhookData.id || webhookData.invoice_id;
            if (idempotencyKey) {
                try {
                    const [processed] = await db.execute(
                        'SELECT id FROM processed_webhooks WHERE idempotency_key = ?',
                        [idempotencyKey.toString()]
                    );
                    if (processed.length > 0) {
                        logger.warn('Failed webhook already processed', { idempotencyKey });
                        return res.status(200).json({ status: 'success', message: 'Already processed' });
                    }
                } catch (error) {
                    logger.error('Error checking idempotency in failed webhook', error);
                }
            }

            if (webhookData.status === 'failed' && webhookData.invoice_id) {
                const [result] = await db.execute(
                    'UPDATE donations SET status = ? WHERE invoice_id = ?',
                    ['failed', webhookData.invoice_id.toString()]
                );
                
                if (result.affectedRows > 0) {
                    logger.warn('تم تحديث التبرع فاشل عبر ويب هوك', { invoiceId: webhookData.invoice_id });
                    
                    // حفظ idempotency key
                    if (idempotencyKey) {
                        await this.saveIdempotencyKey(idempotencyKey);
                    }
                }
            }

            res.status(200).json({ status: 'success', message: 'Failed webhook received' });

        } catch (error) {
            logger.error('Error in failed webhook', error);
            res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
        }
    }
],

    saveIdempotencyKey: async (idempotencyKey) => {
        try {
            await db.execute(
                'INSERT INTO processed_webhooks (idempotency_key) VALUES (?)',
                [idempotencyKey.toString()]
            );
            logger.database('Idempotency key saved', { key: idempotencyKey });
        } catch (error) {
            if (error.code !== 'ER_DUP_ENTRY') {
                logger.error('Error saving idempotency key', error);
            }
        }
    },

    // دالة مساعدة لإشعار الاستريمر (اختيارية)
    notifyStreamer: async (webhookData) => {
        try {
            // هنا يمكنك إرسال إشعار للاستريمر
            // مثلاً: email, push notification, etc.
            logger.info('إشعار للاستريمر بتبرع جديد', webhookData.payload);
            
            // مثال: إذا كان لديك نظام إشعارات
            // await sendNotificationToStreamer(webhookData.payload.streamer_id, webhookData);
        } catch (error) {
            logger.error('Error notifying streamer', error);
        }
    }
};

module.exports = PaymentCallbackController;