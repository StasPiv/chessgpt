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
                    "after": "fen1",
                    "before": "start_fen",
                    "fen": "fen1",
                    "flags": "b",
                    "from": "e2",
                    "globalIndex": 0,
                    "lan": "e2e4",
                    "piece": "p",
                    "ply": 1,
                    "san": "e4",
                    "to": "e4"
                },
                {
                    "after": "fen2",
                    "before": "fen1",
                    "fen": "fen2",
                    "flags": "b",
                    "from": "e7",
                    "globalIndex": 1,
                    "lan": "e7e5",
                    "piece": "p",
                    "ply": 2,
                    "san": "e5",
                    "to": "e5",
                    "variations": [
                        [
                            {
                                "after": "fen2var",
                                "before": "fen1",
                                "fen": "fen2var",
                                "flags": "b",
                                "from": "c7",
                                "globalIndex": 1000,
                                "lan": "c7c5",
                                "piece": "p",
                                "ply": 2,
                                "san": "c5",
                                "to": "c5"
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
                    "after": "fen1",
                    "before": "start_fen",
                    "fen": "fen1",
                    "flags": "b",
                    "from": "e2",
                    "globalIndex": 0,
                    "lan": "e2e4",
                    "piece": "p",
                    "ply": 1,
                    "san": "e4",
                    "to": "e4"
                },
                {
                    "after": "fen2",
                    "before": "fen1",
                    "fen": "fen2",
                    "flags": "b",
                    "from": "e7",
                    "globalIndex": 1,
                    "lan": "e7e5",
                    "piece": "p",
                    "ply": 2,
                    "san": "e5",
                    "to": "e5",
                    "variations": [
                        [
                            {
                                "after": "fen2var",
                                "before": "fen1",
                                "fen": "fen2var",
                                "flags": "b",
                                "from": "c7",
                                "globalIndex": 1000,
                                "lan": "c7c5",
                                "piece": "p",
                                "ply": 2,
                                "san": "c5",
                                "to": "c5"
                            }
                        ],
                        [
                            {
                                "after": "fen2var2",
                                "before": "fen1",
                                "fen": "fen2var2",
                                "flags": "n",
                                "from": "g8",
                                "globalIndex": 2000,
                                "lan": "g8f6",
                                "piece": "n",
                                "ply": 2,
                                "san": "Nf6",
                                "to": "f6"
                            }
                        ]
                    ]
                }
            ]
        }
    }
];