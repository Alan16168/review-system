#!/bin/bash

echo "=========================================="
echo "完整功能验证脚本 - v5.27.0"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "测试: $name ... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected, Got: $response)"
        ((FAILED++))
    fi
}

test_json_field() {
    local name=$1
    local url=$2
    local field=$3
    local expected=$4
    
    echo -n "测试: $name ... "
    response=$(curl -s "$url" | jq -r "$field")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected, Got: $response)"
        ((FAILED++))
    fi
}

echo "1. 测试基础 API 端点"
echo "-------------------------------------------"
test_api "主页访问" "http://localhost:3000/" "200"
test_api "订阅配置 API" "http://localhost:3000/api/subscription/config" "200"
echo ""

echo "2. 测试价格配置"
echo "-------------------------------------------"
test_json_field "高级会员年费" "http://localhost:3000/api/subscription/config" '.plans[] | select(.tier == "premium") | .price_usd' "20"
test_json_field "高级会员续费" "http://localhost:3000/api/subscription/config" '.plans[] | select(.tier == "premium") | .renewal_price_usd' "20"
test_json_field "超级会员年费" "http://localhost:3000/api/subscription/config" '.plans[] | select(.tier == "super") | .price_usd' "120"
test_json_field "超级会员续费" "http://localhost:3000/api/subscription/config" '.plans[] | select(.tier == "super") | .renewal_price_usd' "100"
echo ""

echo "3. 测试生产环境"
echo "-------------------------------------------"
test_api "生产主页访问" "https://review-system.pages.dev/" "200"
test_api "生产订阅 API" "https://review-system.pages.dev/api/subscription/config" "200"
echo ""

echo "4. 测试价格方案名称"
echo "-------------------------------------------"
test_json_field "高级会员名称" "https://review-system.pages.dev/api/subscription/config" '.plans[] | select(.tier == "premium") | .name' "高级会员"
test_json_field "超级会员名称" "https://review-system.pages.dev/api/subscription/config" '.plans[] | select(.tier == "super") | .name' "超级会员"
echo ""

echo "=========================================="
echo "验证结果总结"
echo "=========================================="
echo -e "${GREEN}通过测试: $PASSED${NC}"
echo -e "${RED}失败测试: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！系统工作正常。${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED 个测试失败，请检查系统配置。${NC}"
    exit 1
fi
