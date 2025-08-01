import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Switch from 'react-switch';
import { toggleAutoAnalysis } from '../redux/analysisReducer.js';
import { sendPosition, stopAnalysisRequest, connectWebSocket } from '../websocket.js';
import { store } from '../redux/store.js';
import { RootState, AnalysisLine as AnalysisLineType } from '../types';
import AnalysisLine from './AnalysisLine';
import { convertUciToSan, formatMovesWithNumbers } from '../utils/ChessMoveConverter';
import './AnalysisPanel.scss';

const AnalysisPanel: React.FC = () => {
    const dispatch = useDispatch();
    const { lines, status, autoAnalysisEnabled } = useSelector((state: RootState) => state.analysis);
    const { currentFen } = useSelector((state: RootState) => state.chess);
    const isMobile = useSelector((state: RootState) => state.ui.isMobile);
    
    // Получаем состояние WebSocket из Redux
    const { isConnected } = useSelector((state: RootState) => state.websocket);
    
    // Состояние для индикации процесса переподключения
    const [isReconnecting, setIsReconnecting] = useState(false);

    const handleToggleAutoAnalysis = (checked: boolean): void => {
        dispatch(toggleAutoAnalysis());

        if (!checked) {
            stopAnalysisRequest();
        } else if (currentFen && isConnected) {
            sendPosition(currentFen);
        }
    };

    const handleReconnect = (): void => {
        console.log('Manual reconnection requested...');
        setIsReconnecting(true);
        
        connectWebSocket(store);
        
        // Убираем индикатор переподключения через некоторое время
        setTimeout(() => {
            setIsReconnecting(false);
        }, 2000);
    };

    const isInactive: boolean = !autoAnalysisEnabled || status === 'stopped';
    const totalNodes: number = lines.reduce((sum: number, line: AnalysisLineType) => sum + line.nodes, 0);

    // Конвертируем UCI ходы в отформатированные ходы
    const processedLines = lines.map((line, index) => {
        try {
            const sanMoves = convertUciToSan(line.uciMoves, line.fen);
            const formattedMoves = formatMovesWithNumbers(sanMoves, line.fen);

            return {
                ...line,
                moves: formattedMoves
            };

        } catch (error) {
            console.error(`Error processing analysis line ${index}:`, error);
            return {
                ...line,
                moves: 'Error processing moves'
            };
        }
    });

    return (
        <div className="analysis-panel">
            <div className="analysis-header">
                <div className="header-left">
                    <div className="switch-container">
                        <Switch
                            checked={autoAnalysisEnabled}
                            onChange={handleToggleAutoAnalysis}
                            onColor="#28a745"
                            offColor="#6c757d"
                            onHandleColor="#ffffff"
                            offHandleColor="#ffffff"
                            handleDiameter={isMobile ? 18 : 20}
                            uncheckedIcon={false}
                            checkedIcon={false}
                            height={isMobile ? 20 : 24}
                            width={isMobile ? 36 : 44}
                            className="analysis-switch"
                            activeBoxShadow="0 0 2px 3px #28a74544"
                        />
                    </div>
                </div>
                
                <div className="header-right">
                    <div className="connection-indicator">
                        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                            <div className="connection-dot"></div>
                            <span className="connection-text">
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        {!isConnected && (
                            <button 
                                className="reconnect-btn"
                                onClick={handleReconnect}
                                disabled={isReconnecting}
                                title="Reconnect to analysis server"
                            >
                                {isReconnecting ? '🔄' : '🔌'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={`analysis-lines ${isInactive ? 'inactive' : ''}`}>
                {processedLines.length > 0 ? (
                    processedLines.map((line, index: number) => (
                        <AnalysisLine
                            key={index}
                            line={line}
                            index={index}
                            isInactive={isInactive}
                        />
                    ))
                ) : (
                    <div className="no-analysis">
                        {!isConnected 
                            ? 'No connection to analysis server' 
                            : autoAnalysisEnabled 
                                ? 'Analysis not started' 
                                : 'Enable auto-analysis to start analysis'
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisPanel;