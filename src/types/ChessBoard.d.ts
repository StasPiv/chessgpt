
// Типы для компонента ChessBoard
export interface ChessBoardProps {
    isFlipped?: boolean;
}

// Типы для хода шахмат
export interface ChessMove {
    from: string;
    to: string;
    piece: string;
    captured?: string;
    promotion?: string;
    flags: string;
    san: string;
    lan: string;
    before: string;
    after: string;
}

// Типы для событий доски
export interface PieceDropEvent {
    sourceSquare: string;
    targetSquare: string | null;
}

// Типы для стилей доски
export interface BoardStyle {
    borderRadius?: string;
    boxShadow?: string;
}

export interface SquareStyle {
    backgroundColor?: string;
}

export interface DropSquareStyle {
    boxShadow?: string;
}

// Типы для опций шахматной доски
export interface ChessboardOptions {
    position: string;
    onPieceDrop: (event: PieceDropEvent) => boolean;
    onSquareClick: (square: string) => void;
    boardWidth: number;
    customBoardStyle?: BoardStyle;
    customDarkSquareStyle?: SquareStyle;
    customLightSquareStyle?: SquareStyle;
    arePiecesDraggable?: boolean;
    snapToCursor?: boolean;
    animationDuration?: number;
    showBoardNotation?: boolean;
    boardOrientation?: 'white' | 'black';
    customDropSquareStyle?: DropSquareStyle;
    id?: string;
}
