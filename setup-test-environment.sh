#!/bin/bash

# 🚀 Review System 测试环境快速设置脚本
# 用途：一键配置测试环境，保护生产环境

set -e  # 遇到错误立即退出

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Review System 测试环境设置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "📍 当前位置：$(pwd)"
echo "📋 当前分支：$(git branch --show-current)"
echo ""

# Step 1: 锁定生产版本
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 Step 1: 锁定生产版本为 v6.12.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 确保在main分支
git checkout main

# 更新版本号
npm version 6.12.0 --no-git-tag-version --allow-same-version

# 提交
git add package.json
git commit -m "chore: Lock production version to v6.12.0" || echo "ℹ️  No changes to commit"

# 创建标签
git tag v6.12.0 -f
git tag production-stable -f -m "Production stable release - v6.12.0"

echo "✅ 生产版本已锁定为 v6.12.0"
echo ""

# Step 2: 创建develop分支
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌿 Step 2: 创建 develop 分支"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查develop分支是否已存在
if git show-ref --verify --quiet refs/heads/develop; then
    echo "ℹ️  develop分支已存在，切换到该分支"
    git checkout develop
else
    echo "📝 创建新的develop分支"
    git checkout -b develop
    
    # 更新版本号为7.0.0
    npm version 7.0.0 --no-git-tag-version --allow-same-version
    
    # 提交
    git add package.json
    git commit -m "chore: Start v7.0.0 development (Manhattan Project)" || echo "ℹ️  No changes to commit"
fi

echo "✅ develop 分支准备就绪"
echo ""

# Step 3: 更新package.json脚本
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 3: 更新 package.json 脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 备份原文件
cp package.json package.json.backup

# 使用Node.js更新scripts（更可靠）
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts['dev:test'] = 'wrangler pages dev dist --d1=review-system-test --local --ip 0.0.0.0 --port 3000';
pkg.scripts['deploy:test'] = 'npm run build && wrangler pages deploy dist --project-name test.review-system --branch develop --config wrangler.test.jsonc';
pkg.scripts['db:migrate:test'] = 'wrangler d1 migrations apply review-system-test';
pkg.scripts['db:migrate:test-local'] = 'wrangler d1 migrations apply review-system-test --local';
pkg.scripts['db:seed:test'] = 'wrangler d1 execute review-system-test --file=./seed.test.sql';
pkg.scripts['db:seed:test-local'] = 'wrangler d1 execute review-system-test --local --file=./seed.test.sql';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ package.json scripts updated');
"

echo "✅ package.json 脚本已更新"
echo ""

# Step 4: 提示创建测试数据库
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Step 4: 创建测试数据库"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  需要手动执行以下命令创建测试数据库："
echo ""
echo "npx wrangler d1 create review-system-test"
echo ""
echo "然后将输出的 database_id 复制到 wrangler.test.jsonc"
echo ""
read -p "按Enter继续（如果已创建数据库）..." dummy
echo ""

# Step 5: 创建测试配置文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Step 5: 创建测试环境配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > wrangler.test.jsonc << 'EOF'
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "test.review-system",
  "compatibility_date": "2025-10-07",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "review-system-test",
      "database_id": "REPLACE_WITH_YOUR_DATABASE_ID"
    }
  ]
}
EOF

echo "✅ wrangler.test.jsonc 已创建"
echo "⚠️  请手动替换其中的 database_id"
echo ""

# Step 6: 创建测试数据种子文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👥 Step 6: 创建测试用户数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > seed.test.sql << 'EOF'
-- seed.test.sql
-- 测试环境专用数据

-- 清空现有数据
DELETE FROM reviews;
DELETE FROM subscriptions;
DELETE FROM users;

-- 密码哈希（需要实际生成）
-- test-admin: Admin@123 → $2a$10$...
-- test-premium: Premium@123 → $2a$10$...
-- test-user: User@123 → $2a$10$...

