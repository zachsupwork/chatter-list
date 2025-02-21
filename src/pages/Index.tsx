
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpDown, Phone, Database, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CallData {
  call_type: "web_call" | "phone_call";
  call_id: string;
  agent_id: string;
  call_status: "registered" | "ongoing" | "ended" | "error";
  from_number?: string;
  to_number?: string;
  direction?: "inbound" | "outbound";
  start_timestamp?: number;
  end_timestamp?: number;
  disconnection_reason?: string;
  call_analysis?: {
    user_sentiment?: "Negative" | "Positive" | "Neutral" | "Unknown";
    call_successful?: boolean;
  };
  call_cost?: {
    product_costs: {
      product: string;
      unitPrice: number;
      cost: number;
    }[];
    total_duration_seconds: number;
    combined_cost: number;
  };
}

interface KnowledgeBaseData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  calls: CallData[];
  knowledgeBases: KnowledgeBaseData[];
}

const Index = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const formatDate = (date: string | number | undefined) => {
    if (!date) return "-";
    try {
      const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (err) {
      console.warn('Invalid date format:', date);
      return "-";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'retell-calls',
          {
            body: { limit: 50 },
          }
        );

        if (functionError) {
          throw new Error(functionError.message);
        }

        setData(functionData as ApiResponse);
        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch data";
        console.error("Error fetching data:", err);
        setError(errorMessage);
        setLoading(false);
        
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: errorMessage,
        });
      }
    };

    fetchData();
  }, []);

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
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Calls Section */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-6 w-6" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  data?.calls.map((call) => (
                    <TableRow key={call.call_id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge className={`${getStatusColor(call.call_status)} text-white`}>
                          {call.call_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/calls/${call.call_id}`}
                          className="font-mono text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          {call.call_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {call.call_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.direction && (
                          <Badge variant="secondary" className="capitalize">
                            {call.direction}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {call.from_number || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {call.to_number || '-'}
                      </TableCell>
                      <TableCell>{formatDate(call.start_timestamp)}</TableCell>
                      <TableCell>
                        {call.call_cost?.total_duration_seconds
                          ? `${call.call_cost.total_duration_seconds}s`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {call.call_cost ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span>${(call.call_cost.combined_cost / 100).toFixed(2)}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {call.call_analysis?.user_sentiment ? (
                          <Badge variant={
                            call.call_analysis.user_sentiment === 'Positive' ? 'default' :
                            call.call_analysis.user_sentiment === 'Negative' ? 'destructive' :
                            'secondary'
                          }>
                            {call.call_analysis.user_sentiment}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm text-gray-600">
                          {call.disconnection_reason?.replace(/_/g, " ") || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
