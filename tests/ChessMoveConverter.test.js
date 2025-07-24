import { 
    convertUciToSan, 
    formatMovesWithNumbers, 
    convertUciToFormattedMoves,
    parseAnalysisLine 
} from '../src/utils/ChessMoveConverter.js';

describe('ChessMoveConverter', () => {
    const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    describe('convertUciToSan', () => {
        test('should convert basic UCI moves to SAN', () => {
            const uciMoves = 'e2e4 e7e5 g1f3';
            const result = convertUciToSan(uciMoves, startingFen);
            expect(result).toEqual(['e4', 'e5', 'Nf3']);
        });

        test('should handle empty input', () => {
            expect(convertUciToSan('', startingFen)).toEqual([]);
            expect(convertUciToSan(null, startingFen)).toEqual([]);
            expect(convertUciToSan(undefined, startingFen)).toEqual([]);
        });

        test('should handle single move', () => {
            const result = convertUciToSan('e2e4', startingFen);
            expect(result).toEqual(['e4']);
        });

        test('should handle castling moves', () => {
            const fenAfterSomeMoves = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';
            const result = convertUciToSan('g1f3 b8c6 f1c4 f8c5 e1g1', fenAfterSomeMoves);
            expect(result).toContain('O-O'); // Короткая рокировка должна быть в результате
        });

        test('should stop on invalid move', () => {
            const uciMoves = 'e2e4 invalid_move e7e5';
            const result = convertUciToSan(uciMoves, startingFen);
            expect(result).toEqual(['e4']); // Должен остановиться на невалидном ходе
        });
    });

    describe('formatMovesWithNumbers', () => {
        test('should format moves starting from move 1 with white to move', () => {
            const sanMoves = ['e4', 'e5', 'Nf3', 'Nc6'];
            const result = formatMovesWithNumbers(sanMoves, startingFen);
            expect(result).toBe('1. e4 e5 2. Nf3 Nc6');
        });

        test('should handle black to move first', () => {
            const blackToMoveFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
            const sanMoves = ['e5', 'Nf3'];
            const result = formatMovesWithNumbers(sanMoves, blackToMoveFen);
            expect(result).toBe('1... e5 2. Nf3');
        });

        test('should handle different move numbers', () => {
            const midGameFen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 5';
            const sanMoves = ['Nf3', 'Nc6'];
            const result = formatMovesWithNumbers(sanMoves, midGameFen);
            expect(result).toBe('5. Nf3 Nc6');
        });

        test('should handle empty moves array', () => {
            expect(formatMovesWithNumbers([], startingFen)).toBe('');
            expect(formatMovesWithNumbers(null, startingFen)).toBe('');
            expect(formatMovesWithNumbers(undefined, startingFen)).toBe('');
        });

        test('should handle single move', () => {
            const sanMoves = ['e4'];
            const result = formatMovesWithNumbers(sanMoves, startingFen);
            expect(result).toBe('1. e4');
        });
    });

    describe('convertUciToFormattedMoves', () => {
        test('should convert UCI moves directly to formatted string', () => {
            const uciMoves = 'e2e4 e7e5 g1f3 b8c6';
            const result = convertUciToFormattedMoves(uciMoves, startingFen);
            expect(result).toBe('1. e4 e5 2. Nf3 Nc6');
        });

        test('should handle empty UCI moves', () => {
            expect(convertUciToFormattedMoves('', startingFen)).toBe('');
        });
    });

    describe('parseAnalysisLine', () => {
        test('should parse analysis line with UCI moves', () => {
            const rawLine = {
                score: '0.25',
                depth: 15,
                nodes: 1000000,
                uciMoves: 'e2e4 e7e5 g1f3'
            };
            
            const result = parseAnalysisLine(rawLine, startingFen);
            
            expect(result).toEqual({
                score: '0.25',
                depth: 15,
                nodes: 1000000,
                moves: '1. e4 e5 2. Nf3',
                uciMoves: 'e2e4 e7e5 g1f3'
            });
        });

        test('should fallback to old format when no UCI moves', () => {
            const rawLine = {
                score: '0.25',
                depth: 15,
                nodes: 1000000,
                moves: '1. e4 e5 2. Nf3'
            };
            
            const result = parseAnalysisLine(rawLine, startingFen);
            
            expect(result).toEqual({
                score: '0.25',
                depth: 15,
                nodes: 1000000,
                moves: '1. e4 e5 2. Nf3',
                uciMoves: undefined
            });
        });

        test('should handle malformed data gracefully', () => {
            const rawLine = {
                score: '0.25',
                depth: 15,
                nodes: 1000000,
                uciMoves: 'invalid_uci_data'
            };
            
            const result = parseAnalysisLine(rawLine, startingFen);
            
            expect(result).toMatchObject({
                score: '0.25',
                depth: 15,
                nodes: 1000000
            });
            // moves может быть пустой строкой из-за невалидных UCI-ходов
            expect(typeof result.moves).toBe('string');
        });

        test('should handle null input', () => {
            expect(parseAnalysisLine(null, startingFen)).toBeNull();
            expect(parseAnalysisLine({}, null)).toBeNull();
        });
    });
});
