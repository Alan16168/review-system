# Resend API Key 更新指南

## 问题诊断

根据 Resend Dashboard 日志分析：
- ✅ **5天前**：邮件发送成功（状态 200）
- ❌ **最近**：连续4次请求失败（状态 403 Forbidden）

**403 错误原因：**
1. API Key 权限不足
2. API Key 已过期或被撤销
3. 使用了错误的 API Key
4. API Key 没有"Sending access"权限

---

## 解决方案：更新 API Key

### 步骤1：在 Resend 中创建新的 API Key

1. **访问 Resend Dashboard**：
   - 网址：https://resend.com/api-keys
   - 登录您的账号（dengalan@gmail.com）

2. **创建新的 API Key**：
   - 点击 **"+ Create API key"** 按钮
   - **名称**：`review-system-production`
   - **权限**：选择 **"Full access"** 或 **"Sending access"**
     - ✅ **Full access**（推荐）：完全访问权限
     - ✅ **Sending access**：仅发送邮件权限
   - 点击 **"Create"** 按钮

3. **复制 API Key**：
   - ⚠️ **重要**：API Key 只显示一次，请立即复制
   - 格式：`re_xxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 将其保存到安全的地方

4. **（可选）删除旧的 API Key**：
   - 如果旧的 Key 不再使用，可以删除 `ireviewsystem` Key

---

### 步骤2：更新 Cloudflare Pages 环境变量

#### 方法 A：使用 wrangler CLI（推荐）

```bash
# 在项目目录下执行
cd /home/user/webapp

# 更新 RESEND_API_KEY 密钥
npx wrangler pages secret put RESEND_API_KEY --project-name review-system

# 提示 "Enter a secret value:" 时，粘贴从 Resend 复制的完整 API Key
# 格式：re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 看到 "✨ Success! Uploaded secret RESEND_API_KEY" 表示成功
```

#### 方法 B：通过 Cloudflare Dashboard（备选）

1. **访问 Cloudflare Dashboard**：
   - 网址：https://dash.cloudflare.com/
   - 登录您的账号

2. **进入 Pages 项目**：
   - 点击左侧菜单 **"Workers & Pages"**
   - 找到并点击 **"review-system"** 项目

3. **更新环境变量**：
   - 点击 **"Settings"** 标签
   - 找到 **"Environment variables"** 部分
   - 在生产环境（Production）中找到 **RESEND_API_KEY**
   - 点击右侧的 **"Edit"** 按钮
   - 在 **"Value"** 字段中粘贴新的 API Key
   - 点击 **"Save"** 按钮

4. **重新部署**（必需）：
   - 环境变量更改后需要重新部署才能生效
   - 在 "Deployments" 标签中点击最新部署旁的 **"..."** 菜单
   - 选择 **"Retry deployment"** 或 **"Redeploy"**

---

### 步骤3：验证配置

更新完成后，验证 API Key 是否配置成功：

```bash
# 列出所有密钥（不显示值）
npx wrangler pages secret list --project-name review-system

# 应该看到：
# - RESEND_API_KEY: Value Encrypted ✓
```

---

### 步骤4：测试邮件发送

#### 测试方法1：通过网页界面

1. 访问：https://review-system.pages.dev
2. 点击"忘记密码"
3. 输入邮箱：`dengalan@gmail.com`（您的真实邮箱）
4. 点击"发送重置链接"
5. 检查邮箱（包括垃圾邮件文件夹）

#### 测试方法2：使用 API

```bash
curl -X POST https://review-system.pages.dev/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"dengalan@gmail.com"}'
```

#### 测试方法3：查看 Resend Dashboard

1. 访问：https://resend.com/emails
2. 查看"Emails"列表
3. 最新的邮件状态应该是：
   - ✅ **Delivered**（成功送达）
   - 而不是 ❌ **Failed**（失败）

#### 测试方法4：查看 Cloudflare Logs

1. 访问 Resend Logs：https://resend.com/logs
2. 查看最新的 `/emails` 请求
3. 状态应该是：
   - ✅ **200**（成功）
   - 而不是 ❌ **403**（权限错误）

---

## 常见问题

### Q1: 更新 API Key 后仍然收到 403 错误？

**解决方案：**
1. 确认新的 API Key 权限设置为"Full access"或"Sending access"
2. 确认已重新部署 Cloudflare Pages（环境变量更改需要重新部署）
3. 清除浏览器缓存并重试

### Q2: API Key 格式是什么？

**正确格式：**
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

- 以 `re_` 开头
- 后面跟随随机字符串
- 总长度约 30-40 字符

### Q3: 如何确认 API Key 有效？

**使用 curl 测试：**
```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "dengalan@gmail.com",
    "subject": "Test Email",
    "text": "This is a test email"
  }'
```

如果返回邮件ID，说明 API Key 有效。

### Q4: 为什么5天前可以发送，现在不行？

**可能原因：**
1. API Key 被意外删除或重新生成
2. API Key 权限被修改
3. Resend 账号状态变化（如免费配额用完）
4. Resend 服务更新导致旧 Key 失效

---

## 检查清单

更新前请确认：
- [ ] 已登录 Resend Dashboard（https://resend.com/）
- [ ] 已创建新的 API Key 并复制完整值
- [ ] API Key 权限设置为"Full access"或"Sending access"
- [ ] 已复制完整的 API Key（以 `re_` 开头）

更新后请确认：
- [ ] 已通过 wrangler 或 Dashboard 更新 RESEND_API_KEY
- [ ] 已重新部署 Cloudflare Pages（如果通过 Dashboard 更新）
- [ ] 已测试密码重置功能
- [ ] 在 Resend Dashboard 中看到新的邮件发送记录
- [ ] Resend Logs 显示状态 200（而不是 403）

---

## 需要帮助？

如果按照以上步骤操作后仍有问题，请提供：
1. Resend Logs 中最新的请求状态码
2. Cloudflare Pages 部署日志（如有错误）
3. 使用的邮箱地址
4. 是否检查了垃圾邮件文件夹

---

**最后更新：** 2025-10-15  
**相关文档：** PASSWORD_RESET_TROUBLESHOOTING.md
