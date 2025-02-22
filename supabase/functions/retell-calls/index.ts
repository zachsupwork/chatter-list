
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key is set
    if (!RETELL_API_KEY) {
      throw new Error("RETELL_API_KEY is not set");
    }

    // Parse request body and validate action
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (!action) {
      throw new Error("Action is required");
    }

    console.log(`Processing ${action} request with body:`, body);

    switch (action) {
      case 'getApiKey': {
        return new Response(
          JSON.stringify({ RETELL_API_KEY }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'listPhoneNumbers': {
        const response = await fetch("https://api.retellai.com/list-phone-numbers", {
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch phone numbers: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return new Response(
          JSON.stringify(data),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'createPhoneCall': {
        const { from_number, to_number } = body;
        if (!from_number || !to_number) {
          throw new Error("Missing required parameters: from_number and to_number are required");
        }

        const response = await fetch("https://api.retellai.com/create-phone-call", {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ from_number, to_number })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create phone call: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return new Response(
          JSON.stringify(data),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'createBatchCall': {
        const { from_number, tasks } = body;
        if (!from_number || !Array.isArray(tasks) || tasks.length === 0) {
          throw new Error("Missing required parameters: from_number and tasks array are required");
        }

        const calls = [];
        let successful = 0;
        let failed = 0;

        // Create calls in sequence
        for (const task of tasks) {
          try {
            const response = await fetch("https://api.retellai.com/create-phone-call", {
              method: 'POST',
              headers: {
                "Authorization": `Bearer ${RETELL_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ 
                from_number, 
                to_number: task.to_number,
              })
            });

            const data = await response.text();
            const isJson = data.startsWith('{') || data.startsWith('[');
            
            if (!response.ok) {
              console.error(`Failed to create call to ${task.to_number}: ${response.status} - ${data}`);
              calls.push({
                to_number: task.to_number,
                status: 'error',
                error: `Failed to create call: ${response.status} - ${data}`
              });
              failed++;
              continue;
            }

            const parsedData = isJson ? JSON.parse(data) : { message: data };
            calls.push({
              to_number: task.to_number,
              status: 'success',
              data: parsedData
            });
            successful++;
          } catch (err) {
            console.error(`Error creating call to ${task.to_number}:`, err);
            calls.push({
              to_number: task.to_number,
              status: 'error',
              error: err.message
            });
            failed++;
          }
        }

        return new Response(
          JSON.stringify({
            batch_call_id: crypto.randomUUID(),
            calls: calls,
            summary: {
              total: calls.length,
              successful,
              failed
            }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
