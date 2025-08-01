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
[Site "?"]\n\n1. e4 e5 2. Nf3 (2. d4 exd4) 2... Nc6 3. Bb5 a6 1-0`;
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle complex PGN with multiple headers and remove comments', () => {
        const input = `[Event "Super Tournament"]
[Site "City"]
[Date "2024.01.01"]
[Round "1"]
[White "Player One"]
[Black "Player Two"]
[Result "1-0"]

1. e4 e5 {Main line} 2. Nf3 (2. d4 {Alternative} exd4 3. c3) 2... Nc6 1-0`;
        
        const expected = `[Event "Super Tournament"]
[Site "City"]
[Date "2024.01.01"]
[Round "1"]
[White "Player One"]
[Black "Player Two"]
[Result "1-0"]\n\n1. e4 e5 2. Nf3 (2. d4 exd4 3. c3) 2... Nc6 1-0`;
        
        expect(cleanPgn(input)).toBe(expected);
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
            ' ';
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
            '1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 (4. c4 Nb6 5. f4 Bf5 (5... c5) (5... dxe5 6. fxe5 Nc6 7. Be3 Bf5 8. Nc3 e6 9. Nf3 Be7 (9... Bb4 10. Be2) 10. Be2 O-O 11. O-O f6 12. exf6 Bxf6 (12... gxf6 13. Bh6 Re8 14. d5 exd5 15. cxd5 Nb4 16. Nh4 Bc2 17. Qd2 N6xd5 18. Bc4 c6 19. a3) 13. Qd2)) 4... dxe5 5. Nxe5 c6 6. Bc4 (6. Be2 Bf5 7. O-O Nd7 8. Nf3) 6... Nd7 7. Nxd7 Bxd7 8. O-O Bf5 9. c3 e6 10. a4 Be7 11. Nd2 O-O 12. Nb3 Qc7 13. g4 Bg6 14. f4 f6 15. Qf3 Bd6 16. Bd2 e5 17. f5 Bf7 18. h4 Rad8 19. Rae1 Nb6 20. Bxf7+ Qxf7 21. Na5 Nxa4 22. c4 exd4 23. b4 Nc3 24. Bxc3 dxc3 25. Qxc3 Be5 26. Qf3 Rd4 27. Re4 Rfd8 28. Rxd4 Rxd4 29. b5 cxb5 30. cxb5 Qa2 0-1';
        expect(cleanPgn(input)).toBe(expected);
    });

    // Новые тесты для обработки комментариев в фигурных скобках
    test('should remove simple time comments', () => {
        const input = `[Event "Test Game"]
[Site "lichess.org"]
[Result "1-0"]

1. e4 { [%clk 0:15:00] } 1... c5 { [%clk 0:14:58] } 2. Nf3 { [%clk 0:14:55] } 1-0`;
        
        const expected = `[Event "Test Game"]
[Site "lichess.org"]
[Result "1-0"]\n\n1. e4 1... c5 2. Nf3 1-0`;
        
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should remove complex comments with nested content', () => {
        const input = `[Event "Test Game"]

1. e4 { This is a comment } 1... e5 { [%clk 0:15:00] } 2. Nf3 { Multi-line
comment here } 2... Nc6 1-0`;
        
        const expected = `[Event "Test Game"]\n\n1. e4 1... e5 2. Nf3 2... Nc6 1-0`;
        
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle the problematic lichess game with time comments', () => {
        const input = `[Event "casual rapid game"]
[Site "https://lichess.org/IWHSxG3Y"]
[Date "2025.07.26"]
[White "LeelaRookOdds"]
[Black "SomeCM"]
[Result "1-0"]
[GameId "IWHSxG3Y"]
[UTCDate "2025.07.26"]
[UTCTime "18:57:43"]
[WhiteElo "2000"]
[BlackElo "1968"]
[WhiteTitle "BOT"]
[Variant "From Position"]
[TimeControl "900+10"]
[ECO "?"]
[Opening "?"]
[Termination "Normal"]
[FEN "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR w Kkq - 0 1"]
[SetUp "1"]
[Annotator "lichess.org"]

