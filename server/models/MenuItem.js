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
  isPopular: { type: Boolean, default: false },
}, { timestamps: true });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ isAvailable: 1 });

// Lazy model resolution — decides at call-time, not require-time
function getModel() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
  }
  return db.menuItems;
}

module.exports = new Proxy(function(){}, {
  get: (_, prop) => {
    const model = getModel();
    const val = model[prop];
    return typeof val === 'function' ? val.bind(model) : val;
  },
  apply: (_, thisArg, args) => getModel()(...args),
});
