import { Chess } from 'cm-chess';
import { cleanPgn } from './cleanPgn.js';
import { 
    LOAD_PGN, 
    ADD_MOVE, 
    GOTO_MOVE, 
    GOTO_FIRST, 
    GOTO_LAST, 
    GOTO_PREVIOUS, 
    GOTO_NEXT,
    GOTO_VARIATION_MOVE,
    ENTER_VARIATION,
    EXIT_VARIATION
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

// Исправленная функция для создания позиции на основе пути через варианты
function createPositionFromPath(history, path) {
    const newGame = new Chess();
    newGame.load(START_POSITION);
    
    if (!path || path.length === 0) {
        return newGame;
    }
    
    try {
        // Проходим по пути и выполняем ходы
        for (const step of path) {
            if (step.type === 'main' && step.index >= 0) {
                // Основная линия - играем все ходы до указанного индекса
                for (let i = 0; i <= step.index && i < history.length; i++) {
                    newGame.move(history[i]);
                }
            } else if (step.type === 'variation' && step.variationIndex >= 0) {
                // Находим родительский ход и его вариации
                const parentMove = findMoveByPath(history, path.slice(0, path.indexOf(step)));
                if (parentMove && parentMove.variations && 
                    parentMove.variations[step.variationIndex]) {
                    // Проигрываем все ходы в вариации до указанного хода
                    const variation = parentMove.variations[step.variationIndex];
                    for (let i = 0; i < variation.length; i++) {
                        newGame.move(variation[i]);
                        // Если это целевой ход, останавливаемся
                        const nextStep = path[path.indexOf(step) + 1];
                        if (nextStep && nextStep.type === 'move' && nextStep.moveIndex === i) {
                            break;
                        }
                    }
                }
            }
        }
        
        return newGame;
    } catch (error) {
        console.error('Error creating position from path:', error);
        return newGame;
    }
}

// Функция для поиска хода по пути
function findMoveByPath(history, path) {
    if (!path || path.length === 0) return null;
    
    let currentMoves = history;
    let currentMove = null;
    
    for (const step of path) {
        if (step.type === 'main' && step.index >= 0 && step.index < currentMoves.length) {
            currentMove = currentMoves[step.index];
            currentMoves = currentMove.variations || [];
        } else if (step.type === 'variation' && step.variationIndex >= 0 && 
                   step.variationIndex < currentMoves.length) {
            currentMove = currentMoves[step.variationIndex];
            if (Array.isArray(currentMove)) {
                currentMoves = currentMove;
            }
        }
    }
    
    return currentMove;
}

// Улучшенная функция для создания позиции из вариации
function createPositionFromVariation(history, variationPath) {
    const newGame = new Chess();
    newGame.load(START_POSITION);
    
    if (!variationPath || variationPath.length === 0) {
        return newGame;
    }
    
    try {
        // Находим родительский ход для вариации
        const parentPath = variationPath.slice(0, -1);
        const lastStep = variationPath[variationPath.length - 1];
        
        // Проигрываем основную линию до родительского хода
        let parentMoveIndex = -1;
        for (const step of parentPath) {
            if (step.type === 'main') {
                parentMoveIndex = step.index;
                break;
            }
        }
        
        // Проигрываем ходы основной линии до точки ветвления
        for (let i = 0; i <= parentMoveIndex && i < history.length; i++) {
            newGame.move(history[i]);
        }
        
        // Если последний шаг указывает на ход в вариации
        if (lastStep.type === 'move' && parentMoveIndex >= 0 && parentMoveIndex < history.length) {
            const parentMove = history[parentMoveIndex];
            if (parentMove.variations) {
                // Находим нужную вариацию
                const variationStep = variationPath.find(step => step.type === 'variation');
                if (variationStep && variationStep.variationIndex >= 0 && 
                    variationStep.variationIndex < parentMove.variations.length) {
                    const variation = parentMove.variations[variationStep.variationIndex];
                    
                    // Проигрываем ходы в вариации до нужного хода
                    for (let i = 0; i <= lastStep.moveIndex && i < variation.length; i++) {
                        newGame.move(variation[i]);
                    }
                }
            }
        }
        
        return newGame;
    } catch (error) {
        console.error('Error creating position from variation:', error);
        return newGame;
    }
}

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    fullHistory: [],
    currentMoveIndex: -1,
    currentVariationPath: [], // Путь через варианты
    currentVariationIndex: null, // Индекс текущей вариации
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
                    currentVariationPath: [],
                    currentVariationIndex: null,
                    pgnHeaders: pgnHeaders
                };
            } catch (error) {
                console.error('Error loading PGN:', error);
                return state;
            }

        case ADD_MOVE:
            try {
                const newGame = new Chess(state.fen);
                const move = newGame.move(action.payload);
                
                if (move === null) {
                    console.log('Invalid move in reducer:', action.payload);
                    return state;
                }

                // Создаем новую игру для работы с вариациями
                const gameWithVariations = new Chess();
                gameWithVariations.load(START_POSITION);
                
                // Восстанавливаем всю историю до текущей позиции
                const currentHistory = [...state.fullHistory.slice(0, state.currentMoveIndex + 1)];
                for (let i = 0; i < currentHistory.length; i++) {
                    gameWithVariations.move(currentHistory[i]);
                }
                
                // Проверяем, есть ли уже такой ход в этой позиции
                const existingMove = currentHistory.find(m => 
                    m.from === move.from && m.to === move.to && m.promotion === move.promotion
                );
                
                if (existingMove) {
                    // Если ход уже существует, переходим к нему
                    const moveIndex = currentHistory.findIndex(m => 
                        m.from === move.from && m.to === move.to && m.promotion === move.promotion
                    );
                    return {
                        ...state,
                        currentMoveIndex: moveIndex,
                        fen: newGame.fen()
                    };
                } else {
                    // Если это новый ход, создаем вариацию
                    try {
                        // Добавляем ход как новую вариацию
                        gameWithVariations.move(move, { variation: true });
                        const newHistory = gameWithVariations.history({ verbose: true, variations: true });
                        
                        return {
                            ...state,
                            game: gameWithVariations,
                            fen: newGame.fen(),
                            history: newHistory,
                            fullHistory: newHistory,
                            currentMoveIndex: state.currentMoveIndex + 1
                        };
                    } catch (variationError) {
                        console.error('Error creating variation:', variationError);
                        // Fallback: просто добавляем ход как продолжение
                        const newHistory = [...currentHistory, move];
                        return {
                            ...state,
                            game: newGame,
                            fen: newGame.fen(),
                            history: newHistory,
                            fullHistory: newHistory,
                            currentMoveIndex: newHistory.length - 1
                        };
                    }
                }
            } catch (error) {
                console.error('Error adding move:', error);
                return state;
            }

