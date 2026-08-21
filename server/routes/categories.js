const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const { authenticate } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { upload, setUploadDir } = require('../middleware/upload');

// GET all categories (public)
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
});

// POST create category (Chef/Admin)
router.post('/', authenticate, roleCheck('chef', 'admin'), setUploadDir('categories'), upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, displayOrder } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }
    const slug = req.body.slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const categoryData = {
      name: name.trim(),
      slug,
      description: description || '',
      isActive: true
    };
    if (displayOrder) categoryData.displayOrder = Number(displayOrder);
    if (req.file) categoryData.image = `/uploads/categories/${req.file.filename}`;

    const category = await Category.create(categoryData);
    res.status(201).json({
      success: true,
      message: 'Category created!',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
});

// PUT update category (Chef/Admin)
router.put('/:id', authenticate, roleCheck('chef', 'admin'), setUploadDir('categories'), upload.single('image'), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.name && !updates.slug) {
      updates.slug = updates.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (req.file) updates.image = `/uploads/categories/${req.file.filename}`;
    if (updates.displayOrder) updates.displayOrder = Number(updates.displayOrder);

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({
      success: true,
      message: 'Category updated!',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE category (Chef/Admin)
router.delete('/:id', authenticate, roleCheck('chef', 'admin'), async (req, res, next) => {
  try {
    // Check if category has menu items
    const itemCount = await MenuItem.countDocuments({ category: req.params.id });
    if (itemCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category: ${itemCount} menu item(s) are still linked to it. Please reassign or delete the items first.` 
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category deleted!' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
