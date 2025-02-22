
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
    if (!RETELL_API_KEY) {
      throw new Error("RETELL_API_KEY is not set");
    }

    const body = await req.json().catch(() => ({}));
    const { action, from_number, to_number, tasks } = body;

    console.log(`Processing ${action} request with body:`, body);

    if (!action) {
      throw new Error("Action is required");
    }

    switch (action) {
      case 'listPhoneNumbers': {
        const response = await fetch("https://api.retellai.com/list-phone-numbers", {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        const responseText = await response.text();
        console.log('Retell API response:', responseText);

        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (err) {
          console.error('Error parsing Retell API response:', err);
          throw new Error(`Invalid response from Retell API: ${responseText}`);
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch phone numbers: ${response.status} - ${JSON.stringify(responseData)}`);
        }

        return new Response(
          JSON.stringify(responseData),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'createPhoneCall': {
        if (!from_number || !to_number) {
          throw new Error("Missing required parameters: from_number and to_number are required");
        }

        console.log(`Creating phone call from ${from_number} to ${to_number}`);

        const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ from_number, to_number })
        });

        const responseText = await response.text();
        console.log('Retell API response:', responseText);

        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (err) {
          console.error('Error parsing Retell API response:', err);
          throw new Error(`Invalid response from Retell API: ${responseText}`);
        }

        if (!response.ok) {
          throw new Error(`Failed to create phone call: ${response.status} - ${JSON.stringify(responseData)}`);
        }

        return new Response(
          JSON.stringify(responseData),
          { 
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'createBatchCall': {
        if (!from_number || !Array.isArray(tasks) || tasks.length === 0) {
          throw new Error("Missing required parameters: from_number and tasks array are required");
        }

        console.log(`Creating batch call from ${from_number} with ${tasks.length} tasks`);

        const calls = [];
        let successful = 0;
        let failed = 0;

        // Create calls in sequence
        for (const task of tasks) {
          try {
            const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
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

            const responseText = await response.text();
            console.log(`Retell API response for ${task.to_number}:`, responseText);

            let responseData;
            try {
              responseData = JSON.parse(responseText);
            } catch (err) {
              console.error('Error parsing Retell API response:', err);
              throw new Error(`Invalid response from Retell API: ${responseText}`);
            }
            
            if (!response.ok) {
              console.error(`Failed to create call to ${task.to_number}:`, responseData);
              calls.push({
                to_number: task.to_number,
                status: 'error',
                error: `Failed to create call: ${response.status} - ${JSON.stringify(responseData)}`
              });
              failed++;
              continue;
            }

            calls.push({
              to_number: task.to_number,
              status: 'success',
              data: responseData
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
            calls,
            summary: {
              total: calls.length,
              successful,
              failed
            }
          }),
          { 
            status: 201,
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
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

