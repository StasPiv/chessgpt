import { Chess } from 'cm-chess';
import { ADD_MOVE, GOTO_MOVE } from './actions.js';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    fullHistory: [],
    currentMoveIndex: -1,
    currentVariationPath: [],
    currentVariationIndex: null,
    pgnHeaders: {}
};

// Function to create game from history up to certain index
function createGameFromHistory(history, moveIndex) {
    const newGame = new Chess();
    newGame.load(START_POSITION);
    
    if (moveIndex >= 0) {
        for (let i = 0; i <= moveIndex && i < history.length; i++) {
            newGame.move(history[i]);
        }
    }
    
    return newGame;
}

// Function to calculate global index for a move in variation
function calculateGlobalIndex(fullHistory, variationPath) {
    const BLOCK_SIZE = 1000;
    
    if (!variationPath || variationPath.length === 0) {
        // Main line move
        return fullHistory.length - 1;
    }
    
    // For variation moves, we need to find which block this variation belongs to
    // This is a simplified calculation - in reality, we need to count variations before this one
    
    // For now, let's use a simple approach:
    // Block 0: main line (0-999)
    // Block 1: first variation (1000-1999)
    // Block 2: second variation (2000-2999), etc.
    
    const mainStep = variationPath[0];
    const variationStep = variationPath[1];
    const moveStep = variationPath[2];
    
    // Count how many variations exist before this one in the entire history
    let variationCount = 0;
    for (let i = 0; i < fullHistory.length; i++) {
        if (fullHistory[i].variations) {
            if (i < mainStep.index) {
                variationCount += fullHistory[i].variations.length;
            } else if (i === mainStep.index) {
                variationCount += variationStep.variationIndex;
            }
        }
    }
    
    // Each variation gets its own block
    const blockIndex = variationCount + 1; // +1 because block 0 is main line
    const blockStart = blockIndex * BLOCK_SIZE;
    
    return blockStart + moveStep.moveIndex;
}

