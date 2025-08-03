import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { PgnHeaders, GameResult, FormattedGameResult, GameHeaderProps, ResultFormatter } from '../types';
import './GameHeader.scss';

const GameHeader: React.FC<GameHeaderProps> = ({ className, compact = false }) => {
    const pgnHeaders = useSelector((state: RootState) => state.chess.pgnHeaders);

    // If no headers, don't display component
    if (!pgnHeaders || Object.keys(pgnHeaders).length === 0) {
        return null;
    }

    const formatResult: ResultFormatter = (result: GameResult): FormattedGameResult => {
        switch (result) {
            case '1-0':
                return '1-0';
            case '0-1':
                return '0-1';
            case '1/2-1/2':
                return '1/2-1/2';
            case '*':
                return '*';
            default:
                return result;
        }
    };

    const isValidDate = (date: string | undefined): boolean => {
        return date !== undefined && date !== '????.??.??';
    };

    const isValidField = (field: string | undefined): boolean => {
        return field !== undefined && field !== '?' && field !== '';
    };

    // Build additional info (everything except players and result)
    const buildAdditionalInfo = (): string => {
        const infoParts: string[] = [];

        // Add event (tournament name)
        if (isValidField(pgnHeaders.Event)) {
            infoParts.push(pgnHeaders.Event!);
        }

        // Add site
        if (isValidField(pgnHeaders.Site)) {
            infoParts.push(pgnHeaders.Site!);
        }

        // Add date
        if (isValidDate(pgnHeaders.Date)) {
            infoParts.push(pgnHeaders.Date!);
        }

        // Add round
        if (isValidField(pgnHeaders.Round)) {
            infoParts.push(`Round ${pgnHeaders.Round}`);
        }

        // Add opening
        if (isValidField(pgnHeaders.Opening)) {
            let openingInfo = pgnHeaders.Opening!;
            if (isValidField(pgnHeaders.Variation)) {
                openingInfo += ` - ${pgnHeaders.Variation}`;
            }
            infoParts.push(openingInfo);
        }

        // Add ECO code
        if (isValidField(pgnHeaders.ECO)) {
            infoParts.push(pgnHeaders.ECO!);
        }

        // Add time control
        if (isValidField(pgnHeaders.TimeControl)) {
            infoParts.push(`TC: ${pgnHeaders.TimeControl}`);
        }

        // Add termination
        if (isValidField(pgnHeaders.Termination)) {
            infoParts.push(pgnHeaders.Termination!);
        }

        return infoParts.join(', ');
    };

    const additionalInfo = buildAdditionalInfo();

    return (
        <div className={`game-header ${className || ''} ${compact ? 'compact' : ''}`}>
            <div className="game-header-players">
                <strong>{pgnHeaders.White || '?'}</strong>
                {pgnHeaders.WhiteElo && ` (${pgnHeaders.WhiteElo})`}
                <span className="vs-separator"> vs </span>
                <strong>{pgnHeaders.Black || '?'}</strong>
                {pgnHeaders.BlackElo && ` (${pgnHeaders.BlackElo})`}
                {pgnHeaders.Result && (
                    <span className="game-result">
                        {' - '}
                        <strong>{formatResult(pgnHeaders.Result)}</strong>
                    </span>
                )}
            </div>

            {additionalInfo && (
                <div className="game-header-info">
                    {additionalInfo}
                </div>
            )}
        </div>
    );
};

export default GameHeader;