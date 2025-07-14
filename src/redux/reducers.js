import { Chess } from 'cm-chess';
import { cleanPgn } from './cleanPgn.js';
import { 
    LOAD_PGN, 
    ADD_MOVE, 
    GOTO_MOVE, 
    GOTO_FIRST, 
    GOTO_LAST, 
    GOTO_PREVIOUS, 
    GOTO_NEXT,
} from './actions.js';

const START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Function to extract PGN headers
export function extractPgnHeaders(pgn) {
    const headers = {};
    const lines = pgn.split('\n');
    
    for (const line of lines) {
        const match = line.match(/^\[(\w+)\s+"(.*)"\]$/);
        if (match) {
            headers[match[1]] = match[2];
        }
    }
    
    return headers;
}

// Fixed function to create position based on path through variations
export function createPositionFromPath(history, path) {
    const newGame = new Chess();
    newGame.load(START_POSITION);
    
    if (!path || path.length === 0) {
        return newGame;
    }
    
    try {
        // Walk through the path and execute moves
        for (const step of path) {
            if (step.type === 'main' && step.index >= 0) {
                // Main line - play all moves up to specified index
                for (let i = 0; i <= step.index && i < history.length; i++) {
                    newGame.move(history[i]);
                }
            } else if (step.type === 'variation' && step.variationIndex >= 0) {
                // Find parent move and its variations
                const parentMove = findMoveByPath(history, path.slice(0, path.indexOf(step)));
                if (parentMove && parentMove.variations && 
                    parentMove.variations[step.variationIndex]) {
                    // Play all moves in variation up to specified move
                    const variation = parentMove.variations[step.variationIndex];
                    for (let i = 0; i < variation.length; i++) {
                        newGame.move(variation[i]);
                        // If this is the target move, stop
                        const nextStep = path[path.indexOf(step) + 1];
                        if (nextStep && nextStep.type === 'move' && nextStep.moveIndex === i) {
                            break;
                        }
                    }
                }
            }
        }
        
        return newGame;
    } catch (error) {
        console.error('Error creating position from path:', error);
        return newGame;
    }
}

// Function to find move by path
export function findMoveByPath(history, path) {
    if (!path || path.length === 0) return null;
    
    let currentMoves = history;
    let currentMove = null;
    
    for (const step of path) {
        if (step.type === 'main' && step.index >= 0 && step.index < currentMoves.length) {
            currentMove = currentMoves[step.index];
            currentMoves = currentMove.variations || [];
        } else if (step.type === 'variation' && step.variationIndex >= 0 && 
                   step.variationIndex < currentMoves.length) {
            currentMove = currentMoves[step.variationIndex];
            if (Array.isArray(currentMove)) {
                currentMoves = currentMove;
            }
        }
    }
    
    return currentMove;
}

// Improved function to create position from variation
export function createPositionFromVariation(history, variationPath) {
    const newGame = new Chess();
    newGame.load(START_POSITION);
    
    if (!variationPath || variationPath.length === 0) {
        return newGame;
    }
    
    try {
        // Find parent move for variation
        const parentPath = variationPath.slice(0, -1);
        const lastStep = variationPath[variationPath.length - 1];
        
        // Play main line up to parent move
        let parentMoveIndex = -1;
        for (const step of parentPath) {
            if (step.type === 'main') {
                parentMoveIndex = step.index;
                break;
            }
        }
        
        // Play main line moves up to branching point
        for (let i = 0; i <= parentMoveIndex && i < history.length; i++) {
            newGame.move(history[i]);
        }
        
        // If last step points to move in variation
        if (lastStep.type === 'move' && parentMoveIndex >= 0 && parentMoveIndex < history.length) {
            const parentMove = history[parentMoveIndex];
            if (parentMove.variations) {
                // Find needed variation
                const variationStep = variationPath.find(step => step.type === 'variation');
                if (variationStep && variationStep.variationIndex >= 0 && 
                    variationStep.variationIndex < parentMove.variations.length) {
                    const variation = parentMove.variations[variationStep.variationIndex];
                    
                    // Play moves in variation up to needed move
                    for (let i = 0; i <= lastStep.moveIndex && i < variation.length; i++) {
                        newGame.move(variation[i]);
                    }
                }
            }
        }
        
        return newGame;
    } catch (error) {
        console.error('Error creating position from variation:', error);
        return newGame;
    }
}

