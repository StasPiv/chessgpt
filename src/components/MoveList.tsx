import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction } from '../redux/actions.js';
import {ChessMove, RootState} from '../types';
import './MoveList.css';
import GameHeader from "./GameHeader";

const MoveList = (): ReactElement => {
    const dispatch = useDispatch();
    const history = useSelector((state: RootState) => state.chess.history);
    const currentMoveIndex = useSelector((state: RootState) => state.chess.currentMoveIndex);

    const handleMoveClick = (move: ChessMove, variationPath?: any[]): void => {
        dispatch(gotoMoveAction({
            moveIndex: move.globalIndex,
            fen: move.fen,
            variationPath: variationPath
        }));
    };

    const isCurrentMove = (globalIndex: number, variationPath?: any[]): boolean => {
        return globalIndex === currentMoveIndex;
    };

    const getVariationLevelClass = (level: number): string => {
        if (level === 0) return '';
        return `variation-level-${Math.min(level, 4)}`;
    };

    const getVariationIndentClass = (level: number): string => {
        if (level === 0) return '';
        return `variation-indent-${Math.min(level, 4)}`;
    };

    const renderRecursiveHistory = (moves: ChessMove[], parentPath: any[] = [], level: number = 0): ReactElement[] => {
        const result: ReactElement[] = [];

        if (!moves || !Array.isArray(moves) || moves.length === 0) {
            return result;
        }

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];

            if (!move || !move.san || move.globalIndex === undefined) {
                continue;
            }

            const currentPath = [...parentPath, i];
            const ply = move.ply || (i + 1);
            const moveNumber = Math.ceil(ply / 2);
            const isWhiteMove = ply % 2 === 1;

            let display = '';

            // Форматирование хода
            if (level > 0 && i === 0) {
                if (isWhiteMove) {
                    display = `${moveNumber}.${move.san}`;
                } else {
                    display = `${moveNumber}...${move.san}`;
                }
            } else {
                if (isWhiteMove) {
                    display = `${moveNumber}.${move.san}`;
                } else {
                    display = move.san;
                }
            }

            const moveClasses = [
                'move-item',
                isCurrentMove(move.globalIndex, currentPath) ? 'current' : '',
                level > 0 ? 'variation-move' : '',
                getVariationLevelClass(level)
            ].filter(Boolean).join(' ');

            // Основной ход
            result.push(
                <span
                    key={`${level}-${i}-${move.globalIndex}`}
                    className={moveClasses}
                    onClick={() => handleMoveClick(move, currentPath)}
                    title={`Move ${moveNumber}: ${display} (Global Index: ${move.globalIndex})`}
                >
                    {display}
                </span>
            );

            // Добавляем пробел после хода
            if (i < moves.length - 1 || (move.variations && move.variations.length > 0)) {
                result.push(
                    <span key={`space-${level}-${i}`} className="move-space"> </span>
                );
            }

            // Обработка вариантов
            if (move.variations && Array.isArray(move.variations) && move.variations.length > 0) {
                for (let varIndex = 0; varIndex < move.variations.length; varIndex++) {
                    const variation = move.variations[varIndex];

                    if (!variation) {
                        continue;
                    }

                    // Открывающая скобка
                    result.push(
                        <span
                            key={`var-open-${level}-${i}-${varIndex}`}
                            className="variation-bracket variation-bracket-open"
                        >
                            (
                        </span>
                    );

                    // Рекурсивно рендерим варианты
                    const variationPath = [...currentPath, { variation: varIndex }];
                    let variationMoves: any[] = [];

                    if (variation.moves && Array.isArray(variation.moves)) {
                        variationMoves = variation.moves;
                    } else if (Array.isArray(variation)) {
                        variationMoves = variation;
                    } else if (variation.history && Array.isArray(variation.history)) {
                        variationMoves = variation.history;
                    }

                    const renderedVariation = renderRecursiveHistory(variationMoves, variationPath, level + 1);
                    result.push(...renderedVariation);

                    // Закрывающая скобка
                    result.push(
                        <span
                            key={`var-close-${level}-${i}-${varIndex}`}
                            className="variation-bracket variation-bracket-close"
                        >
                            )
                        </span>
                    );
                }
            }
        }

        return result;
    };

    const renderMovesList = (): ReactElement[] => {
        if (!history || !Array.isArray(history) || history.length === 0) {
            return [];
        }

        return renderRecursiveHistory(history);
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