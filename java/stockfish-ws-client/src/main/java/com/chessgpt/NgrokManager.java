package com.chessgpt;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.awt.*;
import java.awt.datatransfer.StringSelection;
import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.TimeUnit;

/**
 * NgrokManager - Manages ngrok tunnel operations
 * Handles tunnel creation, monitoring, and cleanup
 */
public class NgrokManager {
    
    private static final String WEB_APP_BASE_URL = "https://chess-analyze.online";
    private static final String NGROK_API_URL = "http://localhost:4040/api/tunnels";
    
    // ngrok process and status
    private Process ngrokProcess;
    private String ngrokPublicUrl;
    private int targetPort;
    
    // Event listener
    private NgrokManagerListener listener;
    private StatusWindow statusWindow;
    
    public NgrokManager(int targetPort, NgrokManagerListener listener, StatusWindow statusWindow) {
        this.targetPort = targetPort;
        this.listener = listener;
        this.statusWindow = statusWindow;
    }
    
    /**
     * Interface for receiving ngrok manager events
     */
    public interface NgrokManagerListener {
        void onTunnelEstablished(String publicUrl, String wsUrl, String webAppUrl);
        void onTunnelFailed(String errorMessage);
        void onTunnelClosed();
    }
    
    /**
     * Start ngrok tunnel for the target port
     */
    public void startTunnel() {
        try {
            logStatus("🌐 Starting ngrok tunnel...", "info");
            
            // Check if there's already a running tunnel for this port
            logStatus("🔍 Checking for existing ngrok tunnels...");
            
            String existingUrl = checkExistingTunnel();
            if (existingUrl != null) {
                logStatus("✅ Found existing ngrok tunnel: " + existingUrl);
                handleTunnelSuccess(existingUrl);
                return;
            }
            
            // Try to terminate existing ngrok processes
            logStatus("🧹 Terminating conflicting ngrok processes...");
            terminateExistingProcesses();
            
            // Wait a bit after terminating processes
            Thread.sleep(2000);
            
            logStatus("🚀 Starting new ngrok process on port " + targetPort + "...");
            
            // Start ngrok process
            ProcessBuilder ngrokBuilder = new ProcessBuilder("ngrok", "http", String.valueOf(targetPort));
            ngrokProcess = ngrokBuilder.start();
            
            // Wait a moment for ngrok to start
            logStatus("⏳ Waiting for ngrok to initialize...");
            Thread.sleep(3000);
            
            // Get ngrok public URL
            logStatus("🔗 Querying ngrok API for public URL...");
            
            String publicUrl = getPublicUrl();
            if (publicUrl != null) {
                handleTunnelSuccess(publicUrl);
            } else {
                handleTunnelFailure("Failed to get ngrok public URL from API");
            }
            
        } catch (Exception e) {
            handleTunnelFailure("Error starting ngrok tunnel: " + e.getMessage());
        }
    }
    
    /**
     * Stop ngrok tunnel and cleanup
     */
    public void stopTunnel() {
        logStatus("🛑 Stopping ngrok tunnel...");
        
        // Stop specific ngrok process
        if (ngrokProcess != null && ngrokProcess.isAlive()) {
            logStatus("🌐 Stopping ngrok process...");
            ngrokProcess.destroy();
            try {
                if (!ngrokProcess.waitFor(3, TimeUnit.SECONDS)) {
                    logStatus("⚠️  Force killing ngrok process...");
                    ngrokProcess.destroyForcibly();
                }
                logStatus("✅ ngrok process stopped");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("❌ Interrupted while stopping ngrok");
            }
        }
        
        // Terminate all ngrok processes to prevent conflicts
        terminateAllProcesses();
        
        // Clear state
        ngrokProcess = null;
        ngrokPublicUrl = null;
        
        // Notify listener
        if (listener != null) {
            listener.onTunnelClosed();
        }
    }
    
