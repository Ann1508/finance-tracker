// client/src/pages/Profile.jsx - С ПОДДЕРЖКОЙ URL ПАРАМЕТРА

import React, { useState, useEffect } from 'react';
import { auth } from '../Api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MandatoryPayments from '../components/MandatoryPayments';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Проверяем URL параметр для автоматического открытия вкладки
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Следим за изменением URL параметра
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'password', 'settings', 'mandatoryPayments'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Форма профиля
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });

  // Форма смены пароля
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Форма настроек
  const [settingsData, setSettingsData] = useState({
    currency: user?.currency || 'USD',
    monthlyBudget: user?.monthlyBudget || 0
  });

  const currencies = [
    { code: 'USD', symbol: '$', name: 'Доллар США' },
    { code: 'EUR', symbol: '€', name: 'Евро' },
    { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
    { code: 'PLN', symbol: 'zł', name: 'Польский злотый' },
    { code: 'GBP', symbol: '£', name: 'Фунт стерлингов' },
    { code: 'JPY', symbol: '¥', name: 'Японская иена' },
    { code: 'CNY', symbol: '¥', name: 'Китайский юань' }
  ];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await auth.updateProfile(profileData);
      updateUser(updated);
      alert('Профиль успешно обновлен');
      
      if (profileData.email !== user.email) {
        alert('На новый email отправлено письмо для подтверждения');
      }
    } catch (err) {
      console.error('Ошибка обновления профиля:', err);
      alert(err.error || 'Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Новые пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      await auth.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      alert('Пароль успешно изменен');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Ошибка смены пароля:', err);
      alert(err.error || 'Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await auth.updateProfile(settingsData);
      updateUser(updated);
      alert('Настройки успешно обновлены');
    } catch (err) {
      console.error('Ошибка обновления настроек:', err);
      alert(err.error || 'Не удалось обновить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResendVerification = async () => {
    try {
      await auth.resendVerification();
      alert('Письмо отправлено на ваш email');
    } catch (err) {
      console.error('Ошибка отправки письма:', err);
      alert(err.error || 'Не удалось отправить письмо');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Профиль</h1>

      {/* Карточка пользователя */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">@{user?.login}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user?.role === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}
              </span>
              {user?.email && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user?.emailVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user?.emailVerified ? '✓ Email подтвержден' : '⚠ Email не подтвержден'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Выйти
          </button>
        </div>

        {user?.email && !user?.emailVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              Ваш email не подтвержден. Проверьте почту или запросите новое письмо.
            </p>
            <button
              onClick={handleResendVerification}
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium underline"
            >
              Отправить письмо повторно
            </button>
          </div>
        )}
      </div>

      {/* Табы */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👤 Профиль
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'password'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔒 Пароль
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ⚙️ Настройки
          </button>
          <button
            onClick={() => setActiveTab('mandatoryPayments')}
            className={`flex-1 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'mandatoryPayments'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💳 Обязательные платежи
          </button>
        </div>

        <div className="p-6">
          {/* Вкладка профиля */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ваше имя"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  При изменении email потребуется подтверждение
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  О себе
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows="4"
                  placeholder="Расскажите немного о себе..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profileData.bio.length}/500 символов
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </form>
          )}

          {/* Вкладка пароля */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Минимум 6 символов
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </form>
          )}

          {/* Вкладка настроек */}
          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Валюта
                </label>
                <select
                  value={settingsData.currency}
                  onChange={e => setSettingsData({ ...settingsData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Месячный бюджет
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settingsData.monthlyBudget}
                  onChange={e => setSettingsData({ ...settingsData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Установите лимит расходов на месяц (опционально)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </form>
          )}

          {/* Вкладка обязательных платежей */}
          {activeTab === 'mandatoryPayments' && (
            <MandatoryPayments />
          )}
        </div>
      </div>
    </div>
  );
}