
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
      const { data: { RETELL_API_KEY } } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'getApiKey'
          }
        }
      );

      const response = await fetch("https://api.retellai.com/list-agents", {
        headers: {
          "Authorization": `Bearer ${RETELL_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await response.json();
      setAgents(data);
    } catch (error: any) {
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
                {agents.map((agent) => (
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
