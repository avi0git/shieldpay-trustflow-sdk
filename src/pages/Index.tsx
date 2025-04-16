
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import SecurePaySDK, { TrustedDevice, Transaction, TransactionVerificationResult } from '@/sdk/SecurePaySDK';
import DeviceRegistration from '@/components/DeviceRegistration';
import QRLinking from '@/components/QRLinking';
import TransactionSimulator from '@/components/TransactionSimulator';
import DeviceList from '@/components/DeviceList';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Initialize the SDK
    try {
      SecurePaySDK.init();
      setIsInitialized(true);
      toast({
        title: "SDK Initialized",
        description: "SecurePay SDK has been successfully initialized.",
      });
    } catch (error) {
      console.error("Failed to initialize SDK:", error);
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: "Could not initialize the SecurePay SDK.",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col items-center justify-center text-center mb-8">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck size={32} className="text-primary" />
            <h1 className="text-3xl font-bold">SecurePay SDK Demo</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Fraud prevention system for secure financial transactions
          </p>
        </header>

        {!isInitialized ? (
          <div className="flex justify-center">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>SDK Not Initialized</AlertTitle>
              <AlertDescription>
                There was a problem initializing the SecurePay SDK. Please refresh the page.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="register">Register Device</TabsTrigger>
              <TabsTrigger value="link">Link Device</TabsTrigger>
              <TabsTrigger value="devices">Manage Devices</TabsTrigger>
              <TabsTrigger value="transactions">Test Transaction</TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <DeviceRegistration />
            </TabsContent>

            <TabsContent value="link">
              <QRLinking />
            </TabsContent>

            <TabsContent value="devices">
              <DeviceList />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionSimulator />
            </TabsContent>
          </Tabs>
        )}

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>SecurePay SDK Demo - For demonstration purposes only</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
