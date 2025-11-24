#!/bin/bash

echo "=========================================="
echo "价格方案验证脚本"
echo "=========================================="
echo ""

echo "1. 测试本地开发环境 API..."
echo "-------------------------------------------"
LOCAL_RESPONSE=$(curl -s http://localhost:3000/api/subscription/config)
if [ $? -eq 0 ]; then
    echo "✅ 本地 API 可访问"
    echo "$LOCAL_RESPONSE" | jq '.plans[] | {tier, name, price_usd, renewal_price_usd}'
else
    echo "❌ 本地 API 不可访问"
fi
echo ""

echo "2. 测试生产环境 API..."
echo "-------------------------------------------"
PROD_RESPONSE=$(curl -s https://review-system.pages.dev/api/subscription/config)
if [ $? -eq 0 ]; then
    echo "✅ 生产 API 可访问"
    echo "$PROD_RESPONSE" | jq '.plans[] | {tier, name, price_usd, renewal_price_usd}'
else
    echo "❌ 生产 API 不可访问"
fi
echo ""

echo "3. 验证价格配置..."
echo "-------------------------------------------"
PREMIUM_PRICE=$(echo "$PROD_RESPONSE" | jq -r '.plans[] | select(.tier == "premium") | .price_usd')
PREMIUM_RENEWAL=$(echo "$PROD_RESPONSE" | jq -r '.plans[] | select(.tier == "premium") | .renewal_price_usd')
SUPER_PRICE=$(echo "$PROD_RESPONSE" | jq -r '.plans[] | select(.tier == "super") | .price_usd')
SUPER_RENEWAL=$(echo "$PROD_RESPONSE" | jq -r '.plans[] | select(.tier == "super") | .renewal_price_usd')

echo "高级会员价格: $${PREMIUM_PRICE} (年费) / $${PREMIUM_RENEWAL} (续费)"
echo "超级会员价格: $${SUPER_PRICE} (年费) / $${SUPER_RENEWAL} (续费)"

if [ "$PREMIUM_PRICE" = "20" ] && [ "$PREMIUM_RENEWAL" = "20" ] && \
   [ "$SUPER_PRICE" = "120" ] && [ "$SUPER_RENEWAL" = "100" ]; then
    echo "✅ 价格配置正确"
else
    echo "❌ 价格配置不正确"
fi
echo ""

echo "=========================================="
echo "验证完成！"
echo "=========================================="
