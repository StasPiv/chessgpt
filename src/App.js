import React, { useState, useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from './redux/store.js';
import CustomLayout from './components/CustomLayout.tsx';
import LoadPgn from './components/LoadPgn.tsx';
import { connectWebSocket } from './websocket.js';
import './App.scss';

function AppContent() {
    const [showPgnModal, setShowPgnModal] = useState(false);
    const isMobile = useSelector(state => state.ui.isMobile);

    useEffect(() => {
        connectWebSocket(store);
    }, []);

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

    return (
        <div className="app-container">
            <div className="layout-container">
                <CustomLayout />
            </div>

            {showPgnModal && (
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