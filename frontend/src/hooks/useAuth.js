import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Настраиваем axios для работы с куками
axios.defaults.withCredentials = true;

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    const checkAuth = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/user`);
            
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

    const logout = async () => {
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
