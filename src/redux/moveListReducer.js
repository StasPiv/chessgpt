import { Chess } from 'cm-chess';
import { ADD_MOVE, GOTO_MOVE } from './actions.js';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    currentMoveIndex: -1,
    currentMove: null, // Добавляем объект текущего хода
    currentVariationPath: [],
    pgnHeaders: {},
    maxGlobalIndex: -1 // Добавляем максимальный глобальный индекс
};

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
        const newGame = new Chess(state.fen);
        const move = newGame.move(action.payload);

        if (move === null) {
            console.log('Invalid move in reducer:', action.payload);
            return state;
        }

        // Определяем индекс нового хода согласно новой логике
        let newMoveIndex;
        if (state.currentMove && state.currentMove.next !== undefined) {
            // Если у текущего хода есть следующий ход
            newMoveIndex = state.maxGlobalIndex + 1000;
        } else {
            // Если следующего хода нет
            newMoveIndex = state.currentMove ? state.currentMove.globalIndex + 1 : 0;
        }

        // Определяем ply для нового хода
        const newPly = state.currentMove ? state.currentMove.ply + 1 : 1;

        // Создаем новый объект хода с globalIndex и ply
        const newMove = {
            ...move,
            globalIndex: newMoveIndex,
            ply: newPly
        };

        // Обновляем максимальный глобальный индекс
        const newMaxGlobalIndex = Math.max(state.maxGlobalIndex, newMoveIndex);

        // If we're at the end of history, just add the move
        if (state.currentMoveIndex === state.history.length - 1) {
            const newHistory = [...state.history, newMove];

            return {
                ...state,
                game: newGame,
                fen: newGame.fen(),
                history: newHistory,
                currentMoveIndex: newMoveIndex,
                currentMove: newMove,
                maxGlobalIndex: newMaxGlobalIndex
            };
        } else {
            // If we're in the middle of history, truncate and add new move
            const truncatedHistory = state.history.slice(0, state.currentMoveIndex + 1);
            const newHistory = [...truncatedHistory, newMove];

            return {
                ...state,
                game: newGame,
                fen: newGame.fen(),
                history: newHistory,
                currentMoveIndex: newMoveIndex,
                currentMove: newMove,
                maxGlobalIndex: newMaxGlobalIndex
            };
        }
    } catch (error) {
        console.error('Error adding move:', error);
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
            newGame.load(START_POSITION);

            return {
                ...state,
                game: newGame,
                fen: START_POSITION,
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
        case GOTO_MOVE:
            return handleGotoMove(state, action);
        default:
            return state;
    }
}