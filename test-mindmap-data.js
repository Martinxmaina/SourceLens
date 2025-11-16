/**
 * Test script to directly set mindmap data
 * 
 * Usage:
 * 1. Get your notebook ID from the browser
 * 2. Update NOTEBOOK_ID below
 * 3. Run: node test-mindmap-data.js
 * 
 * Or use in browser console:
 * Copy the testMindmapData object and run:
 * 
 * const testData = { ... }; // paste your data
 * const { data, error } = await supabase.functions.invoke('test-mindmap', {
 *   body: {
 *     notebook_id: 'YOUR_NOTEBOOK_ID',
 *     mindmap_data: testData
 *   }
 * });
 * console.log('Result:', data, error);
 */

// Example mindmap data structure
const testMindmapData = {
  nodes: [
    {
      id: "0",
      data: {
        label: "Agentic AI: A Quantitative Analysis"
      },
      position: {
        x: 60.42969591314651,
        y: 473.41424685528744
      }
    },
    {
      id: "1",
      data: {
        label: "Performance Metrics"
      },
      position: {
        x: 422.02175885968575,
        y: 99.07162766645938
      }
    },
    {
      id: "2",
      data: {
        label: "Task Completion Time"
      },
      position: {
        x: 329.19688572901686,
        y: 215.33673732953108
      }
    }
  ],
  edges: [
    {
      id: "e1",
      source: "0",
      target: "1",
      animated: true
    },
    {
      id: "e2",
      source: "1",
      target: "2",
      animated: true
    }
  ]
};

// For Node.js usage (if you want to test from command line)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testMindmapData };
  
  // Example usage with fetch (requires SUPABASE_URL and SUPABASE_ANON_KEY)
  const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
  const NOTEBOOK_ID = process.env.NOTEBOOK_ID || 'YOUR_NOTEBOOK_ID';
  
  if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    fetch(`${SUPABASE_URL}/functions/v1/test-mindmap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        notebook_id: NOTEBOOK_ID,
        mindmap_data: testMindmapData
      })
    })
    .then(res => res.json())
    .then(data => console.log('Success:', data))
    .catch(err => console.error('Error:', err));
  }
}

