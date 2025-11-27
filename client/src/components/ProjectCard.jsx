import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasks as tasksApi } from '../Api'; // Импортируем API для задач

export default function ProjectCard({ project, onSelect, onDelete }) {
  const navigate = useNavigate();
  const [taskCount, setTaskCount] = useState(0); // Состояние для хранения количества задач

  // Загрузка всех задач и фильтрация их по проекту
useEffect(() => {
  if (project && project.id) {  // Используем project.id вместо project._id
    console.log('Проект:', project); // Логируем проект
    tasksApi.list()
      .then(tasks => {
        // Фильтруем задачи по проекту, используя project.id
        console.log('задачи:', tasks); // Логируем проект
        const projectTasks = tasks.filter(task => task.project.$oid === project._id.$oid);
        setTaskCount(projectTasks.length); // Обновляем количество задач для текущего проекта

        console.log('Задачи для проекта:', projectTasks); // Логируем задачи для проекта
        
      })
      .catch(err => {
        console.error('Ошибка при получении задач:', err);
      });
  } else {
    console.error('Ошибка: проект не найден или у проекта нет id');
  }
}, [project]);// Эффект срабатывает, когда изменяется проект

  return (
    <div className="p-4 bg-white rounded shadow hover:bg-indigo-50 cursor-pointer">
      <div onClick={onSelect}>
        <div className="font-bold text-lg">{project.name}</div>
        <div className="text-sm text-gray-500">
          Задач: {taskCount} {/* Выводим количество задач для проекта */}
        </div>
      </div>
      {onDelete && (
        <button
          className="mt-2 px-2 py-1 bg-purple-400 text-white rounded hover:bg-red-600"
          onClick={onDelete}
        >
          Удалить
        </button>
      )}
    </div>
  );
}
