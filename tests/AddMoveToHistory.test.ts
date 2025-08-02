import { addMoveToHistory } from '../src/utils/AddMoveToHistory';
import { removeNextAndPreviousReferences } from './TestUtils';
// ==================== TEST DATA ====================
import { addMoveToHistoryScenarios } from './data/AddMoveToHistoryScenarios';

// ==================== TESTS ====================

describe('addMoveToHistory', () => {
  test.each(addMoveToHistoryScenarios)('$name', ({ input, expected }) => {
    const result = addMoveToHistory(input.newMove, input.currentMove, input.history);

    // Удаляем циклические ссылки next и previous перед сравнением
    const cleanedCurrentMove = removeNextAndPreviousReferences(result.updatedCurrentMove);
    const cleanedHistory = removeNextAndPreviousReferences(result.updatedHistory);

    // Используем toEqual для сравнения после удаления циклических ссылок
    expect(cleanedCurrentMove).toEqual(expected.updatedCurrentMove);
    expect(cleanedHistory).toEqual(expected.updatedHistory);
  });
});