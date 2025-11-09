# PayPal 支付功能配置指南

## 功能概述

系统现已集成 PayPal 支付功能，支持：
1. **用户升级**：免费用户可以通过 PayPal 支付升级到高级用户
2. **订阅续费**：高级用户可以通过 PayPal 支付续费年费
3. **价格管理**：管理员可以在后台修改订阅价格和时长
4. **支付记录**：管理员可以查看所有支付交易记录

## PayPal 配置步骤

### 1. 创建 PayPal 开发者账号

1. 访问 [PayPal Developer](https://developer.paypal.com/)
2. 使用您的 PayPal 账号登录
3. 如果没有 PayPal 账号，需要先注册一个

### 2. 创建应用获取凭据

1. 登录后，进入 [Dashboard](https://developer.paypal.com/dashboard/)
2. 点击 "My Apps & Credentials"
3. 在 "Sandbox" 标签下，点击 "Create App"
4. 输入应用名称（如 "Review System"）
5. 点击 "Create App"
6. 创建成功后，您将看到：
   - **Client ID**
   - **Secret**（点击 "Show" 查看）

### 3. 配置开发环境

编辑 `.dev.vars` 文件，添加 PayPal 凭据：

```bash
# PayPal 配置（开发环境使用 sandbox）
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=你的_sandbox_client_id
PAYPAL_CLIENT_SECRET=你的_sandbox_client_secret
```

### 4. 测试 PayPal 支付

PayPal Sandbox 提供测试账号：

1. 进入 [Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
2. 您会看到自动生成的测试买家账号（Personal Account）
3. 点击账号右侧的 "..." 查看登录信息
4. 在沙箱环境中使用这些测试账号进行支付测试

测试流程：
- 在应用中点击"升级"或"续费"按钮
- 在 PayPal 弹出窗口中登录测试买家账号
- 完成测试支付
- 系统会自动更新用户的订阅状态

### 5. 配置生产环境

当准备上线时：

1. 在 PayPal Developer Dashboard 切换到 "Live" 标签
2. 创建生产环境的应用
3. 获取生产环境的 Client ID 和 Secret
4. 使用 wrangler 设置生产环境变量：

```bash
# 设置生产环境 PayPal 配置
npx wrangler pages secret put PAYPAL_MODE
# 输入：live

npx wrangler pages secret put PAYPAL_CLIENT_ID
# 输入：你的生产环境 Client ID

npx wrangler pages secret put PAYPAL_CLIENT_SECRET
# 输入：你的生产环境 Secret
```

### 6. 更新前端 PayPal SDK

编辑 `src/index.tsx`，将 `YOUR_PAYPAL_CLIENT_ID` 替换为实际的 Client ID：

```html
<!-- 开发环境 -->
<script src="https://www.paypal.com/sdk/js?client-id=你的_sandbox_client_id&currency=USD"></script>

<!-- 生产环境 -->
<script src="https://www.paypal.com/sdk/js?client-id=你的_live_client_id&currency=USD"></script>
```

**注意**：前端 SDK 的 Client ID 必须与后端配置的 Client ID 一致。

## 使用说明

### 用户端功能

#### 升级到高级用户
1. 免费用户登录后，在顶部导航栏会看到"升级"按钮
2. 点击"升级"按钮，弹出支付窗口
3. 显示年费价格（默认 $20/年，管理员可修改）
4. 点击 PayPal 按钮完成支付
5. 支付成功后，用户角色自动升级为 premium
6. 订阅有效期为 365 天（管理员可修改）

#### 续费订阅
1. 高级用户登录后，在顶部导航栏会看到"续费"按钮
2. 点击"续费"按钮，弹出续费窗口
3. 显示当前订阅到期日期和续费价格
4. 完成支付后，订阅有效期延长一年
5. 如果订阅已过期，会从当前日期开始计算
6. 如果订阅未过期，会从原到期日期延长

### 管理员功能

#### 修改订阅价格
1. 管理员登录后，进入"管理后台"
2. 点击"订阅管理"标签页
3. 在"价格设置"区域：
   - 修改年费价格（美元）
   - 修改订阅时长（天数）
4. 点击"更新价格"保存

#### 查看支付记录
1. 在"订阅管理"标签页
2. 滚动到"支付历史"区域
3. 查看所有用户的支付记录：
   - 用户信息
   - 支付金额
   - 支付状态（completed/pending/failed）
   - 支付日期

## 数据库说明

### 新增表

#### users 表新增字段
- `subscription_tier`：订阅层级（free/premium）
- `subscription_expires_at`：订阅到期时间
- `subscription_auto_renew`：是否自动续费（预留）

#### subscription_config 表
- 存储订阅配置（价格、时长、描述等）
- 管理员可通过后台修改

#### payments 表
- 记录所有支付交易
- 包含 PayPal 订单 ID、支付状态等信息

### 应用迁移

```bash
# 本地开发环境
npx wrangler d1 execute review-system-production --local --file=migrations/0019_add_subscription_system.sql

# 生产环境
npx wrangler d1 execute review-system-production --file=migrations/0019_add_subscription_system.sql
```

## API 接口

### 用户端接口

- `GET /api/payment/subscription/info` - 获取订阅信息和价格
- `POST /api/payment/subscription/create-order` - 创建 PayPal 订单
- `POST /api/payment/subscription/capture-order` - 完成支付并激活订阅
- `GET /api/payment/history` - 获取当前用户支付历史

### 管理员接口

- `GET /api/admin/subscription/config` - 获取订阅配置
- `PUT /api/admin/subscription/config/:tier` - 更新订阅配置
- `GET /api/admin/payments` - 获取所有支付记录

## 安全注意事项

1. **不要提交敏感信息**：`.dev.vars` 文件已在 `.gitignore` 中，确保不要提交到 Git
2. **使用环境变量**：生产环境的 PayPal 凭据必须使用 wrangler secrets 设置
3. **验证支付**：后端会验证 PayPal 回调，确保支付真实有效
4. **HTTPS 要求**：PayPal 要求使用 HTTPS，Cloudflare Pages 自动提供

## 常见问题

### Q: 测试支付时出现错误？
A: 确保使用 PayPal Sandbox 测试账号，不要使用真实账号。

### Q: 如何获取 PayPal Sandbox 测试账号？
A: 访问 https://developer.paypal.com/dashboard/accounts 查看自动生成的测试账号。

### Q: 前端 PayPal 按钮不显示？
A: 检查浏览器控制台错误，确认 PayPal SDK 已正确加载，Client ID 是否正确。

### Q: 支付成功但用户状态未更新？
A: 检查后端日志，确认 capture-order 接口是否正常执行。

### Q: 如何测试订阅过期？
A: 可以在数据库中手动修改 `subscription_expires_at` 为过去的日期进行测试。

## 支持

如有问题，请参考：
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