// Add move handler
function handleAddMove(state, action) {
    try {
        const newGame = new Chess(state.fen);
        const move = newGame.move(action.payload);
        
        if (move === null) {
            console.log('Invalid move in reducer:', action.payload);
            return state;
        }

        // Check if we're currently in a variation
        if (state.currentVariationPath && state.currentVariationPath.length > 0) {
            // We're in a variation
            const newHistory = [...state.fullHistory];
            
            // Find the variation we're currently in
            const mainStep = state.currentVariationPath[0];
            const variationStep = state.currentVariationPath[1];
            const currentMoveStep = state.currentVariationPath[2];
            
            const parentMove = newHistory[mainStep.index];
            const variation = parentMove.variations[variationStep.variationIndex];
            
            // Check if we're at the end of the variation
            if (currentMoveStep.moveIndex === variation.length - 1) {
                // At the end of variation, add the move to the existing variation
                variation.push(move);
                
                // Create new variation path for the added move
                const newVariationPath = [
                    { type: 'main', index: mainStep.index },
                    { type: 'variation', variationIndex: variationStep.variationIndex },
                    { type: 'move', moveIndex: variation.length - 1 }
                ];
                
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    history: newHistory,
                    fullHistory: newHistory,
                    currentMoveIndex: state.currentMoveIndex, // Stay at the same main line position
                    currentVariationPath: newVariationPath,
                    currentVariationIndex: variationStep.variationIndex
                };
            } else {
                // We're in the middle of a variation, need to create a sub-variation
                const nextMoveIndex = currentMoveStep.moveIndex + 1;
                
                // Check if there's already a next move in the variation
                if (nextMoveIndex < variation.length) {
                    const nextMove = variation[nextMoveIndex];
                    
                    // Check if the new move is the same as the next move in variation
                    if (nextMove.from === move.from && nextMove.to === move.to && nextMove.promotion === move.promotion) {
                        // If it's the same move, just go to it
                        const newVariationPath = [
                            { type: 'main', index: mainStep.index },
                            { type: 'variation', variationIndex: variationStep.variationIndex },
                            { type: 'move', moveIndex: nextMoveIndex }
                        ];
                        
                        return {
                            ...state,
                            game: newGame,
                            fen: newGame.fen(),
                            currentVariationPath: newVariationPath
                        };
                    }
                    
                    // Create sub-variation - add the new move as an alternative to the existing next move
                    const moveToAddVariationTo = variation[nextMoveIndex];
                    
                    if (!moveToAddVariationTo.variations) {
                        moveToAddVariationTo.variations = [];
                    }
                    
                    // Add the new move as a sub-variation
                    moveToAddVariationTo.variations.push([move]);
                    
                    // Create path to the new sub-variation move
                    const subVariationPath = [
                        { type: 'main', index: mainStep.index },
                        { type: 'variation', variationIndex: variationStep.variationIndex },
                        { type: 'move', moveIndex: nextMoveIndex },
                        { type: 'variation', variationIndex: moveToAddVariationTo.variations.length - 1 },
                        { type: 'move', moveIndex: 0 }
                    ];
                    
                    return {
                        ...state,
                        game: newGame,
                        fen: newGame.fen(),
                        history: newHistory,
                        fullHistory: newHistory,
                        currentMoveIndex: state.currentMoveIndex,
                        currentVariationPath: subVariationPath,
                        currentVariationIndex: variationStep.variationIndex
                    };
                } else {
                    // No next move exists in variation, just add the move to variation
                    variation.push(move);
                    
                    // Create new variation path for the added move
                    const newVariationPath = [
                        { type: 'main', index: mainStep.index },
                        { type: 'variation', variationIndex: variationStep.variationIndex },
                        { type: 'move', moveIndex: variation.length - 1 }
                    ];
                    
                    return {
                        ...state,
                        game: newGame,
                        fen: newGame.fen(),
                        history: newHistory,
                        fullHistory: newHistory,
                        currentMoveIndex: state.currentMoveIndex,
                        currentVariationPath: newVariationPath,
                        currentVariationIndex: variationStep.variationIndex
                    };
                }
            }
        }

        // If we're at the end of history, just add the move
        if (state.currentMoveIndex === state.fullHistory.length - 1) {
            const newHistory = [...state.fullHistory, move];
            
            return {
                ...state,
                game: newGame,
                fen: newGame.fen(),
                history: newHistory,
                fullHistory: newHistory,
                currentMoveIndex: newHistory.length - 1,
                currentVariationPath: [],
                currentVariationIndex: null
            };
        } else {
            // If we're in the middle of history, create variation
            const nextMoveIndex = state.currentMoveIndex + 1;
            
            // Check if there's already a next move in the main line
            if (nextMoveIndex < state.fullHistory.length) {
                const nextMove = state.fullHistory[nextMoveIndex];
                
                // Check if the new move is the same as the next move in main line
                if (nextMove.from === move.from && nextMove.to === move.to && nextMove.promotion === move.promotion) {
                    // If it's the same move, just go to it
                    const gameAtNextMove = createGameFromHistory(state.fullHistory, nextMoveIndex);
                    return {
                        ...state,
                        game: gameAtNextMove,
                        fen: gameAtNextMove.fen(),
                        currentMoveIndex: nextMoveIndex,
                        currentVariationPath: [],
                        currentVariationIndex: null
                    };
                }
                
                // Create variation - add the new move as an alternative to the existing next move
                const newHistory = [...state.fullHistory];
                
                // The variation should be attached to the NEXT move (the one being replaced)
                const moveToAddVariationTo = newHistory[nextMoveIndex];
                
                if (!moveToAddVariationTo.variations) {
                    moveToAddVariationTo.variations = [];
                }
                
                // Add the new move as a variation to the next move
                moveToAddVariationTo.variations.push([move]);
                
                // Create path to the new variation move
                const variationPath = [
                    { type: 'main', index: nextMoveIndex },
                    { type: 'variation', variationIndex: moveToAddVariationTo.variations.length - 1 },
                    { type: 'move', moveIndex: 0 }
                ];
                
                // Calculate global index for the new variation move
                const newGlobalIndex = calculateGlobalIndex(newHistory, variationPath);
                
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    history: newHistory,
                    fullHistory: newHistory,
                    currentMoveIndex: newGlobalIndex, // Set to the new move's global index
                    currentVariationPath: variationPath,
                    currentVariationIndex: moveToAddVariationTo.variations.length - 1
                };
            } else {
                // No next move exists, just add the move to main line
                const newHistory = [...state.fullHistory, move];
                
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    history: newHistory,
                    fullHistory: newHistory,
                    currentMoveIndex: newHistory.length - 1,
                    currentVariationPath: [],
                    currentVariationIndex: null
                };
            }
        }
    } catch (error) {
        console.error('Error adding move:', error);
        return state;
    }
}

// Handler for going to specific move
function handleGoToMove(state, action) {
    try {
        const payload = action.payload;

        return {
            ...state,
            fen: payload.fen,
            currentMoveIndex: payload.globalIndex,
            currentVariationPath: [],
            currentVariationIndex: null,
            history: state.fullHistory
        };
    } catch (error) {
        console.error('Error in GOTO_MOVE:', error);
        return state;
    }
}

export function moveListReducer(state = initialState, action) {
    switch (action.type) {
        case ADD_MOVE:
            return handleAddMove(state, action);
        case GOTO_MOVE:
            return handleGoToMove(state, action);
        default:
            return state;
    }
}