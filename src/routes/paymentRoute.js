const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const paymentCallbackController = require('../controllers/paymentCallbackController');

router.get('/getPayment', paymentController.GetPaymentMethod);

router.post('/create', paymentController.CreatePayment);

router.get('/success/:donationId', paymentCallbackController.handleSuccess);
router.get('/failed/:donationId', paymentCallbackController.handleFailed);
router.get('/pending/:donationId', paymentCallbackController.handlePending);
router.get('/error', paymentCallbackController.handleError);

// routes لـ Webhooks
router.post('/webhook/paid', paymentCallbackController.handleWebhook);
router.post('/webhook/failed', paymentCallbackController.handleFailedWebhook);

module.exports = router;