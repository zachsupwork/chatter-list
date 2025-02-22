
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { Retell } from "npm:retell-sdk@4.19.0";

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');

if (!RETELL_API_KEY) {
  console.error('RETELL_API_KEY is not set');
  throw new Error('RETELL_API_KEY is required');
}

const client = new Retell({
  apiKey: RETELL_API_KEY,
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`HTTP method ${req.method} is not supported.`);
    }

    console.log('Processing request...');
    const { action, ...params } = await req.json();
    console.log('Received action:', action, 'with params:', params);

    if (action === 'listPhoneNumbers') {
      console.log('Fetching phone numbers from Retell API...');
      const phoneNumbers = await client.phoneNumber.list();
      console.log('Successfully fetched phone numbers:', phoneNumbers);
      
      return new Response(JSON.stringify(phoneNumbers), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    }

    if (action === 'createPhoneCall') {
      console.log('Creating phone call with params:', params);
      const { from_number, to_number } = params;

      if (!from_number || !to_number) {
        throw new Error('Both from_number and to_number are required');
      }

      try {
        const call = await client.call.createPhoneCall({
          from_number,
          to_number,
        });
        
        console.log('Successfully created phone call:', call);
        return new Response(JSON.stringify(call), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 201,
        });
      } catch (error) {
        console.error('Error creating phone call:', error);
        return new Response(JSON.stringify({
          error: error.message || 'Error creating phone call'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        });
      }
    }

    if (action === 'getCall') {
      console.log('Fetching call details with params:', params);
      const { filter_criteria } = params;

      if (!filter_criteria?.call_id) {
        throw new Error('call_id is required in filter_criteria');
      }

      try {
        const call = await client.call.retrieve(filter_criteria.call_id);
        console.log('Successfully fetched call details:', call);
        
        return new Response(JSON.stringify(call), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        });
      } catch (error) {
        console.error('Error fetching call details:', error);
        return new Response(JSON.stringify({
          error: error.message || 'Error fetching call details'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 404,
        });
      }
    }

    throw new Error(`Unsupported action: ${action}`);
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred',
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: error.status || 400,
    });
  }
});
