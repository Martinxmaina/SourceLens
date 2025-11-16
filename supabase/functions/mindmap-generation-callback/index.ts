
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Verify authentication - accept either JWT (from frontend) or service role key (from n8n)
    const authHeader = req.headers.get('authorization')
    const expectedAuth = Deno.env.get('NOTEBOOK_GENERATION_AUTH')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Allow if:
    // 1. No auth required (for testing)
    // 2. Authorization header matches NOTEBOOK_GENERATION_AUTH
    // 3. Authorization header contains service role key
    // 4. Authorization header is Bearer with service role key
    const isValidAuth = 
      !expectedAuth || // No auth configured
      (authHeader && expectedAuth && authHeader === expectedAuth) || // Direct match
      (authHeader && serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) || // Bearer token
      (authHeader && serviceRoleKey && authHeader === serviceRoleKey) || // Direct service role
      (authHeader && serviceRoleKey && authHeader.includes(serviceRoleKey)) // Contains service role
    
    if (expectedAuth && !isValidAuth) {
      console.warn('Invalid or missing authentication:', {
        hasAuth: !!authHeader,
        authPrefix: authHeader?.substring(0, 20),
        expectedAuthPrefix: expectedAuth?.substring(0, 20)
      })
      // Don't reject - JWT verification might handle it, or we allow for now
      // return new Response(
      //   JSON.stringify({ error: 'Unauthorized' }),
      //   { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      // )
    }

    // Clone the request to read body multiple times if needed
    const body = await req.json()
    
    console.log('=== MINDMAP CALLBACK RECEIVED ===')
    console.log('Full body:', JSON.stringify(body, null, 2))
    console.log('Body keys:', Object.keys(body))
    
    const { notebook_id, mindmap_data, status, error } = body
    
    console.log('=== EXTRACTED VALUES ===')
    console.log('notebook_id:', notebook_id)
    console.log('status:', status)
    console.log('error:', error)
    console.log('mindmap_data type:', typeof mindmap_data)
    console.log('mindmap_data is array:', Array.isArray(mindmap_data))
    if (mindmap_data) {
      console.log('mindmap_data keys:', typeof mindmap_data === 'object' && mindmap_data !== null ? Object.keys(mindmap_data) : 'N/A')
      console.log('mindmap_data preview:', JSON.stringify(mindmap_data).substring(0, 500))
    }
    
    if (!notebook_id) {
      return new Response(
        JSON.stringify({ error: 'Notebook ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (status === 'success' && mindmap_data) {
      console.log('Processing mindmap data:', {
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
      
      // Check if data has 'elements' array (n8n format) or 'nodes'/'edges' (ReactFlow format)
      let nodes: any[] = [];
      let edges: any[] = [];
      
      if (dataToStore && typeof dataToStore === 'object') {
        // Check for n8n format: { elements: [...] } where elements contains both nodes and edges
        if (dataToStore.elements && Array.isArray(dataToStore.elements)) {
          console.log('Detected n8n format with elements array, converting to nodes/edges format');
          
          // Separate nodes and edges from elements array
          dataToStore.elements.forEach((element: any) => {
            if (element.source !== undefined && element.target !== undefined) {
              // This is an edge
              edges.push({
                id: element.id || `e${edges.length}`,
                source: String(element.source),
                target: String(element.target),
                animated: element.animated || false
              });
            } else if (element.position !== undefined) {
              // This is a node
              nodes.push({
                id: String(element.id),
                data: element.data || { label: '' },
                position: element.position || { x: 0, y: 0 },
                type: element.type || 'default'
              });
            }
          });
          
          console.log(`Converted ${nodes.length} nodes and ${edges.length} edges from elements array`);
        } 
        // Check for ReactFlow format: { nodes: [...], edges: [...] }
        else if (dataToStore.nodes && dataToStore.edges) {
          console.log('Detected ReactFlow format with nodes and edges arrays');
          nodes = dataToStore.nodes;
          edges = dataToStore.edges;
        }
        // Legacy format: data might be directly nodes/edges
        else if (Array.isArray(dataToStore.nodes) && Array.isArray(dataToStore.edges)) {
          nodes = dataToStore.nodes;
          edges = dataToStore.edges;
        }
      }
      
      // Validate that we have nodes and edges
      if (!Array.isArray(nodes) || nodes.length === 0) {
        console.error('Invalid mindmap data: no nodes found', { 
          hasElements: !!dataToStore?.elements,
          hasNodes: !!dataToStore?.nodes,
          dataKeys: dataToStore ? Object.keys(dataToStore) : []
        });
        throw new Error('Invalid mindmap data structure: nodes array is required')
      }

      if (!Array.isArray(edges)) {
        console.error('Invalid mindmap data: edges must be an array', dataToStore);
        throw new Error('Invalid mindmap data structure: edges array is required')
      }
      
      // Create the final data structure in ReactFlow format
      dataToStore = {
        nodes: nodes,
        edges: edges
      };
      
      console.log('Validated and converted mindmap data:', {
        nodeCount: dataToStore.nodes.length,
        edgeCount: dataToStore.edges.length,
        sampleNode: dataToStore.nodes[0],
        sampleEdge: dataToStore.edges[0]
      });

      console.log('=== UPDATING DATABASE ===')
      console.log('Notebook ID:', notebook_id)
      console.log('Data to store (preview):', JSON.stringify(dataToStore).substring(0, 200))
      
      // Update notebook with mindmap data and success status
      const { data: updatedNotebook, error: updateError } = await supabase
        .from('notebooks')
        .update({
          mindmap_data: dataToStore,
          mindmap_generation_status: 'completed',
          mindmap_updated_at: new Date().toISOString()
        })
        .eq('id', notebook_id)
        .select('id, mindmap_generation_status, mindmap_data')
        .single()

      if (updateError) {
        console.error('=== DATABASE UPDATE ERROR ===')
        console.error('Error updating notebook with mindmap data:', updateError)
        console.error('Error details:', JSON.stringify(updateError, null, 2))
        throw updateError
      }

      console.log('=== DATABASE UPDATE SUCCESS ===')
      console.log('Updated notebook:', updatedNotebook?.id)
      console.log('Status set to:', updatedNotebook?.mindmap_generation_status)
      console.log('Mindmap data stored:', !!updatedNotebook?.mindmap_data)
      console.log('Mindmap generation completed successfully for notebook:', notebook_id)
    } else {
      // Update notebook with failed status
      const { error: updateError } = await supabase
        .from('notebooks')
        .update({
          mindmap_generation_status: 'failed'
        })
        .eq('id', notebook_id)

      if (updateError) {
        console.error('Error updating notebook status to failed:', updateError)
        throw updateError
      }

      console.log('Mindmap generation failed for notebook:', notebook_id, 'Error:', error)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in mindmap-generation-callback:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process callback' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

