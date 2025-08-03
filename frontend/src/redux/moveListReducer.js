import { Chess } from 'cm-chess';
import { ADD_MOVE, ADD_VARIATION, PROMOTE_VARIATION, DELETE_VARIATION, DELETE_REMAINING } from './actions.js';
import { addMoveToHistory, addVariationToHistory, promoteVariation, deleteVariation, deleteRemaining } from '../utils/ChessMoveHistoryUpdater.ts';
import { 
    getStartPosition, 
    findMoveByGlobalIndex,
    getDefaultStartPosition
} from '../utils/ChessReducerUtils.js';

const initialState = {
    game: new Chess(),
    fen: getDefaultStartPosition(),
    history: [],
    currentMoveIndex: -1,
    currentMove: null, // Добавляем объект текущего хода
    currentVariationPath: [],
    pgnHeaders: {},
    maxGlobalIndex: -1 // Добавляем максимальный глобальный индекс
};

// Add move handler
function handleAddMove(state, action) {
    try {
        // if we're not at the end of the line, do nothing
        if (state.currentMove && state.currentMove.next && state.history.length > 0) {
            return state;
        }

        const newGame = new Chess(state.fen);
        const move = newGame.move(action.payload);

        if (move === null) {
            console.log('Invalid move in reducer:', action.payload);
            return state;
        }

        // Определяем индекс нового хода
        const newMoveIndex = state.currentMove ? state.currentMove.globalIndex + 1 : 0;

        // Определяем ply для нового хода
        const newPly = state.currentMove ? state.currentMove.ply + 1 : 1;

        // Создаем новый объект хода с globalIndex и ply
        const newMove = {
            ...move,
            globalIndex: newMoveIndex,
            ply: newPly
        };

        // Используем утилиту для добавления хода
        const { updatedCurrentMove, updatedHistory } = addMoveToHistory(newMove, state.currentMove, state.history);

        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            history: updatedHistory,
            currentMoveIndex: newMoveIndex,
            currentMove: updatedCurrentMove
        };
    } catch (error) {
        console.error('Error adding move:', error);
        return state;
    }
}

// Add variation handler
function handleAddVariation(state, action) {
    try {
        // Проверяем, что у текущего хода есть следующий ход
        if (!state.currentMove || !state.currentMove.next) {
            console.log('Cannot add variation: no next move available');
            return state;
        }

        const newGame = new Chess(state.fen);
        const move = newGame.move(action.payload);

        if (move === null) {
            console.log('Invalid move in variation:', action.payload);
            return state;
        }

        // Назначаем ходу новый индекс = state.maxGlobalIndex + 1000
        const newGlobalIndex = state.maxGlobalIndex ? state.maxGlobalIndex + 1000 : 1000;
        const newMaxGlobalIndex = newGlobalIndex;

        // Определяем ply для нового хода
        const newPly = state.currentMove ? state.currentMove.ply + 1 : 1;

        // Создаем новый объект хода с globalIndex и ply
        const newMove = {
            ...move,
            globalIndex: newGlobalIndex,
            ply: newPly
        };

        // Используем утилиту для добавления вариации
        const { updatedHistory } = addVariationToHistory(newMove, state.currentMove, state.history);

        return {
            ...state,
            history: updatedHistory,
            maxGlobalIndex: newMaxGlobalIndex,
            currentMove: newMove,
            currentMoveIndex: newMove.globalIndex,
            fen: newGame.fen(),
        };
    } catch (error) {
        console.error('Error adding variation:', error);
        return state;
    }
}

// Promote variation handler
function handlePromoteVariation(state, action) {
    try {
        // Используем утилиту для продвижения вариации
        const { updatedHistory } = promoteVariation(state.currentMove, state.history);

        return {
            ...state,
            history: updatedHistory
        };
    } catch (error) {
        console.error('Error promoting variation:', error);
        return state;
    }
}

// Delete variation handler
function handleDeleteVariation(state, action) {
    try {
        // Проверяем, что у нас есть текущий ход
        if (!state.currentMove) {
            console.log('Cannot delete variation: no current move');
            return state;
        }

        // Используем утилиту для удаления вариации
        const { updatedHistory, newCurrentMove } = deleteVariation(state.currentMove, state.history);

        // Если новый текущий ход равен null, значит был удален ход из основной линии
        // или произошла ошибка - переходим к началу
        if (!newCurrentMove) {
            const newGame = new Chess();
            const startPosition = getStartPosition(state.pgnHeaders);
            newGame.load(startPosition);

            return {
                ...state,
                game: newGame,
                fen: startPosition,
                history: updatedHistory,
                currentMoveIndex: -1,
                currentMove: null
            };
        }

        // Используем FEN из нового текущего хода
        const newFen = newCurrentMove.after || newCurrentMove.fen;

        // Если FEN не найден в ходе, тогда используем стартовую позицию как fallback
        const finalFen = newFen || getStartPosition(state.pgnHeaders);

        // Создаем новую игру с правильной позицией
        const newGame = new Chess();
        newGame.load(finalFen);

        return {
            ...state,
            game: newGame,
            fen: finalFen,
            history: updatedHistory,
            currentMoveIndex: newCurrentMove.globalIndex,
            currentMove: newCurrentMove
        };
    } catch (error) {
        console.error('Error deleting variation:', error);
        return state;
    }
}

// Delete remaining handler
function handleDeleteRemaining(state, action) {
    try {
        // Проверяем, что у нас есть текущий ход
        if (!state.currentMove) {
            console.log('Cannot delete remaining: no current move');
            return state;
        }

        // Используем утилиту для удаления оставшихся ходов
        const { updatedHistory } = deleteRemaining(state.currentMove, state.history);

        // После удаления оставшихся ходов текущий ход остается тем же самым,
        // но нужно обновить его объект в новой истории
        const updatedCurrentMove = findMoveByGlobalIndex(updatedHistory, state.currentMoveIndex);

        return {
            ...state,
            history: updatedHistory,
            currentMove: updatedCurrentMove
        };
    } catch (error) {
        console.error('Error deleting remaining:', error);
        return state;
    }
}

export function moveListReducer(state = initialState, action) {
    switch (action.type) {
        case ADD_MOVE:
            return handleAddMove(state, action);
        case ADD_VARIATION:
            return handleAddVariation(state, action);
        case PROMOTE_VARIATION:
            return handlePromoteVariation(state, action);
        case DELETE_VARIATION:
            return handleDeleteVariation(state, action);
        case DELETE_REMAINING:
            return handleDeleteRemaining(state, action);
        default:
            return state;
    }
}