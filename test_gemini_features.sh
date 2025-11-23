#!/bin/bash

# 测试 Gemini API 集成功能

echo "======================================"
echo "  Gemini API 功能测试"
echo "======================================"
echo ""

# 从 .dev.vars 读取配置
source .dev.vars

BASE_URL="http://localhost:3000"

echo "🔍 测试环境: $BASE_URL"
echo "🔑 API Key: ${GEMINI_API_KEY:0:20}..."
echo ""

# 1. 测试首页
echo "1️⃣  测试首页..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/)
if [ "$response" = "200" ]; then
  echo "   ✅ 首页正常 (HTTP $response)"
else
  echo "   ❌ 首页异常 (HTTP $response)"
fi
echo ""

# 2. 测试 Gemini API 直接调用
echo "2️⃣  测试 Gemini API 直接调用..."
gemini_response=$(curl -s \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"你好"}]}]}')

if echo "$gemini_response" | grep -q "candidates"; then
  echo "   ✅ Gemini API 响应正常"
  echo "   📝 响应预览: $(echo "$gemini_response" | jq -r '.candidates[0].content.parts[0].text' | head -1)"
else
  echo "   ❌ Gemini API 响应异常"
  echo "   📝 错误信息: $gemini_response"
fi
echo ""

# 3. 测试名著文档分析 API（需要登录，这里只测试端点是否存在）
echo "3️⃣  测试名著文档分析端点..."
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/reviews/famous-books/analyze" \
  -H "Content-Type: application/json" \
  -d '{"content":"测试内容"}')

if [ "$response" = "401" ]; then
  echo "   ✅ 端点存在 (需要认证，HTTP $response)"
elif [ "$response" = "200" ]; then
  echo "   ✅ 端点正常 (HTTP $response)"
else
  echo "   ⚠️  端点返回: HTTP $response"
fi
echo ""

# 4. 查看服务状态
echo "4️⃣  PM2 服务状态..."
pm2 list | grep review-system
echo ""

# 5. 检查最近的错误日志
echo "5️⃣  检查最近的错误日志..."
error_count=$(pm2 logs review-system --nostream --lines 50 --err | grep -i "403\|forbidden\|error" | wc -l)
if [ "$error_count" -gt 0 ]; then
  echo "   ⚠️  发现 $error_count 个错误日志"
  echo "   查看详情: pm2 logs review-system --nostream --lines 50 --err"
else
  echo "   ✅ 无错误日志"
fi
echo ""

# 总结
echo "======================================"
echo "  测试完成"
echo "======================================"
echo ""
echo "📝 详细日志: pm2 logs review-system --nostream"
echo "🌐 访问应用: $BASE_URL"
echo "🌐 公共访问: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev"
echo ""
echo "功能测试路径:"
echo "  - 名著文档复盘: $BASE_URL/famous-books-documents"
echo "  - AI 对话: $BASE_URL/ai-library"
echo ""
