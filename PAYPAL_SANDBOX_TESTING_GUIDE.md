# PayPal Sandbox 测试指南

## 问题说明

在"结算"界面点击PayPal按钮后，无法使用个人真实PayPal账号登录。这是因为当前系统配置为 **PayPal Sandbox测试环境**，需要使用 **PayPal Sandbox测试账号** 才能完成支付。

## 什么是PayPal Sandbox？

PayPal Sandbox是PayPal提供的测试环境，用于开发和测试支付功能，**不会产生真实交易**。

- ✅ **优点**: 免费测试，不产生真实费用
- ✅ **用途**: 开发调试、功能测试
- ⚠️ **限制**: 需要使用专门的测试账号，真实PayPal账号无法在sandbox登录

## 解决方案

### 方案一：创建PayPal Sandbox测试账号（推荐用于测试）

#### 步骤1：访问PayPal Developer Dashboard
1. 打开 https://developer.paypal.com/
2. 使用您的真实PayPal账号登录
3. 点击 "Dashboard" 进入开发者控制台

#### 步骤2：创建Sandbox测试账号
1. 在左侧菜单点击 "Sandbox" → "Accounts"
2. 点击 "Create Account" 创建新的测试账号
3. 选择账号类型：
   - **Business Account（商家账号）**: 用于接收支付
   - **Personal Account（个人账号）**: 用于支付（**您需要这个**）
4. 填写基本信息：
   - Country: 选择国家/地区
   - Email: 自动生成（例如：sb-test123@personal.example.com）
   - Password: 设置测试账号密码
5. 点击 "Create" 完成创建

#### 步骤3：获取测试账号凭据
创建后，您可以看到：
- **Email**: 测试账号邮箱（例如：sb-test123@personal.example.com）
- **Password**: 测试账号密码
- **Balance**: 测试账号余额（自动充值$10,000测试金额）

#### 步骤4：使用测试账号完成支付
1. 在系统中添加商品到购物车
2. 点击"结算"按钮
3. 点击PayPal按钮
4. 使用 **Sandbox测试账号** 登录：
   - Email: 使用您创建的测试账号邮箱
   - Password: 使用您设置的测试密码
5. 确认支付
6. 查看订阅状态更新

### 方案二：切换到PayPal生产环境（用于真实支付）

如果您希望使用真实PayPal账号进行真实支付，需要：

#### 步骤1：获取PayPal生产环境凭据
1. 访问 https://developer.paypal.com/
2. 登录并进入Dashboard
3. 点击 "Apps & Credentials"
4. 切换到 **"Live"标签**（而不是Sandbox）
5. 创建或选择您的Live App
6. 获取：
   - **Client ID** (Live环境)
   - **Secret** (Live环境)

#### 步骤2：更新Cloudflare环境变量
```bash
# 设置生产模式
echo "live" | npx wrangler pages secret put PAYPAL_MODE --project-name review-system

# 设置Live Client ID
echo "YOUR_LIVE_CLIENT_ID" | npx wrangler pages secret put PAYPAL_CLIENT_ID --project-name review-system

# 设置Live Client Secret
echo "YOUR_LIVE_SECRET" | npx wrangler pages secret put PAYPAL_CLIENT_SECRET --project-name review-system
```

#### 步骤3：重新部署
```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
```

⚠️ **重要提醒**：
- 切换到生产环境后，所有支付都是**真实交易**
- 会从用户的真实PayPal账户扣款
- 建议先在sandbox充分测试后再切换到生产环境

## 当前配置状态

```
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=AcbwaQxT0gBx71r4wUu54sCgjSCVz3YdGv8cNsEPfHhuVnXj9Icyh-EdIfQsTQ__FVm1ZGmU_M3HZdx4
PAYPAL_CLIENT_SECRET=EKOBazbtj_tMYpGKYyXx-3GyVxo6hbAMTGu7HB6WQt5JfY0bUpCnnzOn91mzLTAduZwwPYw6MgaAeL5g
```

✅ **当前环境**: Sandbox测试环境  
✅ **需要**: PayPal Sandbox测试账号  
❌ **不能使用**: 真实PayPal账号

## 快速测试流程（使用Sandbox）

1. **创建Sandbox个人测试账号** (参考上面步骤)
2. **记录测试账号信息**:
   ```
   Email: sb-xxxxxxx@personal.example.com
   Password: your-test-password
   Balance: $10,000.00 (测试金额)
   ```
3. **在系统中测试支付**:
   - 登录系统
   - 添加商品到购物车
   - 点击"结算"
   - 点击PayPal按钮
   - 使用Sandbox测试账号登录
   - 确认支付
4. **验证结果**:
   - 订阅状态已更新
   - 用户级别已变更
   - 购物车已清空

## 常见问题

### Q1: 为什么不能用真实PayPal账号登录？
**A**: 因为当前配置为sandbox测试环境，只接受PayPal创建的测试账号。这是PayPal的安全机制，防止测试时产生真实交易。

### Q2: Sandbox账号的余额是真钱吗？
**A**: 不是。Sandbox账号的余额是虚拟测试金额，不会产生任何真实费用。

### Q3: 如何从Sandbox切换到生产环境？
**A**: 参考上面的"方案二"，获取Live凭据并更新Cloudflare环境变量。

### Q4: 测试账号可以重复使用吗？
**A**: 可以。创建一次后可以一直使用，除非您删除该账号。

### Q5: 可以创建多个测试账号吗？
**A**: 可以。您可以创建多个Personal和Business测试账号用于不同测试场景。

## 推荐测试流程

### 阶段1：Sandbox充分测试（当前阶段）✅
- ✅ 创建Sandbox测试账号
- ✅ 测试升级支付流程
- ✅ 测试续费支付流程
- ✅ 测试购物车多商品结算
- ✅ 验证订阅状态更新
- ✅ 验证用户权限变更

### 阶段2：准备上线
- 🔄 获取PayPal Live凭据
- 🔄 更新生产环境配置
- 🔄 进行小额真实支付测试
- 🔄 确认所有功能正常

### 阶段3：正式上线
- 🚀 宣布功能上线
- 📊 监控支付成功率
- 🐛 快速响应问题反馈
- 📈 优化用户体验

## 相关资源

- **PayPal Developer Portal**: https://developer.paypal.com/
- **PayPal Sandbox指南**: https://developer.paypal.com/api/rest/sandbox/
- **PayPal API文档**: https://developer.paypal.com/docs/api/overview/
- **Sandbox账号管理**: https://developer.paypal.com/dashboard/accounts

## 联系支持

如果您在测试过程中遇到问题：
1. 检查PayPal Developer Dashboard的日志
2. 查看浏览器控制台错误信息
3. 查看Cloudflare Pages部署日志
4. 联系PayPal技术支持

---

**最后更新**: 2025-11-09  
**当前版本**: V5.16.0  
**环境**: PayPal Sandbox测试环境
