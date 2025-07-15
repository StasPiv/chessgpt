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
            currentMoveIndex: -1
            // НЕ меняем history!
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
        
        const lastIndex = state.history.length - 1;
        const newGame = createGameFromHistory(state.history, lastIndex);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: lastIndex
            // НЕ меняем history!
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
        const newGame = createGameFromHistory(state.history, prevIndex);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: prevIndex
            // НЕ меняем history!
        };
    } catch (error) {
        console.error('Error in GOTO_PREVIOUS:', error);
        return state;
    }
}

// Handler for going to next move
function handleGotoNext(state) {
    try {
        const nextIndex = Math.min(state.history.length - 1, state.currentMoveIndex + 1);
        const newGame = createGameFromHistory(state.history, nextIndex);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: nextIndex
            // НЕ меняем history!
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