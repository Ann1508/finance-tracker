// client/src/components/TransactionCard.jsx
import React from 'react';

export default function TransactionCard({ transaction, onDelete, onClick }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isIncome = transaction.type === 'income';

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
        isIncome
          ? 'bg-green-50 border-green-200 hover:bg-green-100'
          : 'bg-red-50 border-red-200 hover:bg-red-100'
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Иконка категории */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: transaction.category?.color + '20' }}
        >
          {transaction.category?.icon || '💰'}
        </div>

        {/* Информация о транзакции */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{transaction.title}</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <span>📁</span>
              {transaction.category?.name || 'Без категории'}
            </span>
            <span className="flex items-center gap-1">
              <span>📅</span>
              {formatDate(transaction.date)}
            </span>
          </div>
        </div>

        {/* Сумма */}
        <div className="text-right">
          <div
            className={`text-xl font-bold ${
              isIncome ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            {isIncome ? '📈 Доход' : '📉 Расход'}
          </div>
        </div>
      </div>

      {/* Кнопка удаления */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transaction._id);
          }}
          className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Удалить транзакцию"
        >
          🗑️
        </button>
      )}
    </div>
  );
}