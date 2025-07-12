import React, {useEffect} from 'react';
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
        <Chessboard.default
            position={fen}
            onDrop={onDrop}
            width={400}
        />
    );
};

export default ChessBoard;