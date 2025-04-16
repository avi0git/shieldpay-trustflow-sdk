
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SecurePaySDK, { Transaction, TransactionVerificationResult } from '@/sdk/SecurePaySDK';
import { CreditCard, ShieldCheck, ShieldAlert, AlertTriangle, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TransactionSimulator = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("100.00");
  const [currency, setCurrency] = useState("USD");
  const [recipient, setRecipient] = useState("John Doe");
  const [verificationResult, setVerificationResult] = useState<TransactionVerificationResult | null>(null);
  const [isRegistered, setIsRegistered] = useState(SecurePaySDK.isDeviceRegistered());
  const [isCallVerified, setIsCallVerified] = useState(false);

  const simulateTransaction = () => {
    try {
      const transaction: Transaction = {
        id: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        amount: parseFloat(amount),
        currency,
        timestamp: new Date().toISOString(),
        recipient,
      };

      const result = SecurePaySDK.verifyTransaction(transaction);
      setVerificationResult(result);
      setIsCallVerified(false);

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
    } catch (error) {
      console.error("Transaction verification failed:", error);
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "Failed to verify the transaction.",
      });
    }
  };

  const completeCallVerification = () => {
    setIsCallVerified(true);
    toast({
      title: "Call Verification Complete",
      description: "The transaction has been verified via phone call.",
      variant: "default",
    });
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

          {verificationResult && (
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
                      onClick={completeCallVerification}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Complete Call Verification
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={simulateTransaction}>
          Simulate Transaction
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TransactionSimulator;
