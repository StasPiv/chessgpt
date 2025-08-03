import { addVariationToHistory } from '../src/utils/AddVariationToHistory';
import { removeNextAndPreviousReferences } from './TestUtils';
// ==================== TEST DATA ====================
import { addVariationToHistoryScenarios } from './data/AddVariationToHistoryScenarios';

// ==================== TESTS ====================

describe('addVariationToHistory', () => {
  test.each(addVariationToHistoryScenarios)('$name', ({ input, expected }) => {
    const result = addVariationToHistory(input.newMove, input.currentMove, input.history);

    // Удаляем циклические ссылки next и previous перед сравнением
    const cleanedHistory = removeNextAndPreviousReferences(result.updatedHistory);

    // Используем toEqual для сравнения после удаления циклических ссылок
    expect(cleanedHistory).toEqual(expected.updatedHistory);
  });
});
