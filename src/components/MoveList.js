import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadPGNAction, undoMoveAction } from '../redux/actions.js';
const MoveList = () => {
    const dispatch = useDispatch();
    const history = useSelector(state => state.chess.history);
    const [pgn, setPgn] = useState('');
    const handleLoadPGN = () => {
        if (pgn.trim()) {
            dispatch(loadPGNAction(pgn));
        }
    };
    const handleUndoMove = () => {
        dispatch(undoMoveAction());
    };
    // Создаем список всех ходов с номерами
    const movesList = history.map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const isWhiteMove = index % 2 === 0;
        return {
            index,
            moveNumber,
            isWhite: isWhiteMove,
            san: move.san,
            display: isWhiteMove ? `${moveNumber}.${move.san}` : move.san
        };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Контейнер для ходов */}
            <div style={{ 
                height: '400px', 
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
            }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Game Moves</h4>
                {movesList.length === 0 ? (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>No moves yet</div>
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap',
                        gap: '8px',
                        lineHeight: '1.4'
                    }}>
                        {movesList.map((move, index) => (
                            <span 
                                key={index} 
                                style={{ 
                                    fontSize: '14px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                                title={`Move ${index + 1}: ${move.display}`}
                            >
                                {move.display}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Контролы внизу */}
            <div>
                <button onClick={handleUndoMove} style={{ marginBottom: '10px' }}>
                    Undo Move
                </button>
                
                <div>
                    <textarea
                        value={pgn}
                        onChange={(e) => setPgn(e.target.value)}
                        placeholder="Paste PGN text here..."
                        style={{ width: '100%', height: '80px', marginBottom: '5px' }}
                    />
                    <button onClick={handleLoadPGN}>
                        Load PGN
                    </button>
                </div>
            </div>
        </div>
    );
};
export default MoveList;