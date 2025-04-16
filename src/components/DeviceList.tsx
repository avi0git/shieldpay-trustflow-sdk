import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import SecurePaySDK, { TrustedDevice } from '@/sdk/SecurePaySDK';
import { Laptop, Smartphone, Trash2, RefreshCw, Devices } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DeviceList = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<TrustedDevice | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadDevices();
    
    // Check if current device is registered
    const registered = SecurePaySDK.isDeviceRegistered();
    setIsRegistered(registered);
  }, []);

  const loadDevices = () => {
    try {
      const trustedDevices = SecurePaySDK.getTrustedDevices();
      setDevices(trustedDevices);
    } catch (error) {
      console.error("Failed to load devices:", error);
      toast({
        variant: "destructive",
        title: "Error Loading Devices",
        description: "Could not load the list of trusted devices.",
      });
    }
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    try {
      SecurePaySDK.removeTrustedDevice(deviceId);
      loadDevices(); // Reload the devices list
      
      // Check if current device was removed
      if (!SecurePaySDK.isDeviceRegistered()) {
        setIsRegistered(false);
      }
      
      toast({
        title: "Device Removed",
        description: `"${deviceName}" has been removed from trusted devices.`,
      });
    } catch (error) {
      console.error("Failed to remove device:", error);
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: "Could not remove the device. Please try again.",
      });
    }
  };

  const getDeviceIcon = (device: TrustedDevice) => {
    if (device.platform === 'Web') {
      return <Laptop className="h-5 w-5" />;
    }
    return <Smartphone className="h-5 w-5" />;
  };

  if (!isRegistered) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Devices className="h-5 w-5 text-primary" />
            <CardTitle>Trusted Devices</CardTitle>
          </div>
          <CardDescription>
            View and manage your trusted devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You need to register this device before you can manage trusted devices.
              Please go to the "Register Device" tab first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Devices className="h-5 w-5 text-primary" />
            <CardTitle>Trusted Devices</CardTitle>
          </div>
          <CardDescription>
            View and manage your trusted devices
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={loadDevices}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trusted devices found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div 
                key={device.deviceId} 
                className="flex items-center justify-between p-3 bg-background rounded-md border"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(device)}
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {device.deviceId.substring(0, 8)}... • {device.platform}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.isCurrentDevice && (
                    <Badge variant="outline">Current Device</Badge>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedDevice(device)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </DialogTrigger>
                    {selectedDevice && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove trusted device?</DialogTitle>
                          <DialogDescription>
                            You are about to remove "{selectedDevice.name}" from your trusted devices.
                            This means any transactions from this device will be treated as suspicious.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedDevice(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (selectedDevice) {
                                handleRemoveDevice(selectedDevice.deviceId, selectedDevice.name);
                                setSelectedDevice(null);
                              }
                            }}
                          >
                            Remove Device
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceList;
