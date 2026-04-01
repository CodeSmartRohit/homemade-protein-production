const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Customer routes
router.post('/', authenticate, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

// Chef/Admin routes
router.get('/all', authenticate, roleCheck('chef', 'admin'), orderController.getAllOrders);

// Shared (auth required, access control in controller)
router.get('/:id', authenticate, orderController.getOrder);
router.patch('/:id/status', authenticate, roleCheck('chef', 'admin'), orderController.updateOrderStatus);

module.exports = router;
