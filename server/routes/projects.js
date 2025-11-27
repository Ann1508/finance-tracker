// routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Создать проект
router.post('/', auth, async (req, res) => {
  try {
    const { title, description } = req.body;

    const project = new Project({
      title,
      description: description || '',
      createdBy: req.user.id
    });

    await project.save();

    // Populate создателя
    await project.populate('createdBy', 'login name role');

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Ошибка при создании проекта' });
  }
});

// Получить все проекты
router.get('/', auth, async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      // Админ видит все проекты
      projects = await Project.find()
          .populate('createdBy', 'login name role')
          .sort({ createdAt: -1 });
    } else {
      // Обычный пользователь видит только проекты, где он исполнитель в задачах

      // Находим проекты, где пользователь исполнитель в задачах
      const tasksWithUser = await Task.find({
        assignee: req.user.id
      }).distinct('project');

      projects = await Project.find({
        _id: { $in: tasksWithUser }
      })
          .populate('createdBy', 'login name role')
          .sort({ createdAt: -1 });
    }

    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Ошибка при получении проектов' });
  }
});

// Получить проект по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
        .populate('createdBy', 'login name role');

    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    // Для админа - полный доступ
    if (req.user.role === 'admin') {
      return res.json(project);
    }

    // Проверяем, есть ли задачи в проекте, где пользователь исполнитель
    const userTasksInProject = await Task.findOne({
      project: req.params.id,
      assignee: req.user.id
    });

    const hasTasksAsAssignee = !!userTasksInProject;

    if (!hasTasksAsAssignee) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Ошибка при получении проекта' });
  }
});

// Обновить проект
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    // Проверка прав доступа
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования проекта' });
    }

    const { title, description } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description
        },
        { new: true, runValidators: true }
    )
        .populate('createdBy', 'login name role');

    res.json(updatedProject);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Ошибка при обновлении проекта' });
  }
});

// Удалить проект
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    // Проверка прав доступа
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления проекта' });
    }

    // Удаляем связанные задачи
    await Task.deleteMany({ project: req.params.id });

    // Удаляем проект
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Проект и связанные задачи удалены' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Ошибка при удалении проекта' });
  }
});

module.exports = router;