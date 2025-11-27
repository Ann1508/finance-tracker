# Используем официальный Node.js образ
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install --only=production # Устанавливаем только production зависимости

# Копируем исходники
COPY . .

# Порт, который слушает ваш Node.js сервер (замените на ваш порт, если другой)
EXPOSE 3000

# Запускаем сервер при запуске контейнера
CMD ["npm", "start"]