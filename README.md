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
   - **主人属性和访问控制（V4.3.0 新增）**：
     - **私有**：仅创建者可见和编辑
     - **团队**：团队成员可见；群体类型为"团队"时成员可协作
     - **公开**：所有人可见但仅创建者可编辑
     - 新增"公开的复盘"菜单展示所有公开复盘
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
   - **服务端语言偏好持久化（V4.2.8 新增）**：
     - 系统默认英文版
     - 用户选择语言后自动保存到服务器
     - 登录后自动应用用户偏好的语言
     - 支持Google OAuth登录的语言设置

7. ✅ **用户设置页面**（V4.2.8 新增）
   - 点击导航栏用户名进入设置页面
   - **账号设置**：
     - 修改用户名
     - 修改邮箱地址
     - 选择语言偏好（中文/English）
   - **密码管理**：
     - 在设置页面直接修改密码
     - 需要验证当前密码
   - 设置自动同步到服务器和本地存储

## 🔗 访问链接

### 生产环境 ✅
- **应用 URL**: https://b4a856a5.review-system.pages.dev
- **最新部署**: ✅ V5.6.1 百度文库+URL验证
- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages/view/review-system
- **状态**: ✅ 已成功部署到生产环境
- **部署日期**: 2025-10-16 (V5.6.1 百度文库搜索+404链接过滤)

### 开发环境
- **应用 URL**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
- **Git Commit**: V5.1.0 (模板管理系统)
- **本地端口**: 3000 (PM2 管理)
- **新增**: 完整的模板管理功能（增删查改）+ 问题管理 + 编辑复盘导航修复

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

#### GET /api/auth/settings【V4.2.8 新增】
获取当前用户设置
```json
Headers: Authorization: Bearer {token}
Response: {
  "username": "用户名",
  "email": "user@example.com",
  "language": "zh"  // "zh" or "en"
}
```

