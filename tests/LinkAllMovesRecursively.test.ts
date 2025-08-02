import {linkAllMovesRecursively} from '../src/utils/ChessHistoryUtils';
import { linkAllMovesRecursivelyScenarios } from './data/LinkAllMovesRecursivelyScenarios';
import { compareMovesIgnoringCircular } from './TestUtils';

describe('linkAllMovesRecursively', () => {
  test.each(linkAllMovesRecursivelyScenarios)('$name', ({ input, expected }) => {
    const result = JSON.parse(JSON.stringify(input));

    linkAllMovesRecursively(result);

    // Проверяем длину массива
    expect(result).toHaveLength(expected.length);

    // Проверяем каждый элемент рекурсивно
    for (let i = 0; i < expected.length; i++) {
      expect(compareMovesIgnoringCircular(result[i], expected[i])).toBe(true);
    }
  });
});