const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { upload, setUploadDir } = require('../middleware/upload');

// Public routes
router.get('/', menuController.getAllItems);
router.get('/search', menuController.getAllItems); // same handler with search query
router.get('/:id', menuController.getItem);

// Chef/Admin routes
router.post(
  '/',
  authenticate,
  roleCheck('chef', 'admin'),
  setUploadDir('menu'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  menuController.createItem
);

router.put(
  '/:id',
  authenticate,
  roleCheck('chef', 'admin'),
  setUploadDir('menu'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  menuController.updateItem
);

router.delete('/:id', authenticate, roleCheck('chef', 'admin'), menuController.deleteItem);
router.patch('/:id/availability', authenticate, roleCheck('chef', 'admin'), menuController.toggleAvailability);

// Admin endpoint to see all items (including unavailable)
router.get('/admin/all', authenticate, roleCheck('chef', 'admin'), menuController.getAllItemsAdmin);

module.exports = router;
