#!/bin/bash

# PayPal 配置测试脚本
# 用于验证 PayPal 配置是否正确

echo "================================================"
echo "PayPal 配置测试"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试 1: 检查 .dev.vars 文件
echo "测试 1: 检查 .dev.vars 文件..."
if [ -f .dev.vars ]; then
    echo -e "${GREEN}✓${NC} .dev.vars 文件存在"
else
    echo -e "${RED}✗${NC} .dev.vars 文件不存在"
    exit 1
fi
echo ""

# 测试 2: 检查 PayPal 环境变量
echo "测试 2: 检查 PayPal 环境变量..."
if grep -q "PAYPAL_CLIENT_ID=" .dev.vars && \
   grep -q "PAYPAL_CLIENT_SECRET=" .dev.vars && \
   grep -q "PAYPAL_MODE=" .dev.vars; then
    echo -e "${GREEN}✓${NC} PayPal 环境变量已配置"
    
    # 显示配置（隐藏敏感信息）
    CLIENT_ID=$(grep "PAYPAL_CLIENT_ID=" .dev.vars | cut -d'=' -f2)
    MODE=$(grep "PAYPAL_MODE=" .dev.vars | cut -d'=' -f2)
    
    echo "  - PAYPAL_MODE: $MODE"
    echo "  - PAYPAL_CLIENT_ID: ${CLIENT_ID:0:20}...${CLIENT_ID: -10}"
    echo "  - PAYPAL_CLIENT_SECRET: [已配置]"
else
    echo -e "${RED}✗${NC} PayPal 环境变量未完全配置"
    exit 1
fi
echo ""

# 测试 3: 检查服务运行状态
echo "测试 3: 检查服务运行状态..."
if pm2 list | grep -q "review-system.*online"; then
    echo -e "${GREEN}✓${NC} review-system 服务正在运行"
else
    echo -e "${RED}✗${NC} review-system 服务未运行"
    echo "提示: 运行 'pm2 restart review-system' 启动服务"
    exit 1
fi
echo ""

# 测试 4: 测试服务响应
echo "测试 4: 测试服务响应..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo -e "${GREEN}✓${NC} 服务可访问 (http://localhost:3000)"
else
    echo -e "${RED}✗${NC} 服务无法访问"
    exit 1
fi
echo ""

# 测试 5: 检查 PayPal SDK 加载
echo "测试 5: 检查 PayPal SDK 加载..."
PAYPAL_SDK=$(curl -s http://localhost:3000/ | grep "paypal.com/sdk")
if [ ! -z "$PAYPAL_SDK" ]; then
    echo -e "${GREEN}✓${NC} PayPal SDK 已加载到前端"
    
    # 提取 Client ID
    LOADED_CLIENT_ID=$(echo "$PAYPAL_SDK" | grep -oP 'client-id=\K[^&"]+')
    if [ ! -z "$LOADED_CLIENT_ID" ]; then
        echo "  - Client ID: ${LOADED_CLIENT_ID:0:20}...${LOADED_CLIENT_ID: -10}"
    fi
else
    echo -e "${RED}✗${NC} PayPal SDK 未加载"
    exit 1
fi
echo ""

# 测试 6: 检查 PayPal API 端点
echo "测试 6: 检查 PayPal 相关 API 端点..."
echo -e "${YELLOW}ℹ${NC} 需要认证的端点，无法直接测试"
echo "  - /api/payment/subscription/info"
echo "  - /api/payment/subscription/create-order"
echo "  - /api/payment/cart/create-order"
echo ""

# 测试总结
echo "================================================"
echo -e "${GREEN}✓ 所有测试通过！${NC}"
echo "================================================"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 获取 PayPal 测试账号："
echo "   访问: https://developer.paypal.com/"
echo "   进入: Sandbox → Accounts"
echo "   找到 Personal 类型的测试账号"
echo ""
echo "2. 测试购物车功能："
echo "   - 访问: http://localhost:3000"
echo "   - 登录: user@review.com / user123"
echo "   - 点击"升级"按钮添加到购物车"
echo "   - 打开购物车"
echo "   - 点击"结算"按钮"
echo "   - 验证 PayPal 按钮显示"
echo ""
echo "3. 测试完整支付流程："
echo "   - 点击 PayPal 按钮"
echo "   - 使用测试账号登录"
echo "   - 完成支付"
echo "   - 验证用户升级"
echo ""
echo "4. 配置生产环境："
echo "   查看: PAYPAL_CONFIG_CONFIRMED.md"
echo ""
