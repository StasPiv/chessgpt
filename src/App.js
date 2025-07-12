import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import CustomLayout from './components/CustomLayout.js';
import LoadPgn from './components/LoadPgn.js';
import './App.css';

function App() {
    const [showPgnModal, setShowPgnModal] = useState(false);

    const handlePasteClick = () => {
        setShowPgnModal(true);
    };

    const handleClosePgnModal = () => {
        setShowPgnModal(false);
    };

    // Функция для сброса лейаута
    const handleResetLayout = () => {
        const defaultLayouts = {
            lg: [
                { i: 'chessboard', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
                { i: 'moves', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
                { i: 'analysis', x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3 }
            ],
            md: [
                { i: 'chessboard', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
                { i: 'moves', x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
                { i: 'analysis', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 }
            ],
            sm: [
                { i: 'chessboard', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 5 },
                { i: 'moves', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
                { i: 'analysis', x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 }
            ]
        };
        localStorage.setItem('chessapp-layouts', JSON.stringify(defaultLayouts));
        // Перезагружаем страницу для применения нового лейаута
        window.location.reload();
    };

    return (
        <Provider store={store}>
            <div className="app-container">
                <div className="app-header">
                    <h1 className="app-title">Chess Analyzer</h1>
                    <div className="app-controls">
                        <button 
                            className="reset-layout-btn" 
                            onClick={handleResetLayout}
                            title="Сбросить лейаут"
                        >
                            🔄 Сбросить лейаут
                        </button>
                        <button 
                            className="paste-icon" 
                            onClick={handlePasteClick}
                            title="Load PGN"
                        >
                            📋 Загрузить PGN
                        </button>
                    </div>
                </div>
                
                <CustomLayout />
                
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
        </Provider>
    );
}

export default App;