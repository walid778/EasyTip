const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');
const { upload, handleMulterError } = require('../config/multerConfig');
const { validateLogin, validateRegister,validateRegisterWithFile } = require('../middlewares/authMiddleWare');

//router.post('/register', validateRegister, upload.single('avatar'), handleMulterError, authController.Register);
// غير ترتيب الميدلوير ليصبح الفاليديشن قبل الرفع
router.post('/register', validateRegisterWithFile, authController.Register);

router.post('/login', validateLogin, authController.Login);
router.post('/logout', authController.Logout);
router.post('/refresh-token', authController.RefreshToken);
router.get('/verify-token', verifyToken, authController.VerifyToken);
router.get('/me', verifyToken, authController.GetCurrentUser);

module.exports = router;