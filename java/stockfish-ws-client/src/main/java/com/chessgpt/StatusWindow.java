package com.chessgpt;

import javax.swing.*;
import java.awt.*;
import java.awt.geom.Ellipse2D;

public class StatusWindow extends JFrame {
    private JPanel webSocketStatusPanel;
    private JPanel engineStatusPanel;
    private boolean webSocketConnected = false;
    private boolean engineConnected = false;
    
    public StatusWindow() {
        initializeUI();
    }
    
    private void initializeUI() {
        setTitle("Chess Engine Client - Status");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(300, 180);
        setLocationRelativeTo(null);
        setResizable(false);
        
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
        
        add(mainPanel);
        setVisible(true);
    }
    
    private JPanel createStatusPanel(String title, boolean connected) {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        panel.setBorder(BorderFactory.createTitledBorder(title));
        
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
}