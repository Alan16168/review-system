# 系统复盘平台 (Review System Platform)

一个帮助个人和团队进行深度复盘的全栈 Web 应用系统，支持中英双语。

## 🌟 项目概述

### 项目名称
**系统复盘平台** - Review System Platform

### 项目目标
- 帮助用户建立系统化的复盘习惯
- 通过"复盘灵魂9问"框架进行深度反思
- 支持个人复盘和团队协作复盘
- 提供完整的用户权限管理系统

### 核心功能
1. ✅ **用户认证系统**
   - 用户注册和登录
   - 基于 JWT 的身份认证
   - 角色权限管理（管理员/高级用户/普通用户）

2. ✅ **复盘记录管理**
   - 创建、编辑、删除复盘记录
   - 复盘灵魂9问框架
   - 个人复盘和团队复盘
   - 复盘状态管理（草稿/已完成）

3. ✅ **团队协作功能**（高级用户专属）
   - 创建和管理团队
   - 团队成员管理
   - 共享复盘记录
   - 协作编辑权限控制

4. ✅ **管理后台**（管理员专属）
   - 用户管理
   - 角色权限调整
   - 系统统计数据

5. ✅ **国际化支持**
   - 中英双语切换
   - 本地化存储用户语言偏好

## 🔗 访问链接

### 开发环境
- **应用 URL**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev

### 测试账号
| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 管理员 | admin@review.com | admin123 | 全部功能 + 后台管理 |
| 高级用户 | premium@review.com | premium123 | 个人复盘 + 团队功能 |
| 普通用户 | user@review.com | user123 | 仅个人复盘 |

## 📊 数据架构

### 数据模型

#### 1. Users（用户表）
```sql
- id: 用户ID
- email: 邮箱（唯一）
- password_hash: 密码哈希
- username: 用户名
- role: 角色（admin/premium/user）
- language: 语言偏好（zh/en）
- created_at: 创建时间
- updated_at: 更新时间
```

#### 2. Reviews（复盘记录表）
```sql
- id: 复盘ID
- title: 复盘主题
- user_id: 创建者ID
- team_id: 团队ID（可选）
- question1-9: 复盘灵魂9问的答案
- status: 状态（draft/completed）
- created_at: 创建时间
- updated_at: 更新时间
```

#### 3. Teams（团队表）
```sql
- id: 团队ID
- name: 团队名称
- description: 团队描述
- owner_id: 拥有者ID
- created_at: 创建时间
- updated_at: 更新时间
```

#### 4. Team Members（团队成员表）
```sql
- id: 记录ID
- team_id: 团队ID
- user_id: 用户ID
- joined_at: 加入时间
```

#### 5. Review Collaborators（复盘协作者表）
```sql
- id: 记录ID
- review_id: 复盘ID
- user_id: 用户ID
- can_edit: 编辑权限（1/0）
- added_at: 添加时间
```

### 存储服务
- **Cloudflare D1 Database**: SQLite 全球分布式数据库
- **本地开发**: 使用 wrangler --local 模式的本地 SQLite

## 🎯 复盘灵魂9问

这是系统的核心框架，帮助用户进行深度复盘：

1. **我的目标是什么？** - 明确初始目标
2. **目标达成了吗？** - 评估完成情况
3. **哪些地方做得不错？** - 总结成功经验
4. **做的好的能否复制？** - 提炼可复制的方法
5. **哪些地方出了问题？** - 识别问题点
6. **出问题的原因是什么？** - 深度分析原因
7. **下次怎么避免与优化？** - 制定改进措施
8. **我学到了什么底层规律？** - 提炼底层逻辑
9. **如果重新来一次，我们应该如何做？** - 完整方案重构

## 🚀 技术栈

### 后端
- **Hono Framework**: 轻量级 Web 框架
- **Cloudflare Workers**: Edge 运行时
- **Cloudflare D1**: 分布式 SQLite 数据库
- **JWT**: 身份认证
- **bcryptjs**: 密码加密

### 前端
- **原生 JavaScript**: 无框架依赖
- **Tailwind CSS**: 样式框架（CDN）
- **Font Awesome**: 图标库（CDN）
- **Axios**: HTTP 客户端（CDN）

### 开发工具
- **Wrangler**: Cloudflare 开发工具
- **Vite**: 构建工具
- **PM2**: 进程管理
- **TypeScript**: 类型检查

## 📁 项目结构

