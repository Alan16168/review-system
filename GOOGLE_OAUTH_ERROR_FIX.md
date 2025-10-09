# Google OAuth 错误修复指南

## 🐛 错误信息

```
Access blocked: Authorization Error
no registered origin
Error 401: invalid_client
```

## 🔍 问题原因

Google OAuth 客户端 ID 需要在 Google Cloud Console 中配置**授权的 JavaScript 来源**（Authorized JavaScript origins）。当前的开发环境 URL 没有被添加到授权列表中。

## ✅ 解决方案

### 步骤 1: 登录 Google Cloud Console

1. 访问: https://console.cloud.google.com/
2. 使用创建 OAuth 客户端的 Google 账号登录

### 步骤 2: 进入凭据页面

1. 点击左上角的菜单（☰）
2. 选择 **APIs & Services** > **Credentials**
3. 或直接访问: https://console.cloud.google.com/apis/credentials

### 步骤 3: 找到您的 OAuth 2.0 客户端

1. 在 "OAuth 2.0 Client IDs" 列表中找到:
   ```
   Client ID: 78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps.googleusercontent.com
   ```
2. 点击客户端名称或右侧的 **编辑图标（铅笔）**

### 步骤 4: 配置授权来源

#### A. 添加开发环境 URL

在 **Authorized JavaScript origins** 部分，点击 **+ ADD URI** 并添加:

```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

**重要提示**:
- ✅ 使用 HTTPS（不是 HTTP）
- ✅ 不要在末尾添加斜杠 `/`
- ✅ 包含完整的子域名
- ✅ 包含端口号（如果有）

#### B. 添加本地开发 URL（可选）

如果您也在本地开发，可以添加:

```
http://localhost:3000
http://127.0.0.1:3000
```

**注意**: 本地开发可以使用 HTTP

### 步骤 5: 配置重定向 URI（可选）

在 **Authorized redirect URIs** 部分，添加相同的 URL:

```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/
```

### 步骤 6: 保存配置

1. 点击页面底部的 **SAVE** 按钮
2. 等待几秒钟让更改生效（通常是即时的）

### 步骤 7: 测试 Google 登录

1. 刷新应用页面: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
2. 点击 "登录"
3. 点击 Google 登录按钮
4. 选择 Google 账号
5. ✅ 应该成功登录！

---

## 📸 配置截图示例

### 1. OAuth 客户端编辑页面

```
┌─────────────────────────────────────────────────────────┐
│ Edit OAuth client                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Client ID:                                               │
│ 78785931273-pse627aasv4h50mcc1cschj5cvtqr88f...         │
│                                                          │
│ Client secret:                                           │
│ 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                     │
│                                                          │
│ Authorized JavaScript origins                            │
│ ┌───────────────────────────────────────────────────┐  │
│ │ https://3000-i1l7k2pbfdion8sxilbu1-6532622b...   │  │
│ └───────────────────────────────────────────────────┘  │
│ [+ ADD URI]                                              │
│                                                          │
│ Authorized redirect URIs                                 │
│ ┌───────────────────────────────────────────────────┐  │
│ │ https://3000-i1l7k2pbfdion8sxilbu1-6532622b...   │  │
│ └───────────────────────────────────────────────────┘  │
│ [+ ADD URI]                                              │
│                                                          │
│                                    [CANCEL]  [SAVE]      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 生产环境部署配置

当您部署到 Cloudflare Pages 后，需要添加生产环境 URL:

### 示例配置

**Authorized JavaScript origins**:
```
https://webapp.pages.dev
https://www.yourdomain.com
```

**Authorized redirect URIs**:
```
https://webapp.pages.dev
https://www.yourdomain.com
```

---

## 🚨 常见问题

### Q1: 保存后仍然报错？
**A**: 等待 5-10 分钟让更改传播到所有 Google 服务器。

### Q2: 我没有访问 Google Cloud Console 的权限？
**A**: 
- 确保使用创建 OAuth 客户端的 Google 账号登录
- 或请求项目所有者授予您访问权限

### Q3: 找不到我的 OAuth 客户端？
**A**: 
1. 确认您在正确的 Google Cloud 项目中
2. 检查项目选择器（页面顶部）
3. 搜索 Client ID: `78785931273-pse627aasv4h50mcc1cschj5cvtqr88f`

### Q4: 可以添加多个 URL 吗？
**A**: 可以！您可以添加:
- 开发环境 URL
- 测试环境 URL  
- 生产环境 URL
- 本地开发 URL

### Q5: 为什么需要 HTTPS？
**A**: Google OAuth 要求线上环境使用 HTTPS 以保证安全。只有 localhost 可以使用 HTTP。

---

## 🎯 快速检查清单

在配置 Google OAuth 之前，确保:

- [ ] 您有 Google Cloud Console 的访问权限
- [ ] 您知道正确的项目名称
- [ ] 您有 Client ID 和 Client Secret
- [ ] 您知道应用的完整 URL（包括协议和端口）
- [ ] URL 使用 HTTPS（生产环境）
- [ ] OAuth consent screen 已配置

---

## 🔐 安全提示

1. **不要共享 Client Secret**: 
   - 保持 `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` 私密
   - 不要提交到公共代码仓库

2. **定期轮换凭据**: 
   - 每 90-180 天更换一次 Client Secret

3. **最小权限原则**: 
   - 只请求必要的 OAuth 作用域
   - 当前配置: `email`, `profile`

4. **监控使用情况**: 
   - 在 Google Cloud Console 中查看 API 使用统计

---

## 📞 需要帮助？

如果您在配置过程中遇到问题：

1. **查看 Google OAuth 文档**:
   - https://developers.google.com/identity/protocols/oauth2

2. **检查 OAuth 状态**:
   - https://console.cloud.google.com/apis/credentials

3. **测试配置**:
   - 使用 Google OAuth Playground: https://developers.google.com/oauthplayground/

---

**配置完成后，请刷新应用并重新尝试 Google 登录！** ✅
