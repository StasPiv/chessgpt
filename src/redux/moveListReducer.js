import { Chess } from 'cm-chess';
import { ADD_MOVE, ADD_VARIATION, GOTO_MOVE } from './actions.js';

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

        // Функция для обновления ссылки next в предыдущем ходе
        function updatePreviousMoveNext(history, currentMove, newMove) {
            if (!currentMove) return history;

            function updateInHistory(moves) {
                return moves.map(move => {
                    if (move.globalIndex === currentMove.globalIndex) {
                        return {
                            ...move,
                            next: newMove
                        };
                    }
                    
                    // Обновляем в вариациях
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

        // If we're at the end of history, just add the move
        if (state.currentMoveIndex === state.history.length - 1) {
            const newHistory = [...state.history, newMove];
            const updatedHistory = updatePreviousMoveNext(newHistory, state.currentMove, newMove);
            
            return {
                ...state,
                game: newGame,
                fen: newGame.fen(),
                history: updatedHistory,
                currentMoveIndex: newMoveIndex,
                currentMove: newMove
            };
        } else {
            // If we're in the middle of history, truncate and add new move
            const truncatedHistory = state.history.slice(0, state.currentMoveIndex + 1);
            const newHistory = [...truncatedHistory, newMove];
            const updatedHistory = updatePreviousMoveNext(newHistory, state.currentMove, newMove);
            
            return {
                ...state,
                game: newGame,
                fen: newGame.fen(),
                history: updatedHistory,
                currentMoveIndex: newMoveIndex,
                currentMove: newMove
            };
        }
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

        // Функция для добавления хода в variations следующего хода
        function addMoveToVariations(history, currentMove, newMove) {
            function updateInHistory(moves) {
                return moves.map(move => {
                    if (move.globalIndex === currentMove.next.globalIndex) {
                        // Инициализируем variations если не существует
                        const variations = move.variations || [];
                        return {
                            ...move,
                            variations: [...variations, [newMove]]
                        };
                    }
                    
                    // Обновляем в вариациях
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

        const updatedHistory = addMoveToVariations(state.history, state.currentMove, newMove);
        
        return {
            ...state,
            history: updatedHistory,
            maxGlobalIndex: newMaxGlobalIndex,
            currentMove: newMove,
            currentMoveIndex: newMove.globalIndex,
        };
    } catch (error) {
        console.error('Error adding variation:', error);
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
        case ADD_VARIATION:
            return handleAddVariation(state, action);
        case GOTO_MOVE:
            return handleGotoMove(state, action);
        default:
            return state;
    }
}