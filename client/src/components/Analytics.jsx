import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, AreaChart
} from 'recharts';

export default function Analytics({ transactions = [], categories = [] }) {
  const [analysisType, setAnalysisType] = useState('overview');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [comparePeriod, setComparePeriod] = useState('month');
  const [categoryPeriod, setCategoryPeriod] = useState('all'); // ✅ НОВОЕ: фильтр периода для категорий

  // ✅ НОВАЯ ФУНКЦИЯ: фильтрация транзакций по периоду
  const filterTransactionsByPeriod = (transactions, period) => {
    if (period === 'all') return transactions;

    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  // Обработка данных для графиков
  const chartData = useMemo(() => {
    const processedData = {
      monthlyTrend: [],
      categoryDistribution: [],
      weekdayHeatmap: [],
      forecast: [],
      income: 0,
      expense: 0,
      allTransactions: []
    };

    // Фильтруем транзакции: исключаем "Перевод между конвертами"
    const filteredTransactions = transactions.filter(t => !t.title?.includes('Перевод между конвертами'));

    // ✅ Применяем фильтр периода для распределения по категориям
    const periodFilteredTransactions = filterTransactionsByPeriod(filteredTransactions, categoryPeriod);

    // Группируем по месяцам (для тренда используем все транзакции)
    const monthlyData = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expense: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[month].income += parseFloat(t.amount) || 0;
        processedData.income += parseFloat(t.amount) || 0;
      } else {
        monthlyData[month].expense += parseFloat(t.amount) || 0;
        processedData.expense += parseFloat(t.amount) || 0;
      }
    });

    processedData.monthlyTrend = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // ✅ Распределение по категориям с учетом выбранного периода
    const categoryData = {};
    let periodExpense = 0;

    periodFilteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const catId = typeof t.category === 'object' ? t.category._id : t.category;
        const catName = typeof t.category === 'object' ? t.category.name : 'Без категории';
        const catIcon = typeof t.category === 'object' ? t.category.icon : '📊';
        
        if (!categoryData[catId]) {
          categoryData[catId] = {
            id: catId,
            name: catName,
            icon: catIcon,
            value: 0
          };
        }
        categoryData[catId].value += parseFloat(t.amount) || 0;
        periodExpense += parseFloat(t.amount) || 0;
      }
    });

    processedData.categoryDistribution = Object.values(categoryData).sort((a, b) => b.value - a.value);
    processedData.periodExpense = periodExpense; // ✅ Сохраняем расходы за период

    // Heatmap по дням недели (используем отфильтрованные транзакции)
    const heatmapData = {
      'Пн': 0, 'Вт': 0, 'Ср': 0, 'Чт': 0, 'Пт': 0, 'Сб': 0, 'Вс': 0
    };
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    periodFilteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const day = dayNames[new Date(t.date).getDay()];
        heatmapData[day] = (heatmapData[day] || 0) + (parseFloat(t.amount) || 0);
      }
    });

    processedData.weekdayHeatmap = Object.entries(heatmapData).map(([day, value]) => ({
      day,
      value
    }));

    // Прогноз
    if (processedData.monthlyTrend.length > 0) {
      const avgExpense = processedData.expense / processedData.monthlyTrend.length;
      const lastMonth = processedData.monthlyTrend[processedData.monthlyTrend.length - 1];
      
      processedData.forecast = [
        { ...lastMonth, type: 'actual' },
        { month: 'Прогноз', expense: Math.round(avgExpense), income: lastMonth.income, type: 'forecast' }
      ];
    }

    processedData.allTransactions = filteredTransactions;

    return processedData;
  }, [transactions, categoryPeriod]);

  // Сравнительный анализ
  const comparisonData = useMemo(() => {
    if (!selectedCategories.length) return null;

    const filteredTransactions = transactions.filter(t => !t.title?.includes('Перевод между конвертами'));

    const comparison = {};
    
    filteredTransactions.forEach(t => {
      const catId = typeof t.category === 'object' ? t.category._id : t.category;
      if (!selectedCategories.includes(catId)) return;

      const date = new Date(t.date);
      let period;

      if (comparePeriod === 'day') {
        period = date.toLocaleDateString('ru-RU');
      } else if (comparePeriod === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = `Неделя ${weekStart.toLocaleDateString('ru-RU')}`;
      } else {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!comparison[period]) {
        comparison[period] = {};
      }
      
      const catName = typeof t.category === 'object' ? t.category.name : 'Без категории';
      if (!comparison[period][catName]) {
        comparison[period][catName] = 0;
      }
      
      comparison[period][catName] += parseFloat(t.amount) || 0;
    });

    return Object.entries(comparison)
      .map(([period, cats]) => ({
        period,
        ...cats
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [selectedCategories, comparePeriod, transactions]);

  // Коэффициенты эффективности
  const metrics = useMemo(() => {
    const income = chartData.income;
    const expense = chartData.expense;
    
    return {
      savingsRatio: income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0,
      expenseRatio: income > 0 ? (expense / income * 100).toFixed(1) : 0,
      avgMonthlyExpense: (expense / (chartData.monthlyTrend.length || 1)).toFixed(0),
      maxCategory: chartData.categoryDistribution[0] || {},
      balance: income - expense
    };
  }, [chartData]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (!transactions.length) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg">Нет данных для анализа</p>
          <p className="text-gray-500 text-sm mt-2">Добавьте транзакции для просмотра статистики</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Заголовок */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 Финансовая Аналитика</h2>
        <p className="text-gray-600">Детальный анализ доходов, расходов и прогнозы</p>
      </div>

      {/* Переключатели режимов */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 border">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Тип анализа:</label>
          <div className="flex gap-2">
            {[
              { value: 'overview', label: '📈 Обзор' },
              { value: 'comparison', label: '⚖️ Сравнение' },
              { value: 'forecast', label: '🔮 Прогноз' }
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => {
                  setAnalysisType(mode.value);
                  if (mode.value !== 'comparison') setSelectedCategories([]);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  analysisType === mode.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* РЕЖИМ ОБЗОР */}
      {analysisType === 'overview' && (
        <div className="space-y-8">
          {/* Ключевые метрики */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="text-sm text-green-700 font-medium mb-1">Доходы</div>
              <div className="text-3xl font-bold text-green-900">{chartData.income.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="text-sm text-red-700 font-medium mb-1">Расходы</div>
              <div className="text-3xl font-bold text-red-900">{chartData.expense.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</div>
            </div>

            <div className={`bg-gradient-to-br ${metrics.balance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-xl p-6 border`}>
              <div className={`text-sm font-medium mb-1 ${metrics.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Баланс</div>
              <div className={`text-3xl font-bold ${metrics.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                {metrics.balance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="text-sm text-purple-700 font-medium mb-1">Сбережения</div>
              <div className="text-3xl font-bold text-purple-900">{metrics.savingsRatio}%</div>
            </div>
          </div>

          {/* Тренд доходов и расходов */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-xl font-bold mb-4">📈 Тренд доходов и расходов</h3>
            {chartData.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={value => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} />
                  <Legend />
                  <Area type="monotone" dataKey="income" fill="#10b981" stroke="#059669" fillOpacity={0.3} name="Доходы" />
                  <Area type="monotone" dataKey="expense" fill="#ef4444" stroke="#dc2626" fillOpacity={0.3} name="Расходы" />
                  <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">Недостаточно данных</div>
            )}
          </div>

          {/* ✅ НОВЫЙ ФИЛЬТР ПЕРИОДА для категорий */}
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-lg font-bold text-gray-900">📊 Анализ по категориям</h3>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Всё время' },
                  { value: 'week', label: 'Неделя' },
                  { value: 'month', label: 'Месяц' },
                  { value: 'year', label: 'Год' }
                ].map(period => (
                  <button
                    key={period.value}
                    onClick={() => setCategoryPeriod(period.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      categoryPeriod === period.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Распределение по категориям */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-4">🎯 Распределение по категориям</h3>
              {chartData.categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${(value / 1000).toFixed(1)}k ₽`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={value => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">Нет данных</div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-4">📊 Таблица расходов</h3>
              <div className="space-y-3">
                {chartData.categoryDistribution.map((cat, idx) => {
                  const percentage = ((cat.value / chartData.periodExpense) * 100).toFixed(1);
                  return (
                    <div key={cat.id}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm">{cat.icon} {cat.name}</span>
                        <span className="text-sm text-gray-600">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{cat.value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Heatmap расходов */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-xl font-bold mb-4">🔥 Heatmap расходов по дням недели</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.weekdayHeatmap}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={value => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} />
                <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* РЕЖИМ СРАВНЕНИЕ */}
      {analysisType === 'comparison' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-xl font-bold mb-4">⚖️ Сравнительный анализ категорий</h3>
            
            {/* Выбор категорий */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-3">Выберите категории для сравнения:</label>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => c.type === 'expense').map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => {
                      setSelectedCategories(prev =>
                        prev.includes(cat._id)
                          ? prev.filter(id => id !== cat._id)
                          : [...prev, cat._id]
                      );
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategories.includes(cat._id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Выбор периода сравнения */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-3">Сравнивать по:</label>
              <div className="flex gap-2">
                {[
                  { value: 'day', label: '📅 Дни' },
                  { value: 'week', label: '📆 Недели' },
                  { value: 'month', label: '📊 Месяцы' }
                ].map(period => (
                  <button
                    key={period.value}
                    onClick={() => setComparePeriod(period.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      comparePeriod === period.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* График сравнения */}
            {selectedCategories.length > 0 && comparisonData && comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={value => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} />
                  <Legend />
                  {selectedCategories.map((catId, idx) => {
                    const cat = categories.find(c => c._id === catId);
                    return (
                      <Bar
                        key={catId}
                        dataKey={cat?.name || 'Неизвестная'}
                        fill={COLORS[idx % COLORS.length]}
                        radius={[8, 8, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {selectedCategories.length === 0 
                  ? 'Выберите категории выше для отображения сравнения'
                  : 'Нет данных для сравнения'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* РЕЖИМ ПРОГНОЗ */}
      {analysisType === 'forecast' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-xl font-bold mb-4">🔮 Прогноз расходов</h3>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Прогноз рассчитан на основе среднего месячного расхода. 
                Средний расход: <span className="font-bold">{metrics.avgMonthlyExpense.toLocaleString('ru-RU')} ₽/месяц</span>
              </p>
            </div>

            {chartData.forecast.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={value => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 6 }}
                    name="Расходы"
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 6 }}
                    name="Доходы"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">Недостаточно данных</div>
            )}
          </div>

          {/* Рекомендации */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
            <h4 className="text-lg font-bold mb-4">💡 Рекомендации</h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <div className="font-medium">Уровень сбережений: {metrics.savingsRatio}%</div>
                  <div className="text-sm text-gray-600">
                    {metrics.savingsRatio > 20 ? '✅ Отличный уровень!' : '⚠️ Рекомендуется увеличить до 20%'}
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-2xl">📌</span>
                <div>
                  <div className="font-medium">Максимальная трата: {metrics.maxCategory.icon} {metrics.maxCategory.name}</div>
                  <div className="text-sm text-gray-600">
                    {metrics.maxCategory.value?.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ — следите за этой категорией
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-medium">Доля расходов в доходах: {metrics.expenseRatio}%</div>
                  <div className="text-sm text-gray-600">
                    {metrics.expenseRatio > 80 ? '⚠️ Высокая доля расходов' : '✅ Оптимальное соотношение'}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}