
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

        const data = await response.text();
        console.log('Retell API response (listPhoneNumbers):', response.status, data);

        if (!response.ok) {
          throw new Error(`Failed to fetch phone numbers: ${response.status} - ${data}`);
        }

        return new Response(
          data,
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'listCalls': {
        const { limit = 50 } = body;
        
        const response = await fetch("https://api.retellai.com/v2/list-calls", {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ limit })
        });

        const responseText = await response.text();
        console.log('Retell API response (listCalls):', response.status, responseText);

        if (!response.ok) {
          throw new Error(`Failed to fetch calls: ${response.status} - ${responseText}`);
        }

        // Try to parse the response as JSON, if it fails return error
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse Retell API response:', e);
          throw new Error('Invalid response from Retell API');
        }

        // Ensure we're returning the expected structure
        return new Response(
          JSON.stringify({ calls: Array.isArray(data) ? data : [] }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'listAgents': {
        const response = await fetch("https://api.retellai.com/list-agents", {
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.text();
        console.log('Retell API response (listAgents):', response.status, data);

        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.status} - ${data}`);
        }

        return new Response(
          data,
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

        const data = await response.text();
        console.log('Retell API response (createPhoneCall):', response.status, data);

        if (!response.ok) {
          throw new Error(`Failed to create phone call: ${response.status} - ${data}`);
        }

        return new Response(
          data,
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case 'createWebCall': {
        const { agent_id } = body;
        if (!agent_id) {
          throw new Error("Missing required parameter: agent_id");
        }

        const response = await fetch("https://api.retellai.com/v2/create-web-call", {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ agent_id })
        });

        const data = await response.text();
        console.log('Retell API response (createWebCall):', response.status, data);

        if (!response.ok) {
          throw new Error(`Failed to create web call: ${response.status} - ${data}`);
        }

        return new Response(
          data,
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
