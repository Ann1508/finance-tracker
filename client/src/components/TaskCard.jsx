// components/TaskCard.js
import React, { useState } from "react";
import { tasks as tasksApi } from '../Api';

export default function TaskCard({ task, onEdit, onDelete }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleDownloadFile = async () => {
        if (!task.file) return;

        setDownloading(true);
        try {
            const response = await tasksApi.downloadFile(task.file);

            if (!response.ok) {
                throw new Error('Файл не найден');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = getFileName();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
            alert('Не удалось скачать файл');
        } finally {
            setDownloading(false);
        }
    };

    const getFileName = () => {
        if (!task.file) return '';
        return task.file.split('/').pop() || 'Файл';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const formatAssignee = () => {
        if (typeof task.assignee === 'object' && task.assignee !== null) {
            return task.assignee.name || task.assignee.login || 'Не назначен';
        }
        return task.assignee || 'Не назначен';
    };

    const isOverdue = () => {
        if (!task.due || task.status === 'done') return false;
        return new Date(task.due) < new Date();
    };

    const getStatusColor = () => {
        switch (task.status) {
            case 'todo': return 'bg-gray-100 text-gray-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'done': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = () => {
        switch (task.status) {
            case 'todo': return 'To Do';
            case 'in-progress': return 'In Progress';
            case 'done': return 'Done';
            default: return 'To Do';
        }
    };

    return (
        <>
            {/* Карточка задачи */}
            <div
                onClick={() => setModalOpen(true)}
                className={`p-4 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                    isOverdue()
                        ? 'border-red-300 bg-red-50 hover:bg-red-100'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
            >
                {/* Заголовок и статус */}
                <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-900 flex-1 mr-2">
                        {task.title}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>

                {/* Описание */}
                {task.description && (
                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                    </div>
                )}

                {/* Детали задачи */}
                <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center">
                        <span className="w-6">👤</span>
                        <span className="font-medium text-gray-700">{formatAssignee()}</span>
                    </div>

                    <div className="flex items-center">
                        <span className="w-6">⏰</span>
                        <span className={`font-medium ${isOverdue() ? 'text-red-600' : 'text-gray-700'}`}>
                            {formatDate(task.due)}
                            {isOverdue() && ' 🔴'}
                        </span>
                    </div>

                    {/* Файл */}
                    {task.file && (
                        <div className="flex items-center pt-1">
                            <span className="w-6">📎</span>
                            <span className="text-purple-600 font-medium truncate" title={getFileName()}>
                                {getFileName()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно */}
            {modalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
                            {task.title}
                        </h2>

                        {/* Информация о задаче */}
                        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                            {task.description && (
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">Описание:</div>
                                    <div className="text-sm text-gray-600">{task.description}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="font-medium text-gray-700">Исполнитель:</div>
                                    <div className="text-gray-600">{formatAssignee()}</div>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-700">Срок:</div>
                                    <div className={`${isOverdue() ? 'text-red-600' : 'text-gray-600'}`}>
                                        {formatDate(task.due)}
                                        {isOverdue() && ' 🔴'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-700">Статус:</div>
                                    <div className="text-gray-600">{getStatusText()}</div>
                                </div>
                            </div>

                            {/* Файл */}
                            {task.file && (
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="font-medium text-gray-700 mb-2">Прикрепленный файл:</div>
                                    <button
                                        onClick={handleDownloadFile}
                                        disabled={downloading}
                                        className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            downloading
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                                        }`}
                                    >
                                        {downloading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Скачивание...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>📎</span>
                                                <span>Скачать "{getFileName()}"</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Кнопки действий */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    onEdit(task);
                                }}
                                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                <span>✏️</span>
                                <span>Редактировать</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
                                        setModalOpen(false);
                                        onDelete(task._id);
                                    }
                                }}
                                className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                <span>🗑️</span>
                                <span>Удалить задачу</span>
                            </button>

                            <button
                                onClick={() => setModalOpen(false)}
                                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}