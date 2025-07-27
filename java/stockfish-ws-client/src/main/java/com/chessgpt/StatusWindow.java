package com.chessgpt;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import javax.swing.*;
import java.awt.*;
import java.awt.datatransfer.StringSelection;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class StatusWindow extends JFrame {
    private JPanel webSocketStatusPanel;
    private JPanel engineStatusPanel;
    private JPanel ngrokPanel;
    private JTextField ngrokUrlField;
    private JTextArea ngrokStatusArea;
    private JScrollPane ngrokStatusScrollPane;
    private JLabel qrCodeLabel;
    private JButton copyButton;
    private JButton openButton;
    private JButton saveQRButton;
    private boolean webSocketConnected = false;
    private boolean engineConnected = false;
    private String ngrokUrl = null;
    private BufferedImage qrCodeImage = null;
    
    public StatusWindow() {
        initializeUI();
    }
    
    private void initializeUI() {
        setTitle("Chess Engine Client - Status");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(600, 600);
        setLocationRelativeTo(null);
        setResizable(true);
        
        // Main panel
        JPanel mainPanel = new JPanel();
        mainPanel.setLayout(new BoxLayout(mainPanel, BoxLayout.Y_AXIS));
        mainPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // WebSocket status panel
        webSocketStatusPanel = createStatusPanel("WebSocket Server", webSocketConnected);
        mainPanel.add(webSocketStatusPanel);
        
        // Chess Engine status panel
        engineStatusPanel = createStatusPanel("Chess Engine", engineConnected);
        mainPanel.add(engineStatusPanel);
        
        // ngrok panel
        ngrokPanel = createNgrokPanel();
        mainPanel.add(ngrokPanel);
        
        add(mainPanel);
        setVisible(true);
    }
    
    private JPanel createStatusPanel(String title, boolean connected) {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        panel.setBorder(BorderFactory.createTitledBorder(title));
        panel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 60));
        
        JPanel statusIndicator = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2d = (Graphics2D) g.create();
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                
                // Set color based on connection status
                if (connected) {
                    g2d.setColor(Color.GREEN);
                } else {
                    g2d.setColor(Color.RED);
                }
                
                // Draw filled circle
                Ellipse2D.Double circle = new Ellipse2D.Double(2, 2, 16, 16);
                g2d.fill(circle);
                g2d.dispose();
            }
        };
        statusIndicator.setPreferredSize(new Dimension(20, 20));
        
        JLabel statusLabel = new JLabel(connected ? "Connected" : "Disconnected");
        statusLabel.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
        
        panel.add(statusIndicator);
        panel.add(Box.createHorizontalStrut(5));
        panel.add(statusLabel);
        
        return panel;
    }
    
    private JPanel createNgrokPanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBorder(BorderFactory.createTitledBorder("ngrok Tunnel Status"));
        panel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 400));
        
        // Status text area
        ngrokStatusArea = new JTextArea(6, 50);
        ngrokStatusArea.setEditable(false);
        ngrokStatusArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 11));
        ngrokStatusArea.setBackground(new Color(248, 248, 248));
        ngrokStatusArea.setText("🌐 Initializing ngrok tunnel...\n");
        ngrokStatusArea.setLineWrap(true);
        ngrokStatusArea.setWrapStyleWord(true);
        
        ngrokStatusScrollPane = new JScrollPane(ngrokStatusArea);
        ngrokStatusScrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        ngrokStatusScrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        
        // URL and QR Code panel
        JPanel urlQrPanel = new JPanel(new BorderLayout());
        
        // Left side - URL and buttons
        JPanel urlPanel = new JPanel();
        urlPanel.setLayout(new BoxLayout(urlPanel, BoxLayout.Y_AXIS));
        urlPanel.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 10));
        
        // URL field
        ngrokUrlField = new JTextField();
        ngrokUrlField.setEditable(false);
        ngrokUrlField.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 11));
        ngrokUrlField.setText("Waiting for ngrok tunnel...");
        ngrokUrlField.setBackground(Color.WHITE);
        
        // Buttons panel
        JPanel buttonsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 5));
        
        copyButton = new JButton("📋 Copy Link");
        copyButton.setEnabled(false);
        copyButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                copyToClipboard();
            }
        });
        
        openButton = new JButton("🌐 Open in Browser");
        openButton.setEnabled(false);
        openButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                openInBrowser();
            }
        });
        
        saveQRButton = new JButton("💾 Save QR Code");
        saveQRButton.setEnabled(false);
        saveQRButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                saveQRCode();
            }
        });
        
        buttonsPanel.add(copyButton);
        buttonsPanel.add(openButton);
        buttonsPanel.add(saveQRButton);
        
        urlPanel.add(new JLabel("🔗 Ready URL:"));
        urlPanel.add(Box.createVerticalStrut(2));
        urlPanel.add(ngrokUrlField);
        urlPanel.add(Box.createVerticalStrut(5));
        urlPanel.add(buttonsPanel);
        
        // Right side - QR Code
        JPanel qrPanel = new JPanel();
        qrPanel.setLayout(new BoxLayout(qrPanel, BoxLayout.Y_AXIS));
        qrPanel.setBorder(BorderFactory.createTitledBorder("📱 QR Code"));
        qrPanel.setPreferredSize(new Dimension(180, 160));
        
        qrCodeLabel = new JLabel();
        qrCodeLabel.setHorizontalAlignment(JLabel.CENTER);
        qrCodeLabel.setVerticalAlignment(JLabel.CENTER);
        qrCodeLabel.setPreferredSize(new Dimension(150, 150));
        qrCodeLabel.setBorder(BorderFactory.createLoweredBevelBorder());
        qrCodeLabel.setText("<html><center>📱<br>QR Code<br>will appear<br>here</center></html>");
        qrCodeLabel.setHorizontalTextPosition(JLabel.CENTER);
        qrCodeLabel.setVerticalTextPosition(JLabel.CENTER);
        
        qrPanel.add(qrCodeLabel);
        
        urlQrPanel.add(urlPanel, BorderLayout.CENTER);
        urlQrPanel.add(qrPanel, BorderLayout.EAST);
        
        panel.add(Box.createVerticalStrut(5));
        panel.add(ngrokStatusScrollPane);
        panel.add(Box.createVerticalStrut(5));
        panel.add(urlQrPanel);
        
        return panel;
    }
    
    public void updateWebSocketStatus(boolean connected) {
        SwingUtilities.invokeLater(() -> {
            this.webSocketConnected = connected;
            
            // Remove old panel and create new one with updated status
            Container parent = webSocketStatusPanel.getParent();
            parent.remove(webSocketStatusPanel);
            webSocketStatusPanel = createStatusPanel("WebSocket Server", connected);
            parent.add(webSocketStatusPanel, 0);
            parent.revalidate();
            parent.repaint();
        });
    }
    
    public void updateEngineStatus(boolean connected) {
        SwingUtilities.invokeLater(() -> {
            this.engineConnected = connected;
            
            // Remove old panel and create new one with updated status
            Container parent = engineStatusPanel.getParent();
            parent.remove(engineStatusPanel);
            engineStatusPanel = createStatusPanel("Chess Engine", connected);
            parent.add(engineStatusPanel, 1);
            parent.revalidate();
            parent.repaint();
        });
    }
    
    /**
     * Add status message to ngrok status area
     */
    public void addNgrokStatusMessage(String message) {
        SwingUtilities.invokeLater(() -> {
            String timestamp = java.time.LocalTime.now().format(
                java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss")
            );
            String formattedMessage = "[" + timestamp + "] " + message + "\n";
            
            ngrokStatusArea.append(formattedMessage);
            
            // Auto-scroll to bottom
            ngrokStatusArea.setCaretPosition(ngrokStatusArea.getDocument().getLength());
            
            // Limit text area size (keep last 50 lines)
            String[] lines = ngrokStatusArea.getText().split("\n");
            if (lines.length > 50) {
                StringBuilder sb = new StringBuilder();
                for (int i = lines.length - 50; i < lines.length; i++) {
                    sb.append(lines[i]).append("\n");
                }
                ngrokStatusArea.setText(sb.toString());
                ngrokStatusArea.setCaretPosition(ngrokStatusArea.getDocument().getLength());
            }
        });
    }
    
    /**
     * Clear ngrok status messages
     */
    public void clearNgrokStatus() {
        SwingUtilities.invokeLater(() -> {
            ngrokStatusArea.setText("");
        });
    }
    
    /**
     * Set ngrok status area background color based on status
     */
    public void setNgrokStatusColor(String status) {
        SwingUtilities.invokeLater(() -> {
            Color backgroundColor;
            switch (status.toLowerCase()) {
                case "success":
                    backgroundColor = new Color(230, 255, 230); // Light green
                    break;
                case "error":
                    backgroundColor = new Color(255, 230, 230); // Light red
                    break;
                case "warning":
                    backgroundColor = new Color(255, 255, 200); // Light yellow
                    break;
                case "info":
                default:
                    backgroundColor = new Color(248, 248, 248); // Light gray
                    break;
            }
            ngrokStatusArea.setBackground(backgroundColor);
        });
    }
    
    /**
     * Generate QR code image from URL
     */
    private BufferedImage generateQRCode(String url) {
        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);
            
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, 150, 150, hints);
            
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();
            BufferedImage qrImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    qrImage.setRGB(x, y, bitMatrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
                }
            }
            
            return qrImage;
            
        } catch (WriterException e) {
            System.err.println("❌ Error generating QR code: " + e.getMessage());
            return null;
        }
    }
    
    public void updateNgrokUrl(String url) {
        SwingUtilities.invokeLater(() -> {
            this.ngrokUrl = url;
            
            if (url != null && !url.isEmpty()) {
                ngrokUrlField.setText(url);
                ngrokUrlField.setBackground(new Color(230, 255, 230)); // Light green
                copyButton.setEnabled(true);
                openButton.setEnabled(true);
                
                // Generate and display QR code
                addNgrokStatusMessage("📱 Generating QR code...");
                qrCodeImage = generateQRCode(url);
                if (qrCodeImage != null) {
                    ImageIcon qrIcon = new ImageIcon(qrCodeImage);
                    qrCodeLabel.setIcon(qrIcon);
                    qrCodeLabel.setText("");
                    saveQRButton.setEnabled(true);
                    addNgrokStatusMessage("✅ QR code generated successfully!");
                } else {
                    qrCodeLabel.setIcon(null);
                    qrCodeLabel.setText("<html><center>❌<br>QR Code<br>generation<br>failed</center></html>");
                    saveQRButton.setEnabled(false);
                    addNgrokStatusMessage("❌ Failed to generate QR code");
                }
                
                setNgrokStatusColor("success");
            } else {
                ngrokUrlField.setText("No ngrok URL available");
                ngrokUrlField.setBackground(new Color(255, 230, 230)); // Light red
                copyButton.setEnabled(false);
                openButton.setEnabled(false);
                saveQRButton.setEnabled(false);
                
                // Clear QR code
                qrCodeLabel.setIcon(null);
                qrCodeLabel.setText("<html><center>📱<br>QR Code<br>not available</center></html>");
                qrCodeImage = null;
                
                setNgrokStatusColor("error");
            }
        });
    }
    
    private void copyToClipboard() {
        if (ngrokUrl != null && !ngrokUrl.isEmpty()) {
            StringSelection stringSelection = new StringSelection(ngrokUrl);
            Toolkit.getDefaultToolkit().getSystemClipboard().setContents(stringSelection, null);
            
            // Show temporary feedback
            String originalText = copyButton.getText();
            copyButton.setText("✅ Copied!");
            copyButton.setEnabled(false);
            
            addNgrokStatusMessage("📋 URL copied to clipboard");
            
            Timer timer = new Timer(2000, e -> {
                copyButton.setText(originalText);
                copyButton.setEnabled(true);
            });
            timer.setRepeats(false);
            timer.start();
        }
    }
    
    private void openInBrowser() {
        if (ngrokUrl != null && !ngrokUrl.isEmpty()) {
            try {
                if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                    Desktop.getDesktop().browse(new URI(ngrokUrl));
                    addNgrokStatusMessage("🌐 Opened URL in browser");
                } else {
                    // Fallback for systems without Desktop support
                    String os = System.getProperty("os.name").toLowerCase();
                    if (os.contains("win")) {
                        Runtime.getRuntime().exec("rundll32 url.dll,FileProtocolHandler " + ngrokUrl);
                    } else if (os.contains("mac")) {
                        Runtime.getRuntime().exec("open " + ngrokUrl);
                    } else if (os.contains("nix") || os.contains("nux")) {
                        Runtime.getRuntime().exec("xdg-open " + ngrokUrl);
                    }
                    addNgrokStatusMessage("🌐 Attempting to open URL in browser");
                }
            } catch (Exception e) {
                addNgrokStatusMessage("❌ Failed to open browser: " + e.getMessage());
                JOptionPane.showMessageDialog(this, 
                    "Could not open browser. Please copy the URL manually:\n" + ngrokUrl, 
                    "Browser Error", 
                    JOptionPane.INFORMATION_MESSAGE);
            }
        } else {
            addNgrokStatusMessage("⚠️  No URL available to open");
        }
    }
    
    private void saveQRCode() {
        if (qrCodeImage == null) {
            addNgrokStatusMessage("⚠️  No QR code available to save");
            return;
        }
        
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setDialogTitle("Save QR Code");
        fileChooser.setSelectedFile(new java.io.File("chess-ngrok-qr.png"));
        fileChooser.setFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("PNG Images", "png"));
        
        int userSelection = fileChooser.showSaveDialog(this);
        
        if (userSelection == JFileChooser.APPROVE_OPTION) {
            java.io.File fileToSave = fileChooser.getSelectedFile();
            
            // Ensure .png extension
            if (!fileToSave.getName().toLowerCase().endsWith(".png")) {
                fileToSave = new java.io.File(fileToSave.getAbsolutePath() + ".png");
            }
            
            try {
                javax.imageio.ImageIO.write(qrCodeImage, "PNG", fileToSave);
                addNgrokStatusMessage("💾 QR code saved to: " + fileToSave.getAbsolutePath());
                
                // Show temporary feedback
                String originalText = saveQRButton.getText();
                saveQRButton.setText("✅ Saved!");
                saveQRButton.setEnabled(false);
                
                Timer timer = new Timer(2000, e -> {
                    saveQRButton.setText(originalText);
                    saveQRButton.setEnabled(true);
                });
                timer.setRepeats(false);
                timer.start();
                
            } catch (java.io.IOException e) {
                addNgrokStatusMessage("❌ Failed to save QR code: " + e.getMessage());
                JOptionPane.showMessageDialog(this, 
                    "Failed to save QR code:\n" + e.getMessage(), 
                    "Save Error", 
                    JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}