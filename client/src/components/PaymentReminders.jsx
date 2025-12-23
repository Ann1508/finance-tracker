// client/src/components/PaymentReminders.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function PaymentReminders() {
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/recurring-payments/upcoming?days=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpcomingPayments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsPaid = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/recurring-payments/${id}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUpcoming();
    } catch (err) {
      console.error(err);
    }
  };

  if (upcomingPayments.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-30">
      <button
        onClick={() => setShowWidget(!showWidget)}
        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg relative"
      >
        <span className="text-2xl">🔔</span>
        {upcomingPayments.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {upcomingPayments.length}
          </span>
        )}
      </button>

      {showWidget && (
        <div className="absolute top-14 right-0 w-80 bg-white rounded-xl shadow-2xl border">
          <div className="p-4 bg-red-50 border-b">
            <h3 className="font-bold text-lg">Предстоящие платежи</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {upcomingPayments.map(payment => (
              <div key={payment._id} className="p-4 border-b hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{payment.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(payment.nextPaymentDate).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <div className="font-bold text-red-600">
                    {payment.amount.toLocaleString()} ₽
                  </div>
                </div>
                <button
                  onClick={() => markAsPaid(payment._id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  ✓ Оплачено
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}