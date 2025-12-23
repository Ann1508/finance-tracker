// client/src/pages/Goals.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const categoryIcons = {
  travel: '✈️',
  purchase: '🛍️',
  savings: '💰',
  education: '🎓',
  health: '🏥',
  other: '🎯'
};

const savingMethodLabels = {
  fixed: 'Фиксированная сумма',
  percentage: 'Процент от дохода',
  manual: 'Вручную',
  challenge: '52-недельный челлендж',
  table: 'Таблица накоплений'
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showGoalDetails, setShowGoalDetails] = useState(false);
  const [showTableNoteModal, setShowTableNoteModal] = useState(false);
  const [selectedTableValue, setSelectedTableValue] = useState(null);
  const [tableNote, setTableNote] = useState('');
  const [filter, setFilter] = useState('active');

  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    description: '',
    deadline: '',
    category: 'other',
    icon: '🎯',
    color: '#6366f1',
    savingMethod: 'manual',
    savingAmount: '',
    savingFrequency: 'monthly'
  });

  const [contributionData, setContributionData] = useState({
    amount: '',
    note: ''
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [goalsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/goals${filter !== 'all' ? `?status=${filter}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/goals/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setGoals(goalsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTableCellClick = (cellId, value, isChecked) => {
    if (isChecked) {
      // Если ячейка уже отмечена, просто отменяем
      toggleTableCell(cellId, value, '');
    } else {
      // Если не отмечена, показываем модаль для ввода источника
      setSelectedTableValue({ cellId, value });
      setTableNote('');
      setShowTableNoteModal(true);
    }
  };

  const toggleTableCell = async (cellId, value, note) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE}/api/goals/${selectedGoal._id}/table/toggle`,
        { cellId, value, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data;
      setSelectedGoal(updated);
      
      // Обновляем в списке
      setGoals(goals.map(g => g._id === updated._id ? updated : g));
    } catch (err) {
      console.error('Error toggling table cell:', err);
      alert(err.response?.data?.error || 'Ошибка при обновлении ячейки');
    }
  };

  const handleTableNoteSubmit = async () => {
    if (selectedTableValue) {
      setShowTableNoteModal(false);
      await toggleTableCell(selectedTableValue.cellId, selectedTableValue.value, tableNote);
      setSelectedTableValue(null);
      setTableNote('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingGoal) {
        await axios.put(`${API_BASE}/api/goals/${editingGoal._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/api/goals`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      setEditingGoal(null);
      setFormData({
        title: '',
        targetAmount: '',
        description: '',
        deadline: '',
        category: 'other',
        icon: '🎯',
        color: '#6366f1',
        savingMethod: 'manual',
        savingAmount: '',
        savingFrequency: 'monthly'
      });
      fetchData();
    } catch (err) {
      console.error('Error saving goal:', err);
      alert(err.response?.data?.error || 'Ошибка при сохранении цели');
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/goals/${selectedGoal._id}/contribute`,
        contributionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowContributeModal(false);
      setContributionData({ amount: '', note: '' });
      fetchData();
      
      if (showGoalDetails) {
        const updated = goals.find(g => g._id === selectedGoal._id);
        if (updated) setSelectedGoal(updated);
      }
    } catch (err) {
      console.error('Error adding contribution:', err);
      alert(err.response?.data?.error || 'Ошибка при добавлении вклада');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить цель?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Ошибка при удалении цели');
    }
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      description: goal.description || '',
      deadline: new Date(goal.deadline).toISOString().split('T')[0],
      category: goal.category,
      icon: goal.icon,
      color: goal.color,
      savingMethod: goal.savingMethod,
      savingAmount: goal.savingAmount.toString(),
      savingFrequency: goal.savingFrequency
    });
    setShowModal(true);
  };

  const openGoalDetails = (goal) => {
    setSelectedGoal(goal);
    setShowGoalDetails(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-purple-600 text-lg">Загрузка целей...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Финансовые цели</h1>
          <p className="text-gray-600 mt-1">Планируйте и достигайте своих целей</p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setFormData({
              title: '',
              targetAmount: '',
              description: '',
              deadline: '',
              category: 'other',
              icon: '🎯',
              color: '#6366f1',
              savingMethod: 'manual',
              savingAmount: '',
              savingFrequency: 'monthly'
            });
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
        >
          + Создать цель
        </button>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="text-gray-600 mb-2">Всего целей</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="text-green-700 mb-2">Активных</div>
            <div className="text-3xl font-bold text-green-800">{stats.active}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="text-blue-700 mb-2">Достигнуто</div>
            <div className="text-3xl font-bold text-blue-800">{stats.completed}</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="text-purple-700 mb-2">Средний прогресс</div>
            <div className="text-3xl font-bold text-purple-800">
              {stats.averageProgress.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

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
          Все
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Завершенные
        </button>
      </div>

      {/* Список целей */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-600 text-lg mb-4">Целей пока нет</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Создать первую цель
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <div key={goal._id} className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
              {/* Заголовок */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => openGoalDetails(goal)}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: goal.color + '20' }}
                  >
                    {categoryIcons[goal.category]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg hover:text-purple-600 transition-colors">{goal.title}</h3>
                    <div className="text-sm text-gray-500">
                      {new Date(goal.deadline).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Прогресс */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Прогресс</span>
                  <span className="font-semibold">{goal.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">
                    {goal.currentAmount.toLocaleString()} ₽
                  </span>
                  <span className="font-semibold text-gray-900">
                    {goal.targetAmount.toLocaleString()} ₽
                  </span>
                </div>
              </div>

              {/* Информация */}
              <div className="space-y-2 mb-4 text-sm">
                {goal.description && (
                  <p className="text-gray-600 line-clamp-2">{goal.description}</p>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <span>💡</span>
                  <span>Метод: {savingMethodLabels[goal.savingMethod]}</span>
                </div>
                {goal.recommendedMonthlyPayment > 0 && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <span>📊</span>
                    <span>
                      Рекомендуем: {goal.recommendedMonthlyPayment.toLocaleString()} ₽/мес
                    </span>
                  </div>
                )}
              </div>

              {/* Действия */}
              <div className="flex gap-2">
                {goal.status === 'active' && goal.savingMethod !== 'table' && (
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setShowContributeModal(true);
                    }}
                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    💰 Пополнить
                  </button>
                )}
                <button
                  onClick={() => openEditModal(goal)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(goal._id)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно деталей цели */}
      {showGoalDetails && selectedGoal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGoalDetails(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: selectedGoal.color + '20' }}
                  >
                    {categoryIcons[selectedGoal.category]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedGoal.title}</h2>
                    <p className="text-gray-600">{savingMethodLabels[selectedGoal.savingMethod]}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoalDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Прогресс */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                <div className="flex justify-between mb-3">
                  <span className="font-medium">Общий прогресс</span>
                  <span className="font-bold text-lg">{selectedGoal.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${Math.min(100, selectedGoal.progress)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-3 text-sm">
                  <span className="text-gray-600">Накоплено: {selectedGoal.currentAmount.toLocaleString()} ₽</span>
                  <span className="text-gray-600">Осталось: {Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()} ₽</span>
                </div>
              </div>

              {/* Таблица накоплений */}
              {selectedGoal.savingMethod === 'table' && selectedGoal.tableProgress && selectedGoal.tableProgress.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">📋 Таблица накоплений</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {selectedGoal.tableProgress.map((cell) => (
                      <button
                        key={cell._id}
                        onClick={() => handleTableCellClick(cell._id, cell.value, cell.checked)}
                        className={`p-3 border-2 rounded-lg text-center font-medium transition text-sm
                          ${
                            cell.checked
                              ? 'bg-green-200 border-green-400 line-through text-green-800'
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                          }`}
                        title={cell.note ? `Источник: ${cell.note}` : ''}
                      >
                        {cell.value.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Отмечено: {selectedGoal.tableProgress.filter(c => c.checked).length} / {selectedGoal.tableProgress.length}
                  </div>
                </div>
              )}

              {/* История вкладов */}
              {selectedGoal.savingMethod === 'table' && selectedGoal.contributions && selectedGoal.contributions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">📊 История накоплений</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-4 py-2 text-left font-semibold">Дата</th>
                          <th className="px-4 py-2 text-left font-semibold">Сумма</th>
                          <th className="px-4 py-2 text-left font-semibold">Источник</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGoal.contributions.map((contrib, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 text-xs">
                              {new Date(contrib.date).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-4 py-2 font-semibold text-green-600">
                              +{contrib.amount.toLocaleString()} ₽
                            </td>
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              {contrib.note || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Список всех пополнений */}
              {selectedGoal.savingMethod !== 'table' && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">💰 Все пополнения</h3>
                  {selectedGoal.contributions && selectedGoal.contributions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGoal.contributions.map((contrib, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div>
                            <div className="font-medium">{contrib.note || 'Пополнение'}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(contrib.date).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              +{contrib.amount.toLocaleString()} ₽
                            </div>
                            <div className="text-xs text-gray-500">
                              {((contrib.amount / selectedGoal.targetAmount) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Пополнений еще нет</p>
                    </div>
                  )}
                </div>
              )}

              {/* Действия */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedGoal.status === 'active' && selectedGoal.savingMethod !== 'table' && (
                  <button
                    onClick={() => {
                      setShowGoalDetails(false);
                      setShowContributeModal(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    💰 Пополнить
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowGoalDetails(false);
                    openEditModal(selectedGoal);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => {
                    setShowGoalDetails(false);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания/редактирования */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingGoal ? 'Редактировать цель' : 'Новая цель'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Например: Отпуск в Италии"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Целевая сумма *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.targetAmount}
                      onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="100000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Срок *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.deadline}
                      onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="travel">✈️ Путешествия</option>
                    <option value="purchase">🛍️ Покупка</option>
                    <option value="savings">💰 Накопления</option>
                    <option value="education">🎓 Образование</option>
                    <option value="health">🏥 Здоровье</option>
                    <option value="other">🎯 Другое</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Метод накопления
                  </label>
                  <select
                    value={formData.savingMethod}
                    onChange={e => setFormData({ ...formData, savingMethod: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="manual">Вручную</option>
                    <option value="fixed">Фиксированная сумма</option>
                    <option value="percentage">Процент от дохода</option>
                    <option value="challenge">52-недельный челлендж</option>
                    <option value="table">Таблица накоплений</option>
                  </select>
                </div>

                {(formData.savingMethod === 'fixed' || formData.savingMethod === 'percentage') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.savingMethod === 'percentage' ? 'Процент (%)' : 'Сумма'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.savingAmount}
                        onChange={e => setFormData({ ...formData, savingAmount: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Частота
                      </label>
                      <select
                        value={formData.savingFrequency}
                        onChange={e => setFormData({ ...formData, savingFrequency: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="daily">Ежедневно</option>
                        <option value="weekly">Еженедельно</option>
                        <option value="monthly">Ежемесячно</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows="3"
                    placeholder="Дополнительная информация о цели"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingGoal ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно пополнения */}
      {showContributeModal && selectedGoal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowContributeModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Пополнить цель</h2>
              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-lg">{selectedGoal.title}</div>
                <div className="text-sm text-gray-600">
                  Текущий прогресс: {selectedGoal.currentAmount.toLocaleString()} / {selectedGoal.targetAmount.toLocaleString()} ₽
                </div>
              </div>

              <form onSubmit={handleContribute} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Сумма *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={contributionData.amount}
                    onChange={e => setContributionData({ ...contributionData, amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Заметка
                  </label>
                  <input
                    type="text"
                    value={contributionData.note}
                    onChange={e => setContributionData({ ...contributionData, note: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Откуда средства"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowContributeModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Пополнить
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для ввода источника ячейки таблицы */}
      {showTableNoteModal && selectedTableValue && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTableNoteModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Отметить ячейку</h2>
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-lg text-green-900">
                  {selectedTableValue.value?.toLocaleString()} ₽
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Источник средств (опционально)
                </label>
                <input
                  type="text"
                  value={tableNote}
                  onChange={e => setTableNote(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Например: Зарплата, Подарок, Бонус"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleTableNoteSubmit();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTableNoteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleTableNoteSubmit}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Отметить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}