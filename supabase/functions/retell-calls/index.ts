
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RETELL_API_KEY = Deno.env.get("RETELL_API_KEY");
    if (!RETELL_API_KEY) {
      throw new Error("RETELL_API_KEY is not set");
    }

    const { action } = await req.json();
    console.log(`Processing ${action} request`);

    switch (action) {
      case 'listPhoneNumbers': {
        const response = await fetch("https://api.retellai.com/list-phone-numbers", {
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch phone numbers: ${response.statusText}`);
        }

        const phoneNumbers = await response.json();
        return new Response(
          JSON.stringify(phoneNumbers),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'createPhoneCall': {
        const { from_number, to_number } = await req.json();
        if (!from_number || !to_number) {
          throw new Error("Missing required parameters");
        }

        const response = await fetch("https://api.retellai.com/create-phone-call", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ from_number, to_number })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create phone call: ${response.status} - ${errorText}`);
        }

        const callData = await response.json();
        return new Response(
          JSON.stringify(callData),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
