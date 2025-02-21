
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Video, Loader2, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { RetellWebClient } from "retell-client-js-sdk";

interface Agent {
  agent_id: string;
  agent_name: string | null;
}

const CreateWebCall = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingAgents, setFetchingAgents] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const retellClientRef = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'retell-calls',
          {
            body: {
              action: 'listAgents'
            }
          }
        );

        if (error) throw error;

        setAgents(data || []);
      } catch (err: any) {
        console.error('Error fetching agents:', err);
        toast({
          variant: "destructive",
          title: "Error fetching agents",
          description: err.message || "Failed to load agents",
        });
      } finally {
        setFetchingAgents(false);
      }
    };

    fetchAgents();

    // Cleanup function to ensure we stop any active calls when component unmounts
    return () => {
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
    };
  }, []);

  const setupCallListeners = (client: RetellWebClient) => {
    client.on("call_started", () => {
      console.log("Call started");
      toast({
        title: "Call started",
        description: "You are now connected to the agent",
      });
    });

    client.on("call_ended", () => {
      console.log("Call ended");
      setIsCallActive(false);
      toast({
        title: "Call ended",
        description: "The call has been disconnected",
      });
    });

    client.on("agent_start_talking", () => {
      console.log("Agent started talking");
    });

    client.on("agent_stop_talking", () => {
      console.log("Agent stopped talking");
    });

    client.on("update", (update) => {
      console.log("Call update:", update);
    });

    client.on("error", (error) => {
      console.error("Call error:", error);
      toast({
        variant: "destructive",
        title: "Call error",
        description: error.message || "An error occurred during the call",
      });
      client.stopCall();
      setIsCallActive(false);
    });
  };

  const startCall = async (accessToken: string) => {
    try {
      const client = new RetellWebClient();
      retellClientRef.current = client;
      
      setupCallListeners(client);

      await client.startCall({
        accessToken,
        sampleRate: 24000,
      });

      setIsCallActive(true);
    } catch (err: any) {
      console.error('Error starting call:', err);
      toast({
        variant: "destructive",
        title: "Error starting call",
        description: err.message || "Failed to start the call",
      });
      setIsCallActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'createWebCall',
            agent_id: selectedAgentId,
          }
        }
      );

      if (error) throw error;

      toast({
        title: "Web call created",
        description: "Connecting to agent...",
      });

      // Start the call with the received access token
      await startCall(data.access_token);
      
      // Navigate to call page
      navigate(`/calls/${data.call_id}`);
    } catch (err: any) {
      console.error('Error creating web call:', err);
      toast({
        variant: "destructive",
        title: "Error creating web call",
        description: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    if (retellClientRef.current) {
      retellClientRef.current.stopCall();
      setIsCallActive(false);
      toast({
        title: "Call ended",
        description: "You have ended the call",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-6 w-6" />
              Create New Web Call
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select Agent
                </label>
                {fetchingAgents ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading agents...
                  </div>
                ) : (
                  <Select
                    value={selectedAgentId}
                    onValueChange={setSelectedAgentId}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem 
                          key={agent.agent_id} 
                          value={agent.agent_id}
                          className="font-mono"
                        >
                          {agent.agent_name || agent.agent_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-sm text-gray-500">
                  Choose the agent that will handle this web call
                </p>
              </div>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={loading || fetchingAgents || !selectedAgentId || isCallActive}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Start Call"
                  )}
                </Button>

                {isCallActive && (
                  <Button 
                    type="button"
                    variant="destructive"
                    onClick={handleEndCall}
                    className="flex-1"
                  >
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Call
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateWebCall;
