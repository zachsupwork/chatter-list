
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
import { ArrowUpDown, Phone, Database, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CallData {
  call_id: string;
  call_type: string;
  call_status: string;
  start_timestamp?: number;
  end_timestamp?: number;
  disconnection_reason?: string;
  transcript?: string;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data from Retell API...');
        const { data: functionData, error: functionError } = await supabase.functions.invoke('retell-calls');
        
        console.log('Response:', { functionData, functionError });
        
        if (functionError) {
          throw new Error(functionError.message);
        }

        if (!functionData) {
          throw new Error('No data received from the API');
        }

        if ('error' in functionData) {
          throw new Error(functionData.error);
        }

        if (!('calls' in functionData) || !('knowledgeBases' in functionData)) {
          console.error('Invalid response structure:', functionData);
          throw new Error('Invalid response format from API');
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
      {/* Knowledge Base Section */}
      <Card className="max-w-7xl mx-auto mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Database className="h-6 w-6" />
              Knowledge Bases
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  data?.knowledgeBases.map((kb) => (
                    <TableRow key={kb.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{kb.name}</TableCell>
                      <TableCell>{kb.description || '-'}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(kb.created_at), { addSuffix: true })}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(kb.updated_at), { addSuffix: true })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Calls Section */}
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Phone className="h-6 w-6" />
              Call History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
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
                        <Badge
                          className={`${getStatusColor(
                            call.call_status
                          )} text-white`}
                        >
                          {call.call_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{call.call_id}</TableCell>
                      <TableCell>{call.call_type}</TableCell>
                      <TableCell>
                        {call.start_timestamp
                          ? formatDistanceToNow(call.start_timestamp, {
                              addSuffix: true,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {call.end_timestamp && call.start_timestamp
                          ? `${Math.round(
                              (call.end_timestamp - call.start_timestamp) / 1000
                            )}s`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
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
