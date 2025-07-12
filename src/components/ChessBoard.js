import React, {useEffect, useState, useRef} from 'react';
import Chessboard from 'chessboardjsx';
import { useDispatch, useSelector } from 'react-redux';
import { addMoveAction } from '../redux/actions.js';
import { startAnalysis } from '../redux/analysisReducer.js';
import {sendPosition, stopAnalysisRequest} from '../websocket.js';
import { Chess } from 'cm-chess';

const ChessBoard = () => {
    const dispatch = useDispatch();
    const fen = useSelector((state) => state.chess.fen);
    const autoAnalysisEnabled = useSelector((state) => state.analysis.autoAnalysisEnabled);
    const [boardWidth, setBoardWidth] = useState(400);
    const [key, setKey] = useState(0); // Ключ для принудительного перерендера
    const containerRef = useRef(null);

    // Функция для расчета размера доски
    const calculateBoardSize = () => {
        const boardContainer = document.querySelector('.chess-board-container');
        if (boardContainer) {
            const containerWidth = boardContainer.offsetWidth;
            const padding = 10; // Минимальные отступы
            const maxHeight = window.innerHeight * 0.7; // Максимальная высота 70% от окна
            const newSize = Math.min(containerWidth - padding, maxHeight);
            setBoardWidth(Math.max(350, newSize)); // Минимальный размер 350px
        }
    };

    // Отслеживаем изменения размера окна
    useEffect(() => {
        calculateBoardSize();
        const handleResize = () => {
            calculateBoardSize();
        };

        window.addEventListener('resize', handleResize);

        // Небольшая задержка для корректного расчета после рендера
        setTimeout(calculateBoardSize, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Принудительно пересоздаем доску после монтирования
    useEffect(() => {
        const timer = setTimeout(() => {
            setKey(prev => prev + 1);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    // Исправляем позиционирование
    useEffect(() => {
        const fixBoardPosition = () => {
            const boardElement = containerRef.current?.querySelector('[data-testid="chessboard"]');
            if (boardElement) {
                // Сбрасываем все трансформации и позиционирование
                boardElement.style.transform = 'none';
                boardElement.style.position = 'relative';
                
                // Исправляем стили для всех дочерних элементов
                const pieces = boardElement.querySelectorAll('.piece');
                pieces.forEach(piece => {
                    piece.style.position = 'absolute';
                });
            }
        };

        // Применяем исправления с задержкой
        setTimeout(fixBoardPosition, 100);
        setTimeout(fixBoardPosition, 500);
        
        // Добавляем глобальные CSS правила
        const style = document.createElement('style');
        style.textContent = `
            .react-grid-item .chess-board-container {
                position: relative !important;
                overflow: visible !important;
            }
            .react-grid-item [data-testid="chessboard"] {
                position: relative !important;
                transform: none !important;
            }
            .react-grid-item .piece.dragging {
                z-index: 10000 !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, [key]);

    const onDrop = ({sourceSquare, targetSquare}) => {
        try {
            // Создаем временную копию игры для проверки валидности хода
            const tempGame = new Chess(fen);
            const move = {from: sourceSquare, to: targetSquare, promotion: 'q'};

            // Проверяем, является ли ход валидным
            const result = tempGame.move(move);

            // Если ход валидный, отправляем его в Redux
            if (result) {
                dispatch(addMoveAction(move));
                return true; // Разрешаем ход
            }

            // Если ход невалидный, не разрешаем его
            return false;
        } catch (error) {
            // Если возникла ошибка при попытке хода, не разрешаем его
            console.log('Invalid move attempted:', {sourceSquare, targetSquare});
            return false;
        }
    };

    useEffect(() => {
        if (fen && autoAnalysisEnabled) {
            dispatch(startAnalysis());
            sendPosition(fen);
        }
        return () => {
            stopAnalysisRequest();
        };
    }, [fen, dispatch, autoAnalysisEnabled]);

    return (
        <div ref={containerRef} className="chess-board-container">
            <Chessboard.default
                key={key}
                position={fen}
                onDrop={onDrop}
                width={boardWidth}
                dropOffBoard="snapback"
            />
        </div>
    );
};

export default ChessBoard;