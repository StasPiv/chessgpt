import { SET_IS_MOBILE, SET_IS_FULLSCREEN } from './actions.js';

const initialState = {
    isMobile: false,
    isFullscreen: false,
};

export function uiReducer(state = initialState, action) {
    switch (action.type) {
        case SET_IS_MOBILE:
            return {
                ...state,
                isMobile: action.payload,
            };
        case SET_IS_FULLSCREEN:
            return {
                ...state,
                isFullscreen: action.payload,
            };
        default:
            return state;
    }
}