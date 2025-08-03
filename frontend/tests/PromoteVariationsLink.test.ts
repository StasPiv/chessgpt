import { promoteVariationLink } from '../src/utils/PromoteVariationLink';
// ==================== TEST DATA ====================
import { promoteVariationScenariosLink } from './data/PromoteVariationScenariosLink';

// ==================== HELPER FUNCTIONS ====================

// Дополнительная проверка для промоции вариаций
// ==================== TESTS ====================

describe('promoteVariationLink', () => {
  test.each(promoteVariationScenariosLink)('$name', ({ input, expected }) => {
    const updatedHistory = promoteVariationLink(input.currentMove, input.history);

    // Прямое сравнение объектов - покажет точные различия
    expect(updatedHistory).toEqual(expected);
  });
});