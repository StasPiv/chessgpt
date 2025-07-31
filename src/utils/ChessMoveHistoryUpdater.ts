
import { ChessMove } from '../types';
import { promoteVariationLink } from './PromoteVariationLink';

/**
 * Результат добавления хода в историю
 */
interface AddMoveResult {
    updatedCurrentMove: ChessMove;
    updatedHistory: ChessMove[];
}

/**
 * Результат добавления вариации в историю
 */
interface AddVariationResult {
    updatedHistory: ChessMove[];
}

/**
 * Результат продвижения вариации
 */
interface PromoteVariationResult {
    updatedHistory: ChessMove[];
}

/**
 * Добавляет новый ход к текущему ходу и обновляет историю ходов
 */
export function addMoveToHistory(
    newMove: ChessMove,
    currentMove: ChessMove | null,
    history: ChessMove[]
): AddMoveResult {
    function isInMainLine(move: ChessMove, history: ChessMove[]): boolean {
        return history.some(historyMove => historyMove.globalIndex === move.globalIndex);
    }

    function addMoveToCorrectLocation(
        history: ChessMove[],
        currentMove: ChessMove | null,
        newMove: ChessMove
    ): ChessMove[] {
        if (!currentMove) {
            return [newMove];
        }

        if (isInMainLine(currentMove, history)) {
            return [...history, newMove];
        }

        function updateInHistory(moves: ChessMove[]): ChessMove[] {
            if (!currentMove) {
                console.warn('addMoveToHistory: currentMove is null in updateInHistory');
                return moves;
            }

            return moves.map(move => {
                if (move.globalIndex === currentMove.globalIndex) {
                    return {
                        ...move,
                        next: newMove
                    };
                }

                if (move.variations && move.variations.length > 0) {
                    return {
                        ...move,
                        variations: move.variations.map(variation => {
                            const containsCurrentMove = variation.some(varMove =>
                                varMove.globalIndex === currentMove.globalIndex
                            );

                            if (containsCurrentMove) {
                                return [...variation, newMove];
                            }

                            return updateInHistory(variation);
                        })
                    };
                }

                return move;
            });
        }

        return updateInHistory(history);
    }

    function updatePreviousMoveNext(
        history: ChessMove[],
        currentMove: ChessMove | null,
        newMove: ChessMove
    ): ChessMove[] {
        if (!currentMove) return history;

        function updateInHistory(moves: ChessMove[]): ChessMove[] {
            if (!currentMove) {
                console.warn('addMoveToHistory: currentMove is null in updatePreviousMoveNext');
                return moves;
            }

            return moves.map(move => {
                if (move.globalIndex === currentMove.globalIndex) {
                    return {
                        ...move,
                        next: newMove
                    };
                }

                if (move.variations && move.variations.length > 0) {
                    return {
                        ...move,
                        variations: move.variations.map(variation => updateInHistory(variation))
                    };
                }

                return move;
            });
        }

        return updateInHistory(history);
    }

    const newHistory = addMoveToCorrectLocation(history, currentMove, newMove);
    const updatedHistory = updatePreviousMoveNext(newHistory, currentMove, newMove);

    return {
        updatedCurrentMove: newMove,
        updatedHistory: updatedHistory
    };
}

/**
 * Добавляет новый ход как вариацию к следующему ходу после текущего
 */
export function addVariationToHistory(
    newMove: ChessMove,
    currentMove: ChessMove,
    history: ChessMove[]
): AddVariationResult {
    if (!currentMove.next) {
        console.warn('addVariationToHistory: currentMove has no next move');
        return { updatedHistory: history };
    }

    const targetGlobalIndex = currentMove.next.globalIndex;

    function updateInHistory(moves: ChessMove[]): ChessMove[] {
        return moves.map(move => {
            // Если это ход, к которому добавляем вариацию
            if (move.globalIndex === targetGlobalIndex) {
                const existingVariations = move.variations || [];
                return {
                    ...move,
                    variations: [...existingVariations, [newMove]]
                };
            }

            // Рекурсивно обрабатываем вариации
            if (move.variations && move.variations.length > 0) {
                return {
                    ...move,
                    variations: move.variations.map(variation => updateInHistory(variation))
                };
            }

            return move;
        });
    }

    const updatedHistory = updateInHistory(history);

    return {
        updatedHistory: updatedHistory
    };
}

/**
 * Продвигает вариацию в основную линию, используя алгоритм из promoteVariationLink
 */
export function promoteVariation(
    currentMove: ChessMove,
    history: ChessMove[]
): PromoteVariationResult {
    // Используем протестированную функцию promoteVariationLink
    // Без ссылок next/previous, так как они управляются отдельно в приложении
    const updatedHistory = promoteVariationLink(currentMove, history, true);

    return {
        updatedHistory: updatedHistory as ChessMove[]
    };
}