import { configureStore } from '@reduxjs/toolkit';
import { chessReducer } from './chessReducer.js';
import { analysisReducer } from './analysisReducer.js';
import { websocketReducer } from './websocketReducer.js';
import { uiReducer } from './uiReducer.js';
import { authReducer } from './authReducer.js';
import { undoMiddleware, withUndoRedo } from './undoMiddleware.js';

export const store = configureStore({
    reducer: {
        chess: withUndoRedo(chessReducer),
        analysis: analysisReducer,
        websocket: websocketReducer,
        ui: uiReducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }).concat(undoMiddleware),
});

export default store;