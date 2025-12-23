// client/src/pages/Envelopes.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { categories as categoriesApi, transactions as transactionsApi } from '../Api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Envelopes() {
  const [envelopes, setEnvelopes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [editingEnvelope, setEditingEnvelope] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(null);
  const [transferData, setTransferData] = useState({
    fromEnvelopeId: '',
    toEnvelopeId: '',
    amount: ''
  });
  const [replenishData, setReplenishData] = useState({
    amount: '',
    description: '',
    categoryId: ''
  });
  const [formData, setFormData] = useState({
    categoryId: '',
    initialAmount: '',
    targetGoal: '',
    description: ''
  });
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseData, setExpenseData] = useState({
    amount: '',
    description: ''
    });


  useEffect(() => {
    fetchData();
  }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
        const token = localStorage.getItem('token');
        
        // ✅ ПРОВЕРКА ТОКЕНА
        if (!token) {
            console.error('❌ Токен не найден в localStorage');
            setError('Требуется авторизация');
            setLoading(false);
            window.location.href = '/login';
            return;
        }

        console.log('📡 Загрузка конвертов с токеном:', token.substring(0, 20) + '...');

        const [envelopesRes, catsRes, transRes] = await Promise.all([
            axios.get(`${API_BASE}/api/envelopes`, {
            headers: { Authorization: `Bearer ${token}` }
            }),
            categoriesApi.list(),
            transactionsApi.list({ limit: 10000 })
        ]);

        console.log('✅ Данные загружены успешно');
        console.log('📊 Всего транзакций:', transRes.length);
        
        setEnvelopes(envelopesRes.data || []);
        setCategories(catsRes);
        
        // ✅ ФИЛЬТРУЕМ ТРАНЗАКЦИИ КОНВЕРТОВ
        // Ищем транзакции с title содержащим:
        // - "Пополнение конверта"
        // - "Перевод между конвертами"
        // - "Расход конверта"
        const envelopeTransactions = transRes.filter(t => {
            const isReplenish = t.title?.includes('Пополнение конверта');
            const isTransfer = t.title?.includes('Перевод между конвертами');
            const isExpense = t.title?.includes('Расход конверта');
            return isReplenish || isTransfer || isExpense;
        });
        
        console.log('💌 Транзакций конвертов:', envelopeTransactions.length);
        console.log('📋 Примеры:', envelopeTransactions.slice(0, 3));
        
        setTransactions(envelopeTransactions);
        setError(null);
        } catch (err) {
        console.error('❌ ОШИБКА ЗАГРУЗКИ:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data
        });

        // ✅ СПЕЦИАЛЬНАЯ ОБРАБОТКА РАЗНЫХ ТИПОВ ОШИБОК
        if (err.response?.status === 401) {
            console.error('❌ Ошибка 401 - Токен невалиден или истёк');
            setError('Сессия истекла. Пожалуйста, переавторизуйтесь.');
            localStorage.removeItem('token');
            setTimeout(() => {
            window.location.href = '/login';
            }, 1000);
            return;
        }

        if (err.response?.status === 403) {
            console.error('❌ Ошибка 403 - Доступ запрещен');
            setError('У вас нет доступа к этой странице');
            return;
        }

        if (err.response?.status === 404) {
            console.error('❌ Ошибка 404 - Endpoint не найден');
            setError('Ошибка сервера: endpoint не найден');
            return;
        }

        if (!err.response) {
            console.error('❌ Ошибка соединения - сервер недоступен');
            setError(`Ошибка соединения: ${err.message}. Проверьте, запущен ли сервер на ${API_BASE}`);
            return;
        }

        // Для других ошибок
        setError(`Ошибка загрузки: ${err.response?.data?.message || err.message}`);
        } finally {
        setLoading(false);
        }
    };

  const getEnvelopeBalance = (envelopeId) => {
    const envelope = envelopes.find(e => e._id === envelopeId);
    if (!envelope) return 0;

    const spent = getEnvelopeSpent(envelopeId);
    const replenished = getEnvelopeReplenished(envelopeId);

    return envelope.initialAmount + replenished - spent;
  };

// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ - подсчет расходов конверта (остается без изменений)
const getEnvelopeSpentWithoutTransfers = (envelopeId) => {
  const envelope = envelopes.find(e => e._id === envelopeId);
  if (!envelope) return 0;

  const categoryId = envelope.categoryId._id || envelope.categoryId;

  return transactions
    .filter(t => {
      const isExpense = t.type === 'expense';
      const isSameCategory = (t.category?._id || t.category) === categoryId;
      const isEnvelopeTransaction = t.title?.includes('Расход конверта');
      return isExpense && isSameCategory && isEnvelopeTransaction;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};


// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ getEnvelopeReplenishedWithoutTransfers
const getEnvelopeReplenishedWithoutTransfers = (envelopeId) => {
  const envelope = envelopes.find(e => e._id === envelopeId);
  if (!envelope) return 0;

  const expenseCategoryId = envelope.categoryId._id || envelope.categoryId;

  return transactions
    .filter(t => {
      const isIncome = t.type === 'income';
      const isEnvelopeTransaction = t.title?.includes('Пополнение конверта');
      
      // ✅ Ищем по envelopeId ИЛИ по категории затрат из description
      let isThisEnvelope = t.envelopeId === envelopeId;
      
      if (!isThisEnvelope) {
        const categoryData = parseReplenishmentCategories(t);
        if (categoryData && categoryData.expenseCategoryId === expenseCategoryId) {
          isThisEnvelope = true;
        }
      }
      
      return isIncome && isEnvelopeTransaction && isThisEnvelope;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};


  // ✅ ОБНОВЛЕННЫЕ ФУНКЦИИ - для подсчёта С переводами (для расчёта баланса)
  const getEnvelopeSpent = (envelopeId) => {
    const envelope = envelopes.find(e => e._id === envelopeId);
    if (!envelope) return 0;

    const categoryId = envelope.categoryId._id || envelope.categoryId;

    return transactions
      .filter(t => {
        const isExpense = t.type === 'expense';
        const isSameCategory = (t.category?._id || t.category) === categoryId;
        // ✅ ВКЛЮЧАЕМ переводы в расчёт баланса
        const isEnvelopeTransaction = 
          t.title?.includes('Расход конверта') || 
          t.title?.includes('Перевод между конвертами');
        return isExpense && isSameCategory && isEnvelopeTransaction;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ getEnvelopeReplenished (для баланса)
const getEnvelopeReplenished = (envelopeId) => {
  const envelope = envelopes.find(e => e._id === envelopeId);
  if (!envelope) return 0;

  const expenseCategoryId = envelope.categoryId._id || envelope.categoryId;

  return transactions
    .filter(t => {
      const isIncome = t.type === 'income';
      const isEnvelopeTransaction = 
        t.title?.includes('Пополнение конверта') || 
        t.title?.includes('Перевод между конвертами');
      
      // ✅ Ищем по envelopeId ИЛИ по категории затрат из description
      let isThisEnvelope = t.envelopeId === envelopeId;
      
      if (!isThisEnvelope) {
        const categoryData = parseReplenishmentCategories(t);
        if (categoryData && categoryData.expenseCategoryId === expenseCategoryId) {
          isThisEnvelope = true;
        }
      }
      
      return isIncome && isEnvelopeTransaction && isThisEnvelope;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};

  const handleAddEnvelope = async (e) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.initialAmount || !formData.targetGoal) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = {
        categoryId: formData.categoryId,
        initialAmount: parseFloat(formData.initialAmount),
        targetGoal: parseFloat(formData.targetGoal),
        description: formData.description
      };

      if (editingEnvelope) {
        await axios.put(`${API_BASE}/api/envelopes/${editingEnvelope._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/api/envelopes`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowAddEnvelope(false);
      setEditingEnvelope(null);
      setFormData({
        categoryId: '',
        initialAmount: '',
        targetGoal: '',
        description: ''
      });
      fetchData();
    } catch (err) {
      console.error('Ошибка сохранения конверта:', err);
      alert('Не удалось сохранить конверт');
    }
  };

// handleReplenishEnvelope - преобразуем в FormData
const handleReplenishEnvelope = async (e) => {
  e.preventDefault();

  if (!replenishData.amount) {
    alert('Укажите сумму');
    return;
  }

  if (!replenishData.categoryId) {
    alert('Выберите категорию пополнения');
    return;
  }

  try {
    // ✅ Получаем категорию затрат из конверта
    const envelope = envelopes.find(e => e._id === selectedEnvelopeId);
    const expenseCategoryId = envelope?.categoryId?._id || envelope?.categoryId;

    // ✅ Создаем объект с обеими категориями
    const categoryData = {
      income: replenishData.categoryId, // категория пополнения (доход)
      expense: expenseCategoryId // категория конверта (затраты)
    };

    // ✅ Создаем FormData для пополнения
    const formData = new FormData();
    formData.append('type', 'income');
    formData.append('title', 'Пополнение конверта');
    formData.append('amount', parseFloat(replenishData.amount));
    formData.append('envelopeId', selectedEnvelopeId);
    formData.append('category', replenishData.categoryId); // основная категория пополнения
    // ✅ Сохраняем обе категории в description как JSON
    formData.append('description', JSON.stringify({
      originalDescription: replenishData.description || 'Пополнение конверта',
      categoryData: categoryData
    }));
    formData.append('date', new Date().toISOString().split('T')[0]);

    console.log('📤 Отправляем пополнение конверта:', {
      amount: replenishData.amount,
      incomeCategoryId: replenishData.categoryId,
      expenseCategoryId: expenseCategoryId,
      envelopeId: selectedEnvelopeId
    });

    const response = await transactionsApi.create(formData);
    console.log('✅ Пополнение создано успешно:', response);

    setShowReplenishModal(false);
    setSelectedEnvelopeId(null);
    setReplenishData({
      amount: '',
      description: '',
      categoryId: ''
    });
    
    fetchData();
  } catch (err) {
    console.error('❌ Ошибка пополнения:', err);
    alert('Не удалось пополнить конверт: ' + (err.error || err.message));
  }
};

// ✅ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ - распарсить categoryData из description
const parseReplenishmentCategories = (transaction) => {
  try {
    const data = JSON.parse(transaction.description);
    if (data.categoryData) {
      return {
        expenseCategoryId: data.categoryData.expense,
        description: data.originalDescription
      };
    }
  } catch (e) {
    // Если парсинг не удался, возвращаем null
  }
  return null;
};

// ✅ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ - получить категории доходов
const getIncomeCategories = () => {
  return categories.filter(c => c.type === 'income');
};

// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ handleTransferMoney
const handleTransferMoney = async (e) => {
  e.preventDefault();

  if (!transferData.fromEnvelopeId || !transferData.toEnvelopeId || !transferData.amount) {
    alert('Заполните все поля');
    return;
  }

  if (transferData.fromEnvelopeId === transferData.toEnvelopeId) {
    alert('Нельзя переводить на один и тот же конверт');
    return;
  }

  const amount = parseFloat(transferData.amount);
  const fromBalance = getEnvelopeBalance(transferData.fromEnvelopeId);

  if (fromBalance < amount) {
    alert(`Недостаточно средств. Доступно: ${fromBalance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`);
    return;
  }

  try {
    // ✅ Получаем категории обоих конвертов
    const fromEnvelope = envelopes.find(e => e._id === transferData.fromEnvelopeId);
    const toEnvelope = envelopes.find(e => e._id === transferData.toEnvelopeId);
    
    const fromCategoryId = fromEnvelope?.categoryId?._id || fromEnvelope?.categoryId;
    const toCategoryId = toEnvelope?.categoryId?._id || toEnvelope?.categoryId;

    // ✅ Первая транзакция (расход из первого конверта)
    const formData1 = new FormData();
    formData1.append('type', 'expense');
    formData1.append('title', 'Перевод между конвертами');
    formData1.append('amount', amount);
    formData1.append('envelopeId', transferData.fromEnvelopeId);
    formData1.append('category', fromCategoryId);
    formData1.append('date', new Date().toISOString().split('T')[0]);
    formData1.append('description', 'Перевод в другой конверт');

    await transactionsApi.create(formData1);

    // ✅ Вторая транзакция (доход во второй конверт)
    // ВАЖНО: добавляем categoryData в description, как при обычном пополнении
    const categoryDataToEnvelope = {
      income: toCategoryId, // категория конверта получателя (как категория дохода)
      expense: toCategoryId  // категория конверта получателя (как категория затрат)
    };

    const formData2 = new FormData();
    formData2.append('type', 'income');
    formData2.append('title', 'Перевод между конвертами');
    formData2.append('amount', amount);
    formData2.append('envelopeId', transferData.toEnvelopeId);
    formData2.append('category', toCategoryId);
    // ✅ Сохраняем categoryData в description
    formData2.append('description', JSON.stringify({
      originalDescription: 'Входящий перевод',
      categoryData: categoryDataToEnvelope
    }));
    formData2.append('date', new Date().toISOString().split('T')[0]);

    await transactionsApi.create(formData2);

    setShowTransferModal(false);
    setTransferData({
      fromEnvelopeId: '',
      toEnvelopeId: '',
      amount: ''
    });
    fetchData();
  } catch (err) {
    console.error('Ошибка перевода:', err);
    alert('Не удалось перевести деньги');
  }
};

  const handleEditEnvelope = (envelope) => {
    setEditingEnvelope(envelope);
    setFormData({
      categoryId: envelope.categoryId._id || envelope.categoryId,
      initialAmount: envelope.initialAmount.toString(),
      targetGoal: envelope.targetGoal.toString(),
      description: envelope.description || ''
    });
    setShowAddEnvelope(true);
  };

  const handleDeleteEnvelope = async (id) => {
    if (!window.confirm('Удалить конверт? Все транзакции останутся.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/envelopes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить конверт');
    }
  };

    // ✅ ОБНОВЛЕННАЯ ФУНКЦИЯ - создание расхода конверта
    const handleCreateExpense = async (e) => {
    e.preventDefault();

    if (!expenseData.amount) {
        alert('Укажите сумму');
        return;
    }

    try {
        const envelope = envelopes.find(e => e._id === selectedEnvelopeId);
        const categoryId = envelope?.categoryId?._id || envelope?.categoryId;
        const balance = getEnvelopeBalance(selectedEnvelopeId);

        if (balance < parseFloat(expenseData.amount)) {
        alert(`Недостаточно средств. Доступно: ${balance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`);
        return;
        }

        // ✅ Создаем FormData для расхода
        const formData = new FormData();
        formData.append('type', 'expense');
        formData.append('title', 'Расход конверта'); // ✅ ФИКСИРОВАННОЕ НАЗВАНИЕ
        formData.append('amount', parseFloat(expenseData.amount));
        formData.append('category', categoryId);
        formData.append('date', new Date().toISOString().split('T')[0]);
        formData.append('description', expenseData.description || 'Расход конверта');

        console.log('📤 Отправляем расход конверта');

        await transactionsApi.create(formData);

        setShowExpenseModal(false);
        setSelectedEnvelopeId(null);
        setExpenseData({
        amount: '',
        description: ''
        });
        fetchData();
    } catch (err) {
        console.error('❌ Ошибка создания расхода:', err);
        alert('Не удалось создать расход: ' + (err.error || err.message));
    }
    };

  const getEnvelopeStatus = (balance, targetGoal) => {
    if (balance < 0) return { label: 'Переполнен', color: 'text-red-600', bg: 'bg-red-50', borderColor: 'border-red-200', barColor: 'bg-red-500' };
    const percentage = (balance / targetGoal) * 100;
    if (percentage >= 100) return { label: 'Цель достигнута', color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200', barColor: 'bg-green-500' };
    if (percentage >= 75) return { label: 'Близко к цели', color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-200', barColor: 'bg-blue-500' };
    if (percentage >= 50) return { label: 'На половине пути', color: 'text-yellow-600', bg: 'bg-yellow-50', borderColor: 'border-yellow-200', barColor: 'bg-yellow-500' };
    return { label: 'В процессе', color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-200', barColor: 'bg-orange-500' };
  };

  const getTotalStats = () => {
    const totalInitial = envelopes.reduce((sum, e) => sum + e.initialAmount, 0);
    // ✅ ИСПОЛЬЗУЕМ функции БЕЗ переводов для отображения
    const totalReplenished = envelopes.reduce((sum, e) => sum + getEnvelopeReplenishedWithoutTransfers(e._id), 0);
    const totalSpent = envelopes.reduce((sum, e) => sum + getEnvelopeSpentWithoutTransfers(e._id), 0);
    const totalGoal = envelopes.reduce((sum, e) => sum + e.targetGoal, 0);
    // ✅ Баланс считаем С переводами (используем обновленные getEnvelopeSpent и getEnvelopeReplenished)
    const totalBalance = totalInitial + envelopes.reduce((sum, e) => sum + getEnvelopeReplenished(e._id), 0) - envelopes.reduce((sum, e) => sum + getEnvelopeSpent(e._id), 0);

    return { totalInitial, totalReplenished, totalSpent, totalGoal, totalBalance };
  };

  const getExpenseCategories = () => {
    return categories.filter(c => c.type === 'expense');
  };

  // ✅ ПОКАЗ ОШИБКИ ЕСЛИ ОНА ЕСТЬ
  if (error) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">⚠️ Ошибка загрузки</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setError(null);
                fetchData();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              На страницу входа
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-purple-600 text-lg mb-4">⏳ Загрузка конвертов...</div>
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💌 Конверты</h1>
          <p className="text-gray-600 mt-1">Система управления финансами с целями накопления</p>
        </div>
        <div className="flex gap-2">
          {envelopes.length > 0 && (
            <button
              onClick={() => {
                setSelectedEnvelopeId('');
                setShowTransferModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              💸 Переводить
            </button>
          )}
          <button
            onClick={() => {
              setEditingEnvelope(null);
              setFormData({
                categoryId: '',
                initialAmount: '',
                targetGoal: '',
                description: ''
              });
              setShowAddEnvelope(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Создать конверт
          </button>
        </div>
      </div>

      {/* Общая статистика */}
      {envelopes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-xs text-green-700 font-medium mb-1">Пополнено</div>
            <div className="text-2xl font-bold text-green-900">
              +{stats.totalReplenished.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="text-xs text-red-700 font-medium mb-1">Потрачено</div>
            <div className="text-2xl font-bold text-red-900">
              -{stats.totalSpent.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-xs text-purple-700 font-medium mb-1">Баланс</div>
            <div className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-purple-900' : 'text-red-900'}`}>
              {stats.totalBalance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="text-xs text-indigo-700 font-medium mb-1">Общая цель</div>
            <div className="text-2xl font-bold text-indigo-900">
              {stats.totalGoal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
            </div>
          </div>
        </div>
      )}

      {/* Список конвертов */}
      {envelopes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-6xl mb-4">💌</div>
          <p className="text-gray-600 text-lg mb-4">Конвертов пока нет</p>
          <button
            onClick={() => setShowAddEnvelope(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Создать первый конверт
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {envelopes.map(envelope => {
            const spent = getEnvelopeSpent(envelope._id);
            const replenished = getEnvelopeReplenished(envelope._id);
            const balance = getEnvelopeBalance(envelope._id);
            const status = getEnvelopeStatus(balance, envelope.targetGoal);
            const category = categories.find(c => c._id === (envelope.categoryId._id || envelope.categoryId));
            const goalPercentage = (balance / envelope.targetGoal) * 100;

            return (
              <div key={envelope._id} className={`${status.bg} border ${status.borderColor} rounded-xl p-6`}>
                {/* Заголовок конверта */}
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
                    onClick={() => handleDeleteEnvelope(envelope._id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>

                {/* Цель конверта */}
                <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
                  <div className="text-xs text-gray-700 mb-1">🎯 Цель накопления</div>
                  <div className="text-xl font-bold text-gray-900">
                    {envelope.targetGoal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                </div>

                {/* Прогресс к цели */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Прогресс накопления</span>
                    <span className="font-semibold">
                      {balance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ / {envelope.targetGoal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all ${status.barColor}`}
                      style={{ width: `${Math.min(goalPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-sm text-gray-600 mt-1">
                    {goalPercentage.toFixed(1)}% от цели
                  </div>
                </div>

                {/* История транзакций */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-white bg-opacity-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">Начислено</div>
                    <div className="text-sm font-bold text-gray-900">
                      {envelope.initialAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">Пополнено</div>
                    <div className="text-sm font-bold text-green-600">
                      +{replenished.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">Потрачено</div>
                    <div className="text-sm font-bold text-red-600">
                      -{spent.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                    </div>
                  </div>
                </div>

                {/* Описание */}
                {envelope.description && (
                  <p className="text-sm text-gray-700 mb-4 italic">"{envelope.description}"</p>
                )}

                {/* Кнопки действий */}
                <div className="flex gap-2 mb-3">
                <button
                    onClick={() => {
                        setSelectedEnvelopeId(envelope._id);
                        // ✅ ВАЖНО: сбрасываем categoryId в пустую строку
                        setReplenishData({ 
                            amount: '', 
                            description: '',
                            categoryId: ''  // ← ДОБАВЛЯЕМ ЭТО
                        });
                        setShowReplenishModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    ➕ Пополнить
                </button>
                
                {/* ✅ НОВАЯ КНОПКА - Расход */}
                <button
                    onClick={() => {
                    setSelectedEnvelopeId(envelope._id);
                    setExpenseData({ amount: '', description: '', title: '' });
                    setShowExpenseModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    💸 Расход
                </button>
                
                <button
                    onClick={() => handleEditEnvelope(envelope)}
                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                >
                    ✏️ Редактировать
                </button>
                </div>

                {/* Предупреждение */}
                {balance < 0 && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800">
                    🚨 Конверт превышен на {Math.abs(balance).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                )}
                {goalPercentage >= 100 && balance >= 0 && (
                  <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-xs text-green-800">
                    🎉 Цель достигнута! Продолжайте накопления
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно создания конверта */}
      {showAddEnvelope && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddEnvelope(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingEnvelope ? 'Редактировать конверт' : 'Новый конверт'}
              </h2>

              <form onSubmit={handleAddEnvelope} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Начальная сумма (₽) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.initialAmount}
                    onChange={e => setFormData({ ...formData, initialAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🎯 Цель накопления (₽) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetGoal}
                    onChange={e => setFormData({ ...formData, targetGoal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows="2"
                    placeholder="Например: Накопления на отпуск"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddEnvelope(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingEnvelope ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно перевода */}
      {showTransferModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">💸 Переводить между конвертами</h2>

              <form onSubmit={handleTransferMoney} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Из конверта *</label>
                  <select
                    value={transferData.fromEnvelopeId}
                    onChange={e => setTransferData({ ...transferData, fromEnvelopeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Выберите конверт</option>
                    {envelopes.map(env => {
                      const cat = categories.find(c => c._id === (env.categoryId._id || env.categoryId));
                      const remaining = getEnvelopeBalance(env._id);
                      return (
                        <option key={env._id} value={env._id}>
                          {cat?.icon} {cat?.name} ({remaining.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">В конверт *</label>
                  <select
                    value={transferData.toEnvelopeId}
                    onChange={e => setTransferData({ ...transferData, toEnvelopeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Выберите конверт</option>
                    {envelopes.map(env => {
                      const cat = categories.find(c => c._id === (env.categoryId._id || env.categoryId));
                      return (
                        <option key={env._id} value={env._id}>
                          {cat?.icon} {cat?.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transferData.amount}
                    onChange={e => setTransferData({ ...transferData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1000"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Перевести
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно пополнения */}
      {showReplenishModal && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={() => setShowReplenishModal(false)}
  >
    <div
      className="bg-white rounded-xl shadow-xl w-full max-w-md"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">➕ Пополнить конверт</h2>

        <form onSubmit={handleReplenishEnvelope} className="space-y-4">
          {/* ✅ НОВОЕ ПОЛЕ - выбор категории пополнения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория пополнения *
            </label>
            <select
              value={replenishData.categoryId}
              onChange={e => setReplenishData({ ...replenishData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Выберите категорию</option>
              {getIncomeCategories().map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽) *</label>
            <input
              type="number"
              step="0.01"
              value={replenishData.amount}
              onChange={e => setReplenishData({ ...replenishData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={replenishData.description}
              onChange={e => setReplenishData({ ...replenishData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows="2"
              placeholder="Например: Зарплата"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowReplenishModal(false)}
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

        {showExpenseModal && (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExpenseModal(false)}
        >
            <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
            >
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">💸 Расход конверта</h2>

                <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽) *</label>
                    <input
                    type="number"
                    step="0.01"
                    value={expenseData.amount}
                    onChange={e => setExpenseData({ ...expenseData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1000"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <textarea
                    value={expenseData.description}
                    onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows="2"
                    placeholder="Например: Покупка продуктов"
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                    <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                    Отмена
                    </button>
                    <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                    Создать расход
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