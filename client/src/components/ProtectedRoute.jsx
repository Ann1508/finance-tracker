// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="text-purple-600">Проверка доступа...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user.role !== 'admin') {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="text-red-600 text-center">
                    <h2 className="text-xl font-bold mb-2">Доступ запрещен</h2>
                    <p>Требуются права администратора</p>
                </div>
            </div>
        );
    }

    return children;
}