package com.chessgpt;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;

/**
 * WebSocket Client Manager
 * Handles WebSocket client connections and message processing
 */
public class WebSocketClientManager {
    
    // Single client connection (enforced policy)
    private WebSocket connectedClient = null;
    
    // Event listener
    private WebSocketClientListener listener;
    
    // Utilities
    private final Gson gson = new Gson();
    private StatusWindow statusWindow;
    
    public WebSocketClientManager(WebSocketClientListener listener, StatusWindow statusWindow) {
        this.listener = listener;
        this.statusWindow = statusWindow;
    }
    
    /**
     * Interface for receiving WebSocket client events
     */
    public interface WebSocketClientListener {
        void onAnalyzeRequest(String fen);
        void onStopRequest();
        void onClientConnected(String clientAddress);
        void onClientDisconnected(String clientAddress);
        void onClientError(String error);
        void onServerStarted(); // Добавили новый метод
    }
    
    /**
     * Called when WebSocket server starts
     */
    public void onServerStarted() {
        if (statusWindow != null) {
            statusWindow.updateWebSocketStatus(true);
        }
        
        if (listener != null) {
            listener.onServerStarted();
        }
    }
    
    /**
     * Handle new WebSocket connection
     */
    public void handleConnection(WebSocket conn, ClientHandshake handshake) {
        System.out.println("🔌 New WebSocket connection attempt from: " + conn.getRemoteSocketAddress());
        
        // Enforce single client policy
        if (connectedClient != null && connectedClient.isOpen()) {
            System.out.println("⚠️  Disconnecting previous client to maintain single-client mode");
            connectedClient.close(1000, "New client connected - only one client allowed");
        }
        
        // Accept the new client
        connectedClient = conn;
        
        System.out.println("✅ WebSocket client connected successfully");
        System.out.println("  - Remote address: " + conn.getRemoteSocketAddress());
        System.out.println("  - User-Agent: " + handshake.getFieldValue("User-Agent"));
        
        // Notify listener
        if (listener != null) {
            listener.onClientConnected(conn.getRemoteSocketAddress().toString());
        }
    }
    
    /**
     * Handle WebSocket disconnection
     */
    public void handleDisconnection(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("❌ WebSocket client disconnected");
        System.out.println("  - Code: " + code);
        System.out.println("  - Reason: " + (reason != null ? reason : "No reason provided"));
        System.out.println("  - Remote: " + remote);
        
        String clientAddress = "Unknown";
        
        // Clear connected client reference
        if (conn == connectedClient) {
            clientAddress = conn.getRemoteSocketAddress().toString();
            connectedClient = null;
            System.out.println("🧹 Cleared connected client reference");
            
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("❌ Client disconnected - waiting for new connections");
            }
        }
        
        // Notify listener
        if (listener != null) {
            listener.onClientDisconnected(clientAddress);
        }
    }
    
    /**
     * Handle incoming WebSocket message
     */
    public void handleMessage(WebSocket conn, String message) {
        System.out.println("📨 WebSocket message received:");
        System.out.println("  - From: " + conn.getRemoteSocketAddress());
        System.out.println("  - Length: " + message.length());
        System.out.println("  - Content: " + message);
        
        // Ensure message is from our connected client
        if (conn != connectedClient) {
            System.out.println("⚠️  Message from unauthorized client, ignoring");
            return;
        }
        
        processMessage(message);
    }
    
    /**
     * Handle WebSocket error
     */
    public void handleError(WebSocket conn, Exception ex) {
        System.err.println("🚨 WebSocket client error occurred:");
        if (conn != null) {
            System.err.println("  - From: " + conn.getRemoteSocketAddress());
        }
        System.err.println("  - Error: " + ex.getMessage());
        ex.printStackTrace();
        
        // Clear client reference if it was our connected client
        if (conn == connectedClient) {
            connectedClient = null;
        }
        
        // Notify listener
        if (listener != null) {
            listener.onClientError(ex.getMessage());
        }
    }
    
    // ... (остальные методы остаются без изменений)
    
    /**
     * Send message to connected client
     */
    public void sendToClient(String message) {
        if (connectedClient != null && connectedClient.isOpen()) {
            try {
                connectedClient.send(message);
                System.out.println("📤 Sent to client: " + message);
            } catch (Exception e) {
                System.err.println("❌ Failed to send message to client: " + e.getMessage());
                e.printStackTrace();
                
                if (listener != null) {
                    listener.onClientError("Failed to send message: " + e.getMessage());
                }
            }
        } else {
            System.out.println("⚠️  No connected client to send message to");
        }
    }
    
    /**
     * Send structured response to client
     */
    public void sendResponseToClient(String responseType, Object data) {
        JsonObject response = new JsonObject();
        response.addProperty("type", responseType);
        if (data != null) {
            response.add("data", gson.toJsonTree(data));
        }
        String json = gson.toJson(response);
        sendToClient(json);
    }
    
    /**
     * Broadcast analysis results to client
     */
    public void broadcastAnalysisToClient(String fen, Map<String, ChessEngine.AnalysisLine> lines) {
        if (connectedClient != null && connectedClient.isOpen()) {
            List<ChessEngine.AnalysisLine> analysisData = new ArrayList<>(lines.values());
            
            // Create object with FEN and analysis lines
            JsonObject analysisResponse = new JsonObject();
            analysisResponse.addProperty("fen", fen);
            analysisResponse.add("lines", gson.toJsonTree(analysisData));
            
            String json = gson.toJson(analysisResponse);
            System.out.println("📤 Broadcasting analysis (" + analysisData.size() + " lines) with FEN: " + fen);
            sendToClient(json);
        }
    }
    
    /**
     * Check if client is connected
     */
    public boolean hasConnectedClient() {
        return connectedClient != null && connectedClient.isOpen();
    }
    
    /**
     * Get connected client address
     */
    public String getConnectedClientAddress() {
        if (connectedClient != null) {
            return connectedClient.getRemoteSocketAddress().toString();
        }
        return "No client connected";
    }
    
    /**
     * Disconnect current client
     */
    public void disconnectClient(String reason) {
        if (connectedClient != null && connectedClient.isOpen()) {
            connectedClient.close(1000, reason != null ? reason : "Server initiated disconnect");
            connectedClient = null;
        }
    }
    
    /**
     * Process incoming message from client
     */
    private void processMessage(String message) {
        try {
            JsonObject msg = JsonParser.parseString(message).getAsJsonObject();
            System.out.println("📋 Parsed JSON message: " + msg.toString());
            
            if (!msg.has("type")) {
                System.out.println("⚠️  Message missing 'type' field, ignoring");
                return;
            }
            
            String type = msg.get("type").getAsString();
            System.out.println("📝 Processing message type: " + type);
            
            switch (type) {
                case "analyze":
                    if (msg.has("fen")) {
                        String fen = msg.get("fen").getAsString();
                        System.out.println("🎯 ANALYZE command received for FEN: " + fen);
                        if (listener != null) {
                            listener.onAnalyzeRequest(fen);
                        }
                    } else {
                        System.out.println("⚠️  ANALYZE message missing 'fen' field");
                    }
                    break;
                    
                case "stop":
                    System.out.println("⏹️ STOP command received");
                    if (listener != null) {
                        listener.onStopRequest();
                    }
                    break;
                    
                default:
                    System.out.println("⚠️  Unknown message type: " + type);
                    break;
            }
            
        } catch (Exception e) {
            System.err.println("❌ Failed to parse WebSocket message: " + e.getMessage());
            e.printStackTrace();
            
            if (listener != null) {
                listener.onClientError("Failed to parse message: " + e.getMessage());
            }
        }
    }
}