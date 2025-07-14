import React from 'react';
import { useSelector } from 'react-redux';
import './GameHeader.css';

const GameHeader = () => {
    const pgnHeaders = useSelector(state => state.chess.pgnHeaders);

    // If no headers, don't display component
    if (!pgnHeaders || Object.keys(pgnHeaders).length === 0) {
        return null;
    }

    const formatResult = (result) => {
        switch (result) {
            case '1-0':
                return '1-0 (White wins)';
            case '0-1':
                return '0-1 (Black wins)';
            case '1/2-1/2':
                return '1/2-1/2 (Draw)';
            case '*':
                return 'Game not finished';
            default:
                return result;
        }
    };

    return (
        <div className="game-header">
            <div className="game-header-title">
                <h3>{pgnHeaders.Event || 'Game'}</h3>
                {pgnHeaders.Site && pgnHeaders.Site !== '?' && (
                    <span className="game-site">{pgnHeaders.Site}</span>
                )}
            </div>
            
            <div className="game-players">
                <div className="player white-player">
                    <span className="player-label">White:</span>
                    <span className="player-name">
                        {pgnHeaders.White || '?'}
                        {pgnHeaders.WhiteElo && ` (${pgnHeaders.WhiteElo})`}
                    </span>
                </div>
                <div className="vs-separator">vs</div>
                <div className="player black-player">
                    <span className="player-label">Black:</span>
                    <span className="player-name">
                        {pgnHeaders.Black || '?'}
                        {pgnHeaders.BlackElo && ` (${pgnHeaders.BlackElo})`}
                    </span>
                </div>
            </div>

            <div className="game-info">
                {pgnHeaders.Date && pgnHeaders.Date !== '????.??.??' && (
                    <div className="game-date">
                        <span className="info-label">Date:</span>
                        <span>{pgnHeaders.Date}</span>
                    </div>
                )}
                {pgnHeaders.Round && pgnHeaders.Round !== '?' && (
                    <div className="game-round">
                        <span className="info-label">Round:</span>
                        <span>{pgnHeaders.Round}</span>
                    </div>
                )}
                {pgnHeaders.Result && (
                    <div className="game-result">
                        <span className="info-label">Result:</span>
                        <span className="result-value">{formatResult(pgnHeaders.Result)}</span>
                    </div>
                )}
            </div>

            {pgnHeaders.Opening && (
                <div className="game-opening">
                    <span className="info-label">Opening:</span>
                    <span>{pgnHeaders.Opening}</span>
                    {pgnHeaders.Variation && (
                        <span className="opening-variation"> - {pgnHeaders.Variation}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameHeader;