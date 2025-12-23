import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { projects as projectsApi } from '../Api'; // импорт api.js

export default function CreateProjectPage({ projects, setProjects }) {
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Введите название проекта');

    try {
      const newProject = await projectsApi.create({ title, description: '', participants: [], tasks: [] });

      // Обновляем локальный state, если он передан через props
      if (setProjects) {
        setProjects([...projects, {
          id: newProject._id?.$oid || newProject._id,
          name: newProject.title,
          description: newProject.description || '',
          participants: newProject.participants || [],
          tasks: newProject.tasks || [],
        }]);
      }

      // Переходим на страницу всех проектов
      navigate('/projects');
    } catch (err) {
      console.error('Ошибка при создании проекта:', err);
      alert(err.error || 'Не удалось создать проект');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Создать проект</h1>
      <form onSubmit={handleCreate} className="bg-white shadow p-4 rounded space-y-4">
        <input
          type="text"
          className="w-full px-3 py-2 border rounded bg-purple-50"
          placeholder="Название проекта"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Создать</button>
          <button type="button" onClick={() => navigate('/projects')} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Отмена</button>
        </div>
      </form>
    </div>
  );
}
