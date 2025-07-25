// Типы для компонента ChessBoard
export interface ChessBoardProps {
    isFlipped?: boolean;
}

// Типы для событий доски
export interface PieceDropEvent {
    sourceSquare: string;
    targetSquare: string | null;
}

// Типы для аргументов обработчика клика по клетке
export interface SquareHandlerArgs {
    piece: any;
    square: string;
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
    onSquareClick: (args: SquareHandlerArgs) => void;
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
    customSquareStyles?: { [square: string]: React.CSSProperties };
}