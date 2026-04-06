const mongoose = require('mongoose');
const db = require('../utils/localDb');

const settingsSchema = new mongoose.Schema({
  noticeBoard: { type: String, default: 'Welcome to HOMEMADE Protein!' },
  qrCodeImage: { type: String, default: '' },
  upiIds: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

function getModel() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
  }
  return db.settings || { findOne: () => Promise.resolve(null), findOneAndUpdate: () => Promise.resolve(null) }; // mockup for local memory
}

module.exports = new Proxy(function(){}, {
  get: (_, prop) => {
    const model = getModel();
    const val = model[prop];
    return typeof val === 'function' ? val.bind(model) : val;
  },
  apply: (_, thisArg, args) => getModel()(...args),
});
