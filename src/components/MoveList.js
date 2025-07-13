import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction, gotoVariationMoveAction } from '../redux/actions.js';
import './MoveList.css';
import GameHeader from "./GameHeader.js";

const MoveList = () => {
    const dispatch = useDispatch();
    const history = useSelector(state => state.chess.history);
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);
    const currentVariationPath = useSelector(state => state.chess.currentVariationPath);

    const handleMoveClick = (moveIndex) => {
        dispatch(gotoMoveAction(moveIndex));
    };

    const handleVariationMoveClick = (path) => {
        console.log('Clicking variation move with path:', path);
        dispatch(gotoVariationMoveAction(path));
    };

    const handleStartPosition = () => {
        dispatch(gotoMoveAction(-1));
    };

    // Функция для проверки, является ли ход текущим
    const isCurrentMove = (moveIndex, variationPath = []) => {
        if (variationPath.length === 0) {
            return moveIndex === currentMoveIndex && currentVariationPath.length === 0;
        }
        return JSON.stringify(variationPath) === JSON.stringify(currentVariationPath);
    };

    // Функция для рендеринга вариантов
    const renderVariations = (variations, parentMoveIndex) => {
        if (!variations || variations.length === 0) return null;
        
        return variations.map((variation, varIndex) => (
            <span key={`var-${varIndex}`} className="variation">
                <span className="variation-bracket">(</span>
                {renderVariationSequence(variation, parentMoveIndex, varIndex)}
                <span className="variation-bracket">)</span>
            </span>
        ));
    };

    // Функция для рендеринга последовательности ходов в вариации
    const renderVariationSequence = (moves, parentMoveIndex, variationIndex) => {
        return moves.map((move, moveIndex) => {
            // Определяем, какой это ход относительно родительского хода
            const parentMoveNumber = Math.floor(parentMoveIndex / 2) + 1;
            const isParentWhiteMove = parentMoveIndex % 2 === 0;
            
            // Если родительский ход - ход белых, то первый ход вариации - это альтернативный ход черных
            // Если родительский ход - ход черных, то первый ход вариации - это альтернативный ход белых
            const isFirstMoveInVariation = moveIndex === 0;
            
            let moveNumber, isWhiteMove, display;
            
            if (isFirstMoveInVariation) {
                if (isParentWhiteMove) {
                    // Первый ход в вариации после хода белых - это альтернативный ход черных
                    moveNumber = parentMoveNumber;
                    isWhiteMove = false;
                    display = `${moveNumber}...${move.san}`;
                } else {
                    // Первый ход в вариации после хода черных - это альтернативный ход белых
                    moveNumber = parentMoveNumber + 1;
                    isWhiteMove = true;
                    display = `${moveNumber}.${move.san}`;
                }
            } else {
                // Для последующих ходов в вариации считаем от первого хода
                if (isParentWhiteMove) {
                    // Если начали с хода черных, то далее чередуем
                    const adjustedIndex = moveIndex - 1;
                    isWhiteMove = adjustedIndex % 2 === 0;
                    moveNumber = parentMoveNumber + Math.floor(adjustedIndex / 2) + (isWhiteMove ? 1 : 0);
                } else {
                    // Если начали с хода белых, то далее чередуем
                    const adjustedIndex = moveIndex - 1;
                    isWhiteMove = adjustedIndex % 2 === 1;
                    moveNumber = parentMoveNumber + Math.floor((adjustedIndex + 1) / 2) + (isWhiteMove ? 1 : 0);
                }
                
                if (isWhiteMove) {
                    display = `${moveNumber}.${move.san}`;
                } else {
                    display = move.san;
                }
            }
            
            // Создаем путь для этого хода в вариации
            const variationPath = [
                { type: 'main', index: parentMoveIndex },
                { type: 'variation', variationIndex: variationIndex },
                { type: 'move', moveIndex: moveIndex }
            ];
            
            return (
                <span key={`var-move-${moveIndex}`}>
                    <span 
                        className={`move-item variation-move ${isCurrentMove(moveIndex, variationPath) ? 'current' : ''}`}
                        onClick={() => handleVariationMoveClick(variationPath)}
                        title={`Variation move: ${display}`}
                    >
                        {display}
                    </span>
                    {move.variations && renderVariations(move.variations, 
                        parentMoveIndex + moveIndex + 1)}
                    {moveIndex < moves.length - 1 ? ' ' : ''}
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
                    className={`move-item ${isCurrentMove(i) ? 'current' : ''}`}
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
                        {renderVariations(move.variations, i)}
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
                            className={`move-item start ${currentMoveIndex === -1 && currentVariationPath.length === 0 ? 'current' : ''}`}
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