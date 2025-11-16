// @ts-ignore - Deno URL imports are valid at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno URL imports are valid at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Test mindmap function called with:', body)
    
    const { notebook_id, mindmap_data } = body
    
    if (!notebook_id) {
      return new Response(
        JSON.stringify({ error: 'Notebook ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!mindmap_data) {
      return new Response(
        JSON.stringify({ error: 'Mindmap data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Processing test mindmap data:', {
      type: typeof mindmap_data,
      isArray: Array.isArray(mindmap_data),
      keys: typeof mindmap_data === 'object' && mindmap_data !== null ? Object.keys(mindmap_data) : []
    });
    
    // Handle array-wrapped data
    let dataToStore = mindmap_data;
    if (Array.isArray(mindmap_data) && mindmap_data.length > 0) {
      console.log('Data is wrapped in array, extracting first element');
      dataToStore = mindmap_data[0];
    }
    
    // Validate mindmap structure (should have nodes and edges)
    if (!dataToStore || typeof dataToStore !== 'object') {
      console.error('Invalid mindmap data: not an object', dataToStore);
      return new Response(
        JSON.stringify({ error: 'Invalid mindmap data structure: must be an object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!dataToStore.nodes || !Array.isArray(dataToStore.nodes)) {
      console.error('Invalid mindmap data: missing or invalid nodes array', dataToStore);
      return new Response(
        JSON.stringify({ error: 'Invalid mindmap data structure: nodes array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!dataToStore.edges || !Array.isArray(dataToStore.edges)) {
      console.error('Invalid mindmap data: missing or invalid edges array', dataToStore);
      return new Response(
        JSON.stringify({ error: 'Invalid mindmap data structure: edges array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Validated mindmap data:', {
      nodeCount: dataToStore.nodes.length,
      edgeCount: dataToStore.edges.length
    });

    // Update notebook with mindmap data and success status
    const { error: updateError } = await supabase
      .from('notebooks')
      .update({
        mindmap_data: dataToStore,
        mindmap_generation_status: 'completed',
        mindmap_updated_at: new Date().toISOString()
      })
      .eq('id', notebook_id)

    if (updateError) {
      console.error('Error updating notebook with mindmap data:', updateError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update notebook',
          details: updateError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Test mindmap data stored successfully for notebook:', notebook_id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mindmap data stored successfully',
        nodeCount: dataToStore.nodes.length,
        edgeCount: dataToStore.edges.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in test-mindmap:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process test mindmap data' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

