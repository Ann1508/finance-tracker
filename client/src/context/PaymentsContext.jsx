// client/src/contexts/PaymentsContext.jsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { mandatoryPayments as mandatoryPaymentsApi } from '../Api';

const PaymentsContext = createContext();

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error('usePayments должен использоваться внутри PaymentsProvider');
  }
  return context;
};

export const PaymentsProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [paymentsWithStatus, setPaymentsWithStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  // Функция для загрузки платежей
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, statusRes] = await Promise.all([
        mandatoryPaymentsApi.list(),
        mandatoryPaymentsApi.getStatus()
      ]);
      setPayments(paymentsRes);
      setPaymentsWithStatus(statusRes);
      return { payments: paymentsRes, status: statusRes };
    } catch (error) {
      console.error('Ошибка загрузки платежей:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновить платеж
  const updatePayment = useCallback(async (id, data) => {
    try {
      await mandatoryPaymentsApi.update(id, data);
      await fetchPayments(); // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка обновления платежа:', error);
      throw error;
    }
  }, [fetchPayments]);

  // Отметить как оплаченный
  const markPaid = useCallback(async (id) => {
    try {
      await mandatoryPaymentsApi.markPaid(id);
      await fetchPayments(); // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка отметки платежа:', error);
      throw error;
    }
  }, [fetchPayments]);

  // Создать платеж
  const createPayment = useCallback(async (data) => {
    try {
      await mandatoryPaymentsApi.create(data);
      await fetchPayments();
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      throw error;
    }
  }, [fetchPayments]);

  // Удалить платеж
  const deletePayment = useCallback(async (id) => {
    try {
      await mandatoryPaymentsApi.delete(id);
      await fetchPayments();
    } catch (error) {
      console.error('Ошибка удаления платежа:', error);
      throw error;
    }
  }, [fetchPayments]);

  const value = {
    payments,
    paymentsWithStatus,
    loading,
    fetchPayments,
    updatePayment,
    markPaid,
    createPayment,
    deletePayment
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};