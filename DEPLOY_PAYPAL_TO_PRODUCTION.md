# 部署 PayPal 配置到生产环境

本指南说明如何将 PayPal 配置部署到 Cloudflare Pages 生产环境。

## 📋 前提条件

- ✅ 本地开发环境 PayPal 配置已完成
- ✅ 购物车功能已测试通过
- ✅ 有 Cloudflare 账号访问权限
- ⏳ PayPal 凭证已准备（沙盒或生产）

## 🚀 快速部署步骤

### 步骤 1: 登录 Cloudflare Dashboard

1. 访问：https://dash.cloudflare.com/
2. 使用您的 Cloudflare 账号登录
3. 进入 **Pages** 部分
4. 选择项目：**review-system**

### 步骤 2: 配置环境变量

1. 在项目页面，点击 **Settings** 标签
2. 在左侧菜单找到 **Environment variables**
3. 点击 **Add variable** 按钮

### 步骤 3: 添加 PayPal 环境变量

添加以下三个环境变量：

#### 变量 1: PAYPAL_MODE

- **Variable name**: `PAYPAL_MODE`
- **Value**: `sandbox` （测试环境）或 `live` （生产环境）
- **Environment**: 选择 `Production` 和 `Preview`
- 点击 **Save**

#### 变量 2: PAYPAL_CLIENT_ID

- **Variable name**: `PAYPAL_CLIENT_ID`
- **Value**: `AcbwaQxT0gBx71r4wUu54sCgjSCVz3YdGv8cNsEPfHhuVnXj9Icyh-EdIfQsTQ__FVm1ZGmU_M3HZdx4`
- **Environment**: 选择 `Production` 和 `Preview`
- 点击 **Save**

#### 变量 3: PAYPAL_CLIENT_SECRET

- **Variable name**: `PAYPAL_CLIENT_SECRET`
- **Value**: `EKOBazbtj_tMYpGKYyXx-3GyVxo6hbAMTGu7HB6WQt5JfY0bUpCnnzOn91mzLTAduZwwPYw6MgaAeL5g`
- **Environment**: 选择 `Production` 和 `Preview`
- 点击 **Save**

**注意**：这些是沙盒凭证，仅用于测试。如果要使用生产凭证，请参考下面的"切换到生产模式"部分。

### 步骤 4: 验证配置

配置完成后，您应该看到三个环境变量：

| Variable name | Environment | Value (masked) |
|---------------|-------------|----------------|
| PAYPAL_MODE | Production, Preview | sandbox |
| PAYPAL_CLIENT_ID | Production, Preview | Acbw...dx4 |
| PAYPAL_CLIENT_SECRET | Production, Preview | EKOB...L5g |

### 步骤 5: 重新部署

#### 方法 1: 通过 Cloudflare Dashboard

1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击 **...** → **Retry deployment**

#### 方法 2: 通过命令行

```bash
# 确保代码是最新的
cd /home/user/webapp

# 重新构建
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name review-system
```

### 步骤 6: 验证生产环境

部署完成后，访问生产环境 URL：
```
https://review-system.pages.dev
```

#### 验证 PayPal SDK 加载

1. 在浏览器中打开生产环境 URL
2. 按 F12 打开开发者工具
3. 切换到 **Console** 标签
4. 输入：`typeof paypal`
5. 应该返回：`"object"`

如果返回 `"undefined"`，说明 PayPal SDK 未加载，需要检查配置。

#### 验证 Client ID

1. 在浏览器中右键 → **查看网页源代码**
2. 搜索：`paypal.com/sdk`
3. 验证 `client-id` 参数存在且正确

---

## 🧪 测试生产环境

### 测试购物车功能

1. 访问生产环境 URL
2. 注册或登录账号
3. 进入用户设置页面
4. 点击"升级"按钮
5. 验证：显示"已添加到购物车"
6. 点击购物车图标
7. 验证：商品正确显示
8. 点击"结算"按钮
9. 验证：PayPal 按钮显示

### 测试支付流程（需要测试账号）

⚠️ **重要**：在生产环境使用沙盒模式时，只能使用 PayPal 沙盒测试账号。

1. 点击 PayPal 按钮
2. 使用 PayPal 沙盒测试账号登录
3. 确认支付
4. 验证：支付成功
5. 验证：用户角色升级
6. 验证：购物车清空

---

## 🔄 切换到生产模式

### 何时切换？

