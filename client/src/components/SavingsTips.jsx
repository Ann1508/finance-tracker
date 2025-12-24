// client/src/components/SavingsTips.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useMemo, useState } from 'react';

const PRIORITY_LABELS = {
  1: { label: 'Критически важно', icon: '🔴', color: 'text-red-600', bg: 'bg-red-50' },
  2: { label: 'Важно', icon: '🟠', color: 'text-orange-600', bg: 'bg-orange-50' },
  3: { label: 'Средний приоритет', icon: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  4: { label: 'Низкий приоритет', icon: '🔵', color: 'text-blue-600', bg: 'bg-blue-50' },
  5: { label: 'Развлечение', icon: '🟣', color: 'text-purple-600', bg: 'bg-purple-50' }
};

export default function SavingsTips({ transactions, budgets, categories }) {
  const [expandedTip, setExpandedTip] = useState(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  const calculateTrend = (transactionsList) => {
    if (transactionsList.length < 2) return 'stable';
    const recent = transactionsList.slice(0, Math.ceil(transactionsList.length / 2));
    const older = transactionsList.slice(Math.ceil(transactionsList.length / 2));
    const recentAvg = recent.reduce((s, t) => s + parseFloat(t.amount || 0), 0) / recent.length;
    const olderAvg = older.reduce((s, t) => s + parseFloat(t.amount || 0), 0) / older.length;
    
    if (recentAvg > olderAvg * 1.15) return 'increasing';
    if (recentAvg < olderAvg * 0.85) return 'decreasing';
    return 'stable';
  };

  const analysis = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    // ✅ Фильтруем транзакции: исключаем "Перевод между конвертами"
    const filteredTransactions = transactions.filter(t => !t.title?.includes('Перевод между конвертами'));

    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const income = filteredTransactions.filter(t => t.type === 'income');
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Считаем данные за полные месяцы (не за дни между первой и последней транзакцией)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysSinceMonthStart = Math.floor((now - monthStart) / (1000 * 60 * 60 * 24)) + 1;
    const daysSpan = daysSinceMonthStart;

    // Группируем по категориям и приоритетам
    const categoryExpenses = {};
    const priorityExpenses = {
      1: { label: PRIORITY_LABELS[1].label, total: 0, count: 0, transactions: [], maxTransaction: 0, minTransaction: Infinity },
      2: { label: PRIORITY_LABELS[2].label, total: 0, count: 0, transactions: [], maxTransaction: 0, minTransaction: Infinity },
      3: { label: PRIORITY_LABELS[3].label, total: 0, count: 0, transactions: [], maxTransaction: 0, minTransaction: Infinity },
      4: { label: PRIORITY_LABELS[4].label, total: 0, count: 0, transactions: [], maxTransaction: 0, minTransaction: Infinity },
      5: { label: PRIORITY_LABELS[5].label, total: 0, count: 0, transactions: [], maxTransaction: 0, minTransaction: Infinity }
    };

    expenses.forEach(t => {
      const catId = typeof t.category === 'object' ? t.category._id : t.category;
      const catName = typeof t.category === 'object' ? t.category.name : t.category;
      const amount = parseFloat(t.amount || 0);
      
      if (!categoryExpenses[catId]) {
        categoryExpenses[catId] = {
          name: catName,
          total: 0,
          count: 0,
          icon: typeof t.category === 'object' ? t.category.icon : '📊',
          color: typeof t.category === 'object' ? t.category.color : '#999',
          byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          maxTransaction: 0,
          minTransaction: Infinity,
          transactions: []
        };
      }
      
      categoryExpenses[catId].total += amount;
      categoryExpenses[catId].count++;
      categoryExpenses[catId].maxTransaction = Math.max(categoryExpenses[catId].maxTransaction, amount);
      categoryExpenses[catId].minTransaction = Math.min(categoryExpenses[catId].minTransaction, amount);
      categoryExpenses[catId].transactions.push(t);
      
      const priority = t.priority || 3;
      categoryExpenses[catId].byPriority[priority] += amount;
      
      priorityExpenses[priority].total += amount;
      priorityExpenses[priority].count++;
      priorityExpenses[priority].maxTransaction = Math.max(priorityExpenses[priority].maxTransaction, amount);
      priorityExpenses[priority].minTransaction = Math.min(priorityExpenses[priority].minTransaction, amount);
      priorityExpenses[priority].transactions.push({ ...t, categoryName: catName });
    });

    const sortedCategories = Object.entries(categoryExpenses)
      .map(([id, data]) => ({
        id,
        ...data,
        percentage: (data.total / totalExpense) * 100,
        avgTransaction: data.total / data.count,
        trend: calculateTrend(data.transactions)
      }))
      .sort((a, b) => b.total - a.total);

    const budgetAnalysis = budgets.map(budget => {
      const categoryId = budget.categoryId._id || budget.categoryId;
      const categoryData = categoryExpenses[categoryId];
      const spent = categoryData ? categoryData.total : 0;
      const percentage = (spent / budget.limit) * 100;
      
      const lowPrioritySpent = categoryData ? 
        (categoryData.byPriority[4] || 0) + (categoryData.byPriority[5] || 0) : 0;

      return {
        categoryName: budget.categoryId.name,
        icon: budget.categoryId.icon,
        limit: budget.limit,
        spent,
        percentage,
        remaining: Math.max(0, budget.limit - spent),
        isExceeded: spent > budget.limit,
        nearLimit: percentage >= 80 && percentage < 100,
        lowPrioritySpent,
        criticalSpent: categoryData ? 
          ((categoryData.byPriority[1] || 0) + (categoryData.byPriority[2] || 0)) : 0,
        avgDailySpend: spent / daysSpan
      };
    });

    return {
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
      categoryExpenses: sortedCategories,
      budgetAnalysis,
      priorityExpenses,
      avgDailyExpense: totalExpense / daysSpan,
      avgMonthlyExpense: (totalExpense / daysSpan) * 30,
      daysSpan,
      expenseCount: expenses.length,
      incomeCount: income.length,
      savingsRatio: totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome * 100 : 0,
      expenses
    };
  }, [transactions, budgets]);

  const tips = useMemo(() => {
    if (!analysis) return [];

    const tips = [];
    const { totalExpense, totalIncome, balance, savingsRatio, avgDailyExpense, priorityExpenses, categoryExpenses, expenses, daysSpan } = analysis;

    // Совет 1: Развлечение и низкий приоритет
    const lowPriorityTotal = (priorityExpenses[4].total || 0) + (priorityExpenses[5].total || 0);
    if (lowPriorityTotal > 0 && lowPriorityTotal > totalExpense * 0.1) {
      tips.push({
        id: 1,
        title: 'Сократите развлечения и низкоприоритетные расходы',
        description: `Вы тратите ${lowPriorityTotal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ (${(lowPriorityTotal / totalExpense * 100).toFixed(1)}%) на развлечения и опциональные расходы.`,
        impact: 'Высокое',
        potential: lowPriorityTotal * 0.3,
        icon: '🎮',
        color: 'bg-purple-50 border-purple-200',
        details: [
          `Развлечение: ${priorityExpenses[5].total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ (${priorityExpenses[5].count} операций)`,
          `Низкий приоритет: ${priorityExpenses[4].total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ (${priorityExpenses[4].count} операций)`,
          `Попробуйте сократить на 30% = экономия ${(lowPriorityTotal * 0.3).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/период`
        ]
      });
    }

    // Совет 2: Категории с растущими расходами
    const growingCategories = categoryExpenses.filter(c => c.trend === 'increasing' && c.percentage > 5);
    if (growingCategories.length > 0) {
      const cat = growingCategories[0];
      tips.push({
        id: 2,
        title: `⚠️ Растущие расходы в "${cat.name}"`,
        description: `Расходы в этой категории растут. Текущее среднее: ${cat.avgTransaction.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/операцию.`,
        impact: 'Среднее',
        potential: cat.total * 0.1,
        icon: cat.icon,
        color: 'bg-orange-50 border-orange-200',
        details: [
          `Категория: ${cat.name}`,
          `Всего потрачено: ${cat.total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Операций: ${cat.count}`,
          `Средняя операция: ${cat.avgTransaction.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Макс операция: ${cat.maxTransaction.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Мин операция: ${cat.minTransaction.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`
        ]
      });
    }

    // Совет 3: Анализ доходов и расходов
    if (savingsRatio < 10) {
      tips.push({
        id: 3,
        title: '💰 Низкий уровень сбережений',
        description: `Вы экономите только ${savingsRatio.toFixed(1)}% доходов. Идеальный уровень - 20-30%.`,
        impact: 'Критическое',
        potential: totalIncome * 0.15,
        icon: '📉',
        color: 'bg-red-50 border-red-200',
        details: [
          `Доходы: ${totalIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Расходы: ${totalExpense.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Баланс: ${balance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Норма сбережений: 20-30% доходов = ${(totalIncome * 0.2).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}-${(totalIncome * 0.3).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`
        ]
      });
    } else if (savingsRatio >= 20) {
      tips.push({
        id: 3,
        title: '✅ Отличный уровень сбережений',
        description: `Вы экономите ${savingsRatio.toFixed(1)}% доходов - это отличный результат!`,
        impact: 'Положительное',
        potential: 0,
        icon: '🎉',
        color: 'bg-green-50 border-green-200',
        details: [
          `Еженедельная экономия: ${(balance / (daysSpan / 7)).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Ежемесячная экономия: ${(balance / daysSpan * 30).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `За год можете сэкономить: ${(balance / daysSpan * 365).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`
        ]
      });
    }

    // Совет 4: Крупные расходы
    const largeExpenses = expenses
      .filter(t => parseFloat(t.amount) > totalExpense / 20)
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 3);
    
    if (largeExpenses.length > 0) {
      const largest = largeExpenses[0];
      const largestAmount = parseFloat(largest.amount);
      tips.push({
        id: 4,
        title: '🎯 Проверьте крупные расходы',
        description: `Наибольший расход: ${largest.title} (${largestAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽) - ${(largestAmount / totalExpense * 100).toFixed(1)}% от всех расходов.`,
        impact: 'Высокое',
        potential: largestAmount * 0.2,
        icon: '💸',
        color: 'bg-yellow-50 border-yellow-200',
        details: [
          `Расход: ${largest.title}`,
          `Сумма: ${largestAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Приоритет: ${PRIORITY_LABELS[largest.priority || 3].label}`,
          `Дата: ${new Date(largest.date).toLocaleDateString('ru-RU')}`,
          `Можно сэкономить (20%): ${(largestAmount * 0.2).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`
        ]
      });
    }

    // Совет 5: Средние расходы
    if (priorityExpenses[3].count > 0) {
      const mediumPriorityTotal = priorityExpenses[3].total || 0;
      tips.push({
        id: 5,
        title: '🤔 Пересмотрите средние приоритеты',
        description: `${priorityExpenses[3].count} расходов среднего приоритета на ${mediumPriorityTotal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽.`,
        impact: 'Среднее',
        potential: mediumPriorityTotal * 0.15,
        icon: '🎲',
        color: 'bg-blue-50 border-blue-200',
        details: [
          `Количество: ${priorityExpenses[3].count} операций`,
          `Общая сумма: ${mediumPriorityTotal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Средняя операция: ${(mediumPriorityTotal / priorityExpenses[3].count).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `% от всех расходов: ${(mediumPriorityTotal / totalExpense * 100).toFixed(1)}%`,
          `Потенциальная экономия (15%): ${(mediumPriorityTotal * 0.15).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`
        ]
      });
    }

    // Совет 6: Часто повторяющиеся расходы
    const expenseFrequency = {};
    expenses.forEach(t => {
      const key = t.title.toLowerCase();
      // ✅ Исключаем операции конвертов
      if (!t.title?.includes('Перевод между конвертами')) {
        expenseFrequency[key] = (expenseFrequency[key] || 0) + 1;
      }
    });
    
    const recurring = Object.entries(expenseFrequency)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (recurring) {
      const [title, count] = recurring;
      const recurringTransactions = expenses.filter(t => t.title.toLowerCase() === title);
      const recurringTotal = recurringTransactions.reduce((s, t) => s + parseFloat(t.amount), 0);
      
      tips.push({
        id: 6,
        title: '🔄 Повторяющиеся расходы',
        description: `"${title}" повторяется ${count} раз на сумму ${recurringTotal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽.`,
        impact: 'Среднее',
        potential: recurringTotal * 0.1,
        icon: '♻️',
        color: 'bg-teal-50 border-teal-200',
        details: [
          `Расход: ${title}`,
          `Количество раз: ${count}`,
          `Общая сумма: ${recurringTotal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Средняя операция: ${(recurringTotal / count).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`,
          `Возможно это подписка или регулярный платеж - проверьте необходимость`
        ]
      });
    }

    return tips.slice(0, 6);
  }, [analysis]);

  if (!analysis || tips.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold mb-4">💡 Советы по экономии</h3>
        <p className="text-gray-600 text-center py-8">
          Добавьте расходы с приоритетами, чтобы получить умные рекомендации по экономии
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Главная статистика */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">📊 Финансовая сводка</h3>
          <button
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            className="text-sm px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors"
          >
            {showDetailedAnalysis ? '▼ Свернуть' : '▶ Развернуть'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-700 font-medium mb-1">Доходы</div>
            <div className="text-2xl font-bold text-green-900">
              {analysis.totalIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
            <div className="text-xs text-green-600 mt-2">
              {(analysis.totalIncome / analysis.daysSpan).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/день
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="text-sm text-red-700 font-medium mb-1">Расходы</div>
            <div className="text-2xl font-bold text-red-900">
              {analysis.totalExpense.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
            <div className="text-xs text-red-600 mt-2">
              {analysis.avgDailyExpense.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/день
            </div>
          </div>

          <div className={`bg-gradient-to-br ${analysis.balance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-lg p-4 border`}>
            <div className={`text-sm font-medium mb-1 ${analysis.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              Баланс
            </div>
            <div className={`text-2xl font-bold ${analysis.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
              {analysis.balance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
            <div className={`text-xs mt-2 ${analysis.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {analysis.savingsRatio.toFixed(1)}% сбережений
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-700 font-medium mb-1">За месяц</div>
            <div className="text-2xl font-bold text-purple-900">
              {analysis.avgMonthlyExpense.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
            <div className="text-xs text-purple-600 mt-2">
              Период: {analysis.daysSpan} дней
            </div>
          </div>
        </div>

        {/* Распределение по приоритетам - ВСЕГДА ВИДНО */}
        <div className="border-t pt-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">📊 Распределение расходов по приоритетам:</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            {Object.entries(analysis.priorityExpenses).map(([priority, data]) => {
              const percentage = (data.total / analysis.totalExpense) * 100;
              const meta = PRIORITY_LABELS[priority];
              return (
                <div key={priority} className="text-center p-3 bg-gray-50 rounded-lg border">
                  <div className="text-2xl mb-2">{meta.icon}</div>
                  <div className="text-xs font-medium text-gray-700 mb-1">{meta.label}</div>
                  <div className="text-xl font-bold text-gray-900">{percentage.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {data.total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                  <div className="text-xs text-gray-500 mt-1.5 font-medium">
                    Транзакций: {data.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showDetailedAnalysis && (
          <div className="border-t pt-6 space-y-4">
            {/* Детальное распределение по приоритетам */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">📈 Детальное распределение:</h4>
              <div className="space-y-3">
                {Object.entries(analysis.priorityExpenses).map(([priority, data]) => {
                  const percentage = (data.total / analysis.totalExpense) * 100;
                  const meta = PRIORITY_LABELS[priority];
                  return (
                    <div key={priority}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span>{meta.icon}</span>
                          <span className="text-sm font-medium">{meta.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">
                            {data.total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                          </span>
                          <span className="text-xs text-gray-600 ml-2">
                            ({data.count} операций)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            priority === '1' ? 'bg-red-500' :
                            priority === '2' ? 'bg-orange-500' :
                            priority === '3' ? 'bg-yellow-500' :
                            priority === '4' ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>{percentage.toFixed(1)}%</span>
                        <span>Макс: {data.maxTransaction.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</span>
                        <span>Средн: {(data.total / data.count).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top категории */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🏆 Топ категории по расходам:</h4>
              <div className="space-y-2">
                {analysis.categoryExpenses.slice(0, 5).map((cat, idx) => (
                  <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span>{idx + 1}.</span>
                      <span className="text-lg">{cat.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{cat.name}</div>
                        <div className="text-xs text-gray-600">{cat.count} операций</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {cat.total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </div>
                      <div className="text-xs text-gray-600">{cat.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Умные советы */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">💡 Умные рекомендации</h3>
        {tips.map((tip) => (
          <div
            key={tip.id}
            className={`${tip.color} rounded-xl p-5 border cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">{tip.icon}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-lg">{tip.title}</h4>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                    tip.impact === 'Критическое' ? 'bg-red-200 text-red-800' :
                    tip.impact === 'Высокое' ? 'bg-orange-200 text-orange-800' :
                    tip.impact === 'Положительное' ? 'bg-green-200 text-green-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {tip.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{tip.description}</p>
                
                {tip.potential > 0 && (
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <span className="text-green-600">💰 Потенциальная экономия:</span>
                    <span className="text-green-700 text-lg">
                      {tip.potential.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                    </span>
                  </div>
                )}

                {expandedTip === tip.id && (
                  <div className="mt-4 pt-4 border-t border-opacity-30 border-current">
                    <div className="space-y-2">
                      {tip.details.map((detail, idx) => (
                        <div key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-gray-400 mt-1">▸</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                  {expandedTip === tip.id ? '▼' : '▶'} Кликните для подробностей
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}