// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

module.exports = function(req, res, next) {
  console.log("Auth middleware: Запуск middleware для URL:", req.url);
  console.log("Auth middleware: Заголовки запроса:", req.headers);

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log("Auth middleware: Заголовок Authorization отсутствует или не начинается с 'Bearer'. Ответ: 401.");
    return res.status(401).json({ error: 'no token' });
  }
  console.log("Auth middleware: Найден заголовок Authorization с префиксом 'Bearer'. Извлекаем токен...");

  const token = auth.split(' ')[1];
  console.log("Auth middleware: Извлеченный токен (первые 20 символов):", token.substring(0, 20) + "...");

  try {
    console.log("Auth middleware: Проверяем токен с JWT_SECRET...");
    const payload = jwt.verify(token, JWT_SECRET);
    console.log("Auth middleware: Токен подтвержден. Payload:", payload);

    req.user = payload;
    console.log("Auth middleware: req.user установлен. Вызываем next().");

    next();
  } catch (err) {
    console.error("Auth middleware: Ошибка проверки токена:", err.message);
    return res.status(401).json({ error: 'invalid token' });
  }
};