
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

    const { action, filter_criteria } = await req.json()
    console.log('Processing action:', action)

    const headers = {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json'
    }

    let data;

    switch (action) {
      case 'listAgents':
        console.log('Fetching agents from Retell API...')
        const agentsResponse = await fetch('https://api.retellai.com/agents', {
          method: 'GET',
          headers
        });

        if (!agentsResponse.ok) {
          const errorText = await agentsResponse.text()
          console.error(`Retell API error (${agentsResponse.status}):`, errorText)
          throw new Error(`Retell API error: ${agentsResponse.status} ${errorText}`)
        }

        data = await agentsResponse.json()
        break;

      case 'listCalls':
        console.log('Fetching calls from Retell API...')
        let url = 'https://api.retellai.com/v2/list-calls'
        
        // If filter criteria is provided, add it to the request
        if (filter_criteria) {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ filter_criteria })
          });

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Retell API error (${response.status}):`, errorText)
            throw new Error(`Retell API error: ${response.status} ${errorText}`)
          }

          data = await response.json()
        } else {
          // If no filter criteria, just get all calls
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({})
          });

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Retell API error (${response.status}):`, errorText)
            throw new Error(`Retell API error: ${response.status} ${errorText}`)
          }

          data = await response.json()
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    console.log('Successfully fetched data:', data)

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
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
