// client/src/components/Nav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Clock from './Clock';

export default function Nav() {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
      isActive
        ? 'bg-white text-purple-600 shadow'
        : 'text-white hover:bg-purple-500/40'
    }`;

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-purple-600 to-indigo-600 text-white shadow-xl z-50">
      
      {/* Лого */}
      <NavLink
        to="/"
        className="flex items-center gap-2 px-6 py-5 text-xl font-bold border-b border-white/20
                  hover:bg-white/10 transition-colors"
      >
        <span className="text-2xl">💰</span>
        <span>Finance Tracker</span>
      </NavLink>

      {/* Часы и цитата */}
      <div className="px-6 py-4 border-b border-white/20">
        <Clock />

        <div className="mt-4 pl-3 border-l-2 border-white/30 animate-fade-up-delayed">
          <p className="text-sm italic text-white/90">
            «Время — деньги»
          </p>
          <p className="text-xs text-white/60 mt-1">
            Бенджамин Франклин
          </p>
        </div>
      </div>


      {/* Навигация */}
      <nav className="flex flex-col gap-2 px-4 py-4">
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
              🔐 Вход
            </NavLink>

            <NavLink to="/register" className={linkClass}>
              📝 Регистрация
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