```
webapp/
├── src/
│   ├── index.tsx              # 主应用入口
│   ├── routes/                # API 路由
│   │   ├── auth.ts           # 认证路由（注册/登录）
│   │   ├── reviews.ts        # 复盘记录路由
│   │   ├── teams.ts          # 团队管理路由
│   │   └── admin.ts          # 管理后台路由
│   ├── middleware/            # 中间件
│   │   └── auth.ts           # 认证中间件
│   └── utils/                 # 工具函数
│       ├── auth.ts           # 认证工具
│       └── db.ts             # 数据库工具
├── public/static/             # 静态文件
│   ├── app.js                # 前端应用逻辑
│   └── i18n.js               # 国际化配置
├── migrations/                # 数据库迁移
│   └── 0001_initial_schema.sql
├── seed.sql                   # 种子数据
├── init-db.cjs               # 数据库初始化脚本
├── ecosystem.config.cjs      # PM2 配置
├── wrangler.json             # Cloudflare 配置
├── package.json              # 依赖配置
└── README.md                 # 本文档
```

## 🛠️ API 接口

### 认证相关

#### POST /api/auth/register
注册新用户
```json
Request: {
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名"
}
Response: {
  "token": "jwt_token",
  "user": { "id", "email", "username", "role", "language" }
}
```

#### POST /api/auth/login
用户登录
```json
Request: {
  "email": "user@example.com",
  "password": "password123"
}
Response: {
  "token": "jwt_token",
  "user": { "id", "email", "username", "role", "language" }
}
```

### 复盘记录相关

#### GET /api/reviews
获取用户可访问的所有复盘记录
```
Headers: Authorization: Bearer {token}
Response: {
  "reviews": [...]
}
```

#### GET /api/reviews/:id
获取单个复盘记录详情
```
Headers: Authorization: Bearer {token}
Response: {
  "review": {...},
  "collaborators": [...]
}
```

#### POST /api/reviews
创建新复盘记录
```json
Headers: Authorization: Bearer {token}
Request: {
  "title": "复盘主题",
  "team_id": 1,  // 可选，团队复盘时提供
  "question1": "目标是...",
  "question2": "达成情况...",
  // ... question3-9
  "status": "draft"
}
Response: {
  "id": 1,
  "message": "Review created successfully"
}
```

#### PUT /api/reviews/:id
更新复盘记录
```json
Headers: Authorization: Bearer {token}
Request: {
  "title": "新标题",
  "question1": "更新的答案",
  "status": "completed"
}
Response: {
  "message": "Review updated successfully"
}
```

#### DELETE /api/reviews/:id
删除复盘记录（仅创建者）
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "Review deleted successfully"
}
```

#### POST /api/reviews/:id/collaborators
添加协作者（仅创建者）
```json
Headers: Authorization: Bearer {token}
Request: {
  "user_id": 2,
  "can_edit": true
}
Response: {
  "message": "Collaborator added successfully"
}
```

### 团队管理相关（需要 Premium/Admin 权限）

#### GET /api/teams
获取用户加入的所有团队
```
Headers: Authorization: Bearer {token}
Response: {
  "teams": [...]
}
```

#### GET /api/teams/:id
获取团队详情和成员列表
```
Headers: Authorization: Bearer {token}
Response: {
  "team": {...},
  "members": [...]
}
```

#### POST /api/teams
创建新团队
```json
Headers: Authorization: Bearer {token}
Request: {
  "name": "团队名称",
  "description": "团队描述"
}
Response: {
  "id": 1,
  "message": "Team created successfully"
}
```

#### PUT /api/teams/:id
更新团队信息（仅拥有者）
```json
Headers: Authorization: Bearer {token}
Request: {
  "name": "新名称",
  "description": "新描述"
}
Response: {
  "message": "Team updated successfully"
}
```

#### DELETE /api/teams/:id
删除团队（仅拥有者）
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "Team deleted successfully"
}
```

#### POST /api/teams/:id/members
添加团队成员（仅拥有者）
```json
Headers: Authorization: Bearer {token}
Request: {
  "user_id": 3
}
Response: {
  "message": "Member added successfully"
}
```

