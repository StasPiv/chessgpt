
import {
  processMoveHierarchy,
  getMoveClasses,
  isProcessedMove,
  isBracketItem,
  ProcessedMove,
  BracketItem
} from '../src/utils/ChessMoveProcessing';
import { ChessMove } from '../src/types';

describe('ChessMoveProcessing', () => {
  const createTestMove = (overrides: Partial<ChessMove> = {}): ChessMove => ({
    // Обязательные свойства
    san: 'e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    from: 'e2',
    to: 'e4',
    piece: 'p',
    flags: 'b',
    lan: 'e2e4',
    before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    next: null,

    // Дополнительные свойства
    globalIndex: 0,
    ply: 1,

    // Переопределяем значениями из параметра
    ...overrides
  });

  describe('processMoveHierarchy', () => {
    test('processes simple move sequence correctly', () => {
      const moves: ChessMove[] = [
        createTestMove({
          globalIndex: 0,
          san: 'e4',
          ply: 1,
          from: 'e2',
          to: 'e4'
        }),
        createTestMove({
          globalIndex: 1,
          san: 'e5',
          ply: 2,
          from: 'e7',
          to: 'e5',
          piece: 'P'
        })
      ];

      const result = processMoveHierarchy(moves, 0);

      expect(result).toHaveLength(2);

      const firstMove = result[0];
      if (isProcessedMove(firstMove)) {
        expect(firstMove.display).toBe('1.e4');
        expect(firstMove.isCurrent).toBe(true);
        expect(firstMove.level).toBe(0);
        expect(firstMove.isVariation).toBe(false);
      }

      const secondMove = result[1];
      if (isProcessedMove(secondMove)) {
        expect(secondMove.display).toBe('e5');
        expect(secondMove.isCurrent).toBe(false);
        expect(secondMove.level).toBe(0);
      }
    });

    test('handles empty moves array', () => {
      const result = processMoveHierarchy([], null);
      expect(result).toHaveLength(0);
    });
  });

  describe('getMoveClasses', () => {
    test('generates correct classes for regular move', () => {
      const move: ProcessedMove = {
        globalIndex: 0,
        display: '1.e4',
        level: 0,
        isVariation: false,
        isCurrent: false,
        path: [0],
        san: 'e4',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      };

      const classes = getMoveClasses(move);
      expect(classes).toBe('move-item');
    });

    test('generates correct classes for current move', () => {
      const move: ProcessedMove = {
        globalIndex: 0,
        display: '1.e4',
        level: 0,
        isVariation: false,
        isCurrent: true,
        path: [0],
        san: 'e4',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      };

      const classes = getMoveClasses(move);
      expect(classes).toBe('move-item current');
    });
  });

  describe('type guards', () => {
    test('isProcessedMove correctly identifies moves', () => {
      const move: ProcessedMove = {
        globalIndex: 0,
        display: '1.e4',
        level: 0,
        isVariation: false,
        isCurrent: false,
        path: [0],
        san: 'e4',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      };

      expect(isProcessedMove(move)).toBe(true);
    });

    test('isBracketItem correctly identifies brackets', () => {
      const bracket: BracketItem = {
        type: 'bracket',
        bracketType: 'open',
        level: 0,
        path: [0],
        variationIndex: 0,
        parentMoveIndex: 0
      };

      expect(isBracketItem(bracket)).toBe(true);
      expect(isProcessedMove(bracket)).toBe(false);
    });
  });
});