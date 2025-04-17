
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import SecurePaySDK, { Transaction, TransactionVerificationResult, BiometricType } from '@/sdk/SecurePaySDK';
import { CreditCard, ShieldCheck, ShieldAlert, AlertTriangle, Phone, Lock, Fingerprint, Scan } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BiometricVerification from './BiometricVerification';

const TransactionSimulator = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("100.00");
  const [currency, setCurrency] = useState("USD");
  const [recipient, setRecipient] = useState("John Doe");
  const [verificationResult, setVerificationResult] = useState<TransactionVerificationResult | null>(null);
  const [isRegistered, setIsRegistered] = useState(SecurePaySDK.isDeviceRegistered());
  const [isCallVerified, setIsCallVerified] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [showBiometricVerification, setShowBiometricVerification] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<any>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  useEffect(() => {
    // Check if device is already registered
    const registered = SecurePaySDK.isDeviceRegistered();
    setIsRegistered(registered);
    
    // Get current device
    const device = SecurePaySDK.getCurrentDevice();
    setCurrentDevice(device);
    
    if (device?.biometricType) {
      setBiometricType(device.biometricType);
    }
  }, []);

  const simulateTransaction = () => {
    try {
      const transaction: Transaction = {
        id: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        amount: parseFloat(amount),
        currency,
        timestamp: new Date().toISOString(),
        recipient,
      };
      
      setCurrentTransaction(transaction);
      setIsBiometricVerified(false);
      setIsCallVerified(false);

      // Check if biometric verification is required
      const bioType = SecurePaySDK.getBiometricType();
      if (bioType && bioType !== 'none') {
        setBiometricType(bioType);
        setShowBiometricVerification(true);
        toast({
          title: "Biometric Verification Required",
          description: `Please complete ${bioType === 'face' ? 'face recognition' : 'fingerprint'} verification.`,
        });
        return;
      } else {
        // No biometric, proceed with normal verification
        performVerification(transaction);
      }
    } catch (error) {
      console.error("Transaction verification failed:", error);
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "Failed to verify the transaction.",
      });
    }
  };
  
  const performVerification = (transaction: Transaction) => {
    const result = SecurePaySDK.verifyTransaction(transaction);
    setVerificationResult(result);
    
    if (result.requiresCallVerification) {
      toast({
        title: "Call Verification Required",
        description: "This high-value transaction requires phone verification.",
        variant: "default",
      });
    } else {
      toast({
        title: result.verified ? "Transaction Verified" : "Transaction Blocked",
        description: result.reason,
        variant: result.verified ? "default" : "destructive",
      });
    }
  };

  const initiateCallVerification = () => {
    if (!currentDevice?.phoneNumber) {
      toast({
        variant: "destructive",
        title: "No Phone Number",
        description: "You need to register a phone number with this device first.",
      });
      return;
    }

    const code = SecurePaySDK.generateVerificationCode();
    console.log(`Verification code generated: ${code}`); // In real app, this would be sent via API

    toast({
      title: "Verification Code Sent",
      description: `A verification code has been sent to your phone ${currentDevice.phoneNumber.substring(0, 3)}***${currentDevice.phoneNumber.slice(-4)}`,
    });

    setShowVerificationInput(true);
  };

  const verifyCode = () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
      });
      return;
    }

    const isValid = SecurePaySDK.verifyCode(verificationCode);
    
    if (isValid) {
      setIsCallVerified(true);
      setShowVerificationInput(false);
      toast({
        title: "Verification Successful",
        description: "Your transaction has been approved.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The verification code is incorrect. Please try again.",
      });
    }
  };

  const cancelVerification = () => {
    setShowVerificationInput(false);
    setVerificationCode("");
  };
  
  const handleBiometricVerified = () => {
    setIsBiometricVerified(true);
    setShowBiometricVerification(false);
    
    if (currentTransaction) {
      // Now proceed with transaction verification
      performVerification(currentTransaction);
    }
  };
  
  const cancelBiometricVerification = () => {
    setShowBiometricVerification(false);
    setVerificationResult(null);
    setCurrentTransaction(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Transaction Simulator</CardTitle>
        </div>
        <CardDescription>
          Simulate a transaction to test the device verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isRegistered && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Device Not Registered</AlertTitle>
            <AlertDescription>
              This device is not registered as trusted. Transactions will be flagged as suspicious.
            </AlertDescription>
          </Alert>
        )}
        
        {isRegistered && !currentDevice?.phoneNumber && (
          <Alert className="mb-6" variant="destructive">
            <Phone className="h-4 w-4" />
            <AlertTitle>Phone Number Missing</AlertTitle>
            <AlertDescription>
              You need to register a phone number with this device for high-value transaction verification.
            </AlertDescription>
          </Alert>
        )}
        
        {isRegistered && biometricType === 'none' && (
          <Alert className="mb-6">
            <Fingerprint className="h-4 w-4" />
            <AlertTitle>No Biometric Registered</AlertTitle>
            <AlertDescription>
              For enhanced security, register facial recognition or fingerprint in the Device Registration section.
            </AlertDescription>
          </Alert>
        )}

        {showBiometricVerification ? (
          <BiometricVerification
            biometricType={biometricType}
            onVerified={handleBiometricVerified}
            onCancel={cancelBiometricVerification}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            {showVerificationInput && (
              <div className="mt-6 p-4 rounded-lg border bg-yellow-50 border-yellow-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">Enter Verification Code</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  A 6-digit verification code has been sent to your registered phone number.
                  Please enter it below to verify this transaction.
                </p>
                
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={cancelVerification}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={verifyCode}>
                    Verify Code
                  </Button>
                </div>
              </div>
            )}

            {verificationResult && !showVerificationInput && (
              <div className={`mt-6 p-4 rounded-lg border ${
                verificationResult.requiresCallVerification && !isCallVerified 
                  ? "bg-yellow-50 border-yellow-200"
                  : verificationResult.verified 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-start gap-3">
                  {verificationResult.requiresCallVerification && !isCallVerified ? (
                    <Phone className="h-6 w-6 text-yellow-600 mt-1" />
                  ) : verificationResult.verified ? (
                    <ShieldCheck className="h-6 w-6 text-green-600 mt-1" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-red-600 mt-1" />
                  )}
                  <div>
                    <h3 className={`font-medium ${
                      verificationResult.requiresCallVerification && !isCallVerified
                        ? "text-yellow-800"
                        : verificationResult.verified 
                          ? "text-green-800" 
                          : "text-red-800"
                    }`}>
                      {verificationResult.requiresCallVerification && !isCallVerified
                        ? "Call Verification Required"
                        : verificationResult.verified 
                          ? "Transaction Approved" 
                          : "Transaction Blocked"}
                    </h3>
                    <p className={
                      verificationResult.requiresCallVerification && !isCallVerified
                        ? "text-yellow-700"
                        : verificationResult.verified 
                          ? "text-green-700" 
                          : "text-red-700"
                    }>
                      {verificationResult.reason}
                    </p>
                    <p className="text-sm mt-2">
                      Risk Level: <span className="font-medium">{verificationResult.riskLevel.toUpperCase()}</span>
                    </p>
                    <p className="text-sm">
                      Recommendation: {verificationResult.recommendation}
                    </p>
                    
                    {verificationResult.requiresCallVerification && !isCallVerified && (
                      <Button 
                        className="mt-3 bg-yellow-500 hover:bg-yellow-600" 
                        size="sm"
                        onClick={initiateCallVerification}
                        disabled={!currentDevice?.phoneNumber}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Receive Verification Code
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!showBiometricVerification && (
          <Button 
            className="w-full" 
            onClick={simulateTransaction}
            disabled={showVerificationInput}
          >
            <Scan className="h-4 w-4 mr-2" />
            Simulate Transaction
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TransactionSimulator;
