package com.chessgpt;

import javax.swing.SwingUtilities;
import java.util.Map;

/**
 * Chess Engine Application Orchestrator
 * Coordinates WebSocket server, chess engine, and ngrok tunnel
 * No longer inherits from WebSocketServer - uses composition instead
 */
public class ChessEngineWebSocketServer 
    implements ChessEngine.ChessEngineListener, WebSocketClientManager.WebSocketClientListener, NgrokManager.NgrokManagerListener {

    private static final int DEFAULT_PORT = 8080;

    // Component managers
    private ChessEngine chessEngine;
    private WebSocketClientManager clientManager;
    private NgrokManager ngrokManager;
    private ChessWebSocketServer webSocketServer; // Composition instead of inheritance

    // Utilities
    private StatusWindow statusWindow;
    private final int port;

    public ChessEngineWebSocketServer(int port) {
        this.port = port;
        System.out.println("Chess Engine Application initialized on port " + port);
    }

    public ChessEngineWebSocketServer() {
        this(DEFAULT_PORT);
    }

    public static void main(String[] args) {
        ChessEngineWebSocketServer server = new ChessEngineWebSocketServer();
        server.startServer();
    }

    /**
     * Start the complete server (WebSocket + Chess Engine + ngrok)
     */
    public void startServer() {
        try {
            // Initialize GUI
            statusWindow = new StatusWindow();

            // Initialize component managers
            clientManager = new WebSocketClientManager(this, statusWindow);
            chessEngine = new ChessEngine(this, statusWindow);
            ngrokManager = new NgrokManager(port, this, statusWindow);
            
            // Create WebSocket server with client manager
            webSocketServer = new ChessWebSocketServer(port, clientManager);
            
            // Start chess engine
            chessEngine.start();

            // Start WebSocket server
            webSocketServer.start();

            System.out.println("🚀 Chess Engine Application started successfully");
            System.out.println("  - WebSocket port: " + port);
            System.out.println("  - Mode: Single client only");
            System.out.println("  - Engine: Polyglot/Stockfish");

            // Start ngrok tunnel
            ngrokManager.startTunnel();

            // Setup enhanced shutdown hook
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\n🚨 Shutdown signal received...");
                shutdown();
            }, "ShutdownHook"));

            // Also handle Ctrl+C gracefully
            System.out.println("💡 Press Ctrl+C to stop the server");
            System.out.println("💡 All ngrok processes will be terminated on exit");
            System.out.println("");

            // Keep main thread alive
            while (true) {
                Thread.sleep(1000);
            }

        } catch (Exception e) {
            System.err.println("❌ Error starting Chess Engine Application: " + e.getMessage());
            e.printStackTrace();
            // Ensure cleanup even if startup fails
            shutdown();
        }
    }

    // ============= Chess Engine Listener Implementation =============

    @Override
    public void onEngineReady() {
        System.out.println("🎯 Chess engine ready for analysis requests");
    }

    @Override
    public void onEngineError(String error) {
        System.err.println("🚨 Chess engine error: " + error);
    }

    @Override
    public void onAnalysisUpdate(String fen, Map<String, ChessEngine.AnalysisLine> lines) {
        if (clientManager != null) {
            clientManager.broadcastAnalysisToClient(fen, lines);
        }
    }

    // ============= WebSocket Client Listener Implementation =============

    @Override
    public void onAnalyzeRequest(String fen) {
        if (chessEngine != null) {
            chessEngine.analyze(fen);
        } else {
            System.err.println("❌ Chess engine not initialized");
        }
    }

    @Override
    public void onStopRequest() {
        if (chessEngine != null) {
            chessEngine.stopAnalysis();
        }
        if (clientManager != null) {
            clientManager.sendResponseToClient("stopped", null);
        }
    }

    @Override
    public void onClientConnected(String clientAddress) {
        System.out.println("🎯 Client connected: " + clientAddress);
        
        // Show connection info
        if (ngrokManager != null && ngrokManager.isTunnelActive()) {
            String publicUrl = ngrokManager.getPublicUrl();
            System.out.println("🌐 Client connected via ngrok tunnel: " + publicUrl);
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🌐 Client connected via ngrok tunnel from " + clientAddress);
            }
        }

        // Check if chess engine is ready
        if (chessEngine != null && chessEngine.isReady()) {
            System.out.println("🎯 Chess engine ready for analysis requests");
        }
    }

    @Override
    public void onClientDisconnected(String clientAddress) {
        System.out.println("🧹 Client disconnected: " + clientAddress);
        
        // Stop any ongoing analysis
        if (chessEngine != null) {
            chessEngine.stopAnalysis();
        }
        
        System.out.println("🧹 Stopped analysis due to client disconnect");
    }

    @Override
    public void onClientError(String error) {
        System.err.println("🚨 WebSocket client error: " + error);
    }

    @Override
    public void onServerStarted() {
        System.out.println("🚀 WebSocket Server component started successfully");
    }

    // ============= NgrokManager Listener Implementation =============

    @Override
    public void onTunnelEstablished(String publicUrl, String wsUrl, String webAppUrl) {
        System.out.println("🌐 NgrokManager: Tunnel established successfully");
        System.out.println("  - Public URL: " + publicUrl);
        System.out.println("  - WebSocket URL: " + wsUrl);
        System.out.println("  - Web App URL: " + webAppUrl);
    }

    @Override
    public void onTunnelFailed(String errorMessage) {
        System.err.println("🚨 NgrokManager: Tunnel failed - " + errorMessage);
    }

    @Override
    public void onTunnelClosed() {
        System.out.println("🌐 NgrokManager: Tunnel closed");
    }

    // ============= Utility Methods =============

    public boolean hasConnectedClient() {
        return clientManager != null && clientManager.hasConnectedClient();
    }

    public String getConnectedClientAddress() {
        if (clientManager != null) {
            return clientManager.getConnectedClientAddress();
        }
        return "No client manager";
    }

    public String getNgrokUrl() {
        if (ngrokManager != null) {
            return ngrokManager.getWebAppUrl();
        }
        return null;
    }

    public boolean isTunnelActive() {
        return ngrokManager != null && ngrokManager.isTunnelActive();
    }

    public int getPort() {
        return port;
    }

    // ============= Shutdown Management =============

    public void shutdown() {
        System.out.println("🛑 Shutting down Chess Engine Application...");

        // Disconnect client gracefully
        if (clientManager != null) {
            clientManager.disconnectClient("Server shutting down");
        }

        // Stop WebSocket server
        if (webSocketServer != null) {
            try {
                webSocketServer.stop();
                System.out.println("✅ WebSocket server stopped");
            } catch (Exception e) {
                System.err.println("❌ Error stopping WebSocket server: " + e.getMessage());
                e.printStackTrace();
            }
        }

        // Stop ngrok tunnel
        if (ngrokManager != null) {
            ngrokManager.stopTunnel();
        }

        // Stop chess engine
        if (chessEngine != null) {
            chessEngine.shutdown();
        }

        // Close StatusWindow
        if (statusWindow != null) {
            SwingUtilities.invokeLater(() -> {
                statusWindow.setVisible(false);
                statusWindow.dispose();
            });
            System.out.println("✅ Status window closed");
        }

        System.out.println("✅ Chess Engine Application shutdown complete");
    }
}