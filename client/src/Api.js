// client/src/Api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function apiFetch(path, opts = {}) {
  const headers = opts.headers || {};
  const token = localStorage.getItem('token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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

// ========== АУТЕНТИФИКАЦИЯ ==========
export const auth = {
  register: (login, password, name, email) =>
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ login, password, name, email })
    }),

  login: (login, password) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    }),

  getMe: () => apiFetch('/api/users/me'),

  updateProfile: (userData) =>
    apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  changePassword: (currentPassword, newPassword) =>
    apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  forgotPassword: (email) =>
    apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (token, newPassword) =>
    apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    }),

  verifyEmail: (token) =>
    apiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),

  resendVerification: () =>
    apiFetch('/api/auth/resend-verification', {
      method: 'POST'
    }),

  logout: () =>
    apiFetch('/api/auth/logout', {
      method: 'POST'
    }),
};

// ========== КАТЕГОРИИ ==========
export const categories = {
  list: (type) => apiFetch(`/api/categories${type ? `?type=${type}` : ''}`),
  
  get: (id) => apiFetch('/api/categories/' + id),
  
  create: (payload) => apiFetch('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  
  update: (id, payload) => apiFetch('/api/categories/' + id, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  
  remove: (id) => apiFetch('/api/categories/' + id, { method: 'DELETE' }),
};

// ========== ТРАНЗАКЦИИ ==========
export const transactions = {
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/api/transactions${queryString ? `?${queryString}` : ''}`);
  },
  
  get: (id) => apiFetch('/api/transactions/' + id),
  
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/api/transactions/stats${queryString ? `?${queryString}` : ''}`);
  },
  
  create: (formData) => apiFetch('/api/transactions', {
    method: 'POST',
    body: formData // FormData для поддержки файлов
  }),
  
  update: (id, formData) => apiFetch('/api/transactions/' + id, {
    method: 'PUT',
    body: formData
  }),
  
  remove: (id) => apiFetch('/api/transactions/' + id, { method: 'DELETE' }),

  downloadReceipt: (filePath) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}/${filePath}`, { method: 'GET', headers });
  }
};

// ========== ПОЛЬЗОВАТЕЛИ (для админа) ==========
export const users = {
  list: () => apiFetch('/api/users'),
  get: (id) => apiFetch('/api/users/' + id),
  create: (payload) => apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  update: (id, payload) => apiFetch('/api/users/' + id, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  remove: (id) => apiFetch('/api/users/' + id, { method: 'DELETE' }),
};


export const budgets = {
  list: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}/api/budgets?${query}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    
    return response.json();
  },

  get: async (id) => {
    const response = await fetch(`${API_BASE}/api/budgets/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE}/api/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE}/api/budgets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    
    return response.json();
  },

  remove: async (id) => {
    const response = await fetch(`${API_BASE}/api/budgets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    
    return response.json();
  }
};