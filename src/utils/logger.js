class Logger {
    constructor() {
        this.colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warn: '\x1b[33m',    // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        
        this.icons = {
            info: 'ℹ️',
            success: '✅',
            warn: '⚠️',
            error: '❌'
        };
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const color = this.colors[level];
        const icon = this.icons[level];
        const reset = this.colors.reset;

        let logMessage = `${color}${icon} ${timestamp} - ${message}${reset}`;
        
        if (data) {
            // عدم طباعة البيانات الحساسة
            const safeData = this.sanitizeData(data);
            logMessage += ` ${reset}${JSON.stringify(safeData, null, 2)}`;
        }

        return logMessage;
    }

    sanitizeData(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const sensitiveFields = ['password', 'secret', 'token', 'key', 'authorization', 'signature'];
        const sanitized = { ...data };

        for (const key in sanitized) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '***HIDDEN***';
            }
        }

        return sanitized;
    }

    info(message, data = null) {
        console.log(this.formatMessage('info', message, data));
    }

    success(message, data = null) {
        console.log(this.formatMessage('success', message, data));
    }

    warn(message, data = null) {
        console.warn(this.formatMessage('warn', message, data));
    }

    error(message, error = null) {
        const errorData = error ? {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : null;
        
        console.error(this.formatMessage('error', message, errorData));
    }

    // دالة خاصة للويب هوك
    webhook(message, data = null) {
        const webhookData = {
            type: 'webhook',
            ...data
        };
        this.info(`📩 ${message}`, webhookData);
    }

    // دالة خاصة للدفع
    payment(message, data = null) {
        const paymentData = {
            type: 'payment',
            ...data
        };
        this.info(`💳 ${message}`, paymentData);
    }

    // دالة خاصة للقاعدة البيانات
    database(message, data = null) {
        const dbData = {
            type: 'database',
            ...data
        };
        this.info(`🗄️ ${message}`, dbData);
    }
}

// إنشاء instance واحد وإعادة استخدامه (Singleton)
module.exports = new Logger();