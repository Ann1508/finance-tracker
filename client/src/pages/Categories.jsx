// client/src/pages/Categories.jsx
import React, { useState, useEffect } from 'react';
import { categories as categoriesApi, transactions as transactionsApi } from '../Api';
import { useAuth } from '../hooks/useAuth';
import CategoryCard from '../components/CategoryCard';
import Analytics from '../components/Analytics';

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, income, expense
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    description: '',
    color: '#6366f1',
    icon: '💰'
  });

  const iconOptions = [
    '💰', '💵', '💳', '🏦', '💸', '🤑', '💴', '💶', '💷',
    '🛒', '🍕', '☕', '🚗', '🏠', '⚡', '📱', '🎮', '🎬',
    '✈️', '🏥', '💊', '📚', '🎓', '👕', '🎁', '🍔', '🍺'
  ];

  const colorOptions = [
    '#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, transRes] = await Promise.all([
        categoriesApi.list(),
        transactionsApi.list({ limit: 1000 })
      ]);

      setCategories(catsRes);
      setTransactions(transRes);
      
      // Вычисляем статистику по категориям на основе транзакций
      const statsMap = calculateCategoryStats(transRes);
      console.log('Статистика по категориям:', statsMap);
      setStats(statsMap);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // ✅ ОБНОВЛЕННАЯ функция для расчета статистики по категориям
  const calculateCategoryStats = (transactionsList) => {
    const statsMap = {};

    transactionsList.forEach(transaction => {
      // Универсально достаём ID категории
      let categoryId = null;

      if (transaction.categoryId) {
        categoryId = transaction.categoryId;
      } else if (transaction.category) {
        categoryId = typeof transaction.category === "object"
          ? transaction.category._id
          : transaction.category;
      }

      if (!categoryId) return;

      // ✅ ИСКЛЮЧАЕМ переводы между конвертами из статистики
      const isTransfer = transaction.title?.includes('Перевод между конвертами');
      if (isTransfer) {
        return;
      }

      if (!statsMap[categoryId]) {
        statsMap[categoryId] = { 
          total: 0, 
          count: 0,
          income: 0,
          expense: 0
        };
      }

      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        statsMap[categoryId].income += amount;
      } else if (transaction.type === "expense") {
        statsMap[categoryId].expense += amount;
      }

      statsMap[categoryId].total += amount;
      statsMap[categoryId].count++;
    });

    return statsMap;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Введите название категории');
      return;
    }

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory._id, formData);
      } else {
        await categoriesApi.create(formData);
      }

      setShowAddModal(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'expense',
        description: '',
        color: '#6366f1',
        icon: '💰'
      });
      fetchData();
    } catch (err) {
      console.error('Ошибка сохранения категории:', err);
      alert(err.error || 'Не удалось сохранить категорию');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить категорию?')) return;

    try {
      await categoriesApi.remove(id);
      fetchData();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert(err.error || 'Не удалось удалить категорию');
    }
  };

  const filteredCategories = filter === 'all'
    ? categories
    : categories.filter(c => c.type === filter);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-purple-600 text-lg">Загрузка категорий...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* АНАЛИТИКА */}
      {showAnalytics && (
        <div className="mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAnalytics(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              ✕ Закрыть аналитику
            </button>
          </div>
          <Analytics transactions={transactions} categories={categories} />
        </div>
      )}

      {/* Заголовок и кнопки */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Категории</h1>
          <p className="text-gray-600 mt-1">
            Управляйте категориями доходов и расходов
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            📊 {showAnalytics ? 'Скрыть' : 'Показать'} аналитику
          </button>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({
                name: '',
                type: 'expense',
                description: '',
                color: '#6366f1',
                icon: '💰'
              });
              setShowAddModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            + Создать категорию
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="text-gray-600 mb-2">Всего категорий</div>
          <div className="text-3xl font-bold text-gray-900">{categories.length}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="text-green-700 mb-2">Категорий доходов</div>
          <div className="text-3xl font-bold text-green-800">{incomeCategories.length}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="text-red-700 mb-2">Категорий расходов</div>
          <div className="text-3xl font-bold text-red-800">{expenseCategories.length}</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Все ({categories.length})
        </button>
        <button
          onClick={() => setFilter('income')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📈 Доходы ({incomeCategories.length})
        </button>
        <button
          onClick={() => setFilter('expense')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📉 Расходы ({expenseCategories.length})
        </button>
      </div>

      {/* Список категорий */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-gray-600 text-lg mb-4">Категорий пока нет</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Создать первую категорию
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map(category => {
            return (
              <CategoryCard
                key={category._id}
                category={category}
                stats={stats[category._id] || { 
                  total: 0, 
                  count: 0,
                  income: 0,
                  expense: 0
                }}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      {/* Модальное окно создания/редактирования */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Тип */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип категории *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.type === 'income'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📈 Доход
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.type === 'expense'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📉 Расход
                    </button>
                  </div>
                </div>

                {/* Название */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Например: Зарплата, Продукты"
                  />
                </div>

                {/* Иконка */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Иконка
                  </label>
                  <div className="grid grid-cols-9 gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 text-2xl rounded-lg transition-all ${
                          formData.icon === icon
                            ? 'bg-purple-100 ring-2 ring-purple-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Цвет */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цвет
                  </label>
                  <div className="grid grid-cols-10 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-offset-2 ring-purple-500'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Описание */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows="3"
                    placeholder="Дополнительная информация о категории"
                  />
                </div>

                {/* Предпросмотр */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: formData.color + '20' }}
                    >
                      {formData.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{formData.name || 'Название категории'}</div>
                      <div className="text-sm text-gray-600">
                        {formData.type === 'income' ? '📈 Доход' : '📉 Расход'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCategory(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingCategory ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}