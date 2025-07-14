import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { useDispatch, useSelector } from 'react-redux';
import { addMoveAction } from '../redux/actions.js';
import { startAnalysis } from '../redux/analysisReducer.js';
import { sendPosition, stopAnalysisRequest } from '../websocket.js';
import { Chess } from 'cm-chess';

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

    // Add styles for improved drag and drop with "sticky" effect
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .react-grid-item .chess-board-container {
                position: relative !important;
                overflow: visible !important;
            }
            
            /* Styles for react-chessboard */
            .react-chessboard [data-piece] {
                transition: transform 0.15s ease-out, box-shadow 0.15s ease-out, filter 0.15s ease-out;
                cursor: grab !important;
                border-radius: 4px;
            }
            
            .react-chessboard [data-piece]:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 6px 12px rgba(0,0,0,0.25);
                filter: brightness(1.1);
            }
            
            /* Styles for dragging piece */
            .react-chessboard [data-piece][style*="cursor: grabbing"] {
                z-index: 10000 !important;
                transform: translateY(-15px) scale(1.15) !important;
                box-shadow: 0 12px 24px rgba(0,0,0,0.4) !important;
                filter: brightness(1.2) !important;
                transition: none !important;
                opacity: 0.9 !important;
            }
            
            /* Styles for squares */
            .react-chessboard [data-square] {
                transition: background-color 0.2s ease;
            }
            
            /* Animation for move completion */
            @keyframes pieceSettle {
                0% {
                    transform: translateY(-5px) scale(1.1);
                }
                50% {
                    transform: translateY(2px) scale(0.95);
                }
                100% {
                    transform: translateY(0) scale(1);
                }
            }
            
            .react-chessboard [data-piece]:not([style*="cursor: grabbing"]) {
                animation: pieceSettle 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);

        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
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