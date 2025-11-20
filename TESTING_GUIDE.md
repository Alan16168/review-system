# 测试指南 - Review System AI 书籍生成系统

## 📋 目录
1. [测试用户信息](#测试用户信息)
2. [系统设置](#系统设置)
3. [测试数据](#测试数据)
4. [测试场景](#测试场景)
5. [环境变量](#环境变量)

---

## 🔐 测试用户信息

### 当前可用测试用户

| ID | 邮箱 | 用户名 | 角色 | 订阅等级 | 创建时间 |
|----|------|--------|------|---------|---------|
| 1 | 1@test.com | Test User | premium | premium | 2025-11-19 17:45:16 |

### 用户权限说明

#### 订阅等级权限
- **free**（免费版）：
  - 可创建 1 本 AI 书籍
  - 基础功能访问
  
- **premium**（高级版）：
  - 可创建 10 本 AI 书籍
  - 所有 AI 写作功能
  - 访问管理后台（需要 admin 角色）
  
- **super**（超级版）：
  - 无限制创建 AI 书籍
  - 所有高级功能
  - 优先支持

#### 角色权限
- **user**（普通用户）：基础功能访问
- **admin**（管理员）：可访问管理后台，修改系统设置
- **premium**（高级用户）：当前测试用户的角色设置

### 登录方式

**注意**：当前系统使用**临时测试模式**
- ✅ 自动使用用户 ID 1 (1@test.com)
- ❌ 暂时跳过 Token 验证
- 📝 在 `/home/user/webapp/src/routes/ai_books.ts` 第 15-27 行

```typescript
async function getUserFromToken(c: any): Promise<any> {
  // TEMPORARY: Skip token validation, use default user ID 1 (1@test.com)
  // TODO: Restore token validation after testing
  const user = await c.env.DB.prepare(
    'SELECT id, email, username, subscription_tier FROM users WHERE id = ?'
  ).bind(1).first();
  
  return user;
}
```

---

## ⚙️ 系统设置

### AI 智能写作设置

| 设置键 | 当前值 | 类型 | 分类 | 说明 |
|--------|-------|------|------|------|
| **ai_max_output_tokens** | 8192 | number | ai_writing | Gemini API 最大输出 Token 数量（1000-8192） |
| **ai_temperature** | 0.7 | number | ai_writing | AI 生成内容的创意度（0-1，推荐 0.7） |
| **ai_default_word_count** | 1000 | number | ai_writing | 默认目标字数 |
| **ai_enabled** | true | boolean | ai_writing | 是否启用 AI 写作功能 |

### 通用系统设置

| 设置键 | 当前值 | 类型 | 分类 | 说明 |
|--------|-------|------|------|------|
| **system_name** | Review System | string | general | 系统名称 |
| **system_version** | 7.0.0 | string | general | 系统版本 |

### 修改系统设置方法

#### 方法 1：通过管理后台 UI（推荐）
1. 访问系统主页
2. 点击"管理后台"（需要 admin 角色）
3. 选择"AI 写作设置"标签页
4. 调整参数并点击"保存设置"

#### 方法 2：通过 API
```bash
# 批量更新设置
curl -X PUT http://localhost:3000/api/system-settings/batch/update \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {"key": "ai_max_output_tokens", "value": "8192"},
      {"key": "ai_temperature", "value": "0.7"}
    ]
  }'
```

#### 方法 3：直接操作数据库
```bash
cd /home/user/webapp

# 更新 Token 上限
npx wrangler d1 execute review-system-production --local \
  --command="UPDATE system_settings SET setting_value = '8192' WHERE setting_key = 'ai_max_output_tokens'"

# 更新 Temperature
npx wrangler d1 execute review-system-production --local \
  --command="UPDATE system_settings SET setting_value = '0.8' WHERE setting_key = 'ai_temperature'"
```

---

## 📚 测试数据

### 当前 AI 书籍

| ID | 用户 | 标题 | 目标字数 | 状态 | 创建时间 |
|----|------|------|---------|------|---------|
| 1 | 1@test.com | 人工智能实战 | 50,000 | generating | 2025-11-19 17:47:45 |
| 5 | 1@test.com | 企业领导力实战 | 60,000 | generating | 2025-11-19 20:06:49 |
| 6 | 1@test.com | 教练技术在企业中的应用 | 60,000 | generating | 2025-11-20 00:34:32 |

### 查询测试数据

```bash
cd /home/user/webapp

# 查看所有用户
npx wrangler d1 execute review-system-production --local \
  --command="SELECT id, email, username, role, subscription_tier FROM users"

# 查看所有书籍
npx wrangler d1 execute review-system-production --local \
  --command="SELECT id, user_id, title, target_word_count, status FROM ai_books"

# 查看书籍章节
npx wrangler d1 execute review-system-production --local \
  --command="SELECT id, book_id, title, chapter_number FROM ai_chapters WHERE book_id = 6"

# 查看章节小节
npx wrangler d1 execute review-system-production --local \
  --command="SELECT id, title, target_word_count, current_word_count, status FROM ai_sections WHERE chapter_id = 1"
```

---

## 🧪 测试场景

### 场景 1：字数精准测试（修复验证）

**目的**：验证 Token 计算修复是否生效

**步骤**：
1. 登录系统（自动使用 1@test.com）
2. 打开书籍 ID 6 "教练技术在企业中的应用"
3. 选择任意章节，点击"生成小节内容"
4. 在弹窗中输入目标字数：**1000**
5. 点击"生成内容"
6. 等待生成完成，查看实际字数

**预期结果**：
- ✅ 实际字数在 **900-1100** 范围内
- ✅ 不再出现 1800-2000 字的情况
- ✅ Token 使用约 2500（1000 × 2.5）

### 场景 2：不同字数测试

| 目标字数 | 预期 Token | 预期实际字数 | 偏差范围 |
|---------|-----------|------------|---------|
| 500     | 1,250     | 450-550    | ±10%    |
| 1000    | 2,500     | 900-1100   | ±10%    |
| 1500    | 3,750     | 1350-1650  | ±10%    |
| 2000    | 5,000     | 1800-2200  | ±10%    |
| 3000    | 7,500     | 2700-3300  | ±10%    |

### 场景 3：重新生成功能测试

**步骤**：
1. 找到已有内容的小节
2. 点击"重新生成"按钮（紫色）
3. 在确认对话框中点击"确定"
4. 输入新的目标字数
5. 验证新内容覆盖旧内容

**预期结果**：
- ✅ 显示覆盖警告
- ✅ 生成新内容并覆盖
- ✅ 字数符合新设置

### 场景 4：管理员设置修改测试

**前置条件**：需要 admin 角色（当前测试用户为 premium）

**修改方法**：
```bash
# 临时将测试用户设为 admin
cd /home/user/webapp
npx wrangler d1 execute review-system-production --local \
  --command="UPDATE users SET role = 'admin' WHERE id = 1"
```

**步骤**：
1. 重新加载页面
2. 点击"管理后台"
3. 选择"AI 写作设置"
4. 修改 Token 上限为 4096
5. 保存设置
6. 测试生成 3000 字内容

**预期结果**：
- ✅ Token 被限制在 4096
- ✅ 实际生成约 1638 字（4096 ÷ 2.5）
- ⚠️ 小于目标的 3000 字（因为 Token 限制）

---

## 🔧 环境变量

### Gemini API Key

**当前配置位置**：`wrangler.jsonc` 或环境变量

**检查方法**：
```bash
cd /home/user/webapp

# 方法 1：查看 wrangler.jsonc
cat wrangler.jsonc | grep GEMINI

# 方法 2：查看 .dev.vars
cat .dev.vars 2>/dev/null || echo "No .dev.vars file"

# 方法 3：测试 API 是否可用
curl http://localhost:3000/api/ai-books/6
```

**设置方法（如果需要）**：
```bash
# 创建 .dev.vars 文件
cat > .dev.vars << 'EOF'
GEMINI_API_KEY=your-actual-api-key-here
EOF

# 重启服务
pm2 restart review-system
```

---

## 📊 数据库结构

### 核心表

| 表名 | 用途 | 关键列 |
|------|------|--------|
| users | 用户信息 | id, email, role, subscription_tier |
| system_settings | 系统配置 | setting_key, setting_value, setting_type |
| ai_books | AI 书籍 | id, user_id, title, target_word_count |
| ai_chapters | 书籍章节 | id, book_id, title, chapter_number |
| ai_sections | 章节小节 | id, chapter_id, title, content, current_word_count |

### 数据库操作

```bash
cd /home/user/webapp

# 查看所有表
npx wrangler d1 execute review-system-production --local \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# 重置本地数据库（危险操作！）
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
npm run db:seed
```

---

## 🚀 快速测试命令

### 一键测试流程

```bash
# 1. 进入项目目录
cd /home/user/webapp

# 2. 查看当前用户
npx wrangler d1 execute review-system-production --local \
  --command="SELECT * FROM users WHERE id = 1"

# 3. 查看系统设置
npx wrangler d1 execute review-system-production --local \
  --command="SELECT * FROM system_settings"

# 4. 查看测试书籍
npx wrangler d1 execute review-system-production --local \
  --command="SELECT id, title, target_word_count FROM ai_books"

# 5. 测试服务响应
curl http://localhost:3000/

# 6. 获取公网 URL
# 在浏览器中访问：https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

---

## 🐛 常见问题

### Q1: 提示"用户未授权"
**解决**：确认当前代码使用临时测试模式（自动登录 ID 1）

### Q2: AI 生成失败
**检查**：
1. Gemini API Key 是否配置
2. 系统设置中 `ai_enabled` 是否为 true
3. 查看 PM2 日志：`pm2 logs review-system --nostream`

### Q3: 无法访问管理后台
**解决**：将用户角色改为 admin
```bash
npx wrangler d1 execute review-system-production --local \
  --command="UPDATE users SET role = 'admin' WHERE id = 1"
```

### Q4: 字数仍然不准确
**检查**：
1. 确认代码已更新（第 555 行：`targetWords * 2.5`）
2. 确认已重新构建（`npm run build`）
3. 确认服务已重启（`pm2 restart review-system`）

---

## 📝 测试报告模板

```markdown
### 测试报告

**测试日期**：2025-11-20
**测试人员**：[Your Name]
**测试环境**：Local Sandbox

#### 测试场景：字数精准测试
- 目标字数：1000
- 实际字数：____
- Token 使用：____
- 结果：✅ 通过 / ❌ 失败
- 备注：____

#### 测试场景：重新生成
- 原字数：____
- 新目标：____
- 新字数：____
- 结果：✅ 通过 / ❌ 失败

#### 总体评价
- [ ] 字数精准度满足要求
- [ ] 功能正常运行
- [ ] 性能表现良好
- [ ] 无明显 Bug
```

---

## 📞 技术支持

如有问题，请检查：
1. PM2 日志：`pm2 logs review-system --nostream`
2. Wrangler 日志：`/home/user/.config/.wrangler/logs/`
3. 数据库状态：`npx wrangler d1 info review-system-production --local`

---

**文档版本**：1.0.0  
**最后更新**：2025-11-20  
**维护者**：AI Assistant (Claude)
