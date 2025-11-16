#!/bin/bash
# Test the mindmap callback function manually

NOTEBOOK_ID="acd7e6e8-a26b-420d-b69d-d9f16509a0bf"
SUPABASE_URL="https://qfbrsodxhyzvqxuxpdik.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYnJzb2R4aHl6dnF4dXhwZGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTMyMTUsImV4cCI6MjA3ODM4OTIxNX0.jezots4CfS95RUNWgOL96_OmOpDrbDnj5u8opQdBUlQ"

echo "Testing mindmap callback with test data..."
echo ""

curl -X POST "${SUPABASE_URL}/functions/v1/mindmap-generation-callback" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"notebook_id\": \"${NOTEBOOK_ID}\",
    \"status\": \"success\",
    \"mindmap_data\": {
      \"nodes\": [
        {
          \"id\": \"0\",
          \"data\": { \"label\": \"Test Node\" },
          \"position\": { \"x\": 100, \"y\": 100 }
        }
      ],
      \"edges\": []
    }
  }"

echo ""
echo ""
echo "Check Supabase logs to see if callback was received"
