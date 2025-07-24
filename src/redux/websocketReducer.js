
// WebSocket Action Types
export const SET_WEBSOCKET_CONNECTED = 'SET_WEBSOCKET_CONNECTED';

// Action Creators
export const setWebSocketConnected = (isConnected) => ({
    type: SET_WEBSOCKET_CONNECTED,
    payload: isConnected
});

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
