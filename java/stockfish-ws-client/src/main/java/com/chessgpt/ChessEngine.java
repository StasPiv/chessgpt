package com.chessgpt;

import java.io.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Chess Engine Communication Manager
 * Handles communication with Polyglot/Stockfish chess engine
 */
public class ChessEngine {
    
    private static final Pattern INFO_PATTERN = Pattern.compile(
        "info.*?depth (\\d+).*?seldepth (\\d+).*?multipv (\\d+).*?score (cp|mate) (-?\\d+).*?nodes (\\d+).*?pv (.+)"
    );
    
    // Engine process management
    private Process engineProcess;
    private PrintWriter engineWriter;
    private boolean isInitialized = false;
    
    // Analysis state
    private String currentFen = "startpos";
    private Map<String, AnalysisLine> analysisLines = new ConcurrentHashMap<>();
    private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private ScheduledFuture<?> analysisTimeout;
    
    // Event listeners
    private ChessEngineListener listener;
    private StatusWindow statusWindow;
    
    public ChessEngine(ChessEngineListener listener, StatusWindow statusWindow) {
        this.listener = listener;
        this.statusWindow = statusWindow;
    }
    
    /**
     * Interface for receiving chess engine events
     */
    public interface ChessEngineListener {
        void onEngineReady();
        void onEngineError(String error);
        void onAnalysisUpdate(String fen, Map<String, AnalysisLine> lines);
    }
    
    /**
     * Start the chess engine process
     */
    public void start() throws IOException {
        try {
            System.out.println("🎯 Starting chess engine (Polyglot)...");
            
            ProcessBuilder pb = new ProcessBuilder("polyglot");
            engineProcess = pb.start();
            
            engineWriter = new PrintWriter(new OutputStreamWriter(engineProcess.getOutputStream()), true);
            
            // Start engine output readers
            Thread outputReader = new Thread(this::readEngineOutput);
            outputReader.setDaemon(true);
            outputReader.start();
            
            Thread errorReader = new Thread(this::readEngineErrors);
            errorReader.setDaemon(true);
            errorReader.start();
            
            System.out.println("✅ Chess engine process started successfully");
            
            // Initialize engine
            sendCommand("uci");
            sendCommand("setoption name MultiPV value 4");
            sendCommand("isready");
            
        } catch (IOException e) {
            System.err.println("❌ Failed to start chess engine: " + e.getMessage());
            if (statusWindow != null) {
                statusWindow.updateEngineStatus(false);
            }
            throw e;
        }
    }
    
    /**
     * Send a command to the chess engine
     */
    public void sendCommand(String command) {
        System.out.println("🎯 Sending to engine: " + command);
        if (engineWriter != null) {
            engineWriter.println(command);
        }
    }
    
    /**
     * Start analyzing a position
     */
    public void analyze(String fen) {
        stopAnalysis();
        currentFen = fen;
        System.out.println("🔍 Starting analysis for position: " + currentFen);
        sendCommand("position fen " + currentFen);
        sendCommand("go infinite");
    }
    
    /**
     * Stop current analysis
     */
    public void stopAnalysis() {
        if (analysisTimeout != null) {
            analysisTimeout.cancel(false);
        }
        sendCommand("stop");
    }
    
    /**
     * Check if engine is ready for commands
     */
    public boolean isReady() {
        return isInitialized && engineProcess != null && engineProcess.isAlive();
    }
    
    /**
     * Get current analysis lines
     */
    public Map<String, AnalysisLine> getAnalysisLines() {
        return new ConcurrentHashMap<>(analysisLines);
    }
    
    /**
     * Get current FEN being analyzed
     */
    public String getCurrentFen() {
        return currentFen;
    }
    
    /**
     * Shutdown the chess engine
     */
    public void shutdown() {
        System.out.println("🎯 Stopping chess engine...");
        
        // Stop any ongoing analysis
        stopAnalysis();
        
        // Stop engine process
        if (engineProcess != null && engineProcess.isAlive()) {
            engineProcess.destroy();
            try {
                if (!engineProcess.waitFor(3, java.util.concurrent.TimeUnit.SECONDS)) {
                    System.out.println("⚠️  Force killing chess engine...");
                    engineProcess.destroyForcibly();
                }
                System.out.println("✅ Chess engine stopped");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("❌ Interrupted while stopping chess engine");
            }
        }
        
        // Shutdown scheduler
        if (scheduler != null) {
            System.out.println("⏰ Stopping engine scheduler...");
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(2, java.util.concurrent.TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
                System.out.println("✅ Engine scheduler stopped");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                scheduler.shutdownNow();
            }
        }
    }
    
    private void readEngineOutput() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(engineProcess.getInputStream()))) {
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
            if (listener != null) {
                listener.onEngineError("Error reading engine output: " + e.getMessage());
            }
        }
        
        System.err.println("❌ Chess engine process terminated");
        if (statusWindow != null) {
            statusWindow.updateEngineStatus(false);
        }
    }
    
    private void readEngineErrors() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(engineProcess.getErrorStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.err.println("🎯 Engine error: " + line);
                if (listener != null) {
                    listener.onEngineError(line);
                }
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
            isInitialized = true;
            if (listener != null) {
                listener.onEngineReady();
            }
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
            
            int depthValue = Integer.parseInt(depth);
            
            // Clear old lines when receiving first line with depth 1
            if (depthValue == 1 && pvNum.equals("1")) {
                analysisLines.clear();
                System.out.println("🧹 Cleared previous analysis lines (new analysis started with depth 1)");
            }
            
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
            analysisLine.depth = depthValue;
            analysisLine.nodes = Long.parseLong(nodes);
            analysisLine.uciMoves = String.join(" ", moveList);
            analysisLine.fen = currentFen;
            
            analysisLines.put(pvNum, analysisLine);
            
            // Notify listener about analysis update
            if (listener != null) {
                listener.onAnalysisUpdate(currentFen, getAnalysisLines());
            }
        }
    }
    
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
