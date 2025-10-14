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
1. ✅ **营销主页（新增 V3）**
   - 精美的落地页设计
   - 学习资源库（10篇精选文章 + 10个视频教程）
   - 公司介绍和团队展示
   - 用户评价和社交媒体链接
   - 联系方式和服务条款
   - 完整的SEO优化结构

2. ✅ **用户认证系统**
   - **Google账号一键登录/注册（V3.3 完成配置 - V3.4）**
   - 传统邮箱密码注册和登录（V3.4 数据库修复）
   - 基于 JWT 的身份认证
   - 角色权限管理（管理员/高级用户/普通用户）

3. ✅ **复盘记录管理**
   - 创建、编辑、删除复盘记录
   - **模板系统（V4.0-V4.1.1）**：
     - 默认模板"灵魂9问"（10个问题）
     - "个人年复盘"模板（53个深度问题）
     - 两步创建流程（基本信息 → 填写问题）
     - **完整中英双语支持（V4.1.1）**
   - **复盘分类系统**：
     - 群体类型：个人/项目/团队
     - 时间类型：日/周/月/季/年复盘
   - 个人复盘和团队复盘
   - 复盘状态管理（草稿/已完成）
   - 复盘列表展示（带筛选和搜索）
   - 复盘详情查看
   - 协作者管理

4. ✅ **团队协作功能**（高级用户专属）
   - 创建和管理团队
   - **通过邮箱邀请成员（新增）**
   - 团队成员管理
   - 共享复盘记录
   - 协作编辑权限控制
   - **团队申请系统（V4.2 新增）**：
     - 公开/私有团队设置
     - 用户可申请加入公开团队
     - 团队创建者审批申请（确认/拒绝）
     - 三个Tab界面：我的团队、公开团队、待审批
     - 实时显示待审批申请数量
   - **团队协作复盘（V3.9）**：
     - 每个问题显示所有成员的答案（并列显示）
     - 成员独立编辑自己的答案
     - 创建者可删除其他成员的答案
     - 显示成员完成进度（X/9题）
     - 支持手动刷新查看最新答案

5. ✅ **管理后台**（管理员专属）
   - 用户管理（增删查改）
   - 角色权限调整
   - **增强通知系统（新增）**：
     - 群发通知给所有用户
     - 通过邮箱地址发送通知
     - 通过复选框选择用户发送
   - 系统统计数据

6. ✅ **国际化支持**
   - 中英双语切换
   - 本地化存储用户语言偏好
   - **模板内容国际化（V4.1.1）**：模板名称、描述、问题全部支持中英双语

## 🔗 访问链接

### 生产环境 ✅
- **应用 URL**: https://review-system.pages.dev
- **最新部署**: https://0963977c.review-system.pages.dev (V4.2.7 修复404错误)
- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages/view/review-system
- **状态**: ✅ 已部署并运行中
- **部署日期**: 2025-10-15 (V4.2.7 重置链接修复)

### 开发环境
- **应用 URL**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
- **Git Commit**: 5ff4602 (修复普通用户访问团队 V4.2.2)
- **本地端口**: 3000 (PM2 管理)
- **修复**: 普通用户访问团队页面、仪表板添加团队按钮

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
- group_type: 群体类型（personal/project/team）【新增】
- time_type: 时间类型（weekly/monthly/yearly）【新增】
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
- is_public: 是否公开（1/0）【V4.2 新增】
- created_at: 创建时间
- updated_at: 更新时间
```

#### 3a. Team Applications（团队申请表）【V4.2 新增】
```sql
- id: 申请ID
- team_id: 团队ID
- user_id: 申请用户ID
- status: 状态（pending/approved/rejected）
- message: 申请理由
- applied_at: 申请时间
- reviewed_at: 审批时间
- reviewed_by: 审批人ID
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

#### 6. Notifications（通知表）【新增】
```sql
- id: 通知ID
- user_id: 接收用户ID
- title: 通知标题
- message: 通知内容
- is_read: 已读状态（0/1）
- created_at: 创建时间
```