#### DELETE /api/teams/:id/members/:userId
移除团队成员（仅拥有者）
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "Member removed successfully"
}
```

### 管理后台相关（需要 Admin 权限）

#### GET /api/admin/users
获取所有用户列表
```
Headers: Authorization: Bearer {token}
Response: {
  "users": [...]
}
```

#### PUT /api/admin/users/:id/role
修改用户角色
```json
Headers: Authorization: Bearer {token}
Request: {
  "role": "premium"  // user/premium/admin
}
Response: {
  "message": "User role updated successfully"
}
```

#### DELETE /api/admin/users/:id
删除用户
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "User deleted successfully"
}
```

#### GET /api/admin/stats
获取系统统计数据
```
Headers: Authorization: Bearer {token}
Response: {
  "total_users": 10,
  "total_reviews": 25,
  "total_teams": 5,
  "users_by_role": [...]
}
```

## 💻 本地开发

### 安装依赖
```bash
npm install
```

### 初始化数据库
```bash
node init-db.cjs
```

### 启动开发服务器
```bash
# 构建项目
npm run build

# 启动 PM2
pm2 start ecosystem.config.cjs

# 查看日志
pm2 logs review-system --nostream
```

### 测试 API
```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@review.com","password":"admin123"}'

# 获取复盘列表
curl -X GET http://localhost:3000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 使用指南

### 1. 注册和登录
- 访问应用主页
- 点击"注册"创建账号，或使用测试账号登录
- 系统支持中英文切换

### 2. 创建个人复盘
- 登录后点击"创建复盘"
- 填写复盘主题
- 选择"个人复盘"
- 回答9个核心问题
- 保存为草稿或标记为完成

### 3. 团队复盘（高级用户）
- 创建或加入团队
- 在团队中创建复盘记录
- 团队成员可以共同编辑
- 添加协作者并设置编辑权限

### 4. 管理后台（管理员）
- 访问管理后台
- 查看所有用户和统计数据
- 调整用户角色权限
- 管理系统资源

## 🚀 部署

### Cloudflare Pages 部署

1. 设置 Cloudflare API Token
```bash
# 调用 setup_cloudflare_api_key 工具
```

2. 创建生产数据库
```bash
npx wrangler d1 create review-system-production
# 将返回的 database_id 更新到 wrangler.json
```

3. 应用数据库迁移
```bash
npm run db:migrate:prod
```

4. 创建 Pages 项目
```bash
npx wrangler pages project create review-system \
  --production-branch main
```

5. 部署到生产环境
```bash
npm run deploy:prod
```

6. 设置环境变量（如需要）
```bash
npx wrangler pages secret put JWT_SECRET --project-name review-system
```

## 🔄 当前完成功能

✅ 用户认证系统（注册、登录、JWT）
✅ 角色权限管理（管理员/高级用户/普通用户）
✅ 个人复盘记录 CRUD
✅ 团队创建和管理
✅ 团队复盘协作
✅ 复盘协作者管理
✅ 管理后台（用户管理、统计数据）
✅ 中英双语支持
✅ 前端界面（登录、仪表板、列表展示）
✅ API 接口完整实现
✅ 数据库设计和迁移

## 🔜 推荐下一步开发

### 前端增强
1. 完善复盘详情页面
   - 显示完整的9问回答
   - 编辑表单界面
   - 协作者管理界面

2. 团队管理页面
   - 团队列表展示
   - 成员管理界面
   - 团队复盘筛选

3. 管理后台界面
   - 用户管理表格
   - 统计数据可视化
   - 角色权限修改界面

### 功能扩展
4. 复盘模板功能
   - 预设复盘模板
   - 自定义问题集
   - 模板分享

5. 数据导出
   - PDF 导出复盘记录
   - Excel 批量导出
   - 数据分析报告

6. 通知系统
   - 团队协作通知
   - 复盘提醒
   - 邮件通知

7. 搜索和筛选
   - 全文搜索
   - 标签系统
   - 高级筛选

### 优化改进
8. 性能优化
   - 分页加载
   - 缓存策略
   - 图片优化

9. 安全增强
   - 密码强度要求
   - 登录失败限制
   - CSRF 保护

10. 用户体验
    - 加载动画
    - 错误提示优化
    - 响应式设计完善

## 📄 部署状态

- **平台**: Cloudflare Pages (待部署)
- **状态**: ✅ 开发环境运行中
- **技术栈**: Hono + TypeScript + Cloudflare D1
- **最后更新**: 2025-10-07

## 📝 许可证

MIT License

---

**开发者**: Claude AI Assistant
**创建日期**: 2025-10-07
**版本**: 1.0.0
