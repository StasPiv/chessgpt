import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadPGNAction, undoMoveAction, gotoMoveAction } from '../redux/actions.js';
import './MoveList.css';

const MoveList = () => {
    const dispatch = useDispatch();
    const history = useSelector(state => state.chess.history);
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);
    const [pgn, setPgn] = useState('');

    const handleLoadPGN = () => {
        if (pgn.trim()) {
            dispatch(loadPGNAction(pgn));
        }
    };

    const handleUndoMove = () => {
        dispatch(undoMoveAction());
    };

    const handleMoveClick = (moveIndex) => {
        dispatch(gotoMoveAction(moveIndex));
    };

    const handleStartPosition = () => {
        dispatch(gotoMoveAction(-1));
    };

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
        <div className="move-list-container">
            <div className="moves-container">
                <h4 className="moves-title">Game Moves</h4>
                {movesList.length === 0 ? (
                    <div className="no-moves">No moves yet</div>
                ) : (
                    <div className="moves-list">
                        <span 
                            className={`move-item start ${currentMoveIndex === -1 ? 'current' : ''}`}
                            onClick={handleStartPosition}
                            title="Go to starting position"
                        >
                            ⭐ Start
                        </span>
                        {movesList.map((move, index) => (
                            <span 
                                key={index} 
                                className={`move-item ${index === currentMoveIndex ? 'current' : ''}`}
                                onClick={() => handleMoveClick(index)}
                                title={`Move ${index + 1}: ${move.display}`}
                            >
                                {move.display}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="controls">
                <button className="undo-button" onClick={handleUndoMove}>
                    Undo Move
                </button>
                
                <div>
                    <textarea
                        className="pgn-textarea"
                        value={pgn}
                        onChange={(e) => setPgn(e.target.value)}
                        placeholder="Paste PGN text here..."
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