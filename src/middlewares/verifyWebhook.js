const crypto = require('crypto');
const logger = require('../utils/logger'); // ✅ Logger مخصص

const verifyWebhookSignature = (req, res, next) => {
    try {
        const signature = req.headers['x-fawaterk-signature'] || req.headers['signature'];
        const payload = req.body;
        
        // التحقق من الوقت
        const webhookTimestamp = req.headers['x-webhook-timestamp'] || req.headers['timestamp'];
        if (webhookTimestamp) {
            const timeDiff = Date.now() - parseInt(webhookTimestamp);
            const fiveMinutes = 5 * 60 * 1000;
            
            if (timeDiff > fiveMinutes) {
                logger.warn('Webhook too old', { 
                    timestamp: webhookTimestamp, 
                    timeDiff: `${timeDiff}ms` 
                });
                return res.status(400).json({ error: 'Webhook too old' });
            }
        }
        
        if (!signature) {
            logger.warn('No webhook signature provided');
            return res.status(401).json({ error: 'Missing signature' });
        }

        const secret = process.env.FAWATERK_WEBHOOK_SECRET;
        
        if (!secret) {
            logger.error('Fawaterk webhook secret not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (signature !== expectedSignature) {
            logger.warn('Invalid webhook signature', {
                received: signature.substring(0, 10) + '...',
                expected: expectedSignature.substring(0, 10) + '...'
            });
            return res.status(401).json({ error: 'Invalid signature' });
        }

        logger.success('Webhook signature verified successfully');
        next();
        
    } catch (error) {
        logger.error('Error verifying webhook signature', error);
        return res.status(500).json({ error: 'Signature verification failed' });
    }
};

module.exports = verifyWebhookSignature;