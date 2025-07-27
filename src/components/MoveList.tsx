import React, { ReactElement, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction, loadPGNAction } from '../redux/actions.js';
import {ChessMove, RootState} from '../types';
import './MoveList.scss';
import GameHeader from "./GameHeader";

const MoveList = (): ReactElement => {
    const dispatch = useDispatch();
    const history = useSelector((state: RootState) => state.chess.history);
    const currentMoveIndex = useSelector((state: RootState) => state.chess.currentMoveIndex);
    const isMobile = useSelector((state: RootState) => state.ui.isMobile);
    
    // Ref для отслеживания долгого нажатия
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef<boolean>(false);

    const handleMoveClick = (move: ChessMove, variationPath?: any[]): void => {
        dispatch(gotoMoveAction({
            moveIndex: move.globalIndex,
            fen: move.fen,
            variationPath: variationPath
        }));
    };

    // PGN loading function - same logic as in LoadPgn component
    const loadPgnFromText = useCallback((pgnText: string) => {
        if (!pgnText.trim()) {
            console.log('PGN text is empty');
            return;
        }

        try {
            console.log('Loading PGN from clipboard...');
            dispatch(loadPGNAction(pgnText));
            console.log('PGN loaded successfully');
        } catch (error) {
            console.error('Error loading PGN:', error);
        }
    }, [dispatch]);

    // Right-click handler - paste PGN from clipboard (desktop feature)
    const handleContextMenu = useCallback(async (event: React.MouseEvent) => {
        event.preventDefault();
        
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
            loadPgnFromText(clipboardText);

        } catch (error) {
            console.error('Failed to read clipboard:', error);

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

    // Обработчик начала касания для мобильных устройств
    const handleTouchStart = useCallback((event: React.TouchEvent) => {
        if (!isMobile) return;
        
        isLongPress.current = false;
        
        // Запускаем таймер для определения долгого нажатия
        longPressTimer.current = setTimeout(async () => {
            isLongPress.current = true;
            
            // Виброотклик для подтверждения долгого нажатия
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
            
            // Выполняем ту же логику, что и в handleContextMenu
            try {
                if (!navigator.clipboard) {
                    console.warn('Clipboard API not available');
                    return;
                }

                const clipboardText = await navigator.clipboard.readText();

                if (!clipboardText || !clipboardText.trim()) {
                    console.log('Clipboard is empty');
                    return;
                }

                console.log('Clipboard content received, processing...');
                loadPgnFromText(clipboardText);

            } catch (error) {
                console.error('Failed to read clipboard:', error);
            }
        }, 800); // 800ms для долгого нажатия
    }, [isMobile, loadPgnFromText]);

    // Обработчик окончания касания
    const handleTouchEnd = useCallback((event: React.TouchEvent) => {
        if (!isMobile) return;
        
        // Отменяем таймер если касание закончилось раньше
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        // Предотвращаем обычный клик если было долгое нажатие
        if (isLongPress.current) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, [isMobile]);

    // Обработчик отмены касания (например, при скролле)
    const handleTouchCancel = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        isLongPress.current = false;
    }, []);

    const isCurrentMove = (globalIndex: number, variationPath?: any[]): boolean => {
        return globalIndex === currentMoveIndex;
    };

    const getVariationLevelClass = (level: number): string => {
        if (level === 0) return '';
        return `variation-level-${Math.min(level, 4)}`;
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
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
            >
                {!history || history.length === 0 ? (
                    <div className="no-moves">
                        {isMobile ? 'No moves yet (Long press to load PGN)' : 'No moves yet (Right-click to load PGN)'}
                    </div>
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