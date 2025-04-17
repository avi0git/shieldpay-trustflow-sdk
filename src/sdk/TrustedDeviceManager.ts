/**
 * TrustedDeviceManager.ts
 * Manages the list of trusted devices and verifies transactions
 */
import { DeviceFingerprint, DeviceInfo } from './DeviceFingerprint';
import { QRCodeData } from './QRCodeManager';

export type BiometricType = 'face' | 'fingerprint' | 'none';

export class TrustedDeviceManager {
  private static readonly TRUSTED_DEVICES_KEY = 'trusted_devices';
  private static readonly CURRENT_DEVICE_KEY = 'current_device_registered';
  private static readonly HIGH_VALUE_THRESHOLD = 10000; // Threshold for high-value transactions
  private static readonly VERIFICATION_CODE_KEY = 'verification_code';
  
  /**
   * Register the current device as trusted
   */
  public static registerCurrentDevice(deviceName: string, phoneNumber?: string): TrustedDevice {
    const deviceInfo = DeviceFingerprint.generateFingerprint();
    
    const trustedDevice: TrustedDevice = {
      ...deviceInfo,
      name: deviceName || deviceInfo.deviceName,
      isCurrentDevice: true,
      lastVerified: new Date().toISOString(),
      phoneNumber: phoneNumber || '',
      biometricType: 'none',
      biometricData: null,
    };
    
    // Save current device status
    localStorage.setItem(this.CURRENT_DEVICE_KEY, 'true');
    
    // Add to trusted devices
    this.addTrustedDevice(trustedDevice);
    
    return trustedDevice;
  }
  
  /**
   * Register biometric for current device
   */
  public static registerBiometric(biometricData: string, type: BiometricType): boolean {
    console.log(`Registering biometric: ${type}, data length: ${biometricData.length}`);
    
    const currentDevice = this.getCurrentDevice();
    if (!currentDevice) {
      console.error("Cannot register biometric: No current device found");
      return false;
    }
    
    currentDevice.biometricType = type;
    currentDevice.biometricData = biometricData;
    
    // Update device in storage
    this.addTrustedDevice(currentDevice);
    console.log(`Biometric registered: ${type}`);
    
    return true;
  }
  
  /**
   * Verify biometric data against stored data
   */
  public static verifyBiometric(biometricData: string): boolean {
    const currentDevice = this.getCurrentDevice();
    console.log("Verifying biometric data against stored data");
    console.log(`Current device: ${currentDevice?.name || 'None'}`);
    console.log(`Biometric type: ${currentDevice?.biometricType || 'None'}`);
    
    if (!currentDevice || !currentDevice.biometricData || currentDevice.biometricType === 'none') {
      console.error("Cannot verify biometric: No biometric data found");
      return false;
    }
    
    // In a real implementation, this would use sophisticated biometric comparison algorithms
    // For this demo implementation, we'll simulate a successful match
    
    // For a real implementation, we would compare:
    // 1. For face recognition: facial features using techniques like eigenfaces or neural networks
    // 2. For fingerprint: minutiae points and ridge patterns
    
    console.log("Biometric data provided for verification");
    
    // Since this is a demo, we'll just assume the verification is successful
    // In a production system, this would use proper biometric matching
    return true;
  }
  
  /**
   * Verify transaction with biometric authentication
   */
  public static verifyTransactionWithBiometric(transaction: Transaction, biometricData: string): TransactionVerificationResult {
    const isTrustedDevice = this.isCurrentDeviceRegistered();
    
    if (!isTrustedDevice) {
      return {
        verified: false,
        riskLevel: 'high',
        reason: 'Untrusted device',
        recommendation: 'Block transaction',
        requiresCallVerification: false,
      };
    }
    
    // Check if biometric verification passed
    const biometricVerified = this.verifyBiometric(biometricData);
    if (!biometricVerified) {
      return {
        verified: false,
        riskLevel: 'high',
        reason: 'Biometric verification failed',
        recommendation: 'Block transaction',
        requiresCallVerification: false,
      };
    }
    
    // Check if this is a high-value transaction
    const isHighValueTransaction = transaction.amount >= this.HIGH_VALUE_THRESHOLD;
    
    if (isHighValueTransaction) {
      return {
        verified: true, // Device is trusted, but amount requires additional verification
        riskLevel: 'medium',
        reason: 'High-value transaction requires additional verification',
        recommendation: 'Verify via phone call',
        requiresCallVerification: true,
      };
    }
    
    return {
      verified: true,
      riskLevel: 'low',
      reason: 'Trusted device with verified biometrics',
      recommendation: 'Allow transaction',
      requiresCallVerification: false,
    };
  }
  
  /**
   * Link a new device using QR code data
   */
  public static linkDeviceFromQR(qrData: QRCodeData): TrustedDevice | null {
    console.log("Linking device from QR data:", qrData);
    if (!qrData || !qrData.deviceInfo) {
      console.error("Invalid QR data for device linking");
      return null;
    }
    
    const trustedDevice: TrustedDevice = {
      ...qrData.deviceInfo,
      name: `${qrData.deviceInfo.platform} Device`,
      isCurrentDevice: false,
      lastVerified: new Date().toISOString(),
      phoneNumber: '',
    };
    
    this.addTrustedDevice(trustedDevice);
    console.log("Device linked successfully:", trustedDevice);
    
    return trustedDevice;
  }
  
