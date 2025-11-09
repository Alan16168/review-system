# Version 5.15.2 Release Notes

**Release Date**: 2025-11-09  
**Deployment URL**: https://fd75e68e.review-system.pages.dev  
**Sandbox Development URL**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev

---

## 🎯 核心更新 / Core Updates

本次更新主要针对订阅管理系统进行了优化和完善。

### 1. 管理后台订阅管理优化 / Admin Subscription Management Optimization

#### A. 价格名称更新 / Price Name Updates

**修改前 / Before**:
- "年费价格（美元）" / "Annual Price (USD)"

**修改后 / After**:
- "高级用户年费（美元）" / "Premium Annual Fee (USD)"
- "高级用户续费费用（美元）" / "Premium Renewal Fee (USD)"

#### B. 新增续费价格配置 / New Renewal Price Configuration

管理员现在可以分别设置：
1. **升级费用** / **Upgrade Fee**: 新用户首次升级到高级用户的价格
2. **续费费用** / **Renewal Fee**: 现有高级用户续费的价格

**默认值** / **Default Values**:
- 升级费用: $20 USD
- 续费费用: $20 USD

**UI 改进** / **UI Improvements**:
- 使用网格布局并排显示两个价格配置
- 每个字段下方添加提示文字说明用途
- 自动刷新页面显示更新后的值

---

### 2. 数据库架构更新 / Database Schema Updates

#### A. 新增字段 / New Field

**表名**: `subscription_config`  
**新字段**: `renewal_price_usd DECIMAL(10, 2) DEFAULT 20.00`

**迁移文件**: `migrations/0021_add_renewal_price.sql`

```sql
-- Add renewal_price_usd field to subscription_config table
ALTER TABLE subscription_config ADD COLUMN renewal_price_usd DECIMAL(10, 2) DEFAULT 20.00;

-- Update existing premium config to set renewal price same as upgrade price
UPDATE subscription_config SET renewal_price_usd = price_usd WHERE tier = 'premium';
```

#### B. 数据验证 / Data Verification

**生产数据库当前状态** / **Production Database Status**:
```
id: 1
tier: premium
price_usd: 20
renewal_price_usd: 20
duration_days: 365
description: 高级用户年费
description_en: Premium Annual Subscription
is_active: 1
```

---

### 3. 用户有效期数据修复 / User Expiry Date Fix

#### A. 问题描述 / Problem Description

之前发现一个高级用户的`subscription_expires_at`字段为`null`，不符合系统要求。

#### B. 修复方案 / Fix Solution

**SQL Update**:
```sql
UPDATE users 
SET subscription_expires_at = datetime(created_at, '+365 days') 
WHERE id = 3 AND role = 'premium' AND subscription_expires_at IS NULL;
```

#### C. 验证结果 / Verification Results

**所有用户当前状态** / **All Users Current Status**:

| ID | Email | Role | Subscription Tier | Expiry Date |
|----|-------|------|------------------|-------------|
| 1 | admin@review.com | admin | free | 9999-12-31 23:59:59 ✅ |
| 3 | user@review.com | premium | premium | 2026-10-09 05:23:57 ✅ |
| 4 | dengalan@gmail.com | admin | free | 9999-12-31 23:59:59 ✅ |
| 11 | gzdzl@hotmail.com | user | free | 9999-12-31 23:59:59 ✅ |

**数据规则验证** / **Data Rules Verification**:
- ✅ 免费用户 (role='user'): 有效期 = 9999-12-31 23:59:59
- ✅ 管理员 (role='admin'): 有效期 = 9999-12-31 23:59:59
- ✅ 高级用户 (role='premium'): 有效期 = 实际日期（创建日期 + 365天）

---

### 4. 用户界面显示验证 / User Interface Display Verification

#### A. 免费用户显示 / Free User Display

- **用户级别**: 免费用户
- **有效期**: 12/31/9999
- **按钮**: 升级
- **备注**: 不显示剩余天数

#### B. 高级用户显示 / Premium User Display

- **用户级别**: 高级用户
- **有效期**: 实际到期日期（例如：10/9/2026）
- **剩余天数**: 显示剩余天数（例如：剩余天数: 334）
- **按钮**: 续费

#### C. 管理员显示 / Admin Display

- **不显示用户级别管理部分** / **User level management section is hidden**

---

### 5. 后端API更新 / Backend API Updates

#### A. 订阅配置更新API / Subscription Config Update API

