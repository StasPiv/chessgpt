import { PgnHeaders } from './GameHeader';

export interface ChessState {
    fen: string;
    pgn: string;
    pgnHeaders: PgnHeaders;
    currentMove: number;
    gameHistory: string[];
    variations: any[];
    isAnalysisMode: boolean;
    engineAnalysis: any;
    currentVariation: number;
    globalIndex: number;
    isGameLoaded: boolean;
}