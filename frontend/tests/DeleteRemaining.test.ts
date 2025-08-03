import { deleteRemaining } from '../src/utils/DeleteRemaining';
// ==================== TEST DATA ====================
import { deleteRemainingScenarios } from './data/DeleteRemainingScenarios';

// ==================== HELPER FUNCTIONS ====================

// Дополнительная проверка для удаления вариаций
// ==================== TESTS ====================

describe('deleteRemaining', () => {
  test.each(deleteRemainingScenarios)('$name', ({ input, expected }) => {
    const updatedHistory = deleteRemaining(input.currentMove, input.history);

    // Прямое сравнение объектов - покажет точные различия
    expect(updatedHistory).toEqual(expected);
  });
});