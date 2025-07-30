export const addVariationToHistoryScenarios = [
    {
        name: 'add first variation to move',
        input: {
            newMove: {
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
                after: 'fen1',
                next: {
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
                }
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
                },
                {
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
                }
            ]
        },
        expected: {
            updatedHistory: [
                {
                    san: 'e4',
                    globalIndex: 0,
                    ply: 1
                },
                {
                    san: 'e5',
                    globalIndex: 1,
                    ply: 2,
                    variations: [
                        [
                            {
                                san: 'c5',
                                globalIndex: 1000,
                                ply: 2
                            }
                        ]
                    ]
                }
            ]
        }
    },

    {
        name: 'add second variation to move with existing variations',
        input: {
            newMove: {
                san: 'Nf6',
                globalIndex: 2000,
                ply: 2,
                fen: 'fen2var2',
                from: 'g8',
                to: 'f6',
                piece: 'n',
                flags: 'n',
                lan: 'g8f6',
                before: 'fen1',
                after: 'fen2var2'
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
                after: 'fen1',
                next: {
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
                }
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
                },
                {
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
                    after: 'fen2',
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
            updatedHistory: [
                {
                    san: 'e4',
                    globalIndex: 0,
                    ply: 1
                },
                {
                    san: 'e5',
                    globalIndex: 1,
                    ply: 2,
                    variations: [
                        [
                            {
                                san: 'c5',
                                globalIndex: 1000,
                                ply: 2
                            }
                        ],
                        [
                            {
                                san: 'Nf6',
                                globalIndex: 2000,
                                ply: 2
                            }
                        ]
                    ]
                }
            ]
        }
    }
];