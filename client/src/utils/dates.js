// src/utils/dates.js

export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getCurrentDate() {
  return formatDate(new Date());
}

// 👉 Новая функция:
export function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
