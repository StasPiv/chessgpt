import {linkAllMovesRecursively} from '../src/utils/ChessHistoryUtils';
import { linkAllMovesRecursivelyScenarios } from './data/LinkAllMovesRecursivelyScenarios';

// Функция для рекурсивного сравнения ходов, проверяя только san и globalIndex для next/previous
function compareMovesIgnoringCircular(actual: any, expected: any): boolean {
  // Если оба null или undefined
  if (actual == null && expected == null) return true;
  if (actual == null || expected == null) return false;

  // Проверяем основные поля
  if (actual.san !== expected.san || actual.globalIndex !== expected.globalIndex) {
    return false;
  }

  // Проверяем next - только san и globalIndex
  if (expected.next) {
    if (!actual.next) return false;
    if (actual.next.san !== expected.next.san || actual.next.globalIndex !== expected.next.globalIndex) {
      return false;
    }
  } else {
    if (actual.next !== null) return false;
  }

  // Проверяем previous - только san и globalIndex
  if (expected.previous) {
    if (!actual.previous) return false;
    if (actual.previous.san !== expected.previous.san || actual.previous.globalIndex !== expected.previous.globalIndex) {
      return false;
    }
  } else {
    if (actual.previous !== null) return false;
  }

  // Проверяем variations рекурсивно
  if (expected.variations) {
    if (!actual.variations || !Array.isArray(actual.variations)) return false;
    if (actual.variations.length !== expected.variations.length) return false;

    for (let i = 0; i < expected.variations.length; i++) {
      const actualVariation = actual.variations[i];
      const expectedVariation = expected.variations[i];

      if (!Array.isArray(actualVariation) || !Array.isArray(expectedVariation)) return false;
      if (actualVariation.length !== expectedVariation.length) return false;

      for (let j = 0; j < expectedVariation.length; j++) {
        if (!compareMovesIgnoringCircular(actualVariation[j], expectedVariation[j])) {
          return false;
        }
      }
    }
  } else {
    // Если variations не ожидается, проверяем что его нет или он пустой
    if (actual.variations && actual.variations.length > 0) return false;
  }

  return true;
}

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