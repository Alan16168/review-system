#!/bin/bash

echo "=== Testing Checkout Flow ==="
echo ""

# Step 1: Login
echo "Step 1: Login as testuser@example.com"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"test123"}')

echo "$LOGIN_RESPONSE"
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful, token: ${TOKEN:0:20}..."
echo ""

# Step 2: Add item to cart
echo "Step 2: Add product to cart (wt_5 - 新传记写作模板)"
ADD_CART_RESPONSE=$(curl -s -X POST http://localhost:3000/api/marketplace/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product_id":"wt_5"}')

echo "$ADD_CART_RESPONSE"
echo ""

# Step 3: View cart
echo "Step 3: View cart"
CART_RESPONSE=$(curl -s http://localhost:3000/api/marketplace/cart \
  -H "Authorization: Bearer $TOKEN")

echo "$CART_RESPONSE"
CART_COUNT=$(echo "$CART_RESPONSE" | jq -r '.cart_items | length')
echo "Cart items count: $CART_COUNT"
echo ""

# Step 4: Checkout
echo "Step 4: Attempt checkout"
CHECKOUT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/marketplace/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$CHECKOUT_RESPONSE"
echo ""

# Check if successful
if echo "$CHECKOUT_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Checkout successful!"
else
  echo "❌ Checkout failed!"
  echo "Error details:"
  echo "$CHECKOUT_RESPONSE" | jq -r '.error, .details'
fi

echo ""
echo "=== Checking PM2 Logs for Errors ==="
pm2 logs review-system --nostream --lines 30
