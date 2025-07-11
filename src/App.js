import React from 'react';
import ChessBoard from './components/ChessBoard.js';
import MoveList from './components/MoveList.js';
import NavigationControls from './components/NavigationControls.js';
import AnalysisPanel from './components/AnalysisPanel.js';
import LoadPgn from './components/LoadPgn.js';
import './App.css';

const App = () => {
    return (
        <div className="app-container">
            {/* Левая панель - шахматная доска */}
            <div className="board-panel">
                <ChessBoard/>
                <NavigationControls/>
            </div>
            
            {/* Правая панель - ходы и анализ */}
            <div className="side-panel">
                {/* Верхняя часть - ходы партии */}
                <div className="moves-section">
                    <MoveList/>
                </div>
                
                {/* Загрузка PGN */}
                <div className="pgn-section">
                    <LoadPgn/>
                </div>
                
                {/* Нижняя часть - анализ */}
                <div className="analysis-section">
                    <AnalysisPanel/>
                </div>
            </div>
        </div>
    );
};

export default App;