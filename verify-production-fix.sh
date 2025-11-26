#!/bin/bash

# 生产环境修复验证脚本
# 用于验证数据库字段是否正确添加

echo "============================================"
echo "生产数据库修复验证脚本"
echo "============================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0

# 验证函数
verify() {
    local test_name="$1"
    local command="$2"
    
    echo -n "测试: $test_name ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAIL++))
    fi
}

echo "第一部分: 验证 reviews 表字段"
echo "----------------------------------------"

# 1. 验证 created_by 字段
verify "reviews.created_by 字段存在" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT created_by FROM reviews LIMIT 1;'"

# 2. 验证 is_locked 字段
verify "reviews.is_locked 字段存在" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT is_locked FROM reviews LIMIT 1;'"

# 3. 验证 allow_multiple_answers 字段
verify "reviews.allow_multiple_answers 字段存在" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT allow_multiple_answers FROM reviews LIMIT 1;'"

echo ""
echo "第二部分: 验证 review_answer_sets 表字段"
echo "----------------------------------------"

# 4. 验证 answer set is_locked 字段
verify "review_answer_sets.is_locked 字段存在" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT is_locked FROM review_answer_sets LIMIT 1;'"

# 5. 验证 locked_at 字段
verify "review_answer_sets.locked_at 字段存在" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT locked_at FROM review_answer_sets LIMIT 1;'"

# 6. 验证 locked_by 字段
verify "review_answer_sets.locked_by 字段存在" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT locked_by FROM review_answer_sets LIMIT 1;'"

echo ""
echo "第三部分: 验证数据完整性"
echo "----------------------------------------"

# 7. 验证 review 275 可以查询
verify "Review 275 可以查询" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT id, title FROM reviews WHERE id = 275;' | grep -q '富士达公司周报'"

# 8. 验证 created_by 值已更新
verify "reviews 表 created_by 值已填充" \
    "npx wrangler d1 execute review-system-production --remote --command='SELECT COUNT(*) as count FROM reviews WHERE created_by IS NOT NULL;' | grep -q '\"count\": 16'"

echo ""
echo "第四部分: 验证 API 端点"
echo "----------------------------------------"

# 9. 验证公开 API 端点
verify "API 端点正常响应" \
    "curl -s 'https://review-system.pages.dev/api/subscription/config' | grep -q 'plans'"

# 10. 验证需要认证的端点返回 401
verify "认证端点返回 401 (正常)" \
    "curl -s 'https://review-system.pages.dev/api/reviews/275' | grep -q 'Unauthorized'"

echo ""
echo "============================================"
echo "验证结果汇总"
echo "============================================"
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！数据库修复成功！${NC}"
    exit 0
else
    echo -e "${RED}⚠️ 有 $FAIL 个测试失败，请检查日志${NC}"
    exit 1
fi
