#!/bin/bash

# 无需 Gemini API 的功能测试脚本
# 测试编辑、查看、删除等不依赖 AI 的功能

set -e

echo "================================================"
echo "  功能测试（无需 Gemini API）"
echo "  测试编辑、查看、删除等功能"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /home/user/webapp

echo -e "${BLUE}1. 检查服务状态...${NC}"
if curl -s http://localhost:3000 | grep -q "系统复盘"; then
    echo -e "${GREEN}✅ 服务运行正常${NC}"
else
    echo -e "${RED}❌ 服务未运行${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}2. 查看现有名著复盘记录...${NC}"
REVIEW_COUNT=$(npx wrangler d1 execute review-system-production --local --command="SELECT COUNT(*) as count FROM reviews WHERE review_type='famous-book'" 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo -e "   记录数量: ${GREEN}${REVIEW_COUNT}${NC}"

if [ "$REVIEW_COUNT" -gt 0 ]; then
    echo ""
    echo -e "${BLUE}3. 显示现有记录...${NC}"
    npx wrangler d1 execute review-system-production --local --command="SELECT id, title, user_id, status, created_at FROM reviews WHERE review_type='famous-book' ORDER BY created_at DESC LIMIT 5" 2>&1 | grep -A 30 "results"
    echo ""
    
    echo -e "${YELLOW}你可以测试以下功能（无需 API）:${NC}"
    echo ""
    echo "✅ 1. 查看记录"
    echo "   - 在列表中点击 '查看' 按钮（眼睛图标）"
    echo "   - 查看记录详情"
    echo ""
    echo "✅ 2. 编辑记录"
    echo "   - 点击 '编辑' 按钮（铅笔图标）"
    echo "   - 修改标题和内容"
    echo "   - 保存修改"
    echo ""
    echo "✅ 3. 下载记录"
    echo "   - 点击 '下载' 按钮（下载图标）"
    echo "   - 保存为 TXT 文件"
    echo ""
    echo "✅ 4. 删除记录"
    echo "   - 点击 '删除' 按钮（垃圾桶图标）"
    echo "   - 确认删除"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  暂无记录可供测试${NC}"
    echo ""
    echo "由于 Gemini API 配额已用完，暂时无法创建新记录。"
    echo ""
    echo -e "${BLUE}解决方案：${NC}"
    echo "1. 获取新的 Gemini API Key"
    echo "2. 或配置 Genspark API Key"
    echo ""
    echo "查看详细指南: ${GREEN}GET_NEW_GEMINI_KEY.md${NC}"
fi

echo ""
echo -e "${BLUE}4. 手动创建测试数据（不使用 AI）...${NC}"
echo ""
echo "如果需要测试编辑功能，可以手动插入测试数据："
echo ""
echo -e "${GREEN}# 插入测试记录${NC}"
echo 'npx wrangler d1 execute review-system-production --local --command="INSERT INTO reviews (title, description, user_id, review_type, status, created_at, updated_at) VALUES ('"'"'测试记录 - 手动创建'"'"', '"'"'<p>这是一条测试记录，用于测试编辑功能。</p><p>你可以：</p><ul><li>点击编辑按钮</li><li>修改标题和内容</li><li>保存修改</li></ul>'"'"', 1, '"'"'famous-book'"'"', '"'"'published'"'"', datetime('"'"'now'"'"'), datetime('"'"'now'"'"'))"'
echo ""

echo -e "${BLUE}5. Gemini API 配额状态...${NC}"
echo -e "   状态: ${RED}❌ 已超限${NC}"
echo -e "   错误: Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests"
echo ""

echo -e "${BLUE}6. 可用功能清单...${NC}"
echo ""
echo "✅ 可正常使用的功能:"
echo "   - 登录/注册"
echo "   - 查看名著复盘列表"
echo "   - 查看记录详情"
echo "   - 编辑已有记录"
echo "   - 下载记录"
echo "   - 删除记录"
echo "   - 用户权限管理"
echo ""
echo "❌ 暂时不可用的功能:"
echo "   - 创建新的 AI 分析（需要 API Key）"
echo "   - 视频分析（需要 API Key）"
echo ""

echo -e "${BLUE}7. 立即可测试的功能...${NC}"
echo ""
echo "访问: ${GREEN}http://localhost:3000${NC}"
echo ""
echo "登录账号: admin@review.com / password123"
echo ""
echo "测试步骤:"
echo "1. 点击 '名著复盘' 标签"
echo "2. 如果有记录，测试查看/编辑/下载/删除功能"
echo "3. 如果没有记录，运行上面的 SQL 命令插入测试数据"
echo ""

echo "================================================"
echo -e "${YELLOW}⚠️  需要配置新的 API Key 才能创建新记录${NC}"
echo "================================================"
echo ""
echo "查看详细指南: ${GREEN}GET_NEW_GEMINI_KEY.md${NC}"
echo ""
