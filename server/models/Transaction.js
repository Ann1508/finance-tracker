// server/models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000
  },
  receipt: {
    type: String, // путь к файлу чека
    default: null
  },
    priority: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
    default: 3,
    description: '1 = Критически важно (ЖКХ, продукты), 2 = Важно (лекарства, топливо), 3 = Средний приоритет, 4 = Низкий, 5 = Развлечение'
  },
  // Флаг: можно ли сэкономить на этой транзакции
  canReduce: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индексы для аналитики
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);