-- 1. 管理员账号
INSERT INTO users (username, email, password, role, created_at) 
VALUES (
  'test-admin', 
  'admin@test.com',
  'REPLACE_WITH_HASHED_PASSWORD',
  'admin',
  CURRENT_TIMESTAMP
);

-- 2. 高级用户（Premium订阅）
INSERT INTO users (username, email, password, role, created_at) 
VALUES (
  'test-premium', 
  'premium@test.com',
  'REPLACE_WITH_HASHED_PASSWORD',
  'user',
  CURRENT_TIMESTAMP
);

-- 为高级用户创建Premium订阅
INSERT INTO subscriptions (
  user_id, 
  tier, 
  status, 
  current_period_start, 
  current_period_end,
  payment_method,
  created_at
) VALUES (
  (SELECT id FROM users WHERE username = 'test-premium'),
  'premium',
  'active',
  DATE('now'),
  DATE('now', '+1 year'),
  'test',
  CURRENT_TIMESTAMP
);

-- 3. 普通用户（免费版）
INSERT INTO users (username, email, password, role, created_at) 
VALUES (
  'test-user', 
  'user@test.com',
  'REPLACE_WITH_HASHED_PASSWORD',
  'user',
  CURRENT_TIMESTAMP
);

-- 为普通用户创建免费订阅
INSERT INTO subscriptions (
  user_id, 
  tier, 
  status, 
  created_at
) VALUES (
  (SELECT id FROM users WHERE username = 'test-user'),
  'free',
  'active',
  CURRENT_TIMESTAMP
);

-- 测试复盘数据
INSERT INTO reviews (user_id, title, status, created_at) 
SELECT id, username || '的测试复盘', 'draft', CURRENT_TIMESTAMP
FROM users;

-- 提示信息
SELECT '✅ 测试用户创建完成' as message;
EOF

echo "✅ seed.test.sql 已创建"
echo "⚠️  需要生成密码哈希并替换其中的密码"
echo ""

# Step 7: 提交所有更改
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Step 7: 提交更改到 Git"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git add package.json wrangler.test.jsonc seed.test.sql VERSION_MANAGEMENT.md
git commit -m "chore: Setup test environment for v7.0.0 development" || echo "ℹ️  No changes to commit"

echo "✅ 更改已提交"
echo ""

# 完成总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 测试环境设置完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 下一步操作："
echo ""
echo "1️⃣  创建测试数据库："
echo "   npx wrangler d1 create review-system-test"
echo ""
echo "2️⃣  更新 wrangler.test.jsonc 中的 database_id"
echo ""
echo "3️⃣  生成测试用户密码哈希："
echo "   node -e \"const bcrypt = require('bcryptjs'); bcrypt.hash('Admin@123', 10).then(h => console.log('Admin:', h));\""
echo "   node -e \"const bcrypt = require('bcryptjs'); bcrypt.hash('Premium@123', 10).then(h => console.log('Premium:', h));\""
echo "   node -e \"const bcrypt = require('bcryptjs'); bcrypt.hash('User@123', 10).then(h => console.log('User:', h));\""
echo ""
echo "4️⃣  更新 seed.test.sql 中的密码哈希"
echo ""
echo "5️⃣  应用测试数据库迁移："
echo "   npm run db:migrate:test-local"
echo "   npm run db:seed:test-local"
echo ""
echo "6️⃣  启动本地测试环境："
echo "   npm run dev:test"
echo ""
echo "7️⃣  创建Cloudflare Pages测试项目并部署："
echo "   npx wrangler pages project create test.review-system --production-branch develop"
echo "   npm run deploy:test"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 详细文档请查看："
echo "   VERSION_MANAGEMENT.md"
echo ""
echo "当前分支：$(git branch --show-current)"
echo "当前版本：$(node -p \"require('./package.json').version\")"
echo ""
echo "✅ 准备就绪！可以开始开发了 🚀"
