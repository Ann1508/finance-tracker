import React, { useState, /* useContext */ } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TaskCard from '../components/TaskCard'
import axios from 'axios'
// import { ProjectsContext } from '../context/ProjectsContext'

export default function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // const { projects, setProjects } = useContext(ProjectsContext)

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    status: 'todo',
    due: new Date().toISOString().split('T')[0],
  })

  // Получаем проект с сервера
  React.useEffect(() => {
    axios.get(`http://localhost:5000/api/projects/${id}`)
      .then(res => setProject(res.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Загрузка проекта...</div>
  if (!project) return <div className="p-4">Проект не найден</div>

  const refreshProject = async () => {
    const res = await axios.get(`http://localhost:5000/api/projects/${id}`)
    setProject(res.data)
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    const { title, description, assignee, status, due } = newTask
    if (!title || !description || !assignee) return alert('Заполните все поля!')

    await axios.post(`http://localhost:5000/api/projects/${id}/tasks`, newTask)
    setNewTask({ title: '', description: '', assignee: '', status: 'todo', due: new Date().toISOString().split('T')[0] })
    refreshProject()
  }

  const handleDeleteTask = async (taskId) => {
    await axios.delete(`http://localhost:5000/api/projects/${id}/tasks/${taskId}`)
    refreshProject()
  }

  const handleSaveTask = async (task) => {
    await axios.put(`http://localhost:5000/api/projects/${id}/tasks/${task.id}`, task)
    setEditingTask(null)
    refreshProject()
  }

  const statuses = ['todo', 'in-progress', 'done']

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{project.name}</h1>

      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-2 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        ← Назад к проектам
      </button>

      <form onSubmit={handleAddTask} className="mb-8 p-4 bg-white rounded shadow space-y-4">
        <input type="text" placeholder="Название задачи" value={newTask.title}
          onChange={e => setNewTask({ ...newTask, title: e.target.value })}
          className="w-full px-3 py-2 border bg-purple-50 rounded" />
        <textarea placeholder="Описание" value={newTask.description}
          onChange={e => setNewTask({ ...newTask, description: e.target.value })}
          className="w-full px-3 py-2 border bg-purple-50 rounded resize-none" />
        <input type="text" placeholder="Исполнитель" value={newTask.assignee}
          onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
          className="w-full px-3 py-2 border bg-purple-50 rounded" />

        <div className="flex flex-col md:flex-row gap-2">
          <select value={newTask.status} onChange={e => setNewTask({ ...newTask, status: e.target.value })}
            className="px-3 py-2 border bg-purple-50 rounded">
            <option value="todo">ToDo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <input type="date" value={newTask.due} onChange={e => setNewTask({ ...newTask, due: e.target.value })}
            className="px-3 py-2 border bg-purple-50 rounded" />
          <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">Добавить задачу</button>
        </div>
      </form>

      {/* Редактирование задачи */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setEditingTask(null)}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Редактировать задачу</h2>
            <input type="text" value={editingTask.title}
              onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
              className="w-full px-3 py-2 border bg-purple-50 rounded" />
            <textarea value={editingTask.description}
              onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
              className="w-full px-3 py-2 border bg-purple-50 rounded resize-none" />
            <input type="text" value={editingTask.assignee}
              onChange={e => setEditingTask({ ...editingTask, assignee: e.target.value })}
              className="w-full px-3 py-2 border bg-purple-50 rounded" />
            <select value={editingTask.status}
              onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}
              className="w-full px-3 py-2 border bg-purple-50 rounded">
              <option value="todo">ToDo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <input type="date" value={editingTask.due}
              onChange={e => setEditingTask({ ...editingTask, due: e.target.value })}
              className="w-full px-3 py-2 border bg-purple-50 rounded" />
            <div className="flex justify-between mt-3">
              <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setEditingTask(null)}>Отмена</button>
              <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                onClick={() => handleSaveTask(editingTask)}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statuses.map(status => (
          <div key={status} className="bg-white p-2 rounded shadow">
            <h2 className="font-bold text-center mb-2">
              {status === 'todo' ? 'ToDo' :
               status === 'in-progress' ? 'In Progress' : 'Done'}
            </h2>
            {project.tasks.filter(t => t.status === status).map(t => (
              <TaskCard key={t.id} task={t} onEdit={task => setEditingTask(task)} onDelete={handleDeleteTask} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
