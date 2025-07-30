import { PgnHeaders } from './GameHeader';

// Типы для вариантов ходов
export interface VariationPathItem {
    type: 'main' | 'variation' | 'move';
    index?: number;
    variationIndex?: number;
    moveIndex?: number;
}

// Тип для хода в шахматах
export interface ChessMove {
    san: string;          // Стандартная алгебраическая нотация (e.g., "e4", "Nf3")
    fen: string;          // FEN позиция после хода
    from: string;
    to: string;
    piece: string;
    captured?: string;
    promotion?: string;
    flags: string;
    lan: string;
    before: string;
    after: string;
    next?: ChessMove;     // Исправлено: убрали ? из ?ChessMove
    globalIndex: number;  // Добавлено: глобальный индекс хода
    ply: number;          // Добавлено: номер полухода
    variations?: ChessMove[][]; // Добавлено: массив вариаций
    [key: string]: any;   // Дополнительные свойства от chess.js
}

// Основное состояние шахмат
export interface ChessState {
    fen: string;
    currentFen: string;
    pgn: string;
    pgnHeaders: PgnHeaders;
    currentMove: ChessMove;
    currentMoveIndex: number;
    gameHistory: string[];
    fullHistory: string[];
    history: ChessMove[];                    // Массив ходов с вариантами
    currentVariationPath: VariationPathItem[]; // Путь к текущему варианту
    variations: any[];
    isAnalysisMode: boolean;
    engineAnalysis: any;
    currentVariation: number;
    globalIndex: number;
    isGameLoaded: boolean;
}