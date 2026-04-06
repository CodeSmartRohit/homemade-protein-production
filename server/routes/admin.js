const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All admin routes require authentication + admin role
router.use(authenticate, roleCheck('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.get('/users/deleted', adminController.getDeletedUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/restore', adminController.restoreUser);
router.delete('/users/:id', adminController.softDeleteUser);
router.get('/analytics', adminController.getAnalytics);
router.post('/users/:id/notify', adminController.sendNotification);
router.delete('/users/:id/hard', adminController.hardDeleteUser);
router.post('/users/broadcast', adminController.broadcastNotification);

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
