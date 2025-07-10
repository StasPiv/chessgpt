import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gotoFirstAction, gotoLastAction, gotoPreviousAction, gotoNextAction } from '../redux/actions.js';

const NavigationControls = () => {
    const dispatch = useDispatch();
    const currentMoveIndex = useSelector(state => state.chess.currentMoveIndex);
    const fullHistory = useSelector(state => state.chess.fullHistory);

    // Обработчики для кнопок
    const handleFirst = () => dispatch(gotoFirstAction());
    const handlePrevious = () => dispatch(gotoPreviousAction());
    const handleNext = () => dispatch(gotoNextAction());
    const handleLast = () => dispatch(gotoLastAction());

    // Обработчик клавиатуры
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Проверяем, что фокус не на текстовых полях
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

    // Проверка доступности кнопок
    const isAtStart = currentMoveIndex === -1;
    const isAtEnd = currentMoveIndex === fullHistory.length - 1;
    const hasHistory = fullHistory.length > 0;

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            margin: '10px 0'
        }}>
            {/* Кнопка в начало (двойная стрелка влево) */}
            <button
                onClick={handleFirst}
                disabled={isAtStart || !hasHistory}
                style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: isAtStart || !hasHistory ? '#f0f0f0' : 'white',
                    cursor: isAtStart || !hasHistory ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Go to start (Home)"
            >
                ⏮
            </button>

            {/* Кнопка назад (стрелка влево) */}
            <button
                onClick={handlePrevious}
                disabled={isAtStart || !hasHistory}
                style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: isAtStart || !hasHistory ? '#f0f0f0' : 'white',
                    cursor: isAtStart || !hasHistory ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Previous move (←)"
            >
                ◀
            </button>

            {/* Индикатор текущей позиции */}
            <div style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                minWidth: '80px',
                textAlign: 'center'
            }}>
                {hasHistory ? `${Math.max(0, currentMoveIndex + 1)} / ${fullHistory.length}` : '0 / 0'}
            </div>

            {/* Кнопка вперед (стрелка вправо) */}
            <button
                onClick={handleNext}
                disabled={isAtEnd || !hasHistory}
                style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: isAtEnd || !hasHistory ? '#f0f0f0' : 'white',
                    cursor: isAtEnd || !hasHistory ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Next move (→)"
            >
                ▶
            </button>

            {/* Кнопка в конец (двойная стрелка вправо) */}
            <button
                onClick={handleLast}
                disabled={isAtEnd || !hasHistory}
                style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: isAtEnd || !hasHistory ? '#f0f0f0' : 'white',
                    cursor: isAtEnd || !hasHistory ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Go to end (End)"
            >
                ⏭
            </button>
        </div>
    );
};

export default NavigationControls;