#!/bin/bash

# Configuration
API_BASE="http://localhost:3000/api"
EMAIL="testuser@example.com"
PASSWORD="password123"

echo "=== Testing AI Agent Purchase Flow ==="
echo ""

# Step 1: Login
echo "Step 1: Login as $EMAIL"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Add AI agent (product ID=1) to cart
echo "Step 2: Add AI agent (product ID=1) to cart"
ADD_RESPONSE=$(curl -s -X POST "$API_BASE/marketplace/cart" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product_id":1}')

echo "$ADD_RESPONSE"

if echo "$ADD_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Product added to cart"
else
  echo "⚠️  Add to cart response (may be already purchased or in cart)"
fi
echo ""

# Step 3: View cart
echo "Step 3: View cart"
CART_RESPONSE=$(curl -s -X GET "$API_BASE/marketplace/cart" \
  -H "Authorization: Bearer $TOKEN")

echo "$CART_RESPONSE"
CART_COUNT=$(echo $CART_RESPONSE | grep -o '"cart_items":\[.*\]' | wc -c)
echo "Cart items count: $CART_COUNT"
echo ""

# Step 4: Checkout
echo "Step 4: Attempt checkout"
CHECKOUT_RESPONSE=$(curl -s -X POST "$API_BASE/marketplace/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"payment_method":"paypal"}')

echo "$CHECKOUT_RESPONSE"

if echo "$CHECKOUT_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Checkout successful!"
  PURCHASE_ID=$(echo $CHECKOUT_RESPONSE | grep -o '"purchase_id":[0-9]*' | cut -d':' -f2)
  echo "Purchase ID: $PURCHASE_ID"
else
  echo "❌ Checkout failed!"
  ERROR=$(echo $CHECKOUT_RESPONSE | grep -o '"error":"[^"]*' | cut -d'"' -f4)
  echo "Error details:"
  echo "$ERROR"
  echo "$CHECKOUT_RESPONSE"
fi
echo ""

# Step 5: Check PM2 logs for any errors
echo "=== Checking PM2 Logs for Errors ==="
pm2 logs review-system --nostream --lines 40 | grep -A 5 "ERROR\|error\|Error"

