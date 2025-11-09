# PayPal 集成配置指南

本指南详细说明如何配置 PayPal 与 Review System 的集成，包括沙盒测试和生产环境的完整设置流程。

## 📋 目录

1. [PayPal 开发者账号注册](#1-paypal-开发者账号注册)
2. [创建 PayPal 应用](#2-创建-paypal-应用)
3. [获取 API 凭证](#3-获取-api-凭证)
4. [配置本地开发环境](#4-配置本地开发环境)
5. [配置 Cloudflare Pages 生产环境](#5-配置-cloudflare-pages-生产环境)
6. [测试 PayPal 集成](#6-测试-paypal-集成)
7. [切换到生产模式](#7-切换到生产模式)
8. [常见问题排查](#8-常见问题排查)

---

## 1. PayPal 开发者账号注册

### 步骤 1.1: 访问 PayPal 开发者网站

访问：https://developer.paypal.com/

### 步骤 1.2: 登录或注册

- 如果已有 PayPal 个人账号，可以直接登录
- 如果没有账号，点击 "Sign Up" 创建开发者账号

### 步骤 1.3: 进入开发者控制台

登录后，点击右上角的 "Dashboard" 进入开发者控制台

---

## 2. 创建 PayPal 应用

### 步骤 2.1: 创建新应用

1. 在 Dashboard 中，点击左侧菜单的 **"My Apps & Credentials"**
2. 默认进入 **Sandbox** 标签页（用于测试）
3. 点击 **"Create App"** 按钮

### 步骤 2.2: 填写应用信息

- **App Name**: `Review System` （或您喜欢的名称）
- **App Type**: 选择 `Merchant`
- **Sandbox Business Account**: 选择默认的测试商家账号
- 点击 **"Create App"**

### 步骤 2.3: 配置应用权限

应用创建后，确保以下权限已启用：
- ✅ **Accept payments** (必需)
- ✅ **Refund payments** (建议)
- ✅ **Access your transaction history** (建议)

---

## 3. 获取 API 凭证

### 沙盒环境凭证（Sandbox - 用于测试）

在 "Sandbox" 标签页中：

1. 找到您刚创建的应用
2. 点击应用名称进入详情页
3. 复制以下信息：
   - **Client ID**: `AXXXXXXXXxxxxx...`（用于前端 PayPal SDK）
   - **Secret**: `EXXXXXXXXxxxxx...`（用于后端 API 调用）

**重要提示**: Secret 密钥非常敏感，请妥善保管，不要提交到 Git 仓库！

### 生产环境凭证（Live - 用于正式上线）

1. 切换到 **"Live"** 标签页
2. 重复上述创建应用的步骤
3. 获取生产环境的 Client ID 和 Secret

---

## 4. 配置本地开发环境

### 步骤 4.1: 创建 `.dev.vars` 文件

在项目根目录创建 `.dev.vars` 文件（该文件已在 .gitignore 中，不会被提交到 Git）：

```bash
# PayPal 配置
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=你的沙盒Client_ID
PAYPAL_CLIENT_SECRET=你的沙盒Secret密钥

# 其他环境变量（如果需要）
GOOGLE_CLIENT_ID=你的Google_Client_ID
GOOGLE_CLIENT_SECRET=你的Google_Client_Secret
RESEND_API_KEY=你的Resend_API_Key
```

### 步骤 4.2: 更新前端 PayPal SDK

编辑 `src/index.tsx`，找到 PayPal SDK 的引用：

```typescript
<!-- PayPal SDK -->
<script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD"></script>
```

确保使用环境变量：

```typescript
// 在 src/index.tsx 中
app.get('/', (c) => {
  const { PAYPAL_CLIENT_ID } = c.env;
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <!-- ... -->
        <script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD"></script>
    </head>
    <!-- ... -->
  `);
});
```

### 步骤 4.3: 验证配置

```bash
# 重新构建项目
npm run build

# 重启开发服务器
pm2 restart review-system

# 测试访问
curl http://localhost:3000
```

查看页面源代码，确认 PayPal SDK 的 client-id 参数已正确填充。

---

## 5. 配置 Cloudflare Pages 生产环境

### 步骤 5.1: 访问 Cloudflare Pages 控制台

1. 登录 Cloudflare: https://dash.cloudflare.com/
2. 进入 **Pages** 项目
3. 选择您的项目 `review-system`
4. 点击 **Settings** 标签页

### 步骤 5.2: 添加环境变量

1. 找到 **Environment variables** 部分
2. 点击 **Add variable** 添加以下变量：

**对于 Production 环境：**

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `PAYPAL_MODE` | `live` | Production |
| `PAYPAL_CLIENT_ID` | 您的生产环境 Client ID | Production |
| `PAYPAL_CLIENT_SECRET` | 您的生产环境 Secret | Production |

**对于 Preview 环境（可选）：**

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `PAYPAL_MODE` | `sandbox` | Preview |
| `PAYPAL_CLIENT_ID` | 您的沙盒 Client ID | Preview |
| `PAYPAL_CLIENT_SECRET` | 您的沙盒 Secret | Preview |

### 步骤 5.3: 保存并重新部署

1. 点击 **Save** 保存环境变量
2. 重新部署应用：

```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
```

或者在 Cloudflare Pages 控制台中，进入 **Deployments** 标签，点击 **Retry deployment** 重新部署最新版本。

---

## 6. 测试 PayPal 集成

### 沙盒测试账号

PayPal 自动为您创建了测试账号，可以在 Dashboard 的 **Sandbox** → **Accounts** 中查看：

1. **测试商家账号** (Business): 用于接收付款
2. **测试买家账号** (Personal): 用于测试购买

**测试买家账号登录信息：**
- 邮箱：在 Sandbox Accounts 页面查看（通常是 `sb-xxxxx@personal.example.com`）
- 密码：点击账号旁边的 `...` → `View/Edit account` 查看或重置密码

### 测试流程

1. **本地测试**：
   ```bash
   # 确保使用沙盒模式
   # .dev.vars 中设置 PAYPAL_MODE=sandbox
   
   # 启动开发服务器
   pm2 restart review-system
   
   # 访问
   http://localhost:3000
   ```

2. **测试购买流程**：
   - 登录系统（使用普通用户账号）
   - 进入用户设置页面
   - 点击 "升级" 按钮，商品添加到购物车
   - 点击购物车图标，查看购物车
   - 点击 "结算" 按钮
   - PayPal 窗口弹出
   - 使用测试买家账号登录 PayPal
   - 完成支付
   - 系统自动升级用户为高级用户

3. **验证结果**：
   - 用户角色应该变为 `premium`
   - 显示订阅到期日期（365天后）
   - 购物车应该被清空
   - 可以在管理后台查看用户信息

---

## 7. 切换到生产模式

### 何时切换到生产模式？

✅ 完成所有功能测试
✅ 确认支付流程正常
✅ 准备好接收真实付款
✅ 已申请并激活 PayPal 商家账号

### 切换步骤

#### 7.1: 激活 PayPal 商家账号

1. 登录 PayPal 主站：https://www.paypal.com/
2. 完成商家账号验证（可能需要提供营业执照等信息）
3. 确认账号状态为 "Active"

#### 7.2: 创建生产环境应用

1. 回到 PayPal 开发者控制台
2. 切换到 **"Live"** 标签页
3. 创建新应用（参考步骤 2）
4. 获取生产环境的 Client ID 和 Secret

#### 7.3: 更新 Cloudflare Pages 环境变量

```bash
# 更新环境变量为生产模式
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=你的生产Client_ID
PAYPAL_CLIENT_SECRET=你的生产Secret密钥
```

#### 7.4: 重新部署

```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
```

#### 7.5: 小额测试

⚠️ **重要**：使用真实的小额付款（如 $0.01）测试完整流程，确认一切正常后再正式开放。

---

## 8. 常见问题排查

### 问题 1: PayPal 按钮不显示

**可能原因**：
- Client ID 未正确配置
- PayPal SDK 未加载成功
- 前端代码中的 `PAYPAL_CLIENT_ID` 变量为空

**解决方案**：
```bash
# 检查环境变量
npx wrangler pages deployment list --project-name review-system

# 查看浏览器控制台错误
# 打开浏览器开发者工具，查看 Console 中的错误信息

# 验证 PayPal SDK 是否加载
# 在浏览器控制台输入：typeof paypal
# 应该返回 "object" 而不是 "undefined"
```

### 问题 2: 支付后未升级用户

**可能原因**：
- capture-order 端点出错
- 数据库更新失败
- 订单 ID 不匹配

**解决方案**：
```bash
# 查看后端日志
pm2 logs review-system --nostream

# 检查 payment_records 表
npx wrangler d1 execute review-system-production --local \
  --command="SELECT * FROM payment_records ORDER BY created_at DESC LIMIT 5"

# 检查用户表
npx wrangler d1 execute review-system-production --local \
  --command="SELECT id, email, role, subscription_expires_at FROM users WHERE email='测试邮箱'"
```

### 问题 3: CORS 错误

**可能原因**：
- PayPal 回调 URL 配置错误
- CORS 中间件未正确配置

**解决方案**：
检查 `src/routes/payment.ts` 中的 CORS 配置：

```typescript
import { cors } from 'hono/cors'

payment.use('/cart/*', cors({
  origin: ['https://review-system.pages.dev', 'http://localhost:3000'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))
```

### 问题 4: 沙盒和生产混淆

**症状**：
- 测试账号在生产环境无法使用
- 生产支付在沙盒环境失败

**解决方案**：

| 环境 | PAYPAL_MODE | Client ID 来源 | 用户账号 |
|------|-------------|---------------|----------|
| 本地开发 | `sandbox` | Sandbox 标签页 | 测试账号 |
| Cloudflare Preview | `sandbox` | Sandbox 标签页 | 测试账号 |
| Cloudflare Production | `live` | Live 标签页 | 真实 PayPal 账号 |

---

## 9. 安全最佳实践

### ✅ DO（应该做）

1. **使用环境变量存储敏感信息**
   - 永远不要在代码中硬编码 Client Secret
   - 使用 `.dev.vars` (本地) 和 Cloudflare 环境变量（生产）

2. **验证 PayPal 回调**
   - 始终验证订单 ID 的真实性
   - 检查支付金额是否匹配
   - 验证支付状态为 "COMPLETED"

3. **记录所有交易**
   - 保存完整的 PayPal 订单信息到 `payment_records` 表
   - 记录时间戳、金额、用户 ID

4. **测试充分后再上线**
   - 在沙盒环境完成所有测试
   - 使用小额真实付款验证生产环境
   - 准备回滚方案

### ❌ DON'T（不应该做）

1. **不要提交敏感信息到 Git**
   - `.dev.vars` 已在 `.gitignore` 中
   - 检查 `wrangler.jsonc` 不包含密钥

2. **不要在生产环境使用沙盒凭证**
   - 沙盒凭证在生产环境无效
   - 用户无法完成真实付款

3. **不要跳过订单验证**
   - 必须调用 PayPal API 验证订单状态
   - 不要仅依赖前端传递的信息

4. **不要忽略错误日志**
   - 定期检查支付失败日志
   - 及时处理异常情况

---

## 10. 配置检查清单

在正式上线前，请确认以下检查清单：

### 开发环境
- [ ] `.dev.vars` 文件已创建并包含正确的沙盒凭证
- [ ] `PAYPAL_MODE=sandbox`
- [ ] PayPal SDK 在前端正确加载（client-id 不为空）
- [ ] 测试购买流程完整通过（从添加到购物车到支付成功）
- [ ] 用户升级功能正常（role 变为 premium，设置到期日期）
- [ ] 购物车在支付后正确清空

### 生产环境
- [ ] Cloudflare Pages 环境变量已配置
- [ ] `PAYPAL_MODE=live`
- [ ] 使用生产环境的 Client ID 和 Secret
- [ ] PayPal 商家账号已激活
- [ ] 小额真实付款测试通过
- [ ] 所有敏感信息已从代码中移除
- [ ] 生产数据库迁移已应用（包括 shopping_cart 表）

### 功能测试
- [ ] 添加商品到购物车
- [ ] 查看购物车内容
- [ ] 删除单个商品
- [ ] 清空购物车
- [ ] 多商品结算（同时购买升级和续费）
- [ ] 防止重复添加同类商品
- [ ] PayPal 支付成功流程
- [ ] 支付失败处理
- [ ] 用户角色升级
- [ ] 订阅日期计算正确

---

## 11. 获取帮助

### PayPal 官方资源

- **开发者文档**: https://developer.paypal.com/docs/
- **API 参考**: https://developer.paypal.com/api/rest/
- **沙盒测试指南**: https://developer.paypal.com/tools/sandbox/
- **社区论坛**: https://www.paypal-community.com/

### Review System 相关

- **GitHub Issues**: https://github.com/Alan16168/review-system/issues
- **项目文档**: `/home/user/webapp/README.md`
- **支付代码**: `/home/user/webapp/src/routes/payment.ts`

---

## 附录：完整的环境变量示例

### `.dev.vars` (本地开发)

```bash
# PayPal Configuration (Sandbox)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=AXXXXXXXXxxxxx_your_sandbox_client_id
PAYPAL_CLIENT_SECRET=EXXXXXXXXxxxxx_your_sandbox_secret

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_API_KEY=your_google_api_key

# Resend Email Service (Optional)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# YouTube API (Optional)
YOUTUBE_API_KEY=your_youtube_api_key
```

### Cloudflare Pages Environment Variables (Production)

**Production 环境：**
```
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=<your_live_client_id>
PAYPAL_CLIENT_SECRET=<your_live_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_API_KEY=<your_google_api_key>
RESEND_API_KEY=<your_resend_api_key>
YOUTUBE_API_KEY=<your_youtube_api_key>
```

---

**祝您配置顺利！如有任何问题，请参考官方文档或在 GitHub 提交 Issue。**
