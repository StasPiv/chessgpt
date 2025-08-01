import React, { ReactElement, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction, loadPGNAction } from '../redux/actions.js';
import {ChessMove, RootState} from '../types';
import {
    processMoveHierarchy,
    getMoveClasses,
    getBracketClasses,
    isProcessedMove,
    isBracketItem,
    ProcessedMove
} from '../utils/ChessMoveProcessing';
import './MoveList.scss';
import GameHeader from "./GameHeader";
import GameEditorPanel from "./GameEditorPanel";

const MoveList = (): ReactElement => {
    const dispatch = useDispatch();
    const history = useSelector((state: RootState) => state.chess.history);
    const currentMoveIndex = useSelector((state: RootState) => state.chess.currentMoveIndex);
    const isMobile = useSelector((state: RootState) => state.ui.isMobile);
    const pgnHeaders = useSelector((state: RootState) => state.chess.pgnHeaders);

    // Ref для отслеживания долгого нажатия
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef<boolean>(false);

    // Ref для контейнера со списком ходов
    const movesContainerRef = useRef<HTMLDivElement>(null);

    const handleMoveClick = (processedMove: ProcessedMove): void => {
        if (processedMove.originalMove) {
            dispatch(gotoMoveAction({
                moveIndex: processedMove.globalIndex,
                fen: processedMove.originalMove.fen,
                variationPath: processedMove.path
            }));
        }
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

    // Эффект для автоматической прокрутки к активному ходу
    useEffect(() => {
        if (currentMoveIndex !== null && currentMoveIndex !== undefined && movesContainerRef.current) {
            // Находим элемент активного хода
            const activeElement = movesContainerRef.current.querySelector('.move-item.current');

            if (activeElement) {
                // Прокручиваем к активному элементу
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }
    }, [currentMoveIndex]);

    const renderMovesList = (): ReactElement[] => {
        if (!history || !Array.isArray(history) || history.length === 0) {
            return [];
        }

        const processedItems = processMoveHierarchy(history, currentMoveIndex);

        return processedItems.map((item, index) => {
            if (isProcessedMove(item)) {
                const moveNumber = Math.ceil((item.ply || 1) / 2);

                return (
                    <span
                        key={`move-${item.globalIndex}-${index}`}
                        className={getMoveClasses(item)}
                        onClick={() => handleMoveClick(item)}
                        title={`Move ${moveNumber}: ${item.display} (Global Index: ${item.globalIndex})`}
                    >
                        {item.display}
                    </span>
                );
            } else if (isBracketItem(item)) {
                return (
                    <span
                        key={`bracket-${item.bracketType}-${item.parentMoveIndex}-${item.variationIndex}-${index}`}
                        className={getBracketClasses(item)}
                    >
                        {item.bracketType === 'open' ? '(' : ')'}
                    </span>
                );
            }

            return null;
        }).filter(Boolean) as ReactElement[];
    };

    // Проверяем есть ли заголовки игры для отображения
    const hasGameHeaders = pgnHeaders && Object.keys(pgnHeaders).length > 0;

    return (
        <div className="move-list-container">
            {/* ФИКСИРОВАННЫЙ ЗАГОЛОВОК - НЕ СКРОЛЛИТСЯ */}
            {hasGameHeaders && (
                <div className="fixed-game-header">
                    <GameHeader />
                </div>
            )}

            {/* СКРОЛЛИРУЕМЫЙ КОНТЕЙНЕР С ХОДАМИ */}
            <div
                ref={movesContainerRef}
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
                        {renderMovesList()}
                    </div>
                )}
            </div>

            {/* ФИКСИРОВАННАЯ ПАНЕЛЬ РЕДАКТОРА - НЕ СКРОЛЛИТСЯ */}
            <GameEditorPanel />
        </div>
    );
};

export default MoveList;