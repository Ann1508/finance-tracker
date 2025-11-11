import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreateProjectPage(/* { projects, setProjects } */) {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Введите название проекта');

    // Создаем через API
    await axios.post('http://localhost:5000/api/projects', { name });

    // Старый способ через props:
    // setProjects([...projects, { id: Date.now().toString(), name, tasks: [] }]);

    navigate('/projects');
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Создать проект</h1>
      <form onSubmit={handleCreate} className="bg-white shadow p-4 rounded space-y-4">
        <input type="text" className="w-full px-3 py-2 border rounded bg-purple-50" placeholder="Название проекта"
          value={name} onChange={e => setName(e.target.value)} />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Создать</button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Отмена</button>
        </div>
      </form>
    </div>
  );
}
