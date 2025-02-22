
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BatchCallTask {
  to_number: string;
  retell_llm_dynamic_variables?: Record<string, any>;
}

interface BatchCallForm {
  from_number: string;
  name: string;
  tasks: BatchCallTask[];
  trigger_timestamp?: number;
}

export default function CreateBatchCall() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BatchCallForm>({
    from_number: "",
    name: "",
    tasks: [{ to_number: "" }],
  });

  const handleAddTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { to_number: "" }]
    }));
  };

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], to_number: value };
    setFormData(prev => ({
      ...prev,
      tasks: newTasks
    }));
  };

  const handleRemoveTask = (index: number) => {
    if (formData.tasks.length > 1) {
      const newTasks = formData.tasks.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        tasks: newTasks
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First validate the phone number using the same endpoint as single calls
      const { data: validationData, error: validationError } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'validatePhoneNumber',
            from_number: formData.from_number,
          }
        }
      );

      if (validationError) throw validationError;

      // If validation passes, proceed with batch call creation
      const { data, error } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'createBatchCall',
            ...formData,
          }
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: `Batch call created successfully`,
      });

      navigate("/calls");
    } catch (error: any) {
      console.error("Error creating batch call:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create batch call. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Batch Call</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">From Number (E.164 format)</label>
              <Input
                type="text"
                placeholder="+14157774444"
                value={formData.from_number}
                onChange={(e) => setFormData(prev => ({ ...prev, from_number: e.target.value }))}
                required
                pattern="^\+[1-9]\d{10,14}$"
              />
              <p className="text-sm text-gray-500 mt-1">
                Must be a number purchased from or imported to Retell
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Batch Call Name</label>
              <Input
                type="text"
                placeholder="My Batch Call"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2">Call Tasks</label>
              {formData.tasks.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="To Number (E.164 format)"
                    value={task.to_number}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    required
                    pattern="^\+[1-9]\d{10,14}$"
                  />
                  {formData.tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveTask(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTask}
                className="mt-2"
              >
                Add Task
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Schedule Time (optional)</label>
              <Input
                type="datetime-local"
                onChange={(e) => {
                  const timestamp = new Date(e.target.value).getTime();
                  setFormData(prev => ({ ...prev, trigger_timestamp: timestamp }));
                }}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Batch Call"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/calls")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
