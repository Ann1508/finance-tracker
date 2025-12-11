import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from '../Api';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await auth.resetPassword(token, password);
      setMessage(res.message);
      setPassword('');
    } catch (err) {
      setError(err.error || 'Невозможно изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 space-y-6 animate-fadeIn">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Новый пароль
          </h2>
          <p className="text-gray-600 mt-2">
            Введите новый пароль для вашего аккаунта
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
              Новый пароль *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Введите новый пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-lg shadow-md font-medium transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02]'
            }`}
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Перейти ко входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
