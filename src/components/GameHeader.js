import React from 'react';
import { useSelector } from 'react-redux';
import './GameHeader.css';

const GameHeader = () => {
    const pgnHeaders = useSelector(state => state.chess.pgnHeaders);

    // Если нет заголовков, не отображаем компонент
    if (!pgnHeaders || Object.keys(pgnHeaders).length === 0) {
        return null;
    }

    const formatResult = (result) => {
        switch (result) {
            case '1-0':
                return '1-0 (Белые выиграли)';
            case '0-1':
                return '0-1 (Черные выиграли)';
            case '1/2-1/2':
                return '1/2-1/2 (Ничья)';
            case '*':
                return 'Партия не завершена';
            default:
                return result;
        }
    };

    return (
        <div className="game-header">
            <div className="game-header-title">
                <h3>{pgnHeaders.Event || 'Партия'}</h3>
                {pgnHeaders.Site && pgnHeaders.Site !== '?' && (
                    <span className="game-site">{pgnHeaders.Site}</span>
                )}
            </div>
            
            <div className="game-players">
                <div className="player white-player">
                    <span className="player-label">Белые:</span>
                    <span className="player-name">
                        {pgnHeaders.White || '?'}
                        {pgnHeaders.WhiteElo && ` (${pgnHeaders.WhiteElo})`}
                    </span>
                </div>
                <div className="vs-separator">vs</div>
                <div className="player black-player">
                    <span className="player-label">Черные:</span>
                    <span className="player-name">
                        {pgnHeaders.Black || '?'}
                        {pgnHeaders.BlackElo && ` (${pgnHeaders.BlackElo})`}
                    </span>
                </div>
            </div>

            <div className="game-info">
                {pgnHeaders.Date && pgnHeaders.Date !== '????.??.??' && (
                    <div className="game-date">
                        <span className="info-label">Дата:</span>
                        <span>{pgnHeaders.Date}</span>
                    </div>
                )}
                {pgnHeaders.Round && pgnHeaders.Round !== '?' && (
                    <div className="game-round">
                        <span className="info-label">Тур:</span>
                        <span>{pgnHeaders.Round}</span>
                    </div>
                )}
                {pgnHeaders.Result && (
                    <div className="game-result">
                        <span className="info-label">Результат:</span>
                        <span className="result-value">{formatResult(pgnHeaders.Result)}</span>
                    </div>
                )}
            </div>

            {pgnHeaders.Opening && (
                <div className="game-opening">
                    <span className="info-label">Дебют:</span>
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