// Function to create game from history up to certain index
export function createGameFromHistory(history, moveIndex) {
    const newGame = new Chess();
    newGame.load(START_POSITION);
    
    if (moveIndex >= 0) {
        for (let i = 0; i <= moveIndex && i < history.length; i++) {
            newGame.move(history[i]);
        }
    }
    
    return newGame;
}

// PGN loading handler
export function handleLoadPgn(state, action) {
    try {
        const newGame = new Chess();
        newGame.load(START_POSITION);
        const cleanedPgn = cleanPgn(action.payload);
        if (!cleanedPgn) {
            return state;
        }

        const pgnHeaders = extractPgnHeaders(cleanedPgn);
        newGame.loadPgn(cleanedPgn, { sloppy: true });
        const loadedHistory = newGame.history({ verbose: true, variations: true });
        
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            history: loadedHistory,
            fullHistory: loadedHistory,
            currentMoveIndex: loadedHistory.length - 1,
            currentVariationPath: [],
            currentVariationIndex: null,
            pgnHeaders: pgnHeaders
        };
    } catch (error) {
        console.error('Error loading PGN:', error);
        return state;
    }
}

// Add move handler
export function handleAddMove(state, action) {
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
                
                return {
                    ...state,
                    game: newGame,
                    fen: newGame.fen(),
                    history: newHistory,
                    fullHistory: newHistory,
                    currentMoveIndex: state.currentMoveIndex, // Stay at current position
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
export function handleGotoMove(state, action) {
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

// Handler for going to first move
export function handleGotoFirst(state) {
    try {
        const newGame = new Chess();
        newGame.load(START_POSITION);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: -1,
            currentVariationPath: [],
            currentVariationIndex: null,
            history: state.fullHistory
        };
    } catch (error) {
        console.error('Error in GOTO_FIRST:', error);
        return state;
    }
}

// Handler for going to last move
export function handleGotoLast(state) {
    try {
        const lastHistory = state.fullHistory;
        const newGame = createGameFromHistory(lastHistory, lastHistory.length - 1);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: lastHistory.length - 1,
            currentVariationPath: [],
            currentVariationIndex: null,
            history: lastHistory
        };
    } catch (error) {
        console.error('Error in GOTO_LAST:', error);
        return state;
    }
}

// Handler for going to previous move
export function handleGotoPrevious(state) {
    try {
        const prevIndex = Math.max(-1, state.currentMoveIndex - 1);
        const prevHistory = state.fullHistory;
        const newGame = createGameFromHistory(prevHistory, prevIndex);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: prevIndex,
            history: prevHistory
        };
    } catch (error) {
        console.error('Error in GOTO_PREVIOUS:', error);
        return state;
    }
}

// Handler for going to next move
export function handleGotoNext(state) {
    try {
        const nextIndex = Math.min(state.fullHistory.length - 1, state.currentMoveIndex + 1);
        const nextHistory = state.fullHistory;
        const newGame = createGameFromHistory(nextHistory, nextIndex);
        return {
            ...state,
            game: newGame,
            fen: newGame.fen(),
            currentMoveIndex: nextIndex,
            history: nextHistory
        };
    } catch (error) {
        console.error('Error in GOTO_NEXT:', error);
        return state;
    }
}

const initialState = {
    game: new Chess(),
    fen: START_POSITION,
    history: [],
    fullHistory: [],
    currentMoveIndex: -1,
    currentVariationPath: [], // Path through variations
    currentVariationIndex: null, // Index of current variation
    pgnHeaders: {}
};

export function chessReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_PGN:
            return handleLoadPgn(state, action);

        case ADD_MOVE:
            return handleAddMove(state, action);

        case GOTO_MOVE:
            return handleGotoMove(state, action);

        case GOTO_FIRST:
            return handleGotoFirst(state);

        case GOTO_LAST:
            return handleGotoLast(state);

        case GOTO_PREVIOUS:
            return handleGotoPrevious(state);

        case GOTO_NEXT:
            return handleGotoNext(state);

        default:
            return state;
    }
}