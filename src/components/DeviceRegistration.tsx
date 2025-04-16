
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import SecurePaySDK from '@/sdk/SecurePaySDK';
import { ShieldCheck, Smartphone } from 'lucide-react';

const DeviceRegistration = () => {
  const { toast } = useToast();
  const [deviceName, setDeviceName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    // Check if device is already registered
    const registered = SecurePaySDK.isDeviceRegistered();
    setIsRegistered(registered);

    // Get device info
    const info = SecurePaySDK.getDeviceInfo();
    setDeviceInfo(info);
  }, []);

  const handleRegisterDevice = () => {
    try {
      const name = deviceName.trim() || `${deviceInfo?.platform || 'My'} Device`;
      const result = SecurePaySDK.registerCurrentDevice(name);
      
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
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Device Already Registered</p>
              <p className="text-green-700 text-sm">This device is already registered as trusted</p>
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
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!isRegistered && (
          <Button 
            onClick={handleRegisterDevice} 
            className="w-full"
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
