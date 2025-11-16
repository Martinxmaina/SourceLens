import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MindmapData } from '@/hooks/useMindmap';
import { useChatMessages } from '@/hooks/useChatMessages';
import { X, ChevronRight, ChevronDown, Moon, Sun, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';

interface InteractiveMindmapViewerProps {
  mindmapData: MindmapData | null;
  notebookTitle?: string;
  onClose?: () => void;
  notebookId?: string;
  onRegenerate?: (notebookId: string) => void;
  isRegenerating?: boolean;
}

// Feature 3: CSS animations for smooth expansion
const animationStyles = `
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: scale(1); 
    }
  }
  
  @keyframes slideUp {
    from { 
      transform: translateY(5px); 
      opacity: 0; 
    }
    to { 
      transform: translateY(0); 
      opacity: 1; 
    }
  }
  
  .mindmap-node-enter {
    animation: fadeIn 0.1s ease-out, slideUp 0.1s ease-out;
  }
  
  .mindmap-edge-enter {
    animation: fadeIn 0.15s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  if (!document.getElementById('mindmap-animations')) {
    styleSheet.id = 'mindmap-animations';
    document.head.appendChild(styleSheet);
  }
}

// Improved color palette - cohesive and works in both light and dark mode
const generateBranchColor = (index: number) => {
  const colorPalette = [
    { name: 'Blue', light: '#3b82f6', dark: '#60a5fa', textLight: '#1e3a8a', textDark: '#dbeafe' },
    { name: 'Green', light: '#22c55e', dark: '#4ade80', textLight: '#14532d', textDark: '#dcfce7' },
    { name: 'Purple', light: '#8b5cf6', dark: '#a78bfa', textLight: '#4c1d95', textDark: '#ede9fe' },
    { name: 'Orange', light: '#f97316', dark: '#fb923c', textLight: '#7c2d12', textDark: '#fed7aa' },
    { name: 'Pink', light: '#ec4899', dark: '#f472b6', textLight: '#831843', textDark: '#fce7f3' },
    { name: 'Teal', light: '#14b8a6', dark: '#2dd4bf', textLight: '#134e4a', textDark: '#ccfbf1' },
    { name: 'Indigo', light: '#6366f1', dark: '#818cf8', textLight: '#312e81', textDark: '#e0e7ff' },
    { name: 'Rose', light: '#f43f5e', dark: '#fb7185', textLight: '#881337', textDark: '#ffe4e6' },
  ];
  
  const color = colorPalette[index % colorPalette.length];
  
  return {
    light: color.light,
    dark: color.dark,
    textLight: color.textLight,
    textDark: color.textDark,
  };
};

const getBranchColors = (branchIndex: number, level: number, isDarkMode: boolean = false) => {
  const branchColor = generateBranchColor(branchIndex);
  
  // Improved color scheme - cohesive and works in both modes
  // Root node - vibrant amber/yellow (same in both modes)
  if (level === 0) {
    return {
      bg: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
      border: '#f59e0b',
      text: '#78350f',
      edge: '#f59e0b',
      bgColor: '#fef08a',
    };
  }
  
  // Level 1 - Main branches: vibrant colors with proper contrast
  if (level === 1) {
    return {
      bg: isDarkMode
        ? `linear-gradient(135deg, ${branchColor.dark}30 0%, ${branchColor.dark}60 100%)`
        : `linear-gradient(135deg, ${branchColor.light}20 0%, ${branchColor.light}40 100%)`,
      border: isDarkMode ? branchColor.dark : branchColor.light,
      text: isDarkMode ? branchColor.textDark : branchColor.textLight,
      edge: isDarkMode ? branchColor.dark : branchColor.light,
      bgColor: isDarkMode ? `${branchColor.dark}30` : `${branchColor.light}20`,
    };
  }
  
  // Level 2+ - Sub-branches: lighter backgrounds with colored accents
  return {
    bg: isDarkMode
      ? `linear-gradient(135deg, #334155 0%, ${branchColor.dark}25 100%)`
      : `linear-gradient(135deg, #f8fafc 0%, ${branchColor.light}15 100%)`,
    border: isDarkMode ? branchColor.dark : branchColor.light,
    text: isDarkMode ? branchColor.textDark : branchColor.textLight,
    edge: isDarkMode ? branchColor.dark : branchColor.light,
    bgColor: isDarkMode ? '#334155' : '#f8fafc',
  };
};

