import { Chess } from 'cm-chess';
import { cleanPgn } from './cleanPgn.js';
import { LOAD_PGN } from './actions.js';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    fullHistory: [],
    currentMoveIndex: -1,
    currentMove: null, // Добавляем объект текущего хода
    currentVariationPath: [],
    currentVariationIndex: null,
    pgnHeaders: {},
    maxGlobalIndex: 0
};

// Function to extract PGN headers
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

// Function to find move object by global index
function findMoveByGlobalIndex(history, globalIndex) {
    if (globalIndex === -1) {
        return null;
    }
    
    function searchInHistory(moves) {
        for (const move of moves) {
            if (move.globalIndex === globalIndex) {
                return move;
            }
            
            // Search in variations
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    const moveInVariation = searchInHistory(variation);
                    if (moveInVariation) {
                        return moveInVariation;
                    }
                }
            }
        }
        return null;
    }
    
    return searchInHistory(history);
}

// Function to assign global indexes to moves
function assignGlobalIndexes(history) {
    let variationCounter = 0;
    let maxGlobalIndex = 0;
    
    function processMove(move, currentVariationIndex = 0) {
        if (currentVariationIndex === 0) {
            // Main line: indexes from 0 to 999
            move.globalIndex = move.moveIndex || 0;
            maxGlobalIndex = Math.max(maxGlobalIndex, move.globalIndex);
        } else {
            // Variations: each variation gets its own 1000-based range
            move.globalIndex = currentVariationIndex * 1000 + (move.moveIndex || 0);
            maxGlobalIndex = Math.max(maxGlobalIndex, move.globalIndex);
        }
        
        // Process variations if they exist
        if (move.variations && move.variations.length > 0) {
            move.variations.forEach((variation) => {
                variationCounter++; // Каждая новая вариация получает свой счетчик
                const variationIndex = variationCounter;
                
                variation.forEach((varMove, moveIndex) => {
                    varMove.moveIndex = moveIndex;
                    processMove(varMove, variationIndex);
                });
            });
        }
    }
    
    history.forEach((move, index) => {
        move.moveIndex = index;
        processMove(move);
    });
    
    // Округляем maxGlobalIndex до ближайшего меньшего числа, кратного 1000
    const roundedMaxGlobalIndex = Math.ceil((maxGlobalIndex) / 1000) * 1000;
    
    return { 
        history, 
        maxGlobalIndex: roundedMaxGlobalIndex
    };
}

// PGN loading handler
function handleLoadPgn(state, action) {
    try {
        const cleanedPgn = cleanPgn(action.payload);
        if (!cleanedPgn) {
            return state;
        }

        // Создаем новый экземпляр Chess и полностью очищаем состояние
        const newGame = new Chess();
        newGame.load(START_POSITION);
        
        const pgnHeaders = extractPgnHeaders(cleanedPgn);
        newGame.loadPgn(cleanedPgn, { sloppy: true });
        const loadedHistory = newGame.history({ verbose: true, variations: true });
        
        // Assign global indexes to all moves and get max global index
        const { history: historyWithGlobalIndexes, maxGlobalIndex } = assignGlobalIndexes(loadedHistory);
        
        // Определяем текущий ход после загрузки
        const currentMoveIndex = historyWithGlobalIndexes.length - 1;
        const currentMove = findMoveByGlobalIndex(historyWithGlobalIndexes, currentMoveIndex);
        
        // Полный сброс состояния к начальному с новыми данными
        return {
            ...initialState, // Сначала берем все поля из initialState
            game: newGame,
            fen: newGame.fen(),
            history: historyWithGlobalIndexes,
            fullHistory: historyWithGlobalIndexes,
            currentMoveIndex: currentMoveIndex,
            currentMove: currentMove, // Устанавливаем объект текущего хода
            pgnHeaders: pgnHeaders,
            maxGlobalIndex: maxGlobalIndex
        };
    } catch (error) {
        console.error('Error loading PGN:', error);
        return state;
    }
}

export function loadPgnReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_PGN:
            return handleLoadPgn(state, action);
        default:
            return state;
    }
}