
export const LOAD_PGN = 'LOAD_PGN';
export const ADD_MOVE = 'ADD_MOVE';
export const ADD_VARIATION = 'ADD_VARIATION';
export const PROMOTE_VARIATION = 'PROMOTE_VARIATION';
export const DELETE_VARIATION = 'DELETE_VARIATION';
export const DELETE_REMAINING = 'DELETE_REMAINING';
export const UNDO_MOVE = 'UNDO_MOVE';
export const GOTO_MOVE = 'GOTO_MOVE';
export const GOTO_FIRST = 'GOTO_FIRST';
export const GOTO_LAST = 'GOTO_LAST';
export const GOTO_PREVIOUS = 'GOTO_PREVIOUS';
export const GOTO_NEXT = 'GOTO_NEXT';
export const SET_IS_MOBILE = 'SET_IS_MOBILE';

export function loadPGNAction(pgn) {
    return { type: LOAD_PGN, payload: pgn };
}

export function addMoveAction(move) {
    return { type: ADD_MOVE, payload: move };
}

export function addVariationAction(move) {
    return { type: ADD_VARIATION, payload: move };
}

export function promoteVariationAction() {
    return { type: PROMOTE_VARIATION };
}

export function deleteVariationAction() {
    return { type: DELETE_VARIATION };
}

export function deleteRemainingAction() {
    return { type: DELETE_REMAINING };
}

export function gotoMoveAction(payload) {
    return { type: GOTO_MOVE, payload: payload };
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

export function setIsMobileAction(isMobile) {
    return { type: SET_IS_MOBILE, payload: isMobile };
}