1. e4 { [%clk 0:15:00] } 1... c5 { [%clk 0:15:00] } 2. Nc3 { [%clk 0:15:10] } 2... Nc6 { [%clk 0:14:44] } 3. g3 { [%clk 0:15:19] } 3... e5 { [%clk 0:14:39] } 4. d3 { [%clk 0:15:23] } 4... g6 { [%clk 0:14:22] } 5. Bg2 { [%clk 0:15:30] } 5... Bg7 { [%clk 0:14:22] } 6. h4 { [%clk 0:15:37] } 6... h5 { [%clk 0:14:17] } 7. Nd5 { [%clk 0:15:45] } 7... d6 { [%clk 0:14:13] } 8. c3 { [%clk 0:15:52] } 8... Be6 { [%clk 0:14:16] } 9. Nh3 { [%clk 0:15:59] } 9... Nf6 { [%clk 0:13:57] } 10. Nxf6+ { [%clk 0:16:07] } 10... Bxf6 { [%clk 0:13:55] } 11. O-O { [%clk 0:16:16] } 11... Qd7 { [%clk 0:13:53] } 12. Kh2 { [%clk 0:16:25] } 12... d5 { [%clk 0:13:41] } 13. Qf3 { [%clk 0:16:32] } 13... Bxh3 { [%clk 0:12:00] } 14. Qxf6 { [%clk 0:16:38] } 14... Bxg2 { [%clk 0:12:03] } 15. Qxh8+ { [%clk 0:16:47] } 15... Ke7 { [%clk 0:12:04] } 16. Bg5+ { [%clk 0:16:57] } 16... Kd6 { [%clk 0:11:54] } 17. Qf6+ { [%clk 0:17:07] } 17... Qe6 { [%clk 0:11:41] } 18. Kxg2 { [%clk 0:17:16] } 18... Qxf6 { [%clk 0:11:41] } 19. Bxf6 { [%clk 0:17:25] } 19... dxe4 { [%clk 0:11:30] } 20. dxe4 { [%clk 0:17:34] } 20... Ke6 { [%clk 0:11:33] } 21. Bg5 { [%clk 0:17:44] } 21... f6 { [%clk 0:11:35] } 22. Be3 { [%clk 0:17:53] } 22... Rd8 { [%clk 0:11:32] } 23. Re1 { [%clk 0:17:59] } 23... c4 { [%clk 0:11:30] } 24. f3 { [%clk 0:18:04] } 24... Rd3 { [%clk 0:11:29] } 25. a4 { [%clk 0:18:11] } 25... Na5 { [%clk 0:11:26] } 26. Kf2 { [%clk 0:18:20] } 26... a6 { [%clk 0:11:22] } 27. g4 { [%clk 0:18:26] } 27... Nb3 { [%clk 0:10:48] } 28. Rg1 { [%clk 0:18:36] } 28... Kf7 { [%clk 0:10:03] } 29. Ke2 { [%clk 0:18:44] } 29... Rd8 { [%clk 0:09:38] } 30. g5 { [%clk 0:18:52] } 30... f5 { [%clk 0:09:19] } 31. exf5 { [%clk 0:19:01] } 31... gxf5 { [%clk 0:09:23] } 32. g6+ { [%clk 0:19:09] } 32... Kg8 { [%clk 0:09:14] } 33. f4 { [%clk 0:19:16] } 33... exf4 { [%clk 0:09:08] } 34. Bxf4 { [%clk 0:19:25] } 34... Re8+ { [%clk 0:09:05] } 35. Kf3 { [%clk 0:19:31] } 35... Rd8 { [%clk 0:08:21] } 36. Rg5 { [%clk 0:19:35] } 36... Rd3+ { [%clk 0:08:26] } 37. Be3 { [%clk 0:19:43] } 37... Nd2+ { [%clk 0:07:55] } 38. Kf4 { [%clk 0:19:50] } 38... Nf1 { [%clk 0:07:40] } 39. Bd4 { [%clk 0:19:59] } { Black resigns. } 1-0`;

        const result = cleanPgn(input);
        
        // Проверяем, что комментарии удалены
        expect(result).not.toContain('[%clk');
        expect(result).not.toContain('Black resigns.');
        
        // Проверяем, что результат сохранен
        expect(result).toMatch(/1-0$/);
        
        // Проверяем, что заголовки сохранены
        expect(result).toContain('[Event "casual rapid game"]');
        expect(result).toContain('[Site "https://lichess.org/IWHSxG3Y"]');
        
        // Проверяем, что ходы сохранены (без комментариев)
        expect(result).toContain('1. e4 1... c5 2. Nc3 2... Nc6');
        expect(result).toContain('39. Bd4 1-0');
    });

    test('should handle comments with mixed content', () => {
        const input = `[Event "Test"]

1. e4 { Good move! } 1... e5 { [%clk 0:15:00] Black's response } 2. Nf3 { [%eval 0.15] } 1-0`;
        
        const expected = `[Event "Test"]\n\n1. e4 1... e5 2. Nf3 1-0`;
        
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle nested braces in comments', () => {
        const input = `[Event "Test"]

1. e4 { This is {nested} content } 1... e5 { [%clk {time: 15:00}] } 2. Nf3 *`;
        
        const expected = `[Event "Test"]\n\n1. e4 1... e5 2. Nf3 *`;
        
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should preserve game result after removing comments', () => {
        const input = `[Event "Test"]

1. e4 { [%clk 0:15:00] } 1... e5 { Comment } { Black resigns. } 1-0`;
        
        const expected = `[Event "Test"]\n\n1. e4 1... e5 1-0`;
        
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle empty comments', () => {
        const input = `[Event "Test"]

1. e4 { } 1... e5 { [%clk 0:15:00] } 2. Nf3 {  } *`;
        
        const expected = `[Event "Test"]\n\n1. e4 1... e5 2. Nf3 *`;
        
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should handle comments at the end of moves section', () => {
        const input = `[Event "Test"]

1. e4 e5 2. Nf3 Nc6 { Final comment } 1-0`;
        
        const expected = `[Event "Test"]\n\n1. e4 e5 2. Nf3 Nc6 1-0`;
        
        expect(cleanPgn(input)).toBe(expected);
    });

    test('should remove comments from variations', () => {
        const input = `[Event "Test"]

1. e4 e5 2. Nf3 (2. d4 { Aggressive! } exd4 { Takes center } 3. c3 { Central control }) 2... Nc6 1-0`;
        
        const expected = `[Event "Test"]\n\n1. e4 e5 2. Nf3 (2. d4 exd4 3. c3 ) 2... Nc6 1-0`;
        
        expect(cleanPgn(input)).toBe(expected);
    });
});