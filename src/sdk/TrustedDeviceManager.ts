
/**
 * TrustedDeviceManager.ts
 * Manages the list of trusted devices and verifies transactions
 */
import { DeviceFingerprint, DeviceInfo } from './DeviceFingerprint';
import { QRCodeData } from './QRCodeManager';

export class TrustedDeviceManager {
  private static readonly TRUSTED_DEVICES_KEY = 'trusted_devices';
  private static readonly CURRENT_DEVICE_KEY = 'current_device_registered';
  
  /**
   * Register the current device as trusted
   */
  public static registerCurrentDevice(deviceName: string): TrustedDevice {
    const deviceInfo = DeviceFingerprint.generateFingerprint();
    
    const trustedDevice: TrustedDevice = {
      ...deviceInfo,
      name: deviceName || deviceInfo.deviceName,
      isCurrentDevice: true,
      lastVerified: new Date().toISOString(),
    };
    
    // Save current device status
    localStorage.setItem(this.CURRENT_DEVICE_KEY, 'true');
    
    // Add to trusted devices
    this.addTrustedDevice(trustedDevice);
    
    return trustedDevice;
  }
  
  /**
   * Link a new device using QR code data
   */
  public static linkDeviceFromQR(qrData: QRCodeData): TrustedDevice | null {
    if (!qrData || !qrData.deviceInfo) {
      return null;
    }
    
    const trustedDevice: TrustedDevice = {
      ...qrData.deviceInfo,
      name: `${qrData.deviceInfo.platform} Device`,
      isCurrentDevice: false,
      lastVerified: new Date().toISOString(),
    };
    
    this.addTrustedDevice(trustedDevice);
    
    return trustedDevice;
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
      };
    }
    
    // In a real implementation, we would do additional verification based on:
    // - Transaction amount
    // - Transaction frequency
    // - Location
    // - Time of day
    // - User behavior patterns
    
    return {
      verified: true,
      riskLevel: 'low',
      reason: 'Trusted device',
      recommendation: 'Allow transaction',
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
    
    return true;
  }
  
  private static addTrustedDevice(device: TrustedDevice): void {
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
  }
}

export interface TrustedDevice extends DeviceInfo {
  name: string;
  isCurrentDevice: boolean;
  lastVerified: string;
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
}
