import React, { useState } from 'react';
import ChessBoard from './components/ChessBoard.js';
import MoveList from './components/MoveList.js';
import NavigationControls from './components/NavigationControls.js';
import AnalysisPanel from './components/AnalysisPanel.js';
import LoadPgn from './components/LoadPgn.js';
import './App.css';

const App = () => {
    const [isPgnModalOpen, setIsPgnModalOpen] = useState(false);

    const handlePasteClick = () => {
        setIsPgnModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsPgnModalOpen(false);
    };

    return (
        <div className="app-container">
            {/* Левая панель - шахматная доска */}
            <div className="board-panel">
                <div className="chess-board-container">
                    <ChessBoard/>
                </div>
                <div className="navigation-controls">
                    <NavigationControls/>
                </div>
            </div>

            {/* Правая панель - ходы и анализ */}
            <div className="side-panel">
                {/* Заголовок с иконкой Paste */}
                <div className="moves-header">
                    <h2 className="moves-title">Game Moves</h2>
                    <button
                        className="paste-icon"
                        onClick={handlePasteClick}
                        title="Load PGN"
                    >
                        📋
                    </button>
                </div>

                {/* Секция ходов партии */}
                <div className="moves-section">
                    <MoveList/>
                </div>

                {/* Секция анализа */}
                <div className="analysis-section">
                    <AnalysisPanel/>
                </div>
            </div>

            {/* Всплывающий блок для PGN */}
            {isPgnModalOpen && (
                <div className="pgn-modal" onClick={handleCloseModal}>
                    <div className="pgn-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="pgn-modal-header">
                            <h3 className="pgn-modal-title">Load PGN</h3>
                            <button
                                className="pgn-modal-close"
                                onClick={handleCloseModal}
                            >
                                ×
                            </button>
                        </div>
                        <LoadPgn onClose={handleCloseModal} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;