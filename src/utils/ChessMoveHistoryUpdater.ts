import { ChessMove } from '../types';
import { promoteVariationLink } from './PromoteVariationLink';
import { deleteVariation as deleteVariationUtil } from './DeleteVariation';
import { deleteRemaining as deleteRemainingUtil } from './DeleteRemaining';
import { linkAllMovesRecursively } from './ChessHistoryUtils';

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
 * Результат удаления вариации
 */
interface DeleteVariationResult {
    updatedHistory: ChessMove[];
    newCurrentMove: ChessMove | null;
}

/**
 * Результат удаления оставшихся ходов
 */
interface DeleteRemainingResult {
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

    // Связываем все ходы рекурсивно после добавления нового хода
    linkAllMovesRecursively(updatedHistory);

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

    // Связываем все ходы рекурсивно после добавления вариации
    linkAllMovesRecursively(updatedHistory);

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
    const updatedHistory = promoteVariationLink(currentMove, history, true);

    return {
        updatedHistory: updatedHistory as ChessMove[]
    };
}

/**
 * Удаляет вариацию, содержащую указанный ход
 */
export function deleteVariation(
    currentMove: ChessMove,
    history: ChessMove[]
): DeleteVariationResult {
    // Используем протестированную функцию deleteVariation
    const result = deleteVariationUtil(currentMove, history, true);

    return {
        updatedHistory: result.updatedHistory as ChessMove[],
        newCurrentMove: result.newCurrentMove as ChessMove | null
    };
}

/**
 * Удаляет все ходы после текущего в той линии, в которой он находится
 */
export function deleteRemaining(
    currentMove: ChessMove,
    history: ChessMove[]
): DeleteRemainingResult {
    // Используем функцию deleteRemaining
    const updatedHistory = deleteRemainingUtil(currentMove, history);

    return {
        updatedHistory: updatedHistory
    };
}