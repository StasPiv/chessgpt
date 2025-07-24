import WebSocket from 'ws';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Загружаем правильный .env файл в зависимости от NODE_ENV
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config({ path: '.env' });
}

// Создаем config объект ПОСЛЕ загрузки переменных окружения
const config = {
    websocketUrl: process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080',
};

// Connect to WebSocket server
const ws = new WebSocket(config.websocketUrl);

// Start Stockfish
const stockfish = spawn('polyglot');
let currentFen = 'startpos';
let lines = {};
let analysisTimeout = null;

function sendToEngine(cmd) {
    console.log('Sending to engine:', cmd);
    stockfish.stdin.write(cmd + '\n');
}

function stopAnalysis() {
    if (analysisTimeout) {
        clearTimeout(analysisTimeout);
    }
    sendToEngine('stop');
}

function broadcastAnalysis() {
    const analysisData = Object.entries(lines).map(([pvNum, line]) => {
        return line;
    });
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(analysisData));
    }
}

ws.on('open', () => {
    console.log('Connected to WebSocket server');
    sendToEngine('uci');
    sendToEngine('setoption name MultiPV value 4');
    sendToEngine('isready');
});

ws.on('message', (data) => {
    let msg;
    try {
        msg = JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse message:', e);
        return;
    }

    if (msg.type === 'analyze' && msg.fen) {
        stopAnalysis();
        currentFen = msg.fen;
        lines = {};
        console.log('New position received:', currentFen);
        sendToEngine('position fen ' + currentFen);
        sendToEngine('go infinite');
    } else if (msg.type === 'stop') {
        stopAnalysis();
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'stopped' }));
        }
    }
});

stockfish.stdout.on('data', (data) => {
    const linesArray = data.toString().split('\n');
    linesArray.forEach((line) => {
        console.log('Stockfish output:', line);

        if (line.startsWith('info') && line.includes('multipv')) {
            const match = line.match(/info.*?depth (\d+).*?seldepth (\d+).*?multipv (\d+).*?score (cp|mate) (-?\d+).*?nodes (\d+).*?pv (.+)/);
            if (match) {
                const [_, depth, seldepth, pvNum, scoreType, scoreValue, nodes, moves] = match;
                const moveList = moves.trim().split(' ');

                // Determine whose turn it is
                const fenParts = currentFen.split(' ');
                const isWhiteToMove = fenParts[1] === 'w';

                let score;
                if (scoreType === 'mate') {
                    let mateValue = parseInt(scoreValue);
                    // If it's black's turn, invert mate evaluation
                    if (!isWhiteToMove) {
                        mateValue = -mateValue;
                    }
                    score = `#${mateValue}`;
                } else {
                    let numericScore = parseInt(scoreValue) / 100;
                    // If it's black's turn, invert evaluation
                    if (!isWhiteToMove) {
                        numericScore = -numericScore;
                    }
                    score = numericScore.toFixed(2);
                }

                lines[pvNum] = {
                    score: score,
                    depth: parseInt(depth),
                    nodes: parseInt(nodes),
                    uciMoves: moveList.join(' '), // Raw UCI moves from engine
                    fen: currentFen // Current position FEN
                };
            }
            broadcastAnalysis();
        }
    });
});

// Error handling
stockfish.on('error', (error) => {
    console.error('Stockfish error:', error);
});

stockfish.on('close', (code) => {
    console.log('Stockfish process closed with code:', code);
});