// pages/ProjectPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import { tasks as tasksApi, projects as projectsApi, users as usersApi } from '../Api';
import { useAuth } from '../hooks/useAuth';

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(false);
  const [editProjectData, setEditProjectData] = useState({
    title: '',
    description: ''
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    status: 'todo',
    due: new Date().toISOString().split('T')[0],
  });

  const fetchUsers = async () => {
    try {
      const usersList = await usersApi.list();
      setUsers(usersList);
    } catch (err) {
      console.error('Ошибка при загрузке пользователей:', err);
    }
  };
// pages/ProjectPage.js (обновите fetchProject)
  const fetchProject = async () => {
    setLoading(true);
    setError('');
    try {
      const projectRes = await projectsApi.get(id);
      const tasksRes = await tasksApi.list();

      const projectTasks = tasksRes.filter(task =>
          task.project && task.project._id === id
      );

      // Для обычного пользователя фильтруем задачи, показывая только те, где он исполнитель
      let filteredTasks = projectTasks;
      if (user?.role !== 'admin') {
        filteredTasks = projectTasks.filter(task =>
            task.assignee?._id === user?._id || task.assignee === user?._id
        );
      }

      setProject({
        ...projectRes,
        tasks: filteredTasks,
      });
    } catch (err) {
      console.error('Ошибка при загрузке проекта:', err);
      if (err.message.includes('Доступ запрещен')) {
        setError('У вас нет доступа к этому проекту');
      } else {
        setError('Не удалось загрузить проект');
      }
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [id]);

  const canEditProject = () => {
    if (!project || !user) return false;
    if (user.role === 'admin') return true;
    return project.createdBy?._id === user.id;
  };

  const canDeleteProject = () => {
    if (!project || !user) return false;
    if (user.role === 'admin') return true;
    return project.createdBy?._id === user.id;
  };

  const canAddTask = () => {
    if (!project || !user) return false;
    if (user.role === 'admin') return true;
    return project.createdBy?._id === user.id;
  };

  const handleEditProject = async () => {
    if (!editProjectData.title.trim()) {
      alert('Название проекта обязательно');
      return;
    }

    try {
      await projectsApi.update(id, editProjectData);
      setEditingProject(false);
      fetchProject();
      alert('Проект успешно обновлен');
    } catch (err) {
      console.error('Ошибка при обновлении проекта:', err);
      alert(err.error || 'Не удалось обновить проект');
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectsApi.remove(id);
      alert('Проект и все его задачи успешно удалены');
      navigate('/projects');
    } catch (err) {
      console.error('Ошибка при удалении проекта:', err);
      alert(err.error || 'Не удалось удалить проект');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const { title, description, assignee, status, due, file } = newTask;

    if (!title.trim() || !description.trim() || !assignee) {
      alert('Заполните все обязательные поля!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('assignee', assignee);
      formData.append('status', status);
      formData.append('due', due);
      formData.append('project', id);

      if (file) {
        formData.append('file', file);
      }

      await tasksApi.create(formData);

      setNewTask({
        title: '',
        description: '',
        assignee: '',
        status: 'todo',
        due: new Date().toISOString().split('T')[0],
        file: null,
      });

      setShowTaskForm(false);
      fetchProject();
    } catch (err) {
      console.error('Ошибка при добавлении задачи:', err);
      alert(err?.error || err?.message || 'Не удалось добавить задачу');
    }
  };

  const handleSaveTask = async (task) => {
    try {
      if (!task._id) {
        throw new Error("ID задачи не передано!");
      }

      const formData = new FormData();
      formData.append('title', task.title || '');
      formData.append('description', task.description || '');
      formData.append('status', task.status || '');
      formData.append('assignee', task.assignee?._id || task.assignee || '');
      formData.append('project', task.project?._id || task.project || '');
      formData.append('due', task.due || '');

          // === УДАЛЕНИЕ ФАЙЛА ===
    if (task.removeFile === true) {
      formData.append("removeFile", "true");
    }

    // === ЗАМЕНА / ДОБАВЛЕНИЕ НОВОГО ФАЙЛА ===
    // task.newFile — это File, выбранный пользователем
    if (task.newFile) {
      formData.append("file", task.newFile);
    }

      await tasksApi.update(task._id, formData);
      setEditingTask(null);
      fetchProject();
    } catch (err) {
      console.error('Ошибка при обновлении задачи:', err);
      alert('Не удалось сохранить задачу');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Вы уверены, что хотите удалить задачу?')) {
      return;
    }

    try {
      await tasksApi.remove(taskId);
      fetchProject();
    } catch (err) {
      console.error('Ошибка при удалении задачи:', err);
      alert('Не удалось удалить задачу');
    }
  };

  const statuses = [
    { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
    { key: 'in-progress', label: 'In Progress', color: 'bg-blue-50' },
    { key: 'done', label: 'Done', color: 'bg-green-50' }
  ];

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-64">
          <div className="text-purple-600 text-lg">Загрузка проекта...</div>
        </div>
    );
  }

  if (!project) {
    return (
        <div className="p-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-red-800 mb-2">Проект не найден</h2>
            <p className="text-red-600 mb-4">Возможно, проект был удален или у вас нет к нему доступа.</p>
            <button
                onClick={() => navigate('/projects')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Вернуться к проектам
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="p-4">
        {/* Хедер проекта */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.title || project.name}
              </h1>
              {project.description && (
                  <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {/*<span>Участников: {project.participants?.length || 0}</span>*/}
                <span>Задач: {project.tasks?.length || 0}</span>
                {project.createdBy && (
                    <span>Создатель: {project.createdBy.name || project.createdBy.login}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2 ml-4">
              <button
                  onClick={() => navigate('/projects')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                ← Назад
              </button>

              {canEditProject() && (
                  <button
                      onClick={() => {
                        setEditingProject(true);
                        setEditProjectData({
                          title: project.title || project.name,
                          description: project.description || ''
                        });
                      }}
                      className="bg-blue-300 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center space-x-2"
                  >
                    <span>✏️</span>
                    <span>Изменить проект</span>
                  </button>
              )}

              {canDeleteProject() && (
                  <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-300 hover:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>Удалить проект</span>
                  </button>
              )}
            </div>
          </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
        )}

        {/* Кнопка добавления задачи - теперь видна только админу или создателю проекта */}
        {canAddTask() && (
            <div className="mb-6">
              <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showTaskForm ? '✕ Отмена' : '+ Добавить задачу'}
              </button>
            </div>
        )}

        {/* Форма добавления задачи */}
        {showTaskForm && (
            <form onSubmit={handleAddTask} className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Новая задача</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Название задачи *"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <select
                    value={newTask.assignee}
                    onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Выберите исполнителя *</option>
                  {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.login} {user.role === 'admin' ? '(Админ)' : ''}
                      </option>
                  ))}
                </select>
              </div>
              <textarea
                  placeholder="Описание задачи *"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4 resize-none"
              />
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                      value={newTask.status}
                      onChange={e => setNewTask({ ...newTask, status: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <input
                      type="date"
                      value={newTask.due}
                      onChange={e => setNewTask({ ...newTask, due: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                      type="file"
                      onChange={(e) => setNewTask({ ...newTask, file: e.target.files[0] })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Создать задачу
                </button>
              </div>
            </form>
        )}

        {/* Канбан доска */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map(({ key, label, color }) => (
              <div key={key} className={`${color} rounded-lg shadow-sm border`}>
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg text-center text-gray-800">
                    {label}
                  </h2>
                </div>
                <div className="p-4 space-y-4 min-h-64">
                  {project.tasks && project.tasks.filter(t => t.status === key).length > 0 ? (
                      project.tasks
                          .filter(t => t.status === key)
                          .map(t => (
                              <TaskCard
                                  key={t._id}
                                  task={t}
                                  onEdit={task => setEditingTask(task)}
                                  onDelete={handleDeleteTask}
                              />
                          ))
                  ) : (
                      <div className="text-center text-gray-500 py-8">
                        Нет задач
                      </div>
                  )}
                </div>
              </div>
          ))}
        </div>

        {/* Модальное окно редактирования проекта */}
        {editingProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                 onClick={() => setEditingProject(false)}>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md"
                   onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Редактировать проект</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название проекта *
                      </label>
                      <input
                          type="text"
                          value={editProjectData.title}
                          onChange={e => setEditProjectData({...editProjectData, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Введите название проекта"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Описание проекта
                      </label>
                      <textarea
                          value={editProjectData.description}
                          onChange={e => setEditProjectData({...editProjectData, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Введите описание проекта"
                          rows="4"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-6 pt-4 border-t">
                    <button
                        className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                        onClick={() => setEditingProject(false)}
                    >
                      Отмена
                    </button>
                    <button
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        onClick={handleEditProject}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Модальное окно подтверждения удаления проекта */}
        {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                 onClick={() => setShowDeleteConfirm(false)}>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md"
                   onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
                    Удалить проект?
                  </h2>
                  <p className="text-gray-600 text-center mb-6">
                    Вы уверены, что хотите удалить проект <strong>"{project.title}"</strong>?
                    <br />
                    Все задачи проекта ({project.tasks?.length || 0}) также будут удалены.
                    <br />
                    <span className="text-red-600 font-medium">Это действие нельзя отменить!</span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        disabled={deleting}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                            deleting
                                ? 'bg-red-400 cursor-not-allowed text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                      {deleting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Удаление...</span>
                          </>
                      ) : (
                          <>
                            <span>🗑️</span>
                            <span>Удалить проект</span>
                          </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Модальное окно редактирования задачи */}
{editingTask && (
    <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setEditingTask(null)}
    >
      <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Редактировать задачу</h2>

          <div className="space-y-4">

            {/* Название */}
            <input
                type="text"
                value={editingTask.title}
                onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Название задачи"
            />

            {/* Описание */}
            <textarea
                value={editingTask.description}
                onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Описание"
                rows="4"
            />

            {/* Исполнитель */}
            <select
                value={editingTask.assignee?._id || editingTask.assignee}
                onChange={e => setEditingTask({ ...editingTask, assignee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Выберите исполнителя</option>
              {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name || user.login} {user.role === 'admin' ? '(Админ)' : ''}
                  </option>
              ))}
            </select>

            {/* Статус */}
            <select
                value={editingTask.status}
                onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            {/* Дата */}
            <input
                type="date"
                value={editingTask.due}
                onChange={e => setEditingTask({ ...editingTask, due: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* === Блок работы с файлами === */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Файл</h3>

              {/* Если старый файл есть и его НЕ выбрали удалить */}
              {editingTask.file && !editingTask.removeFile && (
                  <div className="bg-gray-100 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-700">
                      Текущий файл:{" "}
                      <span className="font-semibold">
                        {editingTask.file.split("/").pop()}
                      </span>
                    </p>

                    <button
                        className="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => setEditingTask({ ...editingTask, removeFile: true })}
                    >
                      Удалить файл
                    </button>
                  </div>
              )}

              {/* Если файл удалён или его не было → показать загрузку */}
              {(editingTask.removeFile || !editingTask.file) && (
                  <div>
                    <input
                        type="file"
                        className="w-full"
                        onChange={e =>
                            setEditingTask({ ...editingTask, newFile: e.target.files[0] })
                        }
                    />
                  </div>
              )}
            </div>

          </div>

          {/* Кнопки */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <button
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                onClick={() => setEditingTask(null)}
            >
              Отмена
            </button>
            <button
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                onClick={() => handleSaveTask(editingTask)}
            >
              Сохранить
            </button>
          </div>

        </div>
      </div>
    </div>
)}

      </div>
  );
}
