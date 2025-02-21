
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, call_id, filter_criteria, limit = 50 } = await req.json()

    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is required')
    }

    let url = 'https://api.retellai.com/v2/'
    let body = {}

    if (action === 'get' && call_id) {
      url += `get-call/${call_id}`
    } else {
      url += 'list-calls'
      body = {
        filter_criteria,
        limit,
        sort_order: 'descending'
      }
    }

    console.log('Making request to:', url)
    console.log('With body:', JSON.stringify(body))

    const response = await fetch(url, {
      method: action === 'get' ? 'GET' : 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      ...(action === 'get' ? {} : { body: JSON.stringify(body) })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Failed to ${action} call`)
    }

    const data = await response.json()
    console.log('Response data:', data)

    return new Response(
      JSON.stringify(action === 'get' ? data : { calls: Array.isArray(data) ? data : [data] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
