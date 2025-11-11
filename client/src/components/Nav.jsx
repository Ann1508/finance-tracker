import React from 'react'
import { NavLink } from 'react-router-dom'
import Clock from './Clock'

export default function Nav() {
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md font-medium transition ${
      isActive
        ? 'bg-white ring-2 ring-offset-2 ring-purple-500 text-purple-600'
        : 'bg-transparent hover:bg-purple-300/50 text-white'
    }`

  return (
    <header className="relative bg-purple-500 text-white">
      {/* 🕒 Часы */}
      <div className="absolute top-2 right-4 z-10">
        <Clock />
      </div>

      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        {/* Лого теперь ведёт на / */}
        <NavLink
          to="/"
          className="text-lg font-bold hover:text-indigo-200 transition-colors"
        >
          cpp-project
        </NavLink>

        <nav className="space-x-2">
          <NavLink to="/" className={linkClass}>
            Главная
          </NavLink>

          <NavLink to="/projects" className={linkClass}>
            Проекты
          </NavLink>

          <NavLink to="/profile" className={linkClass}>
            Профиль пользователя
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
