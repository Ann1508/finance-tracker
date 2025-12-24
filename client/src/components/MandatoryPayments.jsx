// client/src/components/MandatoryPayments.jsx - С ИСПОЛЬЗОВАНИЕМ КОНТЕКСТА

import React, { useState, useEffect } from 'react';
import { usePayments } from '../context/PaymentsContext';

export default function MandatoryPayments() {
  const {
    payments,
    paymentsWithStatus,
    loading,
    fetchPayments,
    updatePayment,
    markPaid,
    createPayment,
    deletePayment
  } = usePayments();

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    category: '',
    description: '',
    isActive: true,
    reminderDaysBefore: 3
  });

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || !formData.dueDate) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      if (editingPayment) {
        await updatePayment(editingPayment._id, formData);
        alert('Платеж обновлен');
      } else {
        await createPayment(formData);
        alert('Платеж добавлен');
      }
      resetForm();
    } catch (error) {
      alert('Не удалось сохранить платеж');
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      name: payment.name,
      amount: payment.amount.toString(),
      dueDate: payment.dueDate.toString(),
      frequency: payment.frequency,
      category: payment.category || '',
      description: payment.description || '',
      isActive: payment.isActive,
      reminderDaysBefore: payment.reminderDaysBefore
    });
    setShowAddPayment(true);
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Удалить платеж?')) return;

    try {
      await deletePayment(id);
      alert('Платеж удален');
    } catch (error) {
      alert('Не удалось удалить платеж');
    }
  };

  const handleTogglePayment = async (id, isActive) => {
    try {
      await updatePayment(id, { isActive: !isActive });
      alert(!isActive ? '✅ Платеж включен' : '⏸️ Платеж отключен');
    } catch (error) {
      alert('Ошибка обновления платежа');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPaid(id);
      alert('✅ Платеж отмечен как оплаченный');
    } catch (error) {
      alert('Ошибка обновления платежа');
    }
  };

  const handleUnmarkPaid = async (id) => {
    if (!window.confirm('Отменить оплату платежа?')) return;
    
    try {
      await updatePayment(id, { lastPaymentDate: null });
      alert('↩️ Оплата отменена');
    } catch (error) {
      alert('Ошибка отмены оплаты');
    }
  };

  const resetForm = () => {
    setShowAddPayment(false);
    setEditingPayment(null);
    setFormData({
      name: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      description: '',
      isActive: true,
      reminderDaysBefore: 3
    });
  };

  const getPaymentStatus = (payment) => {
    if (payment.status === 'paid') {
      const lastPaid = payment.lastPaidDate ? new Date(payment.lastPaidDate) : null;
      const today = new Date();
      const daysSincePaid = lastPaid ? Math.floor((today - lastPaid) / (1000 * 60 * 60 * 24)) : null;
      
      return { 
        label: daysSincePaid !== null && daysSincePaid <= 1 ? 'Только что оплачено' : 'Оплачено', 
        color: 'text-emerald-700', 
        bg: 'bg-emerald-50', 
        borderColor: 'border-emerald-300', 
        icon: '💚',
        isPaid: true
      };
    }

    switch (payment.status) {
      case 'overdue':
        return { 
          label: 'Просрочено', 
          color: 'text-red-600', 
          bg: 'bg-red-50', 
          borderColor: 'border-red-200', 
          icon: '🚨',
          isPaid: false
        };
      case 'upcoming':
        return { 
          label: 'Скоро', 
          color: 'text-orange-600', 
          bg: 'bg-orange-50', 
          borderColor: 'border-orange-200', 
          icon: '⚠️',
          isPaid: false
        };
      case 'normal':
        return { 
          label: 'В порядке', 
          color: 'text-green-600', 
          bg: 'bg-green-50', 
          borderColor: 'border-green-200', 
          icon: '✅',
          isPaid: false
        };
      default:
        return { 
          label: 'Неизвестно', 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          borderColor: 'border-gray-200', 
          icon: '❓',
          isPaid: false
        };
    }
  };

  if (loading && payments.length === 0) {
    return <div className="text-center py-8 text-gray-600">Загрузка платежей...</div>;
  }

  const activePayments = payments.filter(p => p.isActive);
  const inactivePayments = payments.filter(p => !p.isActive);
  const displayedPayments = activeTab === 'active' 
    ? paymentsWithStatus.filter(p => p.isActive)
    : payments.filter(p => !p.isActive);

  const monthlyExpenses = activePayments
    .filter(p => p.frequency === 'monthly')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const upcomingPayments = paymentsWithStatus.filter(p => 
    p.isActive && (p.status === 'upcoming' || p.status === 'overdue')
  ).length;

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700 font-medium mb-1">Активных платежей</div>
          <div className="text-3xl font-bold text-blue-900">{activePayments.length}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-700 font-medium mb-1">Ежемесячные расходы</div>
          <div className="text-3xl font-bold text-purple-900">
            {monthlyExpenses.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm text-orange-700 font-medium mb-1">Требуют внимания</div>
          <div className="text-3xl font-bold text-orange-900">{upcomingPayments}</div>
        </div>
      </div>

      {/* Вкладки активных/неактивных */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'active'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ✅ Активные ({activePayments.length})
        </button>
        <button
          onClick={() => setActiveTab('inactive')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'inactive'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ⏸️ Неактивные ({inactivePayments.length})
        </button>
      </div>

      {/* Кнопка добавления */}
      {!showAddPayment ? (
        <button
          onClick={() => setShowAddPayment(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + Добавить платеж
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-bold text-gray-900">
            {editingPayment ? 'Редактировать платеж' : 'Новый обязательный платеж'}
          </h3>
          
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название платежа *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Например: Коммунальные платежи"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма (₽) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  День платежа (1-31) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Частота
                </label>
                <select
                  value={formData.frequency}
                  onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="weekly">Еженедельно</option>
                  <option value="monthly">Ежемесячно</option>
                  <option value="yearly">Ежегодно</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Напомнить за (дни)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reminderDaysBefore}
                  onChange={e => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Примечание
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows="2"
                placeholder="Дополнительная информация..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Сохранение...' : editingPayment ? 'Обновить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список платежей */}
      {displayedPayments.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border">
          <div className="text-4xl mb-3">
            {activeTab === 'active' ? '📋' : '⏸️'}
          </div>
          <p className="text-gray-600">
            {activeTab === 'active' 
              ? 'Нет активных платежей' 
              : 'Нет неактивных платежей'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPayments.map(payment => {
            const status = activeTab === 'active' 
              ? getPaymentStatus(payment)
              : { 
                  label: 'Неактивен', 
                  color: 'text-gray-600', 
                  bg: 'bg-gray-50', 
                  borderColor: 'border-gray-300', 
                  icon: '⏸️',
                  isPaid: false
                };
            
            return (
              <div
                key={payment._id}
                className={`${status.bg} border ${status.borderColor} rounded-lg p-4 transition-all ${
                  status.isPaid ? 'shadow-md' : ''
                } ${!payment.isActive ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{status.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900">{payment.name}</h4>
                        <p className={`text-sm font-medium ${status.color}`}>
                          {activeTab === 'inactive' 
                            ? 'Платеж приостановлен'
                            : status.isPaid 
                            ? status.label
                            : payment.status === 'overdue' 
                            ? `Просрочено на ${Math.abs(payment.daysUntil)} дней`
                            : payment.daysUntil === 0
                            ? 'Платеж сегодня!'
                            : `До платежа ${payment.daysUntil} дней`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span>💰 {parseFloat(payment.amount).toLocaleString('ru-RU')} ₽</span>
                      <span>📅 {payment.dueDate} число</span>
                      <span>
                        {payment.frequency === 'weekly' ? '📆 Еженедельно' :
                         payment.frequency === 'yearly' ? '📆 Ежегодно' :
                         '📆 Ежемесячно'}
                      </span>
                      {payment.lastPaidDate && (
                        <span className="text-emerald-600 font-medium">
                          ✓ Оплачено: {new Date(payment.lastPaidDate).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                    {payment.description && (
                      <p className="text-xs text-gray-600 mt-2">📝 {payment.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    {activeTab === 'active' && !status.isPaid && (
                      <button
                        onClick={() => handleMarkPaid(payment._id)}
                        className="px-3 py-2 bg-green-200 hover:bg-green-300 text-green-700 rounded-lg font-medium transition-colors text-sm"
                        title="✅ Отметить как оплаченный"
                      >
                        ✔️
                      </button>
                    )}

                    {activeTab === 'active' && status.isPaid && (
                      <button
                        onClick={() => handleUnmarkPaid(payment._id)}
                        className="px-3 py-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-700 rounded-lg font-medium transition-colors text-sm"
                        title="↩️ Отменить оплату"
                      >
                        ↩️
                      </button>
                    )}

                    <button
                      onClick={() => handleTogglePayment(payment._id, payment.isActive)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                        payment.isActive
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          : 'bg-green-200 hover:bg-green-300 text-green-700'
                      }`}
                      title={payment.isActive ? '⏸️ Отключить платеж' : '▶️ Включить платеж'}
                    >
                      {payment.isActive ? '⏸️' : '▶️'}
                    </button>

                    <button
                      onClick={() => handleEditPayment(payment)}
                      className="px-3 py-2 bg-blue-200 hover:bg-blue-300 text-blue-700 rounded-lg font-medium transition-colors text-sm"
                      title="✏️ Редактировать платеж"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDeletePayment(payment._id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm"
                      title="🗑️ Удалить платеж"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}