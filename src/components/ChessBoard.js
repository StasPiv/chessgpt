import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { useDispatch, useSelector } from 'react-redux';
import { addMoveAction } from '../redux/actions.js';
import { startAnalysis } from '../redux/analysisReducer.js';
import { sendPosition, stopAnalysisRequest } from '../websocket.js';
import { Chess } from 'cm-chess';
import './ChessBoard.css';

const ChessBoard = ({ isFlipped = false }) => {
    const dispatch = useDispatch();
    const fen = useSelector((state) => state.chess.fen);
    const autoAnalysisEnabled = useSelector((state) => state.analysis.autoAnalysisEnabled);
    const [boardWidth, setBoardWidth] = useState(400);
    const containerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);

    // Function to calculate board size
    const calculateBoardSize = () => {
        const boardContainer = document.querySelector('.chess-board-container');
        if (boardContainer) {
            const containerWidth = boardContainer.offsetWidth;
            const padding = 10;
            const maxHeight = window.innerHeight * 0.7;
            const newSize = Math.min(containerWidth - padding, maxHeight);
            const calculatedSize = Math.max(350, newSize);
            
            setBoardWidth(prevSize => {
                if (Math.abs(prevSize - calculatedSize) > 5) {
                    return calculatedSize;
                }
                return prevSize;
            });
        }
    };

    const debouncedCalculateBoardSize = () => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }
        
        resizeTimeoutRef.current = setTimeout(() => {
            calculateBoardSize();
        }, 100);
    };

    useEffect(() => {
        calculateBoardSize();
        
        const handleResize = () => {
            debouncedCalculateBoardSize();
        };

        window.addEventListener('resize', handleResize);
        const initialTimeout = setTimeout(calculateBoardSize, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(initialTimeout);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, []);

    // Function to create serializable move object
    const createSerializableMove = (move) => {
        return {
            from: move.from,
            to: move.to,
            piece: move.piece,
            captured: move.captured,
            promotion: move.promotion,
            flags: move.flags,
            san: move.san,
            lan: move.lan,
            before: move.before,
            after: move.after
        };
    };

    // Main function for handling moves - as in documentation
    const onPieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
        // Check that targetSquare is not null (if piece is dropped off the board)
        if (!targetSquare) {
            return false;
        }

        try {
            // Create new game with current position
            const tempGame = new Chess(fen);
            
            // Try to make the move
            const move = tempGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q' // always promote to queen for simplicity
            });

            if (move) {
                // Create serializable move object
                const serializableMove = createSerializableMove(move);
                dispatch(addMoveAction(serializableMove));
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error in onPieceDrop:', error);
            return false;
        }
    }, [fen, dispatch]);

    // Function to handle board clicks
    const onSquareClick = useCallback((square) => {
        // Can add logic for handling board clicks
    }, []);

    // Effect to send position for analysis
    useEffect(() => {
        if (fen && autoAnalysisEnabled) {
            dispatch(startAnalysis());
            sendPosition(fen);
        }
        return () => {
            if (autoAnalysisEnabled) {
                stopAnalysisRequest();
            }
        };
    }, [fen, dispatch, autoAnalysisEnabled]);

    // Create board options object - as in documentation
    const chessboardOptions = {
        position: fen,
        onPieceDrop,
        onSquareClick,
        boardWidth,
        customBoardStyle: {
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        },
        customDarkSquareStyle: { backgroundColor: '#779952' },
        customLightSquareStyle: { backgroundColor: '#edeed1' },
        arePiecesDraggable: true,
        snapToCursor: true,
        animationDuration: 200,
        showBoardNotation: true,
        boardOrientation: isFlipped ? 'black' : 'white',
        customDropSquareStyle: {
            boxShadow: 'inset 0 0 1px 6px rgba(255,255,255,0.75)'
        },
        id: 'chess-board'
    };

    return (
        <div ref={containerRef} className="chess-board-container">
            <Chessboard options={chessboardOptions} />
        </div>
    );
};

export default ChessBoard;