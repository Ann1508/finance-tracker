// client/src/components/PaymentNotifications.jsx - С ИСПОЛЬЗОВАНИЕМ КОНТЕКСТА

import React, { useState, useEffect } from 'react';
import { usePayments } from '../context/PaymentsContext';
import { useNavigate } from 'react-router-dom';

export default function PaymentNotifications() {
  const { paymentsWithStatus, markPaid, fetchPayments } = usePayments();
  const [dismissed, setDismissed] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем данные при монтировании
    fetchPayments();
    
    // Обновляем каждые 5 минут
    const interval = setInterval(fetchPayments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPaid(id);
      // Автоматически скрываем уведомление после оплаты
      setDismissed(prev => new Set([...prev, id]));
    } catch (error) {
      console.error('Ошибка отметки платежа:', error);
      alert('Не удалось отметить платеж как оплаченный');
    }
  };

  const handleGoToPayments = () => {
    navigate('/profile?tab=mandatoryPayments');
  };

  const getNotificationStyle = (payment) => {
    const daysUntil = payment.daysUntil;
    
    if (payment.status === 'overdue' || daysUntil < 0) {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        icon: '🚨',
        label: 'ПРОСРОЧЕН',
        urgency: 4
      };
    } else if (daysUntil === 0) {
      return {
        bg: 'bg-orange-500',
        text: 'text-white',
        icon: '⚠️',
        label: 'СЕГОДНЯ',
        urgency: 3
      };
    } else if (daysUntil === 1) {
      return {
        bg: 'bg-orange-400',
        text: 'text-white',
        icon: '⏰',
        label: 'ЗАВТРА',
        urgency: 2
      };
    } else if (daysUntil === 2) {
      return {
        bg: 'bg-yellow-400',
        text: 'text-gray-900',
        icon: '📅',
        label: `ЧЕРЕЗ ${daysUntil} ДНЯ`,
        urgency: 1
      };
    } else {
      return {
        bg: 'bg-green-500',
        text: 'text-white',
        icon: '✅',
        label: `ЧЕРЕЗ ${daysUntil} ДНЯ`,
        urgency: 0
      };
    }
  };

  // Фильтруем уведомления
  const notifications = paymentsWithStatus.filter(p => 
    p.isActive && 
    (p.status === 'upcoming' || p.status === 'overdue') &&
    p.daysUntil <= 3
  );

  const visibleNotifications = notifications
    .filter(n => !dismissed.has(n._id))
    .sort((a, b) => {
      const styleA = getNotificationStyle(a);
      const styleB = getNotificationStyle(b);
      return styleB.urgency - styleA.urgency;
    });

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2 max-w-sm pointer-events-auto">
      {visibleNotifications.map(payment => {
        const style = getNotificationStyle(payment);
        
        return (
          <div
            key={payment._id}
            className={`${style.bg} rounded-lg shadow-2xl overflow-hidden animate-slideUp ${
              style.urgency >= 3 ? 'animate-pulse-glow' : ''
            }`}
          >
            <div className="p-3">
              {/* Заголовок с крестиком */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{style.icon}</span>
                  <span className={`${style.text} font-bold text-xs px-2 py-0.5 rounded bg-black bg-opacity-20`}>
                    {style.label}
                  </span>
                </div>
                <button
                  onClick={() => handleDismiss(payment._id)}
                  className={`${style.text} hover:opacity-75 transition-opacity text-lg leading-none`}
                  title="Скрыть"
                >
                  ×
                </button>
              </div>

              {/* Информация о платеже */}
              <div className="mb-2">
                <h4 className={`${style.text} font-bold text-sm mb-1`}>
                  {payment.name}
                </h4>
                <p className={`${style.text} text-xs opacity-90`}>
                  {parseFloat(payment.amount).toLocaleString('ru-RU')} ₽
                </p>
              </div>

              {/* Кнопки */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkPaid(payment._id)}
                  className="flex-1 px-3 py-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-green-700 font-bold rounded text-xs transition-all shadow-sm"
                >
                  ✓ Оплачено
                </button>
                <button
                  onClick={handleGoToPayments}
                  className={`flex-1 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 ${style.text} font-medium rounded text-xs transition-all backdrop-blur-sm`}
                >
                  Платежи →
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Кнопка "Показать все" если много уведомлений */}
      {visibleNotifications.length > 1 && (
        <button
          onClick={handleGoToPayments}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-all shadow-lg"
        >
          Показать все платежи ({visibleNotifications.length})
        </button>
      )}
    </div>
  );
}