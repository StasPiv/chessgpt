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
    const currentVariationPath = useSelector((state: RootState) => state.chess.currentVariationPath);

    const handleMoveClick = (moveIndex: number, variationPath?: any[]): void => {
        dispatch(gotoMoveAction({
            moveIndex: moveIndex,
            fen: history[moveIndex]?.fen,
            variationPath: variationPath
        }));
    };

    const isCurrentMove = (moveIndex: number, variationPath?: any[]): boolean => {
        return moveIndex === currentMoveIndex && 
               JSON.stringify(variationPath) === JSON.stringify(currentVariationPath);
    };

    const getVariationLevelClass = (level: number): string => {
        if (level === 0) return '';
        return `variation-level-${Math.min(level, 4)}`;
    };

    const renderVariation = (moves: any[], parentPath: any[] = [], level: number = 0): ReactElement[] => {
        const result: ReactElement[] = [];
        
        // Проверяем, что moves существует и является массивом
        if (!moves || !Array.isArray(moves) || moves.length === 0) {
            return result;
        }
        
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            
            // Проверяем, что move существует и имеет необходимые свойства
            if (!move || !move.san) {
                continue;
            }
            
            const currentPath = [...parentPath, i];
            
            // Используем свойство ply для определения номера хода
            const ply = move.ply || (i + 1);
            const moveNumber = Math.ceil(ply / 2);
            const isWhiteMove = ply % 2 === 1;
            
            let display = '';
            
            // Особая логика для первого хода в варианте
            if (level > 0 && i === 0) {
                if (isWhiteMove) {
                    display = `${moveNumber}.${move.san}`;
                } else {
                    // Если это первый ход черных в варианте, добавляем номер хода с тремя точками
                    display = `${moveNumber}...${move.san}`;
                }
            } else {
                // Обычная логика для основной линии или не первых ходов в варианте
                if (isWhiteMove) {
                    display = `${moveNumber}.${move.san}`;
                } else {
                    display = move.san;
                }
            }
            
            // Формируем классы для стилизации
            const moveClasses = [
                'move-item',
                isCurrentMove(i, currentPath) ? 'current' : '',
                level > 0 ? 'variation-move' : '',
                getVariationLevelClass(level)
            ].filter(Boolean).join(' ');
            
            // Основной ход
            result.push(
                <span 
                    key={`${level}-${i}`} 
                    className={moveClasses}
                    onClick={() => handleMoveClick(i, currentPath)}
                    title={`Move ${moveNumber}: ${display}`}
                    style={{ marginLeft: `${level * 20}px` }}
                >
                    {display}
                </span>
            );
            
            // Проверяем наличие вариантов
            if (move.variations && Array.isArray(move.variations) && move.variations.length > 0) {
                for (let varIndex = 0; varIndex < move.variations.length; varIndex++) {
                    const variation = move.variations[varIndex];
                    
                    // Проверяем, что variation существует
                    if (!variation) {
                        continue;
                    }
                    
                    // Добавляем открывающую скобку для варианта
                    result.push(
                        <span 
                            key={`var-open-${level}-${i}-${varIndex}`} 
                            className="variation-bracket"
                            style={{ marginLeft: `${level * 20}px` }}
                        >
                            (
                        </span>
                    );
                    
                    // Рекурсивно рендерим варианты
                    const variationPath = [...currentPath, { variation: varIndex }];
                    let variationMoves: any[] = [];
                    
                    // Проверяем различные возможные структуры данных вариантов
                    if (variation.moves && Array.isArray(variation.moves)) {
                        variationMoves = variation.moves;
                    } else if (Array.isArray(variation)) {
                        variationMoves = variation;
                    } else if (variation.history && Array.isArray(variation.history)) {
                        variationMoves = variation.history;
                    }
                    
                    const renderedVariation = renderVariation(variationMoves, variationPath, level + 1);
                    result.push(...renderedVariation);
                    
                    // Добавляем закрывающую скобку для варианта
                    result.push(
                        <span 
                            key={`var-close-${level}-${i}-${varIndex}`} 
                            className="variation-bracket"
                            style={{ marginLeft: `${level * 20}px` }}
                        >
                            )
                        </span>
                    );
                }
            }
            
            // Добавляем пробел между ходами
            if (i < moves.length - 1) {
                result.push(
                    <span key={`space-${level}-${i}`} className="move-space"> </span>
                );
            }
        }
        
        return result;
    };

    const renderMovesList = (): ReactElement[] => {
        // Проверяем, что history существует и является массивом
        if (!history || !Array.isArray(history) || history.length === 0) {
            return [];
        }
        
        return renderVariation(history);
    };

    return (
        <div className="move-list-container">
            <div className="moves-container">
                {!history || history.length === 0 ? (
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