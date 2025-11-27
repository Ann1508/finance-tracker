// pages/UserManagement.js
import React, { useState, useEffect } from 'react';
import { users as usersApi } from '../Api';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        name: '',
        email: '',
        role: 'user'
    });

    const fetchUsers = async () => {
        try {
            const res = await usersApi.list();
            setUsers(res);
        } catch (err) {
            console.error('Ошибка при загрузке пользователей:', err);
            alert('Не удалось загрузить пользователей');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await usersApi.create(formData);
            setShowForm(false);
            setFormData({
                login: '',
                password: '',
                name: '',
                email: '',
                role: 'user'
            });
            fetchUsers();
            alert('Пользователь создан');
        } catch (err) {
            console.error('Ошибка при создании пользователя:', err);
            alert(err.error || 'Не удалось создать пользователя');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Вы уверены, что хотите удалить пользователя?')) {
            return;
        }

        try {
            await usersApi.remove(userId);
            fetchUsers();
            alert('Пользователь удален');
        } catch (err) {
            console.error('Ошибка при удалении пользователя:', err);
            alert('Не удалось удалить пользователя');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="text-purple-600 text-lg">Загрузка пользователей...</div>
            </div>
        );
    }
}