  /**
   * Generate a verification code for high-value transactions
   */
  public static generateVerificationCode(): string {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Store the code temporarily
    localStorage.setItem(this.VERIFICATION_CODE_KEY, code);
    return code;
  }
  
  /**
   * Verify the user-entered code against the stored code
   */
  public static verifyCode(userEnteredCode: string): boolean {
    const storedCode = localStorage.getItem(this.VERIFICATION_CODE_KEY);
    if (!storedCode) return false;
    
    const isValid = storedCode === userEnteredCode;
    
    // Clear the code after verification attempt
    localStorage.removeItem(this.VERIFICATION_CODE_KEY);
    
    return isValid;
  }
  
  /**
   * Check if current device is registered as trusted
   */
  public static isCurrentDeviceRegistered(): boolean {
    const isRegistered = localStorage.getItem(this.CURRENT_DEVICE_KEY) === 'true';
    
    if (isRegistered) {
      // Verify that device ID exists in trusted devices
      const currentDeviceId = DeviceFingerprint.getDeviceId();
      const trustedDevices = this.getTrustedDevices();
      return trustedDevices.some(device => device.deviceId === currentDeviceId);
    }
    
    return false;
  }
  
  /**
   * Get all trusted devices
   */
  public static getTrustedDevices(): TrustedDevice[] {
    const storedDevices = localStorage.getItem(this.TRUSTED_DEVICES_KEY);
    if (!storedDevices) {
      return [];
    }
    
    try {
      return JSON.parse(storedDevices);
    } catch (error) {
      console.error("Failed to parse trusted devices:", error);
      return [];
    }
  }
  
  /**
   * Get current device
   */
  public static getCurrentDevice(): TrustedDevice | null {
    const currentDeviceId = DeviceFingerprint.getDeviceId();
    const trustedDevices = this.getTrustedDevices();
    return trustedDevices.find(device => device.deviceId === currentDeviceId) || null;
  }
  
  /**
   * Verify if a transaction is coming from a trusted device
   */
  public static verifyTransaction(transaction: Transaction): TransactionVerificationResult {
    const isTrustedDevice = this.isCurrentDeviceRegistered();
    
    if (!isTrustedDevice) {
      return {
        verified: false,
        riskLevel: 'high',
        reason: 'Untrusted device',
        recommendation: 'Block transaction',
        requiresCallVerification: false,
      };
    }
    
    const currentDevice = this.getCurrentDevice();
    if (currentDevice?.biometricType !== 'none' && !currentDevice?.biometricVerified) {
      return {
        verified: false,
        riskLevel: 'medium',
        reason: 'Biometric verification required',
        recommendation: 'Complete biometric verification',
        requiresCallVerification: false,
        requiresBiometricVerification: true,
      };
    }
    
    // Check if this is a high-value transaction
    const isHighValueTransaction = transaction.amount >= this.HIGH_VALUE_THRESHOLD;
    
    if (isHighValueTransaction) {
      return {
        verified: true, // Device is trusted, but amount requires additional verification
        riskLevel: 'medium',
        reason: 'High-value transaction requires additional verification',
        recommendation: 'Verify via phone call',
        requiresCallVerification: true,
      };
    }
    
    return {
      verified: true,
      riskLevel: 'low',
      reason: 'Trusted device',
      recommendation: 'Allow transaction',
      requiresCallVerification: false,
    };
  }
  
  /**
   * Remove a trusted device
   */
  public static removeTrustedDevice(deviceId: string): boolean {
    const devices = this.getTrustedDevices().filter(
      device => device.deviceId !== deviceId
    );
    
    localStorage.setItem(this.TRUSTED_DEVICES_KEY, JSON.stringify(devices));
    
    // If removing current device, update registration status
    if (deviceId === DeviceFingerprint.getDeviceId()) {
      localStorage.removeItem(this.CURRENT_DEVICE_KEY);
    }
    
    // Notify that trusted devices have been updated
    const event = new CustomEvent('trustedDevicesUpdated');
    window.dispatchEvent(event);
    
    return true;
  }
  
  private static addTrustedDevice(device: TrustedDevice): void {
    console.log("Adding trusted device:", device);
    const devices = this.getTrustedDevices();
    
    // Check if device already exists, update it if it does
    const existingIndex = devices.findIndex(d => d.deviceId === device.deviceId);
    
    if (existingIndex >= 0) {
      devices[existingIndex] = {
        ...devices[existingIndex],
        ...device,
        lastVerified: new Date().toISOString(),
      };
    } else {
      devices.push(device);
    }
    
    localStorage.setItem(this.TRUSTED_DEVICES_KEY, JSON.stringify(devices));
    
    // Notify that trusted devices have been updated
    const event = new CustomEvent('trustedDevicesUpdated');
    window.dispatchEvent(event);
  }
}

export interface TrustedDevice extends DeviceInfo {
  name: string;
  isCurrentDevice: boolean;
  lastVerified: string;
  phoneNumber?: string;
  biometricType?: BiometricType;
  biometricData?: string | null;
  biometricVerified?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  timestamp: string;
  recipient: string;
}

export interface TransactionVerificationResult {
  verified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  recommendation: string;
  requiresCallVerification: boolean;
  requiresBiometricVerification?: boolean;
}
