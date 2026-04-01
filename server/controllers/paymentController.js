const crypto = require('crypto');
const Order = require('../models/Order');
const getRazorpayInstance = require('../config/razorpay');

/**
 * POST /api/payments/create-order — Create Razorpay order
 */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const orderCustomerId = order.customer._id || order.customer;
    if (orderCustomerId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid.' });
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        customerEmail: req.user.email,
      },
    });

    // Save Razorpay order ID
    await Order.findByIdAndUpdate(order._id, { razorpayOrderId: razorpayOrder.id });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/verify — Verify Razorpay payment
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    await Order.findByIdAndUpdate(orderId, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: 'paid'
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('chef-room').emit('payment-received', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully!',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/:orderId/status — Check payment status
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).select('paymentStatus paymentMethod razorpayPaymentId totalAmount orderNumber');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
