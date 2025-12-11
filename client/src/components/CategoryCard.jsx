// client/src/components/CategoryCard.jsx
import React from 'react';

export default function CategoryCard({ category, stats, onEdit, onDelete }) {
  const isIncome = category.type === 'income';

  const handleDelete = () => {
    if (stats.count > 0) {
      alert(`Невозможно удалить категорию. У неё есть ${stats.count} транзакций.`);
      return;
    }

    if (window.confirm(`Удалить категорию "${category.name}"?`)) {
      onDelete(category._id);
    }
  };

  return (
    <div
      className={`rounded-xl p-6 border shadow-sm transition-all hover:shadow-md ${
        isIncome
          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
      }`}
    >
      {/* Иконка и название */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
          style={{ backgroundColor: category.color + '20' }}
        >
          {category.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl text-gray-900 mb-1 truncate">
            {category.name}
          </h3>
          <div className={`text-sm font-medium ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
            {isIncome ? '📈 Доход' : '📉 Расход'}
          </div>
        </div>
      </div>

      {/* Описание */}
      {category.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {category.description}
        </p>
      )}

      {/* Статистика */}
      <div className="space-y-2 mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Сумма:</span>
          <span className={`font-bold ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
            {stats.total.toLocaleString()} ₽
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Транзакций:</span>
          <span className="font-semibold text-gray-700">{stats.count}</span>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(category)}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200 flex items-center justify-center gap-2"
        >
          <span>✏️</span>
          <span>Изменить</span>
        </button>
        <button
          onClick={handleDelete}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            stats.count > 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
          }`}
          disabled={stats.count > 0}
          title={stats.count > 0 ? 'У категории есть транзакции' : 'Удалить категорию'}
        >
          <span>🗑️</span>
          <span>Удалить</span>
        </button>
      </div>
    </div>
  );
}