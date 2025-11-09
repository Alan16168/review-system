# 续费提醒功能配置指南

## 功能概述

系统现已实现自动续费提醒功能：
- **提前30天**：在订阅到期前30天自动发送邮件提醒
- **自动化**：每天运行一次检查
- **个性化**：根据用户语言偏好发送中英文邮件
- **防重复**：记录已发送的提醒，避免重复发送

## 数据库变更

### 新增表：renewal_reminders

用于跟踪已发送的提醒邮件：

```sql
CREATE TABLE renewal_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reminder_type TEXT NOT NULL,  -- '30_days', '7_days', '1_day'
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  subscription_expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 应用迁移

```bash
# 本地环境
npx wrangler d1 execute review-system-production --local --file=migrations/0020_add_renewal_reminders.sql

# 生产环境
npx wrangler d1 execute review-system-production --file=migrations/0020_add_renewal_reminders.sql
```

## API 接口

### GET /api/cron/send-renewal-reminders

自动发送续费提醒邮件。

**功能**：
1. 查找订阅在30天后到期的高级用户
2. 检查是否已发送过提醒（避免重复）
3. 根据用户语言发送个性化邮件
4. 记录发送状态

**返回示例**：
```json
{
  "success": true,
  "message": "Renewal reminders sent",
  "stats": {
    "totalUsers": 5,
    "successCount": 5,
    "failCount": 0
  }
}
```

## 配置方法

由于 Cloudflare Pages 不支持原生的 Cron Triggers，有以下几种配置方案：

### 方案1：使用外部 Cron 服务（推荐）

使用免费的 Cron 服务定期调用 API：

#### 1. **Cron-job.org**（免费，推荐）

1. 访问 https://cron-job.org/
2. 注册免费账号
3. 创建新的 Cron Job：
   - **URL**: `https://your-domain.pages.dev/api/cron/send-renewal-reminders`
   - **Schedule**: 每天 00:00（0 0 * * *）
   - **Method**: GET
   - **Timeout**: 30秒

#### 2. **EasyCron**（免费额度）

1. 访问 https://www.easycron.com/
2. 注册账号
3. 创建 Cron Job：
   - **URL**: `https://your-domain.pages.dev/api/cron/send-renewal-reminders`
   - **Cron Expression**: `0 0 * * *`（每天午夜）

#### 3. **GitHub Actions**（免费）

创建 `.github/workflows/renewal-reminder.yml`：

```yaml
name: Send Renewal Reminders

on:
  schedule:
    # 每天 UTC 00:00 运行
    - cron: '0 0 * * *'
  workflow_dispatch: # 允许手动触发

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call renewal reminder API
        run: |
          curl -X GET https://your-domain.pages.dev/api/cron/send-renewal-reminders
```

### 方案2：创建独立的 Cloudflare Worker（高级）

如果需要完全依赖 Cloudflare 的基础设施：

1. 创建一个新的 Worker 项目
2. 在 `wrangler.toml` 中配置 Cron Trigger：

```toml
[triggers]
crons = ["0 0 * * *"]  # 每天午夜运行
```

3. Worker 代码：

```typescript
export default {
  async scheduled(event, env, ctx) {
    // 调用 Pages 的 API
    await fetch('https://your-domain.pages.dev/api/cron/send-renewal-reminders');
  }
}
```

### 方案3：手动触发（用于测试）

可以随时手动触发续费提醒：

```bash
curl https://your-domain.pages.dev/api/cron/send-renewal-reminders
```

或在浏览器中访问该 URL。

## 邮件内容

### 中文邮件示例

```
主题：您的高级订阅即将到期

您好 [用户名]，

您的高级订阅将于 2025-12-09 到期（距今30天）。

为了继续享受高级功能，请及时续费：

1. 登录您的账号
2. 进入"用户设置"
3. 在"订阅管理"区域点击"续费订阅"按钮

感谢您成为我们尊贵的高级会员！

此致
复盘系统团队
```

### 英文邮件示例

```
Subject: Your Premium Subscription is Expiring Soon

Hi [Username],

Your premium subscription will expire on 2025-12-09 (30 days from now).

To continue enjoying premium features, please renew your subscription:

1. Log in to your account
2. Go to User Settings
3. Click the "Renew Subscription" button in the Subscription Management section

Thank you for being a valued premium member!

Best regards,
Review System Team
```

## 测试步骤

### 1. 测试邮件发送（手动触发）

```bash
# 访问 API 端点
curl https://localhost:3000/api/cron/send-renewal-reminders
```

### 2. 验证邮件内容

- 检查收件箱是否收到邮件
- 验证中英文邮件格式正确
- 确认到期日期显示正确

### 3. 检查数据库记录

```bash
# 查看已发送的提醒记录
npx wrangler d1 execute review-system-production --local \
  --command="SELECT * FROM renewal_reminders ORDER BY sent_at DESC LIMIT 10"
```

### 4. 测试防重复机制

- 多次调用 API 端点
- 确认同一用户不会收到重复邮件

## 监控和维护

### 查看发送统计

API 返回的 stats 对象包含：
- `totalUsers`: 需要发送提醒的用户数
- `successCount`: 成功发送的数量
- `failCount`: 失败的数量

### 常见问题排查

**Q: 邮件没有发送？**
- 检查 RESEND_API_KEY 是否配置正确
- 查看 API 返回的错误信息
- 检查用户的 subscription_expires_at 是否正确

**Q: 收到重复邮件？**
- 检查 renewal_reminders 表是否正确记录
- 确认 Cron Job 没有配置多次运行

**Q: 邮件语言不对？**
- 检查用户的 language 字段设置
- 默认为中文（zh），可改为英文（en）

## 扩展功能

当前实现了30天提前提醒，未来可以扩展：

1. **7天提醒**：到期前7天发送第二次提醒
2. **1天提醒**：到期前1天发送紧急提醒
3. **到期后提醒**：订阅过期后提醒用户续费
4. **自定义提醒时间**：允许用户设置提醒偏好

### 实现多次提醒

修改 `cron.ts`，添加不同的提醒类型：

```typescript
// 30天提醒
const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

// 7天提醒
const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

// 1天提醒
const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
```

然后为每种类型分别查询和发送邮件。

## 安全注意事项

1. **API 访问控制**：
   - 当前 API 是公开的，可以被任何人调用
   - 建议添加简单的 API 密钥验证
   - 或限制只能从特定 IP/域名访问

2. **邮件发送限制**：
   - Resend 免费版有发送限制
   - 监控每日发送量，避免超额

3. **隐私保护**：
   - 邮件中不包含敏感信息
   - 只提醒到期日期和续费链接

## 成本估算

- **Cron-job.org**: 免费（每月1000次调用）
- **GitHub Actions**: 免费（公开仓库）
- **Resend Email**: 免费版每月3000封
- **Cloudflare Pages**: 免费版足够使用

对于中小型应用，完全可以使用免费方案。

## 配置完成检查清单

- [ ] 应用数据库迁移 0020
- [ ] 确认 RESEND_API_KEY 已配置
- [ ] 选择并配置 Cron 服务
- [ ] 测试邮件发送功能
- [ ] 验证防重复机制
- [ ] 设置监控和告警
- [ ] 更新文档和用户说明
