
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

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
    const headers = {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // Base Retell API URL for v2 endpoints
    const RETELL_API_BASE = 'https://api.retellai.com/v2';

    // Get the action and params from the request body
    const { action, ...params } = await req.json();
    console.log(`Processing ${action} request with params:`, params);

    let response;

    switch (action) {
      case 'listCalls': {
        const { filter_criteria, sort_order = 'descending', limit = 50, pagination_key } = params;
        console.log('Fetching calls with params:', { filter_criteria, sort_order, limit, pagination_key });
        
        // Build the URL with query parameters
        let url = new URL(`${RETELL_API_BASE}/list-calls`);
        
        if (limit) url.searchParams.append('limit', limit.toString());
        if (sort_order) url.searchParams.append('sort_order', sort_order);
        if (pagination_key) url.searchParams.append('pagination_key', pagination_key);
        
        response = await fetch(url.toString(), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filter_criteria: filter_criteria || {},
          }),
        });
        break;
      }

      case 'getCall': {
        const { call_id } = params;
        if (!call_id) {
          throw new Error('Missing required parameter: call_id');
        }
        
        console.log('Fetching call details for ID:', call_id);
        response = await fetch(`${RETELL_API_BASE}/get-call/${call_id}`, {
          method: 'GET',
          headers,
        });
        break;
      }

      case 'listPhoneNumbers': {
        console.log('Fetching phone numbers...');
        response = await fetch(`${RETELL_API_BASE}/list-phone-numbers`, {
          method: 'GET',
          headers,
        });
        break;
      }

      case 'getPhoneNumber': {
        const { phone_number } = params;
        if (!phone_number) {
          throw new Error('Missing required parameter: phone_number');
        }

        console.log('Fetching phone number:', phone_number);
        response = await fetch(`${RETELL_API_BASE}/get-phone-number/${phone_number}`, {
          method: 'GET',
          headers,
        });
        break;
      }
      
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Retell API error (${response.status}):`, errorText);
      throw new Error(`Retell API returned error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { 
      headers: corsHeaders,
      status: response.status,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack,
      }),
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
});
