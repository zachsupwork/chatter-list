
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PhoneNumber {
  phone_number: string;
  phone_number_pretty: string;
  nickname: string | null;
}

const CreateCall = () => {
  const [fromNumbers, setFromNumbers] = useState<PhoneNumber[]>([]);
  const [fromNumber, setFromNumber] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'retell-calls',
          {
            body: {
              action: 'listPhoneNumbers'
            }
          }
        );

        if (error) throw error;
        setFromNumbers(data);
      } catch (err: any) {
        console.error('Error fetching phone numbers:', err);
        toast({
          variant: "destructive",
          title: "Error loading phone numbers",
          description: err.message || "Failed to load phone numbers",
        });
      } finally {
        setLoadingNumbers(false);
      }
    };

    fetchPhoneNumbers();
  }, [toast]);

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
                  From Number
                </label>
                <Select
                  value={fromNumber}
                  onValueChange={setFromNumber}
                >
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Select a phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromNumbers.map((number) => (
                      <SelectItem 
                        key={number.phone_number} 
                        value={number.phone_number}
                        className="font-mono"
                      >
                        {number.nickname ? `${number.phone_number_pretty} (${number.nickname})` : number.phone_number_pretty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <Button type="submit" disabled={loading || loadingNumbers}>
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
