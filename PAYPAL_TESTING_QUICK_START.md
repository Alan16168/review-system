# PayPal支付测试快速入门

## ⚠️ 重要提示

当前系统使用 **PayPal Sandbox测试环境**，您的真实PayPal账号无法登录。

需要使用 **PayPal Sandbox测试账号** 才能完成支付。

## 🚀 5分钟快速开始

### 第1步：创建测试账号（只需做一次）

1. 访问 https://developer.paypal.com/
2. 用您的真实PayPal账号登录
3. 点击 "Sandbox" → "Accounts"
4. 点击 "Create Account"
5. 选择 "Personal" (个人账号)
6. 点击 "Create"

✅ 完成！您会看到一个测试邮箱和密码，例如：
```
Email: sb-test47ktk123456@personal.example.com
Password: <8&gt;5mK9!p
Balance: $10,000.00 (测试金额，不是真钱)
```

### 第2步：使用测试账号支付

1. 在系统中添加商品到购物车
2. 点击"结算"按钮
3. 点击蓝色的PayPal按钮（或"确认支付"按钮）
4. 在PayPal登录页面：
   - **Email**: 使用上面创建的测试邮箱
   - **Password**: 使用测试密码
5. 点击 "Log In"
6. 确认支付

✅ 完成！您的订阅状态会自动更新。

## 💡 常见问题

### Q: 为什么不能用我的真实PayPal账号？
A: 因为当前是测试环境，使用虚拟货币，不会产生真实费用。真实PayPal账号只能在生产环境使用。

### Q: 测试账号的$10,000是真钱吗？
A: 不是，这是虚拟测试金额，不会产生任何费用。

### Q: 我可以删除测试账号吗？
A: 可以，但建议保留用于后续测试。

### Q: 如何切换到真实支付？
A: 需要：
   1. 获取PayPal Live凭据
   2. 联系系统管理员更新配置
   3. 重新部署系统

## 📸 示例截图说明

**在PayPal登录页面看到的内容：**
```
Email or mobile number: [输入测试邮箱]
Password: [输入测试密码]
[Log In按钮]
```

⚠️ **不要**输入您的真实PayPal邮箱，输入测试账号邮箱！

## 🎯 测试检查清单

- [ ] 创建了PayPal Sandbox测试账号
- [ ] 记录了测试邮箱和密码
- [ ] 成功在系统中添加商品到购物车
- [ ] 点击了"结算"按钮
- [ ] 看到了PayPal登录页面
- [ ] 使用测试账号成功登录
- [ ] 确认了支付
- [ ] 订阅状态已更新
- [ ] 用户级别已变更

## 📞 需要帮助？

如果您在测试过程中遇到问题：

1. **忘记测试账号密码**:
   - 访问 https://developer.paypal.com/dashboard/accounts
   - 点击测试账号旁的"..."菜单
   - 选择 "View/Edit account"
   - 重置密码

2. **PayPal页面报错**:
   - 确认使用的是Sandbox测试账号
   - 检查测试账号余额是否充足
   - 尝试创建新的测试账号

3. **支付完成但订阅未更新**:
   - 刷新页面查看最新状态
   - 检查浏览器控制台是否有错误
   - 联系技术支持

---

**快速链接**:
- PayPal Developer: https://developer.paypal.com/
- 系统URL: https://ec91d0ed.review-system.pages.dev
- 详细文档: PAYPAL_SANDBOX_TESTING_GUIDE.md
