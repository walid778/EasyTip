const express = require('express');
const router = express.Router();
const amountController = require('../controllers/AmountController');
const verifyToken = require('../middlewares/verifyToken');

router.get('/getAmountByUsername/:username', amountController.getAmountByUsername);

router.get('/getamount', verifyToken, amountController.getAmount);
router.post('/addamount', verifyToken, amountController.addAmount);

router.delete('/deleteAmount/:amountId', verifyToken, amountController.deleteAmount);
router.delete('/deleteAllAmounts', verifyToken, amountController.deleteAllAmount);

module.exports = router;
