
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import SecurePaySDK from '@/sdk/SecurePaySDK';
import { ShieldCheck, Smartphone, Phone } from 'lucide-react';

const DeviceRegistration = () => {
  const { toast } = useToast();
  const [deviceName, setDeviceName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  
  // For phone number validation
  const [isValidPhoneNumber, setIsValidPhoneNumber] = useState(true);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    // Check if device is already registered
    const registered = SecurePaySDK.isDeviceRegistered();
    setIsRegistered(registered);

    // Get device info
    const info = SecurePaySDK.getDeviceInfo();
    setDeviceInfo(info);
    
    // If registered, get saved phone number
    if (registered) {
      const currentDevice = SecurePaySDK.getCurrentDevice();
      if (currentDevice?.phoneNumber) {
        setPhoneNumber(currentDevice.phoneNumber);
      }
    }
  }, []);

  const validatePhoneNumber = (number: string) => {
    // Simple validation - must be at least 10 digits
    if (!number.trim()) {
      setIsValidPhoneNumber(false);
      setPhoneError('Phone number is required for verification');
      return false;
    }
    
    const digitsOnly = number.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setIsValidPhoneNumber(false);
      setPhoneError('Enter a valid phone number (min 10 digits)');
      return false;
    }
    
    setIsValidPhoneNumber(true);
    setPhoneError('');
    return true;
  };

  const handleRegisterDevice = () => {
    try {
      if (!validatePhoneNumber(phoneNumber)) {
        return;
      }
      
      const name = deviceName.trim() || `${deviceInfo?.platform || 'My'} Device`;
      const result = SecurePaySDK.registerCurrentDevice(name, phoneNumber);
      
      setIsRegistered(true);
      toast({
        title: "Device Registered",
        description: `"${name}" has been registered as a trusted device.`,
      });
    } catch (error) {
      console.error("Failed to register device:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Could not register this device. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <CardTitle>Device Registration</CardTitle>
        </div>
        <CardDescription>
          Register this device as trusted for secure transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isRegistered ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Device Already Registered</p>
                <p className="text-green-700 text-sm">This device is already registered as trusted</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registeredPhoneNumber">Registered Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{phoneNumber || 'No phone number registered'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="deviceInfo">Device Information</Label>
              <div className="mt-1 p-3 bg-gray-50 border rounded-md text-sm">
                <p><strong>Device ID:</strong> {deviceInfo?.deviceId?.substring(0, 8)}...</p>
                <p><strong>Platform:</strong> {deviceInfo?.platform}</p>
                <p><strong>Type:</strong> {deviceInfo?.deviceName}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceName">Custom Device Name (Optional)</Label>
              <Input
                id="deviceName"
                placeholder="My Personal Phone"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>Phone Number</span> 
                <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="phoneNumber"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  validatePhoneNumber(e.target.value);
                }}
                className={!isValidPhoneNumber ? "border-red-500" : ""}
              />
              {!isValidPhoneNumber && (
                <p className="text-red-500 text-xs mt-1">{phoneError}</p>
              )}
              <p className="text-sm text-gray-500">
                Required for high-value transaction verification
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!isRegistered && (
          <Button 
            onClick={handleRegisterDevice} 
            className="w-full"
            disabled={!isValidPhoneNumber}
          >
            Register as Trusted Device
          </Button>
        )}
        {isRegistered && (
          <Button 
            variant="outline"
            onClick={() => {
              SecurePaySDK.removeTrustedDevice(deviceInfo?.deviceId);
              setIsRegistered(false);
              setPhoneNumber('');
              toast({
                title: "Device Removed",
                description: "This device has been removed from trusted devices.",
              });
            }}
          >
            Unregister This Device
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DeviceRegistration;
