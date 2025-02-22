
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

const RETELL_API_BASE = 'https://api.retellai.com';

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
        endpoint = '/list-calls';
        method = 'POST';
        body = {
          filter_criteria: params.filter_criteria || {},
          sort_order: params.sort_order || 'descending',
          limit: params.limit || 50,
          pagination_key: params.pagination_key,
        };
        break;

      case 'getCall':
        endpoint = `/get-call/${params.call_id}`;
        method = 'GET';
        break;

      case 'listPhoneNumbers':
        endpoint = '/list-phone-numbers';
        method = 'GET';
        break;

      case 'getPhoneNumber':
        endpoint = `/get-phone-number/${params.phone_number}`;
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