// Нужно исправить обработку GOTO_VARIATION_MOVE
        case GOTO_VARIATION_MOVE:
            const variationPath = action.payload;
            
            // Проверяем структуру пути
            if (!variationPath || variationPath.length < 3) {
                return state;
            }
            
            const mainMove = variationPath[0];
            const variationInfo = variationPath[1];
            const moveInfo = variationPath[2];
            
            // Получаем вариацию
            const parentMoveIndex = mainMove.index;
            const variation = state.history[parentMoveIndex]?.variations?.[variationInfo.variationIndex];
            
            if (!variation) {
                return state;
            }
            
            // Создаем новую позицию
            let newPosition = new Chess();
            
            // Воспроизводим основную линию ДО родительского хода (не включая его)
            for (let i = 0; i < parentMoveIndex; i++) {
                if (i < state.history.length) {
                    newPosition.move(state.history[i]);
                }
            }
            
            // Воспроизводим ходы вариации до нужного хода (включая его)
            for (let i = 0; i <= moveInfo.moveIndex; i++) {
                if (i < variation.length) {
                    newPosition.move(variation[i]);
                }
            }
            
            return {
                ...state,
                currentMoveIndex: parentMoveIndex,
                currentVariationPath: variationPath,
                fen: newPosition.fen()
            };

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
                    currentVariationPath: [],
                    currentVariationIndex: null,
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
                    currentVariationPath: [],
                    currentVariationIndex: null,
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
                    currentVariationPath: [],
                    currentVariationIndex: null,
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