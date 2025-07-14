// src/redux/analysisReducer.js
const START_ANALYSIS = 'START_ANALYSIS';
const STOP_ANALYSIS = 'STOP_ANALYSIS';
const UPDATE_ANALYSIS = 'UPDATE_ANALYSIS';
const CLEAR_ANALYSIS = 'CLEAR_ANALYSIS';
const TOGGLE_AUTO_ANALYSIS = 'TOGGLE_AUTO_ANALYSIS';

export const startAnalysis = () => ({ type: START_ANALYSIS });
export const stopAnalysis = () => ({ type: STOP_ANALYSIS });
export const updateAnalysis = (lines) => ({ type: UPDATE_ANALYSIS, payload: lines });
export const clearAnalysis = () => ({ type: CLEAR_ANALYSIS });
export const toggleAutoAnalysis = () => ({ type: TOGGLE_AUTO_ANALYSIS });

const initialState = {
    status: 'idle', // 'idle', 'analyzing', 'stopped'
    lines: [],
    error: null,
    autoAnalysisEnabled: false, // whether automatic analysis is enabled
};

export function analysisReducer(state = initialState, action) {
    switch (action.type) {
        case START_ANALYSIS:
            return { ...state, status: 'analyzing', error: null };
        case STOP_ANALYSIS:
            return { ...state, status: 'stopped' };
        case TOGGLE_AUTO_ANALYSIS:
            const newAutoEnabled = !state.autoAnalysisEnabled;
            return { 
                ...state, 
                autoAnalysisEnabled: newAutoEnabled,
                // If auto-analysis is being disabled, stop current analysis
                status: newAutoEnabled ? 'idle' : 'stopped'
            };
        case UPDATE_ANALYSIS:
            return { 
                ...state, 
                lines: action.payload,
                status: state.autoAnalysisEnabled ? 'analyzing' : 'stopped'
            };
        case CLEAR_ANALYSIS:
            return initialState;
        default:
            return state;
    }
}