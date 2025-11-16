
import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  DefaultEdgeOptions,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MindmapData } from '@/hooks/useMindmap';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MindmapViewerProps {
  mindmapData: MindmapData | null;
  className?: string;
}

// Custom node styles
const nodeStyle = {
  background: '#ffffff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '10px 15px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#1f2937',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  minWidth: '120px',
  textAlign: 'center' as const,
};

// Zoom controls component
const ZoomControls: React.FC = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
      <Button
        size="sm"
        variant="outline"
        onClick={() => zoomIn()}
        className="h-8 w-8 p-0"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => zoomOut()}
        className="h-8 w-8 p-0"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        className="h-8 w-8 p-0"
        title="Fit View"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};

const MindmapViewerContent: React.FC<MindmapViewerProps> = ({ mindmapData, className = '' }) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert mindmap data to react-flow format
  const nodes: Node[] = useMemo(() => {
    console.log('[MindmapViewer] Processing nodes, mindmapData:', mindmapData);
    
    if (!mindmapData?.nodes || !Array.isArray(mindmapData.nodes)) {
      console.log('[MindmapViewer] No nodes or not an array:', {
        hasMindmapData: !!mindmapData,
        hasNodes: !!mindmapData?.nodes,
        isArray: Array.isArray(mindmapData?.nodes)
      });
      return [];
    }
    
    try {
      const processedNodes = mindmapData.nodes.map((node) => {
        if (!node || !node.id || !node.data || !node.position) {
          console.warn('[MindmapViewer] Invalid node data:', node);
          return null;
        }
        return {
          id: String(node.id),
          data: {
            label: node.data.label || 'Node',
            ...node.data,
          },
          position: {
            x: typeof node.position.x === 'number' ? node.position.x : 0,
            y: typeof node.position.y === 'number' ? node.position.y : 0,
          },
          type: node.type || 'default',
          style: nodeStyle,
        };
      }).filter((node): node is Node => node !== null);
      
      console.log('[MindmapViewer] Processed nodes:', processedNodes.length);
      return processedNodes;
    } catch (error) {
      console.error('[MindmapViewer] Error processing nodes:', error);
      return [];
    }
  }, [mindmapData]);

  const edges: Edge[] = useMemo(() => {
    if (!mindmapData?.edges || !Array.isArray(mindmapData.edges)) {
      console.log('[MindmapViewer] No edges or not an array');
      return [];
    }
    
    try {
      const processedEdges = mindmapData.edges.map((edge) => {
        if (!edge || !edge.id || !edge.source || !edge.target) {
          console.warn('[MindmapViewer] Invalid edge data:', edge);
          return null;
        }
        return {
          id: String(edge.id),
          source: String(edge.source),
          target: String(edge.target),
          ...edge,
        };
      }).filter((edge): edge is Edge => edge !== null);
      
      console.log('[MindmapViewer] Processed edges:', processedEdges.length);
      return processedEdges;
    } catch (error) {
      console.error('[MindmapViewer] Error processing edges:', error);
      return [];
    }
  }, [mindmapData]);

  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
      },
      type: 'smoothstep',
    }),
    []
  );

  // Fit view on mount and when data changes
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.3, duration: 400 });
      }, 100);
    }
  }, [nodes.length, fitView]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('[MindmapViewer] Node clicked:', node);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('[MindmapViewer] Render state:', {
      hasMindmapData: !!mindmapData,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      mindmapDataKeys: mindmapData ? Object.keys(mindmapData) : []
    });
  }, [mindmapData, nodes.length, edges.length]);

  if (!mindmapData) {
    console.log('[MindmapViewer] No mindmap data');
    return (
      <div className={`flex items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">No mindmap data available</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    console.log('[MindmapViewer] No nodes to render');
    return (
      <div className={`flex items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">No nodes to display</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full min-h-[600px] ${className}`} 
      style={{ position: 'relative', backgroundColor: '#f8fafc' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={[1, 2]} // Pan with middle mouse button or trackpad
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        panOnScroll={false}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="top-left"
        />
        <ZoomControls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'input':
                return '#3b82f6';
              case 'output':
                return '#10b981';
              default:
                return '#3b82f6';
            }
          }}
          nodeStrokeWidth={2}
          position="bottom-right"
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#cbd5e1"
        />
      </ReactFlow>
      
      {/* Fullscreen button */}
      <Button
        size="sm"
        variant="outline"
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 z-10 bg-white shadow-lg"
        title="Toggle Fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const MindmapViewer: React.FC<MindmapViewerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MindmapViewerContent {...props} />
    </ReactFlowProvider>
  );
};

export default MindmapViewer;

