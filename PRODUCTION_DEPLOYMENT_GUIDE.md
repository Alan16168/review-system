# 🚀 Cloudflare Pages 生产环境完整部署指南

从本地开发到生产环境的完整部署流程。

---

## 📊 部署概览

**当前状态**: ✅ 开发环境运行中  
**目标状态**: 🎯 生产环境部署完成  
**预计时间**: 30-45 分钟  

---

## 📋 部署前检查清单

### ✅ 已完成
- [x] 项目代码已开发完成（V3.4）
- [x] Git 仓库已初始化
- [x] 数据库迁移文件已创建（5个文件）
- [x] Google OAuth 本地配置完成
- [x] Google API Key 已配置
- [x] 本地测试通过

### 🔲 待完成（本指南将引导您完成）
- [ ] 推送代码到 GitHub
- [ ] 配置 Cloudflare API Token
- [ ] 创建 Cloudflare Pages 项目
- [ ] 创建生产环境 D1 数据库
- [ ] 配置生产环境变量
- [ ] 运行数据库迁移
- [ ] 更新 Google OAuth 授权域名
- [ ] 测试生产环境

---

## 🌐 第一步：推送代码到 GitHub

### 为什么需要 GitHub？
Cloudflare Pages 从 Git 仓库自动部署，推荐使用 GitHub。

### 操作步骤

#### A. 设置 GitHub 授权

1. **在 GenSpark 界面中**:
   - 点击左侧的 **"#github"** 标签
   - 完成 GitHub 授权流程
   - 授权成功后返回

2. **选择或创建仓库**:
   - 使用现有仓库（如果有）
   - 或创建新仓库: `review-system`

#### B. 推送代码

```bash
# 1. 检查当前状态
cd /home/user/webapp
git status

# 2. 确保所有更改已提交
git add -A
git commit -m "Ready for production deployment"

# 3. 添加 GitHub 远程仓库
# 替换 YOUR_USERNAME 为您的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/review-system.git

# 4. 推送到 GitHub
git push -u origin main
```

**提示**: 如果推送失败，可能需要使用 `-f` 强制推送（首次推送到新仓库）:
```bash
git push -f origin main
```

---

## 🔐 第二步：配置 Cloudflare API Token

### 方式 1: 使用 GenSpark Deploy Tab（最简单）

1. **在 GenSpark 界面中**:
   - 点击左侧的 **"Deploy"** 标签
   - 按照界面指引创建并保存 Cloudflare API Token

### 方式 2: 手动创建（如果方式1不可用）

#### 2.1 创建 API Token

1. **登录 Cloudflare Dashboard**:
   ```
   https://dash.cloudflare.com/profile/api-tokens
   ```

2. **创建新 Token**:
   - 点击 **"Create Token"**
   - 选择 **"Edit Cloudflare Workers"** 模板
   - 点击 **"Use template"**

3. **配置权限**（使用自定义模板时）:
   ```
   Permissions:
   - Account > Cloudflare Pages > Edit
   - Account > D1 > Edit
   - Account > Workers R2 Storage > Edit (可选)
   - Zone > DNS > Edit (可选，用于自定义域名)
   
   Account Resources:
   - Include > Your Account Name
   
   Zone Resources:
   - Include > All zones (或指定域名)
   ```

4. **创建并复制 Token**:
   - 点击 **"Continue to summary"**
   - 点击 **"Create Token"**
   - **⚠️ 立即复制 Token**（只显示一次！）
   - 格式: `v8ZG9m2qZfXxXxXxXxXxXxXxXxXxXxXxXxXx`

#### 2.2 配置 Token 到环境

```bash
# 设置环境变量
export CLOUDFLARE_API_TOKEN="your-api-token-here"

# 验证配置
npx wrangler whoami
```

**预期输出**:
```
Getting User settings...
👋 You are logged in with an API Token, associated with the email 'your-email@example.com'!
┌──────────────────────────┬──────────────────────────────────┐
│ Account Name             │ Account ID                        │
├──────────────────────────┼──────────────────────────────────┤
│ Your Account             │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │
└──────────────────────────┴──────────────────────────────────┘
```

---

## 🗄️ 第三步：创建生产环境 D1 数据库

### 3.1 创建 D1 数据库

```bash
cd /home/user/webapp

# 创建生产数据库
npx wrangler d1 create review-system-production

# 输出示例:
# ✅ Successfully created DB 'review-system-production'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "review-system-production"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**⚠️ 重要**: 复制输出中的 `database_id`！

### 3.2 更新 wrangler.json

编辑 `wrangler.json`，更新数据库配置:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "review-system",
  "compatibility_date": "2025-10-07",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "review-system-production",
      "database_id": "paste-your-database-id-here"
    }
  ]
}
```

### 3.3 运行数据库迁移

```bash
# 应用所有迁移到生产数据库
npx wrangler d1 migrations apply review-system-production --remote

# 确认应用
# 输入: yes
```

### 3.4 导入初始数据（可选）

```bash
# 如果需要初始管理员账号
npx wrangler d1 execute review-system-production --remote --file=./seed.sql
```

