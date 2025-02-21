
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
    const { action, agent_id, call_id } = await req.json();
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');

    if (!RETELL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RETELL_API_KEY is not configured' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    switch (action) {
      case 'listAgents': {
        console.log('Fetching agents...');
        const response = await fetch('https://api.retellai.com/v2/list-agents', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Error from Retell API:', data);
          return new Response(
            JSON.stringify({ error: data.message || 'Failed to fetch agents' }),
            { 
              status: response.status,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }

        return new Response(
          JSON.stringify(data),
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
          return new Response(
            JSON.stringify({ error: 'agent_id is required' }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
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

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Error from Retell API:', data);
          return new Response(
            JSON.stringify({ error: data.message || 'Failed to create web call' }),
            { 
              status: response.status,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }

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

      case 'get': {
        if (!call_id) {
          return new Response(
            JSON.stringify({ error: 'call_id is required' }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }

        console.log('Fetching call details for:', call_id);
        const response = await fetch(`https://api.retellai.com/v2/get-call/${call_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Error from Retell API:', data);
          return new Response(
            JSON.stringify({ error: data.message || 'Failed to fetch call details' }),
            { 
              status: response.status,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }

        return new Response(
          JSON.stringify(data),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
