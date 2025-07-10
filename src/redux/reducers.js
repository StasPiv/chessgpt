import { LOAD_PGN, ADD_MOVE, UNDO_MOVE, GOTO_MOVE } from './actions.js';
import { Chess } from 'chess.js';
// Initialize a chess game
const initialGame = new Chess();
const initialState = {
    game: initialGame,
    fen: initialGame.fen(),
    history: [],
    fullHistory: [], // Полная история ходов партии
    currentMoveIndex: -1, // Индекс текущего хода (-1 = начальная позиция)
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
            const loadedHistory = game.history({ verbose: true });
            return {
                ...state,
                fen: game.fen(),
                history: loadedHistory,
                fullHistory: loadedHistory,
                currentMoveIndex: loadedHistory.length - 1
            };
        case ADD_MOVE:
            const move = game.move(action.payload);
            if (!move) {
                return state;
            }
            const newHistory = game.history({ verbose: true });
            return {
                ...state,
                fen: game.fen(),
                history: newHistory,
                fullHistory: newHistory,
                currentMoveIndex: newHistory.length - 1
            };
        case UNDO_MOVE:
            game.undo();
            const undoHistory = game.history({ verbose: true });
            return {
                ...state,
                fen: game.fen(),
                history: undoHistory,
                fullHistory: undoHistory,
                currentMoveIndex: undoHistory.length - 1
            };
        case GOTO_MOVE:
            const targetMoveIndex = action.payload;
            
            // Используем сохраненную полную историю для навигации
            const { fullHistory } = state;
            
            // Сброс игры к начальной позиции
            game.reset();
            
            // Если targetMoveIndex >= 0, воспроизводим ходы до указанного индекса
            if (targetMoveIndex >= 0) {
                for (let i = 0; i <= targetMoveIndex && i < fullHistory.length; i++) {
                    game.move(fullHistory[i]);
                }
            }
            // Если targetMoveIndex === -1, остаемся в начальной позиции
            
            return {
                ...state,
                fen: game.fen(),
                currentMoveIndex: targetMoveIndex,
                // history остается полной историей для отображения в MoveList
                history: fullHistory
            };
        default:
            return state;
    }
}