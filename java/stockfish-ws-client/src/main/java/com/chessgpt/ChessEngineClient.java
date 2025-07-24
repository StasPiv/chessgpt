package com.chessgpt;

import java.io.*;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class ChessEngineClient {
    private static final String DEFAULT_WEBSOCKET_URL = "ws://localhost:8080";
    private static final Pattern INFO_PATTERN = Pattern.compile(
        "info.*?depth (\\d+).*?seldepth (\\d+).*?multipv (\\d+).*?score (cp|mate) (-?\\d+).*?nodes (\\d+).*?pv (.+)"
    );

    private WebSocketClient webSocketClient;
    private Process stockfishProcess;
    private PrintWriter engineWriter;
    private String currentFen = "startpos";
    private Map<String, AnalysisLine> lines = new ConcurrentHashMap<>();
    private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private ScheduledFuture<?> analysisTimeout;
    private Gson gson = new Gson();
    private StatusWindow statusWindow;

    public static void main(String[] args) {
        String websocketUrl = System.getenv("REACT_APP_WEBSOCKET_URL");
        if (websocketUrl == null) {
            websocketUrl = DEFAULT_WEBSOCKET_URL;
        }

        ChessEngineClient client = new ChessEngineClient();
        client.start(websocketUrl);
    }

    public void start(String websocketUrl) {
        try {
            // Initialize GUI
            statusWindow = new StatusWindow();
            
            // Start Stockfish process
            startStockfish();

            // Start WebSocket connection
            connectToWebSocket(websocketUrl);

            // Keep the application running
            System.out.println("Chess Engine Client started. Press Ctrl+C to exit.");
            Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));

            // Keep main thread alive
            while (true) {
                Thread.sleep(1000);
            }

        } catch (Exception e) {
            System.err.println("Error starting client: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void connectToWebSocket(String url) throws Exception {
        URI serverUri = new URI(url);
        System.out.println("Attempting to connect to WebSocket: " + url);

        webSocketClient = new WebSocketClient(serverUri) {
            @Override
            public void onOpen(ServerHandshake handshake) {
                System.out.println("✓ WebSocket connection ESTABLISHED");
                System.out.println("  - Status: " + handshake.getHttpStatus());
                System.out.println("  - Message: " + handshake.getHttpStatusMessage());
                System.out.println("Initializing chess engine...");
                
                if (statusWindow != null) {
                    statusWindow.updateWebSocketStatus(true);
                }
                
                sendToEngine("uci");
                sendToEngine("setoption name MultiPV value 4");
                sendToEngine("isready");
            }

            @Override
            public void onMessage(String message) {
                System.out.println("📨 RAW WebSocket MESSAGE RECEIVED:");
                System.out.println("  - Length: " + message.length());
                System.out.println("  - Content: " + message);
                System.out.println("  - Timestamp: " + System.currentTimeMillis());
                handleWebSocketMessage(message);
            }

            @Override
            public void onMessage(ByteBuffer bytes) {
                System.out.println("📨 Binary WebSocket MESSAGE RECEIVED:");
                System.out.println("  - Size: " + bytes.remaining() + " bytes");
                String message = new String(bytes.array(), bytes.position(), bytes.remaining());
                System.out.println("  - Content: " + message);
                handleWebSocketMessage(message);
            }

            @Override
            public void onClose(int code, String reason, boolean remote) {
                System.out.println("❌ WebSocket connection CLOSED");
                System.out.println("  - Code: " + code);
                System.out.println("  - Reason: " + reason);
                System.out.println("  - Remote: " + remote);
                
                if (statusWindow != null) {
                    statusWindow.updateWebSocketStatus(false);
                }
            }

            @Override
            public void onError(Exception ex) {
                System.err.println("🚨 WebSocket ERROR: " + ex.getMessage());
                ex.printStackTrace();
                
                if (statusWindow != null) {
                    statusWindow.updateWebSocketStatus(false);
                }
            }
        };

        System.out.println("Connecting to WebSocket server...");
        webSocketClient.connect();

        // Wait for connection
        int attempts = 0;
        while (!webSocketClient.isOpen() && attempts < 10) {
            Thread.sleep(500);
            attempts++;
            System.out.println("Waiting for connection... (" + attempts + "/10)");
        }

        if (webSocketClient.isOpen()) {
            System.out.println("✓ WebSocket connected successfully!");
        } else {
            System.err.println("❌ Failed to connect to WebSocket after 5 seconds");
        }
    }

    private void startStockfish() throws IOException {
        try {
            ProcessBuilder pb = new ProcessBuilder("polyglot");
            stockfishProcess = pb.start();

            engineWriter = new PrintWriter(new OutputStreamWriter(stockfishProcess.getOutputStream()), true);

            // Start reading engine output
            Thread outputReader = new Thread(this::readEngineOutput);
            outputReader.setDaemon(true);
            outputReader.start();

            // Handle process errors
            Thread errorReader = new Thread(this::readEngineErrors);
            errorReader.setDaemon(true);
            errorReader.start();
            
            System.out.println("✓ Chess engine process started successfully");
            
        } catch (IOException e) {
            System.err.println("❌ Failed to start chess engine: " + e.getMessage());
            if (statusWindow != null) {
                statusWindow.updateEngineStatus(false);
            }
            throw e;
        }
    }

    private void handleWebSocketMessage(String message) {
        System.out.println("🔍 Processing WebSocket message...");
        try {
            JsonObject msg = JsonParser.parseString(message).getAsJsonObject();
            System.out.println("📋 Parsed JSON: " + msg.toString());

            if (msg.has("type")) {
                String type = msg.get("type").getAsString();
                System.out.println("📝 Message type: " + type);

                if ("analyze".equals(type) && msg.has("fen")) {
                    String fen = msg.get("fen").getAsString();
                    System.out.println("🎯 ANALYZE command received for FEN: " + fen);

                    stopAnalysis();
                    currentFen = fen;
                    lines.clear();
                    System.out.println("New position received: " + currentFen);
                    sendToEngine("position fen " + currentFen);
                    sendToEngine("go infinite");

                } else if ("stop".equals(type)) {
                    System.out.println("⏹️ STOP command received");
                    stopAnalysis();
                    if (webSocketClient.isOpen()) {
                        JsonObject response = new JsonObject();
                        response.addProperty("type", "stopped");
                        String responseJson = gson.toJson(response);
                        System.out.println("📤 Sending STOP response: " + responseJson);
                        webSocketClient.send(responseJson);
                    }
                } else {
                    System.out.println("⚠️ Unknown message type or missing data: " + type);
                }
            } else {
                System.out.println("⚠️ Message missing 'type' field");
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to parse WebSocket message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendToEngine(String command) {
        System.out.println("Sending to engine: " + command);
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
                System.out.println("Stockfish output: " + line);
                processEngineOutput(line);
            }
        } catch (IOException e) {
            System.err.println("Error reading engine output: " + e.getMessage());
            if (statusWindow != null) {
                statusWindow.updateEngineStatus(false);
            }
        }
        
        // If we reach here, the engine process has terminated
        System.err.println("❌ Chess engine process terminated");
        if (statusWindow != null) {
            statusWindow.updateEngineStatus(false);
        }
    }

    private void readEngineErrors() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stockfishProcess.getErrorStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.err.println("Stockfish error: " + line);
            }
        } catch (IOException e) {
            System.err.println("Error reading engine errors: " + e.getMessage());
        }
    }

    private void processEngineOutput(String line) {
        // Handle UCI responses
        if ("uciok".equals(line.trim())) {
            System.out.println("✓ Chess engine UCI initialized");
            if (statusWindow != null) {
                statusWindow.updateEngineStatus(true);
            }
        } else if ("readyok".equals(line.trim())) {
            System.out.println("✓ Chess engine ready");
        } else if (line.startsWith("info") && line.contains("multipv")) {
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

                // Determine whose turn it is
                String[] fenParts = currentFen.split(" ");
                boolean isWhiteToMove = fenParts.length > 1 && "w".equals(fenParts[1]);

                String score;
                if ("mate".equals(scoreType)) {
                    int mateValue = Integer.parseInt(scoreValue);
                    // If it's black's turn, invert mate evaluation
                    if (!isWhiteToMove) {
                        mateValue = -mateValue;
                    }
                    score = "#" + mateValue;
                } else {
                    double numericScore = Integer.parseInt(scoreValue) / 100.0;
                    // If it's black's turn, invert evaluation
                    if (!isWhiteToMove) {
                        numericScore = -numericScore;
                    }
                    score = String.format("%.2f", numericScore);
                }

                AnalysisLine analysisLine = new AnalysisLine();
                analysisLine.score = score;
                analysisLine.depth = Integer.parseInt(depth);
                analysisLine.nodes = Integer.parseInt(nodes);
                analysisLine.uciMoves = String.join(" ", moveList);
                analysisLine.fen = currentFen;

                lines.put(pvNum, analysisLine);
                broadcastAnalysis();
            }
        }
    }

    private void broadcastAnalysis() {
        if (webSocketClient != null && webSocketClient.isOpen()) {
            List<AnalysisLine> analysisData = new ArrayList<>(lines.values());
            String json = gson.toJson(analysisData);
            System.out.println("📤 Broadcasting analysis (" + analysisData.size() + " lines): " + json);
            webSocketClient.send(json);
        } else {
            System.out.println("⚠️ Cannot broadcast - WebSocket not connected");
        }
    }

    private void shutdown() {
        System.out.println("Shutting down...");

        if (webSocketClient != null) {
            webSocketClient.close();
        }

        if (stockfishProcess != null && stockfishProcess.isAlive()) {
            stockfishProcess.destroy();
            try {
                if (!stockfishProcess.waitFor(5, TimeUnit.SECONDS)) {
                    stockfishProcess.destroyForcibly();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        if (scheduler != null) {
            scheduler.shutdown();
        }
    }

    // Data class for analysis line
    public static class AnalysisLine {
        public String score;
        public int depth;
        public int nodes;
        public String uciMoves;
        public String fen;
    }
}