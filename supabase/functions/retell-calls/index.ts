
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
    const { action, call_id, filter_criteria, limit = 50, from_number, to_number, agent_id } = await req.json()

    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is required')
    }

    let url = 'https://api.retellai.com/v2/'
    let method = 'POST'
    let body: any = {}

    switch (action) {
      case 'createWebCall':
        url += 'create-web-call'
        body = { agent_id }
        break
      case 'createPhoneCall':
        url += 'create-phone-call'
        body = { from_number, to_number }
        break
      case 'listAgents':
        url = 'https://api.retellai.com/list-agents'
        method = 'GET'
        break
      case 'get':
        url += `get-call/${call_id}`
        method = 'GET'
        break
      case 'listCalls':
      default:
        url += 'list-calls'
        body = {
          filter_criteria,
          limit,
          sort_order: 'descending'
        }
    }

    console.log('Making request to:', url)
    if (method !== 'GET') {
      console.log('With body:', JSON.stringify(body))
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      ...(method === 'GET' ? {} : { body: JSON.stringify(body) })
    })

    const responseData = await response.json()
    console.log('Raw response data:', responseData)

    if (!response.ok) {
      throw new Error(responseData.error?.message || `Failed to ${action}`)
    }

    // Transform response for listCalls action
    if (action === 'listCalls' || !action) {
      return new Response(
        JSON.stringify({ calls: responseData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For other actions, return the raw response
    return new Response(
      JSON.stringify(responseData),
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
