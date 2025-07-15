import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction } from '../redux/actions.js';
import { RootState } from '../types';
import './MoveList.css';
import GameHeader from "./GameHeader";

const MoveList = (): ReactElement => {
    const dispatch = useDispatch();
    const history = useSelector((state: RootState) => state.chess.history);
    const currentMoveIndex = useSelector((state: RootState) => state.chess.currentMoveIndex);

    const handleMoveClick = (moveIndex: number): void => {
        dispatch(gotoMoveAction({
            moveIndex: moveIndex,
            fen: history[moveIndex]?.fen
        }));
    };

    const isCurrentMove = (moveIndex: number): boolean => {
        return moveIndex === currentMoveIndex;
    };

    const renderMovesList = () => {
        const result = [];
        
        for (let i = 0; i < history.length; i++) {
            const move = history[i];
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhiteMove = i % 2 === 0;
            
            let display = '';
            if (isWhiteMove) {
                display = `${moveNumber}.${move.san}`;
            } else {
                display = move.san;
            }
            
            result.push(
                <span 
                    key={i} 
                    className={`move-item ${isCurrentMove(i) ? 'current' : ''}`}
                    onClick={() => handleMoveClick(i)}
                    title={`Move ${i + 1}: ${display}`}
                >
                    {display}
                </span>
            );
            
            // Add space between moves
            if (i < history.length - 1) {
                result.push(' ');
            }
        }
        
        return result;
    };

    return (
        <div className="move-list-container">
            <div className="moves-container">
                {history.length === 0 ? (
                    <div className="no-moves">No moves yet</div>
                ) : (
                    <div className="moves-list">
                        <GameHeader />
                        {renderMovesList()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoveList;