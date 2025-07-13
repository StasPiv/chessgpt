import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleAutoAnalysis } from '../redux/analysisReducer.js';
import { sendPosition, stopAnalysisRequest } from '../websocket.js';
import './AnalysisPanel.css';

const AnalysisPanel = () => {
    const dispatch = useDispatch();
    const { lines, status, autoAnalysisEnabled } = useSelector(state => state.analysis);
    const { currentFen } = useSelector(state => state.chess);

    const handleToggleAutoAnalysis = () => {
        const newAutoEnabled = !autoAnalysisEnabled;
        dispatch(toggleAutoAnalysis());
        
        if (!newAutoEnabled) {
            // Если автоанализ отключается, останавливаем текущий анализ
            stopAnalysisRequest();
        } else if (currentFen) {
            // Если автоанализ включается, начинаем анализ текущей позиции
            sendPosition(currentFen);
        }
    };

    const isInactive = !autoAnalysisEnabled || status === 'stopped';

    // Получаем общее количество узлов из всех линий
    const totalNodes = lines.reduce((sum, line) => sum + line.nodes, 0);

    return (
        <div className="analysis-panel">
            <div className="analysis-header">
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={autoAnalysisEnabled}
                        onChange={handleToggleAutoAnalysis}
                    />
                    <span className="checkmark"></span>
                    Auto-analyze moves
                </label>
                {totalNodes > 0 && (
                    <span className="total-nodes">{totalNodes.toLocaleString()}</span>
                )}
            </div>

            <div className={`analysis-lines ${isInactive ? 'inactive' : ''}`}>
                {lines.length > 0 ? (
                    lines.map((line, index) => (
                        <div key={index} className="analysis-line">
                            <span className="line-score">{line.score}</span>
                            <span className="line-depth">{line.depth}</span>
                            <span className="line-moves">{line.moves}</span>
                        </div>
                    ))
                ) : (
                    <div className="no-analysis">
                        {autoAnalysisEnabled ? 'Анализ не запущен' : 'Включите автоанализ для начала анализа'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisPanel;