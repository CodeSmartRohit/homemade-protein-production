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

// Lazy model resolution — decides at call-time, not require-time
function getModel() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.models.Category || mongoose.model('Category', categorySchema);
  }
  return db.categories;
}

module.exports = new Proxy(function(){}, {
  get: (_, prop) => {
    const model = getModel();
    const val = model[prop];
    return typeof val === 'function' ? val.bind(model) : val;
  },
  apply: (_, thisArg, args) => getModel()(...args),
});
