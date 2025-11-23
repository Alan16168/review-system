#!/bin/bash

# 测试 Gemini API Key 是否有效

# 从 .dev.vars 读取 API Key
source .dev.vars

echo "Testing Gemini API Key..."
echo "API Key: ${GEMINI_API_KEY:0:20}..."

# 测试 Gemini API
response=$(curl -s -w "\n%{http_code}" \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello"
      }]
    }]
  }')

# 分离响应体和状态码
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo ""
echo "HTTP Status Code: $http_code"
echo ""
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

if [ "$http_code" = "200" ]; then
  echo ""
  echo "✅ Gemini API Key is valid!"
else
  echo ""
  echo "❌ Gemini API Key test failed!"
  echo ""
  echo "Possible causes:"
  echo "1. API Key is invalid or expired"
  echo "2. API Key doesn't have Gemini API enabled"
  echo "3. API quota exceeded"
  echo "4. Billing not enabled on Google Cloud project"
  echo ""
  echo "Please visit:"
  echo "- Get new API key: https://aistudio.google.com/app/apikey"
  echo "- Enable billing: https://console.cloud.google.com/billing"
fi
