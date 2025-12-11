// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  login: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Неверный формат email']
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  // Новые поля для профиля
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'RUB', 'PLN', 'GBP', 'JPY', 'CNY']
  },
  monthlyBudget: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Индекс для быстрого поиска по email
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);