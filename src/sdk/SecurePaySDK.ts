
/**
 * SecurePaySDK.ts
 * Main entry point for the fraud prevention SDK
 */
import { DeviceFingerprint, DeviceInfo } from './DeviceFingerprint';
import { QRCodeManager, QRCodeData } from './QRCodeManager';
import { TrustedDeviceManager, TrustedDevice, Transaction, TransactionVerificationResult } from './TrustedDeviceManager';

export class SecurePaySDK {
  /**
   * Initialize the SDK
   */
  public static init(): void {
    console.log("SecurePaySDK initialized");
    // In a real implementation, this would set up necessary configurations,
    // connect to backend services, initialize analytics, etc.
  }
  
  /**
   * Get device information
   */
  public static getDeviceInfo(): DeviceInfo {
    return DeviceFingerprint.generateFingerprint();
  }
  
  /**
   * Register current device as trusted
   */
  public static registerCurrentDevice(deviceName?: string): TrustedDevice {
    return TrustedDeviceManager.registerCurrentDevice(deviceName || 'My Device');
  }
  
  /**
   * Check if current device is registered
   */
  public static isDeviceRegistered(): boolean {
    return TrustedDeviceManager.isCurrentDeviceRegistered();
  }
  
  /**
   * Generate QR code data for linking a new device
   */
  public static generateQRCodeData(): string {
    return QRCodeManager.generateQRCodeData();
  }
  
  /**
   * Process QR code data from scan
   */
  public static processQRCodeData(qrData: string): TrustedDevice | null {
    const parsedData = QRCodeManager.parseQRCodeData(qrData);
    if (!parsedData) {
      return null;
    }
    
    return TrustedDeviceManager.linkDeviceFromQR(parsedData);
  }
  
  /**
   * Get list of trusted devices
   */
  public static getTrustedDevices(): TrustedDevice[] {
    return TrustedDeviceManager.getTrustedDevices();
  }
  
  /**
   * Remove trusted device
   */
  public static removeTrustedDevice(deviceId: string): boolean {
    return TrustedDeviceManager.removeTrustedDevice(deviceId);
  }
  
  /**
   * Verify transaction security
   */
  public static verifyTransaction(transaction: Transaction): TransactionVerificationResult {
    return TrustedDeviceManager.verifyTransaction(transaction);
  }
}

// Re-export types for easier consumption
export type { 
  DeviceInfo, 
  QRCodeData,
  TrustedDevice,
  Transaction,
  TransactionVerificationResult
};

// Export a default instance
export default SecurePaySDK;
