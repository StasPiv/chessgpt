import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { useDispatch, useSelector } from 'react-redux';
import { addMoveAction } from '../redux/actions.js';
import { startAnalysis } from '../redux/analysisReducer.js';
import { sendPosition, stopAnalysisRequest } from '../websocket.js';
import { Chess } from 'cm-chess';
import { 
    RootState, 
    ChessBoardProps, 
    ChessMove, 
    PieceDropEvent
} from '../types';
import { ChessboardOptions } from 'react-chessboard';
import './ChessBoard.css';

const ChessBoard: React.FC<ChessBoardProps> = ({ isFlipped = false }) => {
    const dispatch = useDispatch();
    const fen = useSelector((state: RootState) => state.chess.fen);
    const autoAnalysisEnabled = useSelector((state: RootState) => state.analysis.autoAnalysisEnabled);
    const [boardWidth, setBoardWidth] = useState<number>(400);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Function to calculate board size
    const calculateBoardSize = (): void => {
        const boardContainer = document.querySelector('.chess-board-container') as HTMLElement;
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

    const debouncedCalculateBoardSize = (): void => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
        }
        
        resizeTimeoutRef.current = setTimeout(() => {
            calculateBoardSize();
        }, 100);
    };

    useEffect(() => {
        calculateBoardSize();
        
        const handleResize = (): void => {
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
    const createSerializableMove = (move: any): ChessMove => {
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
            after: move.after,
            fen: move.fen,
        };
    };

    // Main function for handling moves - as in documentation
    const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropEvent): boolean => {
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
    const chessboardOptions: ChessboardOptions = {
        position: fen,
        onPieceDrop,
        boardOrientation: isFlipped ? 'black' : 'white',
        id: 'chess-board'
    };

    return (
        <div ref={containerRef} className="chess-board-container">
            <Chessboard options={chessboardOptions} />
        </div>
    );
};

export default ChessBoard;