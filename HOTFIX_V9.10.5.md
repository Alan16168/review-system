# Hotfix v9.10.5 - 修复 Unauthorized 错误（会话过期处理）

## 🐛 问题描述
用户在编辑问题时收到 `{"error":"Unauthorized"}` 错误，网络请求中没有 Authorization 头。

### 问题分析
1. **症状**: PUT 请求到 `/api/templates/1/questions/1` 返回 401 Unauthorized
2. **根本原因**: 用户的 JWT token 已过期或无效，但前端没有检测并处理这种情况
3. **请求头**: 完全缺少 `Authorization: Bearer <token>` 头
4. **用户体验差**: 用户不知道为什么操作失败，需要手动刷新页面重新登录

## ✅ 解决方案

### 1. 添加 Axios 响应拦截器
在 `public/static/app.js` 的全局状态声明后，添加了 axios 响应拦截器：

```javascript
// Setup axios response interceptor to handle 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.warn('[AUTH] Received 401 Unauthorized, clearing auth and redirecting to login');
      // Clear auth state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      currentUser = null;
      window.currentUser = null;
      authToken = null;
      delete axios.defaults.headers.common['Authorization'];
      // Show notification and redirect to home
      showNotification(i18n.t('sessionExpired') || 'Session expired, please login again', 'warning');
      showHomePage();
    }
    return Promise.reject(error);
  }
)
```

### 2. 添加 i18n 翻译
为所有6种支持的语言添加了 `sessionExpired` 翻译：

| 语言 | 翻译 |
|------|------|
| 简体中文 (zh) | 登录已过期，请重新登录 |
| English (en) | Session expired, please login again |
| 日本語 (ja) | セッションの有効期限が切れました。再度ログインしてください |
| Español (es) | Sesión expirada, por favor inicie sesión nuevamente |
| 繁體中文 (zh-TW) | 登入已過期，請重新登入 |
| Français (fr) | Session expirée, veuillez vous reconnecter |

## 📝 修改的文件

### 1. `public/static/app.js`
- **位置**: 第1-22行（全局状态声明之后）
- **修改**: 添加 axios 响应拦截器
- **影响**: 全局捕获所有 401 错误

### 2. `public/static/i18n.js`
- **修改**: 在所有6种语言的翻译对象中添加 `sessionExpired` 键
- **位置**: 
  - 简体中文: 第27行（zh）
  - English: 第1156行（en）  
  - 日本語: 第2183行（ja）
  - Español: 第3115行（es）
  - 繁體中文: 第4050行（zh-TW）
  - Français: 第4984行（fr）

## 🔄 工作流程

### 修复前
1. 用户 token 过期
2. 发送 API 请求时没有有效的 Authorization 头
3. 后端返回 401 Unauthorized
4. 前端显示通用错误信息 "操作失败: Unauthorized"
5. 用户不知道需要重新登录

### 修复后
1. 用户 token 过期
2. 发送 API 请求时没有有效的 Authorization 头
3. 后端返回 401 Unauthorized
4. **axios 拦截器捕获 401 错误**
5. **自动清除本地认证状态**
6. **显示友好的"登录已过期"通知**
7. **自动跳转到登录页面**
8. 用户明确知道需要重新登录

## 🧪 验证步骤

### 测试场景
1. ✅ 用户正常登录，token 有效时正常操作
2. ✅ 用户 token 过期后尝试编辑问题
3. ✅ 系统显示"登录已过期，请重新登录"通知
4. ✅ 自动跳转到首页/登录界面
5. ✅ 用户重新登录后可以正常操作

### 相关 API 端点
所有需要认证的 API 端点都会受到保护：
- POST `/api/templates/:id/questions` - 创建问题
- PUT `/api/templates/:templateId/questions/:questionId` - 更新问题（用户报告的问题端点）
- DELETE `/api/templates/:templateId/questions/:questionId` - 删除问题
- 所有其他使用 `authMiddleware` 或 `premiumOrAdmin` 中间件的端点

## 📊 影响范围

### 受益功能
- ✅ 所有需要认证的 API 调用
- ✅ 模板管理（创建、编辑、删除）
- ✅ 问题管理（创建、编辑、删除）
- ✅ 复盘管理（创建、编辑、提交）
- ✅ 用户信息更新
- ✅ 团队管理

### 用户体验改进
1. **明确的错误提示**: 用户知道是会话过期，而不是模糊的"Unauthorized"
2. **自动清理**: 避免用户处于"半登录"状态
3. **自动引导**: 直接跳转到登录页面，减少用户困惑
4. **多语言支持**: 所有语言用户都能看到友好的提示

## 🚀 部署信息

- **版本**: v9.10.5
- **部署时间**: 2025-11-29
- **生产URL**: https://1659a4b9.review-system.pages.dev
- **Git Commit**: 96f7e15

## 🔍 相关修复历史

- **v9.10.1**: 修复新问题类型的表单验证错误
- **v9.10.2**: 修复编辑表单显示逻辑（5个可见性问题）
- **v9.10.3**: 修复缺失的 `question-text-label` ID
- **v9.10.4**: 修复后端 API 验证（支持新问题类型）
- **v9.10.5**: 修复会话过期处理（401 Unauthorized 错误）✅

## ✅ 完成状态

**问题完全解决** ✅

用户报告的 "Unauthorized" 错误现在会被优雅处理：
1. 自动检测会话过期（401 错误）
2. 清除无效的认证状态
3. 显示友好的多语言提示
4. 引导用户重新登录

所有需要认证的功能现在都有完善的会话过期处理机制。

## 📝 技术细节

### Axios 拦截器机制
- **位置**: 响应拦截器（Response Interceptor）
- **触发条件**: `error.response.status === 401`
- **处理逻辑**: 
  1. 清除 localStorage 中的 authToken 和 user
  2. 清除内存中的 currentUser 和 authToken
  3. 删除 axios 全局请求头中的 Authorization
  4. 显示会话过期通知
  5. 跳转到首页（显示登录界面）

### 后端认证流程
```typescript
// src/middleware/auth.ts - authMiddleware
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return c.json({ error: 'Unauthorized' }, 401);  // 触发前端拦截器
}
```

### 前端拦截器流程
```
API Request → 401 Response → Axios Interceptor → Clear Auth → Show Notification → Redirect to Login
```

## 🎯 最佳实践

1. **全局错误处理**: 使用 axios 拦截器统一处理认证错误
2. **用户友好提示**: 提供多语言支持的清晰错误信息
3. **自动状态管理**: 检测到认证失败后自动清理状态
4. **引导式交互**: 自动跳转到登录页面，减少用户困惑

## 🔮 未来优化建议

1. **Token 自动刷新**: 在 token 即将过期时自动请求新 token
2. **操作恢复**: 用户重新登录后，恢复之前的操作状态
3. **更细粒度的错误处理**: 区分 token 过期和权限不足（403）
4. **离线状态检测**: 区分网络错误和认证错误
