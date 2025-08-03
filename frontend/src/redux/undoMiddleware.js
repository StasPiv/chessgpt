import { UNDO_ACTION, REDO_ACTION } from './actions.js';

// Действия, которые должны сохраняться в истории для undo/redo
const UNDOABLE_ACTIONS = [
    'ADD_MOVE',
    'ADD_VARIATION',
    'PROMOTE_VARIATION',
    'DELETE_VARIATION',
    'DELETE_REMAINING',
    'LOAD_PGN'
];

// Максимальное количество состояний в истории
const MAX_HISTORY_SIZE = 50;

/**
 * Middleware для обработки undo/redo функциональности
 */
export const undoMiddleware = (store) => (next) => (action) => {
    const stateBefore = store.getState();
    
    // Выполняем обычное действие
    const result = next(action);
    
    // Если это undoable действие, сохраняем состояние
    if (UNDOABLE_ACTIONS.includes(action.type)) {
        const stateAfter = store.getState();
        
        // Сохраняем состояние до выполнения действия в undo стек
        const currentUndoHistory = stateAfter.chess.undoHistory || [];
        const newUndoHistory = [
            ...currentUndoHistory.slice(-MAX_HISTORY_SIZE + 1),
            {
                state: stateBefore.chess,
                action: action,
                timestamp: Date.now()
            }
        ];
        
        // Очищаем redo стек при выполнении нового действия
        store.dispatch({
            type: '@@INTERNAL/UPDATE_UNDO_REDO_HISTORY',
            payload: {
                undoHistory: newUndoHistory,
                redoHistory: []
            }
        });
    }
    
    return result;
};

/**
 * Enhancer для добавления undo/redo состояния к chess reducer
 */
export function withUndoRedo(reducer) {
    const initialState = {
        ...reducer(undefined, {}),
        undoHistory: [],
        redoHistory: [],
        canUndo: false,
        canRedo: false
    };
    
    return function undoRedoReducer(state = initialState, action) {
        switch (action.type) {
            case UNDO_ACTION: {
                const { undoHistory, redoHistory } = state;
                
                if (undoHistory.length === 0) {
                    return state;
                }
                
                // Берем последнее состояние из undo стека
                const lastUndoEntry = undoHistory[undoHistory.length - 1];
                const newUndoHistory = undoHistory.slice(0, -1);
                
                // Сохраняем текущее состояние в redo стек
                const newRedoHistory = [
                    ...redoHistory,
                    {
                        state: { ...state },
                        action: lastUndoEntry.action,
                        timestamp: Date.now()
                    }
                ];
                
                return {
                    ...lastUndoEntry.state,
                    undoHistory: newUndoHistory,
                    redoHistory: newRedoHistory,
                    canUndo: newUndoHistory.length > 0,
                    canRedo: true
                };
            }
            
            case REDO_ACTION: {
                const { undoHistory, redoHistory } = state;
                
                if (redoHistory.length === 0) {
                    return state;
                }
                
                // Берем последнее состояние из redo стека
                const lastRedoEntry = redoHistory[redoHistory.length - 1];
                const newRedoHistory = redoHistory.slice(0, -1);
                
                // Сохраняем текущее состояние в undo стек
                const newUndoHistory = [
                    ...undoHistory,
                    {
                        state: { ...state },
                        action: action,
                        timestamp: Date.now()
                    }
                ];
                
                return {
                    ...lastRedoEntry.state,
                    undoHistory: newUndoHistory,
                    redoHistory: newRedoHistory,
                    canUndo: true,
                    canRedo: newRedoHistory.length > 0
                };
            }
            
            case '@@INTERNAL/UPDATE_UNDO_REDO_HISTORY': {
                const { undoHistory, redoHistory } = action.payload;
                return {
                    ...state,
                    undoHistory,
                    redoHistory,
                    canUndo: undoHistory.length > 0,
                    canRedo: redoHistory.length > 0
                };
            }
            
            default: {
                const newState = reducer(state, action);
                
                // Обновляем canUndo/canRedo флаги
                return {
                    ...newState,
                    undoHistory: state.undoHistory,
                    redoHistory: state.redoHistory,
                    canUndo: state.undoHistory.length > 0,
                    canRedo: state.redoHistory.length > 0
                };
            }
        }
    };
}
