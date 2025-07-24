package com.chessgpt;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Unified Chess Engine WebSocket Server
 * Combines WebSocket server functionality with chess engine management
 * Supports only one client connection at a time
 */
public class ChessEngineWebSocketServer extends WebSocketServer {
    
    private static final String DEFAULT_WEBSOCKET_URL = "ws://localhost:8080";
    private static final int DEFAULT_PORT = 8080;
    private static final Pattern INFO_PATTERN = Pattern.compile(
        "info.*?depth (\\d+).*?seldepth (\\d+).*?multipv (\\d+).*?score (cp|mate) (-?\\d+).*?nodes (\\d+).*?pv (.+)"
    );

    // WebSocket connection management (single client only)
    private WebSocket connectedClient = null;
    
    // Chess engine management
    private Process stockfishProcess;
    private PrintWriter engineWriter;
    private String currentFen = "startpos";
    private Map<String, AnalysisLine> lines = new ConcurrentHashMap<>();
    private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private ScheduledFuture<?> analysisTimeout;
    
    // Utilities
    private final Gson gson = new Gson();
    private StatusWindow statusWindow;

    public ChessEngineWebSocketServer(int port) {
        super(new InetSocketAddress(port));
        System.out.println("Chess Engine WebSocket Server initialized on port " + port);
    }

    public ChessEngineWebSocketServer() {
        this(DEFAULT_PORT);
    }

    public static void main(String[] args) {
        String websocketUrl = System.getenv("REACT_APP_WEBSOCKET_URL");
        if (websocketUrl == null) {
            websocketUrl = DEFAULT_WEBSOCKET_URL;
        }

        ChessEngineWebSocketServer server = new ChessEngineWebSocketServer();
        server.startServer(websocketUrl);
    }

    /**
     * Start the complete server (WebSocket + Chess Engine)
     */
    public void startServer(String websocketUrl) {
        try {
            // Initialize GUI
            statusWindow = new StatusWindow();
            
            // Parse port from URL and configure server
            int port = parsePortFromUrl(websocketUrl);
            if (port != getPort()) {
                // If port is different, we need to create a new server instance
                stop();
                ChessEngineWebSocketServer newServer = new ChessEngineWebSocketServer(port);
                newServer.statusWindow = this.statusWindow;
                newServer.startServer(websocketUrl);
                return;
            }
            
            // Start chess engine
            startChessEngine();
            
            // Start WebSocket server
            start();
            
            System.out.println("🚀 Chess Engine WebSocket Server started successfully");
            System.out.println("  - WebSocket port: " + port);
            System.out.println("  - Mode: Single client only");
            System.out.println("  - Engine: Polyglot/Stockfish");
            System.out.println("Ready to accept connections...");
            
            // Setup shutdown hook
            Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));

