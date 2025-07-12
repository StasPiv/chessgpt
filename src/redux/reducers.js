import { Chess } from 'cm-chess';
import { cleanPgn } from "./cleanPgn.js";
import {
    LOAD_PGN,
    ADD_MOVE,
    GOTO_MOVE,
    GOTO_FIRST,
    GOTO_LAST,
    GOTO_PREVIOUS,
    GOTO_NEXT,
} from './actions.js';

const initialState = {
    game: new Chess(),
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    history: [],
    fullHistory: [],
    currentMoveIndex: -1
};

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function chessReducer(state = initialState, action) {
    const game = state.game;
    switch (action.type) {
        case LOAD_PGN:
            try {
                game.load(START_POSITION);
                const cleanedPgn = cleanPgn(action.payload);
                if (!cleanedPgn) {
                    return state;
                }

                game.loadPgn(cleanedPgn, { sloppy: true });
                const loadedHistory = game.history({ verbose: true, variations: true });
                return {
                    ...state,
                    fen: game.fen(),
                    history: loadedHistory,
                    fullHistory: loadedHistory,
                    currentMoveIndex: loadedHistory.length - 1
                };
            } catch (error) {
                console.error('Error loading PGN:', error);
                return state;
            }

        case ADD_MOVE:
            const move = game.move(action.payload);
            if (move === null) {
                return state;
            }
            return {
                ...state,
                fen: game.fen(),
                history: game.history({ verbose: true }),
                fullHistory: game.history({ verbose: true }),
                currentMoveIndex: game.history().length - 1
            };

        case GOTO_MOVE:
            const targetMoveIndex = action.payload;
            game.load(START_POSITION);
            const { fullHistory } = state;
            if (targetMoveIndex >= 0) {
                for (let i = 0; i <= targetMoveIndex && i < fullHistory.length; i++) {
                    game.move(fullHistory[i]);
                }
            }
            return {
                ...state,
                fen: game.fen(),
                currentMoveIndex: targetMoveIndex,
                history: fullHistory
            };

        case GOTO_FIRST:
            game.load(START_POSITION);
            return {
                ...state,
                fen: game.fen(),
                currentMoveIndex: -1,
                history: state.fullHistory
            };

        case GOTO_LAST:
            const lastHistory = state.fullHistory;
            game.load(START_POSITION);
            for (let i = 0; i < lastHistory.length; i++) {
                game.move(lastHistory[i]);
            }
            return {
                ...state,
                fen: game.fen(),
                currentMoveIndex: lastHistory.length - 1,
                history: lastHistory
            };

        case GOTO_PREVIOUS:
            const prevIndex = Math.max(-1, state.currentMoveIndex - 1);
            const prevHistory = state.fullHistory;
            game.load(START_POSITION);
            if (prevIndex >= 0) {
                for (let i = 0; i <= prevIndex; i++) {
                    game.move(prevHistory[i]);
                }
            }
            return {
                ...state,
                fen: game.fen(),
                currentMoveIndex: prevIndex,
                history: prevHistory
            };

        case GOTO_NEXT:
            const nextIndex = Math.min(state.fullHistory.length - 1, state.currentMoveIndex + 1);
            const nextHistory = state.fullHistory;
            game.load(START_POSITION);
            for (let i = 0; i <= nextIndex; i++) {
                game.move(nextHistory[i]);
            }
            return {
                ...state,
                fen: game.fen(),
                currentMoveIndex: nextIndex,
                history: nextHistory
            };

        default:
            return state;
    }
}