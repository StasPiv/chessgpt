import { Chess } from 'cm-chess';
import { cleanPgn } from './cleanPgn.js';
import { LOAD_PGN } from './actions.js';
import { linkAllMovesRecursively } from '../utils/ChessHistoryUtils';
import { 
    getStartPosition, 
    findMoveByGlobalIndex, 
    extractPgnHeaders,
    getDefaultStartPosition
} from '../utils/ChessReducerUtils.js';

const initialState = {
    game: new Chess(),
    fen: getDefaultStartPosition(),
    history: [],
    fullHistory: [],
    currentMoveIndex: -1,
    currentMove: null, // Добавляем объект текущего хода
    currentVariationPath: [],
    currentVariationIndex: null,
    pgnHeaders: {},
    maxGlobalIndex: 0
};

// Function to add empty variation property to all moves recursively
function addEmptyVariationToMoves(history) {
    function processMove(move) {
        // Устанавливаем variation в пустой массив для каждого хода
        move.variation = [];
        
        // Рекурсивно обрабатываем variations, если они есть
        if (move.variations && move.variations.length > 0) {
            move.variations.forEach(variation => {
                variation.forEach(varMove => processMove(varMove));
            });
        }
        
        return move;
    }
    
    return history.map(move => processMove(move));
}

// Function to assign global indexes to moves
function assignGlobalIndexes(history) {
    let variationCounter = 0;
    let maxGlobalIndex = 0;
    let hasVariations = false; // Флаг для отслеживания наличия вариаций

    function processMove(move, currentVariationIndex = 0) {
        if (currentVariationIndex === 0) {
            // Main line: indexes from 0 to 999
            move.globalIndex = move.moveIndex || 0;
            maxGlobalIndex = Math.max(maxGlobalIndex, move.globalIndex);
        } else {
            // Variations: each variation gets its own 1000-based range
            move.globalIndex = currentVariationIndex * 1000 + (move.moveIndex || 0);
            maxGlobalIndex = Math.max(maxGlobalIndex, move.globalIndex);
            hasVariations = true; // Отмечаем что есть вариации
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

    // Если нет вариаций, устанавливаем maxGlobalIndex = 0
    // Иначе округляем до ближайшего большего числа, кратного 1000
    const finalMaxGlobalIndex = hasVariations
        ? Math.ceil((maxGlobalIndex + 1) / 1000) * 1000
        : 0;

    return {
        history,
        maxGlobalIndex: finalMaxGlobalIndex
    };
}

// PGN loading handler
function handleLoadPgn(state, action) {
    try {
        const cleanedPgn = cleanPgn(action.payload);
        if (!cleanedPgn) {
            return state;
        }

        // Извлекаем заголовки PGN
        const pgnHeaders = extractPgnHeaders(cleanedPgn);
        
        // Получаем начальную позицию из заголовков или используем стандартную
        const startPosition = getStartPosition(pgnHeaders);
        
        // Создаем новый экземпляр Chess и полностью очищаем состояние
        const newGame = new Chess();
        newGame.load(startPosition);
        
        newGame.loadPgn(cleanedPgn, { sloppy: true });
        const loadedHistory = newGame.history({ verbose: true, variations: true });
        
        // Assign global indexes to all moves and get max global index
        const { history: historyWithGlobalIndexes, maxGlobalIndex } = assignGlobalIndexes(loadedHistory);
        
        // Добавляем пустое свойство variation ко всем ходам
        const historyWithVariations = addEmptyVariationToMoves(historyWithGlobalIndexes);
        
        // Устанавливаем ссылки next и previous для всех ходов в истории
        linkAllMovesRecursively(historyWithVariations);
        
        // Определяем текущий ход после загрузки
        const currentMoveIndex = historyWithVariations.length - 1;
        const currentMove = findMoveByGlobalIndex(historyWithVariations, currentMoveIndex);
        
        // Полный сброс состояния к начальному с новыми данными
        return {
            ...initialState, // Сначала берем все поля из initialState
            game: newGame,
            fen: newGame.fen(),
            history: historyWithVariations,
            fullHistory: [], // Очищаем fullHistory - делаем пустым массивом
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