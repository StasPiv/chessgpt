import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { PgnHeaders, GameResult, FormattedGameResult, GameHeaderProps, ResultFormatter } from '../types';
import './GameHeader.css';

const GameHeader: React.FC<GameHeaderProps> = ({ className, compact = false }) => {
    const pgnHeaders = useSelector((state: RootState) => state.chess.pgnHeaders);

    // If no headers, don't display component
    if (!pgnHeaders || Object.keys(pgnHeaders).length === 0) {
        return null;
    }

    const formatResult: ResultFormatter = (result: GameResult): FormattedGameResult => {
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

    const isValidDate = (date: string | undefined): boolean => {
        return date !== undefined && date !== '????.??.??';
    };

    const isValidField = (field: string | undefined): boolean => {
        return field !== undefined && field !== '?';
    };

    return (
        <div className={`game-header ${className || ''} ${compact ? 'compact' : ''}`}>
            <div className="game-header-title">
                <h3>{pgnHeaders.Event || 'Game'}</h3>
                {isValidField(pgnHeaders.Site) && (
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
                {isValidDate(pgnHeaders.Date) && (
                    <div className="game-date">
                        <span className="info-label">Date:</span>
                        <span>{pgnHeaders.Date}</span>
                    </div>
                )}
                {isValidField(pgnHeaders.Round) && (
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