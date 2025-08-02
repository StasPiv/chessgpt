import React, { ReactElement, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../types';
import { setIsFullscreenAction } from '../redux/actions.js';
import fullscreenManager from '../utils/FullscreenManager.js';
import './FullScreenHint.scss';

const FullScreenHint = (): ReactElement | null => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const dispatch = useDispatch();
    const isMobile = useSelector((state: RootState) => state.ui.isMobile);
    const isFullscreen = useSelector((state: RootState) => state.ui.isFullscreen);

    // Подписка на изменения полноэкранного режима
    useEffect(() => {
        const unsubscribe = fullscreenManager.addListener((isFullscreen: boolean) => {
            dispatch(setIsFullscreenAction(isFullscreen));
        });
        
        // Инициализируем состояние
        dispatch(setIsFullscreenAction(fullscreenManager.isInFullscreen()));
        
        return unsubscribe;
    }, [dispatch]);

    // Показываем подсказку только на мобильных устройствах, если не в полноэкранном режиме
    useEffect(() => {
        if (isMobile && !isFullscreen) {
            if (!hasInteracted) {
                // Показываем подсказку через 2 секунды после загрузки
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 2000);

                return () => clearTimeout(timer);
            } else {
                // Если пользователь уже взаимодействовал, но вышел из полноэкранного режима,
                // показываем подсказку сразу
                setIsVisible(true);
            }
        } else {
            setIsVisible(false);
        }
    }, [isMobile, isFullscreen, hasInteracted]);

    // Автоматически скрываем подсказку через 10 секунд (только для первого показа)
    useEffect(() => {
        if (isVisible && !hasInteracted) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setHasInteracted(true);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, hasInteracted]);

    const handleFingerClick = async () => {
        setHasInteracted(true);
        setIsVisible(false);

        try {
            // Виброотклик для подтверждения
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            await fullscreenManager.requestFullscreen();
        } catch (error) {
            console.log('Fullscreen request failed:', error);
        }
    };

    const handleDismiss = () => {
        setHasInteracted(true);
        setIsVisible(false);
    };

    // Не показываем компонент если не мобильное устройство или не видимый
    if (!isMobile || !isVisible) {
        return null;
    }

    return (
        <div className="fullscreen-hint-overlay">
            <div className="fullscreen-hint-container">
                {/* Кнопка закрытия */}
                <button 
                    className="hint-close-btn"
                    onClick={handleDismiss}
                    aria-label="Закрыть подсказку"
                >
                    ✕
                </button>

                {/* Анимированный палец */}
                <div 
                    className="finger-animation"
                    onClick={handleFingerClick}
                >
                    <div className="finger">
                        👆
                    </div>
                    <div className="swipe-trail"></div>
                </div>

                {/* Текст подсказки */}
                <div className="hint-text">
                    <div className="hint-title">Полноэкранный режим</div>
                    <div className="hint-description">
                        {hasInteracted ? 
                            'Войдите в полноэкранный режим для продолжения игры' :
                            'Нажмите на палец или проведите вверх для лучшего игрового опыта'
                        }
                    </div>
                </div>

                {/* Стрелка вверх */}
                <div className="arrow-up">
                    ↑
                </div>
            </div>
        </div>
    );
};

export default FullScreenHint;