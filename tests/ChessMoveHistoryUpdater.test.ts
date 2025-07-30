import { addMoveToHistory, addVariationToHistory } from '../src/utils/ChessMoveHistoryUpdater';
import { ChessMove } from '../src/types';
// ==================== TEST DATA ====================
import { addMoveToHistoryScenarios } from './data/AddMoveToHistoryScenarios';
import { addVariationToHistoryScenarios } from './data/AddVariationToHistoryScenarios';

// ==================== HELPER FUNCTIONS ====================

function createChessMove(data: any): ChessMove {
  return {
    san: data.san,
    fen: data.fen || 'default_fen',
    from: data.from || 'a1',
    to: data.to || 'a2',
    piece: data.piece || 'p',
    captured: data.captured,
    promotion: data.promotion,
    flags: data.flags || 'n',
    lan: data.lan || 'a1a2',
    before: data.before || 'before_fen',
    after: data.after || 'after_fen',
    next: data.next ? createChessMove(data.next) : undefined,
    globalIndex: data.globalIndex,
    ply: data.ply,
    variations: data.variations?.map((variation: any[]) => 
      variation.map((varMove: any) => createChessMove(varMove))
    )
  };
}

function deepCloneHistory(history: any[]): ChessMove[] {
  return history.map(move => createChessMove(move));
}

function compareMove(actual: ChessMove, expected: any): boolean {
  if (actual.san !== expected.san) return false;
  if (actual.globalIndex !== expected.globalIndex) return false;
  if (actual.ply !== expected.ply) return false;
  
  if (expected.next) {
    if (!actual.next) return false;
    if (!compareMove(actual.next, expected.next)) return false;
  }
  
  if (expected.variations) {
    if (!actual.variations) return false;
    if (actual.variations.length !== expected.variations.length) return false;
    
    for (let i = 0; i < expected.variations.length; i++) {
      const actualVar = actual.variations[i];
      const expectedVar = expected.variations[i];
      
      if (actualVar.length !== expectedVar.length) return false;
      
      for (let j = 0; j < expectedVar.length; j++) {
        if (!compareMove(actualVar[j], expectedVar[j])) return false;
      }
    }
  }
  
  return true;
}

function compareHistory(actual: ChessMove[], expected: any[]): boolean {
  if (actual.length !== expected.length) return false;
  
  for (let i = 0; i < expected.length; i++) {
    if (!compareMove(actual[i], expected[i])) return false;
  }
  
  return true;
}

// ==================== TESTS ====================

describe('ChessMoveHistoryUpdater', () => {
  describe('addMoveToHistory', () => {
    test.each(addMoveToHistoryScenarios)('$name', ({ input, expected }) => {
      const newMove = createChessMove(input.newMove);
      const currentMove = input.currentMove ? createChessMove(input.currentMove) : null;
      const history = deepCloneHistory(input.history);

      const result = addMoveToHistory(newMove, currentMove, history);

      expect(compareMove(result.updatedCurrentMove, expected.updatedCurrentMove)).toBe(true);
      expect(compareHistory(result.updatedHistory, expected.updatedHistory)).toBe(true);
    });
  });

  describe('addVariationToHistory', () => {
    test.each(addVariationToHistoryScenarios)('$name', ({ input, expected }) => {
      const newMove = createChessMove(input.newMove);
      const currentMove = createChessMove(input.currentMove);
      const history = deepCloneHistory(input.history);

      const result = addVariationToHistory(newMove, currentMove, history);

      expect(compareHistory(result.updatedHistory, expected.updatedHistory)).toBe(true);
    });
  });
});