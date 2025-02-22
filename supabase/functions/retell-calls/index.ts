
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')!;
const RETELL_API_BASE = 'https://api.retellai.com/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the request payload
    const { action, ...params } = await req.json();

    // Validate API key exists
    if (!RETELL_API_KEY) {
      throw new Error('Missing RETELL_API_KEY environment variable');
    }

    let endpoint;
    let method;
    let body;

    switch (action) {
      case 'listCalls':
        endpoint = '/v2/list-calls';
        method = 'POST';
        body = {
          sort_order: params.sort_order || 'descending',
          limit: params.limit || 50,
          filter_criteria: params.filter_criteria || {}
        };
        break;

      case 'getCall':
        endpoint = `/v2/get-call/${params.call_id}`;
        method = 'GET';
        break;

      case 'createPhoneCall':
        endpoint = '/v2/create-phone-call';
        method = 'POST';
        body = {
          from_number: params.from_number,
          to_number: params.to_number,
          agent_id: params.agent_id,
          metadata: params.metadata,
        };
        break;

      case 'createBatchCall':
        endpoint = '/v2/create-batch-call';
        method = 'POST';
        body = {
          from_number: params.from_number,
          tasks: params.tasks,
          metadata: params.metadata,
        };
        break;

      case 'listPhoneNumbers':
        endpoint = '/v2/list-phone-numbers';
        method = 'GET';
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Construct full URL
    const url = `${RETELL_API_BASE}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST requests
    if (method === 'POST' && body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Make request to Retell API
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Retell API returned error ${response.status}: ${text}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  } catch (error) {
    console.error(`Error processing request:`, error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
