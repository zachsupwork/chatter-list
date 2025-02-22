
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
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      console.log('Fetching API key from Supabase...');
      
      // First get the API key securely from Supabase
      const { data: secretData, error: secretError } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: { action: 'getApiKey' }
        }
      );

      if (secretError || !secretData?.RETELL_API_KEY) {
        throw new Error('Could not retrieve API key');
      }

      console.log('Fetching agents data from Retell API...');
      const response = await fetch('https://api.retellai.com/agents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretData.RETELL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Received agents data:', data);
      
      // Handle both array and object responses from the API
      const agentsData = Array.isArray(data) ? data : 
                        data?.agents ? data.agents : [];
      
      setAgents(agentsData);
      setIsError(false);
    } catch (error: any) {
      console.error("Error in fetchAgents:", error);
      setIsError(true);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch agents",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTableContent = () => {
    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <p className="text-muted-foreground">Failed to load agents</p>
              <Button onClick={fetchAgents} variant="outline" size="sm">
                Try again
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (isLoading) {
      return Array(3).fill(0).map((_, index) => (
        <TableRow key={index}>
          {Array(6).fill(0).map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (agents.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <p className="text-muted-foreground">No agents found</p>
              <Button onClick={() => navigate('/create-agent')} variant="outline" size="sm">
                Create your first agent
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return agents.map((agent) => (
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
              <DropdownMenuItem onClick={() => navigate(`/create-web-call/${agent.agent_id}`)}>
                Create Web Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/create-call')}>
                Create Phone Call
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
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
              {renderTableContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
