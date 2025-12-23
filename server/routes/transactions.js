// server/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const path = require('path');
const fs = require('fs');

// ✅ ДОБАВЛЯЕМ JSON PARSER В НАЧАЛО
router.use(express.json());

// Создать транзакцию
router.post('/', auth, upload.single('receipt'), async (req, res) => {
  try {
    const { title, amount, type, category, date, description, priority, envelopeId } = req.body;
    const receipt = req.file;

    console.log('📨 Получены данные:', { title, amount, type, category, envelopeId });

    if (!title || !amount || !type || !category) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // Проверяем, что категория принадлежит пользователю
    const categoryDoc = await Category.findOne({
      _id: category,
      userId: req.user.id
    });

    if (!categoryDoc) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Преобразуем приоритет в число и валидируем
    let priorityValue = 3; // дефолт
    if (priority !== undefined && priority !== null && priority !== '') {
      const parsedPriority = parseInt(priority);
      if ([1, 2, 3, 4, 5].includes(parsedPriority)) {
        priorityValue = parsedPriority;
      }
    }

    const transaction = new Transaction({
      title,
      amount: parseFloat(amount),
      type,
      category,
      userId: req.user.id,
      date: date || new Date(),
      description: description || '',
      priority: priorityValue,
      envelopeId: envelopeId || null,
      receipt: receipt ? `uploads/files/${receipt.filename}` : null
    });

    await transaction.save();
    await transaction.populate('category', 'name type color icon');

    console.log('✅ Транзакция создана:', transaction._id);
    res.status(201).json(transaction);
  } catch (err) {
    console.error('❌ Create transaction error:', err);
    res.status(500).json({ error: 'Ошибка при создании транзакции: ' + err.message });
  }
});

// Получить все транзакции пользователя с фильтрами
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 100 } = req.query;

    const filter = { userId: req.user.id };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('category', 'name type color icon')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (err) {
    console.error('❌ Get transactions error:', err);
    res.status(500).json({ error: 'Ошибка при получении транзакций' });
  }
});

// Получить статистику
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user.id };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Общая статистика
    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Статистика по категориям
    const categoryStats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          type: '$_id.type',
          category: '$categoryInfo.name',
          color: '$categoryInfo.color',
          icon: '$categoryInfo.icon',
          total: 1,
          count: 1
        }
      }
    ]);

    const result = {
      income: stats.find(s => s._id === 'income')?.total || 0,
      expense: stats.find(s => s._id === 'expense')?.total || 0,
      incomeCount: stats.find(s => s._id === 'income')?.count || 0,
      expenseCount: stats.find(s => s._id === 'expense')?.count || 0,
      balance: (stats.find(s => s._id === 'income')?.total || 0) - 
               (stats.find(s => s._id === 'expense')?.total || 0),
      byCategory: categoryStats
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Get stats error:', err);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

// Получить транзакцию по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('category', 'name type color icon');

    if (!transaction) {
      return res.status(404).json({ error: 'Транзакция не найдена' });
    }

    res.json(transaction);
  } catch (err) {
    console.error('❌ Get transaction error:', err);
    res.status(500).json({ error: 'Ошибка при получении транзакции' });
  }
});

// Обновить транзакцию
router.put('/:id', auth, upload.single('receipt'), async (req, res) => {
  try {
    const { title, amount, type, category, date, description, priority, removeReceipt } = req.body;
    const receipt = req.file;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Транзакция не найдена' });
    }

    // Проверяем категорию если она изменилась
    if (category && category !== transaction.category.toString()) {
      const categoryDoc = await Category.findOne({
        _id: category,
        userId: req.user.id
      });

      if (!categoryDoc) {
        return res.status(404).json({ error: 'Категория не найдена' });
      }
    }

    const updatedData = {};
    if (title !== undefined) updatedData.title = title;
    if (amount !== undefined) updatedData.amount = parseFloat(amount);
    if (type !== undefined) updatedData.type = type;
    if (category !== undefined) updatedData.category = category;
    if (date !== undefined) updatedData.date = date;
    if (description !== undefined) updatedData.description = description;
    
    if (priority !== undefined && priority !== null && priority !== '') {
      const parsedPriority = parseInt(priority);
      if ([1, 2, 3, 4, 5].includes(parsedPriority)) {
        updatedData.priority = parsedPriority;
      }
    }

    // Обработка файла чека
    if (receipt) {
      const newReceiptPath = `uploads/files/${receipt.filename}`;
      
      if (transaction.receipt) {
        const oldReceiptPath = path.join(__dirname, '..', transaction.receipt);
        if (fs.existsSync(oldReceiptPath)) fs.unlinkSync(oldReceiptPath);
      }

      updatedData.receipt = newReceiptPath;
    } else if (removeReceipt === 'true') {
      if (transaction.receipt) {
        const oldReceiptPath = path.join(__dirname, '..', transaction.receipt);
        if (fs.existsSync(oldReceiptPath)) fs.unlinkSync(oldReceiptPath);
      }
      updatedData.receipt = null;
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    ).populate('category', 'name type color icon');

    res.json(updatedTransaction);
  } catch (err) {
    console.error('❌ Update transaction error:', err);
    res.status(500).json({ error: 'Ошибка при обновлении транзакции' });
  }
});

// Удалить транзакцию
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Транзакция не найдена' });
    }

    // Удаляем файл чека если он есть
    if (transaction.receipt) {
      const receiptPath = path.join(__dirname, '..', transaction.receipt);
      if (fs.existsSync(receiptPath)) {
        fs.unlinkSync(receiptPath);
      }
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Транзакция удалена' });
  } catch (err) {
    console.error('❌ Delete transaction error:', err);
    res.status(500).json({ error: 'Ошибка при удалении транзакции' });
  }
});

module.exports = router;