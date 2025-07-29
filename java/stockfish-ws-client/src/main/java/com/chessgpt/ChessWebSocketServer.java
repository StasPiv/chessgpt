package com.chessgpt;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;

/**
 * Dedicated WebSocket Server
 * Delegates all client management to WebSocketClientManager
 */
public class ChessWebSocketServer extends WebSocketServer {
    
    private WebSocketClientManager clientManager;
    
    public ChessWebSocketServer(int port, WebSocketClientManager clientManager) {
        super(new InetSocketAddress(port));
        this.clientManager = clientManager;
    }
    
    @Override
    public void onStart() {
        System.out.println("🚀 WebSocket Server started successfully");
        System.out.println("  - Listening on: " + getAddress());
        System.out.println("  - Single client mode enabled");
        
        if (clientManager != null) {
            clientManager.onServerStarted();
        }
    }
    
    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        if (clientManager != null) {
            clientManager.handleConnection(conn, handshake);
        }
    }
    
    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        if (clientManager != null) {
            clientManager.handleDisconnection(conn, code, reason, remote);
        }
    }
    
    @Override
    public void onMessage(WebSocket conn, String message) {
        if (clientManager != null) {
            clientManager.handleMessage(conn, message);
        }
    }
    
    @Override
    public void onError(WebSocket conn, Exception ex) {
        if (clientManager != null) {
            clientManager.handleError(conn, ex);
        }
    }
}
