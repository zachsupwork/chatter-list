
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Phone, Video, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CallData {
  call_id: string;
  agent_id: string;
  call_type: "web_call" | "phone_call";
  call_status: "registered" | "ongoing" | "ended" | "error";
  transcript?: string;
  recording_url?: string;
  from_number?: string;
  to_number?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  disconnection_reason?: string;
  call_analysis?: {
    call_summary: string;
    user_sentiment: "Positive" | "Negative" | "Neutral" | "Unknown";
    call_successful: boolean;
  };
}

const Call = () => {
  const { callId } = useParams();
  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCall = async () => {
    try {
      setLoading(true);
      console.info('Fetching call details for ID:', callId);

      const { data, error } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'getCall',
            call_id: callId
          }
        }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No data received from the server");
      }

      console.log('Received call data:', data);
      setCall(data);
    } catch (err: any) {
      console.error('Error fetching call:', err);
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
      // Refresh call details every 5 seconds if call is active
      const interval = setInterval(() => {
        if (call?.call_status === "ongoing") {
          fetchCall();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [callId, call?.call_status]);

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

  if (!call) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500">Call not found</p>
                <Button asChild className="mt-4">
                  <Link to="/calls">Back to calls</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "text-green-600";
      case "Negative":
        return "text-red-600";
      case "Neutral":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "text-green-600";
      case "ended":
        return "text-blue-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

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
            <CardTitle className="flex items-center gap-2">
              {call.call_type === "web_call" ? (
                <Video className="h-5 w-5" />
              ) : (
                <Phone className="h-5 w-5" />
              )}
              Call Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Call ID</p>
                  <p className="text-sm text-gray-500">{call.call_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Agent ID</p>
                  <p className="text-sm text-gray-500">{call.agent_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-gray-500 capitalize">{call.call_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className={`text-sm capitalize font-medium ${getStatusColor(call.call_status)}`}>
                    {call.call_status}
                  </p>
                </div>
                {call.from_number && call.to_number && (
                  <>
                    <div>
                      <p className="text-sm font-medium">From</p>
                      <p className="text-sm text-gray-500">{call.from_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">To</p>
                      <p className="text-sm text-gray-500">{call.to_number}</p>
                    </div>
                  </>
                )}
                {call.start_timestamp && (
                  <div>
                    <p className="text-sm font-medium">Start Time</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(call.start_timestamp), 'PPpp')}
                    </p>
                  </div>
                )}
                {call.end_timestamp && (
                  <div>
                    <p className="text-sm font-medium">End Time</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(call.end_timestamp), 'PPpp')}
                    </p>
                  </div>
                )}
                {call.duration_ms && (
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-gray-500">{formatDuration(call.duration_ms)}</p>
                  </div>
                )}
                {call.disconnection_reason && (
                  <div>
                    <p className="text-sm font-medium">Disconnection Reason</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {call.disconnection_reason.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </div>

              {call.call_analysis && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Call Analysis</h3>
                  <div className="space-y-4">
                    {call.call_analysis.call_summary && (
                      <div>
                        <p className="text-sm font-medium">Summary</p>
                        <p className="text-sm text-gray-500">{call.call_analysis.call_summary}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Sentiment</p>
                        <p className={`text-sm font-medium ${getSentimentColor(call.call_analysis.user_sentiment)}`}>
                          {call.call_analysis.user_sentiment}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Call Success</p>
                        <p className={`text-sm font-medium ${call.call_analysis.call_successful ? 'text-green-600' : 'text-red-600'}`}>
                          {call.call_analysis.call_successful ? 'Successful' : 'Unsuccessful'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {call.transcript && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Transcript</h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
                    {call.transcript}
                  </pre>
                </div>
              )}

              {call.recording_url && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Recording</h3>
                  <audio controls className="w-full">
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
