import React, { ReactElement, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction, loadPGNAction } from '../redux/actions.js';
import {ChessMove, RootState} from '../types';
import './MoveList.css';
import GameHeader from "./GameHeader";

const MoveList = (): ReactElement => {
    const dispatch = useDispatch();
    const history = useSelector((state: RootState) => state.chess.history);
    const currentMoveIndex = useSelector((state: RootState) => state.chess.currentMoveIndex);

    // Ref for long press timeout
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMoveClick = (move: ChessMove, variationPath?: any[]): void => {
        dispatch(gotoMoveAction({
            moveIndex: move.globalIndex,
            fen: move.fen,
            variationPath: variationPath
        }));
    };

    // Long press handlers
    const handleTouchStart = useCallback((event: React.TouchEvent) => {
        longPressTimeoutRef.current = setTimeout(() => {
            handleLongPress();
        }, 600); // 600ms for long press
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    }, []);

    const handleTouchMove = useCallback(() => {
        // Cancel long press if user moves finger
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    }, []);

    // PGN loading function - same logic as in LoadPgn component
    const loadPgnFromText = useCallback((pgnText: string) => {
        if (!pgnText.trim()) {
            console.log('PGN text is empty');
            return;
        }

        try {
            console.log('Loading PGN from clipboard...');

            // Use the same Redux action as LoadPgn component
            dispatch(loadPGNAction(pgnText));

            console.log('PGN loaded successfully');

        } catch (error) {
            console.error('Error loading PGN:', error);
        }
    }, [dispatch]);

    // Long press handler - paste PGN from clipboard
    const handleLongPress = useCallback(async () => {
        try {
            // Check if clipboard API is available
            if (!navigator.clipboard) {
                console.warn('Clipboard API not available');
                return;
            }

            // Read text from clipboard
            const clipboardText = await navigator.clipboard.readText();

            if (!clipboardText || !clipboardText.trim()) {
                console.log('Clipboard is empty');
                return;
            }

            console.log('Clipboard content received, processing...');

            // Load PGN using the same function logic as LoadPgn component
            loadPgnFromText(clipboardText);

        } catch (error) {
            console.error('Failed to read clipboard:', error);

            // Handle different types of errors
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    console.error('Clipboard access denied');
                } else if (error.name === 'SecurityError') {
                    console.error('Clipboard access blocked (HTTPS required)');
                } else {
                    console.error('Clipboard read error:', error.message);
                }
            }
        }
    }, [loadPgnFromText]);

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
            let needsMoveNumberAfterVariation = false;

            // Проверяем, нужен ли номер хода после вариантов
            if (i > 0) {
                const prevMove = moves[i - 1];
                if (prevMove && prevMove.variations && prevMove.variations.length > 0 && !isWhiteMove) {
                    needsMoveNumberAfterVariation = true;
                }
            }

            // Форматирование хода
            if (level > 0 && i === 0) {
                if (isWhiteMove) {
                    display = `${moveNumber}.${move.san}`;
                } else {
                    display = `${moveNumber}...${move.san}`;
                }
            } else if (needsMoveNumberAfterVariation) {
                // Включаем номер хода в сам элемент хода
                display = `${moveNumber}...${move.san}`;
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
                    key={`move-${move.globalIndex}`}
                    className={moveClasses}
                    onClick={() => handleMoveClick(move, currentPath)}
                    title={`Move ${moveNumber}: ${display} (Global Index: ${move.globalIndex})`}
                >
                    {display}
                </span>
            );

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
                            key={`var-open-${move.globalIndex}-${varIndex}`}
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
                            key={`var-close-${move.globalIndex}-${varIndex}`}
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
            <div
                className="moves-container"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
            >
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