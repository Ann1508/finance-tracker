// routes/tasks.js
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Создать задачу
router.post('/', auth, upload.single('file'), async (req, res) => {
  const { title, description, status, assignee, project, due } = req.body;
  const file = req.file;

  console.log('Received data:', req.body);

  if (!project) {
    return res.status(400).json({ error: 'Проект обязателен!' });
  }

  const projectId = new mongoose.Types.ObjectId(project);

  if (!title || !description || !assignee || !due) {
    return res.status(400).json({ error: 'Заполните все поля!' });
  }

  try {
    const task = new Task({
      title,
      description,
      status: status || 'todo',
      assignee: new mongoose.Types.ObjectId(assignee),
      project: projectId,
      due,
      file: file ? `uploads/files/${file.filename}` : null,
    });

    await task.save();
    await task.populate('assignee', 'name login');
    await task.populate('project', 'title');

    res.status(201).json(task);
  } catch (err) {
    console.error('Ошибка при создании задачи:', err);
    res.status(500).json({ error: 'Не удалось создать задачу' });
  }
});

// Получить все задачи
router.get('/', auth, async (req, res) => {
  try {
    let tasks;

    if (req.user.role === 'admin') {
      // Админ видит все задачи
      tasks = await Task.find()
          .populate('project', 'title')
          .populate('assignee', 'name login role')
          .sort({ createdAt: -1 });
    } else {
      // Обычный пользователь видит только задачи, где он исполнитель
      tasks = await Task.find({ assignee: req.user.id })
          .populate('project', 'title')
          .populate('assignee', 'name login role')
          .sort({ createdAt: -1 });
    }

    res.json(tasks);
  } catch (err) {
    console.error('Ошибка при получении задач:', err);
    res.status(500).json({ error: 'Не удалось получить задачи' });
  }
});

// Получить задачи по ID проекта
router.get('/tasks/:projectId', auth, async (req, res) => {
  try {
    let tasks;

    if (req.user.role === 'admin') {
      // Админ видит все задачи проекта
      tasks = await Task.find({ project: req.params.projectId })
          .populate('assignee', 'name login role')
          .sort({ createdAt: -1 });
    } else {
      // Обычный пользователь видит только свои задачи в проекте
      tasks = await Task.find({
        project: req.params.projectId,
        assignee: req.user.id
      })
          .populate('assignee', 'name login role')
          .sort({ createdAt: -1 });
    }

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении задач' });
  }
});

// Получить задачу по id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
        .populate('assignee', 'name login role')
        .populate('project', 'title');

    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Проверка прав доступа для обычных пользователей
    if (req.user.role !== 'admin' && task.assignee._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении задачи' });
  }
});

router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, description, status, assignee, project, due, removeFile } = req.body;
    const file = req.file;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    // Проверка прав доступа
    if (req.user.role !== 'admin' && task.assignee.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const updatedData = {};

    if (title !== undefined) updatedData.title = title;
    if (description !== undefined) updatedData.description = description;
    if (status !== undefined) updatedData.status = status;
    if (project !== undefined) updatedData.project = project;
    if (due !== undefined) updatedData.due = due;

    if (assignee !== undefined) {
      updatedData.assignee = assignee ? new mongoose.Types.ObjectId(assignee) : null;
    }

  // === Логика файла ===
if (file) {
  // Новый файл пришёл → сохраняем
  const newFilePath = `uploads/files/${file.filename}`;
  
  if (task.file) {
    const oldFilePath = path.join(__dirname, '..', task.file);
    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
  }

  updatedData.file = newFilePath;

} else if (removeFile === 'true') {
  // Только удаление, если нового файла нет
  if (task.file) {
    const oldFilePath = path.join(__dirname, '..', task.file);
    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
  }
  updatedData.file = null;
}

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updatedData, { new: true })
      .populate('assignee', 'name login role')
      .populate('project', 'title');

    return res.json(updatedTask);

  } catch (err) {
    console.error('Ошибка при обновлении задачи:', err);
    res.status(500).json({ error: 'Не удалось обновить задачу' });
  }
});


// Удалить задачу
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Проверка прав доступа для обычных пользователей
    if (req.user.role !== 'admin' && task.assignee._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления задачи' });
    }

    // Если файл был прикреплен, удаляем его с сервера
    if (task.file) {
      const filePath = path.join(__dirname, '..', task.file);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Не удалось удалить файл:', err);
        });
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Задача удалена' });
  } catch (err) {
    console.error('Ошибка при удалении задачи:', err);
    res.status(500).json({ error: 'Не удалось удалить задачу' });
  }
});

// Скачать файл
router.get('/download/:filePath', auth, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'files', req.params.filePath);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'Файл не найден' });
  }
});

module.exports = router;