# 密码重置邮件问题排查指南

## 问题描述
用户点击"发送重置链接"后，系统显示"已经发出邮件"，但实际未收到邮件。

## 已实施的修复

### 1. 修改发件地址（2025-10-15）
**修改内容：**
- 原地址：`noreply@resend.dev` （无效）
- 新地址：`onboarding@resend.dev` （Resend 官方测试域名）

**位置：** `src/utils/email.ts` 第22行

### 2. 增强错误日志
添加了详细的日志输出：
- 发送失败时记录 HTTP 状态码和错误信息
- 发送成功时记录邮件 ID

## 如何验证邮件发送

### 方法1：查看 Cloudflare Pages 日志
1. 访问 Cloudflare Dashboard：https://dash.cloudflare.com/
2. 进入 Pages 项目：review-system
3. 点击"View logs"或"Functions"选项卡
4. 查看实时日志输出

### 方法2：检查 Resend Dashboard
1. 登录 Resend：https://resend.com/
2. 进入"Emails"页面
3. 查看最近发送的邮件记录
4. 检查邮件状态：delivered / bounced / failed

### 方法3：使用 API 测试
```bash
# 测试密码重置请求
curl -X POST https://review-system.pages.dev/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# 应该返回：
# {"message":"If your email is registered, you will receive a password reset link shortly."}
```

## 常见问题和解决方案

### 问题1：邮件未送达
**可能原因：**
1. RESEND_API_KEY 未配置或无效
2. 收件箱将邮件标记为垃圾邮件
3. 邮箱地址不存在于数据库中

**解决方案：**
1. 验证 API Key：
   ```bash
   npx wrangler pages secret list --project-name review-system
   ```
2. 检查垃圾邮件文件夹
3. 确认邮箱已注册：
   ```bash
   # 使用测试账号
   admin@review.com
   premium@review.com  
   user@review.com
   ```

### 问题2：使用自定义域名
如果您想使用自己的域名发送邮件（如 `noreply@yourdomain.com`）：

1. **在 Resend 中添加域名：**
   - 登录 Resend Dashboard
   - 进入"Domains"页面
   - 点击"Add Domain"
   - 按照指引添加 DNS 记录

2. **修改代码中的发件地址：**
   ```typescript
   // src/utils/email.ts 第22行
   from: 'Review System <noreply@yourdomain.com>',
   ```

3. **重新构建和部署：**
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name review-system
   ```

### 问题3：邮件发送速率限制
Resend 免费计划限制：
- 每天最多 100 封邮件
- 每月最多 3,000 封邮件

如需更多配额，需要升级到付费计划。

## 测试账号信息

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@review.com | admin123 |
| 高级用户 | premium@review.com | premium123 |
| 普通用户 | user@review.com | user123 |

## 当前配置状态

### 环境变量（生产环境）
- ✅ RESEND_API_KEY: 已配置
- ✅ GOOGLE_CLIENT_ID: 已配置
- ✅ GOOGLE_CLIENT_SECRET: 已配置
- ✅ GOOGLE_API_KEY: 已配置

### 邮件模板
- 主题：Password Reset Request - Review System
- 发件人：Review System <onboarding@resend.dev>
- 链接有效期：1小时
- 模板语言：英文（HTML + 纯文本）

## 下一步建议

1. **立即测试：** 使用测试账号 `admin@review.com` 请求密码重置
2. **检查邮箱：** 查看收件箱和垃圾邮件文件夹
3. **查看日志：** 在 Cloudflare Dashboard 中查看实时日志
4. **验证 Resend：** 在 Resend Dashboard 中确认邮件发送状态

## 需要帮助？

如果问题仍未解决，请提供以下信息：
1. 使用的邮箱地址
2. Cloudflare Pages 的错误日志
3. Resend Dashboard 中的邮件状态
4. 是否检查了垃圾邮件文件夹

---

**最后更新：** 2025-10-15  
**部署版本：** V4.2.5  
**生产环境：** https://72e56111.review-system.pages.dev
