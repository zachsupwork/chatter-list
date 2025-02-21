
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { action, agent_id } = await req.json();
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');

    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is not configured');
    }

    switch (action) {
      case 'listAgents': {
        console.log('Fetching agents...');
        const response = await fetch('https://api.retellai.com/list-agents', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch agents');
        }

        const agents = await response.json();
        
        // Ensure we return an array, even if empty
        return new Response(
          JSON.stringify({ data: Array.isArray(agents) ? agents : [] }),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      case 'createWebCall': {
        if (!agent_id) {
          throw new Error('agent_id is required');
        }

        console.log('Creating web call for agent:', agent_id);
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
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
            status: 201,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: error.message === 'Invalid action' ? 400 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
