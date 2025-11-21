#!/bin/bash

API_BASE="http://localhost:3000/api"
EMAIL="buyer001@test.com"
PASSWORD="test1234"

echo "=== Testing My AI Agents Display ==="
echo ""

# Login
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Get user's purchased products
echo "Fetching user's purchased products..."
curl -s -X GET "$API_BASE/marketplace/my-products" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

