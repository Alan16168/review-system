# Resend 域名验证指南

## 🚨 当前问题

**错误代码**：
- `403 Forbidden` - `onboarding@resend.dev` 只能发送到已验证的邮箱
- `429 Too Many Requests` - 超出速率限制

**根本原因**：
使用 Resend 测试域名 `onboarding@resend.dev` 有严格限制：
- ❌ 只能发送到您在 Resend 控制台中验证过的邮箱地址
- ❌ 不能发送到系统中任意用户的邮箱
- ❌ 有严格的速率限制（免费套餐：100封/天）

## ✅ 完整解决方案：验证自定义域名

### 第一步：登录 Resend 控制台

1. 访问：https://resend.com/login
2. 使用您的账号登录

### 第二步：添加域名

1. 进入 **Domains** 页面
2. 点击 **Add Domain** 按钮
3. 输入域名：`ireviewsystem.com`
4. 点击 **Add**

### 第三步：配置 DNS 记录

Resend 会提供 3 条 DNS 记录需要添加到您的域名服务商：

#### 1. SPF 记录（TXT）
```
类型：TXT
主机名：@
值：v=spf1 include:_spf.resend.com ~all
TTL：3600
```

#### 2. DKIM 记录（TXT）
```
类型：TXT
主机名：resend._domainkey
值：[Resend 提供的长字符串]
TTL：3600
```

#### 3. DMARC 记录（TXT）
```
类型：TXT
主机名：_dmarc
值：v=DMARC1; p=none; rua=mailto:admin@ireviewsystem.com
TTL：3600
```

### 第四步：等待 DNS 传播

- DNS 记录传播需要 **5分钟到48小时**
- 通常在 **15-30分钟内**完成
- Resend 会自动检测并验证

### 第五步：验证状态

1. 在 Resend 控制台的 Domains 页面
2. 等待域名状态变为 **Verified** ✅
3. 看到绿色勾号即表示成功

---

## 🔧 临时解决方案（验证期间）

在域名验证期间，有两个临时方案：

### **方案 A：添加测试邮箱到 Resend**

1. 进入 Resend 控制台
2. 找到 **Email Addresses** 或 **Verified Emails** 页面
3. 添加所有 6 个用户的邮箱地址进行验证
4. 用户需要点击验证邮件中的链接
5. 验证后就可以使用 `onboarding@resend.dev` 发送

**优点**：快速临时解决
**缺点**：每次新用户都需要验证，不适合生产环境

### **方案 B：使用第三方邮件服务（推荐等域名验证完成）**

暂时使用其他邮件服务如 SendGrid、Mailgun 等。

---

## 📝 验证完成后的配置

### 1. 更新代码中的发件人地址

```typescript
// src/utils/email.ts
from: 'Review System <noreply@ireviewsystem.com>',  // ✅ 使用自定义域名
```

### 2. 重新部署

```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
```

---

## 🎯 验证后的好处

- ✅ 可以发送到任意邮箱地址
- ✅ 更高的发送配额
- ✅ 更好的邮件送达率
- ✅ 专业的发件人地址
- ✅ 减少被标记为垃圾邮件的风险
- ✅ 完整的 DKIM/SPF/DMARC 认证

---

## 📊 Resend 免费套餐限制

- **发送配额**：100 封/天，3000 封/月
- **速率限制**：10 封/秒
- **域名数量**：1 个域名
- **API 调用**：无限制

如需更高配额，可升级到付费套餐：
- **Pro Plan**: $20/月 - 50,000 封/月
- **Business Plan**: $80/月 - 500,000 封/月

---

## ❓ 常见问题

### Q1: DNS 记录添加到哪里？
**A**: 添加到您购买域名的服务商（如 Cloudflare、GoDaddy、Namecheap 等）的 DNS 管理页面。

### Q2: 为什么验证需要这么久？
**A**: DNS 记录需要在全球范围内传播，通常 15-30 分钟，最长 48 小时。

### Q3: 验证失败怎么办？
**A**: 
1. 检查 DNS 记录是否正确配置
2. 等待更长时间让 DNS 传播
3. 使用 DNS 检查工具验证：https://mxtoolbox.com/
4. 联系 Resend 支持

### Q4: 可以用子域名吗？
**A**: 可以，如 `mail.ireviewsystem.com`，但建议使用主域名以获得更好的信誉度。

---

## 🔗 有用链接

- Resend 控制台：https://resend.com/domains
- Resend 文档：https://resend.com/docs/dashboard/domains/introduction
- DNS 检查工具：https://mxtoolbox.com/SuperTool.aspx
- SPF 记录检查：https://www.kitterman.com/spf/validate.html

---

## 📞 需要帮助？

如果在验证过程中遇到问题，请提供：
1. DNS 记录配置截图
2. Resend 控制台中的验证状态
3. 任何错误提示信息

我会立即帮您排查！
