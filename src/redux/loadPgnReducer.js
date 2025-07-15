import { Chess } from 'cm-chess';
import { cleanPgn } from './cleanPgn.js';
import { LOAD_PGN } from './actions.js';

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

// Function to extract PGN headers
function extractPgnHeaders(pgn) {
    const headers = {};
    const lines = pgn.split('\n');
    
    for (const line of lines) {
        const match = line.match(/^\[(\w+)\s+"(.*)"\]$/);
        if (match) {
            headers[match[1]] = match[2];
        }
    }
    
    return headers;
}

// PGN loading handler
function handleLoadPgn(state, action) {
    try {
        const newGame = new Chess();
        newGame.load(START_POSITION);
        const cleanedPgn = cleanPgn(action.payload);
        if (!cleanedPgn) {
            return state;
        }

        const pgnHeaders = extractPgnHeaders(cleanedPgn);
        newGame.loadPgn(cleanedPgn, { sloppy: true });
        const loadedHistory = newGame.history({ verbose: true, variations: true });
        
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            history: loadedHistory,
            fullHistory: loadedHistory,
            currentMoveIndex: loadedHistory.length - 1,
            currentVariationPath: [],
            currentVariationIndex: null,
            pgnHeaders: pgnHeaders
        };
    } catch (error) {
        console.error('Error loading PGN:', error);
        return state;
    }
}

export function loadPgnReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_PGN:
            return handleLoadPgn(state, action);
        default:
            return state;
    }
}
