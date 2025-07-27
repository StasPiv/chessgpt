import React, {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {Layout, Layouts, Responsive, WidthProvider} from 'react-grid-layout';
import {CustomLayoutProps, LayoutChangeCallback} from '../types';
import {setIsMobileAction} from '../redux/actions.js';
import {addResizeListener, isMobileDevice} from '../utils/DeviceUtilities.js';
import ChessBoard from './ChessBoard';
import MoveList from './MoveList';
import AnalysisPanel from './AnalysisPanel';
import NavigationControls from './NavigationControls';
import './CustomLayout.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const CustomLayout: React.FC<CustomLayoutProps> = ({ className }) => {
    const dispatch = useDispatch();
    
    const [layouts, setLayouts] = useState<Layouts>({
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
        // Добавляем макет для мобильных устройств
        sm: [
            { i: 'chessboard', x: 0, y: 0, w: 12, h: 6, minW: 12, minH: 5 },
            { i: 'moves', x: 0, y: 6, w: 12, h: 4, minW: 12, minH: 3 },
            { i: 'analysis', x: 0, y: 10, w: 12, h: 3, minW: 12, minH: 2 }
        ]
    });

    const [isFlipped, setIsFlipped] = useState<boolean>(false);

    // Инициализация определения мобильного устройства
    useEffect(() => {
        // Определяем мобильное устройство при первой загрузке
        const mobile = isMobileDevice();
        dispatch(setIsMobileAction(mobile));

        // Добавляем обработчик изменения размера экрана
        const removeResizeListener = addResizeListener((isMobile: boolean) => {
            dispatch(setIsMobileAction(isMobile));
        });

        // Очистка обработчика при размонтировании компонента
        return () => {
            removeResizeListener();
        };
    }, [dispatch]);

    // Load saved layout from localStorage
    useEffect(() => {
        const savedLayouts = localStorage.getItem('chessapp-layouts');
        if (savedLayouts) {
            try {
                const parsedLayouts = JSON.parse(savedLayouts) as Layouts;
                setLayouts(parsedLayouts);
            } catch (error) {
                console.error('Error loading saved layouts:', error);
            }
        }
    }, []);

    // Save layout to localStorage
    const handleLayoutChange: LayoutChangeCallback = (layout: Layout[], allLayouts: Layouts) => {
        setLayouts(allLayouts);
        localStorage.setItem('chessapp-layouts', JSON.stringify(allLayouts));
    };

    const handleFlipBoard = (): void => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className={`custom-layout-container ${className || ''}`}>
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={handleLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 12, sm: 12 }}
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
                        <span className="panel-title">Chess Board</span>
                    </div>
                    <div className="panel-content">
                        <div className="chess-board-wrapper">
                            <ChessBoard isFlipped={isFlipped} />
                        </div>
                        <div className="navigation-wrapper">
                            <NavigationControls onFlipBoard={handleFlipBoard} isFlipped={isFlipped} />
                        </div>
                    </div>
                </div>
                
                <div key="moves" className="layout-item moves-item">
                    <div className="drag-handle">
                        <span className="drag-icon">⋮⋮</span>
                        <span className="panel-title">Moves</span>
                    </div>
                    <div className="panel-content">
                        <MoveList />
                    </div>
                </div>
                
                <div key="analysis" className="layout-item analysis-item">
                    <div className="drag-handle">
                        <span className="drag-icon">⋮⋮</span>
                        <span className="panel-title">Analysis</span>
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