// client/src/pages/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../Api';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await auth.verifyEmail(token);
        setSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.error || 'Ошибка при подтверждении email');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Подтверждение email
            </h1>
            <p className="text-gray-600">
              Пожалуйста, подождите...
            </p>
          </>
        ) : success ? (
          <>
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email подтвержден!
            </h1>
            <p className="text-gray-600 mb-4">
              Спасибо за подтверждение вашего email адреса. Сейчас вы будете перенаправлены в профиль...
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Перейти в профиль
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✕</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ошибка подтверждения
            </h1>
            <p className="text-red-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Вернуться в профиль
            </button>
          </>
        )}
      </div>
    </div>
  );
}