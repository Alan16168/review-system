# Google OAuth 登录配置指南

本文档说明如何为系统复盘平台配置Google账号登录功能。

## 📋 功能概述

用户可以通过以下方式登录/注册：
1. **Google账号** - 一键登录，无需记住密码
2. **传统方式** - 邮箱和密码注册/登录

## 🔑 配置步骤

### 1. 创建Google Cloud项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 项目名称建议：`review-system` 或 `系统复盘平台`

### 2. 启用Google Sign-In API

1. 在左侧菜单选择 **APIs & Services** > **Library**
2. 搜索 `Google Sign-In API` 或 `Google Identity Services`
3. 点击 **Enable** 启用API

### 3. 配置OAuth同意屏幕

1. 进入 **APIs & Services** > **OAuth consent screen**
2. 选择 **External**（外部用户类型）
3. 填写应用信息：
   - **App name**: 系统复盘平台
   - **User support email**: your-email@example.com
   - **Developer contact email**: your-email@example.com
4. 添加作用域（Scopes）：
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
5. 添加测试用户（开发阶段）
6. 点击 **Save and Continue**

### 4. 创建OAuth 2.0客户端ID

1. 进入 **APIs & Services** > **Credentials**
2. 点击 **Create Credentials** > **OAuth client ID**
3. 选择 **Web application**
4. 配置：
   - **Name**: Review System Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-domain.pages.dev
     https://your-custom-domain.com
     ```
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3000
     https://your-domain.pages.dev
     ```
5. 点击 **Create**
6. **重要**：记录下 `Client ID` 和 `Client Secret`

### 5. 配置本地开发环境

#### 5.1 创建 `.dev.vars` 文件

在项目根目录创建 `.dev.vars` 文件（已在.gitignore中）：

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 5.2 更新前端配置

编辑 `public/static/app.js`，将以下代码中的 `YOUR_GOOGLE_CLIENT_ID` 替换为实际的Client ID：

**在登录页面（约第680行）：**
```javascript
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"  // 替换这里
     data-callback="handleGoogleLogin"
     data-auto_prompt="false">
</div>
```

**在注册页面（约第735行）：**
```javascript
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"  // 替换这里
     data-callback="handleGoogleLogin"
     data-auto_prompt="false">
</div>
```

或者使用查找替换：
```bash
# 在项目根目录执行
sed -i 's/YOUR_GOOGLE_CLIENT_ID/你的实际Client-ID/g' public/static/app.js
```

### 6. 配置生产环境（Cloudflare Pages）

#### 6.1 设置环境变量

```bash
# 设置Google Client ID
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name webapp

# 设置Google Client Secret  
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name webapp
```

#### 6.2 更新生产环境前端配置

在部署到生产环境前，确保 `public/static/app.js` 中的 `YOUR_GOOGLE_CLIENT_ID` 已替换为实际的Client ID。

**注意**：Client ID是公开的，可以直接写在前端代码中。Client Secret必须保密，只能在后端使用。

### 7. 验证配置

#### 7.1 本地测试

```bash
# 启动开发服务器
npm run build
pm2 start ecosystem.config.cjs

# 访问
http://localhost:3000
```

在登录/注册页面，应该能看到：
- ✅ Google登录按钮（带Google图标）
- ✅ "或" 分隔线
- ✅ 传统邮箱密码输入框

#### 7.2 测试登录流程

1. 点击 **Continue with Google** 按钮
2. 选择Google账号
3. 授权应用访问基本信息
4. 自动跳转到Dashboard
5. 检查用户名是否正确显示

## 🔒 安全最佳实践

### 1. 环境变量安全

✅ **正确做法**：
- Client ID - 可以公开，写在前端代码
- Client Secret - 必须保密，只在 `.dev.vars` 和 Cloudflare secrets

❌ **错误做法**：
- 不要将 `.dev.vars` 提交到Git
- 不要在前端代码中暴露 Client Secret

### 2. 域名配置

在Google Cloud Console的 **Authorized JavaScript origins** 和 **Authorized redirect URIs** 中：

✅ **必须添加**：
- 所有实际使用的域名
- 包括 `http://localhost:3000`（开发）
- 包括 `https://your-project.pages.dev`（生产）
- 包括自定义域名（如有）

