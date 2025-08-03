
import {
  processMoveHierarchy,
  getMoveClasses,
  isProcessedMove,
  isBracketItem
} from '../src/utils/ChessMoveProcessing';

// ==================== TEST DATA ====================

const testScenarios = [
  {
    name: 'simple line without variations',
    input: {
      moves: [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' },
        { globalIndex: 1, san: 'e5', ply: 2, fen: 'fen2' },
        { globalIndex: 2, san: 'Nf3', ply: 3, fen: 'fen3' }
      ],
      currentMoveIndex: 1
    },
    expected: [
      'move:1.e4',
      'move:e5:current',
      'move:2.Nf3'
    ]
  },

  {
    name: 'line with single variation',
    input: {
      moves: [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' },
        {
          globalIndex: 1,
          san: 'e5',
          ply: 2,
          fen: 'fen2',
          variations: [
            [
              { globalIndex: 2, san: 'c5', ply: 2, fen: 'fen2a' },
              { globalIndex: 3, san: 'Nf3', ply: 3, fen: 'fen3a' }
            ]
          ]
        },
        { globalIndex: 4, san: 'Nf3', ply: 3, fen: 'fen3' }
      ],
      currentMoveIndex: 0
    },
    expected: [
      'move:1.e4:current',
      'move:e5',
      'bracket:open',
      'move:1...c5',
      'move:2.Nf3',
      'bracket:close',
      'move:2.Nf3'
    ]
  },

  {
    name: 'nested variations (2 levels)',
    input: {
      moves: [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' },
        {
          globalIndex: 1,
          san: 'e5',
          ply: 2,
          fen: 'fen2',
          variations: [
            [
              {
                globalIndex: 2,
                san: 'c5',
                ply: 2,
                fen: 'fen2a',
                variations: [
                  [
                    { globalIndex: 3, san: 'd6', ply: 2, fen: 'fen2b' }
                  ]
                ]
              }
            ]
          ]
        }
      ],
      currentMoveIndex: 3
    },
    expected: [
      'move:1.e4',
      'move:e5',
      'bracket:open',
      'move:1...c5',
      'bracket:open',
      'move:1...d6:current',
      'bracket:close',
      'bracket:close'
    ]
  },

  {
    name: 'multiple variations at same level',
    input: {
      moves: [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' },
        {
          globalIndex: 1,
          san: 'e5',
          ply: 2,
          fen: 'fen2',
          variations: [
            [{ globalIndex: 2, san: 'c5', ply: 2, fen: 'fen2a' }],
            [{ globalIndex: 3, san: 'c6', ply: 2, fen: 'fen2b' }],
            [{ globalIndex: 4, san: 'd6', ply: 2, fen: 'fen2c' }]
          ]
        }
      ],
      currentMoveIndex: null
    },
    expected: [
      'move:1.e4',
      'move:e5',
      'bracket:open',
      'move:1...c5',
      'bracket:close',
      'bracket:open',
      'move:1...c6',
      'bracket:close',
      'bracket:open',
      'move:1...d6',
      'bracket:close'
    ]
  },

  {
    name: 'complex nested structure with multiple branches',
    input: {
      moves: [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' },
        {
          globalIndex: 1,
          san: 'e5',
          ply: 2,
          fen: 'fen2',
          variations: [
            [
              { globalIndex: 2, san: 'c5', ply: 2, fen: 'fen2a' },
              {
                globalIndex: 3,
                san: 'Nf3',
                ply: 3,
                fen: 'fen3a',
                variations: [
                  [{ globalIndex: 4, san: 'Nc3', ply: 3, fen: 'fen3b' }]
                ]
              }
            ],
            [{ globalIndex: 5, san: 'Nf6', ply: 2, fen: 'fen2b' }]
          ]
        },
        { globalIndex: 6, san: 'Nf3', ply: 3, fen: 'fen3' }
      ],
      currentMoveIndex: 4
    },
    expected: [
      'move:1.e4',
      'move:e5',
      'bracket:open',
      'move:1...c5',
      'move:2.Nf3',
      'bracket:open',
      'move:2.Nc3:current',
      'bracket:close',
      'bracket:close',
      'bracket:open',
      'move:1...Nf6',
      'bracket:close',
      'move:2.Nf3'
    ]
  },

  {
    name: 'current move in main line with variations present',
    input: {
      moves: [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' },
        {
          globalIndex: 1,
          san: 'e5',
          ply: 2,
          fen: 'fen2',
          variations: [
            [{ globalIndex: 2, san: 'c5', ply: 2, fen: 'fen2a' }]
          ]
        },
        { globalIndex: 3, san: 'Nf3', ply: 3, fen: 'fen3' }
      ],
      currentMoveIndex: 3
    },
    expected: [
      'move:1.e4',
      'move:e5',
      'bracket:open',
      'move:1...c5',
      'bracket:close',
      'move:2.Nf3:current'
    ]
  },

  {
    name: 'empty input',
    input: {
      moves: [],
      currentMoveIndex: null
    },
    expected: []
  },

  {
    name: 'single move',
    input: {
      moves: [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' }
      ],
      currentMoveIndex: 0
    },
    expected: [
      'move:1.e4:current'
    ]
  }
];

