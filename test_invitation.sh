#!/bin/bash

BASE_URL="http://localhost:3000"

# Step 1: Login (假设已有测试用户)
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')

if [ "$TOKEN" == "null" ]; then
  echo "Login failed. Creating test user..."
  REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","username":"Test User"}')
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
  USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
fi

echo "Token: $TOKEN"
echo "User ID: $USER_ID"

# Step 2: Create a test review
echo -e "\nStep 2: Creating test review..."
REVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Review for Invitation","description":"Testing invitation feature","status":"completed","template_id":1,"answers":{"1":"Test answer 1","2":"Test answer 2"}}')

REVIEW_ID=$(echo "$REVIEW_RESPONSE" | jq -r '.id')
echo "Review ID: $REVIEW_ID"

# Step 3: Create invitation
echo -e "\nStep 3: Creating invitation..."
INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/invitations/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"review_id\":$REVIEW_ID}")

echo "Invitation Response:"
echo "$INVITE_RESPONSE" | jq .

INVITE_TOKEN=$(echo "$INVITE_RESPONSE" | jq -r '.token')
INVITE_URL=$(echo "$INVITE_RESPONSE" | jq -r '.url')
EXPIRES_AT=$(echo "$INVITE_RESPONSE" | jq -r '.expires_at')

echo -e "\nInvitation created:"
echo "Token: $INVITE_TOKEN"
echo "URL: $INVITE_URL"
echo "Expires at: $EXPIRES_AT"

# Step 4: Immediately verify the invitation (should work)
echo -e "\nStep 4: Verifying invitation immediately..."
VERIFY_RESPONSE=$(curl -s "$BASE_URL/api/invitations/verify/$INVITE_TOKEN")
echo "Verification Response:"
echo "$VERIFY_RESPONSE" | jq .

# Check if verification succeeded
ERROR=$(echo "$VERIFY_RESPONSE" | jq -r '.error // empty')
if [ -n "$ERROR" ]; then
  echo -e "\n❌ ERROR: Invitation verification failed!"
  echo "Error message: $ERROR"
  
  # Debug: Check database
  echo -e "\nDebug: Checking database..."
  npx wrangler d1 execute review-system-production --local --command="SELECT token, created_at, expires_at, datetime('now') as current_time FROM invitations WHERE token='$INVITE_TOKEN'" 2>&1 | grep -A 20 "results"
else
  echo -e "\n✅ SUCCESS: Invitation verified successfully!"
fi
