// server/utils/email.js
const nodemailer = require('nodemailer');

// Настройка транспортера (используем Gmail или другой SMTP)
// Для Gmail нужен пароль приложения: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Альтернативная настройка для любого SMTP сервера
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: process.env.SMTP_SECURE === 'true',
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD
//   }
// });

async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (err) {
    console.error('Email sending error:', err);
    return false;
  }
}

// Шаблон письма подтверждения email
function getVerificationEmailTemplate(verifyUrl, userName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
        .content { background: white; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #764ba2; }
        .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Финансовый Трекер</h1>
        </div>
        <div class="content">
          <h2>Подтверждение email адреса</h2>
          <p>Привет, ${userName || 'друг'}!</p>
          <p>Спасибо за регистрацию в нашем приложении для управления финансами. Пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
          
          <center>
            <a href="${verifyUrl}" class="button">✓ Подтвердить email</a>
          </center>
          
          <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
          <p style="word-break: break-all; color: #667eea;">
            <a href="${verifyUrl}">${verifyUrl}</a>
          </p>
          
          <div class="warning">
            <strong>⚠️ Важно:</strong> Эта ссылка действительна только 24 часа. Если вы не создавали аккаунт, просто проигнорируйте это письмо.
          </div>
          
          <p>С уважением,<br>Команда Финансового Трекера</p>
        </div>
        <div class="footer">
          <p>Это автоматическое письмо. Пожалуйста, не отвечайте на него.</p>
          <p>&copy; 2024 Financial Tracker. Все права защищены.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Шаблон письма сброса пароля
function getResetPasswordTemplate(resetUrl, userName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
        .content { background: white; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #c0392b; }
        .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        .warning { background: #f8d7da; border-left: 4px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Финансовый Трекер</h1>
        </div>
        <div class="content">
          <h2>Сброс пароля</h2>
          <p>Привет, ${userName || 'друг'}!</p>
          <p>Мы получили запрос на сброс пароля вашего аккаунта. Если это были вы, нажмите на кнопку ниже:</p>
          
          <center>
            <a href="${resetUrl}" class="button">🔑 Сбросить пароль</a>
          </center>
          
          <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
          <p style="word-break: break-all; color: #667eea;">
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          
          <div class="warning">
            <strong>⚠️ Внимание:</strong> Эта ссылка действительна только 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо и ваш пароль останется без изменений.
          </div>
          
          <p>С уважением,<br>Команда Финансового Трекера</p>
        </div>
        <div class="footer">
          <p>Это автоматическое письмо. Пожалуйста, не отвечайте на него.</p>
          <p>&copy; 2024 Financial Tracker. Все права защищены.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  sendEmail,
  getVerificationEmailTemplate,
  getResetPasswordTemplate
};