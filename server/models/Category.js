const mongoose = require('mongoose');
const db = require('../utils/localDb');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  image: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.models.Category || (mongoose.connection.readyState === 1 ? mongoose.model('Category', categorySchema) : db.categories);
