
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Retell } from 'npm:retell-client-js-sdk@2.0.5'
import { corsHeaders } from '../_shared/cors.ts'

const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY')

const client = new Retell({
  apiKey: RETELL_API_KEY as string,
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()

    if (!action) {
      throw new Error('Missing action parameter')
    }

    console.log(`Processing action: ${action}`)

    switch (action) {
      case 'listPhoneNumbers': {
        console.log('Fetching phone numbers from Retell API')
        const phoneNumbersResponse = await client.phoneNumber.list()
        console.log('Phone numbers fetched:', phoneNumbersResponse)
        return new Response(JSON.stringify(phoneNumbersResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'validatePhoneNumber': {
        const { phone_number } = params
        console.log('Validating phone number:', phone_number)
        const validationResponse = await client.phoneNumber.validate(phone_number)
        console.log('Phone number validation result:', validationResponse)
        return new Response(JSON.stringify(validationResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'createPhoneCall': {
        const { from_number, to_number } = params
        console.log('Creating phone call from:', from_number, 'to:', to_number)
        const createCallResponse = await client.phoneCall.create({
          from_number,
          to_number,
        })
        console.log('Phone call created successfully:', createCallResponse)
        return new Response(JSON.stringify(createCallResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error('Error in edge function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 400,
      }
    )
  }
})
