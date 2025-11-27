require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql'); // Импортируем GraphQL middleware
const { schema, root } = require('./graphql/schema'); // Импортируем схему и резолверы
const auth = require('./middleware/auth'); // Импортируем ваше auth middleware


const app = express();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cpp_project_db';

// --- Middlewares ---
app.use(cors());

// Подключение express.json() ЛОКАЛЬНО к маршрутам, которые его ожидают (например, auth)
// Создаем экземпляр middleware
const jsonParser = express.json();

// Подключаем маршруты, которые НЕ используют Multer, с jsonParser
app.use('/api/auth', jsonParser, require('./routes/auth'));
app.use('/api/users', jsonParser, require('./routes/users'));
app.use('/api/projects', jsonParser, require('./routes/projects'));

// Роуты задач НЕ используют jsonParser, так как Multer (внутри routes/tasks) разбирает тело
// Поэтому подключаем его БЕЗ jsonParser
app.use('/api/tasks', require('./routes/tasks'));

app.use('/uploads', express.static('./uploads'));

// --- Подключение к MongoDB ---
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true, // Эти опции устарели, но Node.js Driver 4+ всё ещё поддерживает их для обратной совместимости
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    });

app.use(auth);

// app.use(express.json());
app.use('/graphql', jsonParser, graphqlHTTP((req) => {
    return {
        schema: schema,
        rootValue: root,
        context: {
            req: req, // Передаем req в context
            user: req.user // Можно также передать user отдельно
        },
        graphiql: true
    };
}));
// --- Health check ---
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
});

// --- Устаревшие опции MongoDB ---
// (node:18) [MONGODB DRIVER] Warning: useNewUrlParser is a deprecated option: ...
// (node:18) [MONGODB DRIVER] Warning: useUnifiedTopology is a deprecated option: ...
// Эти предупреждения можно убрать, убрав опции, но оставим их для совместимости.
// В будущем, при обновлении драйвера, нужно будет использовать новые опции.