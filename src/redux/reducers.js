import { Chess } from 'cm-chess';
import { cleanPgn } from './cleanPgn.js';
import { 
    LOAD_PGN, 
    ADD_MOVE, 
    GOTO_MOVE, 
    GOTO_FIRST, 
    GOTO_LAST, 
    GOTO_PREVIOUS, 
    GOTO_NEXT 
} from './actions.js';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Функция для извлечения заголовков PGN
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

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    fullHistory: [],
    currentMoveIndex: -1,
    pgnHeaders: {}
};

export function chessReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_PGN:
            try {
                const newGame = new Chess();
                newGame.load(START_POSITION);
                const cleanedPgn = cleanPgn(action.payload);
                if (!cleanedPgn) {
                    return state;
                }

                // Извлекаем заголовки перед загрузкой PGN
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
                    pgnHeaders: pgnHeaders
                };
            } catch (error) {
                console.error('Error loading PGN:', error);
                return state;
            }

        case ADD_MOVE:
            try {
                // Создаем новую игру с текущим состоянием
                const newGame = new Chess(state.fen);
                
                // Пробуем сделать ход
                const move = newGame.move(action.payload);
                if (move === null) {
                    console.log('Invalid move in reducer:', action.payload);
                    return state;
                }

                console.log('Move successful in reducer:', move);
                
                // Создаем новую историю
                const newHistory = [...state.fullHistory, move];
                
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    history: newHistory,
                    fullHistory: newHistory,
                    currentMoveIndex: newHistory.length - 1
                };
            } catch (error) {
                console.error('Error adding move:', error);
                return state;
            }

        case GOTO_MOVE:
            try {
                const targetMoveIndex = action.payload;
                const newGame = new Chess();
                newGame.load(START_POSITION);
                const { fullHistory } = state;
                
                if (targetMoveIndex >= 0) {
                    for (let i = 0; i <= targetMoveIndex && i < fullHistory.length; i++) {
                        newGame.move(fullHistory[i]);
                    }
                }
                
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    currentMoveIndex: targetMoveIndex,
                    history: fullHistory
                };
            } catch (error) {
                console.error('Error in GOTO_MOVE:', error);
                return state;
            }

        case GOTO_FIRST:
            try {
                const newGame = new Chess();
                newGame.load(START_POSITION);
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    currentMoveIndex: -1,
                    history: state.fullHistory
                };
            } catch (error) {
                console.error('Error in GOTO_FIRST:', error);
                return state;
            }

        case GOTO_LAST:
            try {
                const lastHistory = state.fullHistory;
                const newGame = new Chess();
                newGame.load(START_POSITION);
                for (let i = 0; i < lastHistory.length; i++) {
                    newGame.move(lastHistory[i]);
                }
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    currentMoveIndex: lastHistory.length - 1,
                    history: lastHistory
                };
            } catch (error) {
                console.error('Error in GOTO_LAST:', error);
                return state;
            }

        case GOTO_PREVIOUS:
            try {
                const prevIndex = Math.max(-1, state.currentMoveIndex - 1);
                const prevHistory = state.fullHistory;
                const newGame = new Chess();
                newGame.load(START_POSITION);
                if (prevIndex >= 0) {
                    for (let i = 0; i <= prevIndex; i++) {
                        newGame.move(prevHistory[i]);
                    }
                }
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    currentMoveIndex: prevIndex,
                    history: prevHistory
                };
            } catch (error) {
                console.error('Error in GOTO_PREVIOUS:', error);
                return state;
            }

        case GOTO_NEXT:
            try {
                const nextIndex = Math.min(state.fullHistory.length - 1, state.currentMoveIndex + 1);
                const nextHistory = state.fullHistory;
                const newGame = new Chess();
                newGame.load(START_POSITION);
                for (let i = 0; i <= nextIndex; i++) {
                    newGame.move(nextHistory[i]);
                }
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    currentMoveIndex: nextIndex,
                    history: nextHistory
                };
            } catch (error) {
                console.error('Error in GOTO_NEXT:', error);
                return state;
            }

        default:
            return state;
    }
}