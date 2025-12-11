// server/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['income', 'expense'], // доход или расход
    required: true
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  color: {
    type: String,
    default: '#6366f1' // цвет для UI
  },
  icon: {
    type: String,
    default: '💰' // иконка для UI
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Индекс для быстрого поиска категорий пользователя
CategorySchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Category', CategorySchema);