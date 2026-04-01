const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { upload, setUploadDir } = require('../middleware/upload');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, setUploadDir('avatars'), upload.single('avatar'), authController.updateProfile);
router.put('/address', authenticate, authController.updateAddress);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
