const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * POST — Submit review for a delivered order item
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { menuItem, order: orderId, rating, comment } = req.body;

    // Verify the order was delivered to this customer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    
    const customerId = order.customer._id || order.customer;
    if (customerId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders.' });
    }

    // Check if item was in the order
    const orderItem = order.items.find(i => (i.menuItem._id || i.menuItem).toString() === menuItem);
    if (!orderItem) {
      return res.status(400).json({ success: false, message: 'Item was not in this order.' });
    }

    const review = await Review.create({
      customer: req.user._id,
      menuItem,
      order: orderId,
      rating: Number(rating),
      comment,
      isVerified: true,
    });

    const populatedReview = await Review.findById(review._id).populate('customer', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted!',
      data: { review: populatedReview },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET — Reviews for a menu item
 */
router.get('/menu/:menuItemId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ menuItem: req.params.menuItemId });
    const total = reviews.length;
    
    const sortedReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedReviews = sortedReviews.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

    // Manual population
    for (let r of paginatedReviews) {
      r.customer = await global.localDb._populateField(r.customer, 'customer', 'name avatar');
    }

    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
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
});

/**
 * DELETE — Delete review (customer who wrote it or admin)
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const reviewCustomerId = review.customer._id || review.customer;
    if (req.user.role !== 'admin' && reviewCustomerId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
