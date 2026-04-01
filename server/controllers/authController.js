const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Helper to strip sensitive data
const sanitizeUser = (user) => {
  if (!user) return null;
  
  // Convert Mongoose document to plain JS object if necessary
  const userObj = user.toObject ? user.toObject() : user;
  
  const { password, refreshToken, ...rest } = userObj;
  return rest;
};

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET || 'secret1',
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'secret2',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
  return { accessToken, refreshToken };
};

// Set cookies helper
const setTokenCookies = (res, accessToken, refreshToken) => {
  // Over tunnels (https), browsers REQUIRE sameSite: 'none' and secure: true
  // Even in development.
  const isSecure = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // Always true for tunnels
    sameSite: 'none', // Required for cross-domain tunnels
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true, 
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password: hashedPassword, 
      phone,
      role: 'customer',
      avatar: '',
      addresses: [],
      isVerified: false,
      isActive: true,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken });

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        user: sanitizeUser(user),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact admin.',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken });

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: sanitizeUser(user),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required.',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'secret2');

    // Find user with refresh token
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken });

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.',
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token in DB
    if (req.user && req.user._id) {
       await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: sanitizeUser(req.user) || req.user },
  });
};

/**
 * PUT /api/auth/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, addresses } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;
    if (addresses) updates.addresses = addresses;

    // Handle avatar upload
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    res.json({
      success: true,
      message: 'Profile updated!',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/address
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const { addressId, label, street, city, state, pincode, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.addresses) user.addresses = [];

    if (addressId) {
      // Update existing address
      const addressIndex = user.addresses.findIndex(a => a._id === addressId);
      if (addressIndex === -1) {
        return res.status(404).json({ success: false, message: 'Address not found.' });
      }
      
      if (isDefault !== undefined && isDefault) {
         user.addresses.forEach(a => { a.isDefault = false; });
      }
      
      user.addresses[addressIndex] = {
         ...user.addresses[addressIndex],
         ...(label && { label }),
         ...(street && { street }),
         ...(city && { city }),
         ...(state && { state }),
         ...(pincode && { pincode }),
         ...(isDefault !== undefined && { isDefault })
      };
    } else {
      // Add new address
      const shouldBeDefault = isDefault || user.addresses.length === 0;
      if (shouldBeDefault) {
        user.addresses.forEach(a => { a.isDefault = false; });
      }
      user.addresses.push({
        _id: uuidv4(),
        label: label || 'Home',
        street,
        city,
        state,
        pincode,
        isDefault: shouldBeDefault,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, { addresses: user.addresses });

    res.json({
      success: true,
      message: addressId ? 'Address updated!' : 'Address added!',
      data: { addresses: updatedUser.addresses },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully!',
    });
  } catch (error) {
    next(error);
  }
};
