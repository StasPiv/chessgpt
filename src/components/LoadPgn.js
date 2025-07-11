import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadPGNAction } from '../redux/actions.js';
import './LoadPgn.css';

const LoadPgn = () => {
    const dispatch = useDispatch();
    const [pgn, setPgn] = useState('');

    const handleLoadPGN = () => {
        if (pgn.trim()) {
            dispatch(loadPGNAction(pgn));
        }
    };

    return (
        <div className="pgn-container">
            <textarea
                className="pgn-textarea"
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                placeholder="Paste PGN text here..."
            />
            <button onClick={handleLoadPGN}>
                Load PGN
            </button>
        </div>
    );
};

export default LoadPgn;
