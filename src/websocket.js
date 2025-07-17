import { stopAnalysis, updateAnalysis, startAnalysis } from './redux/analysisReducer.js';

let socket = null;

export function connectWebSocket(store) {
    const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL;
    socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onmessage = async (event) => {
        try {
            let messageData = event.data;
            
            // Handle Blob data
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
        store.dispatch(stopAnalysis());
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
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