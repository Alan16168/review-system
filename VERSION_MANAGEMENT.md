# 🔐 Review System 版本管理方案

**生产环境保护 + 测试环境隔离完整方案**

---

## 📋 方案概述

### **当前状态**
- ✅ 生产环境：https://review-system.pages.dev/ (v6.11.0)
- ✅ 生产环境已上线，有真实用户数据
- 🎯 目标：锁定生产版本为 v6.12，新开发在测试环境进行

### **您提出的方案**
```
生产环境：https://review-system.pages.dev/
  → 版本：v6.12（锁定）
  
测试环境：https://test.review-system.pages.dev/
  → 版本：v7.x（曼哈顿计划开发）
  → 测试用户：
    - 管理员：用户名"1" 密码"1"
    - 高级用户：用户名"2" 密码"2"
    - 普通用户：用户名"3" 密码"3"
```

---

## ✅ **方案评估：非常好！但需要优化**

### **✅ 方案优点**
1. **环境隔离**：生产和测试完全分离 ✅
2. **版本锁定**：生产环境不受新开发影响 ✅
3. **测试账号**：简单易记的测试用户 ✅
4. **风险可控**：新功能先在测试环境验证 ✅

### **⚠️ 需要优化的地方**

#### **问题1：密码安全性**
```
当前方案：密码是"1"、"2"、"3"
风险：太简单，容易被猜到

建议改进：
管理员：test-admin / Admin@123
高级用户：test-premium / Premium@123
普通用户：test-user / User@123
```

#### **问题2：数据库隔离**
```
问题：测试环境和生产环境不能共用同一个数据库
解决：需要创建独立的测试数据库
```

#### **问题3：Git分支策略**
```
问题：需要明确的分支管理策略
建议：
  main分支 → 生产环境(v6.12)
  develop分支 → 测试环境(v7.x)
```

---

## 🎯 **推荐方案：专业版本管理**

### **架构设计**

```
Git分支策略:
  main (生产分支)
    ├─ 保持在 v6.12
    ├─ 只接受紧急修复
    └─ 部署到 review-system.pages.dev
  
  develop (开发分支)
    ├─ 曼哈顿计划开发
    ├─ v7.0 → v7.1 → v7.2 ...
    └─ 部署到 test.review-system.pages.dev
  
  feature/* (功能分支)
    ├─ feature/marketplace
    ├─ feature/ai-writing
    └─ 开发完成后合并到 develop
```

### **环境配置**

```
生产环境 (Production)
  URL: https://review-system.pages.dev/
  分支: main
  版本: v6.12 (locked)
  数据库: review-system-production
  Cloudflare Project: review-system
  
测试环境 (Test/Staging)
  URL: https://test.review-system.pages.dev/
  分支: develop
  版本: v7.x (active development)
  数据库: review-system-test
  Cloudflare Project: test.review-system
```

---

## 🛠️ **实施步骤**

### **Step 1: 创建版本标签（锁定生产版本）**

```bash
# 1. 更新package.json版本号为6.12.0
cd /home/user/webapp
npm version 6.12.0 --no-git-tag-version

# 2. 提交版本更新
git add package.json
git commit -m "chore: Lock production version to v6.12.0"

# 3. 创建版本标签
git tag v6.12.0
git tag -a production-stable -m "Production stable release - v6.12.0"

# 4. 推送到GitHub
git push origin main
git push origin v6.12.0
git push origin production-stable
```

---

### **Step 2: 创建develop分支**

```bash
# 1. 从main创建develop分支
git checkout -b develop

# 2. 更新版本号为7.0.0
npm version 7.0.0 --no-git-tag-version

# 3. 提交并推送
git add package.json
git commit -m "chore: Start v7.0.0 development (Manhattan Project)"
git push origin develop
```

---

### **Step 3: 创建测试数据库**

```bash
# 1. 创建测试环境的D1数据库
npx wrangler d1 create review-system-test

# 输出示例：
# ✅ Successfully created DB 'review-system-test'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "review-system-test"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

### **Step 4: 配置测试环境wrangler**

创建 `wrangler.test.jsonc`:

```jsonc
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
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

---

### **Step 5: 更新package.json脚本**

