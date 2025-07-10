import {createStore, combineReducers} from 'redux';
import {chessReducer} from './reducers.js';
import {analysisReducer} from './analysisReducer.js';

const rootReducer = combineReducers({
    chess: chessReducer,
    analysis: analysisReducer,
});

export const store = createStore(
    rootReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);