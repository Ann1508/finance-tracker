// server/models/Envelope.js
const mongoose = require('mongoose');

const EnvelopeSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initialAmount: {
    type: Number,
    required: true,
    min: 0
  },
  targetGoal: {
    type: Number,
    required: true,
    min: 0,
    description: 'Цель накопления для конверта'
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
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
EnvelopeSchema.index({ userId: 1 });
EnvelopeSchema.index({ categoryId: 1 });
EnvelopeSchema.index({ userId: 1, categoryId: 1 });

module.exports = mongoose.model('Envelope', EnvelopeSchema);