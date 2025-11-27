// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Получить текущего пользователя
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить всех пользователей (только для администратора)
router.get('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
});

// Создать пользователя (регистрация с возможностью указания роли - только для администратора)
router.post('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { login, password, name, email, role } = req.body;

    if (!login || !password || !name) {
      return res.status(400).json({ error: 'Логин, пароль и имя обязательны' });
    }

    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    const bcrypt = require('bcryptjs');
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      login,
      passwordHash,
      name,
      email,
      role: 'admin'
    });

    await user.save();

    // Не возвращаем хэш пароля
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании пользователя' });
  }
});

// Обновить пользователя
router.put('/:id', auth, async (req, res) => {
  try {
    // Пользователь может редактировать только свой профиль, администратор - любой
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { name, email } = req.body;
    const updateData = { name, email };

    // Только администратор может менять роль
    if (req.user.role === 'admin' && req.body.role) {
      updateData.role = req.body.role;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
  }
});

// Удалить пользователя (только администратор)
router.delete('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Пользователь удален' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при удалении пользователя' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('name login role createdAt');
    res.json(users);
  } catch (err) {
    console.error('Ошибка при получении пользователей:', err);
    res.status(500).json({ error: 'Не удалось получить пользователей' });
  }
});

// Получить пользователя по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name login role createdAt');
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (err) {
    console.error('Ошибка при получении пользователя:', err);
    res.status(500).json({ error: 'Не удалось получить пользователя' });
  }
});

module.exports = router;