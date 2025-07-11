import { addVariations } from '../src/redux/addVariations.js';

describe('addVariations', () => {
    test('должен добавлять вариацию после хода белых', () => {
        const mainPgn = `[Event "Test"]
[Site "Test"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;

        const variationPgn = `2. d4 exd4 3. Qxd4`;
        const moveNumber = 2;
        const isWhiteMove = true;

        const expected = `[Event "Test"]
[Site "Test"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 (2. d4 exd4 3. Qxd4) Nc6 3. Bb5 a6 1-0`;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result.trim()).toBe(expected.trim());
    });

    test('должен добавлять вариацию после хода черных', () => {
        const mainPgn = `[Event "Test"]
[Site "Test"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;

        const variationPgn = `1... c5 2. Nf3 d6`;
        const moveNumber = 1;
        const isWhiteMove = false;

        const expected = `[Event "Test"]
[Site "Test"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 (1... c5 2. Nf3 d6) 2. Nf3 Nc6 3. Bb5 a6 1-0`;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result.trim()).toBe(expected.trim());
    });

    test('должен добавлять вариацию с комментариями', () => {
        const mainPgn = `[Event "Test"]
[Site "Test"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;

        const variationPgn = `2. f4 {Королевский гамбит} exf4 3. Bc4 {Опасная позиция}`;
        const moveNumber = 2;
        const isWhiteMove = true;

        const expected = `[Event "Test"]
[Site "Test"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 (2. f4 {Королевский гамбит} exf4 3. Bc4 {Опасная позиция}) Nc6 3. Bb5 a6 1-0`;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result.trim()).toBe(expected.trim());
    });

    test('должен добавлять вариацию в PGN без заголовков', () => {
        const mainPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;
        const variationPgn = `2. d4 exd4 3. Qxd4`;
        const moveNumber = 2;
        const isWhiteMove = true;

        const expected = `1. e4 e5 2. Nf3 (2. d4 exd4 3. Qxd4) Nc6 3. Bb5 a6 1-0`;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result.trim()).toBe(expected.trim());
    });

    test('должен добавлять вариацию с заголовками в PGN без заголовков', () => {
        const mainPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;
        const variationPgn = `[Event "Variation"]
[Site "Test"]

2. d4 exd4 3. Qxd4`;
        const moveNumber = 2;
        const isWhiteMove = true;

        const expected = `1. e4 e5 2. Nf3 (2. d4 exd4 3. Qxd4) Nc6 3. Bb5 a6 1-0`;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result.trim()).toBe(expected.trim());
    });

    test('должен корректно обрабатывать пустую вариацию', () => {
        const mainPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;
        const variationPgn = ``;
        const moveNumber = 2;
        const isWhiteMove = true;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result.trim()).toBe(mainPgn.trim());
    });

    test('должен корректно обрабатывать пустой основной PGN', () => {
        const mainPgn = ``;
        const variationPgn = `2. d4 exd4 3. Qxd4`;
        const moveNumber = 2;
        const isWhiteMove = true;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result).toBe('');
    });

    test('должен возвращать исходный PGN, если ход не найден', () => {
        const mainPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;
        const variationPgn = `5. d4 exd4 6. Qxd4`;
        const moveNumber = 5;
        const isWhiteMove = true;

        const result = addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove);
        expect(result.trim()).toBe(mainPgn.trim());
    });

    // Edge cases
    describe('Edge Cases', () => {
        test('должен обрабатывать некорректный номер хода', () => {
            const mainPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;
            const variationPgn = `2. d4 exd4 3. Qxd4`;
            const moveNumber = -1;
            const isWhiteMove = true;

            expect(() => addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove)).not.toThrow();
        });

        test('должен обрабатывать некорректный флаг хода', () => {
            const mainPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;
            const variationPgn = `2. d4 exd4 3. Qxd4`;
            const moveNumber = 2;
            const isWhiteMove = null;

            expect(() => addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove)).not.toThrow();
        });

        test('должен обрабатывать вариацию с некорректным форматом', () => {
            const mainPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;
            const variationPgn = `некорректный формат`;
            const moveNumber = 2;
            const isWhiteMove = true;

            expect(() => addVariations(mainPgn, variationPgn, moveNumber, isWhiteMove)).not.toThrow();
        });
    });
});