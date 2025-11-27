const { generateId } = require('./utils/id'); // убедись, что есть функция generateId

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
 


let projects = [
  {
    id: '1',
    name: 'Сайт портфолио',
    tasks: [
      {
        id: generateId(),
        title: 'Инициализация репозитория',
        description: 'Создать репозиторий на GitHub',
        assignee: 'Иван',
        status: 'done',
        due: new Date().toISOString()
      },
      {
        id: generateId(),
        title: 'Дизайн интерфейса',
        description: 'Создать макеты',
        assignee: 'Мария',
        status: 'in-progress',
        due: new Date().toISOString()
      },
      {
        id: generateId(),
        title: 'Написать документацию',
        description: 'Подготовить README',
        assignee: 'Алексей',
        status: 'todo',
        due: new Date().toISOString()
      }
    ]
  },
  {
    id: '2',
    name: 'Todo-приложение',
    tasks: []
  }
];


// Получить все проекты
app.get('/api/projects', (req, res) => {
  res.json(projects);
});

// Создать проект
app.post('/api/projects', (req, res) => {
  const { name } = req.body;
  const newProject = { id: Date.now().toString(), name, tasks: [] };
  projects.push(newProject);
  res.status(201).json(newProject);
});

// Получить проект по id
app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });
  res.json(project);
});

// Обновить проект
app.put('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  project.name = req.body.name ?? project.name;
  res.json(project);
});

// Удалить проект
app.delete('/api/projects/:id', (req, res) => {
  projects = projects.filter(p => p.id !== req.params.id);
  res.status(204).send();
});


// Добавить задачу
app.post('/api/projects/:id/tasks', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  const task = { ...req.body, id: Date.now().toString() };
  project.tasks.push(task);
  res.status(201).json(task);
});

// Обновить задачу
app.put('/api/projects/:projectId/tasks/:taskId', (req, res) => {
  const project = projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  const taskIndex = project.tasks.findIndex(t => t.id === req.params.taskId);
  if (taskIndex === -1) return res.status(404).json({ message: 'Задача не найдена' });

  project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...req.body };
  res.json(project.tasks[taskIndex]);
});

// Удалить задачу
app.delete('/api/projects/:projectId/tasks/:taskId', (req, res) => {
  const project = projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  project.tasks = project.tasks.filter(t => t.id !== req.params.taskId);
  res.status(204).send();
});
 
// Получить все задачи проекта
app.get('/api/projects/:id/tasks', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  res.json(project.tasks);
});

// Получить задачу по id внутри проекта
app.get('/api/projects/:projectId/tasks/:taskId', (req, res) => {
  const project = projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Проект не найден' });

  const task = project.tasks.find(t => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Задача не найдена' });

  res.json(task);
});