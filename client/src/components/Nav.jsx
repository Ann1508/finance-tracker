// client/src/components/Nav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Clock from './Clock';

export default function Nav() {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md font-medium transition ${
      isActive
        ? 'bg-white ring-2 ring-offset-2 ring-purple-500 text-purple-600'
        : 'bg-transparent hover:bg-purple-300/50 text-white'
    }`;

  return (
    <header className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      {/* Часы */}
      <div className="absolute top-2 right-4 z-10">
        <Clock />
      </div>

    <div className="max-w-7xl mx-auto flex items-center justify-between p-4 pr-24">
        {/* Лого */}
        <NavLink
          to="/"
          className="flex items-center gap-2 text-xl font-bold hover:text-indigo-200 transition-colors"
        >
          <span className="text-2xl">💰</span>
          <span>Finance Tracker</span>
        </NavLink>

        {/* Навигация */}
        <nav className="flex items-center space-x-2">
          <NavLink to="/" className={linkClass}>
            🏠 Главная
          </NavLink>

          {user ? (
            <>
              <NavLink to="/goals" className={linkClass}>
                🎯 Цели
              </NavLink>

              <NavLink to="/dashboard" className={linkClass}>
                📊 Дашборд
              </NavLink>

              <NavLink to="/categories" className={linkClass}>
                📁 Категории
              </NavLink>

              <NavLink to="/budgets" className={linkClass}>
                💳 Бюджеты
              </NavLink>

              <NavLink to="/envelopes" className={linkClass}>
                💌 Конверты
              </NavLink>

              <NavLink to="/profile" className={linkClass}>
                👤 Профиль
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Вход
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Регистрация
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}