const cssClassScenarios = [
  {
    name: 'regular move',
    input: {
      globalIndex: 0,
      display: '1.e4',
      level: 0,
      isVariation: false,
      isCurrent: false,
      path: [0],
      san: 'e4',
      fen: 'test'
    },
    expected: 'move-item'
  },
  {
    name: 'current move',
    input: {
      globalIndex: 0,
      display: '1.e4',
      level: 0,
      isVariation: false,
      isCurrent: true,
      path: [0],
      san: 'e4',
      fen: 'test'
    },
    expected: 'move-item current'
  },
  {
    name: 'variation move',
    input: {
      globalIndex: 2,
      display: 'c5',
      level: 1,
      isVariation: true,
      isCurrent: false,
      path: [0, 1, 0],
      san: 'c5',
      fen: 'test'
    },
    expected: 'move-item variation-move variation-level-1'
  },
  {
    name: 'current variation move',
    input: {
      globalIndex: 2,
      display: 'c5',
      level: 1,
      isVariation: true,
      isCurrent: true,
      path: [0, 1, 0],
      san: 'c5',
      fen: 'test'
    },
    expected: 'move-item current variation-move variation-level-1'
  }
];

// ==================== HELPER FUNCTIONS ====================

function serializeRenderArray(result: any[]): string[] {
  return result.map(item => {
    if (isProcessedMove(item)) {
      const parts = ['move', item.display];

      if (item.isCurrent) {
        parts.push('current');
      }

      return parts.join(':');
    }

    if (isBracketItem(item)) {
      return `bracket:${item.bracketType}`;
    }

    return 'unknown';
  });
}

// Минимальная функция для создания полного ChessMove объекта из простых данных
function expandMove(simpleMove: any): any {
  return {
    san: simpleMove.san,
    fen: simpleMove.fen,
    from: 'e2',
    to: 'e4',
    piece: 'p',
    flags: 'b',
    lan: 'e2e4',
    before: 'fen_before',
    after: simpleMove.fen,
    next: null,
    globalIndex: simpleMove.globalIndex,
    ply: simpleMove.ply,
    variations: simpleMove.variations?.map((variation: any[]) =>
        variation.map((move: any) => expandMove(move))
    )
  };
}

// ==================== TESTS ====================

describe('ChessMoveProcessing', () => {
  describe('processMoveHierarchy - input/output behavior', () => {
    test.each(testScenarios)('$name', ({ input, expected }) => {
      const expandedMoves = input.moves.map(expandMove);
      const result = processMoveHierarchy(expandedMoves, input.currentMoveIndex);
      const serialized = serializeRenderArray(result);

      expect(serialized).toEqual(expected);
    });
  });

  describe('getMoveClasses - CSS class generation', () => {
    test.each(cssClassScenarios)('$name', ({ input, expected }) => {
      expect(getMoveClasses(input)).toBe(expected);
    });
  });

  describe('type guards', () => {
    test('correctly identify different item types', () => {
      const moves = [
        { globalIndex: 0, san: 'e4', ply: 1, fen: 'fen1' },
        {
          globalIndex: 1,
          san: 'e5',
          ply: 2,
          fen: 'fen2',
          variations: [
            [{ globalIndex: 2, san: 'c5', ply: 2, fen: 'fen2a' }]
          ]
        }
      ].map(expandMove);

      const result = processMoveHierarchy(moves, 0);

      const moveItems = result.filter(isProcessedMove);
      const bracketItems = result.filter(isBracketItem);

      expect(moveItems.length).toBeGreaterThan(0);
      expect(bracketItems.length).toBeGreaterThan(0);
      expect(moveItems.length + bracketItems.length).toBe(result.length);
    });
  });
});