---

## 📦 第四步：构建项目

```bash
cd /home/user/webapp

# 构建生产版本
npm run build

# 验证构建输出
ls -la dist/
```

**预期输出**:
```
dist/
├── _worker.js      # 编译后的 Hono 应用
├── _routes.json    # 路由配置
└── static/         # 静态资源
    ├── app.js
    ├── i18n.js
    └── styles.css
```

---

## 🚀 第五步：部署到 Cloudflare Pages

### 5.1 创建 Pages 项目（首次部署）

```bash
cd /home/user/webapp

# 创建 Cloudflare Pages 项目
npx wrangler pages project create review-system \
  --production-branch main \
  --compatibility-date 2025-10-07
```

**项目名称建议**:
- `review-system` (推荐)
- `webapp-prod`
- 或任何符合规范的名称（小写字母、数字、连字符）

### 5.2 部署应用

```bash
# 部署到生产环境
npx wrangler pages deploy dist --project-name review-system

# 部署过程输出:
# ✨ Compiled Worker successfully
# 🌎 Uploading... (X files)
# ✨ Success! Uploaded X files (X.XX sec)
# 
# ✨ Deployment complete! Take a peek over at
#    https://xxxxxxxx.review-system.pages.dev
```

**⚠️ 保存部署 URL**: 
- 生产环境: `https://review-system.pages.dev`
- 预览环境: `https://xxxxxxxx.review-system.pages.dev`

---

## ⚙️ 第六步：配置环境变量

Cloudflare Pages 的环境变量需要通过 Dashboard 或 CLI 配置。

### 方式 1: 使用 Wrangler CLI（推荐）

```bash
# Google OAuth Client ID
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name review-system
# 输入: 78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps.googleusercontent.com

# Google OAuth Client Secret
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name review-system
# 输入: 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

# Google API Key
npx wrangler pages secret put GOOGLE_API_KEY --project-name review-system
# 输入: AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs

# YouTube API Key
npx wrangler pages secret put YOUTUBE_API_KEY --project-name review-system
# 输入: AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs

# 验证环境变量
npx wrangler pages secret list --project-name review-system
```

### 方式 2: 使用 Cloudflare Dashboard

1. **访问 Pages 项目**:
   ```
   https://dash.cloudflare.com/pages
   ```

2. **选择项目**: 点击 `review-system`

3. **进入设置**:
   - 点击 **"Settings"** 标签
   - 选择 **"Environment variables"**

4. **添加变量**:
   - 点击 **"Add variable"**
   - 选择环境: **Production**
   - 添加以下变量:

   | Variable Name | Value |
   |---------------|-------|
   | GOOGLE_CLIENT_ID | 78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps.googleusercontent.com |
   | GOOGLE_CLIENT_SECRET | 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 |
   | GOOGLE_API_KEY | AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs |
   | YOUTUBE_API_KEY | AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs |

5. **保存**: 点击 **"Save"**

---

## 🔄 第七步：绑定 D1 数据库到 Pages

### 通过 Cloudflare Dashboard

1. **访问 Pages 项目设置**:
   ```
   https://dash.cloudflare.com/pages
   ```

2. **选择项目**: `review-system`

3. **进入设置**:
   - 点击 **"Settings"** 标签
   - 选择 **"Functions"**
   - 向下滚动到 **"D1 database bindings"**

4. **添加绑定**:
   - 点击 **"Add binding"**
   - Variable name: `DB`
   - D1 database: 选择 `review-system-production`
   - 点击 **"Save"**

5. **重新部署**:
   ```bash
   npx wrangler pages deploy dist --project-name review-system
   ```

---

## 🌍 第八步：更新 Google OAuth 配置

现在您有了生产环境 URL，需要添加到 Google Cloud Console。

### 8.1 获取生产 URL

您的生产 URL 应该是:
```
https://review-system.pages.dev
```

### 8.2 更新 Google Cloud Console

1. **访问凭据页面**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **编辑 OAuth 客户端** (`reviewsystem`):

3. **添加生产 URL 到 Authorized JavaScript origins**:
   ```
   https://review-system.pages.dev
   ```

4. **添加到 Authorized redirect URIs**:
   ```
   https://review-system.pages.dev
   https://review-system.pages.dev/
   ```

5. **保存配置**

### 8.3 更新 OAuth Consent Screen

1. **访问 OAuth consent screen**:
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **编辑应用信息**:
   - 在 **"App domain"** 部分
   - Application home page: `https://review-system.pages.dev`
   - Application privacy policy link: `https://review-system.pages.dev/privacy`
   - Application terms of service link: `https://review-system.pages.dev/terms`

3. **添加到 Authorized domains**:
   - 点击 **"Add domain"**
   - 输入: `pages.dev`
   - 保存

---

## ✅ 第九步：测试生产环境

### 9.1 访问生产环境

```
https://review-system.pages.dev
```

### 9.2 测试功能清单

