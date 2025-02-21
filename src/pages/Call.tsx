
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  Headphones,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LatencyStats {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  min: number;
  num: number;
  values: number[];
}

interface CallData {
  call_type: "web_call" | "phone_call";
  access_token?: string;
  call_id: string;
  agent_id: string;
  call_status: "registered" | "ongoing" | "ended" | "error";
  from_number?: string;
  to_number?: string;
  direction?: "inbound" | "outbound";
  metadata: Record<string, any>;
  retell_llm_dynamic_variables: Record<string, any>;
  opt_out_sensitive_data_storage: boolean;
  start_timestamp?: number;
  end_timestamp?: number;
  transcript?: string;
  transcript_object?: {
    role: "agent" | "user";
    content: string;
    words: {
      word: string;
      start: number;
      end: number;
    }[];
  }[];
  recording_url?: string;
  public_log_url?: string;
  latency?: {
    e2e: LatencyStats;
    llm: LatencyStats;
    llm_websocket_network_rtt: LatencyStats;
    tts: LatencyStats;
    knowledge_base: LatencyStats;
    s2s: LatencyStats;
  };
  disconnection_reason?: string;
  call_analysis?: {
    call_summary?: string;
    in_voicemail?: boolean;
    user_sentiment?: "Negative" | "Positive" | "Neutral" | "Unknown";
    call_successful?: boolean;
    custom_analysis_data: Record<string, any>;
  };
  call_cost?: {
    product_costs: {
      product: string;
      unitPrice: number;
      cost: number;
    }[];
    total_duration_seconds: number;
    total_duration_unit_price: number;
    total_one_time_price: number;
    combined_cost: number;
  };
}

const Call = () => {
  const { callId } = useParams();
  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const formatDate = (date: number | undefined) => {
    if (!date) return "-";
    try {
      const dateObj = new Date(date);
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (err) {
      console.warn('Invalid date format:', date);
      return "-";
    }
  };

  useEffect(() => {
    const fetchCall = async () => {
      try {
        console.log('Fetching call details for ID:', callId);

        // First try to get from the list endpoint
        const { data: listData, error: listError } = await supabase.functions.invoke(
          'retell-calls',
          {
            body: { 
              filter_criteria: {
                call_id: [callId]
              }
            },
          }
        );

        if (listError) {
          throw new Error(listError.message);
        }

        if (listData?.calls?.[0]) {
          console.log('Call data found:', listData.calls[0]);
          setCall(listData.calls[0]);
          setLoading(false);
          return;
        }

        // If not found in list, try the individual get endpoint
        const { data: singleData, error: singleError } = await supabase.functions.invoke(
          'retell-calls',
          {
            body: { 
              action: 'get',
              call_id: callId 
            },
          }
        );

        if (singleError) {
          throw new Error(singleError.message);
        }

        if (!singleData) {
          throw new Error('Call not found');
        }

        console.log('Call data found:', singleData);
        setCall(singleData);
        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch call details";
        console.error("Error fetching call:", err);
        setError(errorMessage);
        setLoading(false);
        
        toast({
          variant: "destructive",
          title: "Error fetching call details",
          description: errorMessage,
        });
      }
    };

    if (callId) {
      fetchCall();
    }
  }, [callId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500";
      case "ended":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-red-500 font-medium">{error}</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to calls
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to calls
          </Link>
        </div>

        {/* Basic Call Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-6 w-6" />
              Call Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={`${getStatusColor(call?.call_status || "")} text-white`}>
                  {call?.call_status}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Call ID</p>
                <p className="font-mono text-sm">{call?.call_id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Type</p>
                <Badge variant="outline" className="capitalize">
                  {call?.call_type?.replace('_', ' ')}
                </Badge>
              </div>
              {call?.direction && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Direction</p>
                  <Badge variant="outline" className="capitalize">
                    {call.direction}
                  </Badge>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-500">From Number</p>
                <p className="font-mono text-sm">{call?.from_number || '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">To Number</p>
                <p className="font-mono text-sm">{call?.to_number || '-'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Agent ID</p>
                <p className="font-mono text-sm">{call?.agent_id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Duration</p>
                <p>
                  {call?.start_timestamp && call?.end_timestamp
                    ? `${Math.round((call.end_timestamp - call.start_timestamp) / 1000)}s`
                    : "-"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Started</p>
                <p>{formatDate(call?.start_timestamp)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Analysis */}
        {call?.call_analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Call Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {call.call_analysis.call_summary && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Summary</p>
                  <p className="text-sm">{call.call_analysis.call_summary}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Sentiment</p>
                  {call.call_analysis.user_sentiment && (
                    <Badge variant={
                      call.call_analysis.user_sentiment === 'Positive' ? 'default' :
                      call.call_analysis.user_sentiment === 'Negative' ? 'destructive' :
                      'secondary'
                    }>
                      {call.call_analysis.user_sentiment}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Successful</p>
                  <Badge variant={call.call_analysis.call_successful ? "default" : "destructive"}>
                    {call.call_analysis.call_successful ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">In Voicemail</p>
                  <Badge variant={call.call_analysis.in_voicemail ? "destructive" : "default"}>
                    {call.call_analysis.in_voicemail ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call Costs */}
        {call?.call_cost && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Cost Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="text-lg font-semibold">
                      ${(call.call_cost.combined_cost / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Duration</p>
                    <p>{call.call_cost.total_duration_seconds}s</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">One-time Price</p>
                    <p>${(call.call_cost.total_one_time_price / 100).toFixed(2)}</p>
                  </div>
                </div>
                {call.call_cost.product_costs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Product Costs</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {call.call_cost.product_costs.map((product, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border bg-background"
                        >
                          <p className="font-medium">{product.product}</p>
                          <div className="mt-2 text-sm text-gray-500">
                            <p>Unit Price: ${(product.unitPrice / 100).toFixed(2)}/s</p>
                            <p>Cost: ${(product.cost / 100).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latency Information */}
        {call?.latency && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Latency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(call.latency).map(([key, stats]) => (
                  <div key={key} className="space-y-4">
                    <h3 className="font-medium capitalize">{key.replace(/_/g, " ")}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">P50</p>
                        <p>{stats.p50}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-500">P95</p>
                        <p>{stats.p95}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Min</p>
                        <p>{stats.min}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Max</p>
                        <p>{stats.max}ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {call?.transcript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg">
                  {call.transcript}
                </pre>
                {call.recording_url && (
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Listen to recording
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Call;
