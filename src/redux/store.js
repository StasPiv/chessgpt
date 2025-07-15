import { configureStore } from '@reduxjs/toolkit';
import { chessReducer } from './chessReducer.js';
import { analysisReducer } from './analysisReducer.js';
import {loadPgnReducer} from "./loadPgnReducer.js";
import {navigationReducer} from "./navigationReducer.js";
import {moveListReducer} from "./moveListReducer.js";

export const store = configureStore({
    reducer: {
        chess: chessReducer,
        analysis: analysisReducer,
        loadPgn: loadPgnReducer,
        navigation: navigationReducer,
        moveList: moveListReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }),
});

export default store;