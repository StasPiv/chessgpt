import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadPGNAction } from '../redux/actions.js';
import './LoadPgn.css';

const LoadPgn = ({ onClose }) => {
    const dispatch = useDispatch();
    const [pgn, setPgn] = useState('');

    const handleLoadPGN = () => {
        if (pgn.trim()) {
            dispatch(loadPGNAction(pgn));
            setPgn('');
            if (onClose) {
                onClose();
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleLoadPGN();
        }
    };

    return (
        <div className="pgn-container">
            <textarea
                className="pgn-textarea"
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste PGN text here... (Ctrl+Enter to load)"
                autoFocus
            />
            <div className="pgn-actions">
                <button
                    className="pgn-load-button"
                    onClick={handleLoadPGN}
                    disabled={!pgn.trim()}
                >
                    Load PGN
                </button>
                {onClose && (
                    <button
                        className="pgn-cancel-button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default LoadPgn;