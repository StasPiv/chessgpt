import { LOAD_PGN, ADD_MOVE, UNDO_MOVE } from './actions.js';
import { Chess } from 'chess.js';
// Initialize a chess game
const initialGame = new Chess();
const initialState = {
    game: initialGame,
    fen: initialGame.fen(),
    history: [],
};
export function chessReducer(state = initialState, action) {
    const game = state.game;
    switch (action.type) {
        case LOAD_PGN:
            try {
                game.reset();
                let pgn = action.payload.trim();

                if (!pgn.startsWith('[')) {
                    pgn = '[Event "Casual Game"]\n\n' + pgn;
                }

                if (!pgn.match(/1-0|0-1|1\/2-1\/2|\*$/)) {
                    pgn += ' *';
                }

                // Просто вызываем, не проверяем возвращаемое значение
                game.loadPgn(pgn, { sloppy: true });

            } catch (error) {
                console.error('Error loading PGN:', error);
                return state;
            }
            return {
                ...state,
                fen: game.fen(),
                history: game.history({ verbose: true })
            };
        case ADD_MOVE:
            const move = game.move(action.payload);
            if (!move) {
                return state;
            }
            return {
                ...state,
                fen: game.fen(),
                history: game.history({ verbose: true })
            };
        case UNDO_MOVE:
            game.undo();
            return {
                ...state,
                fen: game.fen(),
                history: game.history({ verbose: true })
            };
        default:
            return state;
    }
}