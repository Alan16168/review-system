# Cloudflare Pages URL说明 - Review System

## 📋 URL类型概览

Cloudflare Pages为每个项目提供多种类型的URL，了解它们的区别很重要。

---

## 🌐 URL类型详解

### 1. 生产环境主URL（Production）
```
https://review-system.pages.dev
```

**特点**:
- ✅ 指向 **main分支** 的最新部署
- ✅ 每次部署main分支会自动更新
- ✅ 这是推荐给用户访问的主要URL
- ⚠️ 可能有CDN缓存延迟（通常<5分钟）

**最新部署**:
- 部署ID: `3af64b9e-ecba-47d6-b560-054ba09b7a95`
- Git提交: `cbd8b45`
- 部署时间: 2025-11-20 22:15 UTC
- URL: https://3af64b9e.review-system.pages.dev

---

### 2. 测试环境别名URL（Preview）
```
https://test.review-system.pages.dev
```

**特点**:
- ✅ 指向 **test分支** 的最新部署
- ✅ 每次部署test分支会自动更新
- ✅ 用于测试新功能，不影响生产环境
- ✅ 现在已更新到最新代码 ✅

**最新部署**:
- 部署ID: `d78ad756-...`
- 部署时间: 2025-11-20 22:25 UTC
- URL: https://d78ad756.review-system.pages.dev

---

### 3. 部署ID URL（Deployment-specific）
```
https://3af64b9e.review-system.pages.dev  (main分支)
https://d78ad756.review-system.pages.dev  (test分支)
```

**特点**:
- ✅ 每次部署生成唯一的ID
- ✅ 永久指向该次部署的代码版本
- ✅ 不会被后续部署覆盖
- ✅ 适合：
  - 版本比对
  - 回滚测试
  - Bug复现
  - 分享特定版本

---

## 🎯 当前推荐使用

### 用户访问
**推荐**: `https://test.review-system.pages.dev` ✅
- 原因：这是您之前一直使用的测试环境
- 状态：已更新到最新代码
- 哈希：131402eafaec63218210142953e713b5

### 开发测试
**选择1**: `https://d78ad756.review-system.pages.dev`
- 优点：永久指向当前版本，不会变化
- 用途：测试、分享给他人、文档记录

**选择2**: `https://test.review-system.pages.dev`
- 优点：总是最新的test分支代码
- 用途：持续测试、自动更新

---

## 🔄 部署流程说明

### 部署到test分支（测试环境）
```bash
# 构建项目
npm run build

# 部署到test分支
npx wrangler pages deploy dist --project-name review-system --branch test

# 输出示例：
# ✨ Deployment complete! Take a peek over at https://d78ad756.review-system.pages.dev
# ✨ Deployment alias URL: https://test.review-system.pages.dev
```

### 部署到main分支（生产环境）
```bash
# 构建项目
npm run build

# 部署到main分支
npx wrangler pages deploy dist --project-name review-system --branch main

# 输出示例：
# ✨ Deployment complete! Take a peek over at https://3af64b9e.review-system.pages.dev
# 主URL: https://review-system.pages.dev (自动更新)
```

---

## 📊 URL对比表

| URL类型 | 示例 | 分支 | 是否固定 | 更新方式 | 推荐用途 |
|---------|------|------|----------|----------|----------|
| 生产主URL | review-system.pages.dev | main | ❌ 动态 | 自动 | 生产环境 |
| 测试别名 | test.review-system.pages.dev | test | ❌ 动态 | 自动 | 测试环境 |
| 部署ID | 3af64b9e.review-system.pages.dev | main | ✅ 固定 | 不变 | 版本锁定 |
| 部署ID | d78ad756.review-system.pages.dev | test | ✅ 固定 | 不变 | 测试快照 |

---

## 🔍 验证URL版本

### 方法1：检查文件哈希
```bash
# 检查test环境
curl -s https://test.review-system.pages.dev/static/app.js | md5sum
# 131402eafaec63218210142953e713b5 ✅

# 检查本地文件
md5sum /home/user/webapp/public/static/app.js
# 131402eafaec63218210142953e713b5 ✅

# 如果哈希值相同，说明版本一致
```

### 方法2：检查部署列表
```bash
# 查看test分支部署历史
npx wrangler pages deployment list --project-name review-system | grep test

# 查看main分支部署历史
npx wrangler pages deployment list --project-name review-system | grep main
```

---

## ⚠️ 常见问题

### Q1: 为什么test URL和新部署URL内容不同？
**A**: `test.review-system.pages.dev` 是test分支的别名，不是main分支。需要单独部署到test分支。

### Q2: 如何让test URL使用最新代码？
**A**: 执行：
```bash
npm run build
npx wrangler pages deploy dist --project-name review-system --branch test
```

### Q3: 生产环境URL为什么没更新？
**A**: 可能的原因：
1. CDN缓存（等待5-10分钟）
2. 部署的是test分支而不是main分支
3. 浏览器缓存（按Ctrl+Shift+R强制刷新）

### Q4: 如何回滚到之前的版本？
**A**: 使用部署ID URL，或者在Cloudflare Dashboard中回滚：
1. 访问：https://dash.cloudflare.com/pages/review-system
2. 找到想要的部署
3. 点击"Rollback"

---

## 🎯 最佳实践

### 开发流程
```
1. 本地开发 → npm run build
2. 部署到test分支测试 → npx wrangler pages deploy dist --branch test
3. 在 test.review-system.pages.dev 测试
4. 确认无误后，合并到main分支
5. 部署到main分支 → npx wrangler pages deploy dist --branch main
6. 生产环境自动更新
```

### 分支策略
- **main分支**: 生产环境代码，稳定版本
- **test分支**: 测试环境代码，新功能测试
- **feature分支**: 功能开发分支（可选）

### 版本记录
- 重要部署保存部署ID URL
- 在Git commit中记录部署URL
- 使用Git tag标记重要版本

---

## 📝 当前状态总结

### ✅ 已完成
- [x] test分支已更新到最新代码
- [x] test.review-system.pages.dev 指向最新版本
- [x] 部署ID: d78ad756 (test分支)
- [x] 文件哈希验证通过

### 📍 当前所有可用URL

**测试环境（推荐使用）**:
- 别名URL: https://test.review-system.pages.dev ✅
- 部署ID: https://d78ad756.review-system.pages.dev ✅

**生产环境（main分支）**:
- 主URL: https://review-system.pages.dev
- 部署ID: https://3af64b9e.review-system.pages.dev ✅

**状态**: 所有URL都已更新到最新代码 ✅

---

## 🔗 相关链接

- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages/review-system
- **部署历史**: https://dash.cloudflare.com/pages/review-system/deployments
- **GitHub仓库**: https://github.com/Alan16168/review-system
- **项目文档**: 
  - `HOTFIX_AI_BOOKS_2025-11-20.md`
  - `DEPLOYMENT_NAV_UPDATE_2025-11-20.md`
  - `NAVIGATION_MENU_UPDATE_2025-11-20.md`

---

**更新时间**: 2025-11-20 22:25 UTC  
**文档版本**: 1.0  
**状态**: ✅ 当前有效
