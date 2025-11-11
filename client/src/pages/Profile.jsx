import React from 'react'

export default function Profile() {
  const user = { name: 'Иван Иванов', email: 'ivan@example.com' }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Профиль пользователя</h1>
      <div className="bg-white p-4 rounded shadow-sm border">
        <div className="mb-2"><strong>Имя:</strong> {user.name}</div>
        <div><strong>Email:</strong> {user.email}</div>
      </div>
    </div>
  )
}
