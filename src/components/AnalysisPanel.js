import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleAutoAnalysis, startAnalysis } from '../redux/analysisReducer.js';
import { startAnalysisRequest, stopAnalysisRequest } from '../websocket.js';

const AnalysisPanel = () => {
    const dispatch = useDispatch();
    const { lines, status, autoAnalysisEnabled } = useSelector(state => state.analysis);
    const fen = useSelector(state => state.chess.fen);

    const handleToggleAutoAnalysis = () => {
        dispatch(toggleAutoAnalysis());
        
        // Если отключаем автоанализ, останавливаем текущий анализ
        if (autoAnalysisEnabled && status === 'analyzing') {
            stopAnalysisRequest();
        }
        // Если включаем автоанализ, запускаем анализ для текущей позиции
        else if (!autoAnalysisEnabled && fen) {
            dispatch(startAnalysis());
            startAnalysisRequest(fen);
        }
    };


    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                        type="checkbox"
                        checked={autoAnalysisEnabled}
                        onChange={handleToggleAutoAnalysis}
                        style={{ marginRight: '8px' }}
                    />
                    Auto-analyze moves
                </label>
                
                {autoAnalysisEnabled && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Status: {status === 'analyzing' ? 'Analyzing position...' : 
                                status === 'stopped' ? 'Analysis stopped' : 'Analysis idle'}
                    </div>
                )}
            </div>
            
            {autoAnalysisEnabled && (
                <div style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px', 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                }}>
                    {lines.length === 0 ? (
                        <div style={{ color: '#666', fontStyle: 'italic' }}>
                            No analysis data available
                        </div>
                    ) : (
                        <>
                            <h4 style={{ margin: '0 0 10px 0' }}>
                                Engine Analysis (Top {lines.length} lines)
                            </h4>
                            <div style={{ fontSize: '13px' }}>
                                {lines.map((line, idx) => (
                                    <div key={idx} style={{ 
                                        marginBottom: '8px', 
                                        padding: '5px', 
                                        backgroundColor: 'white',
                                        borderRadius: '3px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                            #{idx + 1}: {line.score} (depth {line.depth})
                                        </div>
                                        <div style={{ color: '#555' }}>
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