```json
{
  "scripts": {
    "dev": "vite",
    "dev:sandbox": "wrangler pages dev dist --d1=review-system-production --local --ip 0.0.0.0 --port 3000",
    "dev:test": "wrangler pages dev dist --d1=review-system-test --local --ip 0.0.0.0 --port 3000",
    "build": "vite build",
    "preview": "wrangler pages dev",
    
    "deploy:prod": "npm run build && wrangler pages deploy dist --project-name review-system --branch main",
    "deploy:test": "npm run build && wrangler pages deploy dist --project-name test.review-system --branch develop --config wrangler.test.jsonc",
    
    "db:migrate:prod": "wrangler d1 migrations apply review-system-production",
    "db:migrate:test": "wrangler d1 migrations apply review-system-test",
    "db:migrate:test-local": "wrangler d1 migrations apply review-system-test --local",
    
    "db:seed:test": "wrangler d1 execute review-system-test --file=./seed.test.sql",
    "db:seed:test-local": "wrangler d1 execute review-system-test --local --file=./seed.test.sql"
  }
}
```

---

### **Step 6: 创建测试用户数据（seed.test.sql）**

```sql
-- seed.test.sql
-- 测试环境专用数据

-- 删除所有现有用户（测试环境）
DELETE FROM users;
DELETE FROM subscriptions;

-- 创建测试用户
-- 1. 管理员账号
INSERT INTO users (id, username, email, password, role, created_at) 
VALUES (
  1, 
  'test-admin', 
  'admin@test.com',
  '$2a$10$YourHashedPasswordHere', -- 密码: Admin@123
  'admin',
  CURRENT_TIMESTAMP
);

-- 2. 高级用户（Premium订阅）
INSERT INTO users (id, username, email, password, role, created_at) 
VALUES (
  2, 
  'test-premium', 
  'premium@test.com',
  '$2a$10$YourHashedPasswordHere', -- 密码: Premium@123
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
  2,
  'premium',
  'active',
  DATE('now'),
  DATE('now', '+1 year'),
  'test',
  CURRENT_TIMESTAMP
);

-- 3. 普通用户（免费版）
INSERT INTO users (id, username, email, password, role, created_at) 
VALUES (
  3, 
  'test-user', 
  'user@test.com',
  '$2a$10$YourHashedPasswordHere', -- 密码: User@123
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
  3,
  'free',
  'active',
  CURRENT_TIMESTAMP
);

-- 创建一些测试复盘数据（可选）
INSERT INTO reviews (user_id, title, status, created_at) VALUES
  (1, '管理员测试复盘', 'completed', CURRENT_TIMESTAMP),
  (2, 'Premium用户测试复盘', 'completed', CURRENT_TIMESTAMP),
  (3, '普通用户测试复盘', 'draft', CURRENT_TIMESTAMP);

-- 提示信息
SELECT '测试用户创建完成' as message;
SELECT '管理员: test-admin / Admin@123' as user_info
UNION ALL
SELECT '高级用户: test-premium / Premium@123'
UNION ALL
SELECT '普通用户: test-user / User@123';
```

---

### **Step 7: 创建Cloudflare Pages测试项目**

```bash
# 1. 创建测试环境项目
npx wrangler pages project create test.review-system \
  --production-branch develop \
  --compatibility-date 2025-10-07

# 2. 部署到测试环境
npm run deploy:test
```

---

### **Step 8: 配置Cloudflare Pages自动部署**

在Cloudflare Pages控制台配置：

```
项目1: review-system (生产环境)
  生产分支: main
  构建命令: npm run build
  输出目录: dist
  环境变量:
    - NODE_VERSION=18
    - DATABASE_BINDING=review-system-production

项目2: test.review-system (测试环境)
  生产分支: develop
  构建命令: npm run build
  输出目录: dist
  环境变量:
    - NODE_VERSION=18
    - DATABASE_BINDING=review-system-test
```

---

## 📋 **工作流程**

### **日常开发流程**

```bash
# 1. 切换到develop分支开发
git checkout develop

# 2. 创建功能分支
git checkout -b feature/marketplace

# 3. 开发功能
# ... 编写代码 ...

# 4. 本地测试（使用测试数据库）
npm run dev:test

# 5. 提交代码
git add .
git commit -m "feat: Add marketplace basic structure"

# 6. 合并到develop
git checkout develop
git merge feature/marketplace

# 7. 部署到测试环境
git push origin develop
# Cloudflare自动部署到 test.review-system.pages.dev

# 8. 测试环境验证
# 访问 https://test.review-system.pages.dev/
# 使用测试账号登录验证功能
```

---

### **发布到生产环境流程**

```bash
# 1. 确保测试环境验证通过
# 访问 https://test.review-system.pages.dev/
# 完成所有功能测试

# 2. 切换到main分支
git checkout main

# 3. 合并develop分支
git merge develop

# 4. 更新版本号（例如从6.12.0到7.0.0）
npm version 7.0.0 --no-git-tag-version

# 5. 创建版本标签
git tag v7.0.0
git tag -f production-stable

# 6. 推送到GitHub
git push origin main
git push origin v7.0.0
git push origin production-stable --force

# 7. 部署到生产环境
npm run deploy:prod

# 8. 应用生产数据库迁移（如有新表）
npm run db:migrate:prod

# 9. 验证生产环境
# 访问 https://review-system.pages.dev/
# 确认新功能正常运行
```

---

### **紧急修复流程（Hotfix）**

```bash
# 1. 从main分支创建hotfix分支
git checkout main
git checkout -b hotfix/critical-bug

# 2. 修复问题
# ... 修复代码 ...

# 3. 测试修复
npm run dev:test

# 4. 提交修复
git add .
git commit -m "fix: Critical bug in payment processing"

# 5. 合并到main和develop
git checkout main
git merge hotfix/critical-bug

git checkout develop
git merge hotfix/critical-bug

# 6. 更新版本号（补丁版本）
git checkout main
npm version patch  # 6.12.0 → 6.12.1

# 7. 部署到生产
git push origin main
npm run deploy:prod

# 8. 删除hotfix分支
git branch -d hotfix/critical-bug
```

---

## 🔐 **测试用户管理**

### **生成密码哈希**

```javascript
// generate-test-passwords.js
const bcrypt = require('bcryptjs');

async function generatePasswords() {
  const passwords = {
    admin: 'Admin@123',
    premium: 'Premium@123',
    user: 'User@123'
  };
  
  for (const [role, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${role}: ${password}`);
    console.log(`Hash: ${hash}\n`);
  }
}

generatePasswords();
```

运行脚本：
```bash
cd /home/user/webapp
node generate-test-passwords.js
```

### **测试账号信息表**

| 角色 | 用户名 | 密码 | 权限 | 订阅tier |
|------|--------|------|------|----------|
| 管理员 | test-admin | Admin@123 | admin | - |
| 高级用户 | test-premium | Premium@123 | user | premium |
| 普通用户 | test-user | User@123 | user | free |

---

## 📊 **环境对比表**

| 特性 | 生产环境 | 测试环境 |
|------|----------|----------|
| **URL** | review-system.pages.dev | test.review-system.pages.dev |
| **Git分支** | main | develop |
| **版本** | v6.12 (locked) | v7.x (active) |
| **数据库** | review-system-production | review-system-test |
| **用户数据** | 真实用户 | 测试账号 |
| **部署触发** | 手动 `npm run deploy:prod` | 自动（push to develop） |
| **数据迁移** | 谨慎操作 | 可随意重置 |
| **测试账号** | ❌ 禁止 | ✅ 3个测试账号 |

---

## ⚠️ **安全注意事项**

### **1. 生产环境保护**
```
✅ 永远不要在生产数据库执行测试数据
✅ 生产环境迁移前必须备份
✅ 生产环境密码必须复杂且安全
✅ 定期审查生产环境访问日志
```

### **2. 测试环境隔离**
```
✅ 测试数据库完全独立
✅ 测试账号密码定期更换
✅ 测试环境可以随时重置
✅ 不要在测试环境存储敏感数据
```

### **3. API密钥管理**
```
生产环境密钥：通过Cloudflare Secrets设置
测试环境密钥：使用测试专用API密钥
沙盒环境：使用.dev.vars本地配置
```

---

## 🧪 **测试检查清单**

### **功能测试（测试环境）**
- [ ] 管理员登录成功
- [ ] 高级用户登录成功
- [ ] 普通用户登录成功
- [ ] 创建复盘功能正常
- [ ] 数据库读写正常
- [ ] AI功能可用（如已实现）
- [ ] 支付流程模拟（测试模式）
- [ ] 移动端响应式正常

### **迁移前检查（生产环境）**
- [ ] 数据库备份完成
- [ ] 迁移脚本在测试环境验证
- [ ] 回滚方案准备就绪
- [ ] 用户通知已发送（如需停机）
- [ ] 监控系统就绪
- [ ] 团队成员已通知

---

## 📝 **文件结构**

```
webapp/
├── .git/
├── src/
├── public/
├── migrations/
├── wrangler.jsonc              # 生产环境配置
├── wrangler.test.jsonc         # 测试环境配置
├── package.json                # 版本和脚本
├── seed.sql                    # 生产数据（真实数据）
├── seed.test.sql               # 测试数据（测试账号）
├── .env.example                # 环境变量示例
├── .gitignore
├── VERSION_MANAGEMENT.md       # 本文档
└── README.md
```

---

## 🚀 **快速命令参考**

### **开发命令**
```bash
# 本地开发（生产数据库-本地）
npm run dev:sandbox

