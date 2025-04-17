
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Fingerprint, Camera, X, Check } from 'lucide-react';
import SecurePaySDK, { BiometricType } from '@/sdk/SecurePaySDK';

interface BiometricVerificationProps {
  biometricType: BiometricType;
  onVerified: () => void;
  onCancel: () => void;
}

const BiometricVerification = ({ biometricType, onVerified, onCancel }: BiometricVerificationProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fingerprintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [storedBiometricData, setStoredBiometricData] = useState<string | null>(null);
  
  useEffect(() => {
    // Get stored biometric data for comparison
    const data = SecurePaySDK.getBiometricData();
    setStoredBiometricData(data);
    
    if (biometricType === 'face') {
      startCamera();
    } else if (biometricType === 'fingerprint' && fingerprintCanvasRef.current) {
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
    
    return () => {
      stopCamera();
    };
  }, [biometricType]);
  
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
  
  const verifyFace = () => {
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
        
        // In a real implementation, this would use facial recognition algorithms
        // For this demo, we'll simulate by comparing to stored data
        const isVerified = SecurePaySDK.verifyBiometric(imageData);
        
        if (isVerified) {
          stopCamera();
          toast({
            title: "Face Verified",
            description: "Face verification successful.",
          });
          onVerified();
        } else {
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Face does not match. Please try again.",
          });
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
      
      // In a real implementation, this would use fingerprint matching algorithms
      // For this demo, we'll simulate by comparing to stored data
      const isVerified = SecurePaySDK.verifyBiometric(fingerprintData);
      
      if (isVerified) {
        toast({
          title: "Fingerprint Verified",
          description: "Fingerprint verification successful.",
        });
        onVerified();
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "Fingerprint does not match. Please try again.",
        });
      }
    }
  };
  
  // Demo verification - For demonstration purposes, we'll also add a button to simulate
  // successful verification since we can't actually match the patterns in this demo
  const simulateSuccessfulVerification = () => {
    toast({
      title: "Demo Mode",
      description: "Biometric verification simulated successfully.",
    });
    onVerified();
  };
  
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          {biometricType === 'face' ? (
            <><Camera size={18} /> Face Verification</>
          ) : (
            <><Fingerprint size={18} /> Fingerprint Verification</>
          )}
        </h3>
        
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
              onClick={verifyFace}
              className="w-full"
              disabled={!isCameraOn}
            >
              <Camera className="h-4 w-4 mr-2" />
              Verify Face
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
              Draw your fingerprint pattern to verify
            </p>
          </div>
        )}
        
        <div className="pt-2 flex gap-2 justify-between">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={simulateSuccessfulVerification}>
            <Check className="h-4 w-4 mr-1" /> Demo: Simulate Successful Match
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Demo Note: In a real application, actual biometric matching algorithms would be used.
        </p>
      </CardContent>
    </Card>
  );
};

export default BiometricVerification;
