# 贡献指南 (Contributing Guide)

感谢你考虑为系统复盘平台做出贡献！我们欢迎所有形式的贡献，包括但不限于：

## 🤝 如何贡献

### 报告 Bug
如果你发现了 Bug，请：
1. 在 [Issues](https://github.com/Alan16168/review-system/issues) 中搜索是否已有相关报告
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题和描述
   - 重现步骤
   - 期望行为 vs 实际行为
   - 截图（如果适用）
   - 环境信息（浏览器、操作系统等）

### 提出新功能
有好的想法？欢迎提出！
1. 创建 Feature Request Issue
2. 详细描述功能的用途和价值
3. 如果可能，提供使用场景
4. 等待社区讨论和反馈

### 提交代码

#### 1. Fork 和 Clone
```bash
# Fork 仓库（在 GitHub 网页上点击 Fork）

# Clone 你的 fork
git clone https://github.com/YOUR_USERNAME/review-system.git
cd review-system

# 添加上游仓库
git remote add upstream https://github.com/Alan16168/review-system.git
```

#### 2. 创建分支
```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/bug-description
```

#### 3. 开发规范

**代码风格**:
- 使用 2 空格缩进
- 使用有意义的变量名
- 添加必要的注释
- 保持代码简洁清晰

**提交规范**:
```bash
# 提交消息格式
<type>: <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```bash
feat: add user profile avatar upload

Add functionality for users to upload and update their profile avatars.
- Integrate with Cloudflare R2 for image storage
- Add image validation and compression
- Update user settings UI

Closes #123
```

#### 4. 编写测试
- 为新功能添加测试
- 确保现有测试通过
- 测试覆盖边界情况

#### 5. 更新文档
- 更新 README.md（如果适用）
- 添加必要的代码注释
- 更新 API 文档（如果修改了 API）

#### 6. 提交 Pull Request

**PR 标题**:
```
<type>: <short description>
```

**PR 描述模板**:
```markdown
## 变更描述
简要描述本次 PR 的主要变更内容

## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 其他 (请说明)

## 测试情况
- [ ] 已在本地测试
- [ ] 已添加单元测试
- [ ] 所有测试通过

## 相关 Issue
关联的 Issue: #issue_number

## 截图/演示
（如果适用，添加截图或 GIF 演示）

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 没有遗留的 console.log
- [ ] 已测试在不同浏览器的兼容性
```

#### 7. 代码审查
- 等待维护者审查你的代码
- 及时回应审查意见
- 根据反馈修改代码
- 保持耐心和友好的态度

## 📋 开发环境设置

### 前置要求
- Node.js 18+ 
- npm 或 yarn
- Git

### 本地开发
```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 填入必要的配置

# 3. 初始化数据库
npm run db:migrate:local

# 4. 构建项目
npm run build

# 5. 启动开发服务器
npm run dev:sandbox
# 或使用 PM2
pm2 start ecosystem.config.cjs

# 6. 访问应用
# http://localhost:3000
```

### 数据库操作
```bash
# 应用迁移
npm run db:migrate:local

# 重置数据库
npm run db:reset

# 执行 SQL
npm run db:console:local
```

## 🎨 项目架构

### 目录结构
```
webapp/
├── src/                    # 后端代码
│   ├── index.tsx          # 应用入口
│   ├── routes/            # API 路由
│   ├── middleware/        # 中间件
│   └── utils/             # 工具函数
├── public/static/         # 前端代码
│   ├── app.js            # 主应用逻辑
│   └── i18n.js           # 国际化
├── migrations/            # 数据库迁移
└── README.md             # 项目文档
```

### 技术栈
- **后端**: Hono + TypeScript + Cloudflare Workers
- **前端**: 原生 JavaScript + Tailwind CSS
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages

## 🚫 不要做的事

1. ❌ 直接推送到 main 分支
2. ❌ 提交包含敏感信息的代码（API keys、密码等）
3. ❌ 提交大文件或二进制文件
4. ❌ 忽略测试失败
5. ❌ 不遵循代码规范
6. ❌ 不更新相关文档

## ✅ 最佳实践

1. ✅ 保持提交小而专注
2. ✅ 编写清晰的提交消息
3. ✅ 添加充足的测试
4. ✅ 保持代码整洁
5. ✅ 及时更新文档
6. ✅ 尊重其他贡献者

## 🎯 优先级建议

### 高优先级
- Bug 修复
- 安全问题
- 性能优化
- 文档完善

### 中优先级
- 新功能开发
- 代码重构
- 测试覆盖

### 低优先级
- 代码风格调整
- 小的 UI 改进

## 📞 需要帮助？

- 📖 查看 [README.md](README.md)
- 💬 在 [Issues](https://github.com/Alan16168/review-system/issues) 中提问
- 📧 联系维护者: alan16168@example.com

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

---

**记住**: 每一个贡献，无论大小，都很重要！我们期待你的参与！ 🚀
