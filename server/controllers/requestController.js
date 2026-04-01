const CustomRequest = require('../models/CustomRequest');

/**
 * POST /api/requests — Submit custom dish request (Customer)
 */
exports.createRequest = async (req, res, next) => {
  try {
    const { dishName, description, dietaryPreferences, servingsNeeded, budget, neededByDate } = req.body;

    let attachedImages = [];
    if (req.files && req.files.length > 0) {
      attachedImages = req.files.map(f => `/uploads/requests/${f.filename}`);
    }

    const request = await CustomRequest.create({
      customer: req.user._id,
      dishName,
      description,
      dietaryPreferences: dietaryPreferences
        ? (typeof dietaryPreferences === 'string' ? dietaryPreferences.split(',').map(d => d.trim()) : dietaryPreferences)
        : [],
      servingsNeeded: servingsNeeded ? Number(servingsNeeded) : 1,
      budget: budget ? Number(budget) : undefined,
      neededByDate: neededByDate ? new Date(neededByDate).toISOString() : undefined,
      attachedImages,
      status: 'pending',
    });

    const populatedRequest = await CustomRequest.findById(request._id).populate('customer', 'name email phone');

    // Notify chef
    const io = req.app.get('io');
    if (io) {
      io.to('chef-room').emit('new-request', { request: populatedRequest });
    }

    res.status(201).json({
      success: true,
      message: 'Custom request submitted! The chef will review it soon.',
      data: { request: populatedRequest },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/my-requests — Customer's requests
 */
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await CustomRequest.find({ customer: req.user._id });
    // sorting by createdAt desc
    const sortedRequests = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: { requests: sortedRequests } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/all — All requests (Chef/Admin)
 */
exports.getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await CustomRequest.find(query);
    const sortedRequests = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Manual population
    for (let r of sortedRequests) {
      r.customer = await global.localDb._populateField(r.customer, 'customer', 'name email phone');
    }

    res.json({ success: true, data: { requests: sortedRequests } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/:id — Get request details
 */
exports.getRequest = async (req, res, next) => {
  try {
    const request = await CustomRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Populate customer
    request.customer = await global.localDb._populateField(request.customer, 'customer', 'name email phone');

    // Customers can only see their own
    const customerId = request.customer._id || request.customer;
    if (req.user.role === 'customer' && customerId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: { request } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/respond — Chef responds to request
 */
exports.respondToRequest = async (req, res, next) => {
  try {
    const { message, proposedPrice, estimatedTime, status } = req.body;

    const request = await CustomRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const chefResponse = {
      message: message || '',
      proposedPrice: proposedPrice ? Number(proposedPrice) : null,
      estimatedTime: estimatedTime || '',
      respondedAt: new Date().toISOString(),
    };

    let newStatus = 'reviewing';
    if (status && ['reviewing', 'accepted', 'rejected', 'completed'].includes(status)) {
      newStatus = status;
    }

    const updatedRequest = await CustomRequest.findByIdAndUpdate(req.params.id, {
      chefResponse,
      status: newStatus
    });

    const populatedRequest = await CustomRequest.findById(updatedRequest._id).populate('customer', 'name email phone');

    // Notify customer
    const io = req.app.get('io');
    if (io) {
      const customerId = populatedRequest.customer._id || populatedRequest.customer;
      io.to(`user-${customerId}`).emit('request-response', {
        requestId: populatedRequest._id,
        status: populatedRequest.status,
        chefResponse: populatedRequest.chefResponse,
      });
    }

    res.json({
      success: true,
      message: 'Response sent to customer!',
      data: { request: populatedRequest },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/status — Update request status (Chef/Admin)
 */
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewing', 'accepted', 'rejected', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const request = await CustomRequest.findByIdAndUpdate(req.params.id, { status });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const populatedRequest = await CustomRequest.findById(request._id).populate('customer', 'name email phone');

    res.json({
      success: true,
      message: `Request status updated to ${status}.`,
      data: { request: populatedRequest },
    });
  } catch (error) {
    next(error);
  }
};
