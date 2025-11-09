# PayPal Live 生产环境部署记录

## ⚠️ 重要变更通知

**日期**: 2025-11-09  
**变更内容**: 从 PayPal Sandbox 测试环境切换到 **Live 生产环境**

## 🔴 关键警告

### 所有支付现在都是真实交易！

- ✅ **可以使用**: 真实PayPal账号
- 💰 **产生费用**: 真实的资金转账
- 🏦 **资金流向**: 实际从用户账户扣款到商家账户
- ❌ **不能使用**: PayPal Sandbox测试账号（测试账号在Live环境无效）

## 📊 配置变更记录

### 环境变量更新

| 变量 | Sandbox值 | Live值 | 状态 |
|------|-----------|--------|------|
| `PAYPAL_MODE` | sandbox | **live** | ✅ 已更新 |
| `PAYPAL_CLIENT_ID` | AcbwaQxT0g... (测试) | **AV4i_SNiqZ...** (生产) | ✅ 已更新 |
| `PAYPAL_CLIENT_SECRET` | EKOBazbtj_... (测试) | **EHuw5IqcNv...** (生产) | ✅ 已更新 |

### 部署环境

#### 1. 本地开发环境
- ✅ `.dev.vars` 文件已更新
- ✅ PM2服务已重启
- ✅ PayPal Live SDK已加载
- ✅ 验证通过：http://localhost:3000

#### 2. Cloudflare Pages 生产环境
- ✅ `PAYPAL_MODE` secret已更新为 `live`
- ✅ `PAYPAL_CLIENT_ID` secret已更新
- ✅ `PAYPAL_CLIENT_SECRET` secret已更新
- ✅ 已重新部署
- ✅ 部署URL: https://699beeb8.review-system.pages.dev
- ✅ PayPal Live SDK已验证加载

## 🔒 PayPal Live 凭据信息

### Client ID (Live)
```
AV4i_SNiqZQKsUh0-UVPFBvL0dKC6wwc5CE5oMNzJ9q42RqOa12c5GK1_V8F_wYBW2zBz21uwfcQaMeY
```

### Secret (Live)
```
EHuw5IqcNvfb0AN-xO4h6IUIW7uRHIq4mpw0bb9DjHsX42dUlsLtpriwJLVm4aBSo173HFw8hmZ30-8H
```

⚠️ **安全提示**: 
- 这些凭据具有生产环境权限
- 可以处理真实支付
- 请妥善保管，不要泄露
- 建议定期轮换

## 🧪 测试指南

### 使用真实PayPal账号测试

1. **登录系统**
   - 使用测试账号或真实用户账号登录

2. **添加商品到购物车**
   - 点击"升级"或"续费"按钮
   - 查看购物车

3. **进行真实支付测试**
   - 点击"结算"按钮
   - 点击PayPal按钮
   - **使用真实PayPal账号登录** （不是sandbox测试账号）
   - 确认支付

4. **验证支付结果**
   - ✅ PayPal账户已扣款
   - ✅ 系统订阅状态已更新
   - ✅ 用户级别已升级
   - ✅ 购物车已清空

### 小额测试建议

建议先进行小额真实支付测试：
- 💡 使用最低价格商品测试
- 💡 验证完整支付流程
- 💡 确认订阅更新逻辑
- 💡 测试退款流程（如需要）

## 💰 当前定价

根据 `subscription_config` 表：
- **Premium升级**: $20.00 USD / 365天
- **Premium续费**: $1.00 USD / 365天 (续费优惠价)

⚠️ **注意**: 这些都是真实价格，会产生实际扣款！

## 🔄 如何切换回Sandbox（如需要）

如果需要切换回测试环境：

### 步骤1：更新Cloudflare环境变量
```bash
# 切换到sandbox模式
echo "sandbox" | npx wrangler pages secret put PAYPAL_MODE --project-name review-system

# 恢复sandbox凭据
echo "AcbwaQxT0g..." | npx wrangler pages secret put PAYPAL_CLIENT_ID --project-name review-system
echo "EKOBazbtj_..." | npx wrangler pages secret put PAYPAL_CLIENT_SECRET --project-name review-system
```

### 步骤2：更新本地 .dev.vars
```bash
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=AcbwaQxT0g...
PAYPAL_CLIENT_SECRET=EKOBazbtj_...
```

### 步骤3：重新部署
```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
pm2 restart review-system
```

## 📊 部署验证清单

- [x] Cloudflare环境变量已更新（PAYPAL_MODE=live）
- [x] Cloudflare环境变量已更新（PAYPAL_CLIENT_ID=Live）
- [x] Cloudflare环境变量已更新（PAYPAL_CLIENT_SECRET=Live）
- [x] 生产环境已重新部署
- [x] PayPal SDK正确加载Live Client ID
- [x] 本地开发环境已更新
- [x] PM2服务已重启
- [x] 验证文档已创建
- [ ] 真实支付测试已完成 ⚠️ 待测试
- [ ] 用户已通知环境变更 ⚠️ 待通知

## 🎯 后续建议

### 立即执行
1. ✅ 完成小额真实支付测试
2. ✅ 验证订阅更新逻辑
3. ✅ 测试退款流程
4. ✅ 监控PayPal Dashboard交易记录

### 短期计划
1. 📊 监控支付成功率
2. 🐛 收集用户反馈
3. 💰 确认资金到账
4. 📝 更新用户文档

### 长期计划
1. 🔒 定期审计PayPal凭据
2. 🔄 建立凭据轮换流程
3. 📈 分析支付数据
4. 🎯 优化支付转化率

## 📞 PayPal支持

如果遇到问题：
- **PayPal Dashboard**: https://www.paypal.com/merchantapps/
- **PayPal Developer Portal**: https://developer.paypal.com/
- **技术支持**: https://developer.paypal.com/support/

## 🔐 安全注意事项

1. **凭据保护**
   - ✅ `.dev.vars` 已加入 `.gitignore`
   - ✅ 生产凭据存储在Cloudflare Secrets
   - ⚠️ 不要将Live凭据提交到Git
   - ⚠️ 不要在日志中打印凭据

2. **访问控制**
   - 只有授权人员可以访问PayPal Dashboard
   - 定期审查API权限
   - 启用两步验证

3. **监控告警**
   - 监控异常交易
   - 设置金额告警阈值
   - 定期检查交易记录

## 📝 变更历史

| 日期 | 变更内容 | 操作人 | 状态 |
|------|---------|--------|------|
| 2025-11-09 | 从Sandbox切换到Live环境 | System | ✅ 完成 |
| 2025-11-09 | 更新所有环境变量 | System | ✅ 完成 |
| 2025-11-09 | 部署到生产环境 | System | ✅ 完成 |

---

**文档版本**: 1.0  
**最后更新**: 2025-11-09  
**状态**: ✅ Live环境已激活  
**警告级别**: 🔴 高 - 涉及真实资金交易
