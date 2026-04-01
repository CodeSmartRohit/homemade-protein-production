const mongoose = require('mongoose');
const db = require('../utils/localDb');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

// Lazy model resolution — decides at call-time, not require-time
function getModel() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.models.Review || mongoose.model('Review', reviewSchema);
  }
  return db.reviews;
}

module.exports = new Proxy(function(){}, {
  get: (_, prop) => {
    const model = getModel();
    const val = model[prop];
    return typeof val === 'function' ? val.bind(model) : val;
  },
  apply: (_, thisArg, args) => getModel()(...args),
});
