export const LOAD_PGN = 'LOAD_PGN';
export const ADD_MOVE = 'ADD_MOVE';
export const UNDO_MOVE = 'UNDO_MOVE';
export const GOTO_MOVE = 'GOTO_MOVE';
export const GOTO_FIRST = 'GOTO_FIRST';
export const GOTO_LAST = 'GOTO_LAST';
export const GOTO_PREVIOUS = 'GOTO_PREVIOUS';
export const GOTO_NEXT = 'GOTO_NEXT';
export const GOTO_VARIATION_MOVE = 'GOTO_VARIATION_MOVE';
export const ENTER_VARIATION = 'ENTER_VARIATION';
export const EXIT_VARIATION = 'EXIT_VARIATION';

export function loadPGNAction(pgn) {
    return { type: LOAD_PGN, payload: pgn };
}

export function addMoveAction(move) {
    return { type: ADD_MOVE, payload: move };
}

export function gotoMoveAction(payload) {
    return { type: GOTO_MOVE, payload: payload };
}

export function enterVariationAction(variationIndex, parentMoveIndex) {
    return { type: ENTER_VARIATION, payload: { variationIndex, parentMoveIndex } };
}

export function exitVariationAction() {
    return { type: EXIT_VARIATION };
}

export function gotoFirstAction() {
    return { type: GOTO_FIRST };
}

export function gotoLastAction() {
    return { type: GOTO_LAST };
}

export function gotoPreviousAction() {
    return { type: GOTO_PREVIOUS };
}

export function gotoNextAction() {
    return { type: GOTO_NEXT };
}