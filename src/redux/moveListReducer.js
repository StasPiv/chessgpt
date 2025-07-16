import { Chess } from 'cm-chess';
import { ADD_MOVE, GOTO_MOVE } from './actions.js';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    currentMoveIndex: -1,
    currentVariationPath: [],
    pgnHeaders: {}
};

// Add move handler
function handleAddMove(state, action) {
    try {
        const newGame = new Chess(state.fen);
        const move = newGame.move(action.payload);
        
        if (move === null) {
            console.log('Invalid move in reducer:', action.payload);
            return state;
        }

        // If we're at the end of history, just add the move
        if (state.currentMoveIndex === state.history.length - 1) {
            const newHistory = [...state.history, move];
            
            return {
                ...state,
                game: newGame,
                fen: newGame.fen(),
                history: newHistory,
                currentMoveIndex: newHistory.length - 1
            };
        } else {
            // If we're in the middle of history, truncate and add new move
            const truncatedHistory = state.history.slice(0, state.currentMoveIndex + 1);
            const newHistory = [...truncatedHistory, move];
            
            return {
                ...state,
                game: newGame,
                fen: newGame.fen(),
                history: newHistory,
                currentMoveIndex: newHistory.length - 1
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
                currentMoveIndex: -1
            };
        }

        return {
            ...state,
            fen: fen,
            currentMoveIndex: moveIndex,
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