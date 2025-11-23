#!/bin/bash

# 名著复盘功能演示脚本
# Version: 8.4.0

set -e

echo "================================================"
echo "  名著复盘功能演示"
echo "  - Genspark AI 集成（带降级）"
echo "  - 编辑功能"
echo "  - 用户数据隔离"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查服务状态
echo -e "${BLUE}1. 检查服务状态...${NC}"
if curl -s http://localhost:3000 | grep -q "系统复盘"; then
    echo -e "${GREEN}✅ 服务运行正常${NC}"
else
    echo -e "${RED}❌ 服务未运行，请先启动服务${NC}"
    exit 1
fi
echo ""

# 检查数据库
echo -e "${BLUE}2. 检查数据库状态...${NC}"
cd /home/user/webapp
USER_COUNT=$(npx wrangler d1 execute review-system-production --local --command="SELECT COUNT(*) as count FROM users" 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo -e "   用户数量: ${GREEN}${USER_COUNT}${NC}"

REVIEW_COUNT=$(npx wrangler d1 execute review-system-production --local --command="SELECT COUNT(*) as count FROM reviews WHERE review_type='famous-book'" 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo -e "   名著复盘记录: ${GREEN}${REVIEW_COUNT}${NC}"
echo ""

# 显示用户列表
echo -e "${BLUE}3. 测试用户列表:${NC}"
echo "   查询数据库中的用户..."
npx wrangler d1 execute review-system-production --local --command="SELECT id, username, email, role, subscription_tier FROM users LIMIT 5" 2>&1 | grep -A 20 "results"
echo ""

# 显示现有复盘记录
echo -e "${BLUE}4. 现有名著复盘记录:${NC}"
if [ "$REVIEW_COUNT" -gt 0 ]; then
    npx wrangler d1 execute review-system-production --local --command="SELECT id, title, user_id, status, created_at FROM reviews WHERE review_type='famous-book' ORDER BY created_at DESC LIMIT 5" 2>&1 | grep -A 30 "results"
else
    echo -e "   ${YELLOW}暂无记录${NC}"
fi
echo ""

# 检查环境变量配置
echo -e "${BLUE}5. 检查环境变量配置:${NC}"
if [ -f .dev.vars ]; then
    echo -e "   ${GREEN}✅ .dev.vars 文件存在${NC}"
    
    if grep -q "GEMINI_API_KEY=AIzaSy" .dev.vars; then
        echo -e "   ${GREEN}✅ Gemini API Key: 已配置${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Gemini API Key: 未配置${NC}"
    fi
    
    if grep -q "GENSPARK_API_KEY=your-genspark" .dev.vars; then
        echo -e "   ${YELLOW}⚠️  Genspark API Key: 使用占位符（将降级到 Gemini）${NC}"
    elif grep -q "GENSPARK_API_KEY=sk-" .dev.vars || grep -q "GENSPARK_API_KEY=gs-" .dev.vars; then
        echo -e "   ${GREEN}✅ Genspark API Key: 已配置${NC}"
    else
        echo -e "   ${RED}❌ Genspark API Key: 未配置${NC}"
    fi
    
    if grep -q "YOUTUBE_API_KEY=AIzaSy" .dev.vars; then
        echo -e "   ${GREEN}✅ YouTube API Key: 已配置${NC}"
    else
        echo -e "   ${YELLOW}⚠️  YouTube API Key: 未配置${NC}"
    fi
else
    echo -e "   ${RED}❌ .dev.vars 文件不存在${NC}"
fi
echo ""

# PM2 服务状态
echo -e "${BLUE}6. PM2 服务状态:${NC}"
pm2 list | grep -A 5 "review-system" || echo "   服务未找到"
echo ""

# 测试 URL
echo -e "${BLUE}7. 访问地址:${NC}"
echo -e "   ${GREEN}本地开发:${NC} http://localhost:3000"
echo -e "   ${GREEN}生产环境:${NC} https://4f25c95d.review-system.pages.dev"
echo ""

# 功能测试指南
echo -e "${BLUE}8. 功能测试步骤:${NC}"
echo ""
echo -e "${YELLOW}📝 测试步骤 1: 创建名著复盘${NC}"
echo "   1. 访问: http://localhost:3000"
echo "   2. 使用以下账号登录:"
echo "      - Email: admin@example.com"
echo "      - Password: password123"
echo "   3. 点击 '名著复盘' 标签"
echo "   4. 点击 '新增复盘' 按钮"
echo "   5. 选择 '视频链接'"
echo "   6. 输入: https://www.youtube.com/watch?v=xNp-90JImAU"
echo "   7. 填写表单并点击 '生成 Prompt'"
echo "   8. 点击 '生成分析'"
echo "   9. 等待分析完成（约 30-60 秒）"
echo ""

echo -e "${YELLOW}📝 测试步骤 2: 编辑功能${NC}"
echo "   1. 在名著复盘列表中找到一条记录"
echo "   2. 点击 '编辑' 按钮（铅笔图标）"
echo "   3. 修改标题或内容"
echo "   4. 点击 '保存修改'"
echo "   5. 验证修改已保存"
echo ""

echo -e "${YELLOW}📝 测试步骤 3: 用户隔离验证${NC}"
echo "   1. 使用 Admin 账号创建记录"
echo "   2. 退出登录"
echo "   3. 使用另一个账号登录 (premium@example.com / password123)"
echo "   4. 验证看不到 Admin 的记录"
echo "   5. 创建自己的记录"
echo "   6. 验证只能看到自己的记录"
echo ""

echo -e "${YELLOW}📝 测试步骤 4: Genspark 降级机制${NC}"
echo "   1. 打开浏览器开发者工具 (F12)"
echo "   2. 切换到 Console 标签"
echo "   3. 创建视频分析"
echo "   4. 观察控制台日志:"
echo "      - 如果 Genspark 可用: '使用 Genspark API 分析...'"
echo "      - 如果降级: 'Falling back to Gemini...'"
echo "   5. 验证仍然成功生成分析"
echo ""

# 配置 Genspark API Key
echo -e "${BLUE}9. 配置 Genspark API Key (可选):${NC}"
echo ""
echo "如果你有 Genspark API Key，可以这样配置:"
echo ""
echo -e "${GREEN}# 编辑 .dev.vars 文件${NC}"
echo "vi .dev.vars"
echo ""
echo -e "${GREEN}# 找到这一行:${NC}"
echo "GENSPARK_API_KEY=your-genspark-api-key-here"
echo ""
echo -e "${GREEN}# 替换为你的实际 API Key:${NC}"
echo "GENSPARK_API_KEY=gs-xxxxxxxxxxxxxxxxxxxx"
echo ""
echo -e "${GREEN}# 保存后重启服务:${NC}"
echo "fuser -k 3000/tcp || true"
echo "pm2 restart review-system"
echo ""

# API 端点测试
echo -e "${BLUE}10. API 端点参考:${NC}"
echo ""
echo -e "${GREEN}GET${NC}    /api/reviews/famous-books          # 获取列表"
echo -e "${GREEN}POST${NC}   /api/reviews/famous-books/analyze  # AI 分析"
echo -e "${GREEN}POST${NC}   /api/reviews/famous-books/save     # 保存记录"
echo -e "${GREEN}PUT${NC}    /api/reviews/famous-books/:id      # 编辑记录"
echo -e "${GREEN}GET${NC}    /api/reviews/:id                   # 查看详情"
echo -e "${GREEN}DELETE${NC} /api/reviews/:id                   # 删除记录"
echo ""

echo "================================================"
echo -e "${GREEN}✅ 演示脚本执行完成！${NC}"
echo "================================================"
echo ""
echo -e "详细测试指南: ${BLUE}test_genspark_features.md${NC}"
echo -e "项目文档: ${BLUE}README.md${NC}"
echo ""
