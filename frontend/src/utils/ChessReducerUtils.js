
const DEFAULT_START_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Get the starting position from PGN headers or default
 */
export function getStartPosition(pgnHeaders) {
    return pgnHeaders?.FEN || DEFAULT_START_POSITION;
}

/**
 * Find move object by global index in history
 */
export function findMoveByGlobalIndex(history, globalIndex) {
    if (globalIndex === -1) {
        return null;
    }

    function searchInHistory(moves) {
        for (const move of moves) {
            if (move.globalIndex === globalIndex) {
                return move;
            }

            // Search in variations
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    const moveInVariation = searchInHistory(variation);
                    if (moveInVariation) {
                        return moveInVariation;
                    }
                }
            }
        }
        return null;
    }

    return searchInHistory(history);
}

/**
 * Find FEN by global index in history
 */
export function findFenByGlobalIndex(history, globalIndex, startPosition) {
    if (globalIndex === -1) {
        return startPosition;
    }
    
    function searchInHistory(moves) {
        for (const move of moves) {
            if (move.globalIndex === globalIndex) {
                return move.fen;
            }
            
            // Search in variations
            if (move.variations && move.variations.length > 0) {
                for (const variation of move.variations) {
                    const fenInVariation = searchInHistory(variation);
                    if (fenInVariation) {
                        return fenInVariation;
                    }
                }
            }
        }
        return null;
    }
    
    return searchInHistory(history) || startPosition;
}

/**
 * Extract PGN headers from PGN string
 */
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

/**
 * Get default start position constant
 */
export function getDefaultStartPosition() {
    return DEFAULT_START_POSITION;
}
