
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CallData {
  call_id: string;
  agent_id: string;
  call_type: string;
  call_status: string;
  transcript?: string;
  recording_url?: string;
}

const Call = () => {
  const { callId } = useParams();
  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCall = async () => {
    try {
      setLoading(true);
      setError(null);
      console.info('Fetching call details for ID:', callId);

      const { data, error } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'getCall',
            filter_criteria: {
              call_id: callId
            }
          }
        }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Call not found");
      }

      setCall(data);
    } catch (err: any) {
      console.error('Error fetching call:', err);
      setError(err.message || "Failed to load call details");
      toast({
        variant: "destructive",
        title: "Error fetching call",
        description: err.message || "Failed to load call details",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (callId) {
      fetchCall();
      // Refresh call details every 5 seconds while the call is active
      const interval = setInterval(() => {
        if (call?.call_status === 'ongoing') {
          fetchCall();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [callId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500 mb-4">{error || "Call not found"}</p>
                <Button asChild>
                  <Link to="/calls">Back to calls</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button 
          variant="outline" 
          asChild
          className="mb-4"
        >
          <Link to="/calls">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to calls
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Call ID</p>
                <p className="text-sm text-gray-500">{call.call_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Agent ID</p>
                <p className="text-sm text-gray-500">{call.agent_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-gray-500">{call.call_status}</p>
              </div>
              {call.transcript && (
                <div>
                  <p className="text-sm font-medium">Transcript</p>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
                    {call.transcript}
                  </pre>
                </div>
              )}
              {call.recording_url && (
                <div>
                  <p className="text-sm font-medium">Recording</p>
                  <audio controls className="mt-2 w-full">
                    <source src={call.recording_url} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Call;