**满足以下条件后再切换到生产模式**：
- ✅ 所有功能在沙盒环境测试通过
- ✅ 支付流程完整无误
- ✅ PayPal 商家账号已激活
- ✅ 准备好接收真实付款

### 切换步骤

#### 1. 创建 PayPal Live 应用

1. 访问 PayPal 开发者控制台：https://developer.paypal.com/
2. 切换到 **"Live"** 标签
3. 点击 **"Create App"**
4. 填写应用信息：
   - App Name: `Review System - Production`
   - App Type: `Merchant`
5. 点击 **"Create App"**
6. 记录新的 Client ID 和 Secret

#### 2. 更新 Cloudflare Pages 环境变量

回到 Cloudflare Pages 的环境变量设置：

**更新 PAYPAL_MODE**:
- 将值从 `sandbox` 改为 `live`

**更新 PAYPAL_CLIENT_ID**:
- 替换为生产环境的 Client ID

**更新 PAYPAL_CLIENT_SECRET**:
- 替换为生产环境的 Secret

#### 3. 重新部署

```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
```

#### 4. 小额测试

⚠️ **强烈建议**：在正式开放前，使用真实的小额支付（如 $0.01）进行测试。

---

## 📊 环境配置对比

### 沙盒模式 vs 生产模式

| 项目 | 沙盒模式 | 生产模式 |
|------|----------|----------|
| PAYPAL_MODE | `sandbox` | `live` |
| 用途 | 测试 | 正式运营 |
| 支付 | 测试账号，不真实扣款 | 真实账号，真实扣款 |
| Client ID 来源 | Sandbox 标签 | Live 标签 |
| 适用场景 | 开发、测试、演示 | 生产环境 |

---

## 🔒 安全检查清单

### 部署前检查

- [ ] PayPal Client ID 已正确配置
- [ ] PayPal Secret 已正确配置
- [ ] PAYPAL_MODE 设置正确（sandbox 或 live）
- [ ] 环境变量选择了正确的环境（Production）
- [ ] 本地测试已通过
- [ ] .dev.vars 文件在 .gitignore 中
- [ ] Secret 不会暴露在前端代码中

### 部署后验证

- [ ] 生产环境可以访问
- [ ] PayPal SDK 正确加载
- [ ] Client ID 正确注入到前端
- [ ] 购物车功能正常
- [ ] PayPal 按钮显示正常
- [ ] 支付流程可以完成（测试账号）

---

## ❌ 常见问题排查

### 问题 1: PayPal 按钮不显示

**可能原因**：
- 环境变量未配置
- 环境变量配置错误
- 未重新部署

**解决方案**：
1. 检查 Cloudflare Pages 环境变量
2. 确认 `PAYPAL_CLIENT_ID` 存在
3. 重新部署应用
4. 清除浏览器缓存

### 问题 2: 支付失败

**可能原因**：
- Secret 配置错误
- 网络问题
- PayPal API 错误

**解决方案**：
1. 检查 Cloudflare Pages Logs
2. 验证 Secret 是否正确
3. 检查 PayPal Developer Dashboard 的 API 调用日志

### 问题 3: 沙盒测试账号无法使用

**可能原因**：
- 使用了生产凭证但尝试使用测试账号
- PayPal 模式设置错误

**解决方案**：
1. 确认 `PAYPAL_MODE=sandbox`
2. 使用正确的沙盒凭证
3. 获取新的测试账号

---

## 📞 获取帮助

### 文档
- [PayPal 配置确认](./PAYPAL_CONFIG_CONFIRMED.md)
- [PayPal 快速配置](./PAYPAL_QUICK_START.md)
- [购物车测试指南](./SHOPPING_CART_TEST_GUIDE.md)

### 官方资源
- Cloudflare Pages 文档: https://developers.cloudflare.com/pages/
- PayPal 开发者文档: https://developer.paypal.com/docs/

---

## ✅ 部署完成检查

部署完成后，确认以下项目：

- [ ] Cloudflare Pages 环境变量已配置（3个）
- [ ] 应用已重新部署
- [ ] 生产环境可以访问
- [ ] PayPal SDK 正确加载
- [ ] 购物车功能正常
- [ ] PayPal 按钮显示
- [ ] 测试支付流程通过（沙盒账号）

---

**部署指南版本**: 1.0  
**最后更新**: 2025-11-09  
**适用版本**: V5.15.3+

**下一步**：完成配置后，参考 [SHOPPING_CART_TEST_GUIDE.md](./SHOPPING_CART_TEST_GUIDE.md) 进行完整的功能测试。
