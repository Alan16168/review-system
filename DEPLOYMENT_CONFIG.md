# 部署配置说明

## 🌐 生产环境域名

**主域名**: https://review-system.pages.dev

以后所有部署都将自动使用主域名，不再使用随机的部署 ID URL。

## ⚙️ 配置更改

### 1. wrangler.jsonc

```jsonc
{
  "name": "review-system",  // 修改：从 "webapp" 改为 "review-system"
  "compatibility_date": "2025-10-07",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [...]
}
```

### 2. package.json

```json
{
  "scripts": {
    "deploy": "npm run build && wrangler pages deploy dist --project-name review-system --branch main",
    "deploy:prod": "npm run deploy"  // 修改：简化为调用 deploy
  }
}
```

## 🚀 部署命令

### 标准部署（推荐）
```bash
npm run deploy
```

这将：
1. 构建项目 (`npm run build`)
2. 部署到 `review-system` 项目
3. 使用 `main` 分支（生产分支）
4. 自动发布到 https://review-system.pages.dev

### 快捷命令
```bash
npm run deploy:prod  # 等同于 npm run deploy
```

## 📊 部署流程

```
1. 修改代码
   ↓
2. 提交到 Git
   ↓
3. npm run deploy
   ↓
4. 自动构建 + 部署
   ↓
5. 立即生效: https://review-system.pages.dev
```

## 🔧 Cloudflare Pages 项目信息

- **项目名称**: review-system
- **主域名**: review-system.pages.dev
- **生产分支**: main
- **Git Provider**: No（手动部署）
- **数据库**: review-system-production (D1)

## 📝 重要说明

### 分支策略
- **main** 分支 → 生产环境 (https://review-system.pages.dev)
- 所有部署都使用 `main` 分支
- 部署前确保代码已提交到 Git

### 部署 URL
- ✅ **主域名**: https://review-system.pages.dev（推荐使用）
- ❌ **临时 URL**: https://[hash].review-system.pages.dev（仅用于预览）

### 最佳实践
1. **部署前**：
   - 确保代码已测试
   - 提交所有更改到 Git
   - 运行 `npm run build` 验证构建

2. **部署时**：
   - 使用 `npm run deploy` 命令
   - 等待部署完成（约 10-15 秒）
   - 验证主域名可访问

3. **部署后**：
   - 测试主要功能
   - 检查控制台无错误
   - 清除浏览器缓存（如需要）

## 🐛 故障排除

### 问题：部署后看到旧版本
**解决方案**：
```bash
# 清除浏览器缓存
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# 或使用隐身模式
```

### 问题：构建失败
**解决方案**：
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### 问题：数据库错误
**解决方案**：
```bash
# 检查数据库连接
npx wrangler d1 execute review-system-production --remote --command="SELECT 1"

# 应用迁移（如需要）
npm run db:migrate:prod
```

## 📚 相关命令

### 开发环境
```bash
npm run dev:sandbox  # 本地开发服务器（端口 3000）
npm run build        # 构建项目
npm run preview      # 预览构建结果
```

### 数据库管理
```bash
npm run db:migrate:local   # 应用本地迁移
npm run db:migrate:prod    # 应用生产迁移
npm run db:reset           # 重置本地数据库
```

### 工具命令
```bash
npm run clean-port   # 清理端口 3000
npm run test         # 测试本地服务器
```

## 🔗 相关链接

- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **GitHub Repository**: https://github.com/Alan16168/review-system
- **Production URL**: https://review-system.pages.dev

## ✅ 配置验证清单

- [x] wrangler.jsonc 配置正确
- [x] package.json 部署命令更新
- [x] 主域名可访问
- [x] 生产分支设置为 main
- [x] Git 提交已推送
- [x] 文档已更新

---

**最后更新**: 2025-11-15  
**配置者**: AI Assistant  
**状态**: ✅ 配置完成
