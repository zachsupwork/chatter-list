
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
    const { action, call_id, filter_criteria, limit = 50, from_number, to_number, agent_id, name, tasks, trigger_timestamp } = await req.json()

    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is required')
    }

    let url = 'https://api.retellai.com/v2/'
    let method = 'POST'
    let body: any = {}

    switch (action) {
      case 'createBatchCall':
        url += 'create-batch-call'
        body = { from_number, name, tasks }
        if (trigger_timestamp) {
          body.trigger_timestamp = trigger_timestamp
        }
        break
      case 'validatePhoneNumber':
        // Check if number is registered with Retell
        url += 'list-phone-numbers'
        method = 'GET'
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

    // For validatePhoneNumber action, check if the phone number exists in the response
    if (action === 'validatePhoneNumber') {
      const phoneNumbers = responseData
      const isValidNumber = phoneNumbers.some(
        (phone: any) => phone.phone_number === from_number
      )
      if (!isValidNumber) {
        throw new Error('Must be a number purchased from or imported to Retell')
      }
      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!response.ok) {
      throw new Error(responseData.error?.message || `Failed to ${action}`)
    }

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
