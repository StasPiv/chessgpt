import { Chess } from 'cm-chess';
import { 
    GOTO_FIRST, 
    GOTO_LAST, 
    GOTO_PREVIOUS, 
    GOTO_NEXT 
} from './actions.js';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    currentMoveIndex: -1,
    currentGlobalIndex: -1,
    pgnHeaders: {}
};

// Function to find FEN by global index
function findFenByGlobalIndex(history, globalIndex) {
    if (globalIndex === -1) {
        return START_POSITION;
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
    
    return searchInHistory(history) || START_POSITION;
}

// Handler for going to first move
function handleGotoFirst(state) {
    try {
        return {
            ...state,
            fen: START_POSITION,
            currentMoveIndex: -1,
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

        const fen = findFenByGlobalIndex(state.history, lastGlobalIndex);

        return {
            ...state,
            fen: fen,
            currentMoveIndex: lastGlobalIndex,
        };
    } catch (error) {
        console.error('Error in GOTO_LAST:', error);
        return state;
    }
}

// Handler for going to previous move
function handleGotoPrevious(state) {
    try {
        const prevMoveIndex = Math.max(-1, state.currentMoveIndex - 1);
        const fen = findFenByGlobalIndex(state.history, prevMoveIndex);
        
        return {
            ...state,
            fen: fen,
            currentMoveIndex: prevMoveIndex,
        };
    } catch (error) {
        console.error('Error in GOTO_PREVIOUS:', error);
        return state;
    }
}

// Handler for going to next move
function handleGotoNext(state) {
    try {
        const nextMoveIndex = state.currentMoveIndex + 1;
        const fen = findFenByGlobalIndex(state.history, nextMoveIndex);
        
        return {
            ...state,
            fen: fen,
            currentMoveIndex: nextMoveIndex,
        };
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