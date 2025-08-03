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
    ECO?: string;
    TimeControl?: string;
    Termination?: string;
    PlyCount?: string;
    WhiteType?: string;
    BlackType?: string;
    [key: string]: string | undefined; // Для дополнительных заголовков
}

// Game result type
export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*' | string;

// Formatted result type
export type FormattedGameResult =
    | '1-0'
    | '0-1'
    | '1/2-1/2'
    | '*'
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
    eco?: string;
    timeControl?: string;
    termination?: string;
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