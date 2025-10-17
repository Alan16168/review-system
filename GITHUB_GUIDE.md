# GitHub 仓库使用指南

## 📦 仓库信息

- **仓库名称**: review-system
- **GitHub URL**: https://github.com/Alan16168/review-system
- **所有者**: Alan16168
- **可见性**: 公开仓库（Public）
- **主分支**: main

## 🚀 快速开始

### 克隆仓库
```bash
# HTTPS 克隆
git clone https://github.com/Alan16168/review-system.git
cd review-system

# 或使用 SSH（需要配置 SSH key）
git clone git@github.com:Alan16168/review-system.git
cd review-system
```

### 安装依赖
```bash
npm install
```

### 本地开发
```bash
# 构建项目
npm run build

# 启动开发服务器
npm run dev:sandbox

# 或使用 PM2
pm2 start ecosystem.config.cjs
```

### 访问应用
- **本地开发**: http://localhost:3000
- **生产环境**: https://review-system.pages.dev

## 🔧 Git 工作流程

### 1. 日常开发流程
```bash
# 1. 确保在最新代码上工作
git pull origin main

# 2. 创建新分支进行开发
git checkout -b feature/your-feature-name

# 3. 进行代码修改并提交
git add .
git commit -m "feat: add new feature"

# 4. 推送到远程分支
git push origin feature/your-feature-name

# 5. 在 GitHub 上创建 Pull Request
```

### 2. 提交规范
使用语义化提交消息：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

**示例**:
```bash
git commit -m "feat: add user profile page"
git commit -m "fix: resolve login authentication issue"
git commit -m "docs: update README with deployment guide"
```

### 3. 保持仓库同步
```bash
# 拉取最新代码
git pull origin main

# 如果有冲突，解决后提交
git add .
git commit -m "merge: resolve conflicts"
git push origin main
```

## 🌿 分支管理

### 主要分支
- **main**: 生产分支，始终保持稳定可部署状态
- **develop**: 开发分支（如需要可创建）

### 功能分支
- **feature/功能名**: 新功能开发
- **fix/bug名**: Bug修复
- **hotfix/紧急修复名**: 生产环境紧急修复

### 分支操作
```bash
# 查看所有分支
git branch -a

# 创建并切换到新分支
git checkout -b feature/new-feature

# 切换分支
git checkout main

# 删除本地分支
git branch -d feature/old-feature

# 删除远程分支
git push origin --delete feature/old-feature
```

## 📝 Pull Request 流程

### 1. 创建 Pull Request
1. 推送你的分支到 GitHub
2. 访问 https://github.com/Alan16168/review-system
3. 点击 "Pull requests" → "New pull request"
4. 选择你的分支
5. 填写 PR 标题和描述
6. 点击 "Create pull request"

### 2. PR 描述模板
```markdown
## 变更内容
简要描述本次PR的主要变更

## 变更类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化

## 测试情况
- [ ] 已在本地测试
- [ ] 已在开发环境测试
- [ ] 已添加单元测试

## 相关Issue
关联的 Issue: #issue_number

## 截图（如果适用）
添加截图说明变更效果
```

### 3. 代码审查
- 等待团队成员审查
- 根据反馈修改代码
- 审查通过后合并到主分支

## 🔐 敏感信息管理

### .gitignore 文件
已配置忽略以下敏感文件：
- `node_modules/` - 依赖包
- `.env` - 环境变量
- `.dev.vars` - Cloudflare 开发变量
- `.wrangler/` - Cloudflare 构建缓存
- `*.log` - 日志文件

### 环境变量
**永远不要提交包含敏感信息的文件！**

正确做法：
1. 使用 `.env.example` 或 `.dev.vars.example` 作为模板
2. 将实际的 API key 配置在本地的 `.env` 或 `.dev.vars`
3. 生产环境使用 Cloudflare Pages 环境变量

## 🚀 部署到 Cloudflare Pages

### 自动部署（推荐）
1. 连接 GitHub 仓库到 Cloudflare Pages
2. 每次推送到 main 分支自动触发部署
3. 访问 https://dash.cloudflare.com/pages

### 手动部署
```bash
# 1. 构建项目
npm run build

# 2. 使用 wrangler 部署
npx wrangler pages deploy dist --project-name review-system
```

## 📊 项目统计

查看项目统计信息：
- **提交历史**: https://github.com/Alan16168/review-system/commits/main
- **贡献者**: https://github.com/Alan16168/review-system/graphs/contributors
- **代码频率**: https://github.com/Alan16168/review-system/graphs/code-frequency
- **流量分析**: https://github.com/Alan16168/review-system/graphs/traffic

## 🤝 贡献指南

### 如何贡献
1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 遵循现有代码风格
- 添加必要的注释
- 更新相关文档
- 确保所有测试通过

## 🔗 相关链接

- **GitHub 仓库**: https://github.com/Alan16168/review-system
- **生产环境**: https://review-system.pages.dev
- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages/view/review-system
- **问题追踪**: https://github.com/Alan16168/review-system/issues
- **Pull Requests**: https://github.com/Alan16168/review-system/pulls

## 📞 获取帮助

### 遇到问题？
1. **查看文档**: 阅读 README.md 和项目文档
2. **搜索 Issues**: 在 GitHub Issues 中搜索类似问题
3. **创建 Issue**: 如果找不到解决方案，创建新的 Issue
4. **联系维护者**: 通过 GitHub 联系项目维护者

### 常见问题

**Q: 如何更新我的 fork？**
```bash
# 添加上游仓库
git remote add upstream https://github.com/Alan16168/review-system.git

# 获取上游更新
git fetch upstream

# 合并到你的分支
git merge upstream/main
```

**Q: 如何撤销提交？**
```bash
# 撤销最后一次提交但保留更改
git reset --soft HEAD~1

# 撤销最后一次提交并丢弃更改
git reset --hard HEAD~1
```

**Q: 如何查看文件修改历史？**
```bash
# 查看文件提交历史
git log --follow filename

# 查看文件详细修改
git log -p filename
```

## 📄 许可证

本项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

**维护者**: Alan16168  
**更新日期**: 2025-10-17  
**版本**: V5.10.2
