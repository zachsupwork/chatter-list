
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
    const { action, call_id, filter_criteria, limit = 50, from_number, to_number, name, tasks, trigger_timestamp } = await req.json()

    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')
    if (!RETELL_API_KEY) {
      throw new Error('RETELL_API_KEY is required')
    }

    let url = 'https://api.retellai.com/v2/'
    let method = 'POST'
    let body: any = {}

    // First validate the phone number regardless of action type if it's provided
    if (from_number) {
      const validationResponse = await fetch(url + 'list-phone-numbers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        }
      })

      if (!validationResponse.ok) {
        throw new Error('Failed to validate phone number')
      }

      const phoneNumbers = await validationResponse.json()
      const isValidNumber = phoneNumbers.some(
        (phone: any) => phone.phone_number === from_number
      )

      if (!isValidNumber) {
        throw new Error('Must be a number purchased from or imported to Retell')
      }
    }

    // After validation, proceed with the requested action
    switch (action) {
      case 'createBatchCall':
        url += 'create-batch-call'
        body = { from_number, name, tasks }
        if (trigger_timestamp) {
          body.trigger_timestamp = trigger_timestamp
        }
        break
      case 'validatePhoneNumber':
        // Already validated above, just return success
        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      case 'createPhoneCall':
        url += 'create-phone-call'
        body = { from_number, to_number }
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response from Retell API:', errorText)
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error?.message || `Failed to ${action}`)
      } catch (e) {
        throw new Error(`Failed to ${action}: ${errorText || response.statusText}`)
      }
    }

    const responseData = await response.json()
    console.log('Raw response data:', responseData)

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
