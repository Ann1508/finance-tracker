// client/src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useState } from 'react';

const translations = {
  ru: {
    dashboard: 'Панель управления',
    transactions: 'Транзакции',
    categories: 'Категории',
    budgets: 'Бюджеты',
    goals: 'Цели',
    profile: 'Профиль',
    income: 'Доход',
    expense: 'Расход',
    balance: 'Баланс',
    add: 'Добавить',
    edit: 'Редактировать',
    delete: 'Удалить',
    save: 'Сохранить',
    cancel: 'Отмена',
    // Добавьте больше переводов
  },
  en: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    categories: 'Categories',
    budgets: 'Budgets',
    goals: 'Goals',
    profile: 'Profile',
    income: 'Income',
    expense: 'Expense',
    balance: 'Balance',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
  },
  pl: {
    dashboard: 'Panel kontrolny',
    transactions: 'Transakcje',
    categories: 'Kategorie',
    budgets: 'Budżety',
    goals: 'Cele',
    profile: 'Profil',
    income: 'Przychód',
    expense: 'Wydatek',
    balance: 'Saldo',
    add: 'Dodaj',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz',
    cancel: 'Anuluj',
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage должен использоваться внутри LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ru';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};