
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
      case 'getApiKey': {
        // Return the API key for client-side use
        return new Response(
          JSON.stringify({ RETELL_API_KEY }),
          { headers: { ...corsHeaders }, status: 200 }
        );
      }

      case 'listPhoneNumbers': {
        console.log('Fetching phone numbers from Retell API...');
        response = await fetch(`${RETELL_API_BASE}/phone-numbers`, {
          method: 'GET',
          headers,
        });
        break;
      }

      case 'listCalls': {
        const { filter_criteria, sort_order = 'descending', limit = 50, pagination_key } = params;
        const url = new URL(`${RETELL_API_BASE}/list-calls`);
        
        // Add query parameters
        const requestBody: any = {
          sort_order,
          limit
        };

        if (pagination_key) {
          requestBody.pagination_key = pagination_key;
        }

        if (filter_criteria) {
          requestBody.filter_criteria = filter_criteria;
        }

        console.log('Fetching calls with params:', requestBody);
        response = await fetch(url.toString(), {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
        break;
      }

      case 'listAgents': {
        console.log('Fetching agents from Retell API...');
        response = await fetch(`${RETELL_API_BASE}/list-agents`, {
          method: 'GET',
          headers,
        });
        break;
      }

      case 'validatePhoneNumber': {
        const { from_number } = params;
        if (!from_number) {
          throw new Error('Missing required parameter: from_number');
        }

        // First, check if the number exists in their phone numbers
        const numbersResponse = await fetch(`${RETELL_API_BASE}/phone-numbers`, {
          method: 'GET',
          headers,
        });
        
        if (!numbersResponse.ok) {
          throw new Error(`Failed to validate phone number: ${await numbersResponse.text()}`);
        }

        const numbers = await numbersResponse.json();
        const isValid = numbers.some(n => n.phone_number === from_number);
        
        if (!isValid) {
          throw new Error('The provided from_number is not associated with your Retell account');
        }

        return new Response(JSON.stringify({ valid: true }), {
          headers: { ...corsHeaders },
          status: 200,
        });
      }

      case 'createPhoneCall': {
        const { from_number, to_number } = params;
        if (!from_number || !to_number) {
          throw new Error('Missing required parameters: from_number and/or to_number');
        }

        console.log('Creating phone call:', { from_number, to_number });
        response = await fetch(`${RETELL_API_BASE}/phone-calls`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ from_number, to_number }),
        });
        break;
      }

      case 'createBatchCall': {
        const { from_number, tasks, name, trigger_timestamp } = params;
        if (!from_number || !tasks || !Array.isArray(tasks)) {
          throw new Error('Invalid batch call parameters');
        }

        const payload: any = {
          from_number,
          tasks,
          name,
        };

        if (trigger_timestamp) {
          payload.trigger_timestamp = trigger_timestamp;
        }

        console.log('Creating batch call:', payload);
        response = await fetch(`${RETELL_API_BASE}/batch-call`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
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
