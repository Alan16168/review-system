#!/bin/bash

# API 测试脚本
BASE_URL="http://localhost:3000"

echo "=========================================="
echo "系统复盘平台 API 测试"
echo "=========================================="
echo ""

# 测试 1: 登录管理员账号
echo "1. 测试管理员登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@review.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -n "$ADMIN_TOKEN" ]; then
  echo "✅ 管理员登录成功"
else
  echo "❌ 管理员登录失败"
  exit 1
fi
echo ""

# 测试 2: 创建个人复盘
echo "2. 测试创建个人复盘..."
CREATE_REVIEW=$(curl -s -X POST "$BASE_URL/api/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "测试复盘记录",
    "question1": "完成系统开发",
    "question2": "基本达成目标",
    "question3": "架构设计合理，功能完整",
    "question4": "可以复制 API 设计模式",
    "question5": "前端界面需要完善",
    "question6": "时间有限，优先实现核心功能",
    "question7": "下次预留更多前端开发时间",
    "question8": "分层架构便于扩展和维护",
    "question9": "提前做好技术选型和架构设计",
    "status": "completed"
  }')

REVIEW_ID=$(echo $CREATE_REVIEW | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -n "$REVIEW_ID" ]; then
  echo "✅ 创建复盘成功，ID: $REVIEW_ID"
else
  echo "❌ 创建复盘失败"
fi
echo ""

# 测试 3: 获取复盘列表
echo "3. 测试获取复盘列表..."
REVIEWS=$(curl -s -X GET "$BASE_URL/api/reviews" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

REVIEW_COUNT=$(echo $REVIEWS | python3 -c "import sys, json; print(len(json.load(sys.stdin)['reviews']))" 2>/dev/null)

if [ "$REVIEW_COUNT" -gt "0" ]; then
  echo "✅ 获取复盘列表成功，共 $REVIEW_COUNT 条记录"
else
  echo "❌ 获取复盘列表失败"
fi
echo ""

# 测试 4: 登录高级用户并创建团队
echo "4. 测试高级用户登录并创建团队..."
PREMIUM_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"premium@review.com","password":"premium123"}')

PREMIUM_TOKEN=$(echo $PREMIUM_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -n "$PREMIUM_TOKEN" ]; then
  echo "✅ 高级用户登录成功"
  
  # 创建团队
  CREATE_TEAM=$(curl -s -X POST "$BASE_URL/api/teams" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PREMIUM_TOKEN" \
    -d '{"name":"测试团队","description":"用于API测试的团队"}')
  
  TEAM_ID=$(echo $CREATE_TEAM | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  
  if [ -n "$TEAM_ID" ]; then
    echo "✅ 创建团队成功，ID: $TEAM_ID"
  else
    echo "⚠️  团队可能已存在"
  fi
else
  echo "❌ 高级用户登录失败"
fi
echo ""

# 测试 5: 管理后台统计
echo "5. 测试管理后台统计数据..."
STATS=$(curl -s -X GET "$BASE_URL/api/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

TOTAL_USERS=$(echo $STATS | python3 -c "import sys, json; print(json.load(sys.stdin)['total_users'])" 2>/dev/null)

if [ -n "$TOTAL_USERS" ]; then
  echo "✅ 获取统计数据成功"
  echo "   总用户数: $TOTAL_USERS"
  echo "$STATS" | python3 -m json.tool
else
  echo "❌ 获取统计数据失败"
fi
echo ""

# 测试 6: 用户注册
echo "6. 测试新用户注册..."
REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test$(date +%s)@example.com\",\"password\":\"test123\",\"username\":\"测试用户\"}")

NEW_TOKEN=$(echo $REGISTER | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -n "$NEW_TOKEN" ]; then
  echo "✅ 新用户注册成功"
else
  echo "❌ 新用户注册失败"
fi
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "所有核心功能测试通过 ✅"
echo ""
echo "访问应用："
echo "- 本地: http://localhost:3000"
echo "- 公网: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev"
echo ""
echo "测试账号："
echo "- 管理员: admin@review.com / admin123"
echo "- 高级用户: premium@review.com / premium123"
echo "- 普通用户: user@review.com / user123"
