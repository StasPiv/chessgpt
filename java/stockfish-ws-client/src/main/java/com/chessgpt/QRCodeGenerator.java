package com.chessgpt;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * QR Code Generator Utility
 * Handles QR code generation and saving operations
 */
public class QRCodeGenerator {
    
    private static final int DEFAULT_SIZE = 150;
    private static final int DEFAULT_MARGIN = 1;
    
    /**
     * Generate QR code image from URL
     * 
     * @param url The URL to encode in the QR code
     * @return BufferedImage containing the QR code, or null if generation failed
     */
    public static BufferedImage generateQRCode(String url) {
        return generateQRCode(url, DEFAULT_SIZE, DEFAULT_SIZE);
    }
    
    /**
     * Generate QR code image from URL with custom size
     * 
     * @param url The URL to encode in the QR code
     * @param width Width of the QR code image
     * @param height Height of the QR code image
     * @return BufferedImage containing the QR code, or null if generation failed
     */
    public static BufferedImage generateQRCode(String url, int width, int height) {
        if (url == null || url.trim().isEmpty()) {
            System.err.println("❌ Cannot generate QR code: URL is null or empty");
            return null;
        }
        
        try {
            // Configure QR code generation hints
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, DEFAULT_MARGIN);
            
            // Generate QR code bit matrix
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(url, BarcodeFormat.QR_CODE, width, height, hints);
            
            // Convert bit matrix to BufferedImage
            int matrixWidth = bitMatrix.getWidth();
            int matrixHeight = bitMatrix.getHeight();
            BufferedImage qrImage = new BufferedImage(matrixWidth, matrixHeight, BufferedImage.TYPE_INT_RGB);
            
            for (int x = 0; x < matrixWidth; x++) {
                for (int y = 0; y < matrixHeight; y++) {
                    qrImage.setRGB(x, y, bitMatrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
                }
            }
            
            System.out.println("✅ QR code generated successfully (" + matrixWidth + "x" + matrixHeight + ")");
            return qrImage;
            
        } catch (WriterException e) {
            System.err.println("❌ Error generating QR code: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Save QR code image to file
     * 
     * @param qrImage The QR code image to save
     * @param file The file to save to
     * @param format The image format (e.g., "PNG", "JPEG")
     * @return true if saved successfully, false otherwise
     */
    public static boolean saveQRCode(BufferedImage qrImage, File file, String format) {
        if (qrImage == null) {
            System.err.println("❌ Cannot save QR code: image is null");
            return false;
        }
        
        if (file == null) {
            System.err.println("❌ Cannot save QR code: file is null");
            return false;
        }
        
        try {
            boolean saved = ImageIO.write(qrImage, format, file);
            if (saved) {
                System.out.println("💾 QR code saved successfully to: " + file.getAbsolutePath());
                return true;
            } else {
                System.err.println("❌ Failed to save QR code: unsupported format '" + format + "'");
                return false;
            }
        } catch (IOException e) {
            System.err.println("❌ Error saving QR code to file: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Save QR code image to PNG file
     * 
     * @param qrImage The QR code image to save
     * @param file The file to save to
     * @return true if saved successfully, false otherwise
     */
    public static boolean saveQRCodePNG(BufferedImage qrImage, File file) {
        return saveQRCode(qrImage, file, "PNG");
    }
    
    /**
     * Generate and save QR code in one operation
     * 
     * @param url The URL to encode
     * @param file The file to save to
     * @param format The image format
     * @return true if generated and saved successfully, false otherwise
     */
    public static boolean generateAndSaveQRCode(String url, File file, String format) {
        BufferedImage qrImage = generateQRCode(url);
        if (qrImage != null) {
            return saveQRCode(qrImage, file, format);
        }
        return false;
    }
    
    /**
     * Generate and save QR code as PNG in one operation
     * 
     * @param url The URL to encode
     * @param file The file to save to
     * @return true if generated and saved successfully, false otherwise
     */
    public static boolean generateAndSaveQRCodePNG(String url, File file) {
        return generateAndSaveQRCode(url, file, "PNG");
    }
    
    /**
     * Get suggested filename for QR code
     * 
     * @param prefix Optional prefix for the filename
     * @return Suggested filename with timestamp
     */
    public static String getSuggestedFilename(String prefix) {
        String timestamp = java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        
        if (prefix != null && !prefix.trim().isEmpty()) {
            return prefix.trim() + "_" + timestamp + ".png";
        } else {
            return "qr_code_" + timestamp + ".png";
        }
    }
    
    /**
     * Get suggested filename for chess QR code
     * 
     * @return Suggested filename for chess-related QR codes
     */
    public static String getChessQRFilename() {
        return getSuggestedFilename("chess-ngrok-qr");
    }
}
