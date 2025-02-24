
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RETELL_API_KEY } from "../../../src/lib/retell";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY') || 'key_bc69ed16c81fa347d618b4763cb7';

const createPhoneCall = async (fromNumber: string, toNumber: string) => {
  const apiUrl = "https://api.retellai.com/v2/create-phone-call";

  const requestBody = {
    from_number: fromNumber,
    to_number: toNumber,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RETELL_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to create phone call: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    console.error('Error creating phone call:', error);
    throw new Error('Error creating phone call through Retell API');
  }
};

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      action,
      call_id,
      limit = 50,
      from_number,
      to_number,
      area_code,
      nickname,
      phone_number,
      inbound_agent_id,
      outbound_agent_id,
      inbound_webhook_url,
      termination_uri,
      sip_trunk_auth_username,
      sip_trunk_auth_password,
    } = await req.json();

    switch (action) {

      case 'listCalls': {
        const response = await fetch('https://api.retellai.com/v2/list-calls', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ limit })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from Retell API:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Calls fetched successfully:', data);

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getCall': {
        if (!call_id) {
          throw new Error('call_id is required');
        }
        console.log('Fetching call details for ID:', call_id);
        const response = await fetch(`https://api.retellai.com/v2/get-call/${call_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from Retell API:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Call details fetched successfully:', data);
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'createPhoneCall': {
          if (!from_number || !to_number) {
            throw new Error('Both from_number and to_number are required');
          }

          const result = await createPhoneCall(from_number, to_number);

          return new Response(
            JSON.stringify({ success: true, call_id: result.call_id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
        
      case 'createPhoneNumber': {
        try {
          const response = await fetch('https://api.retellai.com/create-phone-number', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RETELL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              area_code: area_code,
              nickname: nickname || null,
              inbound_agent_id: inbound_agent_id || null,
              outbound_agent_id: outbound_agent_id || null,
              inbound_webhook_url: inbound_webhook_url || null,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            return new Response(JSON.stringify({ data: data }), { status: 200 });
          } else {
            return new Response(JSON.stringify({ error: data.message || 'Unknown error' }), { status: 400 });
          }
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      }
        
      case 'importPhoneNumber': {
        try {
          const response = await fetch('https://api.retellai.com/import-phone-number', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RETELL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone_number,
              termination_uri,
              sip_trunk_auth_username: sip_trunk_auth_username || null,
              sip_trunk_auth_password: sip_trunk_auth_password || null,
              inbound_agent_id: inbound_agent_id || null,
              outbound_agent_id: outbound_agent_id || null,
              nickname: nickname || null,
              inbound_webhook_url: inbound_webhook_url || null,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            return new Response(JSON.stringify({ data: data }), { status: 200 });
          } else {
            return new Response(JSON.stringify({ error: data.message || 'Unknown error' }), { status: 400 });
          }
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error in retell-calls function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
