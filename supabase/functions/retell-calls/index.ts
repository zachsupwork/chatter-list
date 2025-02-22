
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

const RETELL_API_BASE = 'https://api.retellai.com/v2';

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

    // Get the request body
    const { action, ...params } = await req.json();
    console.log(`Processing ${action} request with params:`, params);

    let response;
    let endpoint;
    let method;
    let body;

    switch (action) {
      case 'getApiKey':
        return new Response(
          JSON.stringify({ RETELL_API_KEY }),
          { headers: corsHeaders }
        );

      case 'listCalls':
        endpoint = '/calls';  // Updated endpoint
        method = 'GET';
        // Convert params to URL search params
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);
        if (params.pagination_key) searchParams.append('pagination_key', params.pagination_key);
        endpoint = `${endpoint}?${searchParams.toString()}`;
        break;

      case 'getCall':
        endpoint = `/calls/${params.call_id}`; // Updated endpoint
        method = 'GET';
        break;

      case 'listPhoneNumbers':
        endpoint = '/phone-numbers'; // Updated endpoint
        method = 'GET';
        break;

      case 'getPhoneNumber':
        endpoint = `/phone-numbers/${params.phone_number}`; // Updated endpoint
        method = 'GET';
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    console.log(`Making ${method} request to ${RETELL_API_BASE}${endpoint}`);
    
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    response = await fetch(`${RETELL_API_BASE}${endpoint}`, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Retell API error (${response.status}):`, errorText);
      throw new Error(`Retell API returned error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Retell API response:', data);
    
    return new Response(
      JSON.stringify(data),
      { headers: corsHeaders }
    );

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
