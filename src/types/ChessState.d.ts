import { PgnHeaders } from './GameHeader';

export interface ChessState {
    fen: string;
    currentFen: string;
    pgn: string;
    pgnHeaders: PgnHeaders;
    currentMove: number;
    currentMoveIndex: number;
    gameHistory: string[];
    fullHistory: string[];
    variations: any[];
    isAnalysisMode: boolean;
    engineAnalysis: any;
    currentVariation: number;
    globalIndex: number;
    isGameLoaded: boolean;
}