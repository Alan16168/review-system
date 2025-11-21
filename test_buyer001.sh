#!/bin/bash

API_BASE="http://localhost:3000/api"
EMAIL="buyer001@test.com"
PASSWORD="test1234"

echo "=== Testing Complete Purchase Flow ==="
echo ""

# Step 1: Login
echo "Step 1: Login"
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi
echo "✅ Login successful"
echo ""

# Step 2: Add AI agent (ID=1) to cart
echo "Step 2: Add AI agent (ID=1) to cart"
ADD_RESPONSE=$(curl -s -X POST "$API_BASE/marketplace/cart" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product_id":1}')
echo "$ADD_RESPONSE"
echo ""

# Step 3: View cart
echo "Step 3: View cart"
CART_RESPONSE=$(curl -s -X GET "$API_BASE/marketplace/cart" \
  -H "Authorization: Bearer $TOKEN")
echo "$CART_RESPONSE"
echo ""

# Step 4: Checkout
echo "Step 4: Checkout"
CHECKOUT_RESPONSE=$(curl -s -X POST "$API_BASE/marketplace/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"payment_method":"paypal"}')
echo "$CHECKOUT_RESPONSE"
echo ""

# Step 5: Verify purchase in database
echo "Step 5: Verify purchase records"
echo "--- user_purchases table ---"
npx wrangler d1 execute review-system-production --local --command="SELECT * FROM user_purchases WHERE user_id = 5;" 2>/dev/null | tail -n +6
echo ""
echo "--- product_buyers table ---"
npx wrangler d1 execute review-system-production --local --command="SELECT * FROM product_buyers WHERE user_email = '$EMAIL';" 2>/dev/null | tail -n +6
echo ""

# Step 6: Check PM2 logs
echo "Step 6: Check recent PM2 logs"
pm2 logs review-system --nostream --lines 20 | grep -E "(Checkout|checkout|product_id|FOREIGN KEY)" | tail -n 10

