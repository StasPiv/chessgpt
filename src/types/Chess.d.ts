declare module 'cm-chess' {
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

  export interface MoveOptions {
    from: string;
    to: string;
    promotion?: string;
  }

  export class Chess {
    constructor(fen?: string);
    move(move: string | MoveOptions, options?: { sloppy?: boolean }): ChessMove | null;
    fen(): string;
    pgn(): string;
    load(fen: string): boolean;
    reset(): void;
    turn(): 'w' | 'b';
    game_over(): boolean;
    in_check(): boolean;
    in_checkmate(): boolean;
    in_stalemate(): boolean;
    in_draw(): boolean;
    moves(options?: { square?: string; verbose?: boolean }): string[] | ChessMove[];
    undo(): ChessMove | null;
    history(options?: { verbose?: boolean }): string[] | ChessMove[];
    get(square: string): any;
    put(piece: any, square: string): boolean;
    remove(square: string): any;
    clear(): void;
    validate_fen(fen: string): { valid: boolean; error?: string; error_number?: number };
    ascii(): string;
  }
}
