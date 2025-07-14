import { AnalysisState } from './Analysis';
import { ChessState } from './ChessState';

// Тип для корневого состояния Redux
export interface RootState {
  analysis: AnalysisState;
  chess: ChessState;
}
