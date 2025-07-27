
import { SET_IS_MOBILE } from './actions.js';

const initialState = {
    isMobile: false,
};

export function uiReducer(state = initialState, action) {
    switch (action.type) {
        case SET_IS_MOBILE:
            return {
                ...state,
                isMobile: action.payload,
            };
        default:
            return state;
    }
}
