import WebSocket from 'ws';
import { spawn } from 'child_process';
import { Chess } from 'chess.js';
// Подключение к WebSocket-серверу
const ws = new WebSocket('ws://localhost:8080');
// Запуск Stockfish
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
    sendToEngine('setoption name MultiPV value 3');
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
                const chess = new Chess(currentFen);
                const moveList = moves.trim().split(' ');
                const sanMoves = [];
                for (const move of moveList) {
                    try {
                        let result = chess.move(move);
                        if (!result) {
                            result = chess.move(move, { sloppy: true });
                        }
                        if (!result) break;
                        sanMoves.push(result.san);
                    } catch (e) {
                        console.error('Invalid move:', move);
                        break;
                    }
                }
                let score;
                if (scoreType === 'mate') {
                    score = `#${scoreValue}`;
                } else {
                    const numericScore = parseInt(scoreValue) / 100;
                    score = numericScore.toFixed(2);
                }
                lines[pvNum] = {
                    score: score,
                    depth: parseInt(depth),
                    nodes: parseInt(nodes),
                    moves: sanMoves.join(' ')
                };
            }
            broadcastAnalysis();
        }
    });
});
// Обработка ошибок
stockfish.on('error', (error) => {
    console.error('Stockfish error:', error);
});
stockfish.on('close', (code) => {
    console.log('Stockfish process closed with code:', code);
});