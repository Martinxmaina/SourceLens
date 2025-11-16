// Copy and paste this entire script into your browser console (F12)
// It will automatically detect the current notebook ID and check mindmap status

(async function debugMindmap() {
  console.log('🔍 Starting Mindmap Debug...\n');
  
  try {
    // Get notebook ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/');
    const notebookIdFromPath = pathParts[pathParts.length - 1];
    const notebookIdFromQuery = urlParams.get('notebookId') || urlParams.get('id');
    const notebookId = notebookIdFromQuery || notebookIdFromPath;
    
    if (!notebookId || notebookId === 'notebooks' || notebookId.length < 10) {
      console.error('❌ Could not find notebook ID in URL');
      console.log('Current URL:', window.location.href);
      console.log('Path parts:', pathParts);
      console.log('Query params:', Object.fromEntries(urlParams));
      console.log('\n💡 Try manually:');
      console.log('1. Look at the URL - it should be like /notebooks/abc123...');
      console.log('2. Or check React DevTools for notebookId prop');
      return;
    }
    
    console.log('📝 Notebook ID:', notebookId);
    console.log('📡 Querying database...\n');
    
    // Query database
    const { data, error } = await supabase
      .from('notebooks')
      .select('id, title, mindmap_data, mindmap_generation_status, mindmap_updated_at')
      .eq('id', notebookId)
      .single();
    
    if (error) {
      console.error('❌ Database Error:', error);
      return;
    }
    
    if (!data) {
      console.error('❌ No notebook found with ID:', notebookId);
      return;
    }
    
    console.log('✅ Notebook Found:', data.title || data.id);
    console.log('📊 Generation Status:', data.mindmap_generation_status || 'null');
    console.log('🕐 Last Updated:', data.mindmap_updated_at || 'never');
    console.log('');
    
    // Check mindmap data
    if (!data.mindmap_data) {
      console.warn('⚠️  No mindmap_data in database');
      console.log('💡 Status should be "completed" for data to exist');
      return;
    }
    
    const nodes = data.mindmap_data?.nodes || [];
    const edges = data.mindmap_data?.edges || [];
    
    console.log('📦 Mindmap Data:');
    console.log('  - Nodes:', nodes.length);
    console.log('  - Edges:', edges.length);
    console.log('');
    
    if (nodes.length === 0) {
      console.warn('⚠️  No nodes found in mindmap_data');
      return;
    }
    
    // Check root node
    const rootNode = nodes.find(n => n.data?.isRoot === true || !n.data?.parentId);
    console.log('🌳 Root Node:');
    if (rootNode) {
      console.log('  - ID:', rootNode.id);
      console.log('  - Label:', rootNode.data?.label || 'N/A');
      console.log('  - isRoot flag:', rootNode.data?.isRoot);
      console.log('  - Position:', rootNode.position);
    } else {
      console.warn('  ⚠️  No root node found!');
      console.log('  💡 First node:', nodes[0]?.id, nodes[0]?.data?.label);
    }
    console.log('');
    
    // Check node structure
    console.log('🔍 Node Structure Check:');
    const sampleNode = nodes[0];
    if (sampleNode) {
      console.log('  Sample node:', {
        hasId: !!sampleNode.id,
        hasData: !!sampleNode.data,
        hasLabel: !!sampleNode.data?.label,
        hasPosition: !!sampleNode.position,
        hasIsRoot: 'isRoot' in (sampleNode.data || {}),
        nodeType: sampleNode.type
      });
    }
    console.log('');
    
    // Check for common issues
    console.log('🔧 Issue Detection:');
    const issues = [];
    
    if (!rootNode) {
      issues.push('❌ No root node identified (should have isRoot: true or no parentId)');
    }
    
    if (nodes.some(n => !n.data?.label)) {
      issues.push('⚠️  Some nodes missing label');
    }
    
    if (nodes.some(n => !n.position || typeof n.position.x !== 'number')) {
      issues.push('⚠️  Some nodes have invalid positions');
    }
    
    if (edges.length === 0 && nodes.length > 1) {
      issues.push('⚠️  No edges but multiple nodes (tree structure might be broken)');
    }
    
    if (issues.length === 0) {
      console.log('  ✅ No obvious issues detected');
    } else {
      issues.forEach(issue => console.log('  ', issue));
    }
    
    console.log('\n📋 Full Data Structure:');
    console.log(JSON.stringify(data.mindmap_data, null, 2));
    
  } catch (err) {
    console.error('❌ Debug Error:', err);
  }
})();

