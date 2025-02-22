
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Video, Loader2, Code, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { RetellWebClient } from "retell-client-js-sdk";

interface Agent {
  agent_id: string;
  agent_name: string | null;
}

const CreateWebCall = () => {
  const { agentId } = useParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(agentId || "");
  const [loading, setLoading] = useState(false);
  const [fetchingAgents, setFetchingAgents] = useState(!agentId);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!agentId) {
      const fetchAgents = async () => {
        try {
          setFetchingAgents(true);
          
          const { data: apiResponse, error: apiError } = await supabase.functions.invoke(
            'retell-calls',
            {
              body: {
                action: 'getApiKey'
              }
            }
          );

          if (apiError || !apiResponse?.RETELL_API_KEY) {
            throw new Error("Failed to fetch API key");
          }

          const { data: agentsData, error: agentsError } = await supabase.functions.invoke(
            'retell-calls',
            {
              body: {
                action: 'listAgents'
              }
            }
          );

          if (agentsError) {
            throw agentsError;
          }

          setAgents(agentsData || []);
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
    } else {
      setFetchingAgents(false);
    }
  }, [agentId, toast]);

  useEffect(() => {
    const initializeCall = async () => {
      if (!accessToken) return;

      try {
        console.log('Initializing Retell Web Client...');
        
        // Create a new instance of RetellWebClient
        if (!retellClientRef.current) {
          retellClientRef.current = new RetellWebClient();
        }

        // Set up event listeners
        retellClientRef.current.on("call_started", () => {
          console.log("Call started");
          toast({
            title: "Call started",
            description: "You are now connected with the agent",
          });
        });

        retellClientRef.current.on("call_ended", () => {
          console.log("Call ended");
          toast({
            title: "Call ended",
            description: "The call has been disconnected",
          });
        });

        retellClientRef.current.on("error", (error) => {
          console.error("Call error:", error);
          toast({
            variant: "destructive",
            title: "Call error",
            description: error.message || "An error occurred during the call",
          });
          retellClientRef.current?.stopCall();
        });

        // Start the call with the access token
        await retellClientRef.current.startCall({
          accessToken: accessToken,
          captureDeviceId: "default",
        });

        console.log('Call initialized successfully');
      } catch (err) {
        console.error('Error initializing call:', err);
        toast({
          variant: "destructive",
          title: "Error initializing call",
          description: "Failed to start the call. Please try again.",
        });
      }
    };

    initializeCall();

    // Cleanup function
    return () => {
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
        retellClientRef.current = null;
      }
    };
  }, [accessToken, toast]);

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

      if (error) {
        throw error;
      }

      if (!data || !data.call_id || !data.access_token) {
        throw new Error("Invalid response from server");
      }

      setAccessToken(data.access_token);
      setShowCodeSnippet(true);

      toast({
        title: "Web call created successfully",
        description: `Call ID: ${data.call_id}`,
      });
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

  const embedCodeSnippet = `
<!-- Add this to your HTML -->
<script src="https://cdn.retellai.com/sdk/web-sdk.js"></script>

<!-- Add this where you want the call widget to appear -->
<div id="retell-call-widget"></div>

<script>
const widget = Retell.widget.createCallWidget({
  containerId: 'retell-call-widget',
  accessToken: '${accessToken || 'YOUR_ACCESS_TOKEN'}'
});
</script>
  `;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCodeSnippet);
      setCopied(true);
      toast({
        title: "Code copied",
        description: "The code snippet has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try copying the code manually",
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
                {agentId ? (
                  <input
                    type="text"
                    value={selectedAgentId}
                    disabled
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-4 py-2"
                  />
                ) : fetchingAgents ? (
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
                  {agentId ? "Using pre-selected agent" : "Choose the agent that will handle this web call"}
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={loading || fetchingAgents || !selectedAgentId}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Web Call"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {accessToken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-6 w-6" />
                Test Call Widget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px] bg-white rounded-lg border border-gray-200 relative overflow-hidden">
                <div 
                  id="retell-call-widget" 
                  ref={widgetContainerRef}
                  className="w-full h-full absolute inset-0"
                ></div>
              </div>
            </CardContent>
          </Card>
        )}

        {showCodeSnippet && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-6 w-6" />
                Code Snippet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="text-sm">
                  <code>{embedCodeSnippet}</code>
                </pre>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Use this code snippet to integrate the web call widget into your website.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateWebCall;