#### PUT /api/auth/settings【V4.2.8 新增】
更新用户设置
```json
Headers: Authorization: Bearer {token}
Request: {
  "username": "新用户名",  // 可选
  "email": "newemail@example.com",  // 可选
  "language": "en"  // 可选，"zh" or "en"
}
Response: {
  "message": "Settings updated successfully",
  "user": { "id", "username", "email", "language", "role" }
}
```

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
- **生产环境**: ✅ 已部署 (https://692c14b3.review-system.pages.dev)
- **开发环境**: ✅ 运行中 (https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev)
- **技术栈**: Hono + TypeScript + Cloudflare D1
- **数据库**: ✅ review-system-production (D1)
- **Google OAuth**: ✅ 已配置并启用
- **Google API**: ✅ 已配置（YouTube + Custom Search）
- **环境变量**: ✅ 已配置 4 个生产环境变量
- **自定义域名**: ⏳ 待绑定（完全免费）
- **最后更新**: 2025-10-16
- **当前版本**: V5.6.0（语言智能学习资源）✅ 已部署生产环境

## 📝 许可证

MIT License

---

**开发者**: Claude AI Assistant  
**创建日期**: 2025-10-07  
**当前版本**: V5.1.0  

**V5.6.0 更新内容** (2025-10-16):
- 🌍 **语言智能学习资源**（核心功能增强）：
  - **根据用户语言搜索内容**：
    - 中文用户：从互联网搜索中文文章和从YouTube搜索中文视频
    - 英文用户：从互联网搜索英文文章和从YouTube搜索英文视频
  - **系统复盘主题搜索**：
    - 中文搜索词：'什么是系统化的复盘'、'如何系统性复盘'、'系统性复盘的优势'
    - 英文搜索词：'what is systematic review reflection'、'how to conduct systematic retrospective'、'benefits of systematic review'
  - **一次更新全部资源**：
    - 按钮文字更新："Update One Article" → "更新文章 / Update Articles"
    - 按钮文字更新："Update One Video" → "更新视频 / Update Videos"
    - 点击更新时刷新全部6篇文章或6个视频（不再只更新1个）
    - 每次点击都从API获取最新内容
- 📚 **Mock数据增强**：
  - 新增10篇中文系统复盘主题文章（知乎、36氪、联想等）
  - 新增10个中文系统复盘主题视频（柳传志、敏捷回顾等）
  - 英文Mock数据保持专业性（HBR、TED、McKinsey等）
- 🔌 **后端API增强**：
  - GET /api/resources/articles：自动检测X-Language请求头
  - GET /api/resources/videos：自动检测X-Language请求头
  - 根据语言参数返回对应语言的搜索结果
  - Mock数据函数支持语言参数（lang: 'zh' | 'en'）
- 🎨 **前端优化**：
  - 简化loadArticles/loadVideos逻辑
  - 更新时总是获取最新API数据
  - 按钮文字支持国际化（i18n.t）
- 🌐 **国际化**：新增 'updateArticles'（更新文章）、'updateVideos'（更新视频）翻译

**V5.5.1 更新内容** (2025-10-16):
- 🐛 **修复首页导航菜单问题**（关键Bug修复）：
  - **问题诊断**：高级用户在首页看不到"团队"和"管理后台"按钮
  - **根本原因**：首页使用自定义导航栏，没有使用标准的 renderNavigation() 函数
  - **用户体验问题**：用户必须先点击"团队"才能看到完整的导航菜单
  - **解决方案**：
    - 修改首页导航栏，根据登录状态显示不同菜单
    - **已登录用户**：显示完整应用菜单（工作台、我的复盘、公开的复盘、团队、管理后台）
    - **游客用户**：显示营销页面链接（资源、关于、评价、联系）
    - 高级用户和管理员在首页可以直接看到"管理后台"按钮
  - **UI优化**：
    - 右侧导航增加用户设置和退出按钮
    - 显示用户名和角色标签（与其他页面一致）
    - 移除重复的"工作台"按钮
- ✅ **修复状态**：高级用户现在在首页就能同时看到"团队"和"管理后台"按钮

**V5.5.0 更新内容** (2025-10-16):
- 🏷️ **导航栏改名**：
  - "仪表板"改名为"工作台"（Dashboard → Workbench）
  - 更符合中文用户的使用习惯
- 👑 **系统模版限制**（核心功能）：
  - **系统模版定义**：只有管理员创建的模版才能设置为"默认"
  - **权限控制**：
    - ✅ 管理员可以创建系统模版并设为默认
    - ✅ 高级用户只能创建用户模版，不能设为默认
    - ❌ 高级用户无法设置模版为默认（UI隐藏选项，后端验证阻止）
  - **模版类型标识**：
    - 新增"类型"列显示模版分类
    - 系统模版：紫色标签 + 👑 皇冠图标
    - 用户模版：蓝色标签 + 👤 用户图标
  - **后端验证**：
    - 创建模版时只允许管理员设置 is_default=true
    - 更新模版时只允许管理员修改 is_default 标志
    - 非管理员用户尝试设置默认会被忽略（保持现有值）
  - **前端UI优化**：
    - 创建/编辑模版对话框：非管理员不显示"默认"复选框
    - 模版列表：显示类型标签区分系统/用户模版
    - 基于 creator_role 判断模版类型（admin = 系统模版）
- 🌐 **国际化增强**：
  - 新增翻译：systemTemplate（系统模版）、userTemplate（用户模版）、type（类型）
  - 中英双语完整支持
- 📊 **API增强**：
  - templates/admin/all 新增 creator_role 字段返回
  - 前端可根据创建者角色判断模版类型

**V5.4.0 更新内容** (2025-10-16):
- 👥 **模版所有权系统**（核心功能扩展）：
  - **数据库扩展**：templates 表新增 created_by 列追踪创建者
  - **权限分级**：
    - ✅ 高级用户只能创建和编辑自己的模版
    - ✅ 管理员可以创建和编辑所有用户的模版
    - ❌ 高级用户尝试编辑他人模版返回 403 Forbidden
  - **列表过滤**：
    - 高级用户只看到自己创建的模版
    - 管理员看到所有模版并显示创建者信息
  - **UI增强**：
    - 模版列表新增"创建者"列显示用户名
    - 创建者为空时显示"系统"
  - **所有权验证**：
    - 模版 CRUD 操作全部加入所有权检查
    - 问题管理操作继承模版所有权规则
- 📊 **数据库迁移**：0016_add_template_creator.sql（新增 created_by 列）
- 🌐 **国际化**：新增 creator（创建者）、system（系统）翻译

**V5.1.0 更新内容** (2025-10-16):
- 🎯 **模板管理系统**（管理后台新增功能）：
  - **管理面板新增"模板管理"Tab**：Admin可完整管理所有模板
  - **模板CRUD操作**：
    - ✅ 创建新模板（支持中英双语）
    - ✅ 编辑模板信息（名称、描述、默认、启用状态）
    - ✅ 删除模板（智能软删除保护）
    - ✅ 查看所有模板列表（含问题数量）
  - **问题管理功能**：
    - ✅ 添加新问题（支持中英双语）
    - ✅ 编辑问题内容
    - ✅ 删除问题
    - ✅ 问题排序（上移/下移）
  - **保护机制**：
    - ✅ 默认模板不能删除
    - ✅ 使用中的模板只能禁用（软删除）
    - ✅ 自动管理默认模板标记
  - **用户界面**：
    - ✅ 清晰的表格布局
    - ✅ 模态对话框编辑
    - ✅ 颜色标签区分状态
    - ✅ 即时反馈和刷新
- 🔧 **Bug修复**：
  - ✅ 修复编辑复盘保存后返回错误页面（现在返回仪表板）
- 🌍 **国际化增强**：
  - 新增40+个模板管理相关翻译（中英文）
- 📊 **API增强**：
  - 新增9个Admin专用API端点
  - 完整的模板和问题管理接口

**V5.0.0 更新内容** (2025-10-16):
- 🔄 **多用户答案系统**（重大架构变更）：
  - **核心变化**：每个问题现在支持多个用户独立记录答案
  - **权限规则**：
    - ✅ 每个用户只能编辑自己的答案
    - ✅ 创建者只能修改复盘基本属性（标题、说明、群体类型、时间类型、主人）
    - ❌ 创建者**不能**修改其他用户的答案
    - ❌ 团队成员**不能**修改其他用户的答案
  - **适用范围**：所有复盘（个人、项目、团队）都使用统一的多用户答案系统
- 📊 **数据库架构重构**（Migration 0014）：
  - 统一使用 `review_answers` 表支持多用户
  - 添加 `user_id` 字段到 `review_answers`
  - 迁移数据从 `team_review_answers` 到 `review_answers`
  - 删除废弃的 `team_review_answers` 表
  - 新增唯一约束：`(review_id, user_id, question_number)`
- 🔌 **后端API更新**：
  - **GET /api/reviews/:id**: 返回 `answersByQuestion`（按问题分组的多用户答案）
  - **PUT /api/reviews/:id**: 
    - 只有创建者可以修改基本属性
    - 所有用户只能修改自己的答案
  - **GET /api/reviews/:id/all-answers**: 获取所有用户的答案（替代 `/team-answers`）
  - **PUT /api/reviews/:id/my-answer/:questionNumber**: 保存当前用户的答案
  - **DELETE /api/reviews/:id/my-answer/:questionNumber**: 删除当前用户自己的答案
- 🎨 **前端界面优化**：
  - 复盘详情页：显示所有用户的答案，每个答案显示用户名和时间
  - 团队协作页：展示多用户答案，标注"我的答案"
  - 编辑页面：
    - 创建者无法修改其他用户的答案
    - 团队成员只能编辑自己的答案
    - 基本属性仅创建者可编辑（其他人显示禁用状态）
  - 移除创建者删除其他用户答案的按钮
  - 新增"删除我的答案"功能（每个用户可删除自己的答案）
- 🌐 **国际化支持**：
  - 新增翻译键：`onlyEditOwnAnswers`, `cannotEditOthersAnswers`
  - 中英双语提示信息
- ✅ **向后兼容**：现有复盘数据自动迁移到新架构，无需手动干预

**V4.3.4 更新内容** (2025-10-16):
- 🐛 **彻底修复重复保存问题**（关键Bug修复）：
  - **问题诊断**：用户报告V4.3.3仍然存在重复保存
  - **根本原因**：`showReviews()`函数开头无条件调用`autoSaveDraftBeforeNavigation()`
  - **执行流程**：
    1. 用户点击"保存" → `handleStep2Submit`执行保存（第一次）
    2. 设置`currentView = 'completing-review'`防止auto-save
    3. 调用`showReviews()`
    4. `showReviews()`开头无条件调用`autoSaveDraftBeforeNavigation()`
    5. 虽然`currentView`已改，但时序问题可能导致重复保存
  - **解决方案**：
    - 修改`showReviews()`函数，添加条件检查
    - 只有当`currentView`是`'create-review-step1'`或`'create-review-step2'`时才auto-save
    - 如果`currentView`已被改为`'completing-review'`，跳过auto-save
    - 修复Step 2顶部的"返回"按钮也使用确认对话框
  - **测试验证**：
    - ✅ 点击"保存"只执行一次POST/PUT
    - ✅ 不会在`showReviews()`时再次保存
    - ✅ 数据库中只有一条记录

**V4.3.3 更新内容** (2025-10-16):
- 🐛 **彻底修复重复保存问题**（核心Bug修复 - 关键）：
  - **根本原因**：`showReviews()`函数在开始时调用`autoSaveDraftBeforeNavigation()`，导致第二次保存
  - **保存流程分析**：
    1. 用户点击"保存"按钮
    2. `handleStep2Submit()`执行保存（第一次保存）✅
    3. 调用`showReviews()`跳转到复盘列表
    4. `showReviews()`开头检测到`currentView === 'create-review-step2'`
    5. 触发`autoSaveDraftBeforeNavigation()`（第二次保存）❌
    6. 结果：数据库中出现两个相同记录
  - **解决方案**（关键修复）：
    - 在`handleStep2Submit()`中，保存成功后立即设置`currentView = 'completing-review'`
    - 这样`showReviews()`调用`autoSaveDraftBeforeNavigation()`时会跳过保存
    - 移除Step 1到Step 2的自动保存逻辑
    - "下一步"按钮只切换界面，不保存
    - "保存"按钮是唯一的保存触发点
    - 保存后清除`currentDraftId`并更改视图状态
- 📝 **返回按钮智能确认**（用户体验改进）：
  - **问题2**：点击"返回"按钮会自动保存，用户无法控制
  - **解决方案**：
    - 检测用户是否已填写答案
    - 如果有答案，显示确认对话框询问用户
    - 用户可选择："确定"保存草稿，或"取消"直接返回不保存
    - 如果没有答案，直接返回Step 1
    - 新增`handlePreviousWithConfirmation()`函数处理逻辑
- 🌐 **国际化支持**：新增翻译键`saveBeforeGoingBack`（中英双语确认对话框文本）
- ✅ **测试场景**：
  - ✅ 点击"下一步"不会保存
  - ✅ 点击"保存"只保存一次
  - ✅ 点击"返回"有填写答案时会询问
  - ✅ 点击"返回"无答案时直接返回
  - ✅ 不会再出现重复记录

**V4.3.2 更新内容** (2025-10-16):
- 📊 **显示主人属性**（用户体验改进）：
  - 在所有复盘列表中显示主人属性列（owner_type）
  - **仪表板复盘列表**：新增"主人"列，显示私有/团队/公开标签
  - **我的复盘列表**：新增"主人"列和筛选器
  - **公开的复盘列表**：新增"主人"列
  - 使用颜色标签区分：
    - 私有（灰色 + 🔒锁图标）
    - 团队（蓝色 + 👥用户组图标）
    - 公开（绿色 + 🌐地球图标）
- 🔍 **主人属性筛选**（新增功能）：
  - 在"我的复盘"页面新增主人属性筛选下拉框
  - 支持按私有/团队/公开筛选复盘记录
  - 与现有的状态、群体类型、时间类型筛选器配合使用
- 🐛 **修复重复保存问题**（核心Bug修复）：
  - **问题**：创建复盘时点击"保存"按钮会保存两次
  - **原因**：Next按钮触发自动保存草稿，Save按钮再次创建新记录
  - **解决方案**：
    - `handleStep2Submit()` 检查 `currentDraftId`
    - 如果存在草稿ID：使用 PUT 更新现有草稿
    - 如果无草稿ID：使用 POST 创建新记录
    - 清除 `currentDraftId` 防止重复更新
  - **状态**：✅ 完全修复，不会再重复保存
- 🎨 **新增辅助函数**：
  - `renderOwnerTypeBadge(ownerType)` 生成主人属性标签
  - 统一的颜色方案和图标
  - 支持国际化（中英文自动切换）
- 🌐 **国际化支持**：使用现有的 ownerType、ownerTypePrivate、ownerTypeTeam、ownerTypePublic 翻译键

**V4.3.1 更新内容** (2025-10-16):
- 🐛 **修复导航菜单问题**：
  - 在用户设置页面的导航菜单添加"公开的复盘"选项
  - 确保所有页面的导航菜单保持一致
- 🐛 **修复重复提交问题**：
  - 添加 `isSubmitting` 标志防止重复提交
  - 修复创建"公开"复盘时可能出现的重复保存问题
  - 使用 try-finally 确保标志正确重置

**V4.3.0 更新内容** (2025-10-16):
- 🔒 **复盘主人属性和访问控制**（核心功能扩展）：
  - 新增`owner_type`字段：私有(private)、团队(team)、公开(public)
  - **私有**：仅创建者可见和编辑
  - **团队**：团队成员可见；群体类型为"团队"时成员可协作
  - **公开**：所有人可见但仅创建者可编辑
- 🌐 **公开的复盘功能**（新增页面）：
  - 主菜单新增"公开的复盘"选项
  - 展示所有owner_type为"公开"的复盘
  - 用户可查看所有公开复盘，供学习和参考
- 📝 **创建和编辑表单增强**：
  - 新增"主人"选择器（私有/团队/公开）
  - 提供详细说明帮助用户理解各选项
  - 自动验证（团队主人需要选择团队）
- 🔐 **后端访问控制**：
  - 基于owner_type实现多层权限控制
  - GET /api/reviews: 根据owner_type和group_type过滤
  - GET /api/reviews/public: 新端点获取所有公开复盘
  - PUT /api/reviews/:id: 根据owner_type限制编辑权限
  - 团队答案API：支持团队协作访问控制
- 📊 **数据库更新**：
  - 新增owner_type字段（默认'private'）
  - 新增索引idx_reviews_owner_type优化查询
  - 自动更新历史数据（有team_id的设为'team'）
- 🌍 **国际化支持**：
  - 新增中英文翻译：主人、私有、团队、公开
  - 新增公开复盘页面的翻译
  - 新增访问控制说明的翻译

**V4.2.11 更新内容** (2025-10-15):
- 🎨 **统一仪表板和我的复盘版面**（用户体验改进）：
  - 调整"我的复盘"列表表头顺序与仪表板完全一致
  - 列顺序：标题、创建者、状态、更新时间、操作
  - 简化表格样式，统一视觉效果
  - 两个页面现在使用相同的布局和列顺序
- 👁️ **修复"我的复盘"/"查看"功能**（核心功能修复）：
  - 查看按钮现在传递readOnly=true参数
  - 查看模式完全只读，不显示编辑按钮
  - 修复查看页面可以编辑的问题
- 🐛 **修复编辑功能的teams undefined错误**（核心稳定性修复）：
  - **根本原因**：showEditReview函数中teams变量可能为undefined
  - **影响范围**：仪表板和我的复盘的"编辑"按钮都会触发此错误
  - **修复方案**：
    - API调用添加完整后备：`teams = teamsResponse.data.teams || teamsResponse.data.myTeams || []`
    - catch块明确设置：`teams = []`
    - 模板检查增强：`&& teams && teams.length > 0`
  - **错误信息**：`Cannot read properties of undefined (reading 'length')`
  - **状态**：✅ 完全修复，不会再出现
- 📊 **数据来源分析**：
  - 发现API可能返回`teams`或`myTeams`字段
  - 现在两个字段都有后备处理
  - 确保teams变量永远是数组，即使API失败

**V4.2.10.1 更新内容** (2025-10-15):
- 🛡️ **全面增强数组访问安全性**（核心稳定性修复）：
  - 为所有数组.map()调用添加双重安全检查
  - 检查内容：`(array && array.length > 0)`
  - 修复区域：
    - `collaborators` 数组（复盘协作者列表）
    - `questions` 数组（团队协作视图）
    - `completionStatus` 数组（成员完成状态）
  - 所有数组访问都添加else分支，显示友好提示
- 🎯 **防止所有可能的undefined错误**：
  - `Cannot read properties of undefined (reading 'length')`
  - `Cannot read properties of null (reading 'map')`
  - 任何数组为undefined/null导致的页面崩溃
- ✅ **问题确认**：
  - 仪表板已显示创建者列（使用同一个renderRecentReviews函数）
  - 编辑功能已全面加固，不会再出现undefined错误
- 📝 **代码质量**：防御性编程，确保在任何数据异常情况下都能优雅降级

**V4.2.10 更新内容** (2025-10-15):
- 📋 **添加创建者列到复盘列表**（用户体验改进）：
  - 在"我的复盘"页面的表格中新增"创建者"列
  - 显示在标题和状态列之间
  - 显示 review.creator_name，如果为空则显示 "Unknown"
  - 使用 fas fa-user-circle 图标增强视觉效果
  - 支持国际化（i18n.t('creator') || '创建者'）
- 🐛 **修复编辑功能的undefined错误**（稳定性修复）：
  - 问题：点击"我的复盘"→"编辑"时出现 `Cannot read properties of undefined (reading 'length')` 错误
  - 根本原因：showCreateReviewStep2() 函数在第2091行直接调用 template.questions.map() 而没有检查是否为 undefined
  - 解决方案：添加空值检查 `(template.questions && template.questions.length > 0)`
  - 添加友好的空状态提示："暂无问题"（支持国际化）
  - 使用三元运算符根据检查结果显示问题列表或提示
- ✅ **代码质量提升**：
  - 检查并确认其他所有 template.questions 访问都已有适当的null检查
  - 防止类似的 undefined 错误在其他地方发生
  - 增强了系统的健壮性和用户体验
- 📝 **新增文档**：CREATOR_COLUMN_FIX.md（完整的问题分析和解决方案文档）

**V4.2.9 更新内容** (2025-10-15):
- 📧 **通知系统邮件发送功能**（核心修复）：
  - **问题**: 管理面板的"发送通知"功能只保存到数据库，不发送邮件
  - **修复**: 集成Resend邮件服务，实现真正的邮件发送
  - **广播通知**: 向所有用户发送通知，包括数据库记录和邮件
  - **定向发送**: 向选定用户发送通知，包括数据库记录和邮件
  - **专业模板**: 使用精美的HTML邮件模板
  - **统计反馈**: 返回邮件发送成功/失败数量
  - **错误处理**: 完善的错误日志和异常处理
- 🔧 **技术改进**:
  - 修改 `src/routes/notifications.ts` 集成邮件发送
  - 使用 `utils/email.ts` 的 `sendEmail()` 函数
  - 添加 `RESEND_API_KEY` 环境变量检查
  - HTML邮件模板包含品牌样式和结构
  - 纯文本邮件作为备用
- ✅ **修复问题**: 管理员发送通知后，用户现在可以收到邮件

**V4.2.8 更新内容** (2025-10-15):
- 👤 **用户设置页面**（核心新功能）：
  - 点击导航栏用户名进入个人设置页面
  - **账号设置区域**：
    - 修改用户名（实时更新到系统）
    - 修改邮箱地址（验证邮箱唯一性）
    - 选择语言偏好：中文/English（保存到服务器）
  - **密码管理区域**：
    - 直接在设置页面修改密码
    - 需要验证当前密码才能修改
    - 密码强度验证（至少6个字符）
  - 精美的UI设计，分区清晰，操作方便
- 🌍 **语言偏好持久化**（核心功能）：
  - 系统默认英文版（首次访问）
  - 用户切换语言时自动保存偏好到服务器
  - 登录后自动应用用户的语言偏好
  - 支持所有登录方式：邮箱登录、注册、Google OAuth
  - 手动切换语言时实时同步到后端
- 📊 **数据库字段利用**：
  - users表中的language字段（zh/en）已存在
  - 新增API利用现有字段实现语言偏好功能
- 🔌 **新增API接口**：
  - GET /api/auth/settings（获取用户设置）
  - PUT /api/auth/settings（更新用户设置）
  - 支持部分更新（username/email/language可选）
- 🎨 **前端优化**：
  - 修改renderNavigation()使用户名可点击
  - 新增showUserSettings()函数显示设置页面
  - 新增handleSaveSettings()处理设置保存
  - 新增handleChangePasswordFromSettings()处理密码修改
  - 修改handleLanguageSwitch()自动保存语言偏好
  - 修改三个登录函数自动应用语言偏好
- 🌐 **国际化支持**：新增8个翻译键（userSettings, accountSettings, languagePreference, saveChanges, settingsUpdated, chinese, english, selectLanguage）
- ✅ **实现需求**：完成用户请求的语言偏好持久化和用户设置页面功能

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
�
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
