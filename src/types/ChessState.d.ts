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
    [key: string]: any;   // Дополнительные свойства от chess.js
    from: string;
    to: string;
    piece: string;
    captured?: string;
    promotion?: string;
    flags: string;
    lan: string;
    before: string;
    after: string;
}

// Основное состояние шахмат
export interface ChessState {
    fen: string;
    currentFen: string;
    pgn: string;
    pgnHeaders: PgnHeaders;
    currentMove: number;
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