
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RETELL_API_KEY = Deno.env.get("RETELL_API_KEY");
    if (!RETELL_API_KEY) {
      throw new Error("RETELL_API_KEY is not set");
    }

    const { action, agent_id, filter_criteria } = await req.json();
    console.log(`Processing ${action} request`);

    switch (action) {
      case 'getApiKey':
        return new Response(
          JSON.stringify({ RETELL_API_KEY }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case 'listAgents':
        const agentsResponse = await fetch("https://api.retellai.com/list-agents", {
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!agentsResponse.ok) {
          throw new Error(`Failed to fetch agents: ${agentsResponse.statusText}`);
        }

        const agents = await agentsResponse.json();
        return new Response(
          JSON.stringify(agents),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case 'createWebCall':
        console.log('Creating web call for agent:', agent_id);
        const createCallResponse = await fetch("https://api.retellai.com/v2/create-web-call", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ agent_id })
        });

        if (!createCallResponse.ok) {
          const errorText = await createCallResponse.text();
          throw new Error(`Failed to create web call: ${createCallResponse.status} - ${errorText}`);
        }

        const callData = await createCallResponse.json();
        console.log('Web call created successfully:', callData.call_id);
        return new Response(
          JSON.stringify(callData),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case 'listCalls':
        console.log('Listing calls with filter criteria:', filter_criteria);
        const listCallsResponse = await fetch("https://api.retellai.com/v2/list-calls", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...filter_criteria, limit: 50 })
        });

        if (!listCallsResponse.ok) {
          throw new Error(`Failed to list calls: ${listCallsResponse.statusText}`);
        }

        const calls = await listCallsResponse.json();
        return new Response(
          JSON.stringify({ calls }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case 'getCall':
        const { call_id } = filter_criteria;
        console.log('Fetching call details for ID:', call_id);
        
        const getCallResponse = await fetch(`https://api.retellai.com/v2/get-call/${call_id}`, {
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!getCallResponse.ok) {
          throw new Error(`Failed to fetch call details: ${getCallResponse.statusText}`);
        }

        const callDetails = await getCallResponse.json();
        return new Response(
          JSON.stringify(callDetails),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
