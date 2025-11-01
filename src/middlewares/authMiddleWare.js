const authValidation = require('../utils/authValidator');
const { upload, handleMulterError } = require('../config/multerConfig');
const fs = require('fs');

// middleware للتسجيل الدخول
const validateLogin = (req, res, next) => {
    const validation = authValidation.validateLogin(req.body);
    if (!validation.valid) {
        return res.status(400).json({ 
            status: false,
            message: validation.message || 'Invalid login credentials' 
        });
    }
    req.valid = true;
    next();
};

// middleware للتسجيل
const validateRegister = (req, res, next) => {
    const validation = authValidation.validateRegister(req.body);
    if (!validation.valid) {
        return res.status(400).json({ 
            status: false,
            message: validation.message || 'Invalid registration data' 
        });
    }
    req.valid = true;
    next();
};


// fileValidationMiddleware.js
const validateRegisterWithFile = (req, res, next) => {
    // أولاً: معالجة رفع الملف
    upload.single('avatar')(req, res, function(err) {
        if (err) {
            return handleMulterError(err, req, res, next);
        }
        
        // ثانياً: الفاليديشن بعد رفع الملف
        if (!req.body || typeof req.body !== 'object') {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                status: false,
                message: 'Invalid request format' 
            });
        }
        
        const validation = authValidation.validateRegister(req.body);
        if (!validation.valid) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                status: false,
                message: validation.message 
            });
        }
        
        next();
    });
};

module.exports = {
    validateLogin,
    validateRegister,
    validateRegisterWithFile
};