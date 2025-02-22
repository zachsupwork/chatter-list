
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
      case 'createWebCall':
        endpoint = '/create-web-call';
        method = 'POST';
        body = {
          agent_id: params.agent_id,
          metadata: params.metadata,
          retell_llm_dynamic_variables: params.retell_llm_dynamic_variables,
        };
        break;

      case 'createPhoneCall':
        endpoint = '/create-phone-call';
        method = 'POST';
        body = {
          from_number: params.from_number,
          to_number: params.to_number,
          metadata: params.metadata,
          retell_llm_dynamic_variables: params.retell_llm_dynamic_variables,
        };
        break;

      case 'createBatchCall':
        endpoint = '/create-batch-call';
        method = 'POST';
        body = {
          from_number: params.from_number,
          tasks: params.tasks,
          metadata: params.metadata,
          retell_llm_dynamic_variables: params.retell_llm_dynamic_variables,
        };
        break;

      case 'listCalls':
        endpoint = '/calls';
        method = 'GET';
        if (params.filter_criteria || params.sort_order || params.limit || params.pagination_key) {
          const searchParams = new URLSearchParams();
          if (params.filter_criteria) {
            Object.entries(params.filter_criteria).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v.toString()));
              } else if (value !== undefined) {
                searchParams.append(key, value.toString());
              }
            });
          }
          if (params.sort_order) searchParams.append('sort_order', params.sort_order);
          if (params.limit) searchParams.append('limit', params.limit.toString());
          if (params.pagination_key) searchParams.append('pagination_key', params.pagination_key);
          endpoint = `${endpoint}?${searchParams.toString()}`;
        }
        break;

      case 'getCall':
        endpoint = `/calls/${params.call_id}`;
        method = 'GET';
        break;

      case 'listPhoneNumbers':
        endpoint = '/phone-numbers';
        method = 'GET';
        break;

      case 'getPhoneNumber':
        endpoint = `/phone-numbers/${params.phone_number}`;
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
