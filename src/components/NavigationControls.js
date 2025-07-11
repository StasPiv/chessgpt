import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoFirstAction, gotoLastAction, gotoPreviousAction, gotoNextAction } from '../redux/actions.js';
import './NavigationControls.css';

const NavigationControls = () => {
    const dispatch = useDispatch();
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);
    const fullHistory = useSelector(state => state.chess.fullHistory);

    const handleFirst = () => dispatch(gotoFirstAction());
    const handlePrevious = () => dispatch(gotoPreviousAction());
    const handleNext = () => dispatch(gotoNextAction());
    const handleLast = () => dispatch(gotoLastAction());

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    dispatch(gotoPreviousAction());
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    dispatch(gotoNextAction());
                    break;
                case 'Home':
                    event.preventDefault();
                    dispatch(gotoFirstAction());
                    break;
                case 'End':
                    event.preventDefault();
                    dispatch(gotoLastAction());
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dispatch]);

    const isAtStart = currentMoveIndex === -1;
    const isAtEnd = currentMoveIndex === fullHistory.length - 1;
    const hasHistory = fullHistory.length > 0;

    return (
        <div className="navigation-controls">
            <button
                onClick={handleFirst}
                disabled={isAtStart || !hasHistory}
                className="nav-button"
                title="Go to start (Home)"
            >
                ⏮
            </button>

            <button
                onClick={handlePrevious}
                disabled={isAtStart || !hasHistory}
                className="nav-button"
                title="Previous move (←)"
            >
                ◀
            </button>

            <div className="position-indicator">
                {hasHistory ? `${Math.max(0, currentMoveIndex + 1)} / ${fullHistory.length}` : '0 / 0'}
            </div>

            <button
                onClick={handleNext}
                disabled={isAtEnd || !hasHistory}
                className="nav-button"
                title="Next move (→)"
            >
                ▶
            </button>

            <button
                onClick={handleLast}
                disabled={isAtEnd || !hasHistory}
                className="nav-button"
                title="Go to end (End)"
            >
                ⏭
            </button>
        </div>
    );
};

export default NavigationControls;