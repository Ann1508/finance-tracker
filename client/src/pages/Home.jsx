import React, { useState } from 'react';

export default function HomePageDemo() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: '📊',
      title: 'Полная аналитика финансов',
      description: 'Детальные графики, статистика по категориям, сравнительный анализ доходов и расходов в реальном времени',
      details: ['Тренды доходов/расходов', 'Распределение по категориям', 'Heatmap расходов', 'Прогнозирование']
    },
    {
      icon: '💳',
      title: 'Умное управление бюджетом',
      description: 'Создавайте бюджеты по категориям, отслеживайте лимиты и получайте предупреждения при превышении',
      details: ['Бюджеты по периодам', 'Прогресс-бары', 'Умные предупреждения', 'Сценарий "Что если"']
    },
    {
      icon: '💰',
      title: 'Система конвертов',
      description: 'Распределяйте средства по целевым накоплениям, переводите между конвертами и отслеживайте прогресс',
      details: ['Целевые накопления', 'Переводы между конвертами', 'Отслеживание прогресса', 'История пополнений']
    },
    {
      icon: '🎯',
      title: 'Финансовые цели',
      description: 'Планируйте и достигайте целей с помощью автоматических накоплений и различных методов сбережения',
      details: ['52-недельный челлендж', 'Таблица накоплений', 'Автоматические платежи', 'Рекомендации']
    },
    {
      icon: '🔔',
      title: 'Обязательные платежи',
      description: 'Управляйте регулярными платежами с напоминаниями и контролем просрочек',
      details: ['Напоминания за 3 дня', 'Контроль просрочек', 'История платежей', 'Ежемесячные расчеты']
    },
    {
      icon: '⭐',
      title: 'Приоритизированные расходы',
      description: 'Классифицируйте расходы по приоритету: критичные, важные, средние, низкие и развлечение',
      details: ['5 уровней приоритета', 'Умные рекомендации', 'Анализ трат', 'Личные советы']
    }
  ];

  const stats = [
    { number: '10+', label: 'Категорий доходов/расходов', icon: '📁' },
    { number: '5', label: 'Уровней приоритета расходов', icon: '⭐' },
    { number: '∞', label: 'Неограниченные транзакции', icon: '♾️' },
    { number: '24/7', label: 'Поддержка уведомлений', icon: '🔔' }
  ];

  const useCases = [
    {
      icon: '👨‍💼',
      title: 'Для профессионалов',
      description: 'Отслеживайте зарплату, налоги, инвестиции и планируйте финансовое будущее'
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: 'Для семей',
      description: 'Управляйте семейным бюджетом, делайте совместные сбережения и планируйте расходы'
    },
    {
      icon: '🧑‍🎓',
      title: 'Для студентов',
      description: 'Контролируйте стипендию, подработки и планируйте траты на учебу'
    },
    {
      icon: '💼',
      title: 'Для предпринимателей',
      description: 'Анализируйте личные финансы и отделяйте их от бизнеса'
    }
  ];

  // Компонент падающих денег
  const FallingMoney = () => {
    const items = ['💰', '🪙', '💵', '💴', '💶'];
    const elements = Array.from({ length: 25 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 18 + Math.random() * 12,
      size: 22 + Math.random() * 18,
      icon: items[Math.floor(Math.random() * items.length)],
    }));

    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes fall {
            0% {
              transform: translateY(-10vh) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(110vh) rotate(360deg);
              opacity: 0.6;
            }
          }
          .falling-money {
            position: absolute;
            top: -10vh;
            animation-name: fall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            user-select: none;
          }
        `}</style>
        {elements.map((el, i) => (
          <span
            key={i}
            className="falling-money"
            style={{
              left: `${el.left}%`,
              animationDelay: `${el.delay}s`,
              animationDuration: `${el.duration}s`,
              fontSize: `${el.size}px`,
            }}
          >
            {el.icon}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full bg-white relative">
      <FallingMoney />
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Левая часть */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full">
                <span className="text-sm font-semibold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text">
                  ✨ Ваш персональный финансовый помощник
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-tight">
                Finance <span className="text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text">Tracker</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Полный контроль над вашими финансами. Аналитика в реальном времени, управление бюджетом, финансовые цели и умные рекомендации — всё в одном приложении.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                Начать бесплатно →
              </button>
              <button className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all duration-300 cursor-pointer">
                Узнать больше
              </button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200">
              <div>
                <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text">10+</div>
                <p className="text-gray-600 text-sm">Функций управления</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text">100%</div>
                <p className="text-gray-600 text-sm">Безопасность данных</p>
              </div>
            </div>
          </div>

          {/* Правая часть - визуализация */}
          <div className="relative">
            <div className="relative w-full h-96 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊💰📈</div>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-gray-900">Ваши финансы</div>
                    <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between text-lg min-w-64">
                        <span>Доходы:</span>
                        <span className="text-green-600 font-bold">250,000 ₽</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span>Расходы:</span>
                        <span className="text-red-600 font-bold">180,000 ₽</span>
                      </div>
                      <div className="flex justify-between text-lg border-t pt-2">
                        <span>Баланс:</span>
                        <span className="text-blue-600 font-bold">70,000 ₽</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-300 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES CAROUSEL */}
      <section className="bg-gradient-to-br from-purple-50 to-indigo-50 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Основные возможности</h2>
            <p className="text-xl text-gray-600">Всё что вам нужно для полного контроля над финансами</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onClick={() => setActiveFeature(idx)}
                className={`p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeFeature === idx
                    ? 'bg-white shadow-2xl border-2 border-purple-600 scale-105'
                    : 'bg-white/50 border-2 border-transparent hover:shadow-lg'
                }`}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-6 text-sm">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-purple-600">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-lg transition-all">
              <div className="text-5xl mb-4">{stat.icon}</div>
              <div className="text-4xl font-black text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text mb-2">
                {stat.number}
              </div>
              <p className="text-gray-600 font-medium text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-white py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Для кого это приложение?</h2>
            <p className="text-xl text-gray-600">Finance Tracker подходит для всех, кто хочет контролировать свои финансы</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-all hover:-translate-y-2">
                <div className="text-5xl mb-4">{useCase.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-gray-600 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEY FEATURES LIST */}
      <section className="bg-gradient-to-br from-purple-50 to-indigo-50 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black text-gray-900 mb-16 text-center">Что вы получаете</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                icon: '📊',
                title: 'Детальная аналитика',
                items: ['Графики доходов и расходов', 'Анализ по категориям', 'Прогнозирование', 'Сравнение периодов']
              },
              {
                icon: '💳',
                title: 'Управление бюджетом',
                items: ['Лимиты по категориям', 'Предупреждения при превышении', 'Поддержка разных периодов', 'Сценарий "Что если"']
              },
              {
                icon: '💰',
                title: 'Система накоплений',
                items: ['Конверты с целями', 'Переводы между конвертами', 'История пополнений', 'Визуальный прогресс']
              },
              {
                icon: '🎯',
                title: 'Финансовые цели',
                items: ['Автоматические платежи', 'Челленджи и таблицы', 'Рекомендации по накоплениям', 'Достижение целей']
              },
              {
                icon: '📸',
                title: 'Чеки и квитанции',
                items: ['Прикрепление к транзакциям', 'Сохранение истории', 'Быстрый просмотр', 'Организация']
              },
              {
                icon: '⭐',
                title: 'Приоритеты расходов',
                items: ['5 уровней классификации', 'Умные рекомендации', 'Анализ трат', 'Улучшение привычек']
              }
            ].map((section, idx) => (
              <div key={idx} className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{section.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h3>
                    <ul className="space-y-3">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 text-sm">
                          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-5xl mx-auto px-4 py-20 relative z-10">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-black mb-4">Готовы начать управлять финансами?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Создайте аккаунт и получите доступ ко всем возможностям бесплатно
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all hover:scale-105 cursor-pointer">
              Создать аккаунт бесплатно →
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all cursor-pointer">
              Уже есть аккаунт? Войти
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER INFO */}
      <section className="bg-gray-900 text-white py-16 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Finance Tracker</h3>
          <p className="text-gray-400 mb-8">
            Полнофункциональное приложение для управления персональными финансами с аналитикой в реальном времени
          </p>
          <div className="grid sm:grid-cols-3 gap-8 text-sm text-gray-400 border-t border-gray-800 pt-8">
            <div>
              <div className="font-bold text-white mb-2">✓ Безопасность</div>
              <p>Ваши данные защищены и доступны только вам</p>
            </div>
            <div>
              <div className="font-bold text-white mb-2">✓ Бесплатно</div>
              <p>Все основные функции доступны бесплатно</p>
            </div>
            <div>
              <div className="font-bold text-white mb-2">✓ Простота</div>
              <p>Интуитивный интерфейс для быстрого старта</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}