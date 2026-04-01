const mongoose = require('mongoose');
const db = require('../utils/localDb');

const customRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  response: { type: String },
}, { timestamps: true });

// Lazy model resolution — decides at call-time, not require-time
function getModel() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.models.CustomRequest || mongoose.model('CustomRequest', customRequestSchema);
  }
  return db.requests;
}

module.exports = new Proxy(function(){}, {
  get: (_, prop) => {
    const model = getModel();
    const val = model[prop];
    return typeof val === 'function' ? val.bind(model) : val;
  },
  apply: (_, thisArg, args) => getModel()(...args),
});
