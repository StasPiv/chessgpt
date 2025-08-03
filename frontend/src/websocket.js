import { updateAnalysis, stopAnalysis } from './redux/analysisReducer.js';
import { setWebSocketConnected } from './redux/websocketReducer.js';

let socket = null;

function getWebSocketUrl() {
    // Проверяем GET-параметры
    const urlParams = new URLSearchParams(window.location.search);
    const wsUrl = urlParams.get('ws');
    
    if (wsUrl) {
        console.log('Using WebSocket URL from query params:', wsUrl);
        
        // Сохраняем WebSocket URL в localStorage
        localStorage.setItem('chessgpt_websocket_url', wsUrl);
        console.log('WebSocket URL saved to localStorage:', wsUrl);
        
        // Удаляем GET-параметр из URL
        cleanUrlFromParams();
        
        return wsUrl;
    }
    
    // Проверяем localStorage
    const storedUrl = localStorage.getItem('chessgpt_websocket_url');
    if (storedUrl) {
        console.log('Using WebSocket URL from localStorage:', storedUrl);
        return storedUrl;
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

/**
 * Удаляет GET-параметры из URL без перезагрузки страницы
 */
function cleanUrlFromParams() {
    try {
        // Получаем текущий URL без параметров
        const currentUrl = window.location.protocol + '//' + 
                          window.location.host + 
                          window.location.pathname;
        
        // Обновляем URL в браузере без перезагрузки страницы
        window.history.replaceState({}, document.title, currentUrl);
        
        console.log('URL cleaned from GET parameters. New URL:', currentUrl);
    } catch (error) {
        console.warn('Failed to clean URL from parameters:', error);
    }
}

/**
 * Очищает сохраненный WebSocket URL из localStorage
 */
export function clearStoredWebSocketUrl() {
    localStorage.removeItem('chessgpt_websocket_url');
    console.log('Stored WebSocket URL cleared from localStorage');
}

/**
 * Получает текущий сохраненный WebSocket URL
 */
export function getStoredWebSocketUrl() {
    return localStorage.getItem('chessgpt_websocket_url');
}

/**
 * Устанавливает новый WebSocket URL и сохраняет его
 */
export function setWebSocketUrl(url) {
    if (url && url.trim()) {
        localStorage.setItem('chessgpt_websocket_url', url.trim());
        console.log('New WebSocket URL set and saved:', url.trim());
        return true;
    }
    return false;
}

export function connectWebSocket(store) {
    const websocketUrl = getWebSocketUrl();
    
    // Показываем пользователю, какой URL используется
    console.log('Connecting to WebSocket:', websocketUrl);
    
    socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
        console.log('WebSocket connected to:', websocketUrl);
        store.dispatch(setWebSocketConnected(true));
        
        // Дополнительно логируем успешное подключение
        if (getStoredWebSocketUrl()) {
            console.log('Connected using stored WebSocket URL');
        }
    };

    socket.onmessage = async (event) => {
        try {
            let messageData = event.data;
            
            if (event.data instanceof Blob) {
                messageData = await event.data.text();
            }
            
            const data = JSON.parse(messageData);
            
            // Получаем текущее состояние для проверки autoAnalysisEnabled
            const currentState = store.getState();
            const autoAnalysisEnabled = currentState.analysis.autoAnalysisEnabled;
            
            // Обработка нового формата сообщений с FEN и lines
            if (data.fen && data.lines) {
                // Проверяем, включен ли автоанализ
                if (!autoAnalysisEnabled) {
                    console.log('🚫 Auto-analysis disabled, ignoring analysis update');
                    return;
                }
                
                const currentFen = currentState.chess.fen;
                
                // Проверяем, совпадает ли FEN из анализа с текущей позицией
                if (data.fen === currentFen) {
                    console.log('✅ Analysis FEN matches current board position, updating analysis');
                    store.dispatch(updateAnalysis(data.lines));
                } else {
                    console.log('⚠️ Analysis FEN mismatch - ignoring outdated analysis');
                    console.log('  - Analysis FEN:', data.fen);
                    console.log('  - Current board FEN:', currentFen);
                }
            }
            // Обработка старого формата (массив линий) для совместимости
            else if (Array.isArray(data)) {
                // Проверяем, включен ли автоанализ
                if (!autoAnalysisEnabled) {
                    console.log('🚫 Auto-analysis disabled, ignoring analysis update');
                    return;
                }
                
                store.dispatch(updateAnalysis(data));
            } 
            // Обработка команд остановки
            else if (data.type === 'stopped') {
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
        
        // При ошибке подключения к сохраненному URL, можно предложить очистить его
        const storedUrl = getStoredWebSocketUrl();
        if (storedUrl && websocketUrl === storedUrl) {
            console.warn('Connection failed with stored URL. Consider clearing it with clearStoredWebSocketUrl()');
        }
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