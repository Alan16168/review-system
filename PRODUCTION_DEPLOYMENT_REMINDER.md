# 生产环境部署提醒 - Gemini API 密钥

**日期**: 2025-11-23  
**优先级**: 🔴 高

---

## ⚠️ 重要提醒

开发环境的 Gemini API 密钥已更新，但 **生产环境尚未更新**。

当您下次部署到生产环境时，请确保更新 Gemini API 密钥。

---

## 📋 生产环境部署步骤

### 方法 1: 使用 Wrangler CLI（推荐）

```bash
# 1. 设置新的 Gemini API 密钥
npx wrangler secret put GEMINI_API_KEY --env production

# 当提示输入时，粘贴新密钥:
AIzaSyA30dOCYMAHbhvDLNRX16PqAyTA_uIqHKk

# 2. 验证密钥已设置
npx wrangler secret list --env production

# 3. 部署新版本
npm run build
npx wrangler pages deploy dist --project-name review-system
```

### 方法 2: 使用 Cloudflare Dashboard

1. **登录 Cloudflare Dashboard**
   - 访问: https://dash.cloudflare.com
   - 选择您的账号

2. **进入 Workers & Pages**
   - 找到项目: `review-system`
   - 点击项目名称

3. **配置环境变量**
   - 点击 `Settings` 标签
   - 选择 `Environment Variables`
   - 在 `Production` 环境中：
     - 变量名: `GEMINI_API_KEY`
     - 变量值: `AIzaSyA30dOCYMAHbhvDLNRX16PqAyTA_uIqHKk`
   - 点击 `Encrypt` 和 `Save`

4. **重新部署**
   - 返回 `Deployments` 标签
   - 点击最新部署右侧的 `...` 菜单
   - 选择 `Retry deployment`

---

## 🧪 验证生产环境

部署完成后，使用以下步骤验证：

### 1. 访问生产网站
```
https://review-system.pages.dev
```

### 2. 测试名著文档复盘功能
1. 登录您的账号
2. 访问 `/famous-books-documents`
3. 上传或粘贴文档内容
4. 点击"分析"按钮
5. 确认 AI 分析正常返回结果

### 3. 检查 Cloudflare 日志
在 Cloudflare Dashboard 的 `Logs` 标签中：
- 查找任何 `403 Forbidden` 错误
- 确认 Gemini API 调用成功
- 检查响应时间正常

---

## 📝 当前状态

| 环境 | 密钥状态 | 更新时间 | 测试状态 |
|------|---------|---------|---------|
| **开发环境** | ✅ 已更新 | 2025-11-23 18:15 | ✅ 测试通过 |
| **生产环境** | ⚠️ 待更新 | - | 🔴 未测试 |

---

## 🔒 安全注意事项

### 密钥管理
- ✅ 新密钥已在开发环境测试
- ✅ 旧密钥已被 Google 禁用
- ⚠️ 生产环境使用独立密钥配置
- ⚠️ 不要在代码或日志中硬编码密钥

### 密钥轮换计划
建议设置定期密钥轮换：
- **频率**: 每 3-6 个月
- **提醒**: 设置日历提醒
- **文档**: 更新此文档的轮换记录

### 监控告警
在 Google Cloud Console 中设置：
- **API 配额告警**: 使用量达到 80% 时通知
- **异常流量告警**: 检测异常 API 调用模式
- **错误率告警**: 403/429 错误率超过阈值时通知

---

## 📚 相关资源

### 文档
- [GEMINI_API_FIX_2025-11-23.md](./GEMINI_API_FIX_2025-11-23.md) - 详细修复报告
- [QUICK_FIX_SUMMARY.md](./QUICK_FIX_SUMMARY.md) - 快速修复总结
- [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) - API 配置指南

### 测试脚本
- `test_gemini_key.sh` - API 密钥验证脚本
- `test_gemini_features.sh` - 功能测试脚本

### 外部链接
- [Gemini API 文档](https://ai.google.dev/docs)
- [获取新密钥](https://aistudio.google.com/app/apikey)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)

---

## ✅ 部署检查清单

在部署到生产环境前，请确认：

- [ ] 已在开发环境测试新密钥
- [ ] 已准备好生产环境密钥
- [ ] 已备份当前生产环境配置
- [ ] 已通知团队成员即将部署
- [ ] 已选择低流量时段部署
- [ ] 已准备好回滚方案

部署后验证：

- [ ] 生产环境 Gemini API 调用成功
- [ ] 名著文档复盘功能正常
- [ ] AI 对话功能正常
- [ ] 无 403/500 错误日志
- [ ] 响应时间在正常范围
- [ ] 更新此文档的部署记录

---

## 📞 支持联系

如遇到问题：
1. 检查 Cloudflare Dashboard 日志
2. 运行 `test_gemini_key.sh` 验证密钥
3. 查看相关文档排查问题
4. 必要时联系技术支持

---

**下次部署时间**: _待定_  
**负责人**: _待分配_  
**备注**: 此为常规配置更新，优先级高但不紧急
