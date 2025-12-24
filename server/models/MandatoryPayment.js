const mongoose = require('mongoose');

const mandatoryPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Number, // день месяца (1-31)
    required: true,
    min: 1,
    max: 31
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  category: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  reminderDaysBefore: {
    type: Number,
    default: 3,
    min: 0
  },
  lastReminderSent: {
    type: Date,
    default: null
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Индекс для быстрого поиска активных платежей пользователя
mandatoryPaymentSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('MandatoryPayment', mandatoryPaymentSchema);