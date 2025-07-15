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
    fullHistory: [],
    currentMoveIndex: -1,
    currentVariationPath: [],
    currentVariationIndex: null,
    pgnHeaders: {}
};

// Function to create game from history up to certain index
function createGameFromHistory(history, moveIndex) {
    const newGame = new Chess();
    newGame.load(START_POSITION);
    
    if (moveIndex >= 0) {
        for (let i = 0; i <= moveIndex && i < history.length; i++) {
            newGame.move(history[i]);
        }
    }
    
    return newGame;
}

// Handler for going to first move
function handleGotoFirst(state) {
    try {
        const newGame = new Chess();
        newGame.load(START_POSITION);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: -1,
            currentVariationPath: [],
            currentVariationIndex: null,
            history: state.fullHistory
        };
    } catch (error) {
        console.error('Error in GOTO_FIRST:', error);
        return state;
    }
}

// Handler for going to last move
function handleGotoLast(state) {
    try {
        const lastHistory = state.fullHistory;
        const newGame = createGameFromHistory(lastHistory, lastHistory.length - 1);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: lastHistory.length - 1,
            currentVariationPath: [],
            currentVariationIndex: null,
            history: lastHistory
        };
    } catch (error) {
        console.error('Error in GOTO_LAST:', error);
        return state;
    }
}

// Handler for going to previous move
function handleGotoPrevious(state) {
    try {
        const prevIndex = Math.max(-1, state.currentMoveIndex - 1);
        const prevHistory = state.fullHistory;
        const newGame = createGameFromHistory(prevHistory, prevIndex);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: prevIndex,
            history: prevHistory
        };
    } catch (error) {
        console.error('Error in GOTO_PREVIOUS:', error);
        return state;
    }
}

// Handler for going to next move
function handleGotoNext(state) {
    try {
        const nextIndex = Math.min(state.fullHistory.length - 1, state.currentMoveIndex + 1);
        const nextHistory = state.fullHistory;
        const newGame = createGameFromHistory(nextHistory, nextIndex);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: nextIndex,
            history: nextHistory
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