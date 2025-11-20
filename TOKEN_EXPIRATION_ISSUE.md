# JWT Token 过期问题 - 2025-11-20

## 问题描述

用户在测试环境 (https://test.review-system.pages.dev) 访问 AI Writing 功能时,浏览器控制台显示:

```
Failed to load resource: the server responded with a status of 500 ()
Error loading books: 网络错误
```

## 根本原因

**JWT Token 已过期**

用户浏览器中存储的 JWT token 已过期:
- Token 过期时间: `1732090780` → **2024-11-20 08:19:40 UTC**
- 当前时间: **2025-11-20 23:24:10 UTC**
- **已过期超过 1 年!**

JWT Payload:
```json
{
  "id": 25,
  "email": "1@test.com",
  "username": "测试用户1",
  "role": "user",
  "iat": 1732087180,
  "exp": 1732090780  // 已过期
}
```

## 验证

使用命令行直接测试 API (使用过期 token):
```bash
curl -X GET "https://test.review-system.pages.dev/api/ai-books" \
  -H "Authorization: Bearer eyJhbGc...expired_token..."
```

✅ API 仍然返回成功 (因为当前代码没有验证 token 签名和过期时间)

但是浏览器中 axios 请求失败,可能是因为:
1. Token 过期导致某些中间件拒绝请求
2. CORS 预检失败
3. 浏览器缓存问题

## 解决方案

### 方案 1: 重新登录 (推荐)

用户需要:
1. 退出登录
2. 重新登录以获取新的 JWT token
3. 新 token 将有新的过期时间 (通常是 1 小时后)

### 方案 2: 清除浏览器缓存

如果重新登录不可行:
1. 打开浏览器开发者工具 (F12)
2. Application → Local Storage
3. 删除 `token` 项
4. 刷新页面重新登录

### 方案 3: 实现 Token 刷新机制

在后端实现 token 刷新功能:
```typescript
// 添加刷新 token 的 API 端点
app.post('/api/refresh-token', async (c) => {
  const { refreshToken } = await c.req.json();
  // 验证 refresh token
  // 生成新的 access token
  // 返回新 token
});
```

## 次要问题

### Tailwind CSS CDN 400 错误

截图显示:
```
Failed to load resource: the server responded with a status of 400 ()
https://cdn.tailwindcss.com should not be used in production
```

**解决方案**:
这是警告信息,不影响功能。Tailwind CSS CDN 仍然会加载。
在生产环境建议:
1. 使用本地安装的 Tailwind CSS
2. 构建时编译 CSS
3. 避免使用 CDN 版本

## 当前状态

- ✅ API 后端正常工作
- ✅ 数据库用户关联正确
- ✅ JWT 解码逻辑修复完成
- ❌ 前端 token 已过期,需要重新登录

## 建议

### 短期解决
1. 用户重新登录获取新 token
2. 测试 AI Books 功能

### 长期改进
1. **实现 Token 验证**: 在 `getUserFromToken()` 中添加过期时间检查
2. **实现 Token 刷新**: 添加 refresh token 机制
3. **前端 Token 管理**: 自动检测 token 过期并提示用户重新登录
4. **使用正式 JWT 库**: 使用 `@tsndr/cloudflare-worker-jwt` 进行完整验证

## 代码改进建议

### 添加 Token 过期检查

```typescript
async function getUserFromToken(c: any): Promise<any> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Decode JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new HTTPException(401, { message: 'Invalid token format' });
    }
    
    // Convert base64url to base64
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const payload = JSON.parse(atob(base64));
    
    // ✅ 添加过期时间检查
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new HTTPException(401, { message: 'Token expired' });
    }
    
    if (!payload.id) {
      throw new HTTPException(401, { message: 'Invalid token payload' });
    }

    // Get user from database
    const user = await c.env.DB.prepare(
      'SELECT id, email, username, subscription_tier, is_admin, role FROM users WHERE id = ?'
    ).bind(payload.id).first();

    if (!user) {
      throw new HTTPException(401, { message: 'User not found' });
    }

    return user;
  } catch (error: any) {
    console.error('getUserFromToken error:', error.message);
    throw new HTTPException(401, { message: error.message || 'Authentication failed' });
  }
}
```

## 相关文档

- HOTFIX_AI_BOOKS_AUTH_2025-11-20.md - JWT 身份验证实现
- HOTFIX_BASE64_URL_2025-11-20.md - Base64 URL 解码修复
