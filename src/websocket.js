import { updateAnalysis, stopAnalysis } from './redux/analysisReducer.js';
import { setWebSocketConnected } from './redux/websocketReducer.js';

let socket = null;

function getWebSocketUrl() {
    // Проверяем GET-параметры
    const urlParams = new URLSearchParams(window.location.search);
    const wsUrl = urlParams.get('ws');
    
    if (wsUrl) {
        console.log('Using WebSocket URL from query params:', wsUrl);
        return wsUrl;
    }
    
    // Fallback к переменной окружения
    const envUrl = process.env.REACT_APP_WEBSOCKET_URL;
    if (envUrl) {
        console.log('Using WebSocket URL from environment:', envUrl);
        return envUrl;
    }
    
    // Дефолтный URL
    const defaultUrl = 'ws://localhost:8080';
    console.log('Using default WebSocket URL:', defaultUrl);
    return defaultUrl;
}

export function connectWebSocket(store) {
    const websocketUrl = getWebSocketUrl();
    socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
        console.log('WebSocket connected to:', websocketUrl);
        store.dispatch(setWebSocketConnected(true));
    };

    // Остальной код остается без изменений...
    socket.onmessage = async (event) => {
        try {
            let messageData = event.data;
            
            if (event.data instanceof Blob) {
                messageData = await event.data.text();
            }
            
            const data = JSON.parse(messageData);
            
            if (Array.isArray(data)) {
                store.dispatch(updateAnalysis(data));
            } else if (data.type === 'stopped') {
                store.dispatch(stopAnalysis());
            }
        } catch (e) {
            console.error('WebSocket message parse error:', e);
        }
    };

    socket.onclose = () => {
        console.log('WebSocket disconnected');
        store.dispatch(setWebSocketConnected(false));
        store.dispatch(stopAnalysis());
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        store.dispatch(setWebSocketConnected(false));
        store.dispatch(stopAnalysis());
    };
}

export function sendPosition(fen) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'analyze', fen }));
    } else {
        console.warn('WebSocket not connected, cannot send position');
    }
}

export function stopAnalysisRequest() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'stop' }));
    }
}

export function startAnalysisRequest(fen) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'analyze', fen }));
    }
}