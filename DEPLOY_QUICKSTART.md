# ⚡ 生产环境部署快速开始

最快速的部署方法（10分钟完成）

---

## 🎯 前提条件

- ✅ 拥有 Cloudflare 账号
- ✅ 拥有 GitHub 账号
- ✅ 项目代码已准备好

---

## 🚀 三种部署方式

### 方式 1: 使用 GenSpark 一键部署（最简单）⭐

**适合**: 新手，快速部署

1. **配置 Cloudflare API Token**:
   - 在 GenSpark 点击 **"Deploy"** 标签
   - 按照指引创建并保存 Cloudflare API Token

2. **配置 GitHub**:
   - 在 GenSpark 点击 **"#github"** 标签
   - 完成 GitHub 授权
   - 推送代码到 GitHub

3. **运行部署脚本**:
   ```bash
   cd /home/user/webapp
   ./deploy.sh
   ```

4. **配置环境变量**:
   ```bash
   npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name review-system
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name review-system
   npx wrangler pages secret put GOOGLE_API_KEY --project-name review-system
   npx wrangler pages secret put YOUTUBE_API_KEY --project-name review-system
   ```

5. **更新 Google OAuth**:
   - 访问: https://console.cloud.google.com/apis/credentials
   - 编辑 OAuth 客户端
   - 添加: `https://review-system.pages.dev`
   - 保存

**完成！** 🎉

---

### 方式 2: 使用 Cloudflare Dashboard（图形界面）

**适合**: 喜欢图形界面的用户

#### 步骤 1: 推送代码到 GitHub

```bash
cd /home/user/webapp
git remote add origin https://github.com/YOUR_USERNAME/review-system.git
git push -u origin main
```

#### 步骤 2: 在 Cloudflare Dashboard 创建项目

1. **访问**: https://dash.cloudflare.com/pages

2. **创建项目**:
   - 点击 **"Create a project"**
   - 选择 **"Connect to Git"**
   - 授权 GitHub
   - 选择仓库: `review-system`

3. **配置构建**:
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

4. **保存并部署**

#### 步骤 3: 配置环境变量

1. 在项目设置中找到 **"Environment variables"**
2. 添加以下变量（Production 环境）:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_API_KEY`
   - `YOUTUBE_API_KEY`

#### 步骤 4: 创建和绑定 D1 数据库

1. **创建数据库**:
   ```bash
   npx wrangler d1 create review-system-production
   ```

2. **在 Dashboard 绑定**:
   - 项目设置 → Functions → D1 database bindings
   - Variable name: `DB`
   - Database: `review-system-production`

3. **运行迁移**:
   ```bash
   npx wrangler d1 migrations apply review-system-production --remote
   ```

#### 步骤 5: 更新 Google OAuth

同方式 1 的步骤 5

**完成！** 🎉

---

### 方式 3: 纯命令行部署（最灵活）

**适合**: 高级用户，CI/CD 集成

#### 快速命令序列

```bash
# 1. 设置 Cloudflare Token
export CLOUDFLARE_API_TOKEN="your-token-here"

# 2. 验证登录
npx wrangler whoami

# 3. 创建 D1 数据库
npx wrangler d1 create review-system-production
# 复制 database_id 并更新 wrangler.json

# 4. 运行数据库迁移
npx wrangler d1 migrations apply review-system-production --remote

# 5. 构建项目
npm run build

# 6. 创建 Pages 项目
npx wrangler pages project create review-system \
  --production-branch main \
  --compatibility-date 2025-10-07

# 7. 部署
npx wrangler pages deploy dist --project-name review-system

# 8. 配置环境变量
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name review-system
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name review-system
npx wrangler pages secret put GOOGLE_API_KEY --project-name review-system
npx wrangler pages secret put YOUTUBE_API_KEY --project-name review-system

# 9. 绑定 D1 数据库（需要在 Dashboard 完成）
# 访问: https://dash.cloudflare.com/pages
# 项目设置 → Functions → D1 database bindings
# Variable: DB, Database: review-system-production

# 10. 重新部署使绑定生效
npx wrangler pages deploy dist --project-name review-system
```

#### 更新 Google OAuth

同方式 1 的步骤 5

**完成！** 🎉

---

## 📋 必需的环境变量

确保配置以下环境变量：

| Variable | Value | 来源 |
|----------|-------|------|
| `GOOGLE_CLIENT_ID` | `78785931273-pse627aasv4h50mcc1cschj5cvtqr88f...` | `.dev.vars` |
| `GOOGLE_CLIENT_SECRET` | `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` | `.dev.vars` |
| `GOOGLE_API_KEY` | `AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs` | `.dev.vars` |
| `YOUTUBE_API_KEY` | `AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs` | `.dev.vars` |

---

## 🔗 重要链接

- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **GitHub**: https://github.com
- **部署文档**: `/home/user/webapp/PRODUCTION_DEPLOYMENT_GUIDE.md`

---

## ✅ 部署后检查清单

- [ ] 访问生产 URL: `https://review-system.pages.dev`
- [ ] 测试页面加载
- [ ] 测试邮箱登录
- [ ] 测试 Google 登录
- [ ] 测试创建复盘
- [ ] 检查数据库连接
- [ ] 验证 API 功能

---

## 🚨 遇到问题？

### 常见问题快速解决

**Q: Wrangler 未授权**
```bash
npx wrangler login
# 或
export CLOUDFLARE_API_TOKEN="your-token"
```

**Q: Google OAuth 错误**
- 检查是否添加了生产 URL 到授权列表
- URL 格式: `https://review-system.pages.dev`（无斜杠）

**Q: 数据库连接失败**
- 确保 D1 已绑定到 Pages 项目
- 检查 wrangler.json 中的 database_id
- 确保迁移已运行

**Q: 环境变量未生效**
```bash
# 检查环境变量
npx wrangler pages secret list --project-name review-system

# 重新部署
npx wrangler pages deploy dist --project-name review-system
```

---

## 📚 详细文档

完整部署指南请查看:
```
/home/user/webapp/PRODUCTION_DEPLOYMENT_GUIDE.md
```

---

**快速开始完成！祝您部署顺利！** 🚀
