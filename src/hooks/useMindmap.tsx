
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MindmapData {
  nodes: Array<{
    id: string;
    data: {
      label: string;
      [key: string]: any;
    };
    position: {
      x: number;
      y: number;
    };
    type?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    [key: string]: any;
  }>;
}

export const useMindmap = (notebookId?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up realtime subscription for notebook updates
  useEffect(() => {
    if (!notebookId) return;

    const channel = supabase
      .channel('notebook-mindmap-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notebooks',
          filter: `id=eq.${notebookId}`
        },
        (payload) => {
          try {
            console.log('Notebook updated:', payload);
            const newData = payload.new;
            
            if (!newData || typeof newData !== 'object') {
              console.warn('Invalid payload data:', payload);
              return;
            }
            
            if (newData.mindmap_generation_status && typeof newData.mindmap_generation_status === 'string') {
              setGenerationStatus(newData.mindmap_generation_status);
              
              if (newData.mindmap_generation_status === 'completed' && newData.mindmap_data) {
                setIsGenerating(false);
                try {
                  let dataToSet: any = newData.mindmap_data;
                  
                  // Handle array-wrapped data
                  if (Array.isArray(dataToSet) && dataToSet.length > 0) {
                    console.log('[useMindmap] Realtime: Data is wrapped in array, extracting first element');
                    dataToSet = dataToSet[0];
                  }
                  
                  if (typeof dataToSet === 'object' && dataToSet !== null && !Array.isArray(dataToSet)) {
                    // Validate structure
                    if (dataToSet.nodes && dataToSet.edges) {
                      console.log('[useMindmap] Realtime: Setting mindmap data:', {
                        nodeCount: Array.isArray(dataToSet.nodes) ? dataToSet.nodes.length : 0,
                        edgeCount: Array.isArray(dataToSet.edges) ? dataToSet.edges.length : 0
                      });
                      setMindmapData(dataToSet as MindmapData);
                      toast({
                        title: "Mindmap Ready!",
                        description: "Your mindmap has been generated successfully!",
                      });
                    } else {
                      console.warn('[useMindmap] Realtime: Invalid data structure - missing nodes or edges');
                    }
                  }
                } catch (error) {
                  console.error('[useMindmap] Error setting mindmap data:', error);
                }
                
                // Invalidate queries to refresh the UI
                queryClient.invalidateQueries({ queryKey: ['notebooks'] });
              } else if (newData.mindmap_generation_status === 'failed') {
                setIsGenerating(false);
                toast({
                  title: "Generation Failed",
                  description: "Failed to generate mindmap. Please try again.",
                  variant: "destructive",
                });
              }
            }

            // Update mindmap data if it changed (but status is not completed)
            if (newData.mindmap_data && typeof newData.mindmap_data === 'object' && newData.mindmap_data !== null) {
              try {
                let dataToSet: any = newData.mindmap_data;
                
                // Handle array-wrapped data
                if (Array.isArray(dataToSet) && dataToSet.length > 0) {
                  dataToSet = dataToSet[0];
                }
                
                if (typeof dataToSet === 'object' && dataToSet !== null && !Array.isArray(dataToSet)) {
                  if (dataToSet.nodes && dataToSet.edges) {
                    setMindmapData(dataToSet as MindmapData);
                  }
                }
              } catch (error) {
                console.error('[useMindmap] Error updating mindmap data:', error);
              }
            }
          } catch (error) {
            console.error('Error processing notebook update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notebookId, toast, queryClient]);

  // Function to manually refresh mindmap data
  const refreshMindmapData = useCallback(async () => {
    if (!notebookId) return;
    
    console.log('[useMindmap] Manually refreshing mindmap data...');
    
    try {
      const { data: notebooks, error } = await supabase
        .from('notebooks')
        .select('mindmap_data, mindmap_generation_status')
        .eq('id', notebookId)
        .single();

      if (error) {
        console.error('[useMindmap] Error fetching mindmap data:', error);
        return;
      }

      if (notebooks) {
        console.log('[useMindmap] Fetched notebook data:', {
          hasMindmapData: !!notebooks.mindmap_data,
          mindmapDataType: typeof notebooks.mindmap_data,
          isArray: Array.isArray(notebooks.mindmap_data),
          status: notebooks.mindmap_generation_status,
        });
        
        // Update status
        if (notebooks.mindmap_generation_status) {
          console.log('[useMindmap] Setting generation status:', notebooks.mindmap_generation_status);
          setGenerationStatus(notebooks.mindmap_generation_status);
          setIsGenerating(notebooks.mindmap_generation_status === 'generating');
        }
        
        if (notebooks.mindmap_data) {
          try {
            let dataToSet: any = notebooks.mindmap_data;
            
            // Handle array-wrapped data
            if (Array.isArray(dataToSet) && dataToSet.length > 0) {
              console.log('[useMindmap] Data is wrapped in array, extracting first element');
              dataToSet = dataToSet[0];
            }
            
            // Validate structure
            if (typeof dataToSet === 'object' && dataToSet !== null && !Array.isArray(dataToSet)) {
              // Check if it has nodes and edges (ReactFlow format)
              if (dataToSet.nodes && dataToSet.edges) {
                console.log('[useMindmap] Setting mindmap data:', {
                  nodeCount: Array.isArray(dataToSet.nodes) ? dataToSet.nodes.length : 0,
                  edgeCount: Array.isArray(dataToSet.edges) ? dataToSet.edges.length : 0
                });
                setMindmapData(dataToSet as MindmapData);
              } else {
                console.warn('[useMindmap] Data structure invalid - missing nodes or edges:', dataToSet);
              }
            }
          } catch (parseError) {
            console.error('[useMindmap] Error parsing mindmap data:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('[useMindmap] Error in refreshMindmapData:', error);
    }
  }, [notebookId]);

  // Fetch initial mindmap data from notebook
  useEffect(() => {
    refreshMindmapData();
  }, [refreshMindmapData]);

  // Auto-refresh if stuck in generating state for more than 5 minutes
  useEffect(() => {
    if (!notebookId || generationStatus !== 'generating') return;
    
    const timeout = setTimeout(() => {
      console.log('[useMindmap] Status stuck in generating for 5 minutes, refreshing...');
      refreshMindmapData();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearTimeout(timeout);
  }, [notebookId, generationStatus, refreshMindmapData]);

  // Timeout: Stop showing loading if no data received after 2 minutes
  // This allows users to retry if generation is stuck
  useEffect(() => {
    if (!notebookId || !isGenerating || generationStatus !== 'generating') return;
    
    const timeout = setTimeout(() => {
      console.log('[useMindmap] No data received after 2 minutes, stopping loading state to allow retry');
      setIsGenerating(false);
      setGenerationStatus('failed');
      
      // Reset database status to allow retry
      supabase
        .from('notebooks')
        .update({ mindmap_generation_status: 'failed' })
        .eq('id', notebookId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['notebooks'] });
        });
      
      toast({
        title: "Generation Timeout",
        description: "Mindmap generation is taking longer than expected. Click 'Generate Mindmap' to try again.",
        variant: "destructive",
      });
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearTimeout(timeout);
  }, [notebookId, isGenerating, generationStatus, toast, queryClient]);

  const generateMindmap = useMutation({
    mutationFn: async (notebookId: string) => {
      setIsGenerating(true);
      setGenerationStatus('generating');
      
      const { data, error } = await supabase.functions.invoke('generate-mindmap', {
        body: { notebookId }
      });

      if (error) {
        console.error('Error starting mindmap generation:', error);
        // Update status to failed on error
        setIsGenerating(false);
        setGenerationStatus('failed');
        
        // Extract error message from error object
        const errorMessage = error.message || error.toString() || 'Unknown error';
        throw new Error(errorMessage);
      }

      // Check if the response indicates an error
      if (data && data.error) {
        console.error('Mindmap generation error in response:', data.error);
        setIsGenerating(false);
        setGenerationStatus('failed');
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      return data;
    },
    onSuccess: (data, notebookId) => {
      console.log('Mindmap generation started successfully:', data);
      // Status will be updated via realtime subscription
    },
    onError: (error: any, variables: string) => {
      console.error('Mindmap generation failed to start:', error);
      setIsGenerating(false);
      setGenerationStatus('failed');
      
      // Also update the database status to failed
      const failedNotebookId = variables || notebookId;
      if (failedNotebookId) {
        supabase
          .from('notebooks')
          .update({ mindmap_generation_status: 'failed' })
          .eq('id', failedNotebookId)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['notebooks'] });
          });
      }
      
      // Provide more specific error messages
      let errorMessage = error.message || "Failed to start mindmap generation.";
      
      if (error.message?.includes('MINDMAP_GENERATION_WEBHOOK_URL') || 
          error.message?.includes('not configured')) {
        errorMessage = "Mindmap generation is not configured. Please set MINDMAP_GENERATION_WEBHOOK_URL secret in Supabase Dashboard → Edge Functions → Secrets.";
      } else if (error.message?.includes('Function not found') || 
                 error.message?.includes('404')) {
        errorMessage = "Edge function not found. Please deploy the generate-mindmap function.";
      } else if (error.message?.includes('network') || 
                 error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Failed to Start Generation",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Test function to directly set mindmap data (bypasses webhook)
  const testMindmap = useMutation({
    mutationFn: async ({ notebookId, mindmapData: testData }: { notebookId: string; mindmapData: MindmapData }) => {
      console.log('[useMindmap] Testing mindmap data directly:', {
        notebookId,
        nodeCount: testData.nodes?.length || 0,
        edgeCount: testData.edges?.length || 0
      });
      
      const { data, error } = await supabase.functions.invoke('test-mindmap', {
        body: {
          notebook_id: notebookId,
          mindmap_data: testData
        }
      });

      if (error) {
        console.error('[useMindmap] Error testing mindmap:', error);
        throw error;
      }

      if (data && data.error) {
        console.error('[useMindmap] Test mindmap error in response:', data.error);
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('[useMindmap] Test mindmap data stored successfully:', data);
      toast({
        title: "Test Mindmap Stored",
        description: "Test mindmap data has been stored successfully!",
      });
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
    onError: (error: any) => {
      console.error('[useMindmap] Failed to store test mindmap:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to store test mindmap data.",
        variant: "destructive",
      });
    }
  });

  return {
    generateMindmap: generateMindmap.mutate,
    testMindmap: testMindmap.mutate,
    refreshMindmapData,
    isGenerating: isGenerating || generateMindmap.isPending,
    generationStatus,
    mindmapData,
  };
};

