const mongoose = require('mongoose');
const db = require('../utils/localDb');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  image: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  dietaryPreference: { type: String, enum: ['none', 'vegetarian', 'vegan', 'gluten-free'], default: 'none' },
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
  },
  ingredients: [String],
  isAvailable: { type: Boolean, default: true },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
}, { timestamps: true });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ isAvailable: 1 });

module.exports = mongoose.models.MenuItem || (mongoose.connection.readyState === 1 ? mongoose.model('MenuItem', menuItemSchema) : db.menuItems);
