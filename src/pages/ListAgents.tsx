
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      console.log("Fetching API key from Supabase...");
      const { data: { RETELL_API_KEY }, error: apiKeyError } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'getApiKey'
          }
        }
      );

      if (apiKeyError) {
        console.error("Error fetching API key:", apiKeyError);
        throw new Error("Failed to fetch API key");
      }

      console.log("API key retrieved successfully, making request to Retell API...");
      const response = await fetch("https://api.retellai.com/list-agents", {
        headers: {
          "Authorization": `Bearer ${RETELL_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Retell API error:", response.status, errorText);
        throw new Error(`Failed to fetch agents: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Agents fetched successfully:", data);
      setAgents(data);
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
          <Button onClick={() => navigate('/create-agent')}>Create Agent</Button>
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
                  <TableHead>Actions</TableHead>
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
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/agents/${agent.agent_id}`)}
                        >
                          View Details
                        </Button>
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

