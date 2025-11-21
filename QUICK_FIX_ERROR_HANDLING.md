# 错误处理改进 - 快速参考指南

**版本**: V7.0.0  
**日期**: 2025-11-21  
**Git Commit**: 9070215

---

## 🎯 问题

用户看到 **502 Bad Gateway** 等技术性错误，不知道发生了什么。

---

## ✅ 解决方案

### 已完成的改进

1. ✅ **全局错误处理中间件** 
   - 文件: `src/middleware/errorHandler.ts`
   - 自动捕获所有错误
   - 提供友好的中文提示

2. ✅ **统一错误响应格式**
   ```json
   {
     "error": "数据库操作失败，请稍后重试",
     "message": "数据库操作失败，请稍后重试",
     "timestamp": "2025-11-21T04:22:32.596Z",
     "path": "/api/templates",
     "method": "GET"
   }
   ```

3. ✅ **详细错误日志**
   ```
   [2025-11-21T04:22:32.596Z] [ERROR] GET /api/templates
   User: user_123
   Error: D1_ERROR: Connection timeout
   Stack: Error: D1_ERROR...
   ```

4. ✅ **templates.ts 路由改进**
   - 所有 10 个 catch 块已更新
   - 使用 `createError` 创建自定义错误
   - 添加详细的日志记录

---

## 🔄 如何为其他路由添加错误处理

### 步骤 1: 导入 createError

```typescript
import { createError } from '../middleware/errorHandler';
```

### 步骤 2: 更新 catch 块

**之前**:
```typescript
} catch (error) {
  console.error('Some error:', error);
  return c.json({ error: 'Internal server error' }, 500);
}
```

**之后**:
```typescript
} catch (error: any) {
  console.error('[HTTP_METHOD /api/route/path] Error:', error);
  console.error('Stack:', error.stack);
  throw createError('操作失败: ' + (error.message || 'Unknown error'), 500, {
    originalError: error.message
  });
}
```

### 步骤 3: 测试

```bash
# 重新构建
npm run build

# 重启服务
pm2 restart review-system

# 测试 API
curl http://localhost:3000/api/your-endpoint
```

---

## 📋 待更新的路由列表

- ✅ `src/routes/templates.ts` (已完成)
- ⏳ `src/routes/reviews.ts`
- ⏳ `src/routes/teams.ts`
- ⏳ `src/routes/admin.ts`
- ⏳ `src/routes/ai_books.ts`
- ⏳ `src/routes/marketplace.ts`
- ⏳ `src/routes/agents.ts`
- ⏳ `src/routes/auth.ts`
- ⏳ `src/routes/payment.ts`
- ⏳ 其他所有路由...

---

## 🛠️ 常见错误类型及处理

### 1. 数据库错误
```typescript
throw createError('数据库操作失败: ' + error.message, 500, {
  query: 'SELECT ...',
  params: [1, 2, 3]
});
```

### 2. API 调用错误
```typescript
throw createError('外部服务调用失败: ' + error.message, 502, {
  api: 'Gemini API',
  endpoint: '/v1/generate'
});
```

### 3. 验证错误
```typescript
throw createError('输入数据无效: ' + error.message, 400, {
  field: 'email',
  value: 'invalid@'
});
```

### 4. 权限错误
```typescript
throw createError('没有权限执行此操作', 403, {
  userId: user.id,
  requiredRole: 'admin',
  actualRole: user.role
});
```

---

## 📊 错误响应状态码

| 状态码 | 含义 | 用途 |
|-------|------|------|
| 400 | Bad Request | 验证错误、参数错误 |
| 401 | Unauthorized | 未登录、Token 无效 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器错误、数据库错误 |
| 502 | Bad Gateway | 外部 API 调用失败 |
| 504 | Gateway Timeout | 请求超时 |

---

## 🧪 测试命令

```bash
# 构建项目
cd /home/user/webapp && npm run build

# 重启服务
pm2 restart review-system

# 查看日志
pm2 logs review-system --nostream --lines 20

# 测试端点
curl http://localhost:3000/
curl http://localhost:3000/api/templates

# 查看 PM2 状态
pm2 list
```

---

## 📝 提交代码

```bash
cd /home/user/webapp
git add -A
git commit -m "feat: 改进 [路由名称] 的错误处理"
git log --oneline -5
```

---

## 🔍 调试技巧

### 1. 查看完整错误日志
```bash
pm2 logs review-system --lines 50
```

### 2. 查看 Wrangler 日志
```bash
cat ~/.config/.wrangler/logs/wrangler-*.log
```

### 3. 测试特定 API
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Template"}' \
  -v
```

---

## 📚 相关文档

- [ERROR_HANDLING_IMPROVEMENT_2025-11-21.md](./ERROR_HANDLING_IMPROVEMENT_2025-11-21.md) - 完整改进报告
- [502_ERROR_GUIDE.md](./502_ERROR_GUIDE.md) - 502 错误排查指南
- [src/middleware/errorHandler.ts](./src/middleware/errorHandler.ts) - 错误处理中间件源码

---

## ✨ 最佳实践

### ✅ DO
- ✅ 使用 `throw createError()` 而不是 `return c.json()`
- ✅ 记录详细的错误日志（包括堆栈）
- ✅ 提供中文友好的错误信息
- ✅ 附加错误上下文（参数、用户ID等）

### ❌ DON'T
- ❌ 不要吞掉错误（`catch { }`）
- ❌ 不要返回技术性错误信息给用户
- ❌ 不要使用英文错误信息
- ❌ 不要忘记记录错误日志

---

**快速开始**: 从一个路由开始，按照 "步骤 2" 更新所有 catch 块，然后测试。逐步完成所有路由的改进。
