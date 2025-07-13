import WebSocket from 'ws';
import { spawn } from 'child_process';
import { Chess } from 'cm-chess';
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

function formatMovesWithNumbers(sanMoves, startFen) {
    if (!sanMoves || sanMoves.length === 0) return '';
    
    const chess = new Chess(startFen);
    
    // Получаем номер хода и очередность из FEN
    const fenParts = startFen.split(' ');
    const isWhiteToMove = fenParts[1] === 'w';
    const moveNumber = parseInt(fenParts[5]) || 1;
    
    const result = [];
    let currentMoveNumber = moveNumber;
    let isCurrentWhite = isWhiteToMove;
    
    for (let i = 0; i < sanMoves.length; i++) {
        const move = sanMoves[i];
        
        if (isCurrentWhite) {
            result.push(`${currentMoveNumber}. ${move}`);
        } else {
            if (i === 0) {
                // Первый ход черных
                result.push(`${currentMoveNumber}... ${move}`);
            } else {
                result.push(move);
            }
        }
        
        if (!isCurrentWhite) {
            currentMoveNumber++;
        }
        
        isCurrentWhite = !isCurrentWhite;
    }
    
    return result.join(' ');
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

                // Определяем, чей сейчас ход
                const fenParts = currentFen.split(' ');
                const isWhiteToMove = fenParts[1] === 'w';

                let score;
                if (scoreType === 'mate') {
                    let mateValue = parseInt(scoreValue);
                    // Если ход черных, инвертируем оценку мата
                    if (!isWhiteToMove) {
                        mateValue = -mateValue;
                    }
                    score = `#${mateValue}`;
                } else {
                    let numericScore = parseInt(scoreValue) / 100;
                    // Если ход черных, инвертируем оценку
                    if (!isWhiteToMove) {
                        numericScore = -numericScore;
                    }
                    score = numericScore.toFixed(2);
                }

                lines[pvNum] = {
                    score: score,
                    depth: parseInt(depth),
                    nodes: parseInt(nodes),
                    moves: formatMovesWithNumbers(sanMoves, currentFen)
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