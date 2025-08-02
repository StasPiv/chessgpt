import { Chess } from 'cm-chess';
import { 
    GOTO_FIRST, 
    GOTO_LAST, 
    GOTO_PREVIOUS, 
    GOTO_NEXT 
} from './actions.js';

const DEFAULT_START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    game: new Chess(),
    fen: DEFAULT_START_POSITION,
    history: [],
    currentMoveIndex: -1,
    currentMove: null, // Добавляем объект текущего хода
    currentGlobalIndex: -1,
    pgnHeaders: {}
};

// Function to get the starting position from PGN headers or default
function getStartPosition(pgnHeaders) {
    return pgnHeaders.FEN || DEFAULT_START_POSITION;
}

// Function to find FEN by global index
function findFenByGlobalIndex(history, globalIndex, startPosition) {
    if (globalIndex === -1) {
        return startPosition;
    }
    
    function searchInHistory(moves) {
        for (const move of moves) {
            if (move.globalIndex === globalIndex) {
                return move.fen;
            }
            
            // Search in variations
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    const fenInVariation = searchInHistory(variation);
                    if (fenInVariation) {
                        return fenInVariation;
                    }
                }
            }
        }
        return null;
    }
    
    return searchInHistory(history) || startPosition;
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

// Handler for going to first move
function handleGotoFirst(state) {
    try {
        const startPosition = getStartPosition(state.pgnHeaders);
        
        return {
            ...state,
            fen: startPosition,
            currentMoveIndex: -1,
            currentMove: null,
        };
    } catch (error) {
        console.error('Error in GOTO_FIRST:', error);
        return state;
    }
}

// Handler for going to last move
function handleGotoLast(state) {
    try {
        if (state.history.length === 0) {
            return state;
        }
        
        // Find the last move in main line (globalIndex < 1000)
        let lastGlobalIndex = -1;

        for (const move of state.history) {
            if (move.globalIndex < 1000) {
                if (move.globalIndex > lastGlobalIndex) {
                    lastGlobalIndex = move.globalIndex;
                }
            }
        }

        const startPosition = getStartPosition(state.pgnHeaders);
        const fen = findFenByGlobalIndex(state.history, lastGlobalIndex, startPosition);
        const currentMove = findMoveByGlobalIndex(state.history, lastGlobalIndex);

        return {
            ...state,
            fen: fen,
            currentMoveIndex: lastGlobalIndex,
            currentMove: currentMove,
        };
    } catch (error) {
        console.error('Error in GOTO_LAST:', error);
        return state;
    }
}

// Handler for going to previous move
function handleGotoPrevious(state) {
    try {
        // Если текущий ход null (мы в начальной позиции), остаемся там
        if (!state.currentMove) {
            return state;
        }

        // Берем предыдущий ход из свойства previous
        const previousMove = state.currentMove.previous;
        
        if (previousMove) {
            // Есть предыдущий ход - переходим к нему
            return {
                ...state,
                fen: previousMove.fen,
                currentMoveIndex: previousMove.globalIndex,
                currentMove: previousMove,
            };
        } else {
            // Нет предыдущего хода - переходим к начальной позиции
            const startPosition = getStartPosition(state.pgnHeaders);
            return {
                ...state,
                fen: startPosition,
                currentMoveIndex: -1,
                currentMove: null,
            };
        }
    } catch (error) {
        console.error('Error in GOTO_PREVIOUS:', error);
        return state;
    }
}

// Handler for going to next move
function handleGotoNext(state) {
    try {
        // Если мы в начальной позиции, берем первый ход из основной линии
        if (!state.currentMove) {
            if (state.history.length > 0) {
                const firstMove = state.history[0];
                return {
                    ...state,
                    fen: firstMove.fen,
                    currentMoveIndex: firstMove.globalIndex,
                    currentMove: firstMove,
                };
            }
            return state;
        }

        // Берем следующий ход из свойства next
        const nextMove = state.currentMove.next;
        
        if (nextMove) {
            // Есть следующий ход - переходим к нему
            return {
                ...state,
                fen: nextMove.fen,
                currentMoveIndex: nextMove.globalIndex,
                currentMove: nextMove,
            };
        } else {
            // Нет следующего хода - остаемся на текущем
            return state;
        }
    } catch (error) {
        console.error('Error in GOTO_NEXT:', error);
        return state;
    }
}

export function navigationReducer(state = initialState, action) {
    switch (action.type) {
        case GOTO_FIRST:
            return handleGotoFirst(state);
        case GOTO_LAST:
            return handleGotoLast(state);
        case GOTO_PREVIOUS:
            return handleGotoPrevious(state);
        case GOTO_NEXT:
            return handleGotoNext(state);
        default:
            return state;
    }
}