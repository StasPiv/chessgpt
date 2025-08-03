import React, { ReactElement, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../types';
import { setIsFullscreenAction } from '../redux/actions.js';
import fullscreenManager from '../utils/FullscreenManager.js';
import './FullScreenHint.scss';

const FullScreenHint = (): ReactElement | null => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const dispatch = useDispatch();
    const isMobile = useSelector((state: RootState) => state.ui.isMobile);
    const isFullscreen = useSelector((state: RootState) => state.ui.isFullscreen);

    // Subscribe to fullscreen mode changes
    useEffect(() => {
        const unsubscribe = fullscreenManager.addListener((isFullscreen: boolean) => {
            dispatch(setIsFullscreenAction(isFullscreen));
        });
        
        // Initialize state
        dispatch(setIsFullscreenAction(fullscreenManager.isInFullscreen()));
        
        return unsubscribe;
    }, [dispatch]);

    // Show hint only on mobile devices when not in fullscreen mode
    useEffect(() => {
        if (isMobile && !isFullscreen) {
            if (!hasInteracted) {
                // Show hint after 2 seconds from loading
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 2000);

                return () => clearTimeout(timer);
            } else {
                // If user already interacted but exited fullscreen mode,
                // show hint immediately
                setIsVisible(true);
            }
        } else {
            setIsVisible(false);
        }
    }, [isMobile, isFullscreen, hasInteracted]);

    // Automatically hide hint after 10 seconds (only for first display)
    useEffect(() => {
        if (isVisible && !hasInteracted) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setHasInteracted(true);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, hasInteracted]);

    const handleFingerClick = async () => {
        setHasInteracted(true);
        setIsVisible(false);

        try {
            // Vibration feedback for confirmation
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            await fullscreenManager.requestFullscreen();
        } catch (error) {
            console.log('Fullscreen request failed:', error);
        }
    };

    const handleDismiss = () => {
        setHasInteracted(true);
        setIsVisible(false);
    };

    // Don't show component if not mobile device or not visible
    if (!isMobile || !isVisible) {
        return null;
    }

    return (
        <div className="fullscreen-hint-overlay">
            <div className="fullscreen-hint-container">
                {/* Close button */}
                <button 
                    className="hint-close-btn"
                    onClick={handleDismiss}
                    aria-label="Close hint"
                >
                    ✕
                </button>

                {/* Animated finger */}
                <div 
                    className="finger-animation"
                    onClick={handleFingerClick}
                >
                    <div className="finger">
                        👆
                    </div>
                    <div className="swipe-trail"></div>
                </div>

                {/* Hint text */}
                <div className="hint-text">
                    <div className="hint-title">Fullscreen Mode</div>
                    <div className="hint-description">
                        {hasInteracted ? 
                            'Enter fullscreen mode for comfortable game analysis' :
                            'Tap the finger or swipe up for better chess position study'
                        }
                    </div>
                </div>

                {/* Up arrow */}
                <div className="arrow-up">
                    ↑
                </div>
            </div>
        </div>
    );
};

export default FullScreenHint;