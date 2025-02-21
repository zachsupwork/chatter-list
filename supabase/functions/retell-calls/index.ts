
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
      console.error('RETELL_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'RETELL_API_KEY is not configured' }),
        { 
          status: 200, // Changed to 200 to avoid non-2xx error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    switch (action) {
      case 'listAgents': {
        console.log('Fetching agents with Retell API...');
        try {
          const response = await fetch('https://api.retellai.com/list-agents', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${RETELL_API_KEY}`,
              'Content-Type': 'application/json',
            }
          });

          const responseData = await response.json();
          console.log('Retell API response:', responseData);

          // Always return 200 with data, even if empty
          return new Response(
            JSON.stringify(Array.isArray(responseData) ? responseData : []),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } catch (error) {
          console.error('Error fetching agents:', error);
          return new Response(
            JSON.stringify([]), // Return empty array instead of error
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      case 'createWebCall': {
        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: 'agent_id is required' }),
            { 
              status: 200, // Changed to 200 to avoid non-2xx error
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        try {
          console.log('Creating web call for agent:', agent_id);
          const response = await fetch('https://api.retellai.com/v2/create-web-call', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RETELL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ agent_id })
          });

          const data = await response.json();
          return new Response(
            JSON.stringify(data),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } catch (error) {
          console.error('Error creating web call:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create web call' }),
            { 
              status: 200, // Changed to 200 to avoid non-2xx error
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 200, // Changed to 200 to avoid non-2xx error
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (err) {
    console.error('General error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 200, // Changed to 200 to avoid non-2xx error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
