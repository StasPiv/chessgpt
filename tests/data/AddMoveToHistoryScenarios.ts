export const addMoveToHistoryScenarios = [
  {
    name: 'add first move to empty history',
    input: {
      newMove: {
        san: 'e4',
        globalIndex: 0,
        ply: 1,
        fen: 'fen1',
        from: 'e2',
        to: 'e4',
        piece: 'p',
        flags: 'b',
        lan: 'e2e4',
        before: 'start_fen',
        after: 'fen1'
      },
      currentMove: null,
      history: []
    },
    expected: {
      updatedCurrentMove: {
        san: 'e4',
        globalIndex: 0,
        ply: 1
      },
      updatedHistory: [
        {
          san: 'e4',
          globalIndex: 0,
          ply: 1
        }
      ]
    }
  },

  {
    name: 'add second move to main line',
    input: {
      newMove: {
        san: 'e5',
        globalIndex: 1,
        ply: 2,
        fen: 'fen2',
        from: 'e7',
        to: 'e5',
        piece: 'p',
        flags: 'b',
        lan: 'e7e5',
        before: 'fen1',
        after: 'fen2'
      },
      currentMove: {
        san: 'e4',
        globalIndex: 0,
        ply: 1,
        fen: 'fen1',
        from: 'e2',
        to: 'e4',
        piece: 'p',
        flags: 'b',
        lan: 'e2e4',
        before: 'start_fen',
        after: 'fen1'
      },
      history: [
        {
          san: 'e4',
          globalIndex: 0,
          ply: 1,
          fen: 'fen1',
          from: 'e2',
          to: 'e4',
          piece: 'p',
          flags: 'b',
          lan: 'e2e4',
          before: 'start_fen',
          after: 'fen1'
        }
      ]
    },
    expected: {
      updatedCurrentMove: {
        san: 'e5',
        globalIndex: 1,
        ply: 2
      },
      updatedHistory: [
        {
          san: 'e4',
          globalIndex: 0,
          ply: 1,
          next: {
            san: 'e5',
            globalIndex: 1,
            ply: 2
          }
        },
        {
          san: 'e5',
          globalIndex: 1,
          ply: 2
        }
      ]
    }
  },

  {
    name: 'add move in variation',
    input: {
      newMove: {
        san: 'Nf3',
        globalIndex: 1001,
        ply: 3,
        fen: 'fen3var',
        from: 'g1',
        to: 'f3',
        piece: 'n',
        flags: 'n',
        lan: 'g1f3',
        before: 'fen2var',
        after: 'fen3var'
      },
      currentMove: {
        san: 'c5',
        globalIndex: 1000,
        ply: 2,
        fen: 'fen2var',
        from: 'c7',
        to: 'c5',
        piece: 'p',
        flags: 'b',
        lan: 'c7c5',
        before: 'fen1',
        after: 'fen2var'
      },
      history: [
        {
          san: 'e4',
          globalIndex: 0,
          ply: 1,
          fen: 'fen1',
          from: 'e2',
          to: 'e4',
          piece: 'p',
          flags: 'b',
          lan: 'e2e4',
          before: 'start_fen',
          after: 'fen1',
          variations: [
            [
              {
                san: 'c5',
                globalIndex: 1000,
                ply: 2,
                fen: 'fen2var',
                from: 'c7',
                to: 'c5',
                piece: 'p',
                flags: 'b',
                lan: 'c7c5',
                before: 'fen1',
                after: 'fen2var'
              }
            ]
          ]
        }
      ]
    },
    expected: {
      updatedCurrentMove: {
        san: 'Nf3',
        globalIndex: 1001,
        ply: 3
      },
      updatedHistory: [
        {
          san: 'e4',
          globalIndex: 0,
          ply: 1,
          variations: [
            [
              {
                san: 'c5',
                globalIndex: 1000,
                ply: 2,
                next: {
                  san: 'Nf3',
                  globalIndex: 1001,
                  ply: 3
                }
              },
              {
                san: 'Nf3',
                globalIndex: 1001,
                ply: 3
              }
            ]
          ]
        }
      ]
    }
  }
];
