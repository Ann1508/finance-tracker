import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProjectList from '../components/ProjectList';
import axios from 'axios';

export default function Projects(/* { projects, setProjects } */) {
  // Старый способ через props:
  // const { projects, setProjects } = props;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/projects')
      .then(res => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteProject = async (id) => {
    await axios.delete(`http://localhost:5000/api/projects/${id}`);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div>Загрузка проектов...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Проекты</h1>

        <Link
          to="/projects/new"
          className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700"
        >
          + Создать проект
        </Link>
      </div>

      <ProjectList
        projects={projects}
        onSelectProject={() => {}}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  );
}
