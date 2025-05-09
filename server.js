import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Set();

console.log('WebSocket server running on ws://localhost:8080');

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total:', clients.size);

    ws.on('message', (data) => {
        console.log('Message received:', data.toString());

        // Рассылаем всем кроме отправителя
        for (const client of clients) {
            if (client !== ws && client.readyState === ws.OPEN) {
                client.send(data);
            }
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total:', clients.size);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});