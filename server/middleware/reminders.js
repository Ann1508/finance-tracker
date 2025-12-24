// server/middleware/reminders.js - С ПОДРОБНОЙ ОТЛАДКОЙ

const MandatoryPayment = require('../models/MandatoryPayment');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Настрой транспортер для отправки Email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Функция отправки напоминания
const sendPaymentReminder = async (user, payment) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `💳 Напоминание: платеж "${payment.name}" через ${payment.reminderDaysBefore} дней`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Напоминание об обязательном платеже</h2>
          <p>Здравствуйте, <strong>${user.name}</strong>!</p>
          <p>Вам нужно совершить платеж:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <p style="margin: 10px 0;"><strong>💰 Платеж:</strong> ${payment.name}</p>
            <p style="margin: 10px 0;"><strong>💵 Сумма:</strong> ${payment.amount.toLocaleString('ru-RU')} ₽</p>
            <p style="margin: 10px 0;"><strong>📅 День платежа:</strong> ${payment.dueDate} число месяца</p>
            <p style="margin: 10px 0;"><strong>🔄 Частота:</strong> ${
              payment.frequency === 'weekly' ? 'Еженедельно' :
              payment.frequency === 'yearly' ? 'Ежегодно' :
              'Ежемесячно'
            }</p>
            ${payment.description ? `<p style="margin: 10px 0;"><strong>📝 Примечание:</strong> ${payment.description}</p>` : ''}
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Не забудьте совершить платеж вовремя, чтобы избежать штрафов.
          </p>
          
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            С уважением,<br/>
            Приложение для управления финансами
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Напоминание отправлено пользователю ${user.email} о платеже "${payment.name}"`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки напоминания:', error);
    return false;
  }
};

// Функция проверки и отправки напоминаний (запускается по расписанию)
const checkAndSendReminders = async () => {
  try {
    console.log('\n========================================');
    console.log('🔔 Начало проверки напоминаний об обязательных платежах...');
    console.log('========================================');
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    console.log(`📅 Сегодня: ${currentDay}.${currentMonth + 1}.${currentYear}`);
    console.log(`⏰ Время на сервере: ${today.toLocaleString('ru-RU')}`);

    // Получаем все платежи (активные и неактивные)
    const allPayments = await MandatoryPayment.find()
      .populate('userId');

    console.log(`\n📊 Всего платежей в БД: ${allPayments.length}`);

    if (allPayments.length === 0) {
      console.log('⚠️  Нет платежей в базе данных!');
      console.log('========================================\n');
      return;
    }

    // Выводим все платежи для отладки
    console.log('\n📋 Список всех платежей:');
    allPayments.forEach((p, idx) => {
      console.log(`${idx + 1}. "${p.name}"`);
      console.log(`   - День платежа: ${p.dueDate}`);
      console.log(`   - Активен: ${p.isActive}`);
      console.log(`   - Напоминание за: ${p.reminderDaysBefore} дней`);
      console.log(`   - Пользователь: ${p.userId ? p.userId.email : 'НЕ НАЙДЕН'}`);
      console.log(`   - Последний отправленный: ${p.lastReminderSent ? new Date(p.lastReminderSent).toLocaleString('ru-RU') : 'Никогда'}`);
    });

    // Фильтруем активные платежи
    const activePayments = allPayments.filter(p => p.isActive);
    console.log(`\n✅ Активных платежей: ${activePayments.length}`);

    let sentCount = 0;
    let checkCount = 0;

    for (const payment of activePayments) {
      if (!payment.userId) {
        console.log(`\n⚠️  Платеж "${payment.name}" без пользователя - ПРОПУСКАЕМ`);
        continue;
      }

      const daysUntil = payment.dueDate - currentDay;
      
      console.log(`\n📌 Проверяем: "${payment.name}"`);
      console.log(`   📅 День платежа: ${payment.dueDate}, сегодня: ${currentDay}`);
      console.log(`   📊 Дней до платежа: ${daysUntil}`);
      console.log(`   ⏰ Напоминание нужно за: ${payment.reminderDaysBefore} дней`);
      console.log(`   🎯 Совпадает? ${daysUntil === payment.reminderDaysBefore ? 'ДА ✅' : 'НЕТ ❌'}`);

      if (daysUntil === payment.reminderDaysBefore) {
        checkCount++;
        
        // Проверяем, не отправляли ли уже напоминание сегодня
        const lastReminder = payment.lastReminderSent ? new Date(payment.lastReminderSent) : null;
        const lastReminderDay = lastReminder ? lastReminder.getDate() : null;
        const shouldSend = !lastReminder || lastReminderDay !== currentDay;

        console.log(`   📨 Последний отправленный день: ${lastReminderDay || 'никогда'}`);
        console.log(`   🔄 Отправлять снова? ${shouldSend ? 'ДА ✅' : 'НЕТ ❌ (уже отправлено сегодня)'}`);

        if (shouldSend) {
          console.log(`   → Отправляем письмо пользователю ${payment.userId.email}...`);
          const sent = await sendPaymentReminder(payment.userId, payment);
          if (sent) {
            payment.lastReminderSent = new Date();
            await payment.save();
            sentCount++;
            console.log(`   ✅ Письмо успешно отправлено и сохранено!`);
          } else {
            console.log(`   ❌ Ошибка при отправке письма`);
          }
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`📊 Итоги проверки:`);
    console.log(`   - Найдено платежей для проверки: ${checkCount}`);
    console.log(`   - Отправлено напоминаний: ${sentCount}`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error('❌ Критическая ошибка в checkAndSendReminders:', error);
  }
};

module.exports = {
  sendPaymentReminder,
  checkAndSendReminders
};