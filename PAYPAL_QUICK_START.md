# PayPal 快速配置指南

这是一个简化的 PayPal 配置指南，帮助您快速开始使用 PayPal 支付功能。

## 🚀 5 分钟快速开始

### 步骤 1: 注册 PayPal 开发者账号 (2分钟)

1. 访问：https://developer.paypal.com/
2. 点击右上角 **"Log in"** 或 **"Sign Up"**
3. 使用您的 PayPal 账号登录（或创建新账号）

### 步骤 2: 创建沙盒应用 (2分钟)

1. 登录后，进入 **Dashboard**
2. 点击左侧菜单 **"My Apps & Credentials"**
3. 确保在 **"Sandbox"** 标签页（默认）
4. 点击 **"Create App"** 按钮
5. 填写：
   - **App Name**: `Review System`
   - **App Type**: `Merchant`
6. 点击 **"Create App"**

### 步骤 3: 获取 API 凭证 (30秒)

在应用详情页面，您会看到：

```
Client ID: AXXXXXXXXxxxxx...
Secret: EXXXXXXXXxxxxx...
```

**复制这两个值！**

### 步骤 4: 配置本地环境 (30秒)

编辑 `.dev.vars` 文件，替换以下内容：

```bash
# PayPal 配置
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=粘贴您复制的Client_ID
PAYPAL_CLIENT_SECRET=粘贴您复制的Secret
```

保存文件。

### 步骤 5: 重启应用 (30秒)

```bash
# 重新构建
npm run build

# 重启服务
pm2 restart review-system

# 测试访问
curl http://localhost:3000
```

## ✅ 验证配置

打开浏览器访问：http://localhost:3000

1. 登录系统（使用测试账号：`user@review.com` / `user123`）
2. 进入用户设置页面
3. 点击"升级"按钮
4. 查看购物车
5. 点击"结算"按钮

如果 PayPal 按钮出现，说明配置成功！

## 🧪 测试支付

### 获取测试账号

1. 回到 PayPal 开发者控制台
2. 点击左侧 **"Sandbox"** → **"Accounts"**
3. 找到 **Personal** 类型的测试账号（买家账号）
4. 点击右侧的 **"..."** → **"View/Edit account"**
5. 查看或重置密码

### 测试购买流程

1. 在系统中点击"结算"，PayPal 窗口弹出
2. 使用测试买家账号登录
3. 确认支付（测试环境不会真实扣款）
4. 支付成功后，您的账号应该升级为高级用户

## 🌐 部署到生产环境

### 配置 Cloudflare Pages 环境变量

1. 登录 Cloudflare: https://dash.cloudflare.com/
2. 进入 **Pages** → `review-system`
3. 点击 **Settings** → **Environment variables**
4. 添加以下变量（Production 环境）：

```
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=<您的Client_ID>
PAYPAL_CLIENT_SECRET=<您的Secret>
```

5. 点击 **Save**
6. 重新部署：

```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
```

## ⚠️ 重要提示

### 沙盒模式 vs 生产模式

- **沙盒模式** (`sandbox`): 用于测试，不会真实扣款
- **生产模式** (`live`): 用于正式环境，会真实扣款

**建议**：先在沙盒模式测试所有功能，确认无误后再切换到生产模式。

### 切换到生产模式

当您准备好接收真实付款时：

1. 在 PayPal 开发者控制台，切换到 **"Live"** 标签页
2. 创建新应用，获取生产环境的 Client ID 和 Secret
3. 更新 `.dev.vars` 和 Cloudflare Pages 环境变量：

```bash
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=<生产Client_ID>
PAYPAL_CLIENT_SECRET=<生产Secret>
```

4. 重新部署应用

## 📚 更多信息

- 完整配置指南：[PAYPAL_SETUP_GUIDE.md](./PAYPAL_SETUP_GUIDE.md)
- PayPal 官方文档：https://developer.paypal.com/docs/
- PayPal 沙盒测试：https://developer.paypal.com/tools/sandbox/

## 🆘 遇到问题？

### PayPal 按钮不显示

**检查步骤**：
```bash
# 1. 确认环境变量已设置
cat .dev.vars | grep PAYPAL

# 2. 确认服务已重启
pm2 list

# 3. 查看浏览器控制台
# 打开开发者工具 (F12)，查看 Console 中是否有错误
```

### 支付后未升级用户

**检查步骤**：
```bash
# 1. 查看服务日志
pm2 logs review-system --nostream

# 2. 检查数据库
npx wrangler d1 execute review-system-production --local \
  --command="SELECT id, email, role, subscription_expires_at FROM users WHERE email='user@review.com'"
```

### 更多帮助

如果遇到其他问题，请：
1. 查看完整配置指南：[PAYPAL_SETUP_GUIDE.md](./PAYPAL_SETUP_GUIDE.md)
2. 在 GitHub 提交 Issue：https://github.com/Alan16168/review-system/issues
3. 查看 PayPal 官方文档：https://developer.paypal.com/docs/

---

**祝您配置顺利！🎉**
