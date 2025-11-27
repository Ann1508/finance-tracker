// components/ProjectList.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProjectList({ projects, onDeleteProject, onEditProject, currentUser, getUserTaskCount, getAllTaskCount }) {
    const navigate = useNavigate();
    const [editingProject, setEditingProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: ''
    });

    if (!projects || projects.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-lg mb-4">📁 Проектов пока нет</div>
                <p className="text-gray-400 mb-6">
                    {currentUser?.role === 'admin'
                        ? 'Создайте первый проект чтобы начать работу'
                        : 'Вас пока нет ни в одном проекте как исполнителя задач'
                    }
                </p>
                {currentUser?.role === 'admin' && (
                    <button
                        onClick={() => navigate('/projects/new')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        + Создать первый проект
                    </button>
                )}
            </div>
        );
    }

    const canEditProject = (project) => {
        if (currentUser?.role === 'admin') return true;
        return project.createdBy?._id === currentUser?.id || project.createdBy === currentUser?.id;
    };

    const canDeleteProject = (project) => {
        if (currentUser?.role === 'admin') return true;
        return project.createdBy?._id === currentUser?.id || project.createdBy === currentUser?.id;
    };

    const getTaskCount = (project) => {
        if (currentUser?.role === 'admin') {
            return getAllTaskCount ? getAllTaskCount(project) : 0;
        }
        return getUserTaskCount ? getUserTaskCount(project) : 0;
    };

    const formatDate = (dateString) => {
        return new Date(Number(dateString)).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleEditClick = (project) => {
        setEditingProject(project);
        setEditFormData({
            title: project.name,
            description: project.description || ''
        });
    };

    const handleDeleteClick = (project) => {
        setDeletingProject(project);
    };

    const handleSaveEdit = async () => {
        if (!editFormData.title.trim()) {
            alert('Название проекта обязательно');
            return;
        }

        console.log('Редактируем проект ID:', editingProject?.id, editFormData);

        try {
            await onEditProject(editingProject.id, editFormData);
            setEditingProject(null);
            setEditFormData({ title: '', description: '' });
        } catch (error) {
            console.error('Ошибка при редактировании проекта:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingProject) return;

        setDeleting(true);
        try {
            await onDeleteProject(deletingProject.id);
            setDeletingProject(null);
        } catch (error) {
            console.error('Ошибка при удалении проекта:', error);
        } finally {
            setDeleting(false);
        }
    };

    // Определяем тип доступа пользователя к проекту
    const getProjectAccessType = (project) => {
        const hasTasks = getUserTaskCount && getUserTaskCount(project) > 0;
        if (hasTasks) return 'assignee';
        const isCreator = project.createdBy?.id === currentUser?._id || project.createdBy === currentUser?.id;
        if (isCreator) return 'creator';
        if (currentUser?.role === 'admin') return 'admin';
        return 'no-access';
    };

    const getAccessBadge = (project) => {
        const accessType = getProjectAccessType(project);

        switch (accessType) {
            case 'admin':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        👑 Админ
                    </span>
                );
            case 'creator':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✨ Создатель
                    </span>
                );
            case 'assignee':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ✅ Исполнитель
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-purple-200">
                        {/* Заголовок и бейдж доступа */}
                        <div className="flex justify-between items-start mb-3">
                            <Link
                                to={`/projects/${project.id}`}
                                className="group flex-1"
                            >
                                <h2 className="text-xl font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                                    {project.name}
                                </h2>
                            </Link>
                            {getAccessBadge(project)}
                        </div>

                        {/* Описание */}
                        {project.description && (
                            <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                                {project.description}
                            </p>
                        )}

                        {/* Статистика */}
                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="flex items-center space-x-1">
                                    <span>👤 Создатель:</span>
                                </span>
                                <span className="font-medium text-gray-700 text-xs bg-gray-100 px-2 py-1 rounded">
                                    {project.createdBy?.name || project.createdBy?.login || 'Неизвестно'}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="flex items-center space-x-1">
                                    {currentUser?.role === 'admin' ? (
                                        <span>✅ Всего задач:</span>
                                    ) : (
                                        <span>✅ Ваших задач:</span>
                                    )}
                                </span>
                                <span className="font-medium">{getTaskCount(project)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="flex items-center space-x-1">
                                    <span>📅 Создан:</span>
                                </span>
                                <span className="font-medium text-xs">
                                    {formatDate(project.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                            <Link
                                to={`/projects/${project.id}`}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>🔍</span>
                                <span>Открыть проект</span>
                            </Link>

                            <div className="flex space-x-2">
                                {canEditProject(project) && (
                                    <button
                                        onClick={() => handleEditClick(project)}
                                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 border border-blue-200"
                                        title="Редактировать проект"
                                    >
                                        <span>✏️</span>
                                        <span className="truncate">Изменить</span>
                                    </button>
                                )}

                                {canDeleteProject(project) && (
                                    <button
                                        onClick={() => handleDeleteClick(project)}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 border border-red-200"
                                        title="Удалить проект"
                                    >
                                        <span>🗑️</span>
                                        <span className="truncate">Удалить</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Модальное окно редактирования проекта */}
            {editingProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                     onClick={() => setEditingProject(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md"
                         onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Редактировать проект</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Название проекта *
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.title}
                                        onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Введите название проекта"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Описание проекта
                                    </label>
                                    <textarea
                                        value={editFormData.description}
                                        onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="Введите описание проекта"
                                        rows="4"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mt-6 pt-4 border-t">
                                <button
                                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                                    onClick={() => setEditingProject(null)}
                                >
                                    Отмена
                                </button>
                                <button
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    onClick={handleSaveEdit}
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно подтверждения удаления проекта */}
            {deletingProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                     onClick={() => setDeletingProject(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md"
                         onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                <span className="text-red-600 text-xl">⚠️</span>
                            </div>
                            <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
                                Удалить проект?
                            </h2>
                            <p className="text-gray-600 text-center mb-6">
                                Вы уверены, что хотите удалить проект <strong>"{deletingProject.name}"</strong>?
                                <br />
                                Все задачи проекта ({getTaskCount(deletingProject)}) также будут удалены.
                                <br />
                                <span className="text-red-600 font-medium">Это действие нельзя отменить!</span>
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setDeletingProject(null)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={deleting}
                                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                                        deleting
                                            ? 'bg-red-400 cursor-not-allowed text-white'
                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                >
                                    {deleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Удаление...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🗑️</span>
                                            <span>Удалить проект</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}