const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

/**
 * GET /api/menu — Browse all menu items (public)
 */
exports.getAllItems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      isVeg,
      isPopular,
      sortBy = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
      tags,
    } = req.query;

    const query = { isAvailable: true };
    
    if (isPopular === 'true') {
      query.isPopular = true;
    }

    // Category filter
    if (category) {
      const cat = await Category.findOne({ slug: category }).lean();
      if (cat) query.category = cat._id;
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Veg filter
    if (isVeg !== undefined) {
      query.isVeg = isVeg === 'true';
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Tags filter
    if (tags) {
      query.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const total = await MenuItem.countDocuments(query);
    const items = await MenuItem.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: {
        items,
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
 * GET /api/menu/:id — Get single item
 */
exports.getItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('createdBy', 'name')
      .lean();

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/menu — Create menu item (Chef/Admin)
 */
exports.createItem = async (req, res, next) => {
  try {
    const {
      name, description, price, discountPrice, category,
      isVeg, tags, nutritionInfo, preparationTime, servingSize,
    } = req.body;

    // Handle image upload
    let image = '';
    let images = [];
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        image = `/uploads/menu/${req.files.image[0].filename}`;
      }
      if (req.files.images) {
        images = req.files.images.map(f => `/uploads/menu/${f.filename}`);
      }
    } else if (req.file) {
      image = `/uploads/menu/${req.file.filename}`;
    }

    const item = await MenuItem.create({
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      image,
      images,
      isVeg: isVeg === 'true' || isVeg === true,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      nutritionInfo: nutritionInfo ? (typeof nutritionInfo === 'string' ? JSON.parse(nutritionInfo) : nutritionInfo) : {},
      preparationTime: preparationTime ? Number(preparationTime) : 30,
      servingSize: servingSize || '1 serving',
      createdBy: req.user._id,
      isAvailable: true,
    });

    const populatedItem = await MenuItem.findById(item._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Menu item created!',
      data: { item: populatedItem },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/menu/:id — Update menu item (Chef/Admin)
 */
exports.updateItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    const updates = { ...req.body };

    // Parse JSON strings from form data
    if (typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }
    if (typeof updates.nutritionInfo === 'string') {
      try {
        updates.nutritionInfo = JSON.parse(updates.nutritionInfo);
      } catch (e) {
        // Fallback if it's already an object or malformed
      }
    }
    if (updates.price) updates.price = Number(updates.price);
    if (updates.discountPrice) updates.discountPrice = Number(updates.discountPrice);
    if (updates.preparationTime) updates.preparationTime = Number(updates.preparationTime);
    if (updates.isVeg !== undefined) updates.isVeg = updates.isVeg === 'true' || updates.isVeg === true;
    if (updates.isPopular !== undefined) updates.isPopular = updates.isPopular === 'true' || updates.isPopular === true;

    // Handle new image upload
    if (req.files && req.files.image && req.files.image[0]) {
      // Optional: Delete old image from filesystem if it exists
      if (item.image && item.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', item.image);
        try {
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.error(`Failed to delete old image: ${oldImagePath}`, err);
        }
      }
      updates.image = `/uploads/menu/${req.files.image[0].filename}`;
    } else if (req.file) {
      if (item.image && item.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', item.image);
        try {
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.error(`Failed to delete old image: ${oldImagePath}`, err);
        }
      }
      updates.image = `/uploads/menu/${req.file.filename}`;
    }

    // Handle multiple images if provided
    if (req.files && req.files.images) {
      const newImages = req.files.images.map(f => `/uploads/menu/${f.filename}`);
      // Merge or replace? Let's replace for now if they send new ones, 
      // or we can add a specific "delete image" endpoint later.
      updates.images = [...(item.images || []), ...newImages];
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Menu item updated!',
      data: { item: updatedItem },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/menu/:id/image — Remove secondary image (Chef/Admin)
 */
exports.removeImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    // Remove from filesystem
    const imagePath = path.join(__dirname, '..', imageUrl);
    try {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    } catch (err) {
      console.error(`Failed to delete image: ${imagePath}`, err);
    }

    // Update DB
    if (item.image === imageUrl) {
      item.image = '';
    } else {
      item.images = item.images.filter(img => img !== imageUrl);
    }

    await item.save();

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/menu/:id — Delete menu item (Chef/Admin)
 */
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    // Cleanup images
    if (item.image && item.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', item.image);
      try {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      } catch (err) {
        console.error(`Failed to delete image: ${imgPath}`, err);
      }
    }
    if (item.images && item.images.length > 0) {
      item.images.forEach(img => {
        if (img.startsWith('/uploads/')) {
          const imgPath = path.join(__dirname, '..', img);
          try {
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          } catch (err) {
            console.error(`Failed to delete secondary image: ${imgPath}`, err);
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Menu item deleted!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/menu/:id/availability — Toggle available/sold out
 */
exports.toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    const isAvailable = !item.isAvailable;
    await MenuItem.findByIdAndUpdate(item._id, { isAvailable });

    res.json({
      success: true,
      message: `Item marked as ${isAvailable ? 'available' : 'sold out'}.`,
      data: { isAvailable },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/menu/all — Get ALL items including unavailable (Chef/Admin)
 */
exports.getAllItemsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const total = await MenuItem.countDocuments(query);
    const items = await MenuItem.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: {
        items,
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
