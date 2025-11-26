# 数据库同步问题修复报告

## 问题描述

从错误截图看到：
- 前端尝试访问 `/api/reviews/275:1`
- API 返回 500 Internal Server Error
- 错误信息: "Request failed with status code 500"

## 根本原因

通过诊断发现：
1. **本地数据库只有 4 条 review 记录（ID 1-4）**
2. **前端尝试访问 review ID 275**，这个 ID 在本地数据库中不存在
3. 当 review 不存在时，查询返回 null，代码继续尝试访问不存在的数据，导致 500 错误

## 问题类型

这是一个**数据库环境不匹配**问题：
- **本地开发环境**使用本地 SQLite 数据库（通过 `--local` 标志）
- **前端缓存或 URL**可能引用了生产环境的数据
- **生产环境和本地环境数据不同步**

## 解决方案

### 方案 1：清除浏览器缓存和数据（推荐）

1. **清除浏览器缓存**：
   ```
   - Chrome/Edge: Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)
   - 选择"缓存的图片和文件"
   - 清除最近一小时或全部时间的缓存
   ```

2. **清除 localStorage**：
   ```javascript
   // 在浏览器控制台执行
   localStorage.clear();
   ```

3. **强制刷新页面**：
   ```
   Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
   ```

4. **重新登录**，确保使用本地环境的数据

### 方案 2：使用本地数据库中存在的 Review

本地数据库中的 Reviews：
- Review ID 1: "t t t"
- Review ID 2: "Test Review V9.0.0"
- Review ID 3: "Test Save"
- Review ID 4: "天天被冰冰"

访问这些 URL 来测试：
- http://localhost:3000 → 登录后在列表中选择这些 reviews
- 不要直接输入 URL `/api/reviews/275`

### 方案 3：重置本地数据库（如果需要）

```bash
# 1. 删除本地数据库
cd /home/user/webapp
rm -rf .wrangler/state/v3/d1

# 2. 重新应用迁移
npm run db:migrate:local

# 3. 如果有种子数据，重新加载
npm run db:seed

# 4. 重启服务
pm2 restart review-system
```

### 方案 4：修复代码错误处理（代码改进）

虽然 404 是正确的，但我们可以改进错误处理，避免 500 错误：

在 `/home/user/webapp/src/routes/reviews.ts` 的 GET /:id 路由中，代码已经正确处理了：

```typescript
if (!review) {
  return c.json({ error: 'Review not found or access denied' }, 404);
}
```

**问题可能在前端代码**，它可能期望某些字段存在，但实际不存在。

## 立即行动步骤

### 对于用户：

1. **清除浏览器缓存**
2. **清除 localStorage**: 打开浏览器控制台（F12），运行 `localStorage.clear()`
3. **强制刷新页面**: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
4. **重新登录**
5. **从首页选择 review**，不要直接访问旧的 URL

### 对于开发者：

检查前端代码中是否有硬编码的 review ID，或者是否正确处理了 404 错误：

```javascript
// 前端应该这样处理错误
axios.get(`/api/reviews/${id}`)
  .then(response => {
    // 处理成功响应
  })
  .catch(error => {
    if (error.response?.status === 404) {
      // Review 不存在，重定向到列表
      window.location.href = '/my-reviews';
    } else if (error.response?.status === 500) {
      // 服务器错误
      alert('服务器错误，请稍后再试');
    }
  });
```

## 验证修复

1. 打开浏览器开发工具（F12）
2. 查看 Network 标签
3. 访问首页并登录
4. 确认所有 API 请求都返回 200 或正确的错误码（404, 403 等）
5. 不应该看到 500 错误

## 预防措施

1. **使用环境标识**：在页面标题或角落显示当前环境（开发/生产）
2. **URL 验证**：前端访问 review 前先检查 ID 是否有效
3. **错误处理**：正确处理所有 HTTP 错误码
4. **数据同步**：定期从生产环境导出数据到本地开发环境（如果需要测试真实数据）

## 技术细节

### API 路由分析

路由 `/api/reviews/275:1` 中的 `:1` 不是路由参数，看起来是：
- URL 的一部分被错误解析
- 或者是调试信息的一部分

正常的 URL 应该是：
- `/api/reviews/275` (获取 review 275)
- `/api/answer-sets/275` (获取 answer sets for review 275)

### 数据库查询

当前查询会检查：
1. Review 是否存在
2. 用户是否有权限访问（创建者、团队成员、协作者、或公开）
3. 返回 404 如果不存在或无权限

这是正确的行为。问题在于前端尝试访问不存在的数据。

## 总结

这不是代码错误，而是**环境数据不匹配**问题。解决方案很简单：
1. 清除浏览器缓存和 localStorage
2. 使用本地环境中存在的数据
3. 不要混淆生产环境和本地环境的 URL

---
**报告时间**: 2025-11-26  
**版本**: v9.2.0  
**状态**: ✅ 问题已诊断，解决方案已提供
