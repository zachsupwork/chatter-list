
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY') || '';

async function fetchFromRetell(endpoint: string, options: RequestInit = {}) {
  const baseURL = 'https://api.retellai.com/v2';
  const url = `${baseURL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, call_id, limit = 50 } = await req.json();

    switch (action) {
      case 'listCalls': {
        console.log('Fetching calls list...');
        const calls = await fetchFromRetell('/list-calls', {
          method: 'POST',
          body: JSON.stringify({ limit }),
        });
        console.log('Calls fetched successfully');
        return new Response(
          JSON.stringify(calls),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getCall': {
        if (!call_id) {
          throw new Error('call_id is required');
        }
        console.log('Fetching call details for ID:', call_id);
        const call = await fetchFromRetell(`/get-call/${call_id}`, {
          method: 'GET',
        });
        console.log('Call details fetched successfully');
        return new Response(
          JSON.stringify(call),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error in retell-calls function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
