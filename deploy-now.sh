#!/bin/bash
set -e

echo "🚀 开始直接部署到 Cloudflare Pages..."
echo ""

# 设置 Token
export CLOUDFLARE_API_TOKEN="E_R_l4LN5Lb7Yt5PzaKdZdjOUvlxyoFrlfLpSkMs"

# 项目配置
PROJECT_NAME="review-system"

echo "✅ 1/5: Cloudflare Token 已配置"
echo ""

echo "🔨 2/5: 构建项目..."
npm run build
echo ""

echo "📦 3/5: 创建 D1 数据库..."
npx wrangler d1 create review-system-production
echo ""
echo "⚠️  请复制上面输出中的 database_id，我们稍后需要用到！"
echo ""
read -p "按 Enter 继续..."

echo "🚀 4/5: 创建 Pages 项目..."
npx wrangler pages project create $PROJECT_NAME --production-branch main --compatibility-date 2025-10-07 || echo "项目可能已存在，继续..."
echo ""

echo "🌐 5/5: 部署到生产环境..."
npx wrangler pages deploy dist --project-name $PROJECT_NAME
echo ""

echo "🎉 部署完成！"
echo ""
echo "生产 URL: https://$PROJECT_NAME.pages.dev"
echo ""
echo "⚠️  下一步："
echo "1. 配置环境变量"
echo "2. 绑定 D1 数据库"
echo "3. 更新 Google OAuth"

