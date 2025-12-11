// server/routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Создать категорию
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, description, color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Название и тип обязательны' });
    }

    const category = new Category({
      name,
      type,
      description: description || '',
      color: color || '#6366f1',
      icon: icon || '💰',
      userId: req.user.id
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Ошибка при создании категории' });
  }
});

// Получить все категории пользователя
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query; // income или expense
    
    const filter = { userId: req.user.id };
    if (type) filter.type = type;

    const categories = await Category.find(filter).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Ошибка при получении категорий' });
  }
});

// Получить категорию по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(category);
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: 'Ошибка при получении категории' });
  }
});

// Обновить категорию
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, description, color, icon } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, type, description, color, icon },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(category);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Ошибка при обновлении категории' });
  }
});

// Удалить категорию
router.delete('/:id', auth, async (req, res) => {
  try {
    // Проверяем, есть ли транзакции с этой категорией
    const transactionCount = await Transaction.countDocuments({
      category: req.params.id,
      userId: req.user.id
    });

    if (transactionCount > 0) {
      return res.status(400).json({ 
        error: `Невозможно удалить категорию. Есть ${transactionCount} транзакций с этой категорией` 
      });
    }

    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json({ message: 'Категория удалена' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Ошибка при удалении категории' });
  }
});

module.exports = router;