import React, { useEffect, useState } from 'react';
import { auth } from '../Api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const me = await auth.getMe(token); // передаем токен для запроса
        setUser(me);
      } catch (err) {
        console.error('Ошибка при загрузке профиля', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    navigate('/login');
    setTimeout(() => window.location.reload(), 50);
  };

  if (loading) return <p>Загрузка...</p>;
  if (!user) return (
    <div>
      <p>Пользователь не найден. Пожалуйста, войдите.</p>
      <button className="mt-2 px-3 py-2 bg-purple-600 text-white rounded" onClick={() => navigate('/login')}>
        Войти
      </button>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Профиль пользователя</h1>
      <div className="bg-white p-4 rounded shadow-sm border">
        <div className="mb-2"><strong>Имя:</strong> {user.login}</div>
        <div><strong>Роль:</strong> {user.role}</div>
      </div>
      
      {/* Кнопка выхода */}
      <button
        className="mt-4 px-3 py-2 bg-red-600 text-white rounded"
        onClick={handleLogout}
      >
        Выйти
      </button>
    </div>
  );
}
