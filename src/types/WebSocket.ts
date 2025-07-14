// Типы для WebSocket сообщений
export interface AnalyzeMessage {
  type: 'analyze';
  fen: string;
}

export interface StopMessage {
  type: 'stop';
}

export interface StoppedMessage {
  type: 'stopped';
}

export type WebSocketMessage = AnalyzeMessage | StopMessage | StoppedMessage;
