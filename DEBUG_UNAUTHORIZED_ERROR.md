# Debug Guide: Unauthorized Error 调试指南

## 🔍 问题描述
用户在编辑问题时收到 `{"error":"Unauthorized"}` 错误。

## 📊 可能的原因

### 1. **Token 未发送** (最可能)
- Authorization 头缺失
- authToken 变量为空
- axios 配置未正确设置

### 2. **Token 已过期**
- JWT token 超过 7 天有效期
- 需要重新登录

### 3. **权限不足** (如果是403而不是401)
- 用户角色是 'user'（普通用户）
- 需要 'premium' 或 'admin' 角色才能编辑模板问题

## 🧪 调试步骤

### Step 1: 打开浏览器开发者工具
1. 在浏览器中按 `F12` 打开开发者工具
2. 切换到 **Console（控制台）** 标签

### Step 2: 尝试编辑问题
1. 进入模板管理页面
2. 点击某个问题的编辑按钮
3. 修改问题内容
4. 点击"保存"或"更新"按钮

### Step 3: 查看控制台输出
在控制台中查找以下调试信息：

```
[DEBUG] authToken: Present / Missing
[DEBUG] currentUser: { id: ..., username: ..., role: ... }
[DEBUG] axios Authorization header: Bearer eyJhbGc...
```

## 📝 诊断结果

### 情况 A: authToken 显示 "Missing"
**诊断**: Token 不存在，用户需要重新登录

**解决方案**:
1. 退出登录
2. 重新登录
3. 再次尝试编辑

### 情况 B: authToken 显示 "Present" 但 Authorization header 为空
**诊断**: axios 配置问题

**解决方案**: 
- 代码已添加自动修复逻辑
- 刷新页面后重试

### 情况 C: Authorization header 存在但仍返回 401
**诊断**: Token 可能已过期或无效

**解决方案**:
1. 清除浏览器缓存
2. 退出登录
3. 重新登录
4. 再次尝试

### 情况 D: 返回 403 Forbidden 而不是 401
**诊断**: 权限不足

**问题**: 用户角色是 'user'（普通用户），但编辑模板问题需要 'premium' 或 'admin' 角色

**解决方案**:
- 联系管理员升级为 premium 用户
- 或者管理员需要修改权限设计

## 🔧 已实施的修复

### v9.10.5 - Axios 拦截器
- 添加全局 401 错误处理
- 自动清除过期认证状态
- 显示友好的"登录已过期"提示

### v9.10.6-debug - 调试日志和显式 Token 设置
- 添加详细的调试日志
- 在发送请求前检查 authToken
- 显式重新设置 Authorization 头
- 如果 token 缺失，立即提示重新登录

## 🎯 下一步行动

### 如果是 Token 问题
1. ✅ 用户重新登录即可解决
2. ✅ Axios 拦截器会自动处理后续的 401 错误

### 如果是权限问题
需要确认产品需求：

**选项 1**: 只允许 premium/admin 用户编辑模板
- 前端隐藏普通用户的编辑按钮
- 显示升级提示

**选项 2**: 允许所有用户编辑自己创建的模板
- 修改 `premiumOrAdmin` 中间件
- 添加所有权检查逻辑

**选项 3**: 完全开放模板编辑功能
- 移除 `premiumOrAdmin` 中间件
- 只使用 `authMiddleware`

## 📞 收集信息

请用户提供以下信息：

1. **控制台截图**: 显示 `[DEBUG]` 开头的日志
2. **网络请求**: Network 标签中 PUT 请求的详细信息
   - Request Headers
   - Response Headers
   - Response Body
3. **用户信息**: 
   - 用户角色（user / premium / admin）
   - 注册时间
   - 是否能看到模板管理页面

## 🚀 部署信息

- **调试版本**: https://7aa6fcf5.review-system.pages.dev
- **Git Commit**: 5afef0c
- **部署时间**: 2025-11-29

## 💡 临时解决方案

如果用户急需使用，可以：
1. 联系管理员将用户角色升级为 `premium`
2. 使用管理员账号进行模板编辑
3. 等待权限设计的最终确认和修复