# 本地开发（测试数据库-本地）
npm run dev:test

# 构建
npm run build
```

### **部署命令**
```bash
# 部署到生产环境
npm run deploy:prod

# 部署到测试环境
npm run deploy:test
```

### **数据库命令**
```bash
# 生产数据库迁移
npm run db:migrate:prod

# 测试数据库迁移
npm run db:migrate:test

# 测试数据库注入测试数据
npm run db:seed:test
```

### **Git命令**
```bash
# 查看当前分支
git branch

# 切换到develop开发
git checkout develop

# 切换到main查看生产代码
git checkout main

# 查看版本标签
git tag

# 查看当前版本
cat package.json | grep version
```

---

## 📞 **总结：您的方案 + 我的优化**

### **✅ 您的原方案（基础）**
```
生产：review-system.pages.dev (v6.12锁定)
测试：test.review-system.pages.dev (v7.x开发)
测试用户：1/1, 2/2, 3/3
```

### **✅ 优化后方案（专业）**
```
生产环境：
  URL: review-system.pages.dev
  分支: main
  版本: v6.12.0 (Git tag锁定)
  数据库: review-system-production (真实数据)
  
测试环境：
  URL: test.review-system.pages.dev
  分支: develop
  版本: v7.0.0+ (曼哈顿计划)
  数据库: review-system-test (独立测试数据)
  
测试账号（更安全）：
  管理员: test-admin / Admin@123
  高级用户: test-premium / Premium@123
  普通用户: test-user / User@123
  
Git策略：
  main → 生产稳定版
  develop → 开发测试版
  feature/* → 功能开发分支
  hotfix/* → 紧急修复分支
```

---

## 🎯 **您的方案评价**

### **总体评分：9/10** ⭐⭐⭐⭐⭐

**优点**：
- ✅ 环境完全隔离
- ✅ 测试账号简单易记
- ✅ 生产环境受保护
- ✅ 思路清晰可行

**建议改进**：
- ⚠️ 测试账号密码增强安全性
- ⚠️ 添加独立测试数据库
- ⚠️ 完善Git分支策略
- ⚠️ 增加版本标签管理

---

## 🤔 **我的建议**

**采用您的方案 + 以上优化**，具体为：

1. **立即执行**：
   - 创建v6.12.0标签锁定生产版本
   - 创建develop分支开始v7.0.0开发
   - 创建独立测试数据库
   - 配置test.review-system项目

2. **测试账号**：
   - 使用更安全的密码（但仍然易记）
   - test-admin / Admin@123
   - test-premium / Premium@123
   - test-user / User@123

3. **工作流程**：
   - 所有新开发在develop分支
   - 测试通过后合并到main
   - 生产环境手动部署，谨慎操作

---

**这个方案您满意吗？需要我立即开始实施吗？** 🚀

**文档版本**: v1.0  
**创建时间**: 2025-11-19  
**作者**: Alan + Claude
