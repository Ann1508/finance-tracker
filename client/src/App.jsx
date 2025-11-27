// App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Nav from './components/Nav';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import ProjectPage from './pages/ProjectPage';
import CreateProjectPage from './pages/CreateProjectPage';
import UserManagement from './pages/UserManagement';
import {AuthProvider, useAuth} from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="min-h-screen bg-purple-100 flex items-center justify-center">
          <div className="text-purple-600 text-lg">Загрузка...</div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-purple-100 text-purple-900">
        <Nav />
        <main className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Защищенные маршруты */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />

            <Route path="/projects/new" element={
              <ProtectedRoute requireAdmin>
                <CreateProjectPage />
              </ProtectedRoute>
            } />

            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <ProjectPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <UserManagement />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
  );
}

export default function App() {
  return (
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
  );
}
