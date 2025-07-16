import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoFirstAction, gotoLastAction, gotoPreviousAction, gotoNextAction } from '../redux/actions.js';
import { RootState } from '../types';
import {
    NavigationControlsProps,
    NavigationState,
    NavigationHandlers,
    PositionIndicator,
    KeyboardEventHandler,
    NavigationKey
} from '../types';
import { DEFAULT_NAVIGATION_ICONS, KEY_NAVIGATION_MAP } from '../types/NavigationConstants';
import './NavigationControls.css';

const NavigationControls: React.FC<NavigationControlsProps> = ({
    onFlipBoard,
    isFlipped,
    className = '',
    showPositionIndicator = false,
    compact = false
}) => {
    const dispatch = useDispatch();
    const currentMoveIndex = useSelector((state: RootState) => state.chess.currentMoveIndex);
    const history = useSelector((state: RootState) => state.chess.history); // Используем history вместо fullHistory

    // Navigation handlers
    const navigationHandlers: NavigationHandlers = {
        handleFirst: useCallback(() => dispatch(gotoFirstAction()), [dispatch]),
        handlePrevious: useCallback(() => dispatch(gotoPreviousAction()), [dispatch]),
        handleNext: useCallback(() => dispatch(gotoNextAction()), [dispatch]),
        handleLast: useCallback(() => dispatch(gotoLastAction()), [dispatch])
    };

    // Calculate navigation state
    const navigationState: NavigationState = {
        currentMoveIndex,
        fullHistoryLength: history.length,
        isAtStart: currentMoveIndex === -1,
        isAtEnd: currentMoveIndex === history.length - 1,
        hasHistory: history.length > 0
    };

    // Calculate position indicator
    const positionIndicator: PositionIndicator = {
        current: Math.max(0, currentMoveIndex + 1),
        total: history.length,
        displayText: navigationState.hasHistory 
            ? `${Math.max(0, currentMoveIndex + 1)} / ${history.length}` 
            : '0 / 0'
    };

    // Keyboard event handler
    const handleKeyDown: KeyboardEventHandler = useCallback((event: KeyboardEvent) => {
        // Skip if user is typing in input fields
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        const navigationKey = event.key as NavigationKey;
        const direction = KEY_NAVIGATION_MAP[navigationKey];

        if (direction) {
            event.preventDefault();
            switch (direction) {
                case 'first':
                    navigationHandlers.handleFirst();
                    break;
                case 'previous':
                    navigationHandlers.handlePrevious();
                    break;
                case 'next':
                    navigationHandlers.handleNext();
                    break;
                case 'last':
                    navigationHandlers.handleLast();
                    break;
            }
        }
    }, [navigationHandlers]);

    // Setup keyboard event listeners
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Helper function to determine button disabled state
    const isButtonDisabled = (direction: string): boolean => {
        const { isAtStart, isAtEnd, hasHistory } = navigationState;
        
        switch (direction) {
            case 'first':
            case 'previous':
                return isAtStart || !hasHistory;
            case 'next':
            case 'last':
                return isAtEnd || !hasHistory;
            default:
                return false;
        }
    };

    return (
        <div className={`navigation-controls ${className} ${compact ? 'compact' : ''}`}>
            <button
                onClick={navigationHandlers.handleFirst}
                disabled={isButtonDisabled('first')}
                className="nav-button"
                title="Go to start (Home)"
                aria-label="Go to first move"
            >
                {DEFAULT_NAVIGATION_ICONS.first}
            </button>

            <button
                onClick={navigationHandlers.handlePrevious}
                disabled={isButtonDisabled('previous')}
                className="nav-button"
                title="Previous move (←)"
                aria-label="Go to previous move"
            >
                {DEFAULT_NAVIGATION_ICONS.previous}
            </button>

            {showPositionIndicator && (
                <div className="position-indicator" aria-live="polite">
                    {positionIndicator.displayText}
                </div>
            )}

            <button
                onClick={navigationHandlers.handleNext}
                disabled={isButtonDisabled('next')}
                className="nav-button"
                title="Next move (→)"
                aria-label="Go to next move"
            >
                {DEFAULT_NAVIGATION_ICONS.next}
            </button>

            <button
                onClick={navigationHandlers.handleLast}
                disabled={isButtonDisabled('last')}
                className="nav-button"
                title="Go to end (End)"
                aria-label="Go to last move"
            >
                {DEFAULT_NAVIGATION_ICONS.last}
            </button>

            <button
                onClick={onFlipBoard}
                className={`nav-button flip-button ${isFlipped ? 'flipped' : ''}`}
                title="Rotate board"
                aria-label={`Rotate board (currently ${isFlipped ? 'flipped' : 'normal'})`}
            >
                {DEFAULT_NAVIGATION_ICONS.flip}
            </button>
        </div>
    );
};

export default NavigationControls;