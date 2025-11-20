# AI Books 功能故障排除 - 2025-11-20

## 当前问题

用户报告 AI 智能写作助手仍然出错,显示:
- **图书加载失败: Request failed with status code 500**
- 控制台错误可能提到 `AI_API_ADDRESS undefined`

## 问题诊断

### 1. JWT Token 过期 ✅ 已修复

**症状**: API 返回 401 错误,提示 "Token expired"

**修复**:
- 已在 `getUserFromToken()` 函数中添加过期验证
- 代码已部署到测试环境

**用户需要做的**:
- **必须重新登录**以获取新的有效 token
- 旧 token 已过期超过 1 年,无法继续使用

### 2. 环境变量配置

**生产环境** ✅ 已配置
```bash
npx wrangler pages secret list --project-name review-system
```

已配置的环境变量:
- ✅ GEMINI_API_KEY
- ✅ GOOGLE_API_KEY
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ JWT_SECRET
- ✅ PAYPAL_CLIENT_ID
- ✅ PAYPAL_CLIENT_SECRET
- ✅ PAYPAL_MODE
- ✅ RESEND_API_KEY
- ✅ YOUTUBE_API_KEY

**测试环境** ⚠️ 需要验证
- Cloudflare Pages 的环境变量对所有分支都生效
- test 分支应该也能访问这些环境变量

### 3. API 端点健康检查

**测试步骤**:

```bash
# 1. 测试书籍列表 API (需要有效 token)
curl -X GET "https://test.review-system.pages.dev/api/ai-books" \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"

# 2. 测试特定书籍详情
curl -X GET "https://test.review-system.pages.dev/api/ai-books/1" \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"

# 3. 测试章节生成
curl -X POST "https://test.review-system.pages.dev/api/ai-books/1/generate-chapters" \
  -H "Authorization: Bearer YOUR_VALID_TOKEN" \
  -H "Content-Type: application/json"
```

## 解决方案步骤

### 步骤 1: 清除旧 Token 并重新登录 ⚠️ 重要

1. **打开浏览器开发者工具** (F12)

2. **清除 localStorage 中的 token**:
   ```javascript
   // 在控制台执行:
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   ```

3. **或者直接清除所有 localStorage**:
   ```javascript
   localStorage.clear();
   ```

4. **刷新页面**: 按 F5 或 Ctrl+R

5. **重新登录**:
   - 使用账号: `1@test.com` / `2@test.com`
   - 或其他有效账号

6. **验证新 token**:
   ```javascript
   // 在控制台执行:
   const token = localStorage.getItem('token');
   console.log('Token:', token);
   
   // 解码查看过期时间
   const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
   console.log('Token expires:', new Date(payload.exp * 1000));
   ```

### 步骤 2: 测试 AI Books 功能

1. 登录后,访问 AI 智能写作助手页面
2. 查看是否能正常加载书籍列表
3. 尝试创建新书籍
4. 尝试生成章节

### 步骤 3: 检查控制台错误

如果仍然出错:
1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 查看详细错误信息
4. 切换到 Network 标签查看具体的 HTTP 请求失败原因

## 常见错误及解决方法

### 错误 1: "Token expired. Please login again."

**原因**: JWT token 已过期

**解决**: 
1. 退出登录
2. 清除 localStorage
3. 重新登录

### 错误 2: "Gemini API key not configured"

**原因**: 后端无法访问 GEMINI_API_KEY 环境变量

**解决**:
1. 检查 Cloudflare Pages 的环境变量配置
2. 确保 GEMINI_API_KEY 已设置
3. 重新部署项目

### 错误 3: "Book not found"

**原因**: 书籍的 user_id 与当前登录用户不匹配

**解决**:
```sql
-- 查看书籍所属用户
SELECT id, title, user_id FROM ai_books WHERE id = 1;

-- 如果 user_id 不匹配,更新为当前用户
UPDATE ai_books SET user_id = YOUR_USER_ID WHERE id = 1;
```

### 错误 4: "Request failed with status code 500"

**可能原因**:
1. Token 过期 → 重新登录
2. API Key 未配置 → 检查环境变量
3. 数据库查询失败 → 检查日志
4. Gemini API 限流 → 等待或检查配额

**排查步骤**:
1. 检查浏览器控制台的 Network 标签
2. 查看失败请求的 Response
3. 检查 Cloudflare Pages 的日志

## 数据库相关

### 检查用户 ID

```sql
-- 查看当前用户信息
SELECT id, email, username FROM users WHERE email = '1@test.com';

-- 查看书籍所属
SELECT id, title, user_id, status FROM ai_books;

-- 检查章节
SELECT id, book_id, title, status FROM ai_chapters WHERE book_id = 1;
```

### 修复数据归属

```sql
-- 如果书籍归属错误,更新为正确的 user_id
UPDATE ai_books SET user_id = 25 WHERE id = 1;

-- 同时更新章节归属 (如果需要)
UPDATE ai_chapters SET user_id = 25 WHERE book_id = 1;

-- 更新小节归属 (如果需要)
UPDATE ai_sections SET user_id = 25 WHERE book_id = 1;
```

## 部署信息

- **测试环境**: https://test.review-system.pages.dev
- **生产环境**: https://review-system.pages.dev
- **最新部署 ID (test)**: d44c29de
- **Git Commit**: cc66313

## 技术细节

### JWT Token 结构

```
header.payload.signature
```

Payload 包含:
```json
{
  "id": 25,
  "email": "1@test.com",
  "username": "测试用户1",
  "role": "user",
  "iat": 1732087180,  // 签发时间
  "exp": 1732090780   // 过期时间
}
```

### Token 有效期

- 当前设置: **1 小时**
- 过期后需要重新登录
- 未来可实现自动刷新机制

## 下一步改进

1. **实现 Refresh Token** - 自动刷新过期 token
2. **前端 Token 过期检测** - 自动提示用户重新登录
3. **错误信息优化** - 更友好的错误提示
4. **日志系统** - 更好的错误追踪

## 联系支持

如果问题仍然存在,请提供:
1. 浏览器控制台完整错误信息
2. Network 标签中失败请求的详情
3. 当前登录的用户邮箱
4. 尝试操作的具体步骤

## 相关文档

- TOKEN_EXPIRATION_ISSUE.md - Token 过期问题详解
- HOTFIX_BASE64_URL_2025-11-20.md - Base64 URL 解码修复
- HOTFIX_AI_BOOKS_AUTH_2025-11-20.md - JWT 认证实现