**文件**: `src/routes/admin.ts` (Line 476-509)

**修改内容** / **Changes**:
```typescript
// 添加 renewal_price_usd 参数
const { price_usd, renewal_price_usd, duration_days, description, description_en, is_active } = await c.req.json();

// 更新 SQL 语句
UPDATE subscription_config 
SET price_usd = ?,
    renewal_price_usd = ?,  // NEW
    duration_days = ?,
    description = ?,
    description_en = ?,
    is_active = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE tier = ?

// 如果没有提供 renewal_price_usd，使用 price_usd 作为默认值
.bind(
  price_usd,
  renewal_price_usd || price_usd,  // Fallback to price_usd
  duration_days,
  description || null,
  description_en || null,
  is_active !== undefined ? is_active : 1,
  tier
)
```

---

### 6. 前端更新 / Frontend Updates

#### A. 管理后台订阅管理页面 / Admin Subscription Management Page

**文件**: `public/static/app.js` (Line 7407-7428)

**UI 布局改进** / **UI Layout Improvements**:
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- 高级用户年费 -->
  <div>
    <label>高级用户年费（美元）</label>
    <input type="number" id="premium-price" value="20" />
    <p class="text-xs text-gray-500">新用户升级价格</p>
  </div>
  
  <!-- 高级用户续费费用 -->
  <div>
    <label>高级用户续费费用（美元）</label>
    <input type="number" id="renewal-price" value="20" />
    <p class="text-xs text-gray-500">现有用户续费价格</p>
  </div>
</div>
```

#### B. 表单提交处理 / Form Submission Handler

**文件**: `public/static/app.js` (Line 7472-7492)

**修改内容** / **Changes**:
```javascript
async function handleUpdateSubscriptionConfig(e) {
  e.preventDefault();
  
  const price = document.getElementById('premium-price').value;
  const renewalPrice = document.getElementById('renewal-price').value;  // NEW
  const duration = document.getElementById('premium-duration').value;
  
  await axios.put('/api/admin/subscription/config/premium', {
    price_usd: parseFloat(price),
    renewal_price_usd: parseFloat(renewalPrice),  // NEW
    duration_days: parseInt(duration),
    description: '高级用户年费',
    description_en: 'Premium Annual Subscription',
    is_active: 1
  });
  
  showNotification(i18n.t('updateSuccess') || '更新成功', 'success');
  showAdmin();  // Refresh to show updated values
}
```

---

### 7. 国际化更新 / i18n Updates

**文件**: `public/static/i18n.js`

#### 中文翻译 / Chinese Translations
```javascript
'annualPrice': '高级用户年费（美元）',
'renewalPrice': '高级用户续费费用（美元）',
'newUserUpgradePrice': '新用户升级价格',
'existingUserRenewalPrice': '现有用户续费价格',
```

#### 英文翻译 / English Translations
```javascript
'annualPrice': 'Premium Annual Fee (USD)',
'renewalPrice': 'Premium Renewal Fee (USD)',
'newUserUpgradePrice': 'New User Upgrade Price',
'existingUserRenewalPrice': 'Existing User Renewal Price',
```

---

## 📊 数据库迁移执行结果 / Database Migration Execution Results

### Migration 0021_add_renewal_price.sql

**执行时间** / **Execution Time**: 4.308ms  
**影响行数** / **Rows Affected**: 2 (ALTER TABLE + UPDATE)  
**数据库大小** / **Database Size**: 0.29 MB  
**状态** / **Status**: ✅ Success

**执行输出** / **Execution Output**:
```
🌀 Processed 2 queries.
🚣 Executed 2 queries in 0.00 seconds (65 rows read, 2 rows written)
```

---

## 🚀 部署信息 / Deployment Information

### Production Deployment
- **URL**: https://fd75e68e.review-system.pages.dev
- **Status**: ✅ Deployed Successfully
- **Build Time**: ~4 seconds
- **Upload Time**: ~1.79 seconds
- **Files Uploaded**: 2 new, 2 unchanged

### Local Development
- **URL**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
- **Status**: ✅ Running
- **PM2 Process**: `review-system` (restart #10)

### Git Repository
- **Commit**: `c02b21c`
- **Branch**: `main`
- **Status**: ✅ Committed

---

## ✅ 测试清单 / Testing Checklist

### 功能测试 / Functional Testing

#### 管理后台 / Admin Panel
- [x] 访问管理后台 -> 订阅管理标签
- [x] 显示"高级用户年费"字段
- [x] 显示"高级用户续费费用"字段
- [x] 两个价格字段并排显示
- [x] 每个字段下方显示提示文字
- [x] 修改价格并保存
- [x] 页面自动刷新显示新值

#### 数据库验证 / Database Verification
- [x] `renewal_price_usd` 字段已添加
- [x] 默认值为 20.00
- [x] 所有免费用户有效期为 9999-12-31
- [x] 所有高级用户有效期为实际日期
- [x] 管理员用户有效期为 9999-12-31

#### 用户设置页面 / User Settings Page
- [x] 免费用户显示 "12/31/9999"
- [x] 高级用户显示实际到期日期
- [x] 高级用户显示剩余天数
- [x] 管理员不显示用户级别管理部分

#### API 测试 / API Testing
- [x] GET `/api/admin/subscription/config` 返回 `renewal_price_usd`
- [x] PUT `/api/admin/subscription/config/premium` 接受 `renewal_price_usd`
- [x] GET `/api/auth/settings` 返回正确的 `subscription_expires_at`

---

## 📖 使用说明 / User Guide

### 管理员如何设置订阅价格 / How Admins Set Subscription Prices

1. **登录管理员账号** / **Login as Admin**
2. **进入管理后台** / **Go to Admin Panel**
   - 点击顶部导航的"管理后台"
   - 或点击用户菜单的"管理后台"

3. **打开订阅管理** / **Open Subscription Management**
   - 点击"订阅管理"标签

4. **配置价格** / **Configure Prices**
   - **高级用户年费**: 设置新用户升级到高级用户的价格
   - **高级用户续费费用**: 设置现有高级用户续费的价格
   - **时长（天）**: 设置订阅有效期长度（默认365天）

5. **保存配置** / **Save Configuration**
   - 点击"更新价格"按钮
   - 系统会自动刷新显示新的配置

6. **查看支付历史** / **View Payment History**
   - 在同一页面下方可以看到所有用户的支付记录

---

## 🔍 技术细节 / Technical Details

### 数据流程 / Data Flow

#### 1. 管理员更新价格 / Admin Updates Price
```
Frontend Form → handleUpdateSubscriptionConfig() 
              → POST /api/admin/subscription/config/premium
              → UPDATE subscription_config SET renewal_price_usd = ?
              → Database Updated
              → Frontend Refreshed
