
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CreateCall = () => {
  const [fromNumber, setFromNumber] = useState("");
  const [toNumbers, setToNumbers] = useState([""]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddNumber = () => {
    setToNumbers(prev => [...prev, ""]);
  };

  const handleRemoveNumber = (index: number) => {
    if (toNumbers.length > 1) {
      setToNumbers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleNumberChange = (index: number, value: string) => {
    const newToNumbers = [...toNumbers];
    newToNumbers[index] = value;
    setToNumbers(newToNumbers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const promises = toNumbers.map(toNumber => 
        supabase.functions.invoke(
          'retell-calls',
          {
            body: {
              action: 'createPhoneCall',
              from_number: fromNumber,
              to_number: toNumber,
            }
          }
        )
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length > 0) {
        throw errors[0];
      }

      toast({
        title: "Calls created successfully",
        description: `Created ${toNumbers.length} call(s)`,
      });

      // Navigate to the first call created
      if (results[0].data) {
        navigate(`/calls/${results[0].data.call_id}`);
      } else {
        navigate('/calls');
      }
    } catch (err: any) {
      console.error('Error creating calls:', err);
      toast({
        variant: "destructive",
        title: "Error creating calls",
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

              <div className="space-y-4">
                <label className="text-sm font-medium">To Numbers (E.164 format)</label>
                {toNumbers.map((number, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="+12137774445"
                      value={number}
                      onChange={(e) => handleNumberChange(index, e.target.value)}
                      required
                      pattern="^\+[1-9]\d{1,14}$"
                      className="font-mono flex-1"
                    />
                    {index === toNumbers.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAddNumber}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    {toNumbers.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveNumber(index)}
                        className="shrink-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-sm text-gray-500">
                  The numbers you want to call
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
