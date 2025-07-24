// Тип для одной линии анализа
export interface AnalysisLine {
  score: string;
  depth: number;
  nodes: number;
  uciMoves: string;    // Raw UCI moves from engine (e.g., "e2e4 e7e5")
  fen: string;         // Current position FEN
}

// Тип для состояния анализа
export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'stopped';
  lines: AnalysisLine[];
  error: string | null;
  autoAnalysisEnabled: boolean;
}