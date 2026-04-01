const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All admin routes require authentication + admin role
router.use(authenticate, roleCheck('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
