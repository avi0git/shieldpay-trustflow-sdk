
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import QRCode from 'qrcode.react';
import SecurePaySDK, { TrustedDevice } from '@/sdk/SecurePaySDK';
import { QrCode, Scan, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const QRLinking = () => {
  const { toast } = useToast();
  const [qrData, setQrData] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    // Check if device is registered first
    const registered = SecurePaySDK.isDeviceRegistered();
    setIsRegistered(registered);
    
    if (registered) {
      // Generate new QR code data
      generateNewQRCode();
    }
  }, []);

  const generateNewQRCode = () => {
    try {
      const newQrData = SecurePaySDK.generateQRCodeData();
      setQrData(newQrData);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast({
        variant: "destructive",
        title: "QR Generation Failed",
        description: "Could not generate a QR code. Please try again.",
      });
    }
  };

  const handleScanQRCode = () => {
    // In a real app, this would open the camera
    setScanMode(!scanMode);
  };

  const processCode = (code: string) => {
    try {
      const result = SecurePaySDK.processQRCodeData(code);
      
      if (result) {
        toast({
          title: "Device Linked",
          description: `${result.name} has been linked as a trusted device.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description: "The QR code is invalid or has expired.",
        });
      }
    } catch (error) {
      console.error("Failed to process QR code:", error);
      toast({
        variant: "destructive",
        title: "Linking Failed",
        description: "Could not link the device. Please try again.",
      });
    }
  };

  const handleManualCodeSubmit = () => {
    if (manualCode.trim()) {
      processCode(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isRegistered) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle>Link New Device</CardTitle>
          </div>
          <CardDescription>
            Link another device to your account using a QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Device Not Registered</AlertTitle>
            <AlertDescription>
              You need to register this device before you can link other devices.
              Please go to the "Register Device" tab first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="generate">
      <TabsList className="grid grid-cols-2 w-full mb-6">
        <TabsTrigger value="generate">Generate QR</TabsTrigger>
        <TabsTrigger value="scan">Scan QR</TabsTrigger>
      </TabsList>

      <TabsContent value="generate">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <CardTitle>Generate QR Code</CardTitle>
            </div>
            <CardDescription>
              Show this QR code on the device you want to link
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-md border mb-4">
              {qrData ? (
                <QRCode value={qrData} size={200} />
              ) : (
                <div className="h-[200px] w-[200px] flex items-center justify-center bg-gray-100">
                  <p className="text-gray-500">QR code not generated</p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              This QR code will expire in 5 minutes for security
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={generateNewQRCode} className="w-full">
              Generate New QR Code
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="scan">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary" />
              <CardTitle>Scan QR Code</CardTitle>
            </div>
            <CardDescription>
              Scan a QR code from another device to link it
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanMode ? (
              <div className="text-center">
                <div className="bg-gray-100 h-[200px] rounded-md flex items-center justify-center mb-4">
                  <p className="text-gray-500">
                    [Camera Placeholder - In a real app, camera would appear here]
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setScanMode(false)}
                  className="mb-4"
                >
                  Cancel Scanning
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <Button onClick={handleScanQRCode} className="w-full">
                  <Scan className="mr-2 h-4 w-4" /> Open Camera to Scan
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or enter code manually
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manualCode">QR Code Content</Label>
                  <Input
                    id="manualCode"
                    placeholder="Paste QR code content here"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <Button 
                    onClick={handleManualCodeSubmit} 
                    variant="secondary"
                    className="w-full"
                    disabled={!manualCode.trim()}
                  >
                    Verify Code
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default QRLinking;
