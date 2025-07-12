import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ChessBoard from './ChessBoard.js';
import MoveList from './MoveList.js';
import AnalysisPanel from './AnalysisPanel.js';
import NavigationControls from './NavigationControls.js';
import './CustomLayout.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const CustomLayout = () => {
    const [layouts, setLayouts] = useState({
        lg: [
            { i: 'chessboard', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
            { i: 'moves', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
            { i: 'analysis', x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3 }
        ],
        md: [
            { i: 'chessboard', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
            { i: 'moves', x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
            { i: 'analysis', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 }
        ],
        sm: [
            { i: 'chessboard', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 5 },
            { i: 'moves', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
            { i: 'analysis', x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 }
        ]
    });

    // Загрузка сохраненного лейаута из localStorage
    useEffect(() => {
        const savedLayouts = localStorage.getItem('chessapp-layouts');
        if (savedLayouts) {
            try {
                setLayouts(JSON.parse(savedLayouts));
            } catch (error) {
                console.error('Error loading saved layouts:', error);
            }
        }
    }, []);

    // Сохранение лейаута в localStorage
    const handleLayoutChange = (layout, allLayouts) => {
        setLayouts(allLayouts);
        localStorage.setItem('chessapp-layouts', JSON.stringify(allLayouts));
    };

    // Сброс лейаута к значениям по умолчанию
    const resetLayout = () => {
        const defaultLayouts = {
            lg: [
                { i: 'chessboard', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
                { i: 'moves', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
                { i: 'analysis', x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3 }
            ],
            md: [
                { i: 'chessboard', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
                { i: 'moves', x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
                { i: 'analysis', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 }
            ],
            sm: [
                { i: 'chessboard', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 5 },
                { i: 'moves', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
                { i: 'analysis', x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 }
            ]
        };
        setLayouts(defaultLayouts);
        localStorage.setItem('chessapp-layouts', JSON.stringify(defaultLayouts));
    };

    return (
        <div className="custom-layout-container">
            <div className="layout-controls">
                <button 
                    className="reset-layout-btn" 
                    onClick={resetLayout}
                    title="Сбросить лейаут"
                >
                    🔄 Сбросить лейаут
                </button>
            </div>
            
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={handleLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
                rowHeight={60}
                isDraggable={true}
                isResizable={true}
                margin={[10, 10]}
                containerPadding={[10, 10]}
                useCSSTransforms={true}
                draggableHandle=".drag-handle"
            >
                <div key="chessboard" className="layout-item chessboard-item">
                    <div className="drag-handle">
                        <span className="drag-icon">⋮⋮</span>
                        <span className="panel-title">Шахматная доска</span>
                    </div>
                    <div className="panel-content">
                        <div className="chess-board-wrapper">
                            <ChessBoard />
                        </div>
                        <div className="navigation-wrapper">
                            <NavigationControls />
                        </div>
                    </div>
                </div>
                
                <div key="moves" className="layout-item moves-item">
                    <div className="drag-handle">
                        <span className="drag-icon">⋮⋮</span>
                        <span className="panel-title">Ходы</span>
                    </div>
                    <div className="panel-content">
                        <MoveList />
                    </div>
                </div>
                
                <div key="analysis" className="layout-item analysis-item">
                    <div className="drag-handle">
                        <span className="drag-icon">⋮⋮</span>
                        <span className="panel-title">Анализ</span>
                    </div>
                    <div className="panel-content">
                        <AnalysisPanel />
                    </div>
                </div>
            </ResponsiveGridLayout>
        </div>
    );
};

export default CustomLayout;