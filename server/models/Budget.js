// server/models/Budget.js
const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  limit: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['week', 'month', 'year'],
    default: 'month'
  },
  alert_threshold: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Индексы
BudgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });
BudgetSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Budget', BudgetSchema);