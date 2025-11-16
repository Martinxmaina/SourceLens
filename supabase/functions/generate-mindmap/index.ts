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

  let notebookId: string | undefined
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  let supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()
    notebookId = body.notebookId
    
    if (!notebookId) {
      return new Response(
        JSON.stringify({ error: 'Notebook ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update notebook status to indicate mindmap generation has started
    const { error: updateError } = await supabase
      .from('notebooks')
      .update({
        mindmap_generation_status: 'generating'
      })
      .eq('id', notebookId)

    if (updateError) {
      console.error('Error updating notebook status:', updateError)
      throw updateError
    }

    // Fetch all context for the notebook
    console.log('Fetching context for notebook:', notebookId)

    // Fetch chat messages
    const { data: messages, error: messagesError } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .eq('session_id', notebookId)
      .order('id', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      throw messagesError
    }

    // Fetch sources
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('id, title, type, content, summary, display_name')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false })

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError)
      throw sourcesError
    }

    // Fetch notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, content, source_type')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false })

    if (notesError) {
      console.error('Error fetching notes:', notesError)
      throw notesError
    }

    // Get notebook metadata
    const { data: notebook, error: notebookError } = await supabase
      .from('notebooks')
      .select('title, description')
      .eq('id', notebookId)
      .single()

    if (notebookError) {
      console.error('Error fetching notebook:', notebookError)
      throw notebookError
    }

    // Structure context for n8n
    const context = {
      notebook: {
        id: notebookId,
        title: notebook.title,
        description: notebook.description
      },
      messages: messages || [],
      sources: sources || [],
      notes: notes || []
    }

    console.log('Context prepared:', {
      messageCount: messages?.length || 0,
      sourceCount: sources?.length || 0,
      noteCount: notes?.length || 0
    })

    // Get mindmap generation webhook URL and auth from secrets
    const mindmapWebhookUrl = Deno.env.get('MINDMAP_GENERATION_WEBHOOK_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!mindmapWebhookUrl || !authHeader) {
      console.error('Missing mindmap generation webhook URL or auth')
      
      // Update status to failed before returning error
      await supabase
        .from('notebooks')
        .update({ mindmap_generation_status: 'failed' })
        .eq('id', notebookId)
      
      return new Response(
        JSON.stringify({ error: 'Mindmap generation service not configured. Please configure MINDMAP_GENERATION_WEBHOOK_URL secret in Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting mindmap generation for notebook:', notebookId)

    // Start the background task without awaiting
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          // Call the external mindmap generation webhook
          const callbackUrl = `${supabaseUrl}/functions/v1/mindmap-generation-callback`
          const payload = {
            notebook_id: notebookId,
            context: context,
            callback_url: callbackUrl,
            callback_auth: authHeader // Send auth header so n8n can use it
          }
          
          console.log('=== CALLING N8N WEBHOOK ===')
          console.log('Webhook URL:', mindmapWebhookUrl)
          console.log('Callback URL:', callbackUrl)
          console.log('Notebook ID:', notebookId)
          console.log('Context summary:', {
            messageCount: context.messages?.length || 0,
            sourceCount: context.sources?.length || 0,
            noteCount: context.notes?.length || 0
          })
          
          const mindmapResponse = await fetch(mindmapWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify(payload)
          })

          if (!mindmapResponse.ok) {
            const errorText = await mindmapResponse.text()
            console.error('=== N8N WEBHOOK FAILED ===')
            console.error('Status:', mindmapResponse.status)
            console.error('Error:', errorText)
            
            // Update status to failed
            await supabase
              .from('notebooks')
              .update({ mindmap_generation_status: 'failed' })
              .eq('id', notebookId)
          } else {
            const responseText = await mindmapResponse.text()
            console.log('=== N8N WEBHOOK SUCCESS ===')
            console.log('Response status:', mindmapResponse.status)
            console.log('Response length:', responseText.length)
            console.log('Response preview:', responseText.substring(0, 2000))
            
                // Check if n8n returned mindmap data directly in the response
                try {
                  let responseData: any;
                  
                  // Try to parse as JSON
                  try {
                    responseData = JSON.parse(responseText)
                  } catch (e) {
                    // If not JSON, check if it's already an object
                    responseData = responseText
                  }
                  
                  console.log('Parsed response data type:', typeof responseData)
                  console.log('Is array:', Array.isArray(responseData))
                  if (typeof responseData === 'object' && responseData !== null) {
                    console.log('Response data keys:', Object.keys(responseData))
                  }
                  
                  // Function to convert hierarchical tree to nodes/edges
                  const convertTreeToNodesEdges = (root: any, parentId: string | null = null, edgeCounter: number = 0): { nodes: any[], edges: any[], edgeCounter: number } => {
                    const nodes: any[] = [];
                    const edges: any[] = [];
                    let counter = edgeCounter;
                    
                    // Create node
                    const nodeId = String(root.id);
                    nodes.push({
                      id: nodeId,
                      data: {
                        label: root.label || 'Node',
                        description: root.description || '',
                        isRoot: parentId === null,
                      },
                      position: { x: 0, y: 0 }, // Will be calculated by frontend
                      type: 'notebooklm'
                    });
                    
                    // Create edge from parent if exists
                    if (parentId !== null) {
                      edges.push({
                        id: `e${counter}`,
                        source: String(parentId),
                        target: nodeId,
                        animated: true
                      });
                      counter++;
                    }
                    
                    // Process children recursively
                    if (root.children && Array.isArray(root.children)) {
                      root.children.forEach((child: any) => {
                        const result = convertTreeToNodesEdges(child, nodeId, counter);
                        nodes.push(...result.nodes);
                        edges.push(...result.edges);
                        counter = result.edgeCounter;
                      });
                    }
                    
                    return { nodes, edges, edgeCounter: counter };
                  };
                  
                  // Check for different formats
                  let rootNode: any = null;
                  let nodesArray: any[] | null = null;
                  
                  // Format 1: Hierarchical tree: [{ output: { root: {...} } }]
                  if (Array.isArray(responseData) && responseData.length > 0) {
                    // Check for output.root structure
                    if (responseData[0]?.output?.root) {
                      rootNode = responseData[0].output.root;
                      console.log('=== N8N RETURNED HIERARCHICAL TREE FORMAT ===');
                    } else if (responseData[0]?.root) {
                      rootNode = responseData[0].root;
                      console.log('=== N8N RETURNED ROOT FORMAT ===');
                    } 
                    // Format 2: Array of nodes with parentId: [{ id: "0", parentId: null, ... }, ...]
                    else if (Array.isArray(responseData[0]) && responseData[0].length > 0) {
                      // Double nested array: [[{ nodes }]]
                      nodesArray = responseData[0];
                      console.log('=== N8N RETURNED NODES ARRAY FORMAT (nested) ===');
                    } else if (responseData[0]?.id !== undefined && responseData[0]?.data) {
                      // Single array of nodes: [{ id, data, parentId }]
                      nodesArray = responseData;
                      console.log('=== N8N RETURNED NODES ARRAY FORMAT ===');
                    } else if (responseData[0]?.elements) {
                      // Old elements format
                      rootNode = null;
                    }
                  } else if (responseData?.output?.root) {
                    rootNode = responseData.output.root;
                    console.log('=== N8N RETURNED HIERARCHICAL TREE FORMAT ===');
                  } else if (responseData?.root) {
                    rootNode = responseData.root;
                    console.log('=== N8N RETURNED ROOT FORMAT ===');
                  } else if (Array.isArray(responseData) && responseData.length > 0 && responseData[0]?.id !== undefined) {
                    // Direct array of nodes
                    nodesArray = responseData;
                    console.log('=== N8N RETURNED DIRECT NODES ARRAY FORMAT ===');
                  } else if (responseData?.elements) {
                    // Old elements format
                    rootNode = null;
                  }
                  
                  // Handle nodes array format (with parentId)
                  if (nodesArray && Array.isArray(nodesArray)) {
                    console.log(`Converting ${nodesArray.length} nodes with parentId to nodes/edges format`);
                    
                    const nodes: any[] = [];
                    const edges: any[] = [];
                    let edgeCounter = 0;
                    
                    nodesArray.forEach((node: any) => {
                      if (!node || !node.id) return;
                      
                      // Create node
                      const nodeId = String(node.id);
                      const isRoot = !node.parentId || node.parentId === null || node.parentId === undefined;
                      
                      nodes.push({
                        id: nodeId,
                        data: {
                          label: node.data?.label || node.label || 'Node',
                          description: node.data?.description || node.description || '',
                          isRoot: isRoot,
                        },
                        position: node.position || { x: 0, y: 0 },
                        type: 'notebooklm'
                      });
                      
                      // Create edge if has parent
                      if (node.parentId !== null && node.parentId !== undefined) {
                        edges.push({
                          id: `e${edgeCounter}`,
                          source: String(node.parentId),
                          target: nodeId,
                          animated: true
                        });
                        edgeCounter++;
                      }
                    });
                    
                    console.log(`Converted ${nodes.length} nodes and ${edges.length} edges from nodes array`);
                    
                    // Update database directly
                    const { error: updateError } = await supabase
                      .from('notebooks')
                      .update({
                        mindmap_data: { nodes, edges },
                        mindmap_generation_status: 'completed',
                        mindmap_updated_at: new Date().toISOString()
                      })
                      .eq('id', notebookId);
                    
                    if (updateError) {
                      console.error('Error updating notebook with mindmap data:', updateError);
                    } else {
                      console.log('Mindmap data stored successfully in database');
                    }
                  }
                  // Handle hierarchical tree format
                  else if (rootNode) {
                    console.log('Converting hierarchical tree to nodes/edges format');
                    const { nodes, edges } = convertTreeToNodesEdges(rootNode);
                    console.log(`Converted ${nodes.length} nodes and ${edges.length} edges from tree structure`);
                    
                    // Update database directly
                    const { error: updateError } = await supabase
                      .from('notebooks')
                      .update({
                        mindmap_data: { nodes, edges },
                        mindmap_generation_status: 'completed',
                        mindmap_updated_at: new Date().toISOString()
                      })
                      .eq('id', notebookId);
                    
                    if (updateError) {
                      console.error('Error updating notebook with mindmap data:', updateError);
                    } else {
                      console.log('Mindmap data stored successfully in database');
                    }
                  } else {
                    // Fallback to old elements format
                    let mindmapData = responseData.mindmap_data || responseData;
                    
                    // Handle array-wrapped data
                    if (Array.isArray(mindmapData) && mindmapData.length > 0) {
                      mindmapData = mindmapData[0];
                    }
                    
                    if (mindmapData && typeof mindmapData === 'object') {
                      // Check for n8n format: { elements: [...] }
                      if (mindmapData.elements && Array.isArray(mindmapData.elements)) {
                        console.log('Converting elements array to nodes/edges format');
                        let nodes: any[] = [];
                        let edges: any[] = [];
                        
                        mindmapData.elements.forEach((element: any) => {
                          if (element.source !== undefined && element.target !== undefined) {
                            // Edge
                            edges.push({
                              id: element.id || `e${edges.length}`,
                              source: String(element.source),
                              target: String(element.target),
                              animated: element.animated || false
                            });
                          } else if (element.position !== undefined) {
                            // Node
                            nodes.push({
                              id: String(element.id),
                              data: element.data || { label: '' },
                              position: element.position || { x: 0, y: 0 },
                              type: element.type || 'default'
                            });
                          }
                        });
                        
                        console.log(`Converted ${nodes.length} nodes and ${edges.length} edges`);
                        
                        // Update database directly
                        const { error: updateError } = await supabase
                          .from('notebooks')
                          .update({
                            mindmap_data: { nodes, edges },
                            mindmap_generation_status: 'completed',
                            mindmap_updated_at: new Date().toISOString()
                          })
                          .eq('id', notebookId);
                        
                        if (updateError) {
                          console.error('Error updating notebook with mindmap data:', updateError);
                        } else {
                          console.log('Mindmap data stored successfully in database');
                        }
                      } else if (mindmapData.nodes && mindmapData.edges) {
                        // Already in ReactFlow format
                        const { error: updateError } = await supabase
                          .from('notebooks')
                          .update({
                            mindmap_data: mindmapData,
                            mindmap_generation_status: 'completed',
                            mindmap_updated_at: new Date().toISOString()
                          })
                          .eq('id', notebookId);
                        
                        if (updateError) {
                          console.error('Error updating notebook:', updateError);
                        } else {
                          console.log('Mindmap data stored successfully');
                        }
                      }
                    } else {
                      console.log('n8n did not return mindmap_data in response')
                      console.log('n8n should call callback URL separately:', callbackUrl)
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing response:', parseError)
                  console.log('n8n should call callback URL separately:', callbackUrl)
                }
            
            console.log('Mindmap generation webhook called successfully for notebook:', notebookId)
          }
        } catch (error) {
          console.error('Background mindmap generation error:', error)
          
          // Update status to failed
          await supabase
            .from('notebooks')
            .update({ mindmap_generation_status: 'failed' })
            .eq('id', notebookId)
        }
      })()
    )

    // Return immediately with success status
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mindmap generation started',
        status: 'generating'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-mindmap:', error)
    
    // Try to update status to failed if we have notebookId
    if (notebookId) {
      try {
        await supabase
          .from('notebooks')
          .update({ mindmap_generation_status: 'failed' })
          .eq('id', notebookId)
      } catch (updateError) {
        console.error('Failed to update status on error:', updateError)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to start mindmap generation' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

