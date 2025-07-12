import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction } from '../redux/actions.js';
import './MoveList.css';

const MoveList = () => {
    const dispatch = useDispatch();
    const history = useSelector(state => state.chess.history);
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);

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
        </div>
    );
};

export default MoveList;