import { Chess } from 'cm-chess';
import { loadPgnReducer } from './loadPgnReducer.js';
import { navigationReducer } from './navigationReducer.js';
import { moveListReducer } from './moveListReducer.js';

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

export function chessReducer(state = initialState, action) {
    let newState = state;

    // Apply each reducer in sequence
    newState = loadPgnReducer(newState, action);
    newState = navigationReducer(newState, action);
    newState = moveListReducer(newState, action);

    return newState;
}