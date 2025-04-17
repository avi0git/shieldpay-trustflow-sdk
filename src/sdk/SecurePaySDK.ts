/**
 * SecurePaySDK.ts
 * Main entry point for the fraud prevention SDK
 */
import { DeviceFingerprint, DeviceInfo } from './DeviceFingerprint';
import { QRCodeManager, QRCodeData } from './QRCodeManager';
import { TrustedDeviceManager, TrustedDevice, Transaction, TransactionVerificationResult, BiometricType } from './TrustedDeviceManager';

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
  public static registerCurrentDevice(deviceName?: string, phoneNumber?: string): TrustedDevice {
    return TrustedDeviceManager.registerCurrentDevice(deviceName || 'My Device', phoneNumber);
  }
  
  /**
   * Check if current device is registered
   */
  public static isDeviceRegistered(): boolean {
    return TrustedDeviceManager.isCurrentDeviceRegistered();
  }
  
  /**
   * Get current device information
   */
  public static getCurrentDevice(): TrustedDevice | null {
    return TrustedDeviceManager.getCurrentDevice();
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
  
  /**
   * Generate verification code for high-value transactions
   */
  public static generateVerificationCode(): string {
    return TrustedDeviceManager.generateVerificationCode();
  }
  
  /**
   * Verify code entered by user
   */
  public static verifyCode(code: string): boolean {
    return TrustedDeviceManager.verifyCode(code);
  }
  
  /**
   * Register biometric for the current device
   */
  public static registerBiometric(biometricData: string, type: BiometricType): boolean {
    console.log(`[SecurePaySDK] Registering biometric: ${type}`);
    return TrustedDeviceManager.registerBiometric(biometricData, type);
  }
  
  /**
   * Get biometric type for current device
   */
  public static getBiometricType(): BiometricType | null {
    const device = TrustedDeviceManager.getCurrentDevice();
    console.log(`[SecurePaySDK] Getting biometric type: ${device?.biometricType || 'null'}`);
    return device?.biometricType || null;
  }
  
  /**
   * Get stored biometric data for current device
   */
  public static getBiometricData(): string | null {
    const device = TrustedDeviceManager.getCurrentDevice();
    console.log(`[SecurePaySDK] Getting biometric data, exists: ${!!device?.biometricData}`);
    return device?.biometricData || null;
  }
  
  /**
   * Verify biometric data for transaction
   */
  public static verifyBiometric(biometricData: string): boolean {
    console.log(`[SecurePaySDK] Verifying biometric data`);
    return TrustedDeviceManager.verifyBiometric(biometricData);
  }
  
  /**
   * Verify transaction with biometric
   */
  public static verifyTransactionWithBiometric(transaction: Transaction, biometricData: string): TransactionVerificationResult {
    return TrustedDeviceManager.verifyTransactionWithBiometric(transaction, biometricData);
  }
}

// Re-export types for easier consumption
export type { 
  DeviceInfo, 
  QRCodeData,
  TrustedDevice,
  Transaction,
  TransactionVerificationResult,
  BiometricType
};

// Export a default instance
export default SecurePaySDK;