// Feature 2: Floating Card-Style Nodes with expand indicator
const NotebookLMNode = React.memo<NodeProps>(({ data, selected }) => {
  const isVisible = data?.isVisible !== false;
  const hasChildren = data?.hasChildren || false;
  const isExpanded = data?.isExpanded || false;
  const level = data?.level || 0;
  const branchIndex = data?.branchIndex || 0;
  const isHovered = data?.isHovered || false;
  const isDarkMode = data?.isDarkMode || false;
  
  const colors = useMemo(() => getBranchColors(branchIndex, level, isDarkMode), [branchIndex, level, isDarkMode]);

  // Node sizes - large and readable
  const nodeStyle = useMemo(() => {
    return {
      0: { // Root
        minWidth: '1080px',
        maxWidth: '1080px',
        minHeight: '216px',
        padding: '48px 60px',
        fontSize: '56px',
        fontWeight: '700',
        lineHeight: '1.2',
      },
      1: { // Level 1
        minWidth: '900px',
        maxWidth: '900px',
        minHeight: '180px',
        padding: '43px 54px',
        fontSize: '50px',
        fontWeight: '700',
        lineHeight: '1.2',
      },
      2: { // Level 2+
        minWidth: '720px',
        maxWidth: '720px',
        minHeight: '156px',
        padding: '38px 48px',
        fontSize: '44px',
        fontWeight: '600',
        lineHeight: '1.2',
      }
    }[Math.min(level, 2)] || {
      minWidth: '720px',
      maxWidth: '720px',
      minHeight: '156px',
      padding: '38px 48px',
      fontSize: '44px',
      fontWeight: '600',
      lineHeight: '1.2',
    };
  }, [level]);

  return (
    <div
      className={`relative border-3 rounded-xl shadow-lg transition-all duration-50 cursor-pointer mindmap-node-enter ${
        selected ? 'ring-3 ring-blue-600 scale-105 shadow-xl' : ''
      } ${isHovered ? 'scale-[1.02] shadow-xl' : ''} ${!isVisible ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
      style={{ 
        background: colors.bg,
        borderColor: colors.border,
        borderWidth: '3px',
        borderRadius: '12px', // Feature 2: Floating card style
        color: colors.text,
        ...nodeStyle,
        boxShadow: selected 
          ? `0 12px 30px -5px rgba(0, 0, 0, 0.2), 0 0 0 3px ${colors.border}` 
          : isHovered
          ? '0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' // Feature 8: Increased shadow on hover
          : '0 3px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)', // Feature 2: Soft card shadow
        transition: 'all 0.05s ease', // Feature 8: Fast transitions
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left}
        className="w-2 h-2 opacity-0"
        style={{ pointerEvents: 'none' }}
      />
      
      <div className="flex items-center gap-3">
        <div 
          className="flex-1"
          style={{ 
            color: colors.text,
            fontSize: nodeStyle.fontSize,
            fontWeight: nodeStyle.fontWeight,
            lineHeight: nodeStyle.lineHeight || '1.2',
            letterSpacing: '0.01em',
          }}
        >
          {data?.label || 'Node'}
        </div>
        
        {hasChildren && (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-8 h-8" style={{ color: colors.text, opacity: 1 }} />
            ) : (
              <ChevronRight className="w-8 h-8" style={{ color: colors.text, opacity: 1 }} />
            )}
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right}
        className="w-2 h-2 opacity-0"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.data?.isVisible === nextProps.data?.isVisible &&
    prevProps.data?.isExpanded === nextProps.data?.isExpanded &&
    prevProps.data?.label === nextProps.data?.label &&
    prevProps.data?.hasChildren === nextProps.data?.hasChildren &&
    prevProps.data?.level === nextProps.data?.level &&
    prevProps.data?.branchIndex === nextProps.data?.branchIndex &&
    prevProps.data?.isHovered === nextProps.data?.isHovered &&
    prevProps.data?.isDarkMode === nextProps.data?.isDarkMode
  );
});

NotebookLMNode.displayName = 'NotebookLMNode';

// Feature 7: Breadcrumb Navigation Component
const BreadcrumbNav: React.FC<{
  path: string[];
  nodes: Node[];
  onNavigate: (nodeId: string) => void;
  isDarkMode?: boolean;
}> = ({ path, nodes, onNavigate, isDarkMode = false }) => {
  if (path.length === 0) return null;

  const pathNodes = path.map(nodeId => nodes.find(n => n.id === nodeId)).filter(Boolean) as Node[];

  return (
    <div 
      className={`absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm ${
        isDarkMode ? 'bg-slate-800/90 text-white' : 'bg-white/90 text-gray-900'
      }`}
    >
      {pathNodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <button
            onClick={() => onNavigate(node.id)}
            className={`text-sm font-medium hover:underline ${
              index === pathNodes.length - 1 ? 'font-bold' : ''
            }`}
          >
            {node.data?.label || node.id}
          </button>
          {index < pathNodes.length - 1 && (
            <span className="text-gray-400">/</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Node detail panel
const NodeDetailPanel: React.FC<{ 
  node: Node | null; 
  onClose: () => void;
  visitedNodes: Set<string>;
  totalNodes: number;
  isDarkMode?: boolean;
  notebookId?: string;
  getMessagesByTopic?: (topic: string) => any[];
  isSending?: boolean;
  pendingTopic?: string | null;
}> = ({ node, onClose, visitedNodes, totalNodes, isDarkMode = false, notebookId, getMessagesByTopic, isSending = false, pendingTopic = null }) => {
  if (!node) return null;

  const progress = totalNodes > 0 ? (visitedNodes.size / totalNodes) * 100 : 0;
  
  // Get chat messages for this node's topic
  const topicMessages = node.data?.label && getMessagesByTopic 
    ? getMessagesByTopic(node.data.label) 
    : [];
  
  // Group messages into Q&A pairs
  const qaPairs: Array<{ question: any; answer: any }> = [];
  for (let i = 0; i < topicMessages.length; i++) {
    if (topicMessages[i].message.type === 'human') {
      const question = topicMessages[i];
      const answer = topicMessages[i + 1] && topicMessages[i + 1].message.type === 'ai' 
        ? topicMessages[i + 1] 
        : null;
      if (answer) {
        qaPairs.push({ question, answer });
        i++; // Skip the answer in next iteration
      }
    }
  }
  
  const latestAnswer = qaPairs.length > 0 ? qaPairs[qaPairs.length - 1].answer : null;
  
  // Check if we're waiting for a response for this specific node
  const nodeTopic = node.data?.label || '';
  
  // Show loading if:
  // 1. This node's topic matches the pending topic (query was just sent), OR
  // 2. We're actively sending and this is the pending topic, OR
  // 3. There's a pending question (user message without answer) for this topic
  const isPendingForThisNode = pendingTopic === nodeTopic;
  const isWaitingForResponse = isSending && isPendingForThisNode;
  
  // Check if there's a pending question (user message without answer) for this topic
  const lastMessage = topicMessages.length > 0 ? topicMessages[topicMessages.length - 1] : null;
  const hasPendingQuestion = lastMessage && lastMessage.message.type === 'human';
  
  // Show loading if pending for this node OR waiting for response OR has pending question while sending
  const showLoading = isPendingForThisNode || isWaitingForResponse || (hasPendingQuestion && isSending);

  return (
    <Card className={`absolute right-0 top-0 bottom-0 w-80 shadow-xl z-20 border-l flex flex-col ${
      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Context</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className={`px-4 py-3 border-b flex-shrink-0 ${
        isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Progress: {visitedNodes.size} / {totalNodes} nodes explored ({Math.round(progress)}%)
        </div>
        <div className={`w-full rounded-full h-1.5 ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
        }`}>
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <div className={`text-xs font-medium uppercase mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Title</div>
            <div className={`text-base font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{node.data?.label || 'Untitled'}</div>
          </div>
          
          {node.data?.description && (
            <div>
              <div className={`text-xs font-medium uppercase mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Description</div>
              <div className={`text-sm leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>{node.data.description}</div>
            </div>
          )}

          {/* Chat Responses Section */}
          {notebookId && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <div className={`text-xs font-medium uppercase mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Chat Responses</div>
              
              {/* Loading State - Show when waiting for response for this specific node */}
              {showLoading && (
                <div className={`flex items-center gap-2 py-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Getting insights...</span>
                </div>
              )}

              {/* Latest Answer */}
              {latestAnswer && !showLoading && (
                <div className="mb-6">
                  <div className={`text-xs font-medium uppercase mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Latest Answer</div>
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                  }`}>
                    <div className={`prose prose-sm max-w-none ${
                      isDarkMode ? 'prose-invert text-gray-300' : 'text-gray-800'
                    }`}>
                      <MarkdownRenderer 
                        content={latestAnswer.message.content}
                        className=""
                        isUserMessage={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chat History */}
              {qaPairs.length > 1 && (
                <div>
                  <div className={`text-xs font-medium uppercase mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Chat History</div>
                  <div className="space-y-4">
                    {qaPairs.slice(0, -1).map((pair, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                      }`}>
                        <div className={`text-xs mb-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Q: {typeof pair.question.message.content === 'string' 
                            ? pair.question.message.content 
                            : 'Question'}
                        </div>
                        <div className={`prose prose-sm max-w-none ${
                          isDarkMode ? 'prose-invert text-gray-300' : 'text-gray-800'
                        }`}>
                          <MarkdownRenderer 
                            content={pair.answer.message.content}
                            className=""
                            isUserMessage={false}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State - Only show if not waiting for response */}
              {!showLoading && qaPairs.length === 0 && (
                <div className={`text-sm py-4 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No chat responses yet. Click the node to get insights.
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

// Convert graph to tree structure
const buildTreeStructure = (
  nodes: Node[],
  edges: Edge[]
): { treeNodes: Node[]; treeEdges: Edge[] } => {
  const rootNode = nodes.find(n => n.data?.isRoot) || 
                   nodes.find(n => !edges.some(e => e.target === n.id)) ||
                   nodes[0];
  
  if (!rootNode) return { treeNodes: [], treeEdges: [] };

  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  const visited = new Set<string>();
  
  const queue: string[] = [rootNode.id];
  visited.add(rootNode.id);
  
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = edges
      .filter(e => e.source === parentId && !visited.has(e.target))
      .map(e => e.target);
    
    const limitedChildren = children.slice(0, 8);
    
    childrenMap.set(parentId, limitedChildren);
    
    limitedChildren.forEach(childId => {
      if (!visited.has(childId)) {
        visited.add(childId);
        parentMap.set(childId, parentId);
        queue.push(childId);
      }
    });
  }

  const treeNodes = nodes
    .filter(n => visited.has(n.id))
    .map(node => ({
      ...node,
      data: {
        ...node.data,
        isRoot: node.id === rootNode.id,
        hasChildren: (childrenMap.get(node.id)?.length || 0) > 0,
      }
    }));

  const treeEdges = edges.filter(edge => {
    const parent = parentMap.get(edge.target);
    return parent === edge.source;
  });

  return { treeNodes, treeEdges };
};

// Feature 5: Horizontal Linear Layout with generous spacing
const calculateHorizontalLinearLayout = (
  baseNodes: Node[],
  baseEdges: Edge[],
  expandedNodes: Set<string>,
  notebookTitle?: string,
  isDarkMode: boolean = false
): { nodes: Node[]; edges: Edge[] } => {
  if (baseNodes.length === 0) return { nodes: [], edges: [] };

  const rootNode = baseNodes.find(n => n.data?.isRoot) || baseNodes[0];
  if (!rootNode) return { nodes: [], edges: [] };

  const LAYOUT_CONFIG = {
    root: {
      x: 100,
      width: 1080,
      height: 216,
    },
    level1: {
      x: 1400,
      width: 900,
      height: 180,
      verticalSpacing: 250, // Reduced from 500px to 250px for closer nodes
    },
    level2Plus: {
      xOffset: 1200,
      width: 720,
      height: 156,
      verticalSpacing: 200, // Reduced from 400px to 200px for closer nodes
    },
    minNodeHeight: 156,
    maxNodeWidth: 1080,
    nodeHeight: 216,
  };

  const childrenMap = new Map<string, string[]>();
  baseEdges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)?.push(edge.target);
  });

  const nodeMap = new Map(baseNodes.map(n => [n.id, n]));
  const viewportHeight = window.innerHeight * 0.85;
  const rootY = viewportHeight / 2;

  const positionedNodes: Node[] = [];
  const visibleEdges: Edge[] = [];

  function calculateSubtreeHeight(nodeId: string): number {
    if (!expandedNodes.has(nodeId)) return 0;
    
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return 0;
    
    let totalHeight = 0;
    children.forEach(childId => {
      const childHeight = calculateSubtreeHeight(childId);
      totalHeight += LAYOUT_CONFIG.level2Plus.height + LAYOUT_CONFIG.level2Plus.verticalSpacing + childHeight;
    });
    
    if (totalHeight === 0) {
      totalHeight = (LAYOUT_CONFIG.level2Plus.height + LAYOUT_CONFIG.level2Plus.verticalSpacing) * children.length;
    }
    return totalHeight;
  }

  // Position root node
  positionedNodes.push({
    ...rootNode,
    position: { 
      x: LAYOUT_CONFIG.root.x, 
      y: rootY 
    },
    data: {
      ...rootNode.data,
      label: notebookTitle || rootNode.data?.label,
      isVisible: true,
      isExpanded: expandedNodes.has(rootNode.id),
      hasChildren: (childrenMap.get(rootNode.id)?.length || 0) > 0,
      level: 0,
      branchIndex: 0,
      isDarkMode,
    }
  });

  // Feature 1: Minimal First - Only show level 1 nodes when root is expanded
  const level1Children = childrenMap.get(rootNode.id) || [];
  const isRootExpanded = expandedNodes.has(rootNode.id);
  
  const visibleLevel1Children = isRootExpanded 
    ? level1Children.slice(0, Math.min(6, level1Children.length))
    : [];
  
  let totalLevel1Height = 0;
  const level1Heights: number[] = [];
  
  visibleLevel1Children.forEach(childId => {
    const subtreeHeight = (() => {
      if (!expandedNodes.has(childId)) return 0;
      const children = childrenMap.get(childId) || [];
      if (children.length === 0) return 0;
      
      let height = 0;
      children.forEach(grandchildId => {
        const grandchildSubtree = calculateSubtreeHeight(grandchildId);
        height += LAYOUT_CONFIG.level2Plus.height + LAYOUT_CONFIG.level2Plus.verticalSpacing + grandchildSubtree;
      });
      if (height === 0) {
        height = (LAYOUT_CONFIG.level2Plus.height + LAYOUT_CONFIG.level2Plus.verticalSpacing) * children.length;
      }
      return height;
    })();
    
    const nodeHeight = LAYOUT_CONFIG.level1.height + LAYOUT_CONFIG.level1.verticalSpacing + subtreeHeight;
    level1Heights.push(nodeHeight);
    totalLevel1Height += nodeHeight;
  });
  
  if (totalLevel1Height === 0 && visibleLevel1Children.length > 0) {
    totalLevel1Height = (LAYOUT_CONFIG.level1.height + LAYOUT_CONFIG.level1.verticalSpacing) * visibleLevel1Children.length;
  }
  
  const level1StartY = rootY - (totalLevel1Height / 2);

  let currentLevel1Y = level1StartY;
  visibleLevel1Children.forEach((childId, index) => {
    const childNode = nodeMap.get(childId);
    if (!childNode) return;

    const nodeHeight = level1Heights[index] || LAYOUT_CONFIG.level1.verticalSpacing;
    const yPos = currentLevel1Y + (nodeHeight / 2);
    currentLevel1Y += nodeHeight;
    
    positionedNodes.push({
      ...childNode,
      position: { 
        x: LAYOUT_CONFIG.level1.x, 
        y: yPos 
      },
      data: {
        ...childNode.data,
        isVisible: isRootExpanded,
        isExpanded: expandedNodes.has(childId),
        hasChildren: (childrenMap.get(childId)?.length || 0) > 0,
        level: 1,
        branchIndex: index,
        isDarkMode,
      }
    });

    if (isRootExpanded) {
      visibleEdges.push({
        id: `e-${rootNode.id}-${childId}`,
        source: rootNode.id,
        target: childId,
        type: 'smoothstep', // Feature 9: Smooth curved edges
        animated: true,
        style: { 
          strokeWidth: 3,
          stroke: getBranchColors(index, 1, isDarkMode).edge,
          strokeLinecap: 'round' as const, // Feature 9: Rounded line caps
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }
  });

  // Recursively position deeper levels
  function positionChildren(
    parentId: string, 
    parentX: number, 
    parentY: number, 
    level: number,
    branchIndex: number
  ) {
    if (!expandedNodes.has(parentId)) return;

    const children = childrenMap.get(parentId) || [];
    if (children.length === 0) return;

    let totalSubtreeHeight = 0;
    const childHeights: number[] = [];
    
    children.forEach(childId => {
      const subtreeHeight = calculateSubtreeHeight(childId);
      const childHeight = LAYOUT_CONFIG.level2Plus.height + LAYOUT_CONFIG.level2Plus.verticalSpacing + subtreeHeight;
      childHeights.push(childHeight);
      totalSubtreeHeight += childHeight;
    });
    
    if (totalSubtreeHeight === 0) {
      totalSubtreeHeight = (LAYOUT_CONFIG.level2Plus.height + LAYOUT_CONFIG.level2Plus.verticalSpacing) * children.length;
    }
    
    const startY = parentY - (totalSubtreeHeight / 2);
    const childX = parentX + LAYOUT_CONFIG.level2Plus.xOffset;

    let currentY = startY;
    children.forEach((childId, index) => {
      const childNode = nodeMap.get(childId);
      if (!childNode) return;

      const childHeight = childHeights[index] || LAYOUT_CONFIG.level2Plus.verticalSpacing;
      const yPos = currentY + (childHeight / 2);

      positionedNodes.push({
        ...childNode,
        position: { x: childX, y: yPos },
        data: {
          ...childNode.data,
          isVisible: true,
          isExpanded: expandedNodes.has(childId),
          hasChildren: (childrenMap.get(childId)?.length || 0) > 0,
          level,
          branchIndex,
          isDarkMode,
        }
      });

      visibleEdges.push({
        id: `e-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'smoothstep', // Feature 9: Smooth curved edges
        animated: true,
        style: { 
          strokeWidth: 3,
          stroke: getBranchColors(branchIndex, level, isDarkMode).edge,
          strokeLinecap: 'round' as const, // Feature 9: Rounded line caps
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      currentY += childHeight;
      positionChildren(childId, childX, yPos, level + 1, branchIndex);
    });
  }

  visibleLevel1Children.forEach((childId, index) => {
    const childNode = positionedNodes.find(n => n.id === childId);
    if (childNode && expandedNodes.has(childId)) {
      positionChildren(
        childId,
        LAYOUT_CONFIG.level1.x,
        childNode.position.y,
        2,
        index
      );
    }
  });

  return { nodes: positionedNodes, edges: visibleEdges };
};

const InteractiveMindmapContent: React.FC<InteractiveMindmapViewerProps> = ({ 
  mindmapData, 
  notebookTitle, 
  onClose,
  notebookId,
  onRegenerate,
  isRegenerating = false
}) => {
  const { fitView, setNodes, getViewport } = useReactFlow();
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isSending, getMessagesByTopic, messages } = useChatMessages(notebookId);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  
  // Clear pending topic when message is received
  useEffect(() => {
    if (pendingTopic && !isSending) {
      const topicMessages = getMessagesByTopic(pendingTopic);
      if (topicMessages.length > 0) {
        setPendingTopic(null);
      }
    }
  }, [messages, isSending, pendingTopic, getMessagesByTopic]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set<string>());
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null); // Feature 6: Focus mode
  const [navigationPath, setNavigationPath] = useState<string[]>([]); // Feature 7: Breadcrumbs
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null); // Feature 8: Hover state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mindmap-dark-mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mindmap-dark-mode', String(isDarkMode));
    }
  }, [isDarkMode]);

  // Convert graph to tree structure
  const { treeNodes: baseNodes, treeEdges: baseEdges } = useMemo(() => {
    if (!mindmapData?.nodes || !Array.isArray(mindmapData.nodes)) {
      return { treeNodes: [], treeEdges: [] };
    }
    
    try {
      const nodes: Node[] = mindmapData.nodes.map((node, index) => {
        if (!node || !node.id || !node.data || !node.position) {
          return null;
        }

        const isRoot = String(node.id) === '0' || 
                      node.data?.isRoot === true || 
                      (index === 0 && !mindmapData.nodes.some(n => n.data?.isRoot === true));

        return {
          id: String(node.id),
          data: {
            label: node.data.label || 'Node',
            description: node.data.description || node.data.content || '',
            isRoot,
            ...node.data,
          },
          position: {
            x: typeof node.position.x === 'number' ? node.position.x : 0,
            y: typeof node.position.y === 'number' ? node.position.y : 0,
          },
          type: 'notebooklm',
        };
      }).filter((node): node is Node => node !== null);

      const edges: Edge[] = (mindmapData.edges || []).map((edge) => {
        if (!edge || !edge.id || !edge.source || !edge.target) {
          return null;
        }
        return {
          id: String(edge.id),
          source: String(edge.source),
          target: String(edge.target),
        };
      }).filter((edge): edge is Edge => edge !== null);

      return buildTreeStructure(nodes, edges);
    } catch (error) {
      console.error('[InteractiveMindmapViewer] Error processing nodes:', error);
      return { treeNodes: [], treeEdges: [] };
    }
  }, [mindmapData]);

  // Apply horizontal linear layout
  const { nodes: laidOutNodes, edges: laidOutEdges } = useMemo(() => {
    if (baseNodes.length === 0) return { nodes: [], edges: [] };
    return calculateHorizontalLinearLayout(baseNodes, baseEdges, expandedNodes, notebookTitle, isDarkMode);
  }, [baseNodes, baseEdges, expandedNodes, notebookTitle, isDarkMode]);

  // Feature 6: Get related node IDs for focus mode
  const getRelatedNodeIds = useCallback((nodeId: string, nodes: Node[]): Set<string> => {
    const relatedIds = new Set<string>([nodeId]);
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edgeMap = new Map<string, string[]>();
    laidOutEdges.forEach(edge => {
      if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, []);
      edgeMap.get(edge.source)!.push(edge.target);
    });
    
    const parentMap = new Map<string, string>();
    laidOutEdges.forEach(edge => {
      parentMap.set(edge.target, edge.source);
    });

    // Add root
    const rootNode = nodes.find(n => n.data?.isRoot);
    if (rootNode) relatedIds.add(rootNode.id);

    // Add all ancestors
    let currentId: string | undefined = nodeId;
    while (currentId) {
      const parent = parentMap.get(currentId);
      if (parent) {
        relatedIds.add(parent);
        currentId = parent;
      } else {
        break;
      }
    }

    // Add all descendants
    const addDescendants = (id: string) => {
      const children = edgeMap.get(id) || [];
      children.forEach(childId => {
        relatedIds.add(childId);
        addDescendants(childId);
      });
    };
    addDescendants(nodeId);

    return relatedIds;
  }, [laidOutEdges]);

  // Feature 7: Build breadcrumb path
  const buildBreadcrumbPath = useCallback((nodeId: string): string[] => {
    const path: string[] = [];
    const rootNode = laidOutNodes.find(n => n.data?.isRoot);
    if (!rootNode) return path;

    const parentMap = new Map<string, string>();
    laidOutEdges.forEach(edge => {
      parentMap.set(edge.target, edge.source);
    });

    const buildPath = (id: string): string[] => {
      const parent = parentMap.get(id);
      if (parent && parent !== rootNode.id) {
        return [...buildPath(parent), id];
      }
      return [rootNode.id, id];
    };

    return buildPath(nodeId);
  }, [laidOutNodes, laidOutEdges]);

  // Update nodes with hover and focus states - optimized to only update changed nodes
  const visibleNodes = useMemo(() => {
    if (hoveredNodeId === null) {
      // No hover state, return nodes as-is
      return laidOutNodes;
    }
    // Only update nodes when hover state changes
    return laidOutNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isHovered: hoveredNodeId === node.id,
      }
    }));
  }, [laidOutNodes, hoveredNodeId]);

  // Feature 9: Update edges with hover effects - optimized
  const edges = useMemo(() => {
    if (hoveredNodeId === null) {
      // No hover, return edges with default styles
      return laidOutEdges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: 3,
          opacity: 1,
          transition: 'all 0.05s ease',
        },
      }));
    }
    // Only recalculate when hover state changes
    return laidOutEdges.map(edge => {
      const isHovered = hoveredNodeId === edge.source || hoveredNodeId === edge.target;
      const sourceNode = laidOutNodes.find(n => n.id === edge.source);
      
      return {
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: isHovered ? 4 : 3,
          opacity: 1,
          transition: 'all 0.05s ease',
        },
      };
    });
  }, [laidOutEdges, laidOutNodes, hoveredNodeId]);

  // Update nodes in ReactFlow (without auto-zoom) - debounced for performance
  useEffect(() => {
    if (visibleNodes.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      setNodes(visibleNodes);
    }, 16); // ~60fps debounce
    
    return () => clearTimeout(timeoutId);
  }, [visibleNodes, setNodes]);

  // Initial load fitView - only runs once when baseNodes first loads
  const [hasInitialFit, setHasInitialFit] = useState(false);
  useEffect(() => {
    if (baseNodes.length > 0 && !hasInitialFit && visibleNodes.length > 0) {
      const timeoutId = setTimeout(() => {
        fitView({ padding: 0.5, duration: 200, maxZoom: 1.2 });
        setHasInitialFit(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [baseNodes.length, visibleNodes.length, hasInitialFit, fitView]);

  // Feature 1: Auto-expand root on initial load
  useEffect(() => {
    if (baseNodes.length > 0 && expandedNodes.size === 0) {
      const rootNode = baseNodes.find(n => n.data?.isRoot) || baseNodes[0];
      if (rootNode) {
        setExpandedNodes(new Set([rootNode.id]));
      }
    }
  }, [baseNodes, expandedNodes.size]);

  // Feature 6: Handle node click - expand and focus with branch zoom
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        if (node.data?.isRoot) return prev;
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
    
    setSelectedNode(node);
    setFocusedNodeId(node.id);
    const path = buildBreadcrumbPath(node.id);
    setNavigationPath(path);
    
    setVisitedNodes(prev => {
      const newSet = new Set(prev);
      newSet.add(node.id);
      return newSet;
    });

    // Trigger chat query for this node topic
    if (notebookId && node.data?.label) {
      const topic = node.data.label;
      
      // Only prevent duplicate if a query is currently in progress for this exact topic
      const isQueryInProgress = isSending && pendingTopic === topic;
      
      // Send query if not already in progress
      if (!isQueryInProgress) {
        setPendingTopic(topic);
        sendMessage({
          notebookId,
          role: 'user',
          content: `Discuss what these sources say about: ${topic}.`,
          mindmapTopic: topic
        });
      }
    }

    // Zoom to branch only after state updates
    setTimeout(() => {
      const relatedIds = getRelatedNodeIds(node.id, laidOutNodes);
      const branchNodes = laidOutNodes.filter(n => relatedIds.has(n.id));
      if (branchNodes.length > 0) {
        fitView({ 
          nodes: branchNodes, 
          padding: 150, 
          duration: 200, 
          maxZoom: 1.5 
        });
      }
    }, 50);
  }, [buildBreadcrumbPath, getRelatedNodeIds, laidOutNodes, fitView, notebookId, sendMessage]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setFocusedNodeId(null);
    setNavigationPath([]);
    setHoveredNodeId(null);
  }, []);

  // Feature 8: Hover effects handlers
  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);
  
  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Feature 7: Breadcrumb navigation handler
  const handleBreadcrumbNavigate = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
    const path = buildBreadcrumbPath(nodeId);
    setNavigationPath(path);
  }, [buildBreadcrumbPath]);

  const nodeTypes = useMemo(() => ({
    notebooklm: NotebookLMNode
  }), []);

  if (!mindmapData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-sm">No mindmap data available</p>
      </div>
    );
  }

  if (baseNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-sm">No nodes found in mindmap data</p>
      </div>
    );
  }

  return (
    <div 
      ref={reactFlowRef}
      className="relative w-full h-full" 
      style={{ 
        backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
        minHeight: '100%' 
      }}
    >
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {/* Regenerate Button - Reduced size */}
        {notebookId && onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => notebookId && onRegenerate(notebookId)}
            disabled={isRegenerating}
            className="h-8 px-2 text-xs"
            title="Regenerate mindmap"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? '...' : 'Regenerate'}
          </Button>
        )}
        
        {/* Dark Mode Toggle */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="h-8 w-8 p-0 rounded-full"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Feature 7: Breadcrumb Navigation */}
      <BreadcrumbNav 
        path={navigationPath}
        nodes={visibleNodes}
        onNavigate={handleBreadcrumbNavigate}
        isDarkMode={isDarkMode}
      />
      
      <ReactFlow
        nodes={visibleNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter} // Feature 8: Hover effects
        onNodeMouseLeave={onNodeMouseLeave} // Feature 8: Hover effects
        onPaneClick={onPaneClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true} // Feature 4: Drag pan
        selectNodesOnDrag={false}
        zoomOnScroll={true} // Feature 4: Infinite zoom
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        panOnScroll={false}
        preventScrolling={false}
        minZoom={0.1} // Feature 4: Infinite zoom capability
        maxZoom={3.0} // Feature 4: Infinite zoom capability
        defaultViewport={{ x: 50, y: 0, zoom: 0.8 }}
        // Removed fitView prop to prevent auto-zoom on every render
        onlyRenderVisibleElements={false}
        nodeOrigin={[0, 0]}
        proOptions={{ hideAttribution: true }}
      >
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="top-left"
        />
        <MiniMap
          nodeColor={(node) => {
            const level = node.data?.level || 0;
            const branchIndex = node.data?.branchIndex || 0;
            return getBranchColors(branchIndex, level, isDarkMode).edge;
          }}
          nodeStrokeWidth={2}
          position="bottom-right"
          style={{
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            border: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            borderRadius: '8px',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1.2}
          color={isDarkMode ? '#334155' : '#e2e8f0'}
        />
      </ReactFlow>

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetailPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)}
          visitedNodes={visitedNodes}
          totalNodes={visibleNodes.length}
          isDarkMode={isDarkMode}
          notebookId={notebookId}
          getMessagesByTopic={getMessagesByTopic}
          isSending={isSending}
          pendingTopic={pendingTopic}
        />
      )}
    </div>
  );
};

const InteractiveMindmapViewer: React.FC<InteractiveMindmapViewerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <InteractiveMindmapContent {...props} />
    </ReactFlowProvider>
  );
};

export default InteractiveMindmapViewer;
