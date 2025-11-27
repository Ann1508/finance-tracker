// Api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function apiFetch(path, opts = {}) {
  const headers = opts.headers || {};
  const token = localStorage.getItem('token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Для FormData не устанавливаем Content-Type
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(API_BASE + path, {
    ...opts,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `HTTP Error: ${res.status}`;
    console.error(`API Error (${res.status}): ${errorMsg}`);
    throw data || { error: errorMsg };
  }

  return data;
}
export const auth = {
  register: (login, password, name = '', email = '') =>
      apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          login,
          password,
          name,
          email
        })
      }),

  login: (login, password) =>
      apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password })
      }),

  getMe: () => apiFetch('/api/users/me'),

  // Дополнительные методы для работы с профилем
  updateProfile: (userId, userData) =>
      apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      }),

  changePassword: (userId, currentPassword, newPassword) =>
      apiFetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      }),

  // Восстановление пароля
  requestPasswordReset: (email) =>
      apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

  resetPassword: (token, newPassword) =>
      apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      }),

  // Верификация email
  verifyEmail: (token) =>
      apiFetch('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
      }),

  resendVerification: (email) =>
      apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

  // Управление сессиями
  refreshToken: () =>
      apiFetch('/api/auth/refresh', {
        method: 'POST'
      }),

  logout: () =>
      apiFetch('/api/auth/logout', {
        method: 'POST'
      }),
};

export const projects = {
  list: () => apiFetch('/api/projects'),
  get: (id) => apiFetch('/api/projects/' + id),
  create: (payload) => apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  update: (id, payload) => apiFetch('/api/projects/' + id, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  remove: (id) => apiFetch('/api/projects/' + id, { method: 'DELETE' }),
};

// Api.js - добавьте в экспорт tasks
export const tasks = {
    list: () => apiFetch('/api/tasks'),
    create: (payload) => apiFetch('/api/tasks', {
        method: 'POST',
        body: payload
    }),
    update: (id, payload) => apiFetch('/api/tasks/' + id, {
        method: 'PUT',
        body: payload
    }),
    remove: (id) => apiFetch('/api/tasks/' + id, { method: 'DELETE' }),

    // Новый метод для скачивания файла
    downloadFile: (filePath) => {
        const token = localStorage.getItem('token');
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(`${API_BASE}/${filePath}`, {
            method: 'GET',
            headers
        });
    }
};

export const users = {
  list: () => apiFetch('/api/users'),
  create: (payload) => apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  update: (id, payload) => apiFetch('/api/users/' + id, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
    get: (id) => apiFetch('/api/users/' + id, {method: 'GET'} ),
  remove: (id) => apiFetch('/api/users/' + id, { method: 'DELETE' }),
};
