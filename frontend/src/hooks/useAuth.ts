import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, AuthResponse, UseAuthReturn } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Настраиваем axios для работы с куками
axios.defaults.withCredentials = true;

export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [authenticated, setAuthenticated] = useState<boolean>(false);

    const checkAuth = async (): Promise<void> => {
        try {
            const response = await axios.get<AuthResponse>(`${API_BASE_URL}/api/auth/user`);
            
            if (response.data.authenticated) {
                setUser(response.data.user);
                setAuthenticated(true);
            } else {
                setUser(null);
                setAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`);
            setUser(null);
            setAuthenticated(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return {
        user,
        authenticated,
        loading,
        checkAuth,
        logout
    };
};