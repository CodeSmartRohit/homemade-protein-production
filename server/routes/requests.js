const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { upload, setUploadDir } = require('../middleware/upload');

// Customer routes
router.post('/', authenticate, setUploadDir('requests'), upload.array('images', 3), requestController.createRequest);
router.get('/my-requests', authenticate, requestController.getMyRequests);

// Chef/Admin routes
router.get('/all', authenticate, roleCheck('chef', 'admin'), requestController.getAllRequests);
router.patch('/:id/respond', authenticate, roleCheck('chef', 'admin'), requestController.respondToRequest);
router.patch('/:id/status', authenticate, roleCheck('chef', 'admin'), requestController.updateRequestStatus);

// Shared
router.get('/:id', authenticate, requestController.getRequest);

module.exports = router;
