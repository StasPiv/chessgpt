import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const OAuthCallback: React.FC = () => {
    const { checkAuth } = useAuth();

    useEffect(() => {
        // После OAuth callback проверяем авторизацию и перенаправляем
        const handleCallback = async () => {
            await checkAuth();
            // Перенаправляем на главную страницу
            window.location.href = '/';
        };

        handleCallback();
    }, [checkAuth]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div>Завершение авторизации...</div>
            <div style={{ 
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #3498db',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default OAuthCallback;