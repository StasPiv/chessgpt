import React from 'react';
import { AnalysisLine as AnalysisLineType } from '../types';
import './AnalysisLine.css';

interface ProcessedLine extends AnalysisLineType {
    moves: string;
}

interface AnalysisLineProps {
    line: ProcessedLine;
    index: number;
    isInactive: boolean;
}

const AnalysisLine: React.FC<AnalysisLineProps> = ({ line, index, isInactive }) => {
    const handleMovesClick = (): void => {
        console.log('Line clicked:', {
            moves: line.moves,
            uciMoves: line.uciMoves,
            fen: line.fen
        });
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