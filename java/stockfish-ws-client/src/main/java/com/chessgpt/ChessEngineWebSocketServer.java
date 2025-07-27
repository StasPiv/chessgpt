package com.chessgpt;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.swing.SwingUtilities;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Unified Chess Engine WebSocket Server with automatic ngrok integration
 * Combines WebSocket server functionality with chess engine management
 * Supports only one client connection at a time
 */
public class ChessEngineWebSocketServer extends WebSocketServer {

    private static final String DEFAULT_WEBSOCKET_URL = "ws://localhost:8080";
    private static final int DEFAULT_PORT = 8080;
    private static final String WEB_APP_BASE_URL = "https://chess-analyze.online";
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

    // ngrok integration
    private Process ngrokProcess;
    private String ngrokPublicUrl;

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

            // Start chess engine
            startChessEngine();

            // Start WebSocket server
            start();

            System.out.println("🚀 Chess Engine WebSocket Server started successfully");
            System.out.println("  - WebSocket port: " + getPort());
            System.out.println("  - Mode: Single client only");
            System.out.println("  - Engine: Polyglot/Stockfish");

            // Start ngrok tunnel
            startNgrokTunnel();

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
            System.err.println("❌ Error starting Chess Engine WebSocket Server: " + e.getMessage());
            e.printStackTrace();
            // Ensure cleanup even if startup fails
            shutdown();
        }
    }

    // ============= ngrok Integration =============

    private void startNgrokTunnel() {
        try {
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🌐 Starting ngrok tunnel...");
                statusWindow.setNgrokStatusColor("info");
            }

            // Проверить, есть ли уже запущенный туннель для этого порта
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🔍 Checking for existing ngrok tunnels...");
            }

            String existingUrl = checkExistingNgrokTunnel();
            if (existingUrl != null) {
                if (statusWindow != null) {
                    statusWindow.addNgrokStatusMessage("✅ Found existing ngrok tunnel: " + existingUrl);
                }
                handleNgrokSuccess(existingUrl);
                return;
            }

            // Попробовать завершить существующие процессы ngrok
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🧹 Terminating conflicting ngrok processes...");
            }
            terminateExistingNgrokProcesses();

            // Подождать немного после завершения процессов
            Thread.sleep(2000);

            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🚀 Starting new ngrok process on port " + getPort() + "...");
            }

            // Start ngrok process
            ProcessBuilder ngrokBuilder = new ProcessBuilder("ngrok", "http", String.valueOf(getPort()));
            ngrokProcess = ngrokBuilder.start();

            // Wait a moment for ngrok to start
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("⏳ Waiting for ngrok to initialize...");
            }
            Thread.sleep(3000);

            // Get ngrok public URL
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🔗 Querying ngrok API for public URL...");
            }

            String publicUrl = getNgrokPublicUrl();
            if (publicUrl != null) {
                handleNgrokSuccess(publicUrl);
            } else {
                handleNgrokFailure("Failed to get ngrok public URL from API");
            }

        } catch (Exception e) {
            handleNgrokFailure("Error starting ngrok tunnel: " + e.getMessage());
        }
    }

    private String checkExistingNgrokTunnel() {
        try {
            // Query ngrok local API to check existing tunnels
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:4040/api/tunnels"))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonObject jsonResponse = JsonParser.parseString(response.body()).getAsJsonObject();

                if (jsonResponse.has("tunnels")) {
                    var tunnelsArray = jsonResponse.getAsJsonArray("tunnels");

                    for (int i = 0; i < tunnelsArray.size(); i++) {
                        JsonObject tunnel = tunnelsArray.get(i).getAsJsonObject();

                        if (tunnel.has("proto") && "https".equals(tunnel.get("proto").getAsString())) {
                            if (tunnel.has("config")) {
                                JsonObject config = tunnel.getAsJsonObject("config");
                                String addr = config.get("addr").getAsString();

                                if (addr.equals("http://localhost:" + getPort())) {
                                    return tunnel.get("public_url").getAsString();
                                }
                            }
                        }
                    }
                }
            }

        } catch (Exception e) {
            // Ignore errors - ngrok might not be running
        }

        return null;
    }

    private void terminateExistingNgrokProcesses() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            ProcessBuilder pb;

            if (os.contains("win")) {
                pb = new ProcessBuilder("taskkill", "/f", "/im", "ngrok.exe");
            } else {
                pb = new ProcessBuilder("pkill", "ngrok");
            }

            Process process = pb.start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);

            if (finished) {
                int exitCode = process.exitValue();
                if (exitCode == 0) {
                    if (statusWindow != null) {
                        statusWindow.addNgrokStatusMessage("✅ Existing ngrok processes terminated successfully");
                    }
                } else if (exitCode == 1 && !os.contains("win")) {
                    if (statusWindow != null) {
                        statusWindow.addNgrokStatusMessage("ℹ️  No conflicting ngrok processes found");
                    }
                } else {
                    if (statusWindow != null) {
                        statusWindow.addNgrokStatusMessage("⚠️  Process termination completed with exit code: " + exitCode);
                    }
                }
            } else {
                if (statusWindow != null) {
                    statusWindow.addNgrokStatusMessage("⚠️  Timeout waiting for process termination");
                }
            }

        } catch (Exception e) {
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("⚠️  Could not terminate existing processes: " + e.getMessage());
            }
        }
    }

    private void handleNgrokSuccess(String publicUrl) {
        ngrokPublicUrl = publicUrl;
        String wsUrl = publicUrl.replace("https://", "wss://");
        String webAppUrl = WEB_APP_BASE_URL + "/?ws=" + wsUrl;

        System.out.println("✅ ngrok tunnel established successfully!");
        System.out.println("  - Public HTTPS URL: " + publicUrl);
        System.out.println("  - WebSocket WSS URL: " + wsUrl);
        System.out.println("");
        System.out.println("🎯 READY TO USE:");
        System.out.println("📱 Open this link in your browser or mobile device:");
        System.out.println("🔗 " + webAppUrl);
        System.out.println("");
        System.out.println("💡 You can also manually connect using WebSocket URL: " + wsUrl);
        System.out.println("");

        // Update StatusWindow with detailed info
        if (statusWindow != null) {
            statusWindow.addNgrokStatusMessage("✅ ngrok tunnel established successfully!");
            statusWindow.addNgrokStatusMessage("📡 Public HTTPS URL: " + publicUrl);
            statusWindow.addNgrokStatusMessage("🔌 WebSocket WSS URL: " + wsUrl);
            statusWindow.addNgrokStatusMessage("🎯 Ready to accept connections!");
            statusWindow.updateNgrokUrl(webAppUrl);
            statusWindow.setNgrokStatusColor("success");
        }

        // Copy to clipboard if possible
        copyToClipboard(webAppUrl);
    }

    private void handleNgrokFailure(String errorMessage) {
        System.err.println("❌ " + errorMessage);
        System.out.println("💡 Make sure ngrok is installed and available in PATH");
        System.out.println("💡 Check if you have multiple ngrok sessions running");
        System.out.println("💡 Server is running locally on ws://localhost:" + getPort());

        // Update StatusWindow with failure info
        if (statusWindow != null) {
            statusWindow.addNgrokStatusMessage("❌ " + errorMessage);
            statusWindow.addNgrokStatusMessage("💡 Make sure ngrok is installed and available in PATH");
            statusWindow.addNgrokStatusMessage("💡 Check your ngrok account limits");
            statusWindow.addNgrokStatusMessage("🔧 Server running locally on ws://localhost:" + getPort());
            statusWindow.updateNgrokUrl(null);
            statusWindow.setNgrokStatusColor("error");
        }
    }

    private String getNgrokPublicUrl() {
        try {
            // Query ngrok local API
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:4040/api/tunnels"))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonObject jsonResponse = JsonParser.parseString(response.body()).getAsJsonObject();

                if (jsonResponse.has("tunnels")) {
                    var tunnelsArray = jsonResponse.getAsJsonArray("tunnels");

                    for (int i = 0; i < tunnelsArray.size(); i++) {
                        JsonObject tunnel = tunnelsArray.get(i).getAsJsonObject();

                        if (tunnel.has("proto") && "https".equals(tunnel.get("proto").getAsString())) {
                            if (tunnel.has("config")) {
                                JsonObject config = tunnel.getAsJsonObject("config");
                                String addr = config.get("addr").getAsString();

                                if (addr.equals("http://localhost:" + getPort())) {
                                    return tunnel.get("public_url").getAsString();
                                }
                            }
                        }
                    }
                }
            }

        } catch (Exception e) {
            System.err.println("⚠️  Error querying ngrok API: " + e.getMessage());
        }

        return null;
    }

    private void copyToClipboard(String text) {
        try {
            // Try to copy to system clipboard
            ProcessBuilder pb;
            String os = System.getProperty("os.name").toLowerCase();

            if (os.contains("win")) {
                pb = new ProcessBuilder("cmd", "/c", "echo " + text + " | clip");
            } else if (os.contains("mac")) {
                pb = new ProcessBuilder("pbcopy");
            } else {
                // Linux
                pb = new ProcessBuilder("xclip", "-selection", "clipboard");
            }

            Process process = pb.start();

            if (!os.contains("win")) {
                try (PrintWriter writer = new PrintWriter(process.getOutputStream())) {
                    writer.print(text);
                }
            }

            process.waitFor();
            System.out.println("📋 Link copied to clipboard!");

            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("📋 Link automatically copied to clipboard!");
            }

        } catch (Exception e) {
            // Silently ignore clipboard errors
            System.out.println("💡 Copy the link above to access your chess analysis app");
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("💡 Copy the link above to access your chess analysis app");
            }
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

        // Show connection info
        if (ngrokPublicUrl != null) {
            System.out.println("🌐 Client connected via ngrok tunnel: " + ngrokPublicUrl);
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🌐 Client connected via ngrok tunnel from " + conn.getRemoteSocketAddress());
            }
        }

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

            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("❌ Client disconnected - waiting for new connections");
            }
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

    public String getNgrokUrl() {
        return ngrokPublicUrl;
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

        // Stop ngrok process (specific instance)
        if (ngrokProcess != null && ngrokProcess.isAlive()) {
            System.out.println("🌐 Stopping ngrok process...");
            ngrokProcess.destroy();
            try {
                if (!ngrokProcess.waitFor(3, TimeUnit.SECONDS)) {
                    System.out.println("⚠️  Force killing ngrok process...");
                    ngrokProcess.destroyForcibly();
                }
                System.out.println("✅ ngrok process stopped");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("❌ Interrupted while stopping ngrok");
            }
        }

        // Terminate all ngrok processes to prevent conflicts
        terminateAllNgrokProcesses();

        // Stop chess engine
        if (stockfishProcess != null && stockfishProcess.isAlive()) {
            System.out.println("🎯 Stopping chess engine...");
            stockfishProcess.destroy();
            try {
                if (!stockfishProcess.waitFor(3, TimeUnit.SECONDS)) {
                    System.out.println("⚠️  Force killing chess engine...");
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
            System.out.println("⏰ Stopping scheduler...");
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(2, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
                System.out.println("✅ Scheduler stopped");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                scheduler.shutdownNow();
            }
        }

        // Close StatusWindow
        if (statusWindow != null) {
            SwingUtilities.invokeLater(() -> {
                statusWindow.setVisible(false);
                statusWindow.dispose();
            });
            System.out.println("✅ Status window closed");
        }

        System.out.println("✅ Chess Engine WebSocket Server shutdown complete");
    }

    /**
     * Terminate all ngrok processes system-wide to prevent conflicts
     */
    private void terminateAllNgrokProcesses() {
        try {
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("🧹 Terminating all ngrok processes...");
            }

            String os = System.getProperty("os.name").toLowerCase();
            ProcessBuilder pb;

            if (os.contains("win")) {
                // Windows
                pb = new ProcessBuilder("taskkill", "/f", "/im", "ngrok.exe");
            } else if (os.contains("mac")) {
                // macOS
                pb = new ProcessBuilder("pkill", "-f", "ngrok");
            } else {
                // Linux and other Unix-like systems
                pb = new ProcessBuilder("pkill", "-f", "ngrok");
            }

            Process killProcess = pb.start();
            boolean finished = killProcess.waitFor(5, TimeUnit.SECONDS);

            if (finished) {
                int exitCode = killProcess.exitValue();
                if (exitCode == 0) {
                    if (statusWindow != null) {
                        statusWindow.addNgrokStatusMessage("✅ All ngrok processes terminated successfully");
                    }
                } else if (exitCode == 1 && !os.contains("win")) {
                    // Exit code 1 on Unix usually means "no processes found" which is fine
                    if (statusWindow != null) {
                        statusWindow.addNgrokStatusMessage("ℹ️  No ngrok processes found to terminate");
                    }
                } else {
                    if (statusWindow != null) {
                        statusWindow.addNgrokStatusMessage("⚠️  Process termination completed with exit code: " + exitCode);
                    }
                }
            } else {
                if (statusWindow != null) {
                    statusWindow.addNgrokStatusMessage("⚠️  Timeout waiting for ngrok process termination");
                }
                killProcess.destroyForcibly();
            }

            // Additional cleanup: try to kill any remaining ngrok processes by PID
            cleanupRemainingNgrokProcesses();

        } catch (Exception e) {
            if (statusWindow != null) {
                statusWindow.addNgrokStatusMessage("⚠️  Error terminating ngrok processes: " + e.getMessage());
            }
            // This is not critical, so we continue with shutdown
        }
    }

    /**
     * Additional cleanup for stubborn ngrok processes
     */
    private void cleanupRemainingNgrokProcesses() {
        try {
            String os = System.getProperty("os.name").toLowerCase();

            if (!os.contains("win")) {
                // Unix-like systems: get PIDs and kill them
                ProcessBuilder pb = new ProcessBuilder("pgrep", "-f", "ngrok");
                Process process = pb.start();

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        try {
                            int pid = Integer.parseInt(line.trim());
                            ProcessBuilder killPb = new ProcessBuilder("kill", "-9", String.valueOf(pid));
                            killPb.start().waitFor(1, TimeUnit.SECONDS);
                            System.out.println("🔥 Force killed ngrok process PID: " + pid);
                            if (statusWindow != null) {
                                statusWindow.addNgrokStatusMessage("🔥 Force killed ngrok process PID: " + pid);
                            }
                        } catch (NumberFormatException e) {
                            // Ignore invalid PID
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Ignore errors in cleanup
        }
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