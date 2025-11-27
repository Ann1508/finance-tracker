// hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import { auth } from '../Api';

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const userData = await auth.getMe();
            setUser(userData);
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (login, password) => {
        try {
            const result = await auth.login(login, password);
            localStorage.setItem('token', result.token);
            setUser(result.user);
            return result;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (login, password) => {
        try {
            const result = await auth.register(login, password);
            localStorage.setItem('token', result.token);
            setUser(result.user);
            return result;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = (newUserData) => {
        setUser(prev => ({ ...prev, ...newUserData }));
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}