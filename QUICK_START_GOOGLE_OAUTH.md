# Google OAuth 快速配置指南

如果你想启用Google账号登录功能，按照以下步骤快速配置：

## ⚡ 5分钟快速配置

### 步骤 1: 获取Google Client ID

1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 导航到：**APIs & Services** > **Credentials**
4. 点击 **Create Credentials** > **OAuth client ID**
5. 选择 **Web application**
6. 添加授权来源：
   ```
   http://localhost:3000
   ```
7. 点击 **Create** 并复制 **Client ID**

### 步骤 2: 配置本地环境

创建 `.dev.vars` 文件：
```bash
cd /home/user/webapp
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 文件，填入你的Client ID：
```bash
GOOGLE_CLIENT_ID=你的Client-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=你的Client-Secret
```

### 步骤 3: 更新前端代码

在 `public/static/app.js` 中搜索 `YOUR_GOOGLE_CLIENT_ID` 并替换为实际的Client ID：

**方法1：使用sed命令**
```bash
cd /home/user/webapp
sed -i 's/YOUR_GOOGLE_CLIENT_ID/你的实际Client-ID/g' public/static/app.js
```

**方法2：手动编辑**
找到两处：
- 登录页面（约680行）
- 注册页面（约735行）

将 `data-client_id="YOUR_GOOGLE_CLIENT_ID"` 改为：
```javascript
data-client_id="你的实际Client-ID.apps.googleusercontent.com"
```

### 步骤 4: 重启服务

```bash
cd /home/user/webapp
npm run build
fuser -k 3000/tcp 2>/dev/null || true
pm2 start ecosystem.config.cjs
```

### 步骤 5: 测试

访问 http://localhost:3000
- 点击"登录"或"注册"
- 应该能看到蓝色的 **Continue with Google** 按钮
- 点击按钮，选择Google账号登录

## ✅ 验证成功

如果配置成功，你会看到：
- ✅ Google登录按钮显示正常（带Google图标）
- ✅ 点击按钮后弹出Google账号选择窗口
- ✅ 选择账号后自动登录到Dashboard
- ✅ 用户名正确显示在导航栏

## ❌ 如果不配置

如果不配置Google OAuth：
- Google按钮会显示，但点击会失败
- 不影响传统邮箱密码登录功能
- 建议隐藏或移除Google按钮（见下方）

### 临时禁用Google登录按钮

在 `public/static/app.js` 中注释掉Google按钮部分：
```javascript
// 在登录页面（约680行）和注册页面（约735行）
// 将以下代码注释掉：
/*
<div class="mb-6">
  <div id="g_id_onload" ...></div>
  <div class="g_id_signin" ...></div>
</div>
<div class="relative mb-6">...</div>  // OR分隔线
*/
```

## 📚 完整文档

详细配置说明请参考：`GOOGLE_OAUTH_SETUP.md`

## 🆘 遇到问题？

常见问题：
1. **按钮不显示** - 检查Client ID是否正确
2. **点击后报错** - 检查域名是否在授权列表
3. **登录失败** - 检查后端日志：`pm2 logs review-system`

---

**配置完成后即可享受Google一键登录！** 🚀
