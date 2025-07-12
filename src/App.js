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

    return (
        <Provider store={store}>
            <div className="app-container">
                <div className="app-header">
                    <h1 className="app-title">Chess Analyzer</h1>
                    <div className="app-controls">
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