```

#### 2. 用户查看设置 / User Views Settings
```
Frontend → GET /api/auth/settings
        → SELECT * FROM users WHERE id = ?
        → Return subscription_expires_at
        → Frontend Display Logic:
           - If role = 'user': Show 9999/12/31
           - If role = 'premium': Show actual date + days remaining
           - If role = 'admin': Hide section
```

#### 3. 数据库约束 / Database Constraints
```sql
-- 免费用户/管理员
subscription_expires_at = '9999-12-31 23:59:59'

-- 高级用户
subscription_expires_at = datetime(created_at, '+365 days')
-- OR
subscription_expires_at = datetime(last_renewal_date, '+365 days')
```

---

## 🐛 已知问题 / Known Issues

无已知问题 / No known issues.

---

## 📋 下一步计划 / Next Steps

1. **PayPal 支付集成** / **PayPal Payment Integration**
   - 使用`renewal_price_usd`进行续费支付
   - 区分升级支付和续费支付
   - 根据用户状态显示不同价格

2. **自动续费提醒** / **Auto-Renewal Reminders**
   - 在到期前7天提醒用户续费
   - 发送邮件通知

3. **价格历史记录** / **Price History**
   - 记录价格变更历史
   - 显示价格变动趋势

4. **优惠码系统** / **Coupon System**
   - 支持优惠码
   - 折扣价格计算

---

## 🎉 总结 / Summary

**Version 5.15.2** 成功完成了以下改进：

✅ **订阅管理优化**：
- 重命名价格字段为"高级用户年费"
- 新增"高级用户续费费用"配置
- 优化管理后台UI布局

✅ **数据库完善**：
- 添加 `renewal_price_usd` 字段
- 修复高级用户有效期数据
- 验证所有用户数据正确性

✅ **显示逻辑优化**：
- 免费用户显示永久有效期（9999/12/31）
- 高级用户显示实际有效期和剩余天数
- 管理员不显示用户级别管理

✅ **API 完善**：
- 更新订阅配置API支持续费价格
- 确保用户设置API返回正确数据

所有功能已测试并部署到生产环境！🎉
