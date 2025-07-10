import React from 'react';
import ChessBoard from './components/ChessBoard.js';
import MoveList from './components/MoveList.js';
import AnalysisPanel from './components/AnalysisPanel.js';
import NavigationControls from './components/NavigationControls.js';

const App = () => {
    return (
        <div style={{display: 'flex', padding: '20px', height: '100vh'}}>
            {/* Левая панель - шахматная доска */}
            <div style={{ flexShrink: 0 }}>
                <ChessBoard/>
                <NavigationControls/>
            </div>
            
            {/* Правая панель - ходы и анализ */}
            <div style={{
                marginLeft: '20px', 
                width: '350px', 
                display: 'flex', 
                flexDirection: 'column',
                height: 'fit-content'
            }}>
                {/* Верхняя часть - ходы партии */}
                <div style={{ marginBottom: '20px' }}>
                    <MoveList/>
                </div>
                
                {/* Нижняя часть - анализ */}
                <div>
                    <AnalysisPanel/>
                </div>
            </div>
        </div>
    );
};

export default App;