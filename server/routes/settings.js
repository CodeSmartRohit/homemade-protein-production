const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

/**
 * GET /api/settings/public — Get public site settings (Notice Board, UPI data)
 */
router.get('/public', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
       settings = { noticeBoard: '', qrCodeImage: '', upiIds: [] };
    }
    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
