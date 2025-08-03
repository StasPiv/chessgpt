// Остальные типы остаются без изменений...
import { AnalysisState } from './Analysis';
import { ChessState } from './ChessState';

// WebSocket State Type
export interface WebSocketState {
    isConnected: boolean;
}

// UI State Type
export interface UIState {
    isMobile: boolean;
    isFullscreen: boolean;
}

// Root State Type (обновляем существующий)
export interface RootState {
    chess: ChessState;
    analysis: AnalysisState;
    websocket: WebSocketState;
    ui: UIState;
}