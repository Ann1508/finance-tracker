// client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { transactions as transactionsApi, categories as categoriesApi } from '../Api';
import { useAuth } from '../hooks/useAuth';
import TransactionCard from '../components/TransactionCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    period: 'month'
  });
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [filter.period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(filter.period);
      
      const [transRes, catsRes] = await Promise.all([
        transactionsApi.list({ startDate, endDate, limit: 100 }),
        categoriesApi.list()
      ]);

      setTransactions(transRes);
      setCategories(catsRes);

      const calculatedStats = calculateStats(transRes);
      console.log('Вычисленная статистика:', calculatedStats);
      setStats(calculatedStats);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setStats({
        income: 0,
        incomeCount: 0,
        expense: 0,
        expenseCount: 0,
        balance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionsList) => {
    let income = 0;
    let incomeCount = 0;
    let expense = 0;
    let expenseCount = 0;

    transactionsList.forEach(transaction => {
      const amount = parseFloat(transaction.amount) || 0;
      
      if (transaction.type === 'income') {
        income += amount;
        incomeCount++;
      } else if (transaction.type === 'expense') {
        expense += amount;
        expenseCount++;
      }
    });

    return {
      income: Math.round(income * 100) / 100,
      incomeCount,
      expense: Math.round(expense * 100) / 100,
      expenseCount,
      balance: Math.round((income - expense) * 100) / 100
    };
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

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    if (!newTransaction.title || !newTransaction.amount || !newTransaction.category) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newTransaction.title);
      formData.append('amount', newTransaction.amount);
      formData.append('type', newTransaction.type);
      formData.append('category', newTransaction.category);
      formData.append('date', newTransaction.date);
      formData.append('description', newTransaction.description);
      
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      if (editingTransaction) {
        await transactionsApi.update(editingTransaction._id, formData);
      } else {
        await transactionsApi.create(formData);
      }
      
      setShowAddTransaction(false);
      setEditingTransaction(null);
      setReceiptFile(null);
      setReceiptPreview(null);
      setNewTransaction({
        title: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      
      fetchData();
    } catch (err) {
      console.error('Ошибка создания транзакции:', err);
      alert(err.error || 'Не удалось создать транзакцию');
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      title: transaction.title,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category._id || transaction.category,
      date: new Date(transaction.date).toISOString().split('T')[0],
      description: transaction.description || ''
    });
    if (transaction.receipt) {
      setReceiptPreview(transaction.receipt);
    }
    setShowAddTransaction(true);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleDeleteReceipt = async () => {
    if (!editingTransaction) return;
    
    try {
      const formData = new FormData();
      formData.append('removeReceipt', 'true');
      await transactionsApi.update(editingTransaction._id, formData);
      setReceiptPreview(null);
      setReceiptFile(null);
      fetchData();
    } catch (err) {
      console.error('Ошибка удаления чека:', err);
      alert('Не удалось удалить чек');
    }
  };

  const downloadReceipt = async (receiptPath) => {
    try {
      const response = await fetch(`http://localhost:4000/${receiptPath}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = receiptPath.split('/').pop() || 'receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка скачивания:', err);
      alert('Не удалось скачать файл');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Удалить транзакцию?')) return;

    try {
      await transactionsApi.remove(id);
      fetchData();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить транзакцию');
    }
  };

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  const filteredTransactions = filter.type === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter.type);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-purple-600 text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {user?.name || 'Пользователь'}! 👋
        </h1>
        <p className="text-gray-600">Вот ваша финансовая статистика</p>
      </div>

      {/* Карточки статистики */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Доходы */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">Доходы</span>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-3xl font-bold text-green-800 mb-1">
              {stats.income.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-green-600">
              {stats.incomeCount} {stats.incomeCount === 1 ? 'транзакция' : 'транзакций'}
            </div>
          </div>

          {/* Расходы */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-700 font-medium">Расходы</span>
              <span className="text-2xl">📉</span>
            </div>
            <div className="text-3xl font-bold text-red-800 mb-1">
              {stats.expense.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-red-600">
              {stats.expenseCount} {stats.expenseCount === 1 ? 'транзакция' : 'транзакций'}
            </div>
          </div>

          {/* Баланс */}
          <div className={`bg-gradient-to-br ${stats.balance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-xl p-6 border`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${stats.balance >= 0 ? 'text-blue-700' : 'text-orange-700'} font-medium`}>
                Баланс
              </span>
              <span className="text-2xl">{stats.balance >= 0 ? '💰' : '⚠️'}</span>
            </div>
            <div className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-blue-800' : 'text-orange-800'} mb-1`}>
              {stats.balance.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {stats.balance >= 0 ? 'Профицит' : 'Дефицит'}
            </div>
          </div>
        </div>
      )}

      {/* Фильтры и кнопка добавления */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter({ ...filter, period: 'week' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter.period === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setFilter({ ...filter, period: 'month' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter.period === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Месяц
          </button>
          <button
            onClick={() => setFilter({ ...filter, period: 'year' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter.period === 'year'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Год
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter({ ...filter, type: 'all' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter.type === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter({ ...filter, type: 'income' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter.type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Доходы
          </button>
          <button
            onClick={() => setFilter({ ...filter, type: 'expense' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter.type === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Расходы
          </button>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setReceiptFile(null);
            setReceiptPreview(null);
            setNewTransaction({
              title: '',
              amount: '',
              type: 'expense',
              category: '',
              date: new Date().toISOString().split('T')[0],
              description: ''
            });
            setShowAddTransaction(true);
          }}
          className="ml-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + Добавить транзакцию
        </button>
      </div>

      {/* Список транзакций */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Последние транзакции</h2>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Транзакций пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(transaction => (
              <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: transaction.category?.color + '20' }}
                  >
                    {transaction.category?.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{transaction.title}</div>
                    <div className="text-sm text-gray-600">
                      {transaction.category?.name} • {new Date(transaction.date).toLocaleDateString('ru-RU')}
                    </div>
                    {transaction.description && (
                      <div className="text-xs text-gray-500 mt-1">{transaction.description}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className={`text-xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                  </div>

                  {transaction.receipt && (
                    <button
                      onClick={() => handleViewReceipt(transaction.receipt)}
                      title="Просмотреть чек"
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      📄 Чек
                    </button>
                  )}

                  <button
                    onClick={() => handleEditTransaction(transaction)}
                    title="Редактировать"
                    className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDeleteTransaction(transaction._id)}
                    title="Удалить"
                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно добавления/редактирования транзакции */}
      {showAddTransaction && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddTransaction(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingTransaction ? 'Редактировать транзакцию' : 'Новая транзакция'}
              </h2>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        newTransaction.type === 'income'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📈 Доход
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        newTransaction.type === 'expense'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📉 Расход
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={newTransaction.title}
                    onChange={e => setNewTransaction({ ...newTransaction, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Например: Зарплата, Продукты"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Сумма *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория *
                  </label>
                  <select
                    value={newTransaction.category}
                    onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Выберите категорию</option>
                    {categories
                      .filter(c => c.type === newTransaction.type)
                      .map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={newTransaction.description}
                    onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows="3"
                    placeholder="Дополнительная информация"
                  />
                </div>

                {/* Загрузка чека */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Чек/квитанция (опционально)
                  </label>
                  
                  {receiptPreview ? (
                    <div className="relative mb-3">
                      <img
                        src={receiptPreview}
                        alt="Превью чека"
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleRemoveReceipt}
                          className="flex-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✕ Убрать новый файл
                        </button>
                        {editingTransaction && editingTransaction.receipt && receiptFile === null && (
                          <button
                            type="button"
                            onClick={handleDeleteReceipt}
                            className="flex-1 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            🗑️ Удалить чек
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {!receiptPreview && (
                    <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptChange}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-600">
                        {receiptFile ? '📎 ' + receiptFile.name : '📸 Добавить файл (JPG, PNG, PDF)'}
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTransaction(false);
                      setEditingTransaction(null);
                      setReceiptFile(null);
                      setReceiptPreview(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingTransaction ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра чека */}
      {showReceiptModal && selectedReceipt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReceiptModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Чек</h2>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {selectedReceipt.endsWith('.pdf') ? (
                <iframe
                  src={`http://localhost:4000/${selectedReceipt}`}
                  className="w-full h-[500px] border rounded-lg"
                  title="PDF"
                />
              ) : (
                <img
                  src={`http://localhost:4000/${selectedReceipt}`}
                  alt="Чек"
                  className="w-full rounded-lg border"
                />
              )}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => downloadReceipt(selectedReceipt)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  📥 Скачать
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
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