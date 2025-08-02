import { ChessMove } from '../types';
import { promoteVariationLink } from './PromoteVariationLink';
import { deleteVariation as deleteVariationUtil } from './DeleteVariation';
import { deleteRemaining as deleteRemainingUtil } from './DeleteRemaining';
import { addMoveToHistory as addMoveToHistoryUtil } from './AddMoveToHistory';
import { addVariationToHistory as addVariationToHistoryUtil } from './AddVariationToHistory';

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
    // Используем утилиту addMoveToHistory
    const result = addMoveToHistoryUtil(newMove, currentMove, history);

    return {
        updatedCurrentMove: result.updatedCurrentMove as ChessMove,
        updatedHistory: result.updatedHistory as ChessMove[]
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
    // Используем утилиту addVariationToHistory
    const result = addVariationToHistoryUtil(newMove, currentMove, history);

    return {
        updatedHistory: result.updatedHistory as ChessMove[]
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