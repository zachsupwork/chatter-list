
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action } = await req.json()
    console.log(`Processing action: ${action}`)

    if (action === 'getApiKey') {
      const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')
      
      if (!RETELL_API_KEY) {
        console.error('RETELL_API_KEY is not set in environment variables')
        throw new Error('API key not configured')
      }

      console.log('Successfully retrieved API key')
      return new Response(
        JSON.stringify({
          RETELL_API_KEY
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    throw new Error(`Unsupported action: ${action}`)
  } catch (error) {
    console.error('Error in retell-calls function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred processing the request' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
