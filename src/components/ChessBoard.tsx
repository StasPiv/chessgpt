import React, { useEffect, useState, useCallback } from 'react';
import {Chessboard} from 'react-chessboard';
import { useDispatch, useSelector } from 'react-redux';
import { addMoveAction, addVariationAction } from '../redux/actions.js';
import { sendPosition } from '../websocket.js';
import { Chess } from 'cm-chess';
import {
    RootState,
    ChessBoardProps,
    ChessMove,
    PieceDropEvent
} from '../types';
import { ChessboardOptions } from 'react-chessboard';
import './ChessBoard.css';

const ChessBoard: React.FC<ChessBoardProps> = ({ isFlipped = false, isMobile = false }) => {
    const dispatch = useDispatch();
    const fen = useSelector((state: RootState) => state.chess.fen);
    const currentMove = useSelector((state: RootState) => state.chess.currentMove);
    const autoAnalysisEnabled = useSelector((state: RootState) => state.analysis.autoAnalysisEnabled);

    // Состояние для обработки кликов
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [customSquareStyles, setCustomSquareStyles] = useState<{ [square: string]: React.CSSProperties }>({});

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
    }, [fen, autoAnalysisEnabled]);

    // Create board options object - as in documentation
    const chessboardOptions: ChessboardOptions = {
        position: fen,
        onPieceDrop,
        onSquareClick,
        boardOrientation: isFlipped ? 'black' : 'white',
        id: 'chess-board',
        squareStyles: customSquareStyles,
        canDragPiece: () => !isMobile
    };

    return (
        <div className="chess-board-container">
            <Chessboard options={chessboardOptions} />
        </div>
    );
};

export default ChessBoard;