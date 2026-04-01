const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const CustomRequest = require('../models/CustomRequest');

/**
 * GET /api/admin/dashboard — Dashboard stats
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    const [allUsers, allOrders, allItems, allRequests] = await Promise.all([
      User.find({ role: 'customer' }),
      Order.find({}),
      MenuItem.find({}),
      CustomRequest.find({})
    ]);

    const totalUsers = allUsers.length;
    const totalOrders = allOrders.length;
    const totalMenuItems = allItems.length;

    let todayOrders = 0;
    let monthlyRevenue = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let pendingRequests = 0;
    let statusCountsTemp = {};

    allRequests.forEach(req => {
        if (req.status === 'pending') pendingRequests++;
    });

    allOrders.forEach(order => {
        const orderTime = new Date(order.createdAt).getTime();
        
        if (orderTime >= startOfToday) todayOrders++;
        
        if (order.status === 'pending') pendingOrders++;

        statusCountsTemp[order.status] = (statusCountsTemp[order.status] || 0) + 1;

        if (order.paymentStatus === 'paid') {
           totalRevenue += order.totalAmount;
           if (orderTime >= startOfMonth) {
               monthlyRevenue += order.totalAmount;
           }
        }
    });

    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
      
    // Populate customers for recent orders manually or use the DB mechanism
    for (let o of recentOrders) {
       if (o.customer) {
           o.customer = await global.localDb._populateField(o.customer, 'customer', 'name email');
       }
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOrders,
          totalMenuItems,
          todayOrders,
          monthlyRevenue,
          totalRevenue,
          pendingOrders,
          pendingRequests,
        },
        recentOrders,
        ordersByStatus: statusCountsTemp,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users — List all users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    let query = {};
    if (role) query.role = role;

    let users = await User.find(query);
    
    if (search) {
        const s = search.toLowerCase();
        users = users.filter(u => 
            (u.name && u.name.toLowerCase().includes(s)) ||
            (u.email && u.email.toLowerCase().includes(s))
        );
    }

    const total = users.length;
    users = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

    res.json({
      success: true,
      data: {
        users,
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
 * PATCH /api/admin/users/:id/role — Change user role
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'chef', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be customer, chef, or admin.',
      });
    }

    // Prevent self-demotion
    if (req.params.id === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role.',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status — Ban/unban user
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (req.params.id === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account.',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { isActive });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/analytics — Revenue and order analytics
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    let startDate;

    switch (period) {
      case '7d': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    const startTimestamp = startDate.getTime();

    const allOrders = await Order.find({});
    
    let revenueByDayMap = {};
    let topItemsMap = {};
    let paymentMethodsMap = {};

    allOrders.forEach(order => {
        const orderTime = new Date(order.createdAt).getTime();
        if (orderTime >= startTimestamp) {
            
            // Payment methods
            paymentMethodsMap[order.paymentMethod] = (paymentMethodsMap[order.paymentMethod] || 0) + 1;
            
            if (order.paymentStatus === 'paid') {
                // Revenue by day
                const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
                if (!revenueByDayMap[dateKey]) {
                    revenueByDayMap[dateKey] = { revenue: 0, orderCount: 0 };
                }
                revenueByDayMap[dateKey].revenue += order.totalAmount;
                revenueByDayMap[dateKey].orderCount += 1;
                
                // Top items
                if (order.items) {
                    order.items.forEach(item => {
                        if (!topItemsMap[item.name]) {
                            topItemsMap[item.name] = { totalQuantity: 0, totalRevenue: 0 };
                        }
                        topItemsMap[item.name].totalQuantity += item.quantity;
                        topItemsMap[item.name].totalRevenue += (item.price * item.quantity);
                    });
                }
            }
        }
    });

    const revenueByDay = Object.keys(revenueByDayMap)
        .sort()
        .map(dateStr => ({
            _id: dateStr,
            revenue: revenueByDayMap[dateStr].revenue,
            orderCount: revenueByDayMap[dateStr].orderCount
        }));

    const topItems = Object.keys(topItemsMap)
        .map(itemName => ({
            _id: itemName,
            totalQuantity: topItemsMap[itemName].totalQuantity,
            totalRevenue: topItemsMap[itemName].totalRevenue
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

    res.json({
      success: true,
      data: {
        revenueByDay,
        topItems,
        paymentMethods: paymentMethodsMap,
      },
    });
  } catch (error) {
    next(error);
  }
};
