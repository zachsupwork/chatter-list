
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
    const { action, agent_id } = await req.json();
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is required');
    }

    switch (action) {
      case 'listAgents': {
        const response = await fetch('https://api.retellai.com/list-agents', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch agents');
        }

        const agents = await response.json();
        
        // Ensure we return an array wrapped in a data property
        return new Response(
          JSON.stringify({ 
            data: Array.isArray(agents) ? agents : [] 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'createWebCall': {
        if (!agent_id) {
          throw new Error('agent_id is required');
        }

        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agent_id })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create web call');
        }

        const data = await response.json();
        return new Response(
          JSON.stringify(data),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ 
        error: err.message || 'Internal server error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
