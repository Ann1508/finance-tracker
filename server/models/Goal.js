// server/models/Goal.js
const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000
  },
  deadline: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['travel', 'purchase', 'savings', 'education', 'health', 'other'],
    default: 'other'
  },
  icon: {
    type: String,
    default: '🎯'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  savingMethod: {
    type: String,
    enum: ['fixed', 'percentage', 'manual', 'challenge', 'table'],
    default: 'manual'
  },
  savingAmount: {
    type: Number,
    default: 0
  },
  savingFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  contributions: [{
    amount: Number,
    date: Date,
    note: String,
    cellId: String // ID ячейки таблицы (если вклад из таблицы накоплений)
  }],
  // Таблица накоплений
  tableValues: {
    type: [Number], // все значения ячеек в таблице
    default: []
  },
  tableProgress: [{
    _id: mongoose.Schema.Types.ObjectId,
    value: Number,
    checked: Boolean,
    date: Date,
    note: String
  }]
}, {
  timestamps: true
});

// Индексы
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, deadline: 1 });

// Виртуальное поле для прогресса
GoalSchema.virtual('progress').get(function() {
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

// Метод для генерации таблицы накоплений
GoalSchema.methods.generateTableValues = function() {
  const target = this.targetAmount;
  const minCells = 20;
  
  // Красивые "круглые" числа
  const beautifulNumbers = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 5000];
  
  let selectedValues = [];
  let currentSum = 0;
  
  // Распределяем числа пропорционально целевой сумме
  const avgCellValue = target / minCells;
  
  // Выбираем красивые числа, которые подходят по величине
  let availableNumbers = beautifulNumbers.filter(n => n <= avgCellValue * 2);
  
  if (availableNumbers.length === 0) {
    availableNumbers = [100];
  }
  
  // Генерируем ячейки с красивыми числами
  for (let i = 0; i < minCells - 1; i++) {
    // Случайно выбираем из доступных красивых чисел
    const cellValue = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    selectedValues.push(cellValue);
    currentSum += cellValue;
  }
  
  // Последняя ячейка содержит остаток до целевой суммы
  const remainder = target - currentSum;
  const lastValue = Math.max(100, remainder);
  selectedValues.push(lastValue);
  
  // Сортируем по возрастанию
  selectedValues.sort((a, b) => a - b);

  // Инициализируем tableProgress с галочками
  this.tableValues = selectedValues;
  this.tableProgress = this.tableValues.map(v => ({
    _id: new mongoose.Types.ObjectId(),
    value: v,
    checked: false,
    date: null,
    note: ''
  }));

  return this;
};

// Метод для добавления вклада
GoalSchema.methods.addContribution = function(amount, note = '') {
  this.contributions.push({
    amount,
    date: new Date(),
    note
  });
  
  this.currentAmount += amount;
  
  if (this.currentAmount >= this.targetAmount) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Метод для отметки ячейки таблицы
GoalSchema.methods.toggleTableCell = function(cellId, value, note = '') {
  const cell = this.tableProgress.find(p => p._id.toString() === cellId.toString());
  
  if (!cell) {
    throw new Error('Ячейка не найдена');
  }

  if (!cell.checked) {
    // Отмечаем ячейку
    cell.checked = true;
    cell.date = new Date();
    cell.note = note;
    
    // Добавляем вклад с ID ячейки
    this.contributions.push({
      amount: value,
      date: new Date(),
      note: note || `Таблица накоплений: ${value}₽`,
      cellId: cellId.toString() // Сохраняем ID ячейки как строку
    });
    
    this.currentAmount += value;
  } else {
    // Отменяем отметку
    cell.checked = false;
    cell.date = null;
    cell.note = '';
    
    // Находим и удаляем вклад с этим cellId
    let foundIndex = -1;
    for (let i = this.contributions.length - 1; i >= 0; i--) {
      const contribCellId = this.contributions[i].cellId?.toString() || '';
      if (contribCellId === cellId.toString()) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex !== -1) {
      this.contributions.splice(foundIndex, 1);
      this.currentAmount -= value;
    }
  }

  // Убеждаемся, что currentAmount не может быть отрицательным
  this.currentAmount = Math.max(0, this.currentAmount);

  if (this.currentAmount >= this.targetAmount) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.status === 'completed') {
    this.status = 'active';
    this.completedAt = null;
  }

  return this.save();
};

// Метод для расчета рекомендуемого ежемесячного платежа
GoalSchema.methods.getRecommendedMonthlyPayment = function() {
  const remaining = this.targetAmount - this.currentAmount;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const monthsLeft = Math.max(1, (deadline - now) / (1000 * 60 * 60 * 24 * 30));
  
  return Math.ceil(remaining / monthsLeft);
};

module.exports = mongoose.model('Goal', GoalSchema);