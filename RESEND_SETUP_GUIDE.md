# 📧 Resend 邮件服务配置指南

本指南帮助您配置 Resend 邮件服务，用于发送密码重置邮件。

## 🎯 为什么需要 Resend？

V3.8 版本实现了安全的密码重置功能，需要通过邮件发送重置链接。Resend 是一个专为开发者设计的现代化邮件发送服务。

### 优势
- ✅ **免费额度**: 3,000 封邮件/月（对于大多数应用足够）
- ✅ **简单易用**: API 简洁，几分钟即可配置完成
- ✅ **高送达率**: 业界领先的邮件送达率
- ✅ **无需信用卡**: 免费计划无需绑定信用卡

---

## 📋 第一步：注册 Resend 账号

1. 访问 [Resend 官网](https://resend.com)
2. 点击 **"Sign Up"** 或 **"Start Building"**
3. 使用您的邮箱注册账号
4. 验证您的邮箱地址

---

## 🔑 第二步：获取 API Key

### 1. 登录 Resend Dashboard
访问: https://resend.com/api-keys

### 2. 创建新的 API Key
- 点击 **"Create API Key"** 按钮
- 给 API Key 起个名字（如: `review-system-production`）
- 选择权限: **"Sending access"** (默认即可)
- 点击 **"Add"** 创建

### 3. 复制 API Key
⚠️ **重要**: API Key 只会显示一次，请立即复制保存！

格式类似: `re_123456789abcdefghijklmnopqrstuvwxyz`

---

## 🌐 第三步：验证发件人域名（可选但推荐）

### 为什么要验证域名？
- 免费计划可以使用 `onboarding@resend.dev` 作为发件人
- 验证自己的域名后，邮件会显示您的品牌名称
- 提高邮件送达率和信誉度

### 如何验证域名

1. **进入 Domains 页面**
   访问: https://resend.com/domains

2. **添加您的域名**
   - 点击 **"Add Domain"**
   - 输入您的域名（如: `example.com`）
   - 点击 **"Add"**

3. **配置 DNS 记录**
   Resend 会提供需要添加的 DNS 记录，包括:
   - **SPF 记录**: 防止邮件被标记为垃圾邮件
   - **DKIM 记录**: 邮件签名验证
   - **Return-Path**: 退信地址

4. **在您的域名服务商添加这些记录**
   - 登录您的域名管理面板（如 Cloudflare, GoDaddy, Namecheap 等）
   - 添加 Resend 提供的 TXT 和 CNAME 记录
   - 等待 DNS 传播（通常 5-30 分钟）

5. **验证状态**
   - 返回 Resend Dashboard
   - 点击 **"Verify"** 按钮
   - 看到绿色 ✅ 表示验证成功

### 如果没有自己的域名？

没关系！您可以继续使用 Resend 提供的默认域名 `resend.dev`，这不会影响功能，只是发件人会显示为:
```
noreply@resend.dev
```

---

## ⚙️ 第四步：配置 Cloudflare Pages 环境变量

### 1. 进入 Cloudflare Pages Dashboard

访问: https://dash.cloudflare.com/pages/view/review-system

### 2. 添加环境变量

1. 点击 **"Settings"** 标签页
2. 滚动到 **"Environment variables"** 部分
3. 点击 **"Add variable"**

### 3. 添加 RESEND_API_KEY

| 字段 | 值 |
|------|---|
| **Variable name** | `RESEND_API_KEY` |
| **Value** | `re_your_api_key_here` (粘贴您的 API Key) |
| **Environment** | ✅ Production ✅ Preview |

点击 **"Save"**

### 4. 添加 APP_URL（可选）

| 字段 | 值 |
|------|---|
| **Variable name** | `APP_URL` |
| **Value** | `https://review-system.pages.dev` |
| **Environment** | ✅ Production ✅ Preview |

点击 **"Save"**

### 5. 重新部署

添加环境变量后，需要重新部署才能生效：
- 点击 **"Deployments"** 标签页
- 找到最新的部署
- 点击 **"Retry deployment"** 或推送新代码触发部署

---

## 🧪 第五步：测试邮件发送

### 本地测试（开发环境）

1. **创建 `.dev.vars` 文件**（如果还没有）:
   ```bash
   cd /home/user/webapp
   cat > .dev.vars << 'EOF'
   RESEND_API_KEY=re_your_api_key_here
   APP_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_API_KEY=your_google_api_key
   EOF
   ```

2. **重启开发服务器**:
   ```bash
   npm run build
   pm2 restart review-system
   ```

3. **测试忘记密码功能**:
   - 访问 http://localhost:3000
   - 点击登录
   - 点击 "忘记密码？"
   - 输入注册的邮箱地址
   - 点击 "发送重置链接"
   - 检查您的邮箱（包括垃圾邮件文件夹）

### 生产环境测试

部署到 Cloudflare Pages 后：

1. 访问 https://review-system.pages.dev
2. 点击登录页面的 "忘记密码？"
3. 输入您的注册邮箱
4. 点击 "发送重置链接"
5. 检查邮箱并点击重置链接
6. 设置新密码并登录

---

## 📊 第六步：监控邮件发送（可选）

### Resend Dashboard

访问: https://resend.com/emails

您可以看到:
- ✅ 已发送的邮件列表
- ✉️ 邮件状态（已送达/退信/打开）
- 📈 发送统计数据
- 🔍 详细的发送日志

### Cloudflare Pages 日志

如果邮件发送失败，您可以在 Cloudflare Pages 日志中查看错误信息：

1. 进入: https://dash.cloudflare.com/pages/view/review-system
2. 点击 **"Logs"** 标签页（如果有的话）
3. 或者检查 **"Real-time logs"**

---

## 🛡️ 安全最佳实践

### 1. 保护您的 API Key
- ❌ 不要在代码中硬编码 API Key
- ❌ 不要提交 `.dev.vars` 到 Git
- ✅ 使用环境变量存储
- ✅ 定期轮换 API Key

### 2. 验证域名
- 完成域名验证可以提高邮件送达率
- 防止邮件被标记为垃圾邮件

### 3. 监控使用量
- 定期检查 Resend Dashboard
- 关注邮件发送量，避免超出免费额度
- 设置使用量告警（在 Resend 设置中）

---

## 🐛 常见问题排查

### 问题 1: 没有收到邮件

**可能原因**:
1. 邮件在垃圾邮件文件夹
2. RESEND_API_KEY 未配置或配置错误
3. 邮箱地址输入错误
4. Resend 账号未验证

**解决方案**:
```bash
# 1. 检查环境变量
cd /home/user/webapp
cat .dev.vars  # 本地开发

# 2. 检查 Cloudflare Pages 环境变量
# 访问: https://dash.cloudflare.com/pages/view/review-system/settings

# 3. 检查 PM2 日志
pm2 logs review-system --nostream

# 4. 检查 Resend Dashboard
# 访问: https://resend.com/emails
```

### 问题 2: API Key 无效

**错误信息**: `Failed to send email: 401 Unauthorized`

**解决方案**:
1. 确认 API Key 正确复制（没有多余空格）
2. 在 Resend Dashboard 重新创建 API Key
3. 更新 Cloudflare Pages 环境变量
4. 重新部署应用

### 问题 3: 邮件发送但未送达

**可能原因**:
- 接收邮箱服务商拦截
- SPF/DKIM 未配置

**解决方案**:
1. 验证您的域名（添加 SPF 和 DKIM 记录）
2. 检查 Resend Dashboard 中的邮件状态
3. 联系 Resend 支持团队

---

## 📞 获取帮助

### Resend 官方资源
- **文档**: https://resend.com/docs
- **API 参考**: https://resend.com/docs/api-reference
- **支持**: https://resend.com/support
- **状态页**: https://status.resend.com

### 项目支持
如果您在配置过程中遇到问题，可以：
1. 查看项目 README.md
2. 检查 Cloudflare Pages 部署日志
3. 查看 PM2 服务日志

---

## 📝 配置清单

完成配置后，请确认以下步骤：

- [ ] 注册 Resend 账号
- [ ] 创建并保存 API Key
- [ ] （可选）验证自己的域名
- [ ] 在 Cloudflare Pages 添加 `RESEND_API_KEY` 环境变量
- [ ] （可选）添加 `APP_URL` 环境变量
- [ ] 重新部署应用
- [ ] 测试忘记密码功能
- [ ] 确认能收到邮件
- [ ] 检查邮件内容和链接正常工作

---

## 🎉 完成！

配置完成后，您的用户就可以安全地重置密码了！

**密码重置流程**:
1. 用户点击"忘记密码？"
2. 输入注册邮箱
3. 收到包含重置链接的邮件
4. 点击链接访问重置页面
5. 设置新密码
6. 使用新密码登录

**安全特性**:
- ✅ 令牌1小时后自动过期
- ✅ 令牌只能使用一次
- ✅ 防止邮箱枚举攻击
- ✅ 所有密码使用 bcrypt 加密
- ✅ 完整的安全验证流程

---

**更新日期**: 2025-10-10  
**版本**: V3.8  
**作者**: Claude AI Assistant
