
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PhoneNumber {
  phone_number: string;
  phone_number_pretty: string;
  nickname: string | null;
}

interface ToNumber {
  number: string;
  status: 'pending' | 'calling' | 'complete' | 'error';
  call_id?: string;
  error?: string;
}

const CreateCall = () => {
  const [fromNumbers, setFromNumbers] = useState<PhoneNumber[]>([]);
  const [fromNumber, setFromNumber] = useState("");
  const [toNumbers, setToNumbers] = useState<ToNumber[]>([{ number: '', status: 'pending' }]);
  const [loading, setLoading] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(true);
  const [simultaneousCalls, setSimultaneousCalls] = useState(false);
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

  const addToNumber = () => {
    setToNumbers([...toNumbers, { number: '', status: 'pending' }]);
  };

  const removeToNumber = (index: number) => {
    if (toNumbers.length > 1) {
      const newToNumbers = [...toNumbers];
      newToNumbers.splice(index, 1);
      setToNumbers(newToNumbers);
    }
  };

  const updateToNumber = (index: number, number: string) => {
    const newToNumbers = [...toNumbers];
    newToNumbers[index] = { ...newToNumbers[index], number };
    setToNumbers(newToNumbers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (simultaneousCalls) {
        // Make all calls simultaneously
        const callPromises = toNumbers.map(async (to) => {
          try {
            const { data, error } = await supabase.functions.invoke(
              'retell-calls',
              {
                body: {
                  action: 'createPhoneCall',
                  from_number: fromNumber,
                  to_number: to.number,
                }
              }
            );

            if (error) throw error;
            return { ...to, status: 'complete' as const, call_id: data.call_id };
          } catch (err: any) {
            console.error('Error creating call:', err);
            return { ...to, status: 'error' as const, error: err.message };
          }
        });

        const results = await Promise.all(callPromises);
        setToNumbers(results);

        const successfulCalls = results.filter(call => call.status === 'complete');
        const failedCalls = results.filter(call => call.status === 'error');

        toast({
          title: `${successfulCalls.length} calls created successfully`,
          description: failedCalls.length > 0 
            ? `${failedCalls.length} calls failed` 
            : "All calls were created successfully",
          variant: failedCalls.length > 0 ? "destructive" : "default",
        });

        if (successfulCalls.length === 1) {
          navigate(`/calls/${successfulCalls[0].call_id}`);
        } else if (successfulCalls.length > 0) {
          navigate('/calls');
        }
      } else {
        // Make calls sequentially
        const updatedToNumbers = [...toNumbers];
        
        for (let i = 0; i < toNumbers.length; i++) {
          updatedToNumbers[i] = { ...updatedToNumbers[i], status: 'calling' };
          setToNumbers(updatedToNumbers);

          try {
            const { data, error } = await supabase.functions.invoke(
              'retell-calls',
              {
                body: {
                  action: 'createPhoneCall',
                  from_number: fromNumber,
                  to_number: toNumbers[i].number,
                }
              }
            );

            if (error) throw error;

            updatedToNumbers[i] = { 
              ...updatedToNumbers[i], 
              status: 'complete',
              call_id: data.call_id 
            };
          } catch (err: any) {
            console.error('Error creating call:', err);
            updatedToNumbers[i] = { 
              ...updatedToNumbers[i], 
              status: 'error',
              error: err.message 
            };
            
            // Show error but continue with next number
            toast({
              variant: "destructive",
              title: `Error calling ${toNumbers[i].number}`,
              description: err.message || "Failed to create call",
            });
          }

          setToNumbers([...updatedToNumbers]);
        }

        const successfulCalls = updatedToNumbers.filter(call => call.status === 'complete');
        if (successfulCalls.length === 1) {
          navigate(`/calls/${successfulCalls[0].call_id}`);
        } else if (successfulCalls.length > 0) {
          navigate('/calls');
        }
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
              Create New Phone Calls
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">To Numbers (E.164 format)</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addToNumber}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Number
                  </Button>
                </div>
                {toNumbers.map((to, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="+12137774445"
                      value={to.number}
                      onChange={(e) => updateToNumber(index, e.target.value)}
                      required
                      pattern="^\+[1-9]\d{1,14}$"
                      className="font-mono"
                    />
                    {toNumbers.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeToNumber(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-sm text-gray-500">
                  The numbers you want to call
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="simultaneous"
                  checked={simultaneousCalls}
                  onCheckedChange={setSimultaneousCalls}
                />
                <Label htmlFor="simultaneous">Make calls simultaneously</Label>
              </div>

              <Button type="submit" disabled={loading || loadingNumbers}>
                {loading ? "Creating..." : "Create Calls"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCall;

