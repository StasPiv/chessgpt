import React, { useEffect, useState, useRef, useCallback } from 'react';
import {Chessboard, PieceHandlerArgs, SquareHandlerArgs} from 'react-chessboard';
import { useDispatch, useSelector } from 'react-redux';
import { addMoveAction, addVariationAction } from '../redux/actions.js';
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
    const currentMove = useSelector((state: RootState) => state.chess.currentMove);
    const autoAnalysisEnabled = useSelector((state: RootState) => state.analysis.autoAnalysisEnabled);
    const [boardWidth, setBoardWidth] = useState<number>(400);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Состояние для обработки кликов
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [customSquareStyles, setCustomSquareStyles] = useState<{ [square: string]: React.CSSProperties }>({});

    // Mobile detection
    const [isMobile, setIsMobile] = useState<boolean>(false);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const userAgent = navigator.userAgent;
            const isMobileByWidth = width <= 768;
            const isMobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isMobileByMediaQuery = window.matchMedia('(max-width: 768px)').matches;

            const mobile = isMobileByWidth || isMobileByMediaQuery || (isTouchDevice && width < 1024);
            setIsMobile(mobile);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

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
            next: null,
        };
    };

    // Функция для выполнения хода
    const makeMove = useCallback((from: string, to: string): boolean => {
        try {
            // Create new game with current position
            const tempGame = new Chess(fen);

            // Try to make the move
            const move = tempGame.move({
                from: from,
                to: to,
                promotion: 'q' // always promote to queen for simplicity
            });

            if (move) {
                // Create serializable move object
                const serializableMove = createSerializableMove(move);

                // Проверяем, есть ли у текущего хода следующий ход
                if (currentMove && currentMove.next) {
                    // Если есть следующий ход, добавляем вариацию
                    dispatch(addVariationAction(serializableMove));
                } else {
                    // Иначе добавляем обычный ход
                    dispatch(addMoveAction(serializableMove));
                }

                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error in makeMove:', error);
            return false;
        }
    }, [fen, dispatch, currentMove]);

    // Main function for handling moves - as in documentation
    const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropEvent): boolean => {
        // Check that targetSquare is not null (if piece is dropped off the board)
        if (!targetSquare) {
            return false;
        }

        // Сбрасываем выбранную клетку при перетаскивании
        setSelectedSquare(null);
        setCustomSquareStyles({});

        return makeMove(sourceSquare, targetSquare);
    }, [makeMove]);

    // Функция для обработки кликов по клеткам
    const onSquareClick = useCallback(({ piece, square }: { piece: any; square: string }): void => {
        const tempGame = new Chess(fen);

        if (selectedSquare === null) {
            const pieceColor = piece.pieceType[0].toLowerCase();
            // Первый клик - выбираем фигуру
            if (piece && pieceColor === tempGame.turn()) {
                console.log('highlight square');
                setSelectedSquare(square);
                setCustomSquareStyles({
                    [square]: {
                        backgroundColor: 'rgba(255, 255, 0, 0.4)',
                    }
                });
            }
        } else {
            // Второй клик
            if (selectedSquare === square) {
                // Клик по той же клетке - отменяем выбор
                setSelectedSquare(null);
                setCustomSquareStyles({});
            } else {
                // Клик по другой клетке - пытаемся сделать ход
                const moveSuccess = makeMove(selectedSquare, square);

                // Сбрасываем выбор независимо от результата
                setSelectedSquare(null);
                setCustomSquareStyles({});

                if (!moveSuccess) {
                    // Если ход невозможен, попробуем выбрать новую фигуру
                    if (piece && piece.color === tempGame.turn()) {
                        setSelectedSquare(square);
                        setCustomSquareStyles({
                            [square]: {
                                backgroundColor: 'rgba(255, 255, 0, 0.4)',
                                border: '2px solid #ffff00'
                            }
                        });
                    }
                }
            }
        }
    }, [selectedSquare, fen, makeMove]);

    // Effect to send position for analysis
    useEffect(() => {
        if (fen && autoAnalysisEnabled) {
            sendPosition(fen);
        }
    }, [fen, dispatch, autoAnalysisEnabled]);

    // Create board options object - as in documentation
    const chessboardOptions: ChessboardOptions = {
        position: fen,
        onPieceDrop,
        onSquareClick,
        boardOrientation: isFlipped ? 'black' : 'white',
        id: 'chess-board',
        squareStyles: customSquareStyles,
        canDragPiece: () => !isMobile,
    };

    return (
        <div ref={containerRef} className="chess-board-container">
            <Chessboard options={chessboardOptions} />
        </div>
    );
};

export default ChessBoard;