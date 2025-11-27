// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// register
router.post('/register', async (req, res) => {
  try {
    const { login, password, name, email, role } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    if (login.length < 3) {
      return res.status(400).json({ error: 'Логин должен содержать минимум 3 символа' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    const existing = await User.findOne({ login });
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    // Проверка email если предоставлен
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      login,
      passwordHash: hash,
      name: name || login, // Используем логин как имя если не предоставлено
      email,
      role: role || 'user'//'admin'
    });

    await user.save();

    // Создаем токен
    const token = jwt.sign(
        {
          id: user._id,
          login: user.login,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        login: user.login,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    const user = await User.findOne({ login });
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
        {
          id: user._id,
          login: user.login,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        login: user.login,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// Дополнительные маршруты аутентификации
router.post('/refresh', async (req, res) => {
  // Реализация обновления токена
});

router.post('/logout', async (req, res) => {
  // Реализация выхода (если нужно инвалидировать токены)
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;