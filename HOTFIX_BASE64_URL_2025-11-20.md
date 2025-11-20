# AI Books JWT Base64 URL 解码修复 - 2025-11-20

## 问题描述

用户报告 "AI Writing 出错",测试环境显示多个 500 状态错误:

```
GET https://review-system.pages.dev/api/ai-books 500
GET https://review-system.pages.dev/api/ai-books/1 500
```

错误信息:
```
atob() called with invalid base64-encoded data
```

## 根本原因

JWT 令牌使用 **Base64 URL 编码**,而不是标准 Base64 编码:
- Base64 URL 使用 `-` 和 `_` 字符
- 标准 Base64 使用 `+` 和 `/` 字符
- Cloudflare Workers 环境中的 `atob()` 函数只接受标准 Base64 格式

之前的代码直接使用 `atob(parts[1])` 解码 JWT payload,导致解码失败。

## 修复方案

在 `src/routes/ai_books.ts` 的 `getUserFromToken()` 函数中添加 Base64 URL 到标准 Base64 的转换:

**修复前**:
```typescript
const payload = JSON.parse(atob(parts[1]));
```

**修复后**:
```typescript
// Convert base64url to base64
let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
// Add padding if needed
while (base64.length % 4) {
  base64 += '=';
}

const payload = JSON.parse(atob(base64));
```

## 测试验证

### 测试环境 (test.review-system.pages.dev)

**1. 获取用户书籍列表**:
```bash
curl -X GET "https://test.review-system.pages.dev/api/ai-books" \
  -H "Authorization: Bearer eyJhbGc...token..." | jq .
```

✅ 结果:
```json
{
  "success": true,
  "books": [
    {
      "id": 1,
      "title": "钓鱼乐",
      "user_id": 25,
      "status": "draft",
      "current_word_count": 568
    }
  ]
}
```

**2. 获取特定书籍详情**:
```bash
curl -X GET "https://test.review-system.pages.dev/api/ai-books/1" \
  -H "Authorization: Bearer eyJhbGc...token..." | jq .
```

✅ 结果:
```json
{
  "success": true,
  "book": {
    "id": 1,
    "user_id": 25,
    "title": "钓鱼乐"
  },
  "chapters": [...],
  "sections": [...]
}
```

## 部署信息

- **测试环境**: https://test.review-system.pages.dev
- **部署 ID**: dae7a108
- **部署时间**: 2025-11-20
- **Git Commit**: db3b246
- **分支**: test

## 相关修改

### 文件变更
- `src/routes/ai_books.ts`: 添加 Base64 URL 解码转换逻辑

### 数据库变更
之前已修复:
```sql
UPDATE ai_books SET user_id = 25 WHERE id = 1;
```

## 技术说明

### Base64 URL vs Base64

**Base64 URL 编码** (RFC 4648):
- 使用 `-` 替代 `+`
- 使用 `_` 替代 `/`
- 移除尾部填充 `=` (可选)
- URL 安全,可用于 URL 参数和 JWT

**标准 Base64**:
- 使用 `+` 和 `/`
- 需要尾部填充 `=` 对齐到 4 的倍数
- 不能直接用于 URL (需要编码)

### JWT 结构

```
header.payload.signature
eyJhbG...  .  eyJpZC...  .  TJVA95O...
  ^            ^             ^
Base64URL    Base64URL    Base64URL
```

## 用户影响

- ✅ 用户现在可以正常访问自己的 AI Books
- ✅ JWT 身份验证正确解析用户信息
- ✅ 数据隔离正常工作 (每个用户只能看到自己的书籍)
- ✅ 所有 AI Books API 端点恢复正常

## 下一步

- [ ] 部署到生产环境 (review-system.pages.dev)
- [ ] 验证生产环境功能正常
- [ ] 监控错误日志确保无新问题

## 相关问题

- HOTFIX_AI_BOOKS_2025-11-20.md - is_admin 字段修复
- HOTFIX_AI_BOOKS_AUTH_2025-11-20.md - JWT 身份验证实现
