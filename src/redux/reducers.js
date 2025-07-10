import { LOAD_PGN, ADD_MOVE, UNDO_MOVE, GOTO_MOVE, GOTO_FIRST, GOTO_LAST, GOTO_PREVIOUS, GOTO_NEXT } from './actions.js';
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
        case GOTO_FIRST:
            // Переход к начальной позиции
            game.reset();
            return {
                ...state,
                fen: game.fen(),
                currentMoveIndex: -1,
                history: state.fullHistory
            };
        case GOTO_LAST:
            // Переход к последнему ходу
            const lastHistory = state.fullHistory;
            game.reset();
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
            // Переход к предыдущему ходу
            const prevIndex = Math.max(-1, state.currentMoveIndex - 1);
            const prevHistory = state.fullHistory;
            game.reset();
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
            // Переход к следующему ходу
            const nextIndex = Math.min(state.fullHistory.length - 1, state.currentMoveIndex + 1);
            const nextHistory = state.fullHistory;
            game.reset();
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