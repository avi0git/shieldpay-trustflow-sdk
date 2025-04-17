
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Fingerprint, Camera, CheckCircle2 } from 'lucide-react';
import SecurePaySDK, { BiometricType } from '@/sdk/SecurePaySDK';

interface BiometricRegistrationProps {
  onRegistered?: (type: BiometricType) => void;
  showTitle?: boolean;
}

const BiometricRegistration = ({ onRegistered, showTitle = true }: BiometricRegistrationProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fingerprintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [biometricType, setBiometricType] = useState<BiometricType>('face');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [fingerprintData, setFingerprintData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Check if biometric is already registered
  useEffect(() => {
    const type = SecurePaySDK.getBiometricType();
    if (type && type !== 'none') {
      setBiometricType(type);
      setIsRegistered(true);
    }
  }, []);
  
  // Start/stop camera based on biometric type and registration status
  useEffect(() => {
    if (biometricType === 'face' && !isRegistered) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [biometricType, isRegistered]);
  
  // Setup fingerprint canvas
  useEffect(() => {
    if (biometricType === 'fingerprint' && !isRegistered && fingerprintCanvasRef.current) {
      const canvas = fingerprintCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        
        // Clear canvas
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw instruction text
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Draw your fingerprint pattern here', canvas.width / 2, canvas.height / 2);
      }
    }
  }, [biometricType, isRegistered, fingerprintCanvasRef]);
  
  const startCamera = async () => {
    if (videoRef.current && !isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({
          variant: "destructive",
          title: "Camera Error",
          description: "Could not access the camera. Please check permissions.",
        });
      }
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => {
        track.stop();
      });
      
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };
  
  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data as base64 string
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
        
        // Register biometric with the SDK
        const success = SecurePaySDK.registerBiometric(imageData, 'face');
        
        if (success) {
          setIsRegistered(true);
          stopCamera();
          toast({
            title: "Face Registered",
            description: "Your face has been registered successfully.",
          });
          if (onRegistered) onRegistered('face');
        }
      }
    }
  };
  
  const handleFingerprintStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (fingerprintCanvasRef.current) {
      setIsDrawing(true);
      const canvas = fingerprintCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        let x, y;
        
        if ('touches' in e) {
          // Touch event
          x = e.touches[0].clientX - rect.left;
          y = e.touches[0].clientY - rect.top;
        } else {
          // Mouse event
          x = e.clientX - rect.left;
          y = e.clientY - rect.top;
        }
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Clear instruction text
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Start drawing
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };
  
  const handleFingerprintMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isDrawing && fingerprintCanvasRef.current) {
      const canvas = fingerprintCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        let x, y;
        
        if ('touches' in e) {
          // Touch event
          x = e.touches[0].clientX - rect.left;
          y = e.touches[0].clientY - rect.top;
        } else {
          // Mouse event
          x = e.clientX - rect.left;
          y = e.clientY - rect.top;
        }
        
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };
  
  const handleFingerprintEnd = () => {
    if (isDrawing && fingerprintCanvasRef.current) {
      setIsDrawing(false);
      const canvas = fingerprintCanvasRef.current;
      
      // Get fingerprint data as base64 string
      const fingerprintData = canvas.toDataURL('image/png');
      setFingerprintData(fingerprintData);
      
      // Register biometric with the SDK
      const success = SecurePaySDK.registerBiometric(fingerprintData, 'fingerprint');
      
      if (success) {
        setIsRegistered(true);
        toast({
          title: "Fingerprint Registered",
          description: "Your fingerprint has been registered successfully.",
        });
        if (onRegistered) onRegistered('fingerprint');
      }
    }
  };
  
  const resetBiometric = () => {
    SecurePaySDK.registerBiometric('', 'none');
    setIsRegistered(false);
    setCapturedImage(null);
    setFingerprintData(null);
    if (biometricType === 'face') {
      startCamera();
    }
    toast({
      title: "Biometric Reset",
      description: "Your biometric data has been reset.",
    });
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {showTitle && (
          <h3 className="text-lg font-medium mb-4">Biometric Registration</h3>
        )}
        
        {!isRegistered ? (
          <>
            <RadioGroup
              value={biometricType}
              onValueChange={(value) => setBiometricType(value as BiometricType)}
              className="flex gap-4 mb-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="face" id="face" />
                <Label htmlFor="face" className="flex items-center gap-1">
                  <Camera size={16} /> Face Recognition
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fingerprint" id="fingerprint" />
                <Label htmlFor="fingerprint" className="flex items-center gap-1">
                  <Fingerprint size={16} /> Fingerprint
                </Label>
              </div>
            </RadioGroup>
            
            {biometricType === 'face' && (
              <div className="space-y-4">
                <div className="rounded-md overflow-hidden bg-gray-100 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-[200px] object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <Button
                  onClick={captureFace}
                  className="w-full"
                  disabled={!isCameraOn}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Face
                </Button>
              </div>
            )}
            
            {biometricType === 'fingerprint' && (
              <div className="space-y-4">
                <canvas
                  ref={fingerprintCanvasRef}
                  width={300}
                  height={200}
                  className="w-full h-[200px] border rounded-md bg-gray-100 touch-none"
                  onMouseDown={handleFingerprintStart}
                  onMouseMove={handleFingerprintMove}
                  onMouseUp={handleFingerprintEnd}
                  onMouseLeave={handleFingerprintEnd}
                  onTouchStart={handleFingerprintStart}
                  onTouchMove={handleFingerprintMove}
                  onTouchEnd={handleFingerprintEnd}
                />
                <p className="text-sm text-muted-foreground">
                  Draw your fingerprint pattern in the area above
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">
                  {biometricType === 'face' ? 'Face' : 'Fingerprint'} Registered
                </p>
                <p className="text-green-700 text-sm">
                  Your biometric data has been registered successfully
                </p>
              </div>
            </div>
            
            {biometricType === 'face' && capturedImage && (
              <div className="rounded-md overflow-hidden bg-gray-100 relative">
                <img
                  src={capturedImage}
                  alt="Registered face"
                  className="w-full h-[150px] object-cover"
                />
              </div>
            )}
            
            {biometricType === 'fingerprint' && fingerprintData && (
              <div className="rounded-md overflow-hidden bg-gray-100 relative">
                <img
                  src={fingerprintData}
                  alt="Registered fingerprint"
                  className="w-full h-[150px] object-contain"
                />
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={resetBiometric}
              className="w-full"
            >
              Reset Biometric
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BiometricRegistration;
