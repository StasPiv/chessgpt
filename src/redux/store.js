import { configureStore } from '@reduxjs/toolkit';
import { chessReducer } from './chessReducer.js';
import { analysisReducer } from './analysisReducer.js';
import { websocketReducer } from './websocketReducer.js';

export const store = configureStore({
    reducer: {
        chess: chessReducer,
        analysis: analysisReducer,
        websocket: websocketReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }),
});

export default store;