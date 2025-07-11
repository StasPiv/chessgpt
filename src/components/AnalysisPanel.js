import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleAutoAnalysis, startAnalysis } from '../redux/analysisReducer.js';
import { startAnalysisRequest, stopAnalysisRequest } from '../websocket.js';
import './AnalysisPanel.css';

const AnalysisPanel = () => {
    const dispatch = useDispatch();
    const { lines, status, autoAnalysisEnabled } = useSelector(state => state.analysis);
    const fen = useSelector(state => state.chess.fen);

    const handleToggleAutoAnalysis = () => {
        dispatch(toggleAutoAnalysis());
        
        if (autoAnalysisEnabled && status === 'analyzing') {
            stopAnalysisRequest();
        }
        else if (!autoAnalysisEnabled && fen) {
            dispatch(startAnalysis());
            startAnalysisRequest(fen);
        }
    };

    return (
        <div>
            <div className="analysis-panel">
                <label className="auto-analyze-label">
                    <input
                        type="checkbox"
                        checked={autoAnalysisEnabled}
                        onChange={handleToggleAutoAnalysis}
                        className="checkbox-input"
                    />
                    Auto-analyze moves
                </label>
                
                {autoAnalysisEnabled && (
                    <div className="status-text">
                        Status: {status === 'analyzing' ? 'Analyzing position...' : 
                                status === 'stopped' ? 'Analysis stopped' : 'Analysis idle'}
                    </div>
                )}
            </div>
            
            {autoAnalysisEnabled && (
                <div className="analysis-container">
                    {lines.length === 0 ? (
                        <div className="no-analysis-data">
                            No analysis data available
                        </div>
                    ) : (
                        <>
                            <h4 className="analysis-header">
                                Engine Analysis (Top {lines.length} lines)
                            </h4>
                            <div className="analysis-lines">
                                {lines.map((line, idx) => (
                                    <div key={idx} className="analysis-line">
                                        <div className="line-header">
                                            #{idx + 1}: {line.score} (depth {line.depth})
                                        </div>
                                        <div className="line-moves">
                                            {line.moves}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisPanel;