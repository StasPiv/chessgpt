
// PGN Headers interface
export interface PgnHeaders {
    Event?: string;
    Site?: string;
    Date?: string;
    Round?: string;
    White?: string;
    Black?: string;
    WhiteElo?: string;
    BlackElo?: string;
    Result?: GameResult;
    Opening?: string;
    Variation?: string;
    [key: string]: string | undefined; // Для дополнительных заголовков
}

// Game result type
export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*' | string;

// Formatted result type
export type FormattedGameResult = 
    | '1-0 (White wins)'
    | '0-1 (Black wins)'
    | '1/2-1/2 (Draw)'
    | 'Game not finished'
    | string;

// Player information interface
export interface PlayerInfo {
    name: string;
    elo?: string;
    color: 'white' | 'black';
}

// Game information interface
export interface GameInfo {
    event?: string;
    site?: string;
    date?: string;
    round?: string;
    result?: GameResult;
    opening?: string;
    variation?: string;
    whitePlayer: PlayerInfo;
    blackPlayer: PlayerInfo;
}

// GameHeader component props
export interface GameHeaderProps {
    className?: string;
    compact?: boolean; // Для будущих возможностей компактного отображения
}

// Result formatter function type
export type ResultFormatter = (result: GameResult) => FormattedGameResult;
