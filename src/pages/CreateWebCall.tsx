
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CreateWebCall = () => {
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'createWebCall',
            agent_id: agentId,
          }
        }
      );

      if (error) throw error;

      toast({
        title: "Web call created successfully",
        description: `Call ID: ${data.call_id}`,
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
                <label htmlFor="agentId" className="text-sm font-medium">
                  Agent ID
                </label>
                <Input
                  id="agentId"
                  placeholder="Enter agent ID"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  required
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  The unique ID of the agent to be used for this call
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Web Call"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateWebCall;
