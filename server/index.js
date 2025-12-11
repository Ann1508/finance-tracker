// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finance_tracker_db';

// --- Middlewares ---
app.use(cors());

const jsonParser = express.json();

// Подключаем маршруты
app.use('/api/auth', jsonParser, require('./routes/auth'));
app.use('/api/users', jsonParser, require('./routes/users'));
app.use('/api/categories', jsonParser, require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions')); // Использует multer внутри

// Статические файлы для чеков
app.use('/uploads', express.static('./uploads'));

// --- Подключение к MongoDB ---
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected (Finance Tracker DB)'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Health check ---
app.get('/api/health', (req, res) => res.json({ 
  ok: true, 
  service: 'Finance Tracker API',
  version: '1.0.0'
}));

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`🚀 Finance Tracker Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});