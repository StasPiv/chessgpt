import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoMoveAction, gotoVariationMoveAction } from '../redux/actions.js';
import './MoveList.css';
import GameHeader from "./GameHeader.js";

const MoveList = () => {
    const dispatch = useDispatch();
    const history = useSelector(state => state.chess.history);
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);
    const currentVariationPath = useSelector(state => state.chess.currentVariationPath);

    const handleMoveClick = (moveIndex) => {
        dispatch(gotoMoveAction(moveIndex));
    };

    const handleVariationMoveClick = (path) => {
        dispatch(gotoVariationMoveAction(path));
    };

    const handleStartPosition = () => {
        dispatch(gotoMoveAction(-1));
    };

    // Function to check if a move is current
    const isCurrentMove = (moveIndex, variationPath = []) => {
        if (variationPath.length === 0) {
            return moveIndex === currentMoveIndex && currentVariationPath.length === 0;
        }
        return JSON.stringify(variationPath) === JSON.stringify(currentVariationPath);
    };

    // Function to render variations
    const renderVariations = (variations, parentMoveIndex) => {
        if (!variations || variations.length === 0) return null;
        
        return variations.map((variation, varIndex) => (
            <span key={`var-${varIndex}`} className="variation">
                <span className="variation-bracket">(</span>
                {renderVariationSequence(variation, parentMoveIndex, varIndex)}
                <span className="variation-bracket">)</span>
            </span>
        ));
    };

    // Function to render move sequence in variation
    const renderVariationSequence = (moves, parentMoveIndex, variationIndex) => {
        return moves.map((move, moveIndex) => {
            // Fix logic for move number determination
            const parentMoveNumber = Math.floor(parentMoveIndex / 2) + 1;
            const isParentWhiteMove = parentMoveIndex % 2 === 0;
            
            const isFirstMoveInVariation = moveIndex === 0;
            
            let moveNumber, isWhiteMove, display;
            
            if (isFirstMoveInVariation) {
                // First move in variation - alternative to parent move
                if (isParentWhiteMove) {
                    // If parent move is white's move, variation offers alternative white move
                    moveNumber = parentMoveNumber;
                    isWhiteMove = true;
                    display = `${moveNumber}.${move.san}`;
                } else {
                    // If parent move is black's move, variation offers alternative black move
                    moveNumber = parentMoveNumber;
                    isWhiteMove = false;
                    display = `${moveNumber}...${move.san}`;
                }
            } else {
                // For subsequent moves in variation
                const movesFromStart = moveIndex;
                if (isParentWhiteMove) {
                    // Started with alternative white move, now moves alternate
                    isWhiteMove = movesFromStart % 2 === 0;
                    if (isWhiteMove) {
                        moveNumber = parentMoveNumber + Math.floor(movesFromStart / 2);
                        display = `${moveNumber}.${move.san}`;
                    } else {
                        moveNumber = parentMoveNumber + Math.floor((movesFromStart + 1) / 2);
                        display = move.san;
                    }
                } else {
                    // Started with alternative black move, now moves alternate
                    isWhiteMove = movesFromStart % 2 === 1;
                    if (isWhiteMove) {
                        moveNumber = parentMoveNumber + Math.floor((movesFromStart + 1) / 2);
                        display = `${moveNumber}.${move.san}`;
                    } else {
                        moveNumber = parentMoveNumber + Math.floor(movesFromStart / 2);
                        display = move.san;
                    }
                }
            }
            
            // Create path for this move in variation
            // FIX: for first move in variation parentMoveIndex should be one less
            const variationPath = [
                { type: 'main', index: parentMoveIndex },
                { type: 'variation', variationIndex: variationIndex },
                { type: 'move', moveIndex: moveIndex }
            ];
            
            return (
                <span key={`var-move-${moveIndex}`}>
                    <span 
                        className={`move-item variation-move ${isCurrentMove(moveIndex, variationPath) ? 'current' : ''}`}
                        onClick={() => handleVariationMoveClick(variationPath)}
                        title={`Variation move: ${display}`}
                    >
                        {display}
                    </span>
                    {move.variations && renderVariations(move.variations, 
                        parentMoveIndex + moveIndex)}
                    {moveIndex < moves.length - 1 ? ' ' : ''}
                </span>
            );
        });
    };

    // Main render of move list
    const renderMovesList = () => {
        const result = [];
        
        for (let i = 0; i < history.length; i++) {
            const move = history[i];
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhiteMove = i % 2 === 0;
            
            let display = '';
            if (isWhiteMove) {
                display = `${moveNumber}.${move.san}`;
            } else {
                display = move.san;
            }
            
            result.push(
                <span 
                    key={i} 
                    className={`move-item ${isCurrentMove(i) ? 'current' : ''}`}
                    onClick={() => handleMoveClick(i)}
                    title={`Move ${i + 1}: ${display}`}
                >
                    {display}
                </span>
            );
            
            // Add variations after move
            if (move.variations && move.variations.length > 0) {
                result.push(
                    <span key={`variations-${i}`} className="variations-container">
                        {' '}
                        {renderVariations(move.variations, i)}
                    </span>
                );
            }
            
            // Add space between moves
            if (i < history.length - 1) {
                result.push(' ');
            }
        }
        
        return result;
    };

    return (
        <div className="move-list-container">
            <div className="moves-container">
                {history.length === 0 ? (
                    <div className="no-moves">No moves yet</div>
                ) : (
                    <div className="moves-list">
                        <GameHeader />
                        {renderMovesList()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoveList;