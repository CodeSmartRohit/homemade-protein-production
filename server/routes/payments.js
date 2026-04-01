const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/create-order', authenticate, paymentController.createRazorpayOrder);
router.post('/verify', authenticate, paymentController.verifyPayment);
router.get('/:orderId/status', authenticate, paymentController.getPaymentStatus);

module.exports = router;
