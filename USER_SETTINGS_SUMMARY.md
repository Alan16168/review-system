# 用户设置与测试账号总结

## 🔐 可用测试用户

### 主测试账号
```
邮箱：1@test.com
用户名：Test User
角色：premium
订阅等级：premium
状态：✅ 激活
创建时间：2025-11-19 17:45:16
```

### 权限说明
- ✅ 可创建 10 本 AI 书籍（premium 限额）
- ✅ 可使用所有 AI 写作功能
- ⚠️ 需要改为 admin 角色才能访问管理后台

### 升级为管理员
```bash
cd /home/user/webapp
npx wrangler d1 execute review-system-production --local \
  --command="UPDATE users SET role = 'admin' WHERE id = 1"
```

---

## ⚙️ 系统设置（可通过管理后台修改）

### AI 写作参数

| 参数 | 当前值 | 范围 | 说明 |
|------|-------|------|------|
| **最大 Token 数** | 8192 | 1000-8192 | Gemini API 单次生成的最大 Token 数量 |
| **创意度** | 0.7 | 0.0-1.0 | 0=保守，1=创意（推荐 0.7） |
| **默认字数** | 1000 | 100-5000 | 新小节的默认目标字数 |
| **AI 功能** | 启用 | 启用/禁用 | 全局 AI 写作开关 |

### Token 与字数换算

| 用户设置字数 | Token 使用量 | 预期实际字数 |
|------------|------------|------------|
| 500 字     | 1,250      | 450-550    |
| 1000 字    | 2,500      | 900-1100   |
| 2000 字    | 5,000      | 1800-2200  |
| 3000 字    | 7,500      | 2700-3300  |
| 3276 字    | 8190       | ~3200（接近上限） |

**公式**：`Token = 目标字数 × 2.5`（修复后）

---

## 📚 现有测试数据

### AI 书籍列表

| ID | 标题 | 目标字数 | 状态 |
|----|------|---------|------|
| 1 | 人工智能实战 | 50,000 | generating |
| 5 | 企业领导力实战 | 60,000 | generating |
| 6 | 教练技术在企业中的应用 | 60,000 | generating |

**推荐测试书籍**：ID 6（最新，内容较完整）

---

## 🧪 快速测试步骤

### 1️⃣ 验证字数修复
```
1. 访问：https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
2. 打开书籍 ID 6
3. 选择任意章节 → "生成小节内容"
4. 输入目标字数：1000
5. 等待生成
6. 验证实际字数：900-1100（✅ 正确）
```

### 2️⃣ 测试管理后台
```
1. 将用户改为 admin（见上方命令）
2. 刷新页面 → "管理后台" → "AI 写作设置"
3. 修改 Token 上限为 4096
4. 保存
5. 测试生成 3000 字内容
6. 验证被限制在约 1600 字（4096 ÷ 2.5）
```

---

## 📊 数据库快速查询

```bash
# 查看用户信息
npx wrangler d1 execute review-system-production --local \
  --command="SELECT * FROM users WHERE id = 1"

# 查看系统设置
npx wrangler d1 execute review-system-production --local \
  --command="SELECT setting_key, setting_value FROM system_settings WHERE category = 'ai_writing'"

# 查看书籍统计
npx wrangler d1 execute review-system-production --local \
  --command="
    SELECT 
      b.id,
      b.title,
      COUNT(DISTINCT c.id) as chapters,
      COUNT(DISTINCT s.id) as sections,
      SUM(s.current_word_count) as total_words
    FROM ai_books b
    LEFT JOIN ai_chapters c ON b.id = c.book_id
    LEFT JOIN ai_sections s ON c.id = s.chapter_id
    WHERE b.user_id = 1
    GROUP BY b.id
  "
```

---

## 🎯 修改系统设置的三种方式

### 方式 1：管理后台 UI（推荐）
```
1. 升级为 admin 角色
2. 登录 → 管理后台 → AI 写作设置
3. 调整滑块/输入框
4. 点击"保存设置"
```

### 方式 2：API 调用
```bash
curl -X PUT http://localhost:3000/api/system-settings/batch/update \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {"key": "ai_max_output_tokens", "value": "6000"},
      {"key": "ai_temperature", "value": "0.8"}
    ]
  }'
```

### 方式 3：直接修改数据库
```bash
npx wrangler d1 execute review-system-production --local \
  --command="UPDATE system_settings SET setting_value = '6000' WHERE setting_key = 'ai_max_output_tokens'"
```

---

## 🔑 关键配置文件

| 文件 | 用途 | 位置 |
|------|------|------|
| `.dev.vars` | 本地环境变量（API Key） | `/home/user/webapp/.dev.vars` |
| `wrangler.jsonc` | Cloudflare 配置 | `/home/user/webapp/wrangler.jsonc` |
| `ecosystem.config.cjs` | PM2 配置 | `/home/user/webapp/ecosystem.config.cjs` |

---

## 🚨 注意事项

### ⚠️ 临时测试模式
当前系统**跳过身份验证**，自动使用用户 ID 1
- 位置：`src/routes/ai_books.ts` 第 15-27 行
- 生产环境需要恢复 Token 验证

### ⚠️ API Key 配置
确保 Gemini API Key 已配置：
```bash
# 检查环境变量
cat .dev.vars | grep GEMINI

# 或在 wrangler.jsonc 中设置
{
  "vars": {
    "GEMINI_API_KEY": "your-key-here"
  }
}
```

---

## 📈 监控命令

```bash
# 查看服务状态
pm2 list

# 查看实时日志（慎用，会阻塞）
pm2 logs review-system --lines 50 --nostream

# 重启服务
pm2 restart review-system

# 查看资源占用
pm2 monit
```

---

## 🎉 总结

**可用测试账号**：
- ✅ 1@test.com（premium 用户）
- ⚠️ 需改为 admin 才能访问管理后台

**系统设置**：
- ✅ AI Token 上限：8192
- ✅ 创意度：0.7
- ✅ 默认字数：1000

**测试数据**：
- ✅ 3 本测试书籍
- ✅ 推荐使用书籍 ID 6

**访问地址**：
- 🌐 https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev

---

**文档版本**：1.0.0  
**更新时间**：2025-11-20  
**状态**：✅ 所有功能正常运行
