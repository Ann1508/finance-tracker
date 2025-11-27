// server.js или app.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const { graphqlHTTP } = require('express-graphql'); // Импортируем GraphQL middleware
const { schema, root } = require('./graphql/schema'); // Импортируем схему и резолверы
const auth = require('./middleware/auth'); // Импортируем ваше auth middleware

// Извлекаем строку подключения из переменных окружения
const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/cpp_project_db';  // Указание на MongoDB в контейнере

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/graphql', auth, graphqlHTTP((req) => ({
  schema: schema,
  rootValue: root,
  graphiql: process.env.NODE_ENV === 'development', // Включить GraphiQL в dev
  context: { req }, // Передаем req в контекст GraphQL, чтобы резолверы имели доступ к user
})));

// Пример простого маршрута
app.get('/', (req, res) => {
  res.send('Hello, MongoDB is connected!');
});

// Указываем порт для приложения
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
});
