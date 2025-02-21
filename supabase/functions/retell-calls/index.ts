
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Retell from "https://esm.sh/retell-sdk@4.19.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify API key is present
    const retellApiKey = Deno.env.get('RETELL_API_KEY');
    if (!retellApiKey) {
      console.error('RETELL_API_KEY is not set');
      throw new Error('Missing Retell API key configuration');
    }

    console.log('Initializing Retell client with API key...');
    const client = new Retell({
      apiKey: retellApiKey
    });

    console.log('Starting API calls...');
    
    try {
      const [calls, knowledgeBases] = await Promise.all([
        client.call.list({}),
        client.knowledgeBase.list()
      ]);

      console.log('Successfully fetched data:');
      console.log('- Calls count:', calls?.length || 0);
      console.log('- Knowledge Bases count:', knowledgeBases?.length || 0);

      return new Response(JSON.stringify({
        calls: calls || [],
        knowledgeBases: knowledgeBases || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (apiError) {
      console.error('Retell API Error:', apiError);
      throw new Error(`Retell API error: ${apiError.message}`);
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