            // Keep main thread alive
            while (true) {
                Thread.sleep(1000);
            }

        } catch (Exception e) {
            System.err.println("❌ Error starting Chess Engine WebSocket Server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ============= WebSocket Server Implementation =============

    @Override
    public void onStart() {
        System.out.println("🚀 WebSocket Server started successfully");
        System.out.println("  - Listening on: " + getAddress());
        System.out.println("  - Single client mode enabled");
        
        if (statusWindow != null) {
            statusWindow.updateWebSocketStatus(true);
        }
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
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
        
        // Initialize chess engine if not already done
        if (engineWriter != null) {
            System.out.println("🎯 Chess engine ready for analysis requests");
        }
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("❌ WebSocket client disconnected");
        System.out.println("  - Code: " + code);
        System.out.println("  - Reason: " + (reason != null ? reason : "No reason provided"));
        System.out.println("  - Remote: " + remote);
        
        // Clear connected client reference
        if (conn == connectedClient) {
            connectedClient = null;
            // Stop any ongoing analysis
            stopAnalysis();
            System.out.println("🧹 Cleared connected client and stopped analysis");
        }
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        System.out.println("📨 WebSocket message received:");
        System.out.println("  - From: " + conn.getRemoteSocketAddress());
        System.out.println("  - Length: " + message.length());
        System.out.println("  - Content: " + message);
        
        // Ensure message is from our connected client
        if (conn != connectedClient) {
            System.out.println("⚠️  Message from unauthorized client, ignoring");
            return;
        }
        
        handleWebSocketMessage(message);
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        System.err.println("🚨 WebSocket error occurred:");
        if (conn != null) {
            System.err.println("  - From: " + conn.getRemoteSocketAddress());
        }
        System.err.println("  - Error: " + ex.getMessage());
        ex.printStackTrace();
        
        // Clear client reference if it was our connected client
        if (conn == connectedClient) {
            connectedClient = null;
        }
    }

    // ============= WebSocket Message Handling =============

    private void handleWebSocketMessage(String message) {
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
                        handleAnalyzeRequest(fen);
                    } else {
                        System.out.println("⚠️  ANALYZE message missing 'fen' field");
                    }
                    break;
                    
                case "stop":
                    System.out.println("⏹️ STOP command received");
                    handleStopRequest();
                    break;
                    
                default:
                    System.out.println("⚠️  Unknown message type: " + type);
                    break;
            }
            
        } catch (Exception e) {
            System.err.println("❌ Failed to parse WebSocket message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void handleAnalyzeRequest(String fen) {
        stopAnalysis();
        currentFen = fen;
        lines.clear();
        System.out.println("🔍 Starting analysis for position: " + currentFen);
        sendToEngine("position fen " + currentFen);
        sendToEngine("go infinite");
    }

    private void handleStopRequest() {
        stopAnalysis();
        sendResponseToClient("stopped", null);
    }

    // ============= Chess Engine Management =============

    private void startChessEngine() throws IOException {
        try {
            System.out.println("🎯 Starting chess engine (Polyglot)...");
            
            ProcessBuilder pb = new ProcessBuilder("polyglot");
            stockfishProcess = pb.start();

            engineWriter = new PrintWriter(new OutputStreamWriter(stockfishProcess.getOutputStream()), true);

            // Start engine output readers
            Thread outputReader = new Thread(this::readEngineOutput);
            outputReader.setDaemon(true);
            outputReader.start();

            Thread errorReader = new Thread(this::readEngineErrors);
            errorReader.setDaemon(true);
            errorReader.start();
            
            System.out.println("✅ Chess engine process started successfully");
            
            // Initialize engine
            sendToEngine("uci");
            sendToEngine("setoption name MultiPV value 4");
            sendToEngine("isready");
            
        } catch (IOException e) {
            System.err.println("❌ Failed to start chess engine: " + e.getMessage());
            if (statusWindow != null) {
                statusWindow.updateEngineStatus(false);
            }
            throw e;
        }
    }

    private void sendToEngine(String command) {
        System.out.println("🎯 Sending to engine: " + command);
        if (engineWriter != null) {
            engineWriter.println(command);
        }
    }

    private void stopAnalysis() {
        if (analysisTimeout != null) {
            analysisTimeout.cancel(false);
        }
        sendToEngine("stop");
    }

    private void readEngineOutput() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stockfishProcess.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("🎯 Engine output: " + line);
                processEngineOutput(line);
            }
        } catch (IOException e) {
            System.err.println("❌ Error reading engine output: " + e.getMessage());
            if (statusWindow != null) {
                statusWindow.updateEngineStatus(false);
            }
        }
        
        System.err.println("❌ Chess engine process terminated");
        if (statusWindow != null) {
            statusWindow.updateEngineStatus(false);
        }
    }

    private void readEngineErrors() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stockfishProcess.getErrorStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.err.println("🎯 Engine error: " + line);
            }
        } catch (IOException e) {
            System.err.println("❌ Error reading engine errors: " + e.getMessage());
        }
    }

    private void processEngineOutput(String line) {
        // Handle UCI initialization responses
        if ("uciok".equals(line.trim())) {
            System.out.println("✅ Chess engine UCI initialized");
            if (statusWindow != null) {
                statusWindow.updateEngineStatus(true);
            }
        } else if ("readyok".equals(line.trim())) {
            System.out.println("✅ Chess engine ready for commands");
        } 
        // Handle analysis output
        else if (line.startsWith("info") && line.contains("multipv")) {
            processAnalysisLine(line);
        }
    }

    private void processAnalysisLine(String line) {
        Matcher matcher = INFO_PATTERN.matcher(line);
        if (matcher.find()) {
            String depth = matcher.group(1);
            String seldepth = matcher.group(2);
            String pvNum = matcher.group(3);
            String scoreType = matcher.group(4);
            String scoreValue = matcher.group(5);
            String nodes = matcher.group(6);
            String moves = matcher.group(7);

            String[] moveList = moves.trim().split(" ");

            // Determine whose turn it is from FEN
            String[] fenParts = currentFen.split(" ");
            boolean isWhiteToMove = fenParts.length > 1 && "w".equals(fenParts[1]);

            // Format score based on evaluation type
            String score;
            if ("mate".equals(scoreType)) {
                int mateValue = Integer.parseInt(scoreValue);
                if (!isWhiteToMove) {
                    mateValue = -mateValue;
                }
                score = "#" + mateValue;
            } else {
                double numericScore = Integer.parseInt(scoreValue) / 100.0;
                if (!isWhiteToMove) {
                    numericScore = -numericScore;
                }
                score = String.format("%.2f", numericScore);
            }

            // Create analysis line
            AnalysisLine analysisLine = new AnalysisLine();
            analysisLine.score = score;
            analysisLine.depth = Integer.parseInt(depth);
            analysisLine.nodes = Long.parseLong(nodes);
            analysisLine.uciMoves = String.join(" ", moveList);
            analysisLine.fen = currentFen;

            lines.put(pvNum, analysisLine);
            broadcastAnalysisToClient();
        }
    }

    // ============= Client Communication =============

    private void broadcastAnalysisToClient() {
        if (connectedClient != null && connectedClient.isOpen()) {
            List<AnalysisLine> analysisData = new ArrayList<>(lines.values());
            String json = gson.toJson(analysisData);
            System.out.println("📤 Broadcasting analysis (" + analysisData.size() + " lines) to client");
            sendToClient(json);
        }
    }

    private void sendToClient(String message) {
        if (connectedClient != null && connectedClient.isOpen()) {
            try {
                connectedClient.send(message);
                System.out.println("📤 Sent to client: " + message);
            } catch (Exception e) {
                System.err.println("❌ Failed to send message to client: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("⚠️  No connected client to send message to");
        }
    }

    private void sendResponseToClient(String responseType, Object data) {
        JsonObject response = new JsonObject();
        response.addProperty("type", responseType);
        if (data != null) {
            response.add("data", gson.toJsonTree(data));
        }
        String json = gson.toJson(response);
        sendToClient(json);
    }

    // ============= Utility Methods =============

    private int parsePortFromUrl(String url) {
        try {
            URI uri = new URI(url);
            int port = uri.getPort();
            if (port == -1) {
                return DEFAULT_PORT;
            }
            return port;
        } catch (URISyntaxException e) {
            System.err.println("⚠️  Failed to parse WebSocket URL: " + url + ", using default port " + DEFAULT_PORT);
            return DEFAULT_PORT;
        }
    }

    public boolean hasConnectedClient() {
        return connectedClient != null && connectedClient.isOpen();
    }

    public String getConnectedClientAddress() {
        if (connectedClient != null) {
            return connectedClient.getRemoteSocketAddress().toString();
        }
        return "No client connected";
    }

    // ============= Shutdown Management =============

    public void shutdown() {
        System.out.println("🛑 Shutting down Chess Engine WebSocket Server...");
        
        // Disconnect client gracefully
        if (connectedClient != null && connectedClient.isOpen()) {
            connectedClient.close(1000, "Server shutting down");
        }
        
        // Stop WebSocket server
        try {
            stop();
            System.out.println("✅ WebSocket server stopped");
        } catch (Exception e) {
            System.err.println("❌ Error stopping WebSocket server: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Stop chess engine
        if (stockfishProcess != null && stockfishProcess.isAlive()) {
            stockfishProcess.destroy();
            try {
                if (!stockfishProcess.waitFor(5, TimeUnit.SECONDS)) {
                    stockfishProcess.destroyForcibly();
                }
                System.out.println("✅ Chess engine stopped");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("❌ Interrupted while stopping chess engine");
            }
        }
        
        // Shutdown scheduler
        if (scheduler != null) {
            scheduler.shutdown();
            System.out.println("✅ Scheduler stopped");
        }
        
        System.out.println("✅ Chess Engine WebSocket Server shutdown complete");
    }

    // ============= Data Classes =============

    /**
     * Represents a single line of chess analysis
     */
    public static class AnalysisLine {
        public String score;
        public int depth;
        public long nodes;
        public String uciMoves;
        public String fen;
    }
}
