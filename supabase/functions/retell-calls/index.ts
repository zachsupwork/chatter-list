
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { action, agent_id, call_id } = await req.json();
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');

    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is not set');
    }

    const headers = {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
      ...corsHeaders
    };

    switch (action) {
      case 'listAgents': {
        console.log('Fetching agents...');
        const response = await fetch('https://api.retellai.com/v2/list-agents', {
          method: 'GET',
          headers
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch agents');
        }

        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case 'createWebCall': {
        if (!agent_id) {
          throw new Error('agent_id is required');
        }

        console.log('Creating web call for agent:', agent_id);
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
          method: 'POST',
          headers,
          body: JSON.stringify({ agent_id })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create web call');
        }

        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      case 'get': {
        if (!call_id) {
          throw new Error('call_id is required');
        }

        console.log('Fetching call details for:', call_id);
        const response = await fetch(`https://api.retellai.com/v2/get-call/${call_id}`, {
          method: 'GET',
          headers
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch call details');
        }

        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
