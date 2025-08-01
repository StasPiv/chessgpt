import React, { useState, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './redux/store.js';
import { setIsFullscreenAction } from './redux/actions.js';
import CustomLayout from './components/CustomLayout.tsx';
import LoadPgn from './components/LoadPgn.tsx';
import { connectWebSocket } from './websocket.js';
import fullscreenManager from './utils/FullscreenManager.js';
import './App.scss';
import FullScreenHint from "./components/FullScreenHint";

function AppContent() {
    const [showPgnModal, setShowPgnModal] = useState(false);
    const dispatch = useDispatch();
    const isMobile = useSelector(state => state.ui.isMobile);
    const isFullscreen = useSelector(state => state.ui.isFullscreen);

    useEffect(() => {
        connectWebSocket(store);
    }, []);

    // Отслеживание изменений полноэкранного режима
    useEffect(() => {
        const unsubscribe = fullscreenManager.addListener((fullscreen) => {
            dispatch(setIsFullscreenAction(fullscreen));
        });
        
        // Инициализируем состояние полноэкранного режима
        dispatch(setIsFullscreenAction(fullscreenManager.isInFullscreen()));
        
        return unsubscribe;
    }, [dispatch]);

    // Полноэкранный режим для мобильных устройств
    useEffect(() => {
        if (isMobile) {
            const requestFullscreen = async () => {
                try {
                    const element = document.documentElement;

                    if (element.requestFullscreen) {
                        await element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) {
                        await element.webkitRequestFullscreen();
                    } else if (element.mozRequestFullScreen) {
                        await element.mozRequestFullScreen();
                    } else if (element.msRequestFullscreen) {
                        await element.msRequestFullscreen();
                    }
                } catch (error) {
                    console.log('Fullscreen not supported or denied:', error);

                    // Fallback: скролл для скрытия адресной строки
                    setTimeout(() => {
                        window.scrollTo(0, 1);
                    }, 100);
                }
            };

            // Запрос полноэкранного режима при первом взаимодействии
            const handleFirstTouch = () => {
                requestFullscreen();
                document.removeEventListener('touchstart', handleFirstTouch);
                document.removeEventListener('click', handleFirstTouch);
            };

            document.addEventListener('touchstart', handleFirstTouch);
            document.addEventListener('click', handleFirstTouch);

            return () => {
                document.removeEventListener('touchstart', handleFirstTouch);
                document.removeEventListener('click', handleFirstTouch);
            };
        }
    }, [isMobile]);

    const handleClosePgnModal = () => {
        setShowPgnModal(false);
    };

    // Определяем, нужно ли показывать основное содержимое
    const shouldShowMainContent = !isMobile || isFullscreen;

    return (
        <div className="app-container">
            {shouldShowMainContent && (
                <div className="layout-container">
                    <CustomLayout />
                </div>
            )}

            <FullScreenHint />

            {shouldShowMainContent && showPgnModal && (
                <div className="pgn-modal">
                    <div className="pgn-modal-content">
                        <div className="pgn-modal-header">
                            <h3 className="pgn-modal-title">Load PGN</h3>
                            <button
                                className="pgn-modal-close"
                                onClick={handleClosePgnModal}
                            >
                                ×
                            </button>
                        </div>
                        <LoadPgn onClose={handleClosePgnModal} />
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <Provider store={store}>
            <AppContent />
        </Provider>
    );
}

export default App;