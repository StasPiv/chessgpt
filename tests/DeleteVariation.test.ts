import { deleteVariation } from '../src/utils/DeleteVariation';
// ==================== TEST DATA ====================
import { deleteVariationScenarios } from './data/DeleteVariationScenarios';

// ==================== HELPER FUNCTIONS ====================

// Дополнительная проверка для удаления вариаций
// ==================== TESTS ====================

describe('deleteVariation', () => {
  test.each(deleteVariationScenarios)('$name', ({ input, expected }) => {
    const updatedHistory = deleteVariation(input.currentMove, input.history);

    // Прямое сравнение объектов - покажет точные различия
    expect(updatedHistory).toEqual(expected);
  });
});