#### 7. Team Review Answers（团队答案表）【V3.9 新增】
```sql
- id: 记录ID
- review_id: 复盘ID
- user_id: 用户ID
- question_number: 问题编号（1-9）
- answer: 答案内容
- created_at: 创建时间
- updated_at: 更新时间
- UNIQUE(review_id, user_id, question_number): 每个用户对每个问题只能有一个答案
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
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_notifications.sql
│   └── 0003_add_review_types.sql  # 【新增】复盘分类字段
├── seed.sql                   # 种子数据
├── init-db.cjs               # 数据库初始化脚本
├── ecosystem.config.cjs      # PM2 配置
├── wrangler.json             # Cloudflare 配置
├── package.json              # 依赖配置
└── README.md                 # 本文档
```

## 🛠️ API 接口

### 认证相关

#### POST /api/auth/change-password【V3.7 新增】
修改密码（需要认证）
```json
Headers: Authorization: Bearer {token}
Request: {
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
Response: {
  "message": "Password changed successfully"
}
```

#### POST /api/auth/reset-password【V3.7 新增】
重置密码（忘记密码）
```json
Request: {
  "email": "user@example.com",
  "newPassword": "new_password"
}
Response: {
  "message": "Password reset successfully"
}
```

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

#### POST /api/auth/google
Google OAuth 登录/注册
```json
Request: {
  "credential": "google_id_token"
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
  "group_type": "project",  // 【新增】群体类型：personal/project/team
  "time_type": "monthly",   // 【新增】时间类型：weekly/monthly/yearly
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
  "group_type": "team",     // 【新增】可修改群体类型
  "time_type": "yearly",    // 【新增】可修改时间类型
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

#### GET /api/reviews/:id/team-answers【V3.9 新增】
获取团队协作答案
```json
Headers: Authorization: Bearer {token}
Response: {
  "answersByQuestion": {
    "1": [
      {
        "user_id": 1,
        "username": "Alice",
        "email": "alice@example.com",
        "answer": "我的目标是...",
        "updated_at": "2025-10-13 10:30:00"
      }
    ]
  },
  "completionStatus": [
    {
      "user_id": 1,
      "username": "Alice",
      "completed_count": 9
    }
  ],
  "currentUserId": 1
}
```

#### PUT /api/reviews/:id/my-answer/:questionNumber【V3.9 新增】
保存我的答案
```json
Headers: Authorization: Bearer {token}
Request: {
  "answer": "这是我的回答..."
}
Response: {
  "message": "Answer saved successfully"
}
```

#### DELETE /api/reviews/:id/answer/:userId/:questionNumber【V3.9 新增】
删除成员答案（仅创建者）
```json
Headers: Authorization: Bearer {token}
Response: {
  "message": "Answer deleted successfully"
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

#### POST /api/admin/users【V3.7 新增】
创建新用户（Admin 手动创建）
```json
Headers: Authorization: Bearer {token}
Request: {
  "email": "newuser@example.com",
  "password": "password123",
  "username": "用户名",
  "role": "user"  // user/premium/admin，可选，默认为 user
}
Response: {
  "message": "User created successfully",
  "user": {
    "id": 10,
    "email": "newuser@example.com",
    "username": "用户名",
    "role": "user"
  }
}
```

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

#### POST /api/notifications/broadcast 【新增】
向所有用户群发通知
```json
Headers: Authorization: Bearer {token}
Request: {
  "title": "通知标题",
  "message": "通知内容"
}
Response: {
  "message": "Notification sent successfully",
  "recipient_count": 25
}
```

#### POST /api/notifications/send 【新增】
向指定用户发送通知（支持邮箱查找）
```json
Headers: Authorization: Bearer {token}
Request: {
  "user_ids": [2, 3, 5],  // 用户ID数组
  "title": "通知标题",
  "message": "通知内容"
}
Response: {
  "message": "Notification sent successfully",
  "recipient_count": 3
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
- **选择群体类型**（个人/项目/团队）【新增】
- **选择时间类型**（周/月/年复盘）【新增】
- 选择团队（可选，仅限高级用户）
- 回答9个核心问题
- 保存为草稿或标记为完成

### 3. 团队复盘（高级用户）
- 创建或加入团队
- **通过邮箱邀请新成员**【新增】
- 在团队中创建复盘记录
- 团队成员可以共同编辑
- 添加协作者并设置编辑权限

### 4. 管理后台（管理员）
- 访问管理后台
- **用户管理标签页**：
  - 查看所有用户列表
  - 搜索和筛选用户
  - 调整用户角色权限
  - 删除用户账号
- **通知标签页【新增】**：
  - 群发通知给所有用户
  - 通过邮箱地址发送通知（逗号分隔多个邮箱）
  - 通过复选框选择用户发送通知
- **系统统计标签页**：
  - 查看用户数、复盘数、团队数
  - 用户角色分布统计

## 🚀 部署

### Cloudflare Pages 生产环境 ✅

**当前状态**: 已成功部署到生产环境

- **生产 URL**: https://review-system.pages.dev
- **项目名称**: review-system
- **数据库**: review-system-production (D1)
- **环境变量**: 已配置 4 个（Google OAuth + API Key）

### 快速部署命令

如需重新部署或更新：

```bash
# 1. 构建项目
npm run build

# 2. 部署到生产环境
npm run deploy:prod

# 3. 查看部署状态
npx wrangler pages deployment list --project-name review-system
```

### 详细部署文档

- **部署成功记录**: [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)
- **完整部署指南**: [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)
- **自定义域名设置**: [CUSTOM_DOMAIN_SETUP.md](CUSTOM_DOMAIN_SETUP.md)

### 自定义域名绑定

如果您有自己的域名，可以绑定到 Cloudflare Pages：

```bash
# 绑定您的域名
npx wrangler pages domain add yourdomain.com --project-name review-system

# 详细步骤请查看: CUSTOM_DOMAIN_SETUP.md
```

**优势**:
- ✅ 完全免费（包括 SSL 证书）
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 无限带宽和请求
- ✅ 支持多个域名

## 🔄 当前完成功能

✅ 用户认证系统（注册、登录、JWT）
✅ 角色权限管理（管理员/高级用户/普通用户）
✅ 个人复盘记录 CRUD
✅ 复盘列表页面（带筛选、搜索、分类、分页）
✅ 复盘创建表单（支持个人和团队复盘）
✅ 复盘编辑功能（完整的9问编辑）
✅ 复盘详情页面（展示9问回答和协作者）
✅ 团队创建和管理
✅ 团队复盘协作
✅ 复盘协作者管理
✅ 管理后台（用户管理、统计数据）
✅ **复盘分类系统（群体类型 + 时间类型）** 【V2 新增】
✅ **增强通知系统（邮箱发送 + 选择发送）** 【V2 新增】
✅ **团队邀请和权限系统（创造者/操作者/观察者）** 【V2 新增】
✅ **营销主页和资源库** 【V3 新增】
✅ **资源链接修复（文章和视频直接可访问）** 【V3.1 修复】
✅ **Logo点击返回首页功能** 【V3.1 新增】
✅ **紧凑的资源列表样式** 【V3.2 优化】
✅ **首页显示登录用户名** 【V3.2 新增】
✅ **Google账号一键登录/注册** 【V3.3 新增】
✅ **团队协作复盘功能** 【V3.9 新增】
✅ **复盘列表分页功能（每页5条，支持上一页/下一页）** 【V4.1.2 新增】
✅ **团队成员退出权限（成员可主动退出团队）** 【V4.1.2 新增】
✅ 中英双语支持
✅ 响应式前端界面
✅ API 接口完整实现
✅ 数据库设计和迁移

## 🔜 推荐下一步开发

### 前端增强
1. ~~完善复盘详情页面~~ ✅ 已完成
   - ~~显示完整的9问回答~~ ✅
   - ~~编辑表单界面~~ ✅
   - ~~协作者管理界面~~ ✅

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

- **平台**: Cloudflare Pages
- **生产环境**: ✅ 已部署 (https://review-system.pages.dev)
- **开发环境**: ✅ 运行中 (https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev)
- **技术栈**: Hono + TypeScript + Cloudflare D1
- **数据库**: ✅ review-system-production (D1)
- **Google OAuth**: ✅ 已配置并启用
- **Google API**: ✅ 已配置（YouTube + Custom Search）
- **环境变量**: ✅ 已配置 4 个生产环境变量
- **自定义域名**: ⏳ 待绑定（完全免费）
- **最后更新**: 2025-10-15
- **当前版本**: V4.2.7 完整版（密码重置链接404修复）🎉

## 📝 许可证

MIT License

---

**开发者**: Claude AI Assistant  
**创建日期**: 2025-10-07  
**当前版本**: V4.2.7  

**V4.2.7 更新内容** (2025-10-15):
- 🔗 **修复密码重置链接404错误**（关键修复）：
  - 问题：邮件中的 `/reset-password?token=xxx` 路径在 SPA 中返回404
  - 解决：修改为根路径 `/?token=xxx`，通过 URL 参数传递 token
  - 前端正确检测 token 参数并显示重置密码表单
- 📧 **邮箱注册验证**：
  - 解释未注册邮箱无法收到重置邮件的原因（安全设计）
  - 提供清晰的用户指引和解决方案
- 📝 **新增问题解决文档**：
  - 创建 `PASSWORD_RESET_ISSUES_RESOLVED.md` 详细说明
  - 包含问题分析、解决方案、测试验证、用户指南
- ✅ **修复问题**：用户点击邮件中的密码重置链接显示404错误

**V4.2.6 更新内容** (2025-10-15):
- 🔑 **更新 Resend API Key**（关键修复）：
  - 诊断问题：Resend Logs显示403错误（API Key权限问题）
  - 更新解决：配置新的有效 API Key 到 Cloudflare Pages
  - 验证测试：使用真实邮箱和测试账号验证邮件发送成功
  - 创建详细的更新指南文档（RESEND_API_KEY_UPDATE.md）
- ✅ **邮件功能恢复**：密码重置邮件现在可以正常发送
- 📝 **新增文档**：完整的 API Key 更新和故障排查指南

**V4.2.5 更新内容** (2025-10-15):
- 📧 **密码重置邮件修复**（核心修复）：
  - 修改发件地址从 `noreply@resend.dev` 到 `onboarding@resend.dev`
  - 使用 Resend 官方测试域名确保邮件能够发送
  - 增强邮件发送错误日志，记录详细的失败信息
  - 邮件发送成功时记录邮件ID便于追踪
- 📝 **新增排查文档**：
  - 创建 `PASSWORD_RESET_TROUBLESHOOTING.md` 详细排查指南
  - 包含常见问题、解决方案、测试方法
  - 提供自定义域名配置指引
- ✅ **修复问题**：用户请求密码重置后收不到邮件的问题

**V4.2.4 更新内容** (2025-10-14):
- 🔄 **Previous按钮数据保留**（核心修复）：
  - 修改showCreateReview()函数，添加可选参数preservedData
  - 从Step 2点击Previous返回Step 1时自动恢复所有表单数据
  - 保留用户输入的标题、说明、模板选择、群体类型、团队选择、时间类型、状态
  - 自动恢复UI状态（团队选择器的显示/隐藏）
  - 自动更新模板描述信息
- 🎯 **用户体验改进**：
  - 用户可以自由在Step 1和Step 2之间切换而不丢失数据
  - 支持修改Step 1的信息后继续填写Step 2
  - 防止因误操作返回导致的数据丢失
- ✅ **修复问题**：从Step 2点击Previous返回Step 1时表单数据被清空的问题

**V4.2.3 更新内容** (2025-10-14):
- 🌍 **国际化修复**（核心修复）：
  - 修复英文环境下显示中文提示的bug
  - 新增4个翻译键：noTeamsYet, pleaseGoToTeamsPage, teamsPage, applyOrCreateTeam
  - 替换团队选择器中的硬编码中文文本为i18n函数调用
  - 中文提示："你还没有加入任何团队" → 英文："You haven't joined any teams yet"
  - 中文提示："请先前往 团队页面 申请加入公开团队或创建新团队" → 英文："Please go to Teams page to apply for public teams or create new teams"
- ✅ **修复问题**：英文用户在创建团队复盘时看到中文提示语的问题

**V4.2.2 更新内容** (2025-10-14):
- 🔓 **普通用户团队访问修复**（核心修复）：
  - 移除团队路由的全局premiumOrAdmin中间件
  - 普通用户现在可以正常访问团队页面
  - 仅在创建团队时检查premium/admin权限
  - 修复"操作失败"错误提示
- 🎯 **导航按钮可见性**：
  - 仪表板页面的"团队"按钮现在对所有用户可见
  - 确保所有角色都能方便访问团队功能
- 🐛 **修复邮箱邀请功能**：
  - 修改后端支持通过email参数查找用户
  - 简化前端邀请逻辑，直接发送email
  - 移除对admin API的依赖
- 🚫 **修复"Draft saved"假阳性**：
  - 将currentView赋值移到showCreateReview函数末尾
  - 仅在所有初始化成功后设置currentView
  - 防止验证失败时触发自动保存
- 🛠️ **创建复盘页面加载修复**：
  - 为handleTemplateChangeStep1添加全面错误处理
  - 添加所有DOM元素的null检查
  - 防止未捕获异常导致页面无法打开
- ✅ **修复问题**：
  - 普通用户无法访问团队页面
  - 高级用户无法邀请团队成员
  - admin/premium用户点击"创建复盘"无响应
  - 导航离开时显示虚假"Draft saved"通知

**V4.1.2 更新内容** (2025-10-14):
- 🔄 **智能语言切换**（核心功能）：
  - 切换语言前自动保存当前创建的复盘内容
  - 在创建复盘过程中切换语言会显示确认对话框
  - 第一步和第二步都会自动保存为草稿到服务器
  - 显示保存状态通知（正在保存、已保存、正在切换）
  - 防止用户在创建复盘时因切换语言而丢失数据
- 🛡️ **数据保护机制**：
  - 新增 saveCurrentReviewDraft() 全局函数（支持Step 1和Step 2）
  - 新增 handleLanguageSwitch() 处理器
  - 所有语言切换按钮统一使用新处理器
  - **草稿生命周期管理**（Bug修复）：
    - 新增 currentDraftId 全局变量追踪草稿ID
    - 防止重复创建草稿（多次切换语言时更新同一草稿）
    - 开始新复盘时重置 currentDraftId
    - 完成复盘提交后清除 currentDraftId
- 🚀 **导航自动保存**（新增功能）：
  - 所有导航按钮（主页、仪表板、我的复盘、团队、管理后台）在离开创建复盘页面前自动保存草稿
  - 新增 autoSaveDraftBeforeNavigation() 辅助函数统一处理自动保存
  - 修改 5 个导航函数：showHomePage(), showDashboard(), showReviews(), showTeams(), showAdmin()
  - 防止用户在创建复盘时因点击导航按钮而丢失数据
- 📄 **复盘列表分页功能**（新增功能）：
  - 每页显示 5 条复盘记录
  - 超过 5 条时自动显示分页控件
  - 支持"上一页"/"下一页"按钮导航
  - 显示当前页码和总页数
  - 显示当前显示范围（显示 X 到 Y 共 Z 条结果）
  - 响应式设计：移动端显示简化版分页，桌面端显示完整页码
  - 筛选和搜索后自动重置到第一页
- 👥 **智能团队选择器**（新增功能）：
  - 当"群体类型"选择"团队"时，自动显示团队选择下拉框
  - 显示用户所属的所有团队列表
  - 选择"个人"或"项目"时自动隐藏团队选择器
  - 选择"团队"时团队选择变为必填项
  - 防止忘记选择团队导致的创建失败
- 🚪 **成员退出团队功能**（新增功能）：
  - 团队成员可以在团队详情页面主动退出团队
  - 在成员列表中，每个成员（除拥有者外）都有"退出团队"按钮
  - 点击后需要确认操作，防止误操作
  - 退出后自动返回团队列表页面
  - 团队拥有者无法退出，只能解散团队
- 🌐 **新增国际化键**：confirmLanguageSwitch, savingDraft, draftSaved, switchingLanguage, previousPage, nextPage, showing, to, of, results, pleaseSelectTeam
- ✅ **修复问题**：
  - V4.1.2初始版本：切换语言时未保存的复盘内容丢失
  - **V4.1.2 Bug修复 #1**：
    - 修复Step 1切换语言后草稿不出现在"我的复盘"列表的问题
    - 修复多次切换语言会创建多个草稿副本的问题
    - 确保草稿正确保存到服务器并可在列表中查看
  - **V4.1.2 Bug修复 #2**：
    - 修复点击导航按钮（主页、仪表板等）时未保存草稿导致数据丢失的问题
    - 现在所有导航操作都会自动保存草稿
  - **V4.1.2 Bug修复 #3**：
    - 修复删除复盘后页面不自动刷新的问题
    - 删除后根据当前视图自动刷新列表（我的复盘/仪表板）
    - 使用友好的通知提示替代传统 alert 弹窗

**V4.1.1 更新内容** (2025-10-14):
- 🌍 **模板内容国际化**（核心修复）：
  - 新增 name_en、description_en 字段到 templates 表
  - 新增 question_text_en 字段到 template_questions 表
  - 全部53个"个人年复盘"问题翻译为英文
  - 全部10个"灵魂9问"问题翻译为英文
  - 后端API自动根据用户语言返回对应内容（X-Language header）
  - 前端自动发送语言偏好到所有API请求
- 📊 **新增数据库迁移**：0011_add_template_i18n.sql
- 🔌 **API增强**：
  - templates.ts: 支持语言参数，返回对应语言的模板内容
  - reviews.ts: 返回对应语言的模板名称和描述
- 🎨 **用户体验改进**：英文用户不再看到中文模板内容
- ✅ **修复问题**：修复V4.1中英文系统显示中文模板内容的bug

**V4.1 更新内容** (2025-10-13):
- 📝 **两步创建复盘流程**：
  - 第一步：填写基本信息（标题、描述、团队、模板选择）
  - 第二步：根据模板填写问题（支持1-100+问题）
  - 模板选择时实时预览（显示描述和问题数量）
- 📋 **新增"个人年复盘"模板**：
  - 53个深度年度反思问题
  - 涵盖：过去回顾、成就总结、挑战分析、目标规划
  - 适合年度总结和新年规划
- 💾 **数据库优化**：
  - 新增 0010_add_yearly_review_template.sql 迁移
  - 支持动态数量的问题（不限于9个）

**V4.0 更新内容** (2025-10-13):
- 📋 **模板系统**（核心新功能）：
  - 创建复盘时可选择模板
  - 默认模板"灵魂9问"（10个问题）
  - 模板创建后不可更改
  - 不同模板可以有不同数量的问题
- 📊 **数据库重构**：
  - 新增 templates 表（存储模板信息）
  - 新增 template_questions 表（存储模板问题）
  - 新增 review_answers 表（动态存储答案）
  - reviews 表新增 template_id 字段
  - 自动迁移现有数据到新结构
- 🔌 **新增API路由**：
  - GET /api/templates（获取所有模板）
  - GET /api/templates/:id（获取单个模板详情）
- 🎨 **前端界面重构**：
  - 创建复盘表单新增模板选择
  - 动态渲染问题数量（1-100+问题）
  - 复盘详情页显示模板名称标签
  - 编辑页面显示模板信息（只读）

**V3.9 更新内容** (2025-10-13):
- 🤝 **团队协作复盘功能**（核心新功能）：
  - 多人并列答题：每个问题显示所有团队成员的答案
  - 权限控制：成员只能编辑自己的答案，创建者可以删除他人答案
  - 自动保存：答案修改后自动保存，无需提交
  - 完成状态：显示每个成员的完成进度（已完成X/9题）
  - 手动刷新：支持刷新页面查看最新答案
- 📊 **新增数据表**：team_review_answers（团队答案表）
- 🔌 **新增API接口**：
  - GET /api/reviews/:id/team-answers（获取团队答案）
  - PUT /api/reviews/:id/my-answer/:questionNumber（保存我的答案）
  - DELETE /api/reviews/:id/answer/:userId/:questionNumber（删除答案）
- 🎨 **前端界面优化**：
  - 新增"查看团队答案"按钮（团队复盘详情页）
  - 完整的团队协作答题界面（并列显示、自动保存、完成状态）
- 🌐 **国际化支持**：新增17个翻译键（中英双语）

**V3.8 更新内容** (2025-10-10):
- 🔒 **安全的忘记密码功能**（修复 V3.7 安全漏洞）：
  - 两步密码重置流程（请求重置 → 邮件验证 → 设置新密码）
  - 集成 Resend 邮件服务，发送专业的重置邮件
  - 密码重置令牌系统（1小时过期、一次性使用）
  - 防止邮箱枚举攻击
  - 精美的 HTML 邮件模板
  - 完整的安全验证流程
- 📧 **新增 Resend 配置文档**：完整的邮件服务配置指南
- 🛡️ **安全特性增强**：令牌管理、过期机制、防攻击措施

**V3.7 更新内容** (2025-10-09):
- 🔐 **用户密码管理**：
  - 登录后用户可修改密码（需验证当前密码）
  - 登录界面增加"忘记密码"功能（通过邮箱重置密码）
  - 密码强度验证（至少6个字符）
- 👥 **Admin 新增用户功能**：
  - Admin 可在管理界面手动创建用户
  - 支持设置用户邮箱、用户名、密码和角色
  - 创建后立即可用

**V3.6 更新内容** (2025-10-09):
- 📚 **学习资源展示优化**：
  - **初始加载**：精选文章和视频教程各显示 6 条随机记录
  - **智能更新**：点击"更新"按钮时，只替换其中 1 条随机记录（保留其他 5 条）
  - **缓存机制**：减少 API 调用，提升性能
  - **内容丰富**：相比 V3.5（1条）增加到 6 条，内容更丰富
  - **动态刷新**：每次点击都看到新内容，不会完全重新加载

**V3.5 更新内容** (2025-10-09):
- 🌍 **默认语言改为英文**：首次访问时默认显示英文界面（用户可手动切换中文）
- 📚 **学习资源优化**：
  - 精选文章和视频教程改为每次只显示一条随机记录
  - 添加"加载另一篇/另一个"按钮，点击可刷新显示新的随机内容
  - 减少页面加载量，提升用户体验

**V3.4 更新内容** (2025-10-09):
- 🐛 **修复数据库配置问题**：
  - 修复 wrangler.json 数据库配置（database_name 不匹配）
  - 成功应用所有数据库迁移（5个迁移文件）
  - 导入种子数据，创建测试账号
  - 邮箱登录功能恢复正常 ✅
- 🔧 **修复Google登录按钮显示**：
  - 改用手动初始化 Google Sign-In 按钮
  - 修复前端页面渲染后按钮不显示的问题
  - 统一 authToken 存储方式（与邮箱登录一致）
- 🔑 **配置Google API Key**：
  - 配置 GOOGLE_API_KEY: AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs
  - 配置 YOUTUBE_API_KEY（同一密钥）
  - 启用真实 YouTube 视频数据获取
- 📄 **更新文档**：
  - 添加 POST /api/auth/google API 文档
  - 更新部署状态和版本信息

**V3.3 更新内容** (2025-10-08):
- 🔐 **Google账号登录**：
  - 集成Google OAuth 2.0认证
  - 支持Google账号一键登录和注册
  - 自动创建用户账号（首次登录）
  - 通过邮箱关联现有账号（已注册用户）
  - 在登录和注册页面添加Google按钮
  - 完整的配置文档（GOOGLE_OAUTH_SETUP.md）
  - 环境变量示例文件（.dev.vars.example）

**V3.2 更新内容** (2025-10-08):
- 🎨 **优化资源展示**：
  - 将"精选文章"改为紧凑的列表样式，每条占用更少空间
  - 将"视频教程"改为紧凑的列表样式，移除大图预览
  - 调整为单列布局，最大宽度限制，提升阅读体验
- ✨ **首页用户名显示**：登录后返回首页时，在"仪表板"按钮旁显示用户名

**V3.1 更新内容** (2025-10-08):
- 🐛 **修复资源链接问题**：
  - 修复"精选文章"所有文章链接，确保可直接访问
  - 修复"视频教程"链接，使用直接的YouTube视频watch链接而非搜索链接
- ✨ **Logo点击功能**：点击系统标题或logo可返回首页（适用于登录前后所有界面）

**V3.0 更新内容** (2025-10-08):
- ✨ 完整的营销主页（Hero + 资源 + 关于 + 团队 + 评价 + 联系）
- ✨ 学习资源库（10篇文章 + 10个视频）
- ✨ 团队成员三级权限系统（创造者/操作者/观察者）
- ✨ 季复盘时间类型
- ✨ 权限限制：只有Premium和Admin可创建团队
- ✨ 完整的法律页面（服务条款 + 隐私政策）
- ✨ 首页英雄区3张图片轮播功能

**V2.0 更新内容** (2025-10-07):
- ✨ 复盘分类系统（群体类型 + 时间类型）
- ✨ 增强通知系统（邮箱发送 + 选择发送）
- ✨ 团队邮箱邀请功能
