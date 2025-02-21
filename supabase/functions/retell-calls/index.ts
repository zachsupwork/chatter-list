
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const retellApiKey = Deno.env.get('RETELL_API_KEY');
    if (!retellApiKey) {
      throw new Error('Missing Retell API key');
    }

    console.log('Initializing Retell client...');
    const client = new Retell({
      apiKey: retellApiKey
    });

    console.log('Fetching calls and knowledge base data...');
    const [calls, knowledgeBases] = await Promise.all([
      client.call.list({}),
      client.knowledgeBase.list()
    ]);

    console.log('Retell API response - Calls:', calls);
    console.log('Retell API response - Knowledge Bases:', knowledgeBases);
    
    return new Response(JSON.stringify({
      calls,
      knowledgeBases
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in retell-calls function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
