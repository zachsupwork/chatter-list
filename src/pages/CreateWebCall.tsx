
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Video, Loader2, PhoneOff, Phone } from "lucide-react";
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
  const [retellClient] = useState(() => new RetellWebClient());
  const { toast } = useToast();
  const navigate = useNavigate();

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
  }, []);

  const setupWebCallEventListeners = useCallback(() => {
    retellClient.on("call_started", () => {
      toast({
        title: "Call started",
        description: "You are now connected with the agent",
      });
      setIsCallActive(true);
    });

    retellClient.on("call_ended", () => {
      toast({
        title: "Call ended",
        description: "The call has been disconnected",
      });
      setIsCallActive(false);
    });

    retellClient.on("error", (error) => {
      console.error("Call error:", error);
      toast({
        variant: "destructive",
        title: "Call error",
        description: error.message || "An error occurred during the call",
      });
      setIsCallActive(false);
      retellClient.stopCall();
    });

    // Agent talking status for UI feedback
    retellClient.on("agent_start_talking", () => {
      console.log("Agent started talking");
    });

    retellClient.on("agent_stop_talking", () => {
      console.log("Agent stopped talking");
    });

    // Real-time updates
    retellClient.on("update", (update) => {
      console.log("Call update:", update);
    });
  }, [retellClient]);

  const startCall = async () => {
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
        title: "Starting call",
        description: "Connecting to agent...",
      });

      // Initialize call with Retell SDK
      setupWebCallEventListeners();
      await retellClient.startCall({
        accessToken: data.access_token,
        sampleRate: 24000,
      });

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

  const endCall = () => {
    retellClient.stopCall();
    setIsCallActive(false);
    toast({
      title: "Call ended",
      description: "You have disconnected from the call",
    });
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
            <form onSubmit={(e) => { e.preventDefault(); startCall(); }} className="space-y-6">
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

              {isCallActive ? (
                <Button 
                  type="button"
                  onClick={endCall}
                  variant="destructive"
                  className="w-full"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={loading || fetchingAgents || !selectedAgentId}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Start Call
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateWebCall;
