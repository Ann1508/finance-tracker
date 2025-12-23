// pages/Projects.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { projects as projectsApi } from '../Api'; // Закомментируем или удалим импорт REST API
import { useAuth } from '../hooks/useAuth';
import ProjectList from "../components/ProjectList";

// Определяем GraphQL-запросы и мутации
const GET_PROJECTS = `
  query GetProjects {
    projects {
      id
      title
      description
      createdBy {
        id
        login
        name
        role
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_TASKS = `
  query GetTasks {
    tasks {
      id
      title
      assignee { id }
      project { id }
    }
  }
`;

const UPDATE_PROJECT = `
  mutation UpdateProject($id: ID!, $input: ProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      title
      description
      createdBy {
        id
        login
        name
        role
      }
      createdAt
      updatedAt
    }
  }
`;

const DELETE_PROJECT = `
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

async function graphqlFetch(query, variables = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  // Проверяем, что ответ вообще содержит тело
  let text;
  try {
    text = await res.text(); // ← читаем сырой ответ
  } catch (e) {
    console.error("Не удалось прочитать ответ от сервера");
    throw e;
  }

  // Пытаемся разобрать как JSON
  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    console.error("Сервер вернул НЕ JSON:", text);
    throw new Error("Сервер вернул невалидный JSON");
  }

  // Проверка GraphQL ошибок
  if (result.errors) {
    console.error("GraphQL Error:", result.errors);
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data;
}


export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchProjects = async () => {
     try {
      setError('');
      const data = await graphqlFetch(GET_PROJECTS);
      const taskData = await graphqlFetch(GET_TASKS);

      const normalizedProjects = data.projects.map(p => ({
        id: p.id || p._id,
        name: p.title,
        description: p.description,
        createdBy: p.createdBy,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));

      setProjects(normalizedProjects);
      setTasks(taskData.tasks);
    } catch (err) {
      console.error('Ошибка при загрузке:', err);
      setError('Не удалось загрузить проекты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async (id) => {
    try {
      await graphqlFetch(DELETE_PROJECT, { id });
      setProjects(prev => prev.filter(p => p.id !== id));
      alert('Проект успешно удален');
    } catch (err) {
      console.error('Ошибка при удалении проекта:', err);
      alert(err.message || 'Не удалось удалить проект');
    }
  };

  const handleEditProject = async (id, projectData) => {
    try {
      const input = { title: projectData.title, description: projectData.description };


      const updatedData = await graphqlFetch(UPDATE_PROJECT, { id, input });

      // Обновляем локальный state
      setProjects(prev => prev.map(p =>
          p.id === id
              ? { ...p, name: updatedData.updateProject.title, description: updatedData.updateProject.description }
              : p
      ));
      alert('Проект успешно обновлен');
    } catch (err) {
      console.error('Ошибка при обновлении проекта:', err);
      alert(err.message || 'Не удалось обновить проект');
      throw err;
    }
  };

  // Функция подсчета задач текущего пользователя для проекта
// Подсчет всех задач проекта
const getAllTaskCount = (project) => {
  return tasks.filter(t => t.project.id === project.id).length;
};

// Подсчет задач текущего пользователя в проекте
const getUserTaskCount = (project) => {
  return tasks.filter(t => t.project.id === project.id && t.assignee?.id === user._id).length;
};

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-64">
          <div className="text-purple-600 text-lg">Загрузка проектов...</div>
        </div>
    );
  }

  return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Проекты</h1>
            {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Роль: <span className={`font-medium ${
                    user.role === 'admin' ? 'text-red-600' : 'text-blue-600'
                }`}>
                {user.role === 'admin' ? 'Администратор' : 'Участник'}
              </span>
                </p>
            )}
            {user?.role !== 'admin' && (
                <p className="text-sm text-gray-500 mt-1">
                  Показаны проекты, где вы назначены исполнителем задач
                </p>
            )}
          </div>

          {user?.role === 'admin' && (
              <Link
                  to="/projects/new"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                + Создать проект
              </Link>
          )}
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
        )}

        <ProjectList
          projects={projects}
          onDeleteProject={handleDeleteProject}
          onEditProject={handleEditProject}
          currentUser={user}
          getUserTaskCount={getUserTaskCount}
          getAllTaskCount={getAllTaskCount}// Внимание: см. комментарий выше
        />
      </div>
  );}