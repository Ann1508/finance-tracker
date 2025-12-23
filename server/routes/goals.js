// server/routes/goals.js
const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// Создать цель
router.post('/', auth, async (req, res) => {
  try {
    const { title, targetAmount, description, deadline, category, icon, color, savingMethod, savingAmount, savingFrequency } = req.body;

    if (!title || !targetAmount || !deadline) {
      return res.status(400).json({ error: 'Название, сумма и срок обязательны' });
    }

    const goal = new Goal({
      title,
      targetAmount: parseFloat(targetAmount),
      description: description || '',
      deadline,
      category: category || 'other',
      icon: icon || '🎯',
      color: color || '#6366f1',
      savingMethod: savingMethod || 'manual',
      savingAmount: parseFloat(savingAmount) || 0,
      savingFrequency: savingFrequency || 'monthly',
      userId: req.user.id
    });

    // Если метод накоплений - таблица, генерируем значения
    if (savingMethod === 'table') {
      goal.generateTableValues();
    }

    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Ошибка при создании цели' });
  }
});

// Получить все цели
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const goals = await Goal.find(filter).sort({ deadline: 1 });
    
    const goalsWithProgress = goals.map(goal => ({
      ...goal.toObject({ virtuals: true }),
      recommendedMonthlyPayment: goal.getRecommendedMonthlyPayment()
    }));

    res.json(goalsWithProgress);
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ error: 'Ошибка при получении целей' });
  }
});

// Получить цель по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Цель не найдена' });
    }

    res.json({
      ...goal.toObject({ virtuals: true }),
      recommendedMonthlyPayment: goal.getRecommendedMonthlyPayment()
    });
  } catch (err) {
    console.error('Get goal error:', err);
    res.status(500).json({ error: 'Ошибка при получении цели' });
  }
});

// Добавить вклад в цель
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть больше 0' });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Цель не найдена' });
    }

    if (goal.status === 'completed') {
      return res.status(400).json({ error: 'Цель уже достигнута' });
    }

    await goal.addContribution(parseFloat(amount), note || '');

    res.json({
      ...goal.toObject({ virtuals: true }),
      recommendedMonthlyPayment: goal.getRecommendedMonthlyPayment()
    });
  } catch (err) {
    console.error('Add contribution error:', err);
    res.status(500).json({ error: 'Ошибка при добавлении вклада' });
  }
});

// Отметить/отменить ячейку таблицы
router.post('/:id/table/toggle', auth, async (req, res) => {
  try {
    const { cellId, value, note } = req.body;

    if (!cellId || !value || value <= 0) {
      return res.status(400).json({ error: 'Некорректные данные ячейки' });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Цель не найдена' });
    }

    if (goal.savingMethod !== 'table') {
      return res.status(400).json({ error: 'Это не таблица накоплений' });
    }

    await goal.toggleTableCell(cellId, value, note || '');

    res.json({
      ...goal.toObject({ virtuals: true }),
      recommendedMonthlyPayment: goal.getRecommendedMonthlyPayment()
    });
  } catch (err) {
    console.error('Toggle table cell error:', err);
    res.status(500).json({ error: err.message || 'Ошибка при обновлении таблицы' });
  }
});

// Обновить цель
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, targetAmount, description, deadline, category, icon, color, savingMethod, savingAmount, savingFrequency, status } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Цель не найдена' });
    }

    // Обновляем поля
    goal.title = title;
    goal.targetAmount = targetAmount;
    goal.description = description;
    goal.deadline = deadline;
    goal.category = category;
    goal.icon = icon;
    goal.color = color;
    goal.savingMethod = savingMethod;
    goal.savingAmount = savingAmount;
    goal.savingFrequency = savingFrequency;
    if (status) goal.status = status;

    // Если метод изменился на таблицу, генерируем новые значения
    if (savingMethod === 'table' && goal.tableValues.length === 0) {
      goal.generateTableValues();
    }

    await goal.save();

    res.json({
      ...goal.toObject({ virtuals: true }),
      recommendedMonthlyPayment: goal.getRecommendedMonthlyPayment()
    });
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Ошибка при обновлении цели' });
  }
});

// Удалить цель
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ error: 'Цель не найдена' });
    }

    res.json({ message: 'Цель удалена' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Ошибка при удалении цели' });
  }
});

// Получить статистику по целям
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });

    const stats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      averageProgress: goals.length > 0 
        ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount * 100), 0) / goals.length 
        : 0
    };

    res.json(stats);
  } catch (err) {
    console.error('Get goals stats error:', err);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

module.exports = router;