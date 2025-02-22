
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MoreHorizontal, Plus, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Agent {
  agent_id: string;
  agent_name: string | null;
  voice_id: string;
  language: string;
  voice_model: string | null;
}

export default function ListAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching API key from Supabase...");
      const { data, error: apiKeyError } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'getApiKey'
          }
        }
      );

      if (apiKeyError || !data?.RETELL_API_KEY) {
        console.error("Error fetching API key:", apiKeyError);
        throw new Error("Failed to fetch API key");
      }

      console.log("API key retrieved successfully");
      console.log("Making request to Retell API...");
      
      const response = await fetch("https://api.retellai.com/list-agents", {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${data.RETELL_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      const responseText = await response.text();
      console.log("Raw API Response:", responseText);

      if (!response.ok) {
        console.error("Retell API error:", response.status, responseText);
        throw new Error(`Failed to fetch agents: ${response.status} ${responseText}`);
      }

      const agentsData = JSON.parse(responseText);
      console.log("Agents fetched successfully:", agentsData);
      setAgents(agentsData);
    } catch (error: any) {
      console.error("Error in fetchAgents:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch agents",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agents</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAgents}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/create-agent')}>
                  New Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/create-web-call')}>
                  New Web Call
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/create-call')}>
                  New Phone Call
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading agents...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Voice ID</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Voice Model</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell>{agent.agent_id}</TableCell>
                      <TableCell>{agent.agent_name || "N/A"}</TableCell>
                      <TableCell>{agent.voice_id}</TableCell>
                      <TableCell>{agent.language}</TableCell>
                      <TableCell>{agent.voice_model || "Default"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/agents/${agent.agent_id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/create-web-call')}>
                              Create Web Call
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/create-call')}>
                              Create Phone Call
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
