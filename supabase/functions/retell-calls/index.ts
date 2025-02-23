
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY') || 'key_bc69ed16c81fa347d618b4763cb7';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, agent_id } = await req.json();

    // API base url
    const baseUrl = "https://api.retellai.com";
    
    // Common headers for all requests
    const headers = {
      "Authorization": `Bearer ${RETELL_API_KEY}`,
      "Content-Type": "application/json"
    };

    let response;

    switch (action) {
      case 'getApiKey':
        return new Response(
          JSON.stringify({ RETELL_API_KEY }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'getAgents':
        response = await fetch(`${baseUrl}/list-agents`, {
          method: 'GET',
          headers
        });
        break;

      case 'getAgent':
        if (!agent_id) throw new Error('Agent ID is required');
        response = await fetch(`${baseUrl}/get-agent/${agent_id}`, {
          method: 'GET',
          headers
        });
        break;

      case 'createAgent':
        const agentData = req.body;
        response = await fetch(`${baseUrl}/create-agent`, {
          method: 'POST',
          headers,
          body: JSON.stringify(agentData)
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process request');
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
