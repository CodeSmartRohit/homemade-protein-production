const Notification = require('../models/Notification');

/**
 * GET /api/notifications — Get all notifications for current user
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read — Mark notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all — Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
/**
 * GET /api/notifications/test-alert — Trigger diagnostic notification test
 */
exports.testAlert = async (req, res, next) => {
  try {
    const notificationService = require('../utils/notificationService');
    const result = await notificationService.testNotifications();

    res.json({
      success: true,
      message: 'Notification Diagnostic Test Executed',
      targetPhone: process.env.ADMIN_PHONE || '9340623657',
      targetEmail: process.env.ADMIN_EMAIL || 'rp111monster@gmail.com',
      diagnostics: result,
      environment: {
        hasEmailUser: Boolean(process.env.EMAIL_USER),
        hasEmailPass: Boolean(process.env.EMAIL_PASS),
        hasCallMeBotKey: Boolean(process.env.CALLMEBOT_API_KEY),
        hasTwilioSid: Boolean(process.env.TWILIO_ACCOUNT_SID),
        hasWebhookUrl: Boolean(process.env.WHATSAPP_WEBHOOK_URL)
      }
    });
  } catch (error) {
    next(error);
  }
};
