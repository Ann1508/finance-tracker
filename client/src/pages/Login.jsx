import React, { useState } from 'react';
import { auth } from '../Api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await auth.login(login, password);
      localStorage.setItem('token', res.token);

      window.location.href = '/profile'; // <-- правильно!
    } catch (err) {
      console.error(err);
      alert(err.error || 'Ошибка входа');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Вход</h1>
      <form onSubmit={handleLogin} className="bg-white p-4 rounded shadow space-y-4">
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Войти
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Ещё нет аккаунта?{' '}
        <Link to="/register" className="text-purple-600 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
