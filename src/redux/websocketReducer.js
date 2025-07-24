import { disableAutoAnalysis } from './analysisReducer.js';

// WebSocket Action Types
export const SET_WEBSOCKET_CONNECTED = 'SET_WEBSOCKET_CONNECTED';

// Action Creators
export const setWebSocketConnected = (isConnected) => (dispatch, getState) => {
    // ✅ Сначала обновляем состояние WebSocket
    dispatch({
        type: SET_WEBSOCKET_CONNECTED,
        payload: isConnected
    });
    
    // ✅ Если соединение разорвано - отключаем автоанализ
    if (!isConnected) {
        dispatch(disableAutoAnalysis());
    }
};

// Initial State
const initialState = {
    isConnected: false
};

// Reducer
export function websocketReducer(state = initialState, action) {
    switch (action.type) {
        case SET_WEBSOCKET_CONNECTED:
            return {
                ...state,
                isConnected: action.payload
            };

        default:
            return state;
    }
}