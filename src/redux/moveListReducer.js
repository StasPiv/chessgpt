import { Chess } from 'cm-chess';
import { ADD_MOVE, ADD_VARIATION, PROMOTE_VARIATION, DELETE_VARIATION, DELETE_REMAINING, GOTO_MOVE } from './actions.js';
import { addMoveToHistory, addVariationToHistory, promoteVariation, deleteVariation, deleteRemaining } from '../utils/ChessMoveHistoryUpdater.ts';

const DEFAULT_START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    game: new Chess(),
    fen: DEFAULT_START_POSITION,
    history: [],
    currentMoveIndex: -1,
    currentMove: null, // Добавляем объект текущего хода
    currentVariationPath: [],
    pgnHeaders: {},
    maxGlobalIndex: -1 // Добавляем максимальный глобальный индекс
};

// Function to get the starting position from PGN headers or default
function getStartPosition(pgnHeaders) {
    return pgnHeaders.FEN || DEFAULT_START_POSITION;
}

// Function to find move object by global index
function findMoveByGlobalIndex(history, globalIndex) {
    if (globalIndex === -1) {
        return null;
    }

    function searchInHistory(moves) {
        for (const move of moves) {
            if (move.globalIndex === globalIndex) {
                return move;
            }

            // Search in variations
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    const moveInVariation = searchInHistory(variation);
                    if (moveInVariation) {
                        return moveInVariation;
                    }
                }
            }
        }
        return null;
    }

    return searchInHistory(history);
}

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

        // Обновляем состояние с новым текущим ходом
        // Нужно будет пересчитать FEN для новой позиции
        const newGame = new Chess();
        const startPosition = getStartPosition(state.pgnHeaders);
        newGame.load(startPosition);

        // Воспроизводим ходы до нового текущего хода
        // Здесь нужна логика для построения пути к новому текущему ходу
        // Пока используем FEN из нового текущего хода, если он есть
        const newFen = newCurrentMove.after || startPosition;
        newGame.load(newFen);

        return {
            ...state,
            game: newGame,
            fen: newFen,
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

// Goto move handler
function handleGotoMove(state, action) {
    try {
        const { moveIndex, variationPath, fen } = action.payload;

        // If going to position before first move
        if (moveIndex === -1) {
            const newGame = new Chess();
            const startPosition = getStartPosition(state.pgnHeaders);
            newGame.load(startPosition);

            return {
                ...state,
                game: newGame,
                fen: startPosition,
                currentMoveIndex: -1,
                currentMove: null
            };
        }

        // Находим объект хода по глобальному индексу
        const currentMove = findMoveByGlobalIndex(state.history, moveIndex);

        return {
            ...state,
            fen: fen,
            currentMoveIndex: moveIndex,
            currentMove: currentMove,
            currentVariationPath: variationPath,
        };
    } catch (error) {
        console.error('Error in goto move:', error);
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
        case GOTO_MOVE:
            return handleGotoMove(state, action);
        default:
            return state;
    }
}