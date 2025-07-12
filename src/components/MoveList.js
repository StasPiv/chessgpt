import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction } from '../redux/actions.js';
import './MoveList.css';
import GameHeader from "./GameHeader.js";

const MoveList = () => {
    const dispatch = useDispatch();
    const history = useSelector(state => state.chess.history);
    console.log(history);
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);

    const handleMoveClick = (moveIndex) => {
        dispatch(gotoMoveAction(moveIndex));
    };

    const handleStartPosition = () => {
        dispatch(gotoMoveAction(-1));
    };

    // Функция для рендеринга вариантов
    const renderVariations = (variations, parentMoveNumber, isWhiteMove) => {
        if (!variations || variations.length === 0) return null;
        
        return variations.map((variation, varIndex) => (
            <span key={`var-${varIndex}`} className="variation">
                ({renderMoveSequence(variation, parentMoveNumber, isWhiteMove)})
            </span>
        ));
    };

    // Функция для рендеринга последовательности ходов в вариации
    const renderMoveSequence = (moves, startMoveNumber, startIsWhite) => {
        return moves.map((move, index) => {
            const moveNumber = Math.floor((index + (startIsWhite ? 0 : 1)) / 2) + startMoveNumber;
            const isWhiteMove = startIsWhite ? index % 2 === 0 : index % 2 === 1;
            
            let display = '';
            if (isWhiteMove) {
                display = `${moveNumber}.${move.san}`;
            } else {
                display = index === 0 && !startIsWhite ? `${moveNumber}...${move.san}` : move.san;
            }
            
            return (
                <span key={index} className="variation-move">
                    {display}
                    {move.variations && renderVariations(move.variations, moveNumber, !isWhiteMove)}
                    {index < moves.length - 1 ? ' ' : ''}
                </span>
            );
        });
    };

    // Основной рендер списка ходов
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
                    className={`move-item ${i === currentMoveIndex ? 'current' : ''}`}
                    onClick={() => handleMoveClick(i)}
                    title={`Move ${i + 1}: ${display}`}
                >
                    {display}
                </span>
            );
            
            // Добавляем варианты после хода
            if (move.variations && move.variations.length > 0) {
                result.push(
                    <span key={`variations-${i}`} className="variations-container">
                        {' '}
                        {renderVariations(move.variations, moveNumber, !isWhiteMove)}
                    </span>
                );
            }
            
            // Добавляем пробел между ходами
            if (i < history.length - 1) {
                result.push(' ');
            }
        }
        
        return result;
    };

    return (
        <div className="move-list-container">
            <div className="moves-container">
                <h4 className="moves-title">Game Moves</h4>
                {history.length === 0 ? (
                    <div className="no-moves">No moves yet</div>
                ) : (
                    <div className="moves-list">
                        <GameHeader />
                        <span
                            className={`move-item start ${currentMoveIndex === -1 ? 'current' : ''}`}
                            onClick={handleStartPosition}
                            title="Go to starting position"
                        >
                            ⭐ Start
                        </span>
                        {renderMovesList()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoveList;