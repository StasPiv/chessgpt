const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
};

export const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'AUTH_LOGIN_START':
            return {
                ...state,
                isLoading: true,
                error: null
            };
        case 'AUTH_LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };
        case 'AUTH_LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            };
        case 'AUTH_LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };
        case 'AUTH_CHECK_USER':
            return {
                ...state,
                isLoading: true
            };
        default:
            return state;
    }
};