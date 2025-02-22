
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the action from the request body
    const { action, ...params } = await req.json();
    console.log(`Processing ${action} request with params:`, params);

    // Get the API key first
    const apiKey = Deno.env.get('RETELL_API_KEY');
    if (!apiKey) {
      console.error('RETELL_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key configuration error' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Common headers for Retell API calls
    const retellHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    switch (action) {
      case 'getApiKey':
        return new Response(
          JSON.stringify({ RETELL_API_KEY: apiKey }),
          { headers: corsHeaders }
        );

      case 'listPhoneNumbers':
        try {
          const response = await fetch('https://api.retellai.com/v2/list-phone-numbers', {
            method: 'GET',
            headers: retellHeaders
          });

          if (!response.ok) {
            throw new Error(`Retell API error: ${response.status} - ${await response.text()}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error listing phone numbers:', error);
          return new Response(
            JSON.stringify({ error: `Error listing phone numbers: ${error.message}` }),
            { status: 500, headers: corsHeaders }
          );
        }

      case 'createPhoneCall':
        try {
          const { from_number, to_number } = params;

          if (!from_number || !to_number) {
            return new Response(
              JSON.stringify({ error: 'Missing required parameters: from_number and/or to_number' }),
              { status: 400, headers: corsHeaders }
            );
          }

          const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
            method: 'POST',
            headers: retellHeaders,
            body: JSON.stringify({
              from_number,
              to_number
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Retell API error response:', errorText);
            throw new Error(`Retell API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { 
            status: 201,
            headers: corsHeaders 
          });
        } catch (error) {
          console.error('Error creating phone call:', error);
          return new Response(
            JSON.stringify({ error: `Error creating phone call: ${error.message}` }),
            { status: 500, headers: corsHeaders }
          );
        }

      case 'createBatchCall':
        try {
          const { from_number, tasks } = params;

          if (!from_number || !tasks || !Array.isArray(tasks)) {
            return new Response(
              JSON.stringify({ error: 'Invalid batch call parameters' }),
              { status: 400, headers: corsHeaders }
            );
          }

          const response = await fetch('https://api.retellai.com/v2/create-batch-call', {
            method: 'POST',
            headers: retellHeaders,
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
          return new Response(JSON.stringify(data), { 
            status: 201,
            headers: corsHeaders 
          });
        } catch (error) {
          console.error('Error creating batch call:', error);
          return new Response(
            JSON.stringify({ error: `Error creating batch call: ${error.message}` }),
            { status: 500, headers: corsHeaders }
          );
        }

      case 'listCalls':
        try {
          const response = await fetch('https://api.retellai.com/v2/list-calls', {
            method: 'GET',
            headers: retellHeaders
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Retell API error response:', errorText);
            throw new Error(`Retell API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error listing calls:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

      case 'getCall':
        try {
          const { call_id } = params;
          if (!call_id) {
            return new Response(
              JSON.stringify({ error: 'Missing call_id parameter' }),
              { status: 400, headers: corsHeaders }
            );
          }

          const response = await fetch(`https://api.retellai.com/v2/get-call/${call_id}`, {
            method: 'GET',
            headers: retellHeaders
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Retell API error response:', errorText);
            throw new Error(`Retell API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error getting call:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported action: ${action}` }),
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
