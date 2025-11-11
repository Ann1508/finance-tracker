import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Nav from './components/Nav';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import ProjectPage from './pages/ProjectPage';
import CreateProjectPage from './pages/CreateProjectPage';

// import { ProjectsProvider } from './context/ProjectsContext'; // Старый Context API закомментирован
import axios from 'axios';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Подключение к серверу и получение проектов
    axios.get('http://localhost:5000/api/projects')
      .then(res => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка проектов...</div>;

  return (
    // <ProjectsProvider> {/* Старый Context API закомментирован */} 
    <BrowserRouter>
      <div className="min-h-screen bg-purple-100 text-purple-900">
        <Nav />
        <main className="max-w-4xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Передаем projects и setProjects через props */}
            <Route path="/projects" element={<Projects projects={projects} setProjects={setProjects} />} />
            <Route path="/projects/new" element={<CreateProjectPage projects={projects} setProjects={setProjects} />} />
            <Route path="/projects/:id" element={<ProjectPage projects={projects} setProjects={setProjects} />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
    // </ProjectsProvider>
  );
}
