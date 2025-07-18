import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import CustomLayout from './components/CustomLayout.tsx';
import LoadPgn from './components/LoadPgn.tsx';
import ChessBoard from './components/ChessBoard.tsx';
import MoveList from './components/MoveList.tsx';
import AnalysisPanel from './components/AnalysisPanel.tsx';
import NavigationControls from './components/NavigationControls.tsx';
import { connectWebSocket } from './websocket.js';
import './App.css';

function App() {
    const [showPgnModal, setShowPgnModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [screenWidth, setScreenWidth] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false); // Добавляем состояние для поворота доски

    // Добавляем функцию для поворота доски
    const handleFlipBoard = () => {
        setIsFlipped(!isFlipped);
    };

    // More reliable mobile detection
    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const userAgent = navigator.userAgent;

            // Check multiple conditions for mobile
            const isMobileByWidth = width <= 768;
            const isMobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            const isMobileByAspectRatio = width < height; // Portrait orientation usually indicates mobile
            const isMobileByDevicePixelRatio = window.devicePixelRatio > 1;

            // Check for touch support
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            // Check CSS media query
            const isMobileByMediaQuery = window.matchMedia('(max-width: 768px)').matches;

            // Combine all checks
            const mobile = isMobileByWidth || isMobileByMediaQuery || (isTouchDevice && isMobileByAspectRatio);

            setScreenWidth(width);
            setIsMobile(mobile);

            // Debug information
            console.log('=== Mobile Detection Debug ===');
            console.log('Width:', width, 'Height:', height);
            console.log('User Agent:', userAgent);
            console.log('By width (<=768):', isMobileByWidth);
            console.log('By user agent:', isMobileByUserAgent);
            console.log('By aspect ratio:', isMobileByAspectRatio);
            console.log('By device pixel ratio:', isMobileByDevicePixelRatio);
            console.log('Touch device:', isTouchDevice);
            console.log('Media query match:', isMobileByMediaQuery);
            console.log('Final mobile decision:', mobile);
            console.log('================================');
        };

        checkMobile();

        // Listen for resize events
        window.addEventListener('resize', checkMobile);

        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(checkMobile, 100); // Small delay to ensure dimensions are updated
        });

        // Listen for media query changes
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleMediaChange = (e) => {
            console.log('Media query changed:', e.matches);
            checkMobile();
        };

        if (mediaQuery.addListener) {
            mediaQuery.addListener(handleMediaChange);
        } else {
            mediaQuery.addEventListener('change', handleMediaChange);
        }

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
            if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handleMediaChange);
            } else {
                mediaQuery.removeEventListener('change', handleMediaChange);
            }
        };
    }, []);

    // Initialize WebSocket connection
    useEffect(() => {
        connectWebSocket(store);
    }, []);

    const handlePasteClick = () => {
        setShowPgnModal(true);
    };

    const handleClosePgnModal = () => {
        setShowPgnModal(false);
    };

    // Function to reset layout
    const handleResetLayout = () => {
        const defaultLayouts = {
            lg: [
                { i: 'chessboard', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
                { i: 'moves', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
                { i: 'analysis', x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3 }
            ],
            md: [
                { i: 'chessboard', x: 0, y: 0, w: 8, h: 6, minW: 4, minH: 5 },
                { i: 'moves', x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
                { i: 'analysis', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 }
            ],
            sm: [
                { i: 'chessboard', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 5 },
                { i: 'moves', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
                { i: 'analysis', x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 }
            ],
            xs: [
                { i: 'chessboard', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 5 },
                { i: 'moves', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
                { i: 'analysis', x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 }
            ]
        };
        localStorage.setItem('chessapp-layouts', JSON.stringify(defaultLayouts));
        // Reload page to apply new layout
        window.location.reload();
    };

    // Desktop header component
    const DesktopHeader = () => (
        <div className="app-header">
            <h1 className="app-title">Chess Analyzer</h1>
            <div className="app-controls">
                <button
                    className="reset-layout-btn"
                    onClick={handleResetLayout}
                    title="Reset Layout"
                >
                    🔄 Reset Layout
                </button>
                <button
                    className="paste-icon"
                    onClick={handlePasteClick}
                    title="Load PGN"
                >
                    📋 Load PGN
                </button>
            </div>
        </div>
    );

    // В MobileLayout компоненте заменяем ChessBoard и NavigationControls:
    const MobileLayout = () => {
        return (
            <div className="mobile-layout">
                <div className="mobile-block mobile-chessboard">
                    <div className="mobile-block-content">
                        <div className="mobile-chess-area">
                            <ChessBoard isFlipped={isFlipped} />
                        </div>
                        <div className="mobile-navigation">
                            <NavigationControls onFlipBoard={handleFlipBoard} isFlipped={isFlipped} />
                            <button
                                className="mobile-pgn-btn"
                                onClick={handlePasteClick}
                                title="Load PGN"
                            >
                                📋
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mobile-block mobile-moves">
                    <div className="mobile-block-content">
                        <MoveList />
                    </div>
                </div>
                <div className="mobile-block mobile-analysis">
                    <div className="mobile-block-content">
                        <AnalysisPanel />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Provider store={store}>
            <div className="app-container">
                {!isMobile && <DesktopHeader />}

                <div className="layout-container">
                    {isMobile ? <MobileLayout /> : <CustomLayout />}
                </div>

                {showPgnModal && (
                    <div className="pgn-modal">
                        <div className="pgn-modal-content">
                            <div className="pgn-modal-header">
                                <h3 className="pgn-modal-title">Load PGN</h3>
                                <button
                                    className="pgn-modal-close"
                                    onClick={handleClosePgnModal}
                                >
                                    ×
                                </button>
                            </div>
                            <LoadPgn onClose={handleClosePgnModal} />
                        </div>
                    </div>
                )}
            </div>
        </Provider>
    );
}

export default App;