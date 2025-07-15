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

// Function to assign global indexes to moves
function assignGlobalIndexes(history) {
    let globalVariationCounter = 0;
    
    function processMove(move, variationLevel = 0) {
        if (variationLevel === 0) {
            // Main line: indexes from 0 to 999
            move.globalIndex = move.moveIndex || 0;
        } else {
            // Variations: each variation level gets its own 1000-based range
            move.globalIndex = variationLevel * 1000 + (move.moveIndex || 0);
        }
        
        // Process variations if they exist
        if (move.variations && move.variations.length > 0) {
            move.variations.forEach((variation) => {
                globalVariationCounter++;
                variation.forEach((varMove, moveIndex) => {
                    varMove.moveIndex = moveIndex;
                    processMove(varMove, globalVariationCounter);
                });
            });
        }
    }
    
    history.forEach((move, index) => {
        move.moveIndex = index;
        processMove(move);
    });
    
    return history;
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
        
        // Assign global indexes to all moves
        const historyWithGlobalIndexes = assignGlobalIndexes(loadedHistory);
        
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            history: historyWithGlobalIndexes,
            fullHistory: historyWithGlobalIndexes,
            currentMoveIndex: historyWithGlobalIndexes.length - 1,
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