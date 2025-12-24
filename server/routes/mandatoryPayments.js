// server/routes/mandatoryPayments.js - ИСПРАВЛЕННЫЙ С УЧЕТОМ lastPaymentDate

const express = require('express');
const router = express.Router();
const MandatoryPayment = require('../models/MandatoryPayment');

const authenticateToken = require('../middleware/auth'); 

// GET все платежи текущего пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const payments = await MandatoryPayment.find({ userId: req.user.id })
      .sort({ dueDate: 1 });

    res.json(payments);
  } catch (error) {
    console.error('Ошибка получения платежей:', error);
    res.status(500).json({ error: 'Ошибка получения платежей' });
  }
});

// GET платежи со статусом (просрочено, скоро, в норме, оплачено)
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const payments = await MandatoryPayment.find({ 
      userId: req.user.id,
      isActive: true 
    }).sort({ dueDate: 1 });

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const paymentsWithStatus = payments.map(payment => {
      const paymentDay = payment.dueDate;
      
      // Рассчитываем daysUntil правильно
      let daysUntil;
      
      if (currentDay === paymentDay) {
        // Сегодня день платежа
        daysUntil = 0;
      } else if (currentDay < paymentDay) {
        // День платежа еще не наступил в этом месяце
        daysUntil = paymentDay - currentDay;
      } else {
        // День платежа уже прошел в этом месяце - считаем до следующего месяца
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        daysUntil = (daysInCurrentMonth - currentDay) + paymentDay;
      }

      let status = 'normal';
      
      // НОВАЯ ЛОГИКА: Проверяем, был ли платеж оплачен в этом месяце
      if (payment.lastPaymentDate) {
        const lastPaid = new Date(payment.lastPaymentDate);
        const lastPaidMonth = lastPaid.getMonth();
        const lastPaidYear = lastPaid.getFullYear();
        
        // Если оплачен в текущем месяце
        if (lastPaidYear === currentYear && lastPaidMonth === currentMonth) {
          status = 'paid';
        }
        // Если оплачен в прошлом месяце, но дата платежа еще не наступила в этом месяце
        else if (lastPaidYear === currentYear && lastPaidMonth === currentMonth - 1 && currentDay < paymentDay) {
          status = 'paid';
        }
        // Если текущий месяц - январь, проверяем декабрь прошлого года
        else if (currentMonth === 0 && lastPaidYear === currentYear - 1 && lastPaidMonth === 11 && currentDay < paymentDay) {
          status = 'paid';
        }
        // Иначе проверяем просрочку или приближение
        else {
          if (currentDay > paymentDay) {
            // Просрочено - день платежа был в этом месяце, но уже прошел
            status = 'overdue';
            daysUntil = -(currentDay - paymentDay); // Отрицательное значение для просроченных
          } else if (daysUntil <= payment.reminderDaysBefore) {
            status = 'upcoming';
          }
        }
      } else {
        // Если платеж никогда не оплачивался
        if (currentDay > paymentDay) {
          // Просрочено
          status = 'overdue';
          daysUntil = -(currentDay - paymentDay); // Отрицательное значение
        } else if (daysUntil <= payment.reminderDaysBefore) {
          status = 'upcoming';
        }
      }

      return {
        ...payment.toObject(),
        daysUntil,
        status,
        lastPaidDate: payment.lastPaymentDate
      };
    });

    res.json(paymentsWithStatus);
  } catch (error) {
    console.error('Ошибка получения статуса платежей:', error);
    res.status(500).json({ error: 'Ошибка получения статуса платежей' });
  }
});

// GET один платеж по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await MandatoryPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому платежу' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Ошибка получения платежа:', error);
    res.status(500).json({ error: 'Ошибка получения платежа' });
  }
});

// POST создать новый платеж
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, amount, dueDate, frequency, category, description, isActive, reminderDaysBefore } = req.body;

    if (!name || amount === undefined || dueDate === undefined) {
      return res.status(400).json({ error: 'Заполните обязательные поля (name, amount, dueDate)' });
    }

    if (amount < 0) {
      return res.status(400).json({ error: 'Сумма не может быть отрицательной' });
    }

    if (dueDate < 1 || dueDate > 31) {
      return res.status(400).json({ error: 'День месяца должен быть от 1 до 31' });
    }

    const newPayment = new MandatoryPayment({
      userId: req.user.id,
      name: name.trim(),
      amount: parseFloat(amount),
      dueDate: parseInt(dueDate),
      frequency: frequency || 'monthly',
      category: category || '',
      description: description || '',
      isActive: isActive !== false,
      reminderDaysBefore: reminderDaysBefore || 3
    });

    await newPayment.save();
    res.status(201).json(newPayment);
  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания платежа' });
  }
});

// PUT обновить платеж
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await MandatoryPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому платежу' });
    }

    const { name, amount, dueDate, frequency, category, description, isActive, reminderDaysBefore } = req.body;

    if (dueDate !== undefined && (dueDate < 1 || dueDate > 31)) {
      return res.status(400).json({ error: 'День месяца должен быть от 1 до 31' });
    }

    if (amount !== undefined && amount < 0) {
      return res.status(400).json({ error: 'Сумма не может быть отрицательной' });
    }

    if (name !== undefined) payment.name = name.trim();
    if (amount !== undefined) payment.amount = parseFloat(amount);
    if (dueDate !== undefined) payment.dueDate = parseInt(dueDate);
    if (frequency !== undefined) payment.frequency = frequency;
    if (category !== undefined) payment.category = category;
    if (description !== undefined) payment.description = description;
    if (isActive !== undefined) payment.isActive = isActive;
    if (reminderDaysBefore !== undefined) payment.reminderDaysBefore = reminderDaysBefore;
    // Разрешаем сброс lastPaymentDate (передав null)
    if (req.body.hasOwnProperty('lastPaymentDate')) payment.lastPaymentDate = req.body.lastPaymentDate;

    payment.updatedAt = new Date();
    await payment.save();

    res.json(payment);
  } catch (error) {
    console.error('Ошибка обновления платежа:', error);
    res.status(500).json({ error: error.message || 'Ошибка обновления платежа' });
  }
});

// PATCH отметить платеж как оплаченный
router.patch('/:id/mark-paid', authenticateToken, async (req, res) => {
  try {
    const payment = await MandatoryPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому платежу' });
    }

    payment.lastPaymentDate = new Date();
    payment.updatedAt = new Date();
    await payment.save();

    res.json({ 
      message: 'Платеж отмечен как оплаченный', 
      payment 
    });
  } catch (error) {
    console.error('Ошибка обновления платежа:', error);
    res.status(500).json({ error: 'Ошибка обновления платежа' });
  }
});

// DELETE удалить платеж
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await MandatoryPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому платежу' });
    }

    await MandatoryPayment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Платеж удален' });
  } catch (error) {
    console.error('Ошибка удаления платежа:', error);
    res.status(500).json({ error: 'Ошибка удаления платежа' });
  }
});

module.exports = router;