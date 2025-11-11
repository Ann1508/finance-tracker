import React, { useState } from "react";

export default function TaskCard({ task, onEdit, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Карточка задачи */}
      <div
        onClick={() => setModalOpen(true)}
        className="p-3 bg-purple-50 rounded shadow mb-2 cursor-pointer hover:bg-purple-100 transition"
      >
        <div className="font-semibold">{task.title}</div>
        <div className="text-sm text-gray-600">{task.description}</div>
        <div className="text-sm">👤 {task.assignee}</div>
        <div className="text-sm">⏰ {task.due}</div>
      </div>

      {/* Модальное окно */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)} // закрытие при клике на задний план
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-72 space-y-4"
            onClick={(e) => e.stopPropagation()} // чтобы клик по окну не закрывал его
          >
            <h2 className="text-lg font-bold text-center mb-2">
              Что сделать с задачей?
            </h2>

            <button
              onClick={() => {
                setModalOpen(false);
                onEdit(task);
              }}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              ✏️ Изменить
            </button>

            <button
              onClick={() => {
                setModalOpen(false);
                onDelete(task.id);
              }}
              className="w-full px-4 py-2 bg-purple-400 text-white rounded hover:bg-purple-500 transition"
            >
              🗑 Удалить
            </button>

            <button
              onClick={() => setModalOpen(false)}
              className="w-full px-4 py-2 bg-purple-200 text-purple-800 rounded hover:bg-purple-300 transition"
            >
              ❌ Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}
