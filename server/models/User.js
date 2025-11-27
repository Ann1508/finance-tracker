// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  login: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  name: { type: String, required: true },
  email: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);