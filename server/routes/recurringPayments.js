const express = require('express');
const router = express.Router();
const RecurringPayment = require('../models/RecurringPayment');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// CRUD операции для recurring payments
// Получить все платежи
router.get('/', auth, async (req, res) => {
  try {
    const payments = await RecurringPayment.find({ userId: req.user.id })
      .populate('category', 'name type color icon')
      .sort({ nextPaymentDate: 1 });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения платежей' });
  }
});

// Получить предстоящие платежи
router.get('/upcoming', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const payments = await RecurringPayment.find({
      userId: req.user.id,
      isActive: true,
      nextPaymentDate: { $lte: futureDate }
    }).populate('category').sort({ nextPaymentDate: 1 });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

// Отметить как оплаченный
router.post('/:id/mark-paid', auth, async (req, res) => {
  try {
    const payment = await RecurringPayment.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    // Если autoCreate = true, создаем транзакцию
    if (payment.autoCreate) {
      const transaction = new Transaction({
        title: payment.title,
        amount: payment.amount,
        type: 'expense',
        category: payment.category,
        userId: req.user.id,
        date: new Date(),
        description: 'Автоматически создано из регулярного платежа'
      });
      await transaction.save();
    }

    await payment.markAsPaid();
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка' });
  }
});

module.exports = router;