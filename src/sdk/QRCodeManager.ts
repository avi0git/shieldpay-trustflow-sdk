
/**
 * QRCodeManager.ts
 * Handles QR code generation and validation for device linking
 */
import { DeviceFingerprint, DeviceInfo } from './DeviceFingerprint';

export class QRCodeManager {
  /**
   * Generate QR code data for linking a new device
   * This QR code would contain encrypted device info and session data
   */
  public static generateQRCodeData(): string {
    const deviceInfo = DeviceFingerprint.generateFingerprint();
    const sessionToken = this.generateSessionToken();
    
    // Combine device info and session token
    const qrData = {
      deviceInfo,
      sessionToken,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes expiration
    };
    
    // In a real implementation, this data would be encrypted
    return btoa(JSON.stringify(qrData));
  }
  
  /**
   * Parse QR code data from a scanned QR code
   */
  public static parseQRCodeData(qrData: string): QRCodeData | null {
    try {
      const decoded = JSON.parse(atob(qrData));
      
      // Verify the QR code hasn't expired
      if (new Date(decoded.expiresAt) < new Date()) {
        console.error("QR code has expired");
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error("Failed to parse QR code data:", error);
      return null;
    }
  }
  
  private static generateSessionToken(): string {
    // Generate a random session token
    // In a real implementation, this would be cryptographically secure
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export interface QRCodeData {
  deviceInfo: DeviceInfo;
  sessionToken: string;
  expiresAt: string;
}
