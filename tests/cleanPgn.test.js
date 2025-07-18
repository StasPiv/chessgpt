import { cleanPgn } from '../src/redux/cleanPgn.js';

describe('cleanPgn', () => {
    test('should handle empty input', () => {
        expect(cleanPgn('')).toBe('');
        expect(cleanPgn(null)).toBe('');
        expect(cleanPgn(undefined)).toBe('');
    });

    test('should add minimal headers if none provided', () => {
        const input = '1. e4 e5 2. Nf3 Nc6';
        const expected = '[Event "Casual Game"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 *';
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should preserve existing headers', () => {
        const input = '[Event "Test Game"]\n[White "Player1"]\n\n1. e4 e5 2. Nf3 Nc6';
        const expected = '[Event "Test Game"]\n[White "Player1"]\n\n1. e4 e5 2. Nf3 Nc6 *';
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should add result if missing', () => {
        const input = '[Event "Test"]\n\n1. e4 e5';
        const expected = '[Event "Test"]\n\n1. e4 e5 *';
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should preserve existing result', () => {
        const input = '[Event "Test"]\n\n1. e4 e5 1-0';
        const expected = '[Event "Test"]\n\n1. e4 e5 1-0';
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle multiline moves with variations', () => {
        const input = `[Event "Test Match"]
[Site "?"]

1. e4 e5 2. Nf3 (2. d4 exd4) 2... Nc6 
3. Bb5 a6 1-0`;
        const expected = `[Event "Test Match"]
[Site "?"]\n\n1. e4 e5 2. Nf3 (2. d4 exd4) 2... Nc6 
3. Bb5 a6 1-0`;
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle complex PGN with multiple headers and comments', () => {
        const input = `[Event "Super Tournament"]
[Site "City"]
[Date "2024.01.01"]
[Round "1"]
[White "Player One"]
[Black "Player Two"]
[Result "1-0"]

1. e4 e5 {Main line} 2. Nf3 (2. d4 {Alternative} exd4 3. c3) 2... Nc6 1-0`;
        expect(cleanPgn(input)).toBe(input);
    });

    test('should handle PGN without empty line between headers and moves', () => {
        const input = '[Event "Quick Game"]\n[Site "?"]\n1. e4 e5 2. Nf3 Nc6 *';
        const expected = '[Event "Quick Game"]\n[Site "?"]\n\n1. e4 e5 2. Nf3 Nc6 *';
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle PGN from arena', () => {
        const input = '[Event "Gorzuw 2025"]\n' +
            '[Site "?"]\n' +
            '[Date "2025.05.02"]\n' +
            '[Round "3"]\n' +
            '[White "Stanislav Pivovartsev"]\n' +
            '[Black "Hnydiuk"]\n' +
            '[Result "0-1"]\n' +
            '[BlackElo "2400"]\n' +
            '[ECO "B04"]\n' +
            '[Opening "Alekhine"]\n' +
            '[Variation "Modern, Larsen Variation"]\n' +
            '[WhiteElo "2400"]\n' +
            '[TimeControl "180"]\n' +
            '[Termination "normal"]\n' +
            '[PlyCount "60"]\n' +
            '[WhiteType "human"]\n' +
            '[BlackType "human"]\n' +
            '\n' +
            '1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 (4. c4 Nb6 5. f4 Bf5 (5. .. c5) (5. ..\n' +
            'dxe5 6. fxe5 Nc6 7. Be3 Bf5 8. Nc3 e6 9. Nf3 Be7 (9. .. Bb4 10. Be2) 10.\n' +
            'Be2 O-O 11. O-O f6 12. exf6 Bxf6 (12. .. gxf6 13. Bh6 Re8 14. d5 exd5 15.\n' +
            'cxd5 Nb4 16. Nh4 Bc2 17. Qd2 N6xd5 18. Bc4 c6 19. a3) 13. Qd2)) 4. .. dxe5\n' +
            '5. Nxe5 c6 6. Bc4 (6. Be2 Bf5 7. O-O Nd7 8. Nf3) 6. .. Nd7 7. Nxd7 Bxd7 8.\n' +
            'O-O Bf5 9. c3 e6 10. a4 Be7 11. Nd2 O-O 12. Nb3 Qc7 13. g4 Bg6 14. f4 f6\n' +
            '15. Qf3 Bd6 16. Bd2 e5 17. f5 Bf7 18. h4 Rad8 19. Rae1 Nb6 20. Bxf7+ Qxf7\n' +
            '21. Na5 Nxa4 22. c4 exd4 23. b4 Nc3 24. Bxc3 dxc3 25. Qxc3 Be5 26. Qf3 Rd4\n' +
            '27. Re4 Rfd8 28. Rxd4 Rxd4 29. b5 cxb5 30. cxb5 Qa2 0-1\n' +
            ' ';
        const expected = '[Event "Gorzuw 2025"]\n' +
            '[Site "?"]\n' +
            '[Date "2025.05.02"]\n' +
            '[Round "3"]\n' +
            '[White "Stanislav Pivovartsev"]\n' +
            '[Black "Hnydiuk"]\n' +
            '[Result "0-1"]\n' +
            '[BlackElo "2400"]\n' +
            '[ECO "B04"]\n' +
            '[Opening "Alekhine"]\n' +
            '[Variation "Modern, Larsen Variation"]\n' +
            '[WhiteElo "2400"]\n' +
            '[TimeControl "180"]\n' +
            '[Termination "normal"]\n' +
            '[PlyCount "60"]\n' +
            '[WhiteType "human"]\n' +
            '[BlackType "human"]\n' +
            '\n' +
            '1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 (4. c4 Nb6 5. f4 Bf5 (5... c5) (5...\n' +
            'dxe5 6. fxe5 Nc6 7. Be3 Bf5 8. Nc3 e6 9. Nf3 Be7 (9... Bb4 10. Be2) 10.\n' +
            'Be2 O-O 11. O-O f6 12. exf6 Bxf6 (12... gxf6 13. Bh6 Re8 14. d5 exd5 15.\n' +
            'cxd5 Nb4 16. Nh4 Bc2 17. Qd2 N6xd5 18. Bc4 c6 19. a3) 13. Qd2)) 4... dxe5\n' +
            '5. Nxe5 c6 6. Bc4 (6. Be2 Bf5 7. O-O Nd7 8. Nf3) 6... Nd7 7. Nxd7 Bxd7 8.\n' +
            'O-O Bf5 9. c3 e6 10. a4 Be7 11. Nd2 O-O 12. Nb3 Qc7 13. g4 Bg6 14. f4 f6\n' +
            '15. Qf3 Bd6 16. Bd2 e5 17. f5 Bf7 18. h4 Rad8 19. Rae1 Nb6 20. Bxf7+ Qxf7\n' +
            '21. Na5 Nxa4 22. c4 exd4 23. b4 Nc3 24. Bxc3 dxc3 25. Qxc3 Be5 26. Qf3 Rd4\n' +
            '27. Re4 Rfd8 28. Rxd4 Rxd4 29. b5 cxb5 30. cxb5 Qa2 0-1';
        expect(cleanPgn(input)).toBe(expected);
    });
});
