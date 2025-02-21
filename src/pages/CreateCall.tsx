
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CreateCall = () => {
  const [fromNumber, setFromNumber] = useState("");
  const [toNumber, setToNumber] = useState("");
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
            action: 'createPhoneCall',
            from_number: fromNumber,
            to_number: toNumber,
          }
        }
      );

      if (error) throw error;

      toast({
        title: "Call created successfully",
        description: `Call ID: ${data.call_id}`,
      });

      navigate(`/calls/${data.call_id}`);
    } catch (err: any) {
      console.error('Error creating call:', err);
      toast({
        variant: "destructive",
        title: "Error creating call",
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
              <Phone className="h-6 w-6" />
              Create New Phone Call
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="fromNumber" className="text-sm font-medium">
                  From Number (E.164 format)
                </label>
                <Input
                  id="fromNumber"
                  placeholder="+14157774444"
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                  required
                  pattern="^\+[1-9]\d{1,14}$"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  Must be a number purchased from or imported to Retell
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="toNumber" className="text-sm font-medium">
                  To Number (E.164 format)
                </label>
                <Input
                  id="toNumber"
                  placeholder="+12137774445"
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                  required
                  pattern="^\+[1-9]\d{1,14}$"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  The number you want to call
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Call"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCall;
