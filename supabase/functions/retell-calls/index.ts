
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

interface RetellHeaders {
  Authorization: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY not found in environment variables');
    }

    // Common headers for Retell API calls
    const headers: RetellHeaders = {
      'Authorization': `Bearer ${RETELL_API_KEY}`
    };

    // Get the action from the request body
    const { action, ...params } = await req.json();
    console.log(`Processing ${action} request with params:`, params);

    // Base Retell API URL
    const RETELL_API_BASE = 'https://api.retellai.com/v2';

    switch (action) {
      case 'getApiKey':
        return new Response(
          JSON.stringify({ RETELL_API_KEY }),
          { headers: corsHeaders }
        );

      case 'listPhoneNumbers':
        try {
          const response = await fetch(`${RETELL_API_BASE}/list-phone-numbers`, {
            method: 'GET',
            headers
          });

          if (!response.ok) {
            throw new Error(`Retell API error: ${response.status} - ${await response.text()}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error listing phone numbers:', error);
          throw error;
        }

      case 'createPhoneCall':
        try {
          const { from_number, to_number } = params;
          if (!from_number || !to_number) {
            throw new Error('Missing required parameters: from_number and/or to_number');
          }

          const response = await fetch(`${RETELL_API_BASE}/create-phone-call`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from_number, to_number })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Retell API error response:', errorText);
            throw new Error(`Retell API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error creating phone call:', error);
          throw error;
        }

      case 'listCalls':
        try {
          const { limit = 50, pagination_key } = params;
          const url = new URL(`${RETELL_API_BASE}/list-calls`);
          
          if (pagination_key) {
            url.searchParams.append('pagination_key', pagination_key);
          }
          url.searchParams.append('limit', limit.toString());

          const response = await fetch(url.toString(), {
            method: 'GET',
            headers
          });

          if (!response.ok) {
            throw new Error(`Retell API error: ${response.status} - ${await response.text()}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error listing calls:', error);
          throw error;
        }

      case 'createBatchCall':
        try {
          const { from_number, tasks } = params;
          if (!from_number || !tasks || !Array.isArray(tasks)) {
            throw new Error('Invalid batch call parameters');
          }

          const response = await fetch(`${RETELL_API_BASE}/create-batch-call`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from_number,
              tasks
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Retell API error response:', errorText);
            throw new Error(`Retell API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error creating batch call:', error);
          throw error;
        }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: error.status || 500, 
        headers: corsHeaders 
      }
    );
  }
});
