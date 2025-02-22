
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Define CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action } = await req.json()

    switch (action) {
      case 'getApiKey':
        return new Response(
          JSON.stringify({ RETELL_API_KEY }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'listAgents':
        const response = await fetch("https://api.retellai.com/list-agents", {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json()
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'createWebCall':
        const { agent_id } = await req.json();
        const webCallResponse = await fetch("https://api.retellai.com/v2/create-web-call", {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${RETELL_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ agent_id })
        });
        
        const webCallData = await webCallResponse.json();
        return new Response(
          JSON.stringify(webCallData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in retell-calls function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

