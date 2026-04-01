const mongoose = require('mongoose');
const db = require('../utils/localDb');

const customRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  response: { type: String },
}, { timestamps: true });

module.exports = mongoose.models.CustomRequest || (mongoose.connection.readyState === 1 ? mongoose.model('CustomRequest', customRequestSchema) : db.requests);
