# 错误修复：订阅等级字段名称问题

## 🐛 问题描述

在实现"名著复盘"和"文档复盘"功能时，使用了错误的字段名称：
- **错误**: 使用了 `subscription_level`
- **正确**: 应该使用 `subscription_tier`

这导致订阅等级判断失败，Free Member（免费会员）仍然可以看到这两个付费专享标签页。

## 🔍 问题原因

### 数据库字段
数据库中用户表使用的字段名是 `subscription_tier`:
```sql
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
```

### 代码中的错误
1. **前端代码** (app.js): 使用了 `subscription_level`
2. **后端 API** (reviews.ts): 使用了 `subscription_level`
3. **JWT Token**: 未包含 `subscription_tier` 字段
4. **TypeScript 接口**: `UserPayload` 缺少 `subscription_tier` 定义

## ✅ 修复内容

### 1. 更新 TypeScript 接口 (src/utils/auth.ts)

**修改前**:
```typescript
export interface UserPayload {
  id: number;
  email: string;
  username: string;
  role: string;
}
```

**修改后**:
```typescript
export interface UserPayload {
  id: number;
  email: string;
  username: string;
  role: string;
  subscription_tier?: string;
}
```

### 2. 更新 JWT Token 生成 (src/routes/auth.ts)

**修改前**:
```typescript
const token = generateToken({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role
}, c.env.JWT_SECRET);
```

**修改后**:
```typescript
const token = generateToken({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  subscription_tier: user.subscription_tier || 'free'
}, c.env.JWT_SECRET);
```

### 3. 更新后端 API 权限检查 (src/routes/reviews.ts)

**修改前**:
```typescript
if (user.subscription_level === 'free') {
  return c.json({ error: 'Premium subscription required' }, 403);
}
```

**修改后**:
```typescript
if (!user.subscription_tier || user.subscription_tier === 'free') {
  return c.json({ error: 'Premium subscription required' }, 403);
}
```

### 4. 更新前端权限判断 (public/static/app.js)

**修改前**:
```javascript
${currentUser && currentUser.subscription_level !== 'free' ? `
```

**修改后**:
```javascript
${currentUser && currentUser.subscription_tier && currentUser.subscription_tier !== 'free' ? `
```

## 🔐 权限逻辑

### 显示条件
```javascript
// 必须同时满足以下条件才显示标签页：
1. currentUser 存在（已登录）
2. currentUser.subscription_tier 存在（有订阅等级）
3. currentUser.subscription_tier !== 'free'（不是免费会员）
```

### 用户类型映射

| 订阅等级 | 字段值 | 是否显示新标签页 |
|---------|--------|----------------|
| Free Member | `free` | ❌ 不显示 |
| Basic Member | `basic` | ✅ 显示 |
| Premium Member | `premium` | ✅ 显示 |
| Super Member | `super` | ✅ 显示 |
| VIP Member | `vip` | ✅ 显示 |

## 🌐 部署信息

### 生产环境
- **主域名**: https://review-system.pages.dev
- **最新部署**: https://b555116e.review-system.pages.dev
- **状态**: ✅ 在线运行
- **JS 版本**: v7.9.0

### 提交记录
- **9597c75** - 修复：使用正确的字段名 subscription_tier 而非 subscription_level
- **9621111** - 更新版本号到 v7.9.0

## ✅ 验证方法

### 1. 检查 JWT Token
登录后，在浏览器控制台查看 token 内容：
```javascript
// 解码 token (仅用于调试，生产环境不要暴露)
const token = localStorage.getItem('authToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
// 应该包含 subscription_tier 字段
```

### 2. 测试 Free Member
```bash
# 创建或使用 free 订阅级别的用户
# 登录后进入 Dashboard
# 确认只看到 "My Reviews" 和 "Public Reviews" 两个标签
# 不应该看到 "Famous Book Review" 和 "Documents Review"
```

### 3. 测试 Premium Member
```bash
# 创建或使用 premium/basic/super 订阅级别的用户
# 登录后进入 Dashboard
# 确认能看到全部四个标签：
# - My Reviews
# - Public Reviews
# - Famous Book Review ✨
# - Documents Review ✨
```

### 4. 测试 API 权限
```bash
# 使用 free 会员 token（应返回 403）
curl -H "Authorization: Bearer FREE_USER_TOKEN" \
  https://review-system.pages.dev/api/reviews/famous-books

# 使用付费会员 token（应返回 200）
curl -H "Authorization: Bearer PREMIUM_USER_TOKEN" \
  https://review-system.pages.dev/api/reviews/famous-books
```

## 📝 注意事项

### 1. Token 刷新
用户需要重新登录才能获取包含 `subscription_tier` 的新 token。
- 旧 token 不包含此字段，会被判断为 free 会员
- 新 token 包含此字段，正确识别订阅级别

### 2. 默认值处理
```typescript
subscription_tier: user.subscription_tier || 'free'
```
如果数据库中该字段为 NULL，默认设为 'free'

### 3. 空值检查
```javascript
currentUser.subscription_tier && currentUser.subscription_tier !== 'free'
```
先检查字段是否存在，再检查值

## 🔗 相关文件

### 修改的文件
1. `src/utils/auth.ts` - 添加 subscription_tier 到接口
2. `src/routes/auth.ts` - JWT token 包含 subscription_tier
3. `src/routes/reviews.ts` - 修正权限检查字段名
4. `public/static/app.js` - 修正前端判断字段名
5. `src/index.tsx` - 更新版本号到 v7.9.0

### 相关文档
- `FEATURE_FAMOUS_BOOKS_DOCUMENTS_2025-11-22.md` - 功能说明文档

## 🎯 测试清单

- [ ] Free Member 登录后不显示新标签页
- [ ] Premium Member 登录后显示新标签页
- [ ] API 正确验证 free 会员返回 403
- [ ] API 正确允许 premium 会员访问
- [ ] JWT token 包含 subscription_tier 字段
- [ ] 旧用户重新登录后获取新 token

---
**修复状态**: ✅ 已完成
**部署状态**: ✅ 已上线
**版本**: v7.9.0