    /**
     * Get current ngrok public URL
     */
    public String getPublicUrl() {
        if (ngrokPublicUrl != null) {
            return ngrokPublicUrl;
        }
        
        try {
            // Query ngrok local API
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(NGROK_API_URL))
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
                                
                                if (addr.equals("http://localhost:" + targetPort)) {
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
    
    /**
     * Check if tunnel is currently active
     */
    public boolean isTunnelActive() {
        return ngrokPublicUrl != null && getPublicUrl() != null;
    }
    
    /**
     * Get Web App URL with WebSocket parameter
     */
    public String getWebAppUrl() {
        if (ngrokPublicUrl == null) {
            return null;
        }
        
        String wsUrl = ngrokPublicUrl.replace("https://", "wss://");
        return WEB_APP_BASE_URL + "/?ws=" + wsUrl;
    }
    
    /**
     * Get WebSocket URL from HTTPS URL
     */
    public String getWebSocketUrl() {
        if (ngrokPublicUrl == null) {
            return null;
        }
        
        return ngrokPublicUrl.replace("https://", "wss://");
    }
    
    /**
     * Check for existing ngrok tunnel for the target port
     */
    private String checkExistingTunnel() {
        try {
            // Query ngrok local API to check existing tunnels
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(NGROK_API_URL))
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
                                
                                if (addr.equals("http://localhost:" + targetPort)) {
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
    
    /**
     * Terminate existing ngrok processes that might conflict
     */
    private void terminateExistingProcesses() {
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
                    logStatus("✅ Existing ngrok processes terminated successfully");
                } else if (exitCode == 1 && !os.contains("win")) {
                    logStatus("ℹ️  No conflicting ngrok processes found");
                } else {
                    logStatus("⚠️  Process termination completed with exit code: " + exitCode);
                }
            } else {
                logStatus("⚠️  Timeout waiting for process termination");
            }
            
        } catch (Exception e) {
            logStatus("⚠️  Could not terminate existing processes: " + e.getMessage());
        }
    }
    
    /**
     * Terminate all ngrok processes system-wide to prevent conflicts
     */
    private void terminateAllProcesses() {
        try {
            logStatus("🧹 Terminating all ngrok processes...");
            
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
                    logStatus("✅ All ngrok processes terminated successfully");
                } else if (exitCode == 1 && !os.contains("win")) {
                    // Exit code 1 on Unix usually means "no processes found" which is fine
                    logStatus("ℹ️  No ngrok processes found to terminate");
                } else {
                    logStatus("⚠️  Process termination completed with exit code: " + exitCode);
                }
            } else {
                logStatus("⚠️  Timeout waiting for ngrok process termination");
                killProcess.destroyForcibly();
            }
            
            // Additional cleanup: try to kill any remaining ngrok processes by PID
            cleanupRemainingProcesses();
            
        } catch (Exception e) {
            logStatus("⚠️  Error terminating ngrok processes: " + e.getMessage());
            // This is not critical, so we continue with shutdown
        }
    }
    
    /**
     * Additional cleanup for stubborn ngrok processes
     */
    private void cleanupRemainingProcesses() {
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
                            logStatus("🔥 Force killed ngrok process PID: " + pid);
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
    
    /**
     * Handle successful tunnel establishment
     */
    private void handleTunnelSuccess(String publicUrl) {
        this.ngrokPublicUrl = publicUrl;
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
        logStatus("✅ ngrok tunnel established successfully!", "success");
        logStatus("📡 Public HTTPS URL: " + publicUrl);
        logStatus("🔌 WebSocket WSS URL: " + wsUrl);
        logStatus("🎯 Ready to accept connections!");
        
        if (statusWindow != null) {
            statusWindow.updateNgrokUrl(webAppUrl);
        }
        
        // Copy to clipboard if possible
        copyToClipboard(webAppUrl);
        
        // Notify listener
        if (listener != null) {
            listener.onTunnelEstablished(publicUrl, wsUrl, webAppUrl);
        }
    }
    
    /**
     * Handle tunnel establishment failure
     */
    private void handleTunnelFailure(String errorMessage) {
        System.err.println("❌ " + errorMessage);
        System.out.println("💡 Make sure ngrok is installed and available in PATH");
        System.out.println("💡 Check if you have multiple ngrok sessions running");
        System.out.println("💡 Server is running locally on ws://localhost:" + targetPort);
        
        // Update StatusWindow with failure info
        logStatus("❌ " + errorMessage, "error");
        logStatus("💡 Make sure ngrok is installed and available in PATH");
        logStatus("💡 Check your ngrok account limits");
        logStatus("🔧 Server running locally on ws://localhost:" + targetPort);
        
        if (statusWindow != null) {
            statusWindow.updateNgrokUrl(null);
        }
        
        // Notify listener
        if (listener != null) {
            listener.onTunnelFailed(errorMessage);
        }
    }
    
    /**
     * Copy text to system clipboard
     */
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
            logStatus("📋 Link automatically copied to clipboard!");
            
        } catch (Exception e) {
            // Silently ignore clipboard errors
            System.out.println("💡 Copy the link above to access your chess analysis app");
            logStatus("💡 Copy the link above to access your chess analysis app");
        }
    }
    
    /**
     * Log status message to console and StatusWindow
     */
    private void logStatus(String message) {
        logStatus(message, null);
    }
    
    /**
     * Log status message with color indication
     */
    private void logStatus(String message, String colorType) {
        if (statusWindow != null) {
            statusWindow.addNgrokStatusMessage(message);
            if (colorType != null) {
                statusWindow.setNgrokStatusColor(colorType);
            }
        }
    }
}
