const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verifyToken');
const { upload, handleMulterError } = require('../config/multerConfig');

router.post('/upload-avatar', verifyToken, upload.single('avatar'), handleMulterError, userController.uploadAvatar);

router.put('/updateprofile', verifyToken, userController.updateProfile);
router.delete('/deleteaccount', verifyToken, userController.deleteAccount);


router.get('/getbyusername/:username', userController.GetUserByName);

module.exports = router;
