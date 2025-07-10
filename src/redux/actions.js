export const LOAD_PGN = 'LOAD_PGN';
export const ADD_MOVE = 'ADD_MOVE';
export const UNDO_MOVE = 'UNDO_MOVE';
export const GOTO_MOVE = 'GOTO_MOVE';
export function loadPGNAction(pgn) {
    return { type: LOAD_PGN, payload: pgn };
}
export function addMoveAction(move) {
    return { type: ADD_MOVE, payload: move };
}
export function undoMoveAction() {
    return { type: UNDO_MOVE };
}

export function gotoMoveAction(moveIndex) {
    return { type: GOTO_MOVE, payload: moveIndex };
}