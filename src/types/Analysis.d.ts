// Тип для одной линии анализа
export interface AnalysisLine {
  score: string;
  depth: number;
  nodes: number;
  moves: string;
}

// Тип для состояния анализа
export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'stopped';
  lines: AnalysisLine[];
  error: string | null;
  autoAnalysisEnabled: boolean;
}
