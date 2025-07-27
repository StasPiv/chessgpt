import { configureStore } from '@reduxjs/toolkit';
import { chessReducer } from './chessReducer.js';
import { analysisReducer } from './analysisReducer.js';
import { websocketReducer } from './websocketReducer.js';
import { uiReducer } from './uiReducer.js';

export const store = configureStore({
    reducer: {
        chess: chessReducer,
        analysis: analysisReducer,
        websocket: websocketReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }),
});

export default store;