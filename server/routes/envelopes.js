// server/routes/envelopes.js
const express = require('express');
const router = express.Router();
const Envelope = require('../models/Envelope');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Получить все конверты пользователя
router.get('/', auth, async (req, res) => {
  try {
    const envelopes = await Envelope.find({ userId: req.user.id })
      .populate('categoryId', 'name type color icon')
      .sort({ createdAt: -1 });

    res.json(envelopes);
  } catch (err) {
    console.error('Get envelopes error:', err);
    res.status(500).json({ error: 'Ошибка при получении конвертов' });
  }
});

// Создать конверт
router.post('/', auth, async (req, res) => {
  try {
    const { categoryId, initialAmount, targetGoal, description } = req.body;

    if (!categoryId || initialAmount === undefined || targetGoal === undefined) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // Проверяем, что категория принадлежит пользователю
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user.id
    });

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Проверяем, что категория - тип расходов
    if (category.type !== 'expense') {
      return res.status(400).json({ error: 'Конверт может быть только для расходов' });
    }

    const envelope = new Envelope({
      categoryId,
      userId: req.user.id,
      initialAmount: parseFloat(initialAmount),
      targetGoal: parseFloat(targetGoal),
      description: description || ''
    });

    await envelope.save();
    await envelope.populate('categoryId', 'name type color icon');

    res.status(201).json(envelope);
  } catch (err) {
    console.error('Create envelope error:', err);
    res.status(500).json({ error: 'Ошибка при создании конверта' });
  }
});

// Получить конверт по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const envelope = await Envelope.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('categoryId', 'name type color icon');

    if (!envelope) {
      return res.status(404).json({ error: 'Конверт не найден' });
    }

    res.json(envelope);
  } catch (err) {
    console.error('Get envelope error:', err);
    res.status(500).json({ error: 'Ошибка при получении конверта' });
  }
});

// Обновить конверт
router.put('/:id', auth, async (req, res) => {
  try {
    const { categoryId, initialAmount, targetGoal, description } = req.body;

    const envelope = await Envelope.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!envelope) {
      return res.status(404).json({ error: 'Конверт не найден' });
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user.id
      });

      if (!category || category.type !== 'expense') {
        return res.status(400).json({ error: 'Неверная категория' });
      }

      envelope.categoryId = categoryId;
    }

    if (initialAmount !== undefined) envelope.initialAmount = parseFloat(initialAmount);
    if (targetGoal !== undefined) envelope.targetGoal = parseFloat(targetGoal);
    if (description !== undefined) envelope.description = description;

    envelope.updatedAt = new Date();
    await envelope.save();
    await envelope.populate('categoryId', 'name type color icon');

    res.json(envelope);
  } catch (err) {
    console.error('Update envelope error:', err);
    res.status(500).json({ error: 'Ошибка при обновлении конверта' });
  }
});

// Удалить конверт
router.delete('/:id', auth, async (req, res) => {
  try {
    const envelope = await Envelope.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!envelope) {
      return res.status(404).json({ error: 'Конверт не найден' });
    }

    await Envelope.findByIdAndDelete(req.params.id);

    res.json({ message: 'Конверт удален' });
  } catch (err) {
    console.error('Delete envelope error:', err);
    res.status(500).json({ error: 'Ошибка при удалении конверта' });
  }
});

module.exports = router;