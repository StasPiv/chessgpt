import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Layout, Layouts, Responsive, WidthProvider} from 'react-grid-layout';
import {CustomLayoutProps, LayoutChangeCallback} from '../types';
import {setIsMobileAction} from '../redux/actions.js';
import {addResizeListener, isMobileDevice} from '../utils/DeviceUtilities.js';
import {RootState} from '../types';
import ChessBoard from './ChessBoard';
import MoveList from './MoveList';
import AnalysisPanel from './AnalysisPanel';
import NavigationControls from './NavigationControls';
import './CustomLayout.scss';

const ResponsiveGridLayout = WidthProvider(Responsive);

const CustomLayout: React.FC<CustomLayoutProps> = ({ className }) => {
    const dispatch = useDispatch();
    const isMobile = useSelector((state: RootState) => state.ui.isMobile);
    
    // Дефолтные лейауты - всегда используются для мобильных устройств
    const defaultLayouts: Layouts = {
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
        // ФИКСИРОВАННЫЙ МОБИЛЬНЫЙ ЛЕЙАУТ - ПЕРЕСТАВЛЕНЫ МЕСТАМИ
        sm: [
            // Шахматная доска с навигацией (верх экрана)
            { i: 'chessboard', x: 0, y: 0, w: 12, h: 10, static: true, minW: 12, minH: 10, maxW: 12, maxH: 10 },
            // Ходы - сразу под доской (фиксированная высота)
            { i: 'moves', x: 0, y: 10, w: 12, h: 6, static: true, minW: 12, minH: 6, maxW: 12, maxH: 20 },
            // Анализ - внизу (фиксированная высота для 4 линий)
            { i: 'analysis', x: 0, y: 16, w: 12, h: 4, static: true, minW: 12, minH: 4, maxW: 12, maxH: 4 }
        ]
    };
    
    const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);

    // Инициализация определения мобильного устройства
    useEffect(() => {
        // Определяем мобильное устройство при первой загрузке
        const mobile = isMobileDevice();
        dispatch(setIsMobileAction(mobile));

        // Добавляем обработчик изменения размера экрана
        const removeResizeListener = addResizeListener((isMobile: boolean) => {
            dispatch(setIsMobileAction(isMobile));
            // При переключении на мобильное устройство сбрасываем лейаут на дефолтный
            if (isMobile) {
                setLayouts(defaultLayouts);
            }
        });

        // Очистка обработчика при размонтировании компонента
        return () => {
            removeResizeListener();
        };
    }, [dispatch]);

    // Load saved layout from localStorage ТОЛЬКО для десктопа
    useEffect(() => {
        if (!isMobile) {
            const savedLayouts = localStorage.getItem('chessapp-layouts');
            if (savedLayouts) {
                try {
                    const parsedLayouts = JSON.parse(savedLayouts) as Layouts;
                    setLayouts(prevLayouts => ({
                        ...parsedLayouts,
                        // Всегда сохраняем фиксированный мобильный лейаут
                        sm: defaultLayouts.sm
                    }));
                } catch (error) {
                    console.error('Error loading saved layouts:', error);
                    // В случае ошибки используем дефолтные лейауты
                    setLayouts(defaultLayouts);
                }
            }
        } else {
            // Для мобильных устройств всегда используем дефолтные лейауты
            setLayouts(defaultLayouts);
        }
    }, [isMobile]);

    // Save layout to localStorage ТОЛЬКО для десктопа
    const handleLayoutChange: LayoutChangeCallback = (layout: Layout[], allLayouts: Layouts) => {
        if (!isMobile) {
            // Сохраняем лейаут только для десктопа
            const layoutsToSave = {
                ...allLayouts,
                // Не сохраняем мобильный лейаут - он всегда должен быть дефолтным
                sm: defaultLayouts.sm
            };
            setLayouts(layoutsToSave);
            localStorage.setItem('chessapp-layouts', JSON.stringify(layoutsToSave));
        }
        // Для мобильных устройств игнорируем любые изменения лейаута
    };

    const handleFlipBoard = (): void => {
        setIsFlipped(!isFlipped);
    };

    // Мобильный фиксированный лейаут
    if (isMobile) {
        return (
            <div className={`custom-layout-container mobile-fixed-layout ${className || ''}`}>
                {/* Шахматная доска с навигацией */}
                <div className="mobile-chessboard-section">
                    <div className="chess-board-wrapper">
                        <ChessBoard isFlipped={isFlipped} />
                    </div>
                    <div className="navigation-wrapper mobile-compact">
                        <NavigationControls 
                            onFlipBoard={handleFlipBoard} 
                            isFlipped={isFlipped}
                            compact={true}
                        />
                    </div>
                </div>
                
                {/* Панель ходов - теперь сразу под доской */}
                <div className="mobile-moves-section">
                    <MoveList />
                </div>
                
                {/* Панель анализа - теперь внизу */}
                <div className="mobile-analysis-section">
                    <AnalysisPanel />
                </div>
            </div>
        );
    }

    // Десктопный лейаут с grid
    return (
        <div className={`custom-layout-container ${className || ''}`}>
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={handleLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 12, sm: 12 }}
                rowHeight={60}
                isDraggable={!isMobile}
                isResizable={!isMobile}
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