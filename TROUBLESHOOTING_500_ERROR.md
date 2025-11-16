# 500 错误故障排查指南

## 🔍 当前状态

**问题**: `GET /api/reviews/217` 返回 500 Internal Server Error  
**最后部署**: 2025-11-16 00:21 UTC  
**部署 ID**: b0e13665

## ✅ 已确认修复

1. ✅ 源代码已修复（移除对 name_en/description_en 的依赖）
2. ✅ Git 代码已提交并推送
3. ✅ Worker 已重新构建和部署
4. ✅ 数据库结构已验证
5. ✅ 测试数据存在（复盘 217, 模板 10）

## 🐛 可能的原因

### 1. Cloudflare CDN 缓存未完全更新
**症状**: API 返回 500，但代码已修复  
**原因**: Worker 代码已部署，但 CDN 边缘节点还在使用旧缓存  
**解决方案**: 等待 5-15 分钟

### 2. 浏览器缓存了旧的前端代码
**症状**: 前端 JavaScript 使用旧的 API 调用  
**原因**: app.js 文件被浏览器缓存  
**解决方案**: 硬刷新（Ctrl+Shift+R）

### 3. Service Worker 缓存
**症状**: 即使硬刷新也看到旧版本  
**原因**: Service Worker 拦截请求  
**解决方案**: 打开 DevTools → Application → Service Workers → Unregister

## 🔧 排查步骤

### 步骤 1：验证 Worker 版本
```bash
curl -I https://review-system.pages.dev/
# 检查 CF-Ray 头，不同的 Ray ID 说明请求到了不同节点
```

### 步骤 2：测试 API（无认证）
```bash
curl https://review-system.pages.dev/api/templates
# 应返回 401 Unauthorized（这是正常的）
# 如果返回 500，说明 Worker 还有问题
```

### 步骤 3：清除所有缓存
1. 关闭所有浏览器标签
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 重启浏览器
4. 使用隐身模式访问

### 步骤 4：检查 Network 时间线
1. 打开 DevTools → Network
2. 点击失败的请求
3. 查看 Timing 标签
4. 如果 "Waiting (TTFB)" 很长，说明服务器在处理
5. 如果立即返回，说明是缓存响应

### 步骤 5：检查请求头
```
Request Headers:
- Cache-Control: no-cache
- Pragma: no-cache

Response Headers:
- CF-Cache-Status: MISS/HIT/DYNAMIC
- CF-Ray: 唯一 ID
```

## 🚨 紧急修复方案

如果等待 CDN 更新后仍然出现 500 错误：

### 选项 1：添加调试日志
修改 `src/routes/reviews.ts` 添加详细日志：

```typescript
reviews.get('/:id', async (c) => {
  try {
    console.log('[DEBUG] Fetching review:', c.req.param('id'));
    const user = c.get('user') as UserPayload;
    console.log('[DEBUG] User:', user.id);
    
    // ... 现有代码 ...
    
    console.log('[DEBUG] Review found:', review?.id);
    return c.json({ review, questions, answersByQuestion, collaborators });
  } catch (error) {
    console.error('[ERROR] Get review failed:', error);
    console.error('[ERROR] Stack:', error.stack);
    return c.json({ 
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, 500);
  }
});
```

### 选项 2：回滚到上一个工作版本
```bash
cd /home/user/webapp
git log --oneline | head -10  # 查看提交历史
git checkout <last-working-commit>
npm run deploy
```

### 选项 3：创建健康检查端点
添加到 `src/index.tsx`：

```typescript
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '5.27.0'
  });
});
```

## 📊 预期 vs 实际

### 预期行为
```
GET /api/reviews/217
Authorization: Bearer <token>

Response: 200 OK
{
  "review": {...},
  "questions": [...],
  "answersByQuestion": {...}
}
```

### 实际行为
```
GET /api/reviews/217
Authorization: Bearer <token>

Response: 500 Internal Server Error
{"error": "Internal server error"}
```

## 🕐 时间线

| 时间 | 事件 |
|------|------|
| 22:21 UTC | 修复部署 (#ce2d272) |
| 22:27 UTC | 配置更新部署 (#98cda32) |
| 00:16 UTC | 清除缓存重新部署 (#b0e13665) |
| 00:21 UTC | 强制部署 |
| **现在** | **等待 CDN 更新** |

## ✅ 验证清单

等待 15 分钟后，按顺序验证：

- [ ] 硬刷新浏览器（Ctrl+Shift+R）
- [ ] 测试 `/api/templates`端点（应返回 401）
- [ ] 清除所有浏览器缓存
- [ ] 使用隐身模式测试
- [ ] 在不同浏览器测试（Chrome, Firefox, Safari）
- [ ] 在不同设备测试（电脑, 手机）
- [ ] 检查控制台错误日志
- [ ] 验证 Network 标签中的请求

## 💡 额外建议

1. **添加版本号到 API**: 在响应中包含部署版本
2. **使用版本化 URL**: `/api/v1/reviews/217`
3. **设置更短的缓存时间**: Cache-Control: max-age=60
4. **添加健康检查**: `/api/health` 端点
5. **实施错误监控**: 集成 Sentry 或类似工具

## 📞 需要帮助？

如果按照以上步骤操作 30 分钟后仍然失败：

1. **提供以下信息**:
   - 完整的 Network 请求详情（Headers, Response）
   - 控制台完整错误日志
   - CF-Ray ID（从响应头获取）
   - 浏览器和操作系统信息

2. **临时解决方案**:
   - 使用 curl 命令行直接测试 API
   - 使用 Postman 或类似工具测试
   - 检查是否是特定用户或特定复盘的问题

3. **联系支持**:
   - 提供 CF-Ray ID
   - 提供准确的错误时间（UTC）
   - 描述重现步骤

---

**当前建议**: 等待 15 分钟让 Cloudflare CDN 完全更新，然后硬刷新浏览器重试。

**最后更新**: 2025-11-16 00:25 UTC
