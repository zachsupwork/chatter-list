
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
      return new Response(
        JSON.stringify({ error: 'RETELL_API_KEY is not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    switch (action) {
      case 'listAgents': {
        console.log('Fetching agents...');
        const response = await fetch('https://api.retellai.com/list-agents', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });

        const responseData = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: responseData.message || 'Failed to fetch agents' }),
            { 
              status: response.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Return the array directly without wrapping it in a data property
        return new Response(
          JSON.stringify(Array.isArray(responseData) ? responseData : []),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'createWebCall': {
        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: 'agent_id is required' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        console.log('Creating web call for agent:', agent_id);
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agent_id })
        });

        const responseData = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: responseData.message || 'Failed to create web call' }),
            { 
              status: response.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(
          JSON.stringify(responseData),
          { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
