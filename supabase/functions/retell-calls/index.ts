
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY not found in environment variables')
    }

    const { action } = await req.json()
    console.log('Processing action:', action)

    if (action === 'listAgents') {
      console.log('Fetching agents from Retell API...')
      
      try {
        const response = await fetch('https://api.retellai.com/v2/list-agents', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Retell API error (${response.status}):`, errorText)
          throw new Error(`Retell API error: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        console.log('Successfully fetched agents:', data)

        return new Response(
          JSON.stringify(data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      } catch (error) {
        console.error('Error calling Retell API:', error)
        throw error
      }
    }

    throw new Error(`Unknown action: ${action}`)
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
