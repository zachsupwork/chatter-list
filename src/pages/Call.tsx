
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { RetellWebClient } from "retell-client-js-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, PhoneOff, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CallData {
  call_id: string;
  access_token: string;
  call_status: string;
}

const Call = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callData, setCallData] = useState<CallData | null>(null);
  const [hasStartedCall, setHasStartedCall] = useState(false);
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeCall = async () => {
      if (!id) return;

      try {
        console.log('Fetching call details for ID:', id);
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'retell-calls',
          {
            body: {
              action: 'get',
              call_id: id
            }
          }
        );

        if (functionError) throw functionError;
        
        console.log('Call data found:', functionData);

        if (!functionData.access_token) {
          throw new Error('No access token found for this call');
        }

        setCallData(functionData);

      } catch (err: any) {
        console.error('Error initializing call:', err);
        setError(err.message || 'Failed to initialize call');
        toast({
          variant: "destructive",
          title: "Error initializing call",
          description: err.message || "Failed to initialize call",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeCall();

    // Cleanup on unmount
    return () => {
      if (retellClientRef.current) {
        try {
          retellClientRef.current.stopCall();
        } catch (err) {
          console.warn('Error during cleanup:', err);
        }
      }
    };
  }, [id]);

  const setupCall = async () => {
    if (!callData) return;

    try {
      setIsConnecting(true);
      console.log('Setting up call with access token');
      
      const client = new RetellWebClient();
      retellClientRef.current = client;

      // Set up event listeners before starting the call
      client.on("call_started", () => {
        console.log("Call started");
        setIsCallActive(true);
        setIsConnecting(false);
        setHasStartedCall(true);
        toast({
          title: "Call connected",
          description: "You are now connected to the agent",
        });
      });

      client.on("call_ended", () => {
        console.log("Call ended");
        setIsCallActive(false);
        setIsConnecting(false);
        toast({
          title: "Call ended",
          description: "The call has been disconnected",
        });
      });

      client.on("error", (error) => {
        console.error("Call error:", error);
        setIsCallActive(false);
        setIsConnecting(false);
        toast({
          variant: "destructive",
          title: "Call error",
          description: error.message || "An error occurred during the call",
        });
      });

      client.on("update", (update) => {
        console.log("Call update:", update);
      });

      // Start the call with proper error handling
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        console.log('Starting call...');
        await client.startCall({
          accessToken: callData.access_token,
          sampleRate: 24000,
        });
        console.log('Call started successfully');
      } catch (error: any) {
        console.error('Error starting call:', error);
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied. Please allow microphone access and try again.');
        }
        throw new Error(`Failed to start call: ${error.message}`);
      }

    } catch (err: any) {
      console.error('Error setting up call:', err);
      setError(err.message || 'Failed to set up call');
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Error setting up call",
        description: err.message || "Failed to set up call",
      });
    }
  };

  const handleEndCall = async () => {
    try {
      if (retellClientRef.current) {
        setIsConnecting(false);
        await retellClientRef.current.stopCall();
        setIsCallActive(false);
        toast({
          title: "Call ended",
          description: "You have ended the call",
        });
      }
    } catch (err: any) {
      console.error('Error ending call:', err);
      toast({
        variant: "destructive",
        title: "Error ending call",
        description: err.message || "Failed to end call",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-500">Initializing call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <PhoneOff className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-red-500 font-medium">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-6 w-6" />
                Call {id}
              </div>
              {isConnecting ? (
                <Badge variant="outline" className="bg-yellow-50">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </Badge>
              ) : isCallActive ? (
                <Badge variant="default" className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Disconnected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {isCallActive ? (
                  "Call is active. You can speak with the agent now."
                ) : isConnecting ? (
                  "Establishing connection..."
                ) : !hasStartedCall ? (
                  "Click the button below to start the call"
                ) : (
                  "Call is not active"
                )}
              </p>
              
              {!hasStartedCall && !isCallActive && !isConnecting && (
                <Button 
                  onClick={setupCall}
                  className="w-full"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Call
                </Button>
              )}
              
              {isCallActive && (
                <Button 
                  variant="destructive"
                  onClick={handleEndCall}
                  className="w-full"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Call;
