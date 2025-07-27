import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import CustomLayout from './components/CustomLayout.tsx';
import LoadPgn from './components/LoadPgn.tsx';
import { connectWebSocket } from './websocket.js';
import './App.css';

function App() {
    const [showPgnModal, setShowPgnModal] = useState(false);

    // Initialize WebSocket connection
    useEffect(() => {
        connectWebSocket(store);
    }, []);

    const handleClosePgnModal = () => {
        setShowPgnModal(false);
    };

    return (
        <Provider store={store}>
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
        </Provider>
    );
}

export default App;