- [ ] 页面正常加载
- [ ] 静态资源加载（样式、图标、脚本）
- [ ] 邮箱登录功能
- [ ] Google 账号登录
- [ ] 创建复盘记录
- [ ] 查看文章和视频
- [ ] 语言切换
- [ ] 管理员功能（如果适用）

### 9.3 测试邮箱登录

```bash
# 使用 curl 测试 API
curl -X POST https://review-system.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@review.com","password":"admin123"}'
```

### 9.4 检查数据库

```bash
# 查询生产数据库
npx wrangler d1 execute review-system-production --remote \
  --command="SELECT COUNT(*) as user_count FROM users"
```

---

## 🔧 第十步：持续部署配置

### 设置自动部署（推荐）

Cloudflare Pages 支持从 GitHub 自动部署。

1. **连接 GitHub 仓库**:
   - 访问: https://dash.cloudflare.com/pages
   - 点击 **"Create a project"**
   - 选择 **"Connect to Git"**
   - 授权 GitHub
   - 选择仓库: `review-system`

2. **配置构建设置**:
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

3. **配置环境变量**: 同第六步

4. **保存并部署**

**之后每次推送到 main 分支，自动触发部署！** 🎉

---

## 📊 第十一步：监控和维护

### 查看部署历史

```bash
# 列出所有部署
npx wrangler pages deployment list --project-name review-system
```

### 查看日志

1. **访问 Cloudflare Dashboard**:
   ```
   https://dash.cloudflare.com/pages
   ```

2. **选择项目** → **"Deployments"** → **"View logs"**

### 回滚部署

```bash
# 列出部署
npx wrangler pages deployment list --project-name review-system

# 回滚到特定部署
npx wrangler pages deployment tail --project-name review-system --deployment-id <id>
```

---

## 🎯 部署完成检查清单

### ✅ 基础设施
- [ ] GitHub 仓库已创建并推送代码
- [ ] Cloudflare API Token 已配置
- [ ] Cloudflare Pages 项目已创建
- [ ] D1 数据库已创建并绑定
- [ ] 数据库迁移已运行

### ✅ 配置
- [ ] 环境变量已设置
- [ ] Google OAuth 已更新授权域名
- [ ] wrangler.json 已更新数据库 ID

### ✅ 测试
- [ ] 生产环境可访问
- [ ] 邮箱登录正常
- [ ] Google 登录正常
- [ ] 数据库读写正常
- [ ] API 端点正常

### ✅ 文档
- [ ] README 已更新生产 URL
- [ ] 部署文档已保存
- [ ] 团队成员已通知

---

## 🚨 常见问题排查

### 问题 1: Wrangler 未授权

**错误**: `Error: Not authenticated`

**解决**:
```bash
# 重新登录
npx wrangler login

# 或设置 API Token
export CLOUDFLARE_API_TOKEN="your-token"
```

### 问题 2: D1 数据库未绑定

**错误**: `DB is not defined`

**解决**:
1. 检查 wrangler.json 配置
2. 在 Cloudflare Dashboard 绑定数据库
3. 重新部署

### 问题 3: 环境变量未生效

**错误**: `GOOGLE_CLIENT_ID is undefined`

**解决**:
```bash
# 检查环境变量
npx wrangler pages secret list --project-name review-system

# 重新设置
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name review-system
```

### 问题 4: Google OAuth 错误

**错误**: `redirect_uri_mismatch`

**解决**:
1. 检查 Google Cloud Console 授权域名
2. 确保添加了生产 URL
3. 检查 URL 拼写是否正确

### 问题 5: 数据库查询失败

**错误**: `D1_ERROR: no such table`

**解决**:
```bash
# 重新运行迁移
npx wrangler d1 migrations apply review-system-production --remote
```

---

## 📚 有用的命令

```bash
# 查看项目信息
npx wrangler pages project list

# 查看部署列表
npx wrangler pages deployment list --project-name review-system

# 查看实时日志
npx wrangler pages deployment tail --project-name review-system

# 删除项目（谨慎使用！）
npx wrangler pages project delete review-system

# 数据库命令
npx wrangler d1 list
npx wrangler d1 info review-system-production
npx wrangler d1 execute review-system-production --remote --command="SELECT * FROM users"

# 环境变量
npx wrangler pages secret list --project-name review-system
npx wrangler pages secret delete VARIABLE_NAME --project-name review-system
```

---

## 🎉 恭喜！部署完成！

您的应用现在已经部署到生产环境：

**生产 URL**: `https://review-system.pages.dev`

### 下一步建议

1. **自定义域名**（可选）:
   - 在 Cloudflare Pages 设置中添加自定义域名
   - 更新 DNS 记录
   - 更新 Google OAuth 配置

2. **性能优化**:
   - 启用 Cloudflare CDN
   - 配置缓存策略
   - 优化图片和资源

3. **安全加固**:
   - 启用 WAF（Web Application Firewall）
   - 配置 Rate Limiting
   - 定期更新依赖

4. **监控和分析**:
   - 配置 Cloudflare Analytics
   - 设置错误通知
   - 监控性能指标

---

**部署指南完成！** 🚀

如有问题，请参考 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
