# Google Cloud Console 完整配置核对清单

## 📋 项目信息

**OAuth 客户端名称**: reviewsystem (或类似名称)  
**Client ID**: `78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps.googleusercontent.com`  
**Client Secret**: `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`  
**API Key**: `AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs`  

**当前应用 URL**: `https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev`

---

## ✅ 配置步骤详解

### 🔐 **第一部分：OAuth 2.0 客户端配置**

#### 步骤 1: 访问凭据页面
```
https://console.cloud.google.com/apis/credentials
```

#### 步骤 2: 找到 OAuth 客户端
在 "OAuth 2.0 Client IDs" 列表中找到名为 **"reviewsystem"** 的客户端（或使用 Client ID 搜索）

**识别方法**:
- 名称可能是: reviewsystem, Review System, 或类似
- Client ID: `78785931273-pse627aasv4h50mcc1cschj5cvtqr88f...`

#### 步骤 3: 编辑 OAuth 客户端
点击客户端名称或右侧的编辑图标（铅笔）

#### 步骤 4: 配置授权来源

**在 "Authorized JavaScript origins" 部分添加**:

✅ **必须添加**:
```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

📝 **可选添加**（如果本地开发）:
```
http://localhost:3000
http://127.0.0.1:3000
```

**⚠️ 格式要求**:
- ✅ 使用 `https://`（线上环境）或 `http://`（仅 localhost）
- ✅ 不要在末尾添加斜杠 `/`
- ✅ 包含完整的子域名
- ✅ 包含端口号（如 `:3000`）

#### 步骤 5: 配置重定向 URI

**在 "Authorized redirect URIs" 部分添加**:

✅ **推荐添加**:
```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/
```

**注意**: 两个都添加（一个有斜杠，一个没有）

#### 步骤 6: 保存
点击底部的蓝色 **"SAVE"** 按钮

---

### 🔑 **第二部分：API Key 配置**

#### 检查 API Key 设置

1. 在凭据页面找到 **"API Keys"** 部分
2. 找到名为 **"reviewsystem"** 的 API Key
3. 确认 API Key 值为: `AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs`

#### API 限制设置（可选但推荐）

点击 API Key 名称，检查以下设置：

**应用限制**:
- ✅ 推荐: "HTTP referrers (web sites)"
- 添加: `https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/*`

**API 限制**:
- ✅ 推荐: "Restrict key"
- 启用的 API:
  - ✅ YouTube Data API v3
  - ✅ Custom Search API（可选，如果需要文章搜索）

---

### 🎯 **第三部分：OAuth Consent Screen（同意屏幕）**

#### 访问 OAuth 同意屏幕配置
```
https://console.cloud.google.com/apis/credentials/consent
```

#### 检查配置

**用户类型**:
- 内部（仅组织内用户）
- **或** 外部（任何 Google 账号）

**应用信息**:
- ✅ 应用名称: reviewsystem 或 Review System
- ✅ 用户支持电子邮件: 有效邮箱
- ✅ 授权域名（如果有）

**作用域（Scopes）**:
- ✅ `.../auth/userinfo.email` - 查看电子邮件地址
- ✅ `.../auth/userinfo.profile` - 查看基本个人资料信息
- ✅ `openid` - OpenID Connect

**测试用户**（如果状态为 "Testing"）:
- 添加您要测试的 Google 账号

---

## 📸 配置示例

### OAuth 客户端编辑页面应该看起来像这样:

```
┌─────────────────────────────────────────────────────────────┐
│ Edit OAuth client                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Name: reviewsystem                                           │
│                                                              │
│ Application type: Web application                            │
│                                                              │
│ Client ID:                                                   │
│ 78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps...       │
│                                                              │
│ Client secret:                                               │
│ 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                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Authorized JavaScript origins                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ URIs  1                                                      │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ [+ ADD URI]                                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Authorized redirect URIs                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ URIs  2                                                      │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev  │  │
│ └───────────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev/ │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ [+ ADD URI]                                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                  [CANCEL]  [SAVE]            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ 配置完成检查清单

配置完成后，请确认：

### OAuth 客户端配置
- [ ] 找到了名为 "reviewsystem" 的 OAuth 客户端
- [ ] Client ID 匹配: `78785931273-pse627aasv4h50mcc1cschj5cvtqr88f...`
- [ ] 已添加 Authorized JavaScript origin: `https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev`
- [ ] 已添加 Authorized redirect URI（至少一个）
- [ ] 已点击 SAVE 保存

### API Key 配置
- [ ] 找到了名为 "reviewsystem" 的 API Key
- [ ] API Key 值匹配: `AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs`
- [ ] （可选）已设置 HTTP referrer 限制
- [ ] （可选）已启用 YouTube Data API v3

### OAuth Consent Screen
- [ ] 应用名称已设置
- [ ] 用户支持电子邮件已设置
- [ ] 作用域包含 email 和 profile
- [ ] 如果是 Testing 状态，已添加测试用户

---

## 🧪 测试步骤

配置保存后，立即测试：

### 1. 刷新应用
```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

### 2. 清除浏览器缓存
- 按 `Ctrl + Shift + R`（Windows/Linux）
- 或 `Cmd + Shift + R`（Mac）

### 3. 点击登录
- 点击 "登录" 或 "开始复盘"
- 应该看到 Google 登录按钮

### 4. 测试 Google 登录
- 点击 Google 登录按钮
- 选择 Google 账号
- **✅ 应该成功登录！**

---

## 🚨 常见错误及解决方案

### 错误 1: "Error 401: invalid_client"
**原因**: Authorized JavaScript origins 未配置  
**解决**: 确保添加了正确的 URL（包括 `https://` 和端口号）

### 错误 2: "no registered origin"  
**原因**: 同上  
**解决**: 检查 URL 是否完全匹配（不要有多余空格或斜杠）

### 错误 3: "redirect_uri_mismatch"
**原因**: Authorized redirect URIs 未配置  
**解决**: 添加完整的重定向 URI

### 错误 4: "access_denied"
**原因**: OAuth Consent Screen 未配置或测试用户未添加  
**解决**: 检查同意屏幕配置和测试用户列表

### 错误 5: 保存后仍然报错
**原因**: 更改需要时间传播  
**解决**: 等待 1-2 分钟，清除浏览器缓存

---

## 📞 需要帮助？

如果配置过程中遇到问题：

1. **截图当前配置**发给我
2. **复制错误信息**告诉我
3. **确认项目名称**和账号是否正确

---

## 🎯 关键 URL 总结

**要配置的 URL**:
```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

**配置位置**:
```
https://console.cloud.google.com/apis/credentials
```

**测试 URL**:
```
https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
```

---

**完成配置后，请告诉我测试结果！** ✅
