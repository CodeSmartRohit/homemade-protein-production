/**
 * Socket.io server configuration for real-time features:
 * - Order status updates
 * - New order notifications for chef
 * - Custom request notifications
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role})`);

    // Join user-specific room
    socket.join(`user-${socket.user._id}`);

    // Chef/Admin join chef room for order notifications
    if (['chef', 'admin'].includes(socket.user.role)) {
      socket.join('chef-room');
      console.log(`👨‍🍳 ${socket.user.name} joined chef-room`);
    }

    // Customer subscribes to order updates
    socket.on('track-order', (orderId) => {
      socket.join(`order-${orderId}`);
      console.log(`📦 ${socket.user.name} tracking order: ${orderId}`);
    });

    // Customer unsubscribes from order updates
    socket.on('untrack-order', (orderId) => {
      socket.leave(`order-${orderId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
