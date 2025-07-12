import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import ChessBoard from './components/ChessBoard.js';
import MoveList from './components/MoveList.js';
import NavigationControls from './components/NavigationControls.js';
import AnalysisPanel from './components/AnalysisPanel.js';
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
                <div className="board-panel">
                    <div className="chess-board-container">
                        <ChessBoard />
                    </div>
                    <NavigationControls />
                    <AnalysisPanel />
                </div>
                <div className="side-panel">
                    <div className="moves-header">
                        <h2 className="moves-title">Moves</h2>
                        <button 
                            className="paste-icon" 
                            onClick={handlePasteClick}
                            title="Load PGN"
                        >
                            📋
                        </button>
                    </div>
                    <div className="moves-section">
                        <MoveList />
                    </div>
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