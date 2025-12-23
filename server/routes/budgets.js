// server/routes/budgets.js
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

// Получить все бюджеты пользователя
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id })
      .populate('categoryId', 'name icon color type')
      .sort({ createdAt: -1 });
    
    res.json(budgets);
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: 'Ошибка при получении бюджетов' });
  }
});

// Создать новый бюджет
router.post('/', auth, async (req, res) => {
  try {
    const { categoryId, limit, period, alert_threshold, description } = req.body;

    if (!categoryId || !limit || !period) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const budget = new Budget({
      userId: req.user.id,
      categoryId,
      limit: parseFloat(limit),
      period,
      alert_threshold: parseInt(alert_threshold) || 80,
      description: description || ''
    });

    await budget.save();
    await budget.populate('categoryId', 'name icon color type');

    res.status(201).json(budget);
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ error: 'Ошибка при создании бюджета' });
  }
});

// Получить бюджет по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('categoryId', 'name icon color type');

    if (!budget) {
      return res.status(404).json({ error: 'Бюджет не найден' });
    }

    res.json(budget);
  } catch (err) {
    console.error('Get budget error:', err);
    res.status(500).json({ error: 'Ошибка при получении бюджета' });
  }
});

// Обновить бюджет
router.put('/:id', auth, async (req, res) => {
  try {
    const { categoryId, limit, period, alert_threshold, description } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        categoryId,
        limit: parseFloat(limit),
        period,
        alert_threshold: parseInt(alert_threshold) || 80,
        description: description || ''
      },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name icon color type');

    if (!budget) {
      return res.status(404).json({ error: 'Бюджет не найден' });
    }

    res.json(budget);
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({ error: 'Ошибка при обновлении бюджета' });
  }
});

// Удалить бюджет
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return res.status(404).json({ error: 'Бюджет не найден' });
    }

    res.json({ message: 'Бюджет удален' });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ error: 'Ошибка при удалении бюджета' });
  }
});

module.exports = router;