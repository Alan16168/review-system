#!/bin/bash

# Cloudflare Pages 快速部署脚本
# 用法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署到 Cloudflare Pages..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="review-system"
PRODUCTION_BRANCH="main"

# 1. 检查环境
echo "📋 步骤 1/6: 检查部署环境..."
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx 未安装。请先安装 Node.js${NC}"
    exit 1
fi

# 检查 Cloudflare Token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  未检测到 CLOUDFLARE_API_TOKEN 环境变量${NC}"
    echo "请先配置: export CLOUDFLARE_API_TOKEN=\"your-token\""
    echo "或使用 GenSpark Deploy Tab 配置"
    exit 1
fi

echo -e "${GREEN}✅ 环境检查通过${NC}"
echo ""

# 2. Git 提交检查
echo "📝 步骤 2/6: 检查 Git 状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  存在未提交的更改${NC}"
    read -p "是否提交更改并继续? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "chore: prepare for production deployment"
        echo -e "${GREEN}✅ 更改已提交${NC}"
    else
        echo -e "${RED}❌ 部署取消${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Git 工作树干净${NC}"
fi
echo ""

# 3. 构建项目
echo "🔨 步骤 3/6: 构建生产版本..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败: dist 目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建完成${NC}"
echo ""

# 4. 检查/创建 Pages 项目
echo "📦 步骤 4/6: 检查 Cloudflare Pages 项目..."

# 尝试获取项目信息（如果存在）
if npx wrangler pages project list | grep -q "$PROJECT_NAME"; then
    echo -e "${GREEN}✅ 项目 $PROJECT_NAME 已存在${NC}"
else
    echo -e "${YELLOW}⚠️  项目不存在，正在创建...${NC}"
    npx wrangler pages project create "$PROJECT_NAME" \
        --production-branch "$PRODUCTION_BRANCH" \
        --compatibility-date 2025-10-07
    echo -e "${GREEN}✅ 项目创建成功${NC}"
fi
echo ""

# 5. 部署到 Cloudflare Pages
echo "🚀 步骤 5/6: 部署到生产环境..."
npx wrangler pages deploy dist --project-name "$PROJECT_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 部署成功!${NC}"
else
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi
echo ""

# 6. 显示部署信息
echo "📊 步骤 6/6: 部署信息..."
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}生产环境 URL:${NC}"
echo "  https://$PROJECT_NAME.pages.dev"
echo ""
echo -e "${BLUE}后续步骤:${NC}"
echo "  1. 访问生产环境 URL 测试"
echo "  2. 配置环境变量（如未配置）:"
echo "     npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name $PROJECT_NAME"
echo "  3. 绑定 D1 数据库（如未绑定）"
echo "  4. 更新 Google OAuth 授权域名"
echo ""
echo -e "${BLUE}查看部署详情:${NC}"
echo "  https://dash.cloudflare.com/pages"
echo ""
echo -e "${GREEN}✨ 祝您使用愉快！${NC}"