❌ **不要添加**：
- 通配符域名（不支持）
- HTTP生产域名（必须HTTPS）

### 3. OAuth同意屏幕

在应用未通过Google验证前：
- 只有添加的测试用户可以登录
- 会显示"未验证应用"警告
- 需要点击"继续"才能登录

**发布到生产环境**：
- 提交OAuth同意屏幕审核
- 通过后所有Google用户可登录
- 移除"未验证应用"警告

## 📊 用户数据处理

### 从Google获取的信息

```javascript
{
  "sub": "google-user-id-123456789",      // Google用户唯一ID
  "email": "user@gmail.com",              // 邮箱
  "email_verified": true,                 // 邮箱是否验证
  "name": "John Doe",                     // 全名
  "picture": "https://...",               // 头像URL
  "given_name": "John",                   // 名
  "family_name": "Doe",                   // 姓
  "locale": "en"                          // 语言
}
```

### 存储到数据库

```sql
-- 自动创建用户记录
INSERT INTO users (email, username, password_hash, role, language)
VALUES (
  'user@gmail.com',           -- 使用Google邮箱
  'John Doe',                 -- 使用Google名字
  'random-hash',              -- 随机密码哈希（用户不会用到）
  'user',                     -- 默认角色
  'zh'                        -- 默认语言
);
```

### 用户账号关联

- **首次登录**：自动创建新用户账号
- **后续登录**：通过邮箱匹配现有账号
- **账号合并**：如果邮箱已存在，直接登录该账号

## 🐛 常见问题

### 1. Google按钮不显示

**原因**：
- Client ID未配置或错误
- Google GSI脚本加载失败
- 浏览器阻止了第三方Cookie

**解决方法**：
```javascript
// 检查Console是否有错误
// 检查Client ID是否正确
// 检查网络是否正常
```

### 2. 登录后提示"Invalid token"

**原因**：
- Client ID不匹配
- Token已过期
- 网络请求失败

**解决方法**：
```bash
# 检查环境变量
cat .dev.vars

# 检查后端日志
pm2 logs review-system --nostream
```

### 3. "redirect_uri_mismatch" 错误

**原因**：当前访问的URL不在授权列表中

**解决方法**：
1. 记录完整的当前URL
2. 在Google Cloud Console添加到 **Authorized redirect URIs**
3. 等待几分钟使配置生效

### 4. "Access blocked: This app's request is invalid"

**原因**：OAuth同意屏幕配置不完整

**解决方法**：
1. 检查OAuth同意屏幕是否填写完整
2. 确认作用域（Scopes）已添加
3. 检查应用状态（Testing/Published）

## 📝 开发调试

### 启用详细日志

在 `public/static/app.js` 中：

```javascript
async function handleGoogleLogin(response) {
  console.log('Google credential:', response.credential);
  console.log('Decoded JWT:', parseJwt(response.credential));
  // ... rest of code
}

// JWT解码工具（仅调试用）
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}
```

### 测试流程

1. **前端测试**：
   ```bash
   # 打开浏览器Console
   # 点击Google登录按钮
   # 查看handleGoogleLogin是否被调用
   ```

2. **后端测试**：
   ```bash
   # 查看PM2日志
   pm2 logs review-system --nostream
   
   # 手动测试API
   curl -X POST http://localhost:3000/api/auth/google \
     -H "Content-Type: application/json" \
     -d '{"credential":"test-token"}'
   ```

## 🚀 部署检查清单

在部署到生产环境前，确认：

- [ ] Google Cloud项目已创建
- [ ] OAuth同意屏幕已配置
- [ ] OAuth 2.0客户端ID已创建
- [ ] 生产域名已添加到授权列表
- [ ] `.dev.vars` 文件包含正确的配置
- [ ] Cloudflare环境变量已设置
- [ ] `app.js` 中的 Client ID 已替换
- [ ] 本地测试通过
- [ ] 生产环境测试通过

## 📚 参考资料

- [Google Identity Services 文档](https://developers.google.com/identity/gsi/web/guides/overview)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sign-In JavaScript库](https://developers.google.com/identity/gsi/web/guides/client-library)

---

**配置完成后，用户可以通过Google账号一键登录系统，无需记住密码，大大提升用户体验！** 🎉
