import React from 'react';
import { AnalysisLine as AnalysisLineType } from '../types';
import './AnalysisLine.css';

interface AnalysisLineProps {
    line: AnalysisLineType;
    index: number;
    isInactive: boolean;
}

const AnalysisLine: React.FC<AnalysisLineProps> = ({ line, index, isInactive }) => {
    const handleMovesClick = (): void => {
        // Здесь можно добавить логику для обработки клика по ходам
        // Например, воспроизведение линии на доске
        console.log('Moves clicked:', line.moves);
    };

    return (
        <div className={`analysis-line ${isInactive ? 'inactive' : ''}`}>
            <span className="line-score">{line.score}</span>
            <span className="line-depth">{line.depth}</span>
            <span className="line-moves" onClick={handleMovesClick}>
                {line.moves}
            </span>
        </div>
    );
};

export default AnalysisLine;