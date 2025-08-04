import React from 'react';
import GoogleLogin from './GoogleLogin';
import { useAuth } from '../hooks/useAuth';
import './AuthHeader.scss';

const AuthHeader: React.FC = () => {
    const { user, authenticated, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="auth-header">
                <div className="auth-loading">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="auth-header">
            {authenticated ? (
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-email">{user?.email}</span>
                    </div>
                    <button 
                        className="logout-button"
                        onClick={logout}
                    >
                        Выйти
                    </button>
                </div>
            ) : (
                <GoogleLogin />
            )}
        </div>
    );
};

export default AuthHeader;