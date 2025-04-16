
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeSVG } from 'qrcode.react';
import SecurePaySDK, { TrustedDevice } from '@/sdk/SecurePaySDK';
import { QrCode, Scan, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import QrScanner from 'qr-scanner';

const QRLinking = () => {
  const { toast } = useToast();
  const [qrData, setQrData] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [scannerReady, setScannerReady] = useState(false);

  useEffect(() => {
    const registered = SecurePaySDK.isDeviceRegistered();
    setIsRegistered(registered);
    
    if (registered) {
      generateNewQRCode();
    }

    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
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
    setScanMode(true);
    
    // Wait for the DOM to update
    setTimeout(() => {
      const videoElement = document.getElementById('qr-video') as HTMLVideoElement;
      if (!videoElement) {
        console.error("No video element found");
        return;
      }

      try {
        const newScanner = new QrScanner(
          videoElement,
          result => {
            handleScanResult(result.data);
            setScanMode(false);
            if (scanner) {
              scanner.destroy();
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        setScanner(newScanner);
        newScanner.start().then(() => {
          setScannerReady(true);
          console.log("Scanner started");
        }).catch((err) => {
          console.error("Failed to start scanner:", err);
          toast({
            variant: "destructive",
            title: "Camera Access Failed",
            description: "Could not access your camera. Please check permissions or use manual code entry.",
          });
          setScanMode(false);
        });
      } catch (error) {
        console.error("QR Scanner error:", error);
        toast({
          variant: "destructive",
          title: "QR Scanner Error",
          description: "Could not initialize the QR scanner. Please try the manual entry.",
        });
        setScanMode(false);
      }
    }, 100);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.destroy();
      setScanner(null);
    }
    setScanMode(false);
    setScannerReady(false);
  };

  const handleScanResult = (code: string) => {
    processCode(code);
  };

  const processCode = (code: string) => {
    try {
      const result = SecurePaySDK.processQRCodeData(code);
      
      if (result) {
        toast({
          title: "Device Linked",
          description: `${result.name} has been linked as a trusted device.`,
        });
        
        // Force refresh of trusted devices list 
        // This will trigger any components displaying trusted devices to update
        const event = new CustomEvent('trustedDevicesUpdated');
        window.dispatchEvent(event);
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
          <Alert variant="destructive">
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
                <QRCodeSVG value={qrData} size={200} />
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
          <CardFooter className="flex justify-center">
            <Button onClick={generateNewQRCode} className="w-full flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Generate New QR Code
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
                <div className="bg-gray-100 rounded-md mb-4 overflow-hidden relative">
                  <video 
                    id="qr-video" 
                    className="w-full h-[300px] object-cover"
                  ></video>
                  {!scannerReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                      <p>Accessing camera...</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={stopScanning}
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
