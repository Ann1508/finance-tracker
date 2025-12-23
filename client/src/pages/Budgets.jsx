// client/src/pages/Budgets.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { categories as categoriesApi, transactions as transactionsApi } from '../Api';
import SavingsTips from '../components/SavingsTips';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfScenario, setWhatIfScenario] = useState({
    expenseChange: 0,
    incomeChange: 0,
    duration: 'month'
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [period, setPeriod] = useState('month');
  
  const [formData, setFormData] = useState({
    categoryId: '',
    limit: '',
    period: 'month',
    alert_threshold: 80,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { startDate, endDate } = getPeriodDates(period);

      const [budgetsRes, catsRes, transRes] = await Promise.all([
        axios.get(`${API_BASE}/api/budgets`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        categoriesApi.list(),
        transactionsApi.list({ startDate, endDate, limit: 1000 })
      ]);

      setBudgets(budgetsRes.data || []);
      setCategories(catsRes);
      setTransactions(transRes);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = (period) => {
    const now = new Date();
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

// ✅ ОБНОВЛЕННАЯ ФУНКЦИЯ - исключаем переводы между конвертами
  const getCategorySpending = (categoryId) => {
    return transactions
      .filter(t => {
        const catId = typeof t.category === 'object' ? t.category._id : t.category;
        
        // ✅ ИСКЛЮЧАЕМ переводы между конвертами
        const isTransfer = t.title?.includes('Перевод между конвертами');
        if (isTransfer) {
          return false;
        }
        
        return catId === categoryId && t.type === 'expense';
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.limit) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = {
        categoryId: formData.categoryId,
        limit: parseFloat(formData.limit),
        period: formData.period,
        alert_threshold: parseInt(formData.alert_threshold),
        description: formData.description
      };

      if (editingBudget) {
        await axios.put(`${API_BASE}/api/budgets/${editingBudget._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/api/budgets`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowAddBudget(false);
      setEditingBudget(null);
      setFormData({
        categoryId: '',
        limit: '',
        period: 'month',
        alert_threshold: 80,
        description: ''
      });
      fetchData();
    } catch (err) {
      console.error('Ошибка сохранения бюджета:', err);
      alert('Не удалось сохранить бюджет');
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId._id || budget.categoryId,
      limit: budget.limit.toString(),
      period: budget.period,
      alert_threshold: budget.alert_threshold,
      description: budget.description || ''
    });
    setShowAddBudget(true);
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Удалить бюджет?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/budgets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить бюджет');
    }
  };

// ✅ ОТЛАДОЧНАЯ ВЕРСИЯ calculateWhatIf с логированием
const calculateWhatIf = () => {
  console.log('=== ОТЛАДКА calculateWhatIf ===');
  console.log('Всего транзакций:', transactions.length);
  
  // Логируем все транзакции
  transactions.forEach(t => {
    console.log(`${t.title} | type: ${t.type} | amount: ${t.amount}`);
  });

  const incomeTransactions = transactions.filter(t => {
    const isTransfer = t.title?.includes('Перевод между конвертами');
    const isReplenishment = t.title?.includes('Пополнение конверта');
    
    const shouldInclude = t.type === 'income' && !isTransfer && !isReplenishment;
    
    if (t.type === 'income') {
      console.log(`Income: ${t.title} | isTransfer: ${isTransfer} | isReplenishment: ${isReplenishment} | include: ${shouldInclude}`);
    }
    
    return shouldInclude;
  });

  const expenseTransactions = transactions.filter(t => {
    const isTransfer = t.title?.includes('Перевод между конвертами');
    const isExpenseConverte = t.title?.includes('Расход конверта');
    
    const shouldInclude = t.type === 'expense' && !isTransfer && !isExpenseConverte;
    
    if (t.type === 'expense') {
      console.log(`Expense: ${t.title} | isTransfer: ${isTransfer} | isExpenseConverte: ${isExpenseConverte} | include: ${shouldInclude}`);
    }
    
    return shouldInclude;
  });

  const currentStats = {
    income: incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    expense: expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  };

  console.log('Current Income:', currentStats.income);
  console.log('Current Expense:', currentStats.expense);

  const newIncome = currentStats.income + (currentStats.income * whatIfScenario.incomeChange / 100);
  const newExpense = currentStats.expense + (currentStats.expense * whatIfScenario.expenseChange / 100);
  const newBalance = newIncome - newExpense;

  const impactedBudgets = budgets.map(budget => {
    const categorySpending = getCategorySpending(budget.categoryId._id || budget.categoryId);
    const newSpending = categorySpending + (categorySpending * whatIfScenario.expenseChange / 100);
    const percentUsed = (newSpending / budget.limit) * 100;

    return {
      ...budget,
      currentSpending: categorySpending,
      newSpending: Math.round(newSpending * 100) / 100,
      percentUsed: Math.round(percentUsed),
      willExceed: newSpending > budget.limit,
      limit: budget.limit
    };
  });

  setWhatIfResult({
    currentIncome: currentStats.income,
    currentExpense: currentStats.expense,
    currentBalance: currentStats.income - currentStats.expense,
    newIncome: Math.round(newIncome * 100) / 100,
    newExpense: Math.round(newExpense * 100) / 100,
    newBalance: Math.round(newBalance * 100) / 100,
    incomeChange: whatIfScenario.incomeChange,
    expenseChange: whatIfScenario.expenseChange,
    impactedBudgets
  });

  console.log('=== КОНЕЦ ОТЛАДКИ ===');
};

  const getExpenseCategories = () => {
    return categories.filter(c => c.type === 'expense');
  };

  const getBudgetStatus = (spending, limit, threshold) => {
    const percentage = (spending / limit) * 100;
    
    if (percentage >= 100) return { label: 'Превышен', color: 'text-red-600', bg: 'bg-red-50', borderColor: 'border-red-200' };
    if (percentage >= threshold) return { label: 'Близко к лимиту', color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-200' };
    return { label: 'В норме', color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-purple-600 text-lg">Загрузка бюджетов...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Бюджеты</h1>
          <p className="text-gray-600 mt-1">Управляйте бюджетами по категориям и отслеживайте расходы</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWhatIf(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            🔮 Сценарий "Что если"
          </button>
          <button
            onClick={() => {
              setEditingBudget(null);
              setFormData({
                categoryId: '',
                limit: '',
                period: 'month',
                alert_threshold: 80,
                description: ''
              });
              setShowAddBudget(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Создать бюджет
          </button>
        </div>
      </div>

      {/* Фильтр периода */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPeriod('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === 'week'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Неделя
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === 'month'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Месяц
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === 'year'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Год
        </button>
      </div>

      {/* Список бюджетов */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg mb-4">Бюджетов пока нет</p>
          <button
            onClick={() => setShowAddBudget(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Создать первый бюджет
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map(budget => {
            const spending = getCategorySpending(budget.categoryId._id || budget.categoryId);
            const percentage = (spending / budget.limit) * 100;
            const status = getBudgetStatus(spending, budget.limit, budget.alert_threshold);
            const category = categories.find(c => c._id === (budget.categoryId._id || budget.categoryId));

            return (
              <div key={budget._id} className={`${status.bg} border ${status.borderColor} rounded-xl p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      {category?.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{category?.name}</h3>
                      <p className={`text-sm font-medium ${status.color}`}>{status.label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(budget._id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>

                {/* Прогресс бара */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Потрачено</span>
                    <span className="font-semibold">
                      {spending.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ / {budget.limit.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        percentage >= 100
                          ? 'bg-red-500'
                          : percentage >= budget.alert_threshold
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-sm text-gray-600 mt-1">
                    {percentage.toFixed(1)}% использовано
                  </div>
                </div>

                {/* Описание */}
                {budget.description && (
                  <p className="text-sm text-gray-700 mb-3">{budget.description}</p>
                )}

                {/* Информация */}
                <div className="flex justify-between text-xs text-gray-600 mb-4">
                  <span>Период: {budget.period === 'week' ? 'Неделя' : budget.period === 'month' ? 'Месяц' : 'Год'}</span>
                  <span>Предупреждение при {budget.alert_threshold}%</span>
                </div>

                {/* Кнопка редактирования */}
                <button
                  onClick={() => handleEditBudget(budget)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  ✏️ Редактировать
                </button>

                {/* Предупреждение */}
                {percentage >= budget.alert_threshold && percentage < 100 && (
                  <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg text-sm text-orange-800">
                    ⚠️ Вы потратили {percentage.toFixed(0)}% бюджета. Осталось {(budget.limit - spending).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                )}

                {percentage >= 100 && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800">
                    🚨 Бюджет превышен на {(spending - budget.limit).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно создания/редактирования бюджета */}
      {showAddBudget && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddBudget(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingBudget ? 'Редактировать бюджет' : 'Новый бюджет'}
              </h2>

              <form onSubmit={handleAddBudget} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Выберите категорию</option>
                    {getExpenseCategories().map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Лимит (₽) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.limit}
                    onChange={e => setFormData({ ...formData, limit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Период
                  </label>
                  <select
                    value={formData.period}
                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                    <option value="year">Год</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Предупреждение при (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.alert_threshold}
                    onChange={e => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows="3"
                    placeholder="Примечание к бюджету"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBudget(false);
                      setEditingBudget(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingBudget ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Советы по экономии */}
      <div className="mt-8">
        <SavingsTips 
          transactions={transactions}
          budgets={budgets}
          categories={categories}
        />
      </div>
      {showWhatIf && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWhatIf(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">🔮 Сценарий "Что если"</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изменение расходов на {whatIfScenario.expenseChange}%
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={whatIfScenario.expenseChange}
                    onChange={e =>
                      setWhatIfScenario({ ...whatIfScenario, expenseChange: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Снижение на 50%</span>
                    <span>Увеличение на 50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изменение доходов на {whatIfScenario.incomeChange}%
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={whatIfScenario.incomeChange}
                    onChange={e =>
                      setWhatIfScenario({ ...whatIfScenario, incomeChange: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <button
                  onClick={calculateWhatIf}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Рассчитать сценарий
                </button>
              </div>

              {whatIfResult && (
                <div className="space-y-6">
                  {/* Финансовый результат */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-bold text-lg mb-4">Финансовый результат</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Доходы</div>
                        <div className="text-lg font-bold text-green-600">
                          {whatIfResult.newIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-gray-600">
                          {whatIfResult.currentIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ →
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Расходы</div>
                        <div className="text-lg font-bold text-red-600">
                          {whatIfResult.newExpense.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-gray-600">
                          {whatIfResult.currentExpense.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ →
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Баланс</div>
                        <div className={`text-lg font-bold ${whatIfResult.newBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {whatIfResult.newBalance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-gray-600">
                          {whatIfResult.currentBalance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ →
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Влияние на бюджеты */}
                  {whatIfResult.impactedBudgets.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">Влияние на бюджеты</h3>
                      <div className="space-y-3">
                        {whatIfResult.impactedBudgets.map(budget => (
                          <div
                            key={budget._id}
                            className={`p-4 rounded-lg border ${
                              budget.willExceed
                                ? 'bg-red-50 border-red-200'
                                : 'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{budget.categoryId.name}</h4>
                              <span
                                className={`text-sm font-bold ${
                                  budget.willExceed ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {budget.percentUsed}% использовано
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {budget.currentSpending.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ →{' '}
                              <span className="font-semibold">
                                {budget.newSpending.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                              </span>{' '}
                              / {budget.limit.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                            </div>
                            {budget.willExceed && (
                              <div className="text-sm text-red-600 font-medium">
                                🚨 Будет превышен на{' '}
                                {(budget.newSpending - budget.limit).toLocaleString('ru-RU', {
                                  maximumFractionDigits: 0
                                })}{' '}
                                ₽
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t mt-6">
                <button
                  onClick={() => setShowWhatIf(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}