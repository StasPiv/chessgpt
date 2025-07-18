import http from 'http';
import crypto from 'crypto';

const port = 8080;
const clients = new Set();

// WebSocket magic string для handshake
const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// Функция для генерации WebSocket accept key
function generateAcceptKey(key) {
    return crypto
        .createHash('sha1')
        .update(key + WS_MAGIC_STRING)
        .digest('base64');
}

// Функция для парсинга WebSocket frame
function parseFrame(buffer) {
    if (buffer.length < 2) return null;
    
    const firstByte = buffer[0];
    const secondByte = buffer[1];
    
    const opcode = firstByte & 0x0F;
    const masked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7F;
    
    let offset = 2;
    
    if (payloadLength === 126) {
        if (buffer.length < offset + 2) return null;
        payloadLength = buffer.readUInt16BE(offset);
        offset += 2;
    } else if (payloadLength === 127) {
        if (buffer.length < offset + 8) return null;
        payloadLength = buffer.readBigUInt64BE(offset);
        offset += 8;
    }
    
    if (masked) {
        if (buffer.length < offset + 4) return null;
        const maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
        
        if (buffer.length < offset + payloadLength) return null;
        const payload = buffer.slice(offset, offset + Number(payloadLength));
        
        for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskKey[i % 4];
        }
        
        return { opcode, payload };
    }
    
    if (buffer.length < offset + payloadLength) return null;
    return { opcode, payload: buffer.slice(offset, offset + Number(payloadLength)) };
}

// Функция для создания WebSocket frame
function createFrame(data) {
    const payload = Buffer.from(data);
    const payloadLength = payload.length;
    
    let frame;
    if (payloadLength < 126) {
        frame = Buffer.allocUnsafe(2);
        frame[0] = 0x81; // FIN + text frame
        frame[1] = payloadLength;
    } else if (payloadLength < 65536) {
        frame = Buffer.allocUnsafe(4);
        frame[0] = 0x81;
        frame[1] = 126;
        frame.writeUInt16BE(payloadLength, 2);
    } else {
        frame = Buffer.allocUnsafe(10);
        frame[0] = 0x81;
        frame[1] = 127;
        frame.writeBigUInt64BE(BigInt(payloadLength), 2);
    }
    
    return Buffer.concat([frame, payload]);
}

const server = http.createServer();

server.on('upgrade', (request, socket, head) => {
    const key = request.headers['sec-websocket-key'];
    const acceptKey = generateAcceptKey(key);
    
    const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '', ''
    ].join('\r\n');
    
    socket.write(responseHeaders);
    
    const client = {
        socket,
        isAlive: true
    };
    
    clients.add(client);
    console.log('Client connected. Total:', clients.size);
    
    socket.on('data', (buffer) => {
        const frame = parseFrame(buffer);
        if (!frame) return;
        
        if (frame.opcode === 0x8) { // Close frame
            socket.end();
            return;
        }
        
        if (frame.opcode === 0x9) { // Ping frame
            const pongFrame = Buffer.from([0x8A, 0x00]); // Pong frame
            socket.write(pongFrame);
            return;
        }
        
        if (frame.opcode === 0x1) { // Text frame
            const message = frame.payload.toString();
            console.log('Message received:', message);
            
            // Broadcast to all other clients
            for (const otherClient of clients) {
                if (otherClient !== client && otherClient.socket.readyState !== 'closed') {
                    try {
                        otherClient.socket.write(createFrame(message));
                    } catch (err) {
                        console.error('Error sending message:', err);
                        clients.delete(otherClient);
                    }
                }
            }
        }
    });
    
    socket.on('close', () => {
        clients.delete(client);
        console.log('Client disconnected. Total:', clients.size);
    });
    
    socket.on('error', (err) => {
        console.error('WebSocket error:', err);
        clients.delete(client);
    });
});

server.listen(port, () => {
    console.log(`WebSocket server running on ws://localhost:${port}`);
});
