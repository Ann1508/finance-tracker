import React, { createContext, useState, useEffect } from 'react';
import { generateId } from '../utils/id';

// создаём контекст
export const ProjectsContext = createContext();

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('projects');
    if (saved) return JSON.parse(saved);

    return [
      {
        id: generateId(),
        name: 'Сайт портфолио',
        tasks: [
          { id: generateId(), title: 'Инициализация репозитория', description: 'Создать репозиторий на GitHub', assignee: 'Иван', status: 'done', due: new Date().toISOString() },
          { id: generateId(), title: 'Дизайн интерфейса', description: 'Создать макеты', assignee: 'Мария', status: 'in-progress', due: new Date().toISOString() },
          { id: generateId(), title: 'Написать документацию', description: 'Подготовить README', assignee: 'Алексей', status: 'todo', due: new Date().toISOString() },
        ]
      },
      { id: generateId(), name: 'Todo-приложение', tasks: [] }
    ]
  });

  // сохраняем в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  return (
    <ProjectsContext.Provider value={{ projects, setProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
}
