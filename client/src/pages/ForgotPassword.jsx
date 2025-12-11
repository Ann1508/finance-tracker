import React, { useState } from 'react';
import { auth } from '../Api';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await auth.forgotPassword(email);
      setMessage(res.message);
      setEmail('');
    } catch (err) {
      setError(err.error || 'Ошибка отправки письма');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 space-y-6 animate-fadeIn">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Сброс пароля
          </h2>
          <p className="text-gray-600 mt-2">
            Мы отправим инструкции на вашу почту
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Введите ваш email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-lg shadow-md font-medium transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02]'
            }`}
          >
            {loading ? 'Отправка...' : 'Отправить письмо'}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Вернуться к входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
