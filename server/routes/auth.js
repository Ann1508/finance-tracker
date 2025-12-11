// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendEmail, getVerificationEmailTemplate, getResetPasswordTemplate } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { login, password, name, email } = req.body;

    if (!login || !password || !name) {
      return res.status(400).json({ error: 'Логин, пароль и имя обязательны' });
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

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: 'Email уже используется' });
      }
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = new User({
      login,
      passwordHash: hash,
      name,
      email,
      role: 'user'
    });

    // Создаем токен для верификации email
    if (email) {
      user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 часа

      // Отправляем email верификации
      const verifyUrl = `${FRONTEND_URL}/verify-email/${user.emailVerificationToken}`;
      const htmlTemplate = getVerificationEmailTemplate(verifyUrl, name);
      await sendEmail(email, 'Подтверждение email - Финансовый Трекер', htmlTemplate);
    }

    await user.save();

    const token = jwt.sign(
      { id: user._id, login: user.login, role: user.role },
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
        emailVerified: user.emailVerified,
        role: user.role,
        currency: user.currency,
        monthlyBudget: user.monthlyBudget,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Повторная отправка письма верификации
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.email) {
      return res.status(400).json({ error: 'Email не указан' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email уже подтвержден' });
    }

    user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${FRONTEND_URL}/verify-email/${user.emailVerificationToken}`;
    const htmlTemplate = getVerificationEmailTemplate(verifyUrl, user.name);
    await sendEmail(user.email, 'Подтверждение email - Финансовый Трекер', htmlTemplate);

    res.json({ message: 'Письмо отправлено на ваш email' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Ошибка при отправке письма' });
  }
});

// Запрос сброса пароля
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Не раскрываем, существует ли пользователь
      return res.json({ message: 'Если email существует, письмо будет отправлено' });
    }

    user.passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 час
    await user.save();

    const resetUrl = `${FRONTEND_URL}/reset-password/${user.passwordResetToken}`;
    const htmlTemplate = getResetPasswordTemplate(resetUrl, user.name);
    await sendEmail(email, 'Сброс пароля - Финансовый Трекер', htmlTemplate);

    res.json({ message: 'Если email существует, письмо будет отправлено' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Ошибка при запросе сброса пароля' });
  }
});

// Обновить профиль (с отправкой письма при смене email)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, bio, currency, monthlyBudget } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (currency !== undefined) updates.currency = currency;
    if (monthlyBudget !== undefined) updates.monthlyBudget = parseFloat(monthlyBudget);

    // Проверяем email если он меняется
    if (email !== undefined && email !== (await User.findById(req.user.id)).email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email уже используется' });
      }
      
      updates.email = email;
      updates.emailVerified = false;
      updates.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      updates.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

      // Отправляем email верификации
      const user = await User.findById(req.user.id);
      const verifyUrl = `${FRONTEND_URL}/verify-email/${updates.emailVerificationToken}`;
      const htmlTemplate = getVerificationEmailTemplate(verifyUrl, user.name);
      await sendEmail(email, 'Подтверждение нового email - Финансовый Трекер', htmlTemplate);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('-passwordHash');

    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Ошибка при обновлении профиля' });
  }
});


// Вход
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
      { id: user._id, login: user.login, role: user.role },
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
        emailVerified: user.emailVerified,
        role: user.role,
        bio: user.bio,
        currency: user.currency,
        monthlyBudget: user.monthlyBudget
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// Верификация email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Токен обязателен' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Недействительный или истекший токен' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Email успешно подтвержден' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Ошибка при подтверждении email' });
  }
});


// Сброс пароля
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Недействительный или истекший токен' });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = hash;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: 'Пароль успешно изменен' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Ошибка при сбросе пароля' });
  }
});

// Смена пароля (для авторизованных пользователей)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }

    const user = await User.findById(req.user.id);
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!ok) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = hash;
    await user.save();

    res.json({ message: 'Пароль успешно изменен' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Ошибка при смене пароля' });
  }
});


router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;