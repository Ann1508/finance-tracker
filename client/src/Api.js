import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = {
  // Projects
  getProjects: () => axios.get(`${API_URL}/projects`).then(res => res.data),
  getProjectById: (id) => axios.get(`${API_URL}/projects/${id}`).then(res => res.data),
  createProject: (name) => axios.post(`${API_URL}/projects`, { name }).then(res => res.data),
  updateProject: (id, data) => axios.put(`${API_URL}/projects/${id}`, data).then(res => res.data),
  deleteProject: (id) => axios.delete(`${API_URL}/projects/${id}`),

  // Tasks
  getTasks: (projectId) => axios.get(`${API_URL}/projects/${projectId}/tasks`).then(res => res.data),
  getTask: (projectId, taskId) => axios.get(`${API_URL}/projects/${projectId}/tasks/${taskId}`).then(res => res.data),
  createTask: (projectId, task) => axios.post(`${API_URL}/projects/${projectId}/tasks`, task).then(res => res.data),
  updateTask: (projectId, taskId, task) => axios.put(`${API_URL}/projects/${projectId}/tasks/${taskId}`, task).then(res => res.data),
  deleteTask: (projectId, taskId) => axios.delete(`${API_URL}/projects/${projectId}/tasks/${taskId}`),
};
