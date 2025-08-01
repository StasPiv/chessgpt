
import React, { ReactElement, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import fullscreenManager from '../utils/FullscreenManager.js';
import './FullScreenHint.scss';

const FullScreenHint = (): ReactElement | null => {
    const [isVisible, setIsVisible] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const isMobile = useSelector((state: RootState) => state.ui.isMobile);

    // Подписка на изменения полноэкранного режима
    useEffect(() => {
        const unsubscribe = fullscreenManager.addListener((fullscreen) => {
            setIsFullscreen(fullscreen);
        });
        
        // Инициализируем состояние
        setIsFullscreen(fullscreenManager.isInFullscreen());
        
        return unsubscribe;
    }, []);

    // Показываем подсказку только на мобильных устройствах, если не в полноэкранном режиме и не было взаимодействия
    useEffect(() => {
        if (isMobile && !isFullscreen && !hasInteracted) {
            // Показываем подсказку через 2 секунды после загрузки
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 2000);

            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isMobile, isFullscreen, hasInteracted]);

    // Автоматически скрываем подсказку через 10 секунд
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setHasInteracted(true);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isVisible]);

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
                        Нажмите на палец или проведите вверх для лучшего игрового опыта
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
