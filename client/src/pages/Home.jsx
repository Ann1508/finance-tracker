import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FallingMoney from '../components/FallingMoney';

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      {/* Фоновая анимация */}
      <FallingMoney />

      {/* Контент */}
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Герой секция */}
        <div className="text-center py-12 mb-12">
          <div className="text-6xl mb-6">💰📊💳</div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Finance Tracker
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Управляйте своими финансами легко и эффективно
          </p>

          {!user ? (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/register"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Начать бесплатно
              </Link>

              <Link
                to="/login"
                className="bg-white hover:bg-gray-50 text-purple-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors border-2 border-purple-600"
              >
                Войти
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Перейти к дашборду →
            </Link>
          )}
        </div>

        {/* Возможности */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Отслеживание доходов
            </h3>
            <p className="text-gray-600">
              Записывайте все источники дохода и следите за их динамикой
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-4xl mb-4">📉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Контроль расходов
            </h3>
            <p className="text-gray-600">
              Анализируйте траты по категориям и оптимизируйте бюджет
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Аналитика
            </h3>
            <p className="text-gray-600">
              Получайте детальную статистику и визуализацию финансов
            </p>
          </div>
        </div>

        {/* Ключевые функции */}
        <div className="bg-white/90 backdrop-blur rounded-xl p-8 shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Ключевые функции
          </h2>

          <div className="space-y-4">
            {[
              {
                title: 'Категории доходов и расходов',
                text: 'Создавайте и настраивайте свои категории с иконками и цветами',
              },
              {
                title: 'Прикрепление чеков',
                text: 'Загружайте фото чеков и квитанций к каждой транзакции',
              },
              {
                title: 'Фильтры и поиск',
                text: 'Фильтруйте транзакции по типу, категории и периоду',
              },
              {
                title: 'Статистика в реальном времени',
                text: 'Мгновенный подсчет доходов, расходов и баланса',
              },
              {
                title: 'Безопасность данных',
                text: 'Ваши финансовые данные надежно защищены',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">✅</span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {item.title}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Призыв к действию */}
        {!user && (
          <div className="text-center mt-12 py-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white">
            <h2 className="text-3xl font-bold mb-4">
              Готовы начать?
            </h2>
            <p className="text-lg mb-6 text-purple-100">
              Создайте аккаунт за 30 секунд и начните управлять финансами
            </p>
            <Link
              to="/register"
              className="inline-block bg-white hover:bg-gray-100 text-purple-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Зарегистрироваться →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
