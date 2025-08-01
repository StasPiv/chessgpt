import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { promoteVariationAction, deleteVariationAction, deleteRemainingAction } from '../redux/actions.js';
import { RootState } from '../types';
import './GameEditorPanel.scss';

const GameEditorPanel = (): ReactElement => {
    const dispatch = useDispatch();
    const currentMove = useSelector((state: RootState) => state.chess.currentMove);
    
    // Показываем панель только если есть текущий ход
    if (!currentMove) {
        return <div className="game-editor-panel hidden"></div>;
    }

    const handlePromoteVariation = () => {
        dispatch(promoteVariationAction());
    };

    const handleDeleteVariation = () => {
        dispatch(deleteVariationAction());
    };

    const handleDeleteRemaining = () => {
        dispatch(deleteRemainingAction());
    };

    return (
        <div className="game-editor-panel">
            <div className="editor-buttons">
                <button
                    className="editor-btn promote-btn"
                    onClick={handlePromoteVariation}
                    title="Promote variation to main line"
                    aria-label="Promote variation"
                >
                    <span className="btn-icon">↑</span>
                    <span className="btn-text">Promote</span>
                </button>
                
                <button
                    className="editor-btn delete-variation-btn"
                    onClick={handleDeleteVariation}
                    title="Delete variation"
                    aria-label="Delete variation"
                >
                    <span className="btn-icon">✕</span>
                    <span className="btn-text">Delete</span>
                </button>
                
                <button
                    className="editor-btn delete-remaining-btn"
                    onClick={handleDeleteRemaining}
                    title="Delete remaining moves in line"
                    aria-label="Delete remaining moves"
                >
                    <span className="btn-icon">]</span>
                    <span className="btn-text">Truncate</span>
                </button>
            </div>
        </div>
    );
};

export default GameEditorPanel;
