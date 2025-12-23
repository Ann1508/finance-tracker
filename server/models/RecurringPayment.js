// server/models/RecurringPayment.js
const mongoose = require('mongoose');

const RecurringPaymentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  reminderDays: {
    type: Number,
    default: 3,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoCreate: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  nextPaymentDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Индексы
RecurringPaymentSchema.index({ userId: 1, isActive: 1 });
RecurringPaymentSchema.index({ userId: 1, nextPaymentDate: 1 });

// Метод для расчета следующей даты платежа
RecurringPaymentSchema.methods.calculateNextPaymentDate = function(fromDate = null) {
  const baseDate = fromDate || this.nextPaymentDate || this.startDate;
  const next = new Date(baseDate);

  switch (this.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(this.dayOfMonth);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
};

// Метод для проверки, нужно ли напоминание
RecurringPaymentSchema.methods.needsReminder = function() {
  if (!this.isActive) return false;
  
  const today = new Date();
  const reminderDate = new Date(this.nextPaymentDate);
  reminderDate.setDate(reminderDate.getDate() - this.reminderDays);
  
  return today >= reminderDate && today < this.nextPaymentDate;
};

// Метод для проверки просрочки
RecurringPaymentSchema.methods.isOverdue = function() {
  if (!this.isActive) return false;
  return new Date() > this.nextPaymentDate;
};

// Метод для отметки оплаты
RecurringPaymentSchema.methods.markAsPaid = function() {
  this.lastPaymentDate = new Date();
  this.nextPaymentDate = this.calculateNextPaymentDate();
  
  if (this.endDate && this.nextPaymentDate > this.endDate) {
    this.isActive = false;
  }
  
  return this.save();
};

module.exports = mongoose.model('RecurringPayment', RecurringPaymentSchema);