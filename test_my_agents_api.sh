#!/bin/bash

API_BASE="http://localhost:3000/api"
EMAIL="buyer001@test.com"
PASSWORD="test1234"

echo "=== Testing My AI Agents API ==="
echo ""

# Login
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "✅ Login successful"
echo ""

# Get user's purchased AI agents
echo "Fetching purchased AI agents from /api/marketplace/my-agents..."
curl -s -X GET "$API_BASE/marketplace/my-agents" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "=== Database verification ==="
echo "user_purchases table:"
npx wrangler d1 execute review-system-production --local --command="SELECT * FROM user_purchases WHERE user_id = 5 AND product_type = 'ai_service';" 2>/dev/null | tail -n +6

