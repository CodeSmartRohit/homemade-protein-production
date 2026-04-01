const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Helper to generate order number
const generateOrderNumber = () => {
  return `HP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * POST /api/orders — Place a new order
 */
exports.createOrder = async (req, res, next) => {
  try {
    let { items, deliveryAddress, deliveryType, specialInstructions, paymentMethod } = req.body;

    if (paymentMethod === 'cash') paymentMethod = 'cod';
    if (paymentMethod === 'card' || paymentMethod === 'razorpay') paymentMethod = 'online';
    if (!paymentMethod) paymentMethod = 'online';

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    // Verify items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem).lean();
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${item.menuItem}`,
        });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${menuItem.name}" is currently sold out.`,
        });
      }

      // fallback to raw price if discountPrice doesn't exist
      const price = menuItem.discountPrice || menuItem.price;
      subtotal += price * item.quantity;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price,
        quantity: item.quantity,
        image: menuItem.image,
      });
    }

    const deliveryFee = deliveryType === 'pickup' ? 0 : (subtotal >= 500 ? 0 : 40);
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const totalAmount = subtotal + deliveryFee + tax;

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      deliveryAddress,
      deliveryType: deliveryType || 'delivery',
      specialInstructions,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      statusHistory: paymentMethod === 'cod' 
        ? [
            { status: 'pending', note: 'Order placed' },
            { status: 'confirmed', note: 'COD Auto-Confirmed' }
          ]
        : [
            { status: 'pending', note: 'Order placed' }
          ],
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .lean();

    // Emit socket event for new order
    const io = req.app.get('io');
    if (io) {
      io.to('chef-room').emit('new-order', {
        order: populatedOrder,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: { order: populatedOrder },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/my-orders — Customer's order history
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customer: req.user._id };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id — Get order details
 */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Customers can only see their own orders
    if (req.user.role === 'customer' && order.customer._id !== req.user._id && order.customer !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/all — All orders for Chef/Admin
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, date, sortBy = 'createdAt', order: sortOrder = 'desc' } = req.query;
    const query = {};

    if (status) query.status = status;
    
    // Convert to manual filter logic format for dates
    if (date) {
      const start = new Date(date).toISOString();
      const end = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString();
      query.createdAt = { $gte: start, $lte: end };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/status — Update order status (Chef/Admin)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Prevent status changes on delivered/cancelled orders
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update status. Order is already ${order.status}.`,
      });
    }

    const newStatusHistory = [...(order.statusHistory || [])];
    newStatusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      date: new Date().toISOString()
    });
    
    const updates = { status, statusHistory: newStatusHistory };

    // If delivered, mark payment as paid for COD
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      updates.paymentStatus = 'paid';
    }

    order = await Order.findByIdAndUpdate(req.params.id, updates);

    // Emit socket event for status update
    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-status-update', {
        orderId: order._id,
        status: order.status,
        statusHistory: order.statusHistory,
      });
      io.to('chef-room').emit('order-updated', {
        orderId: order._id,
        status: order.status,
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/cancel — Cancel order (Customer)
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Support both populated and unpopulated customer forms
    const orderCustomerId = order.customer._id || order.customer;
    if (orderCustomerId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order can only be cancelled when pending or confirmed.',
      });
    }

    const newStatusHistory = [...(order.statusHistory || [])];
    newStatusHistory.push({
      status: 'cancelled',
      note: reason || 'Cancelled by customer',
      date: new Date().toISOString()
    });

    order = await Order.findByIdAndUpdate(order._id, {
        cancellationReason: reason || 'Cancelled by customer',
        status: 'cancelled',
        statusHistory: newStatusHistory
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('chef-room').emit('order-cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled.',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
