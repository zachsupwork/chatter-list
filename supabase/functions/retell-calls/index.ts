
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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
      case 'listPhoneNumbers':
        try {
          const response = await fetch('https://api.retellai.com/v2/list-phone-numbers', {
            method: 'GET',
            headers: retellHeaders
          });

          if (!response.ok) {
            throw new Error(`Retell API error: ${response.status}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error listing phone numbers:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

      case 'createPhoneCall':
        try {
          const { from_number, to_number } = params;

          if (!from_number || !to_number) {
            return new Response(
              JSON.stringify({ error: 'Missing required parameters' }),
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create phone call');
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error creating phone call:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create batch call');
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), { headers: corsHeaders });
        } catch (error) {
          console.error('Error creating batch call:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

      case 'createWebCall':
        try {
          const { agent_id } = params;

          if (!agent_id) {
            return new Response(
              JSON.stringify({ error: 'Missing agent_id parameter' }),
              { status: 400, headers: corsHeaders }
            );
          }

          const response = await fetch('https://api.retellai.com/v2/create-web-call', {
            method: 'POST',
            headers: retellHeaders,
            body: JSON.stringify({
              agent_id
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create web call');
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), {
            headers: corsHeaders,
            status: 201 // Using 201 for successful creation
          });
        } catch (error) {
          console.error('Error creating web call:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
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
            throw new Error(`Retell API error: ${response.status}`);
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
