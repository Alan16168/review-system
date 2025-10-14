# 团队申请系统功能说明

## 功能概述

新增的团队申请系统允许用户申请加入公开团队，团队创建者可以审批这些申请。

## 📋 新增功能

### 1. **团队公开/私有设置**
- 创建团队时可选择"公开团队"选项
- 公开团队对所有用户可见，可接受加入申请
- 私有团队仅对成员可见

### 2. **团队管理界面（三个Tab）**

#### Tab 1: 我的团队
- 显示用户已加入的所有团队
- 显示团队的公开/私有状态
- 显示用户在团队中的角色（创建者/成员）
- 团队创建者可以删除团队

#### Tab 2: 公开团队
- 显示所有公开的团队
- 排除用户已加入的团队
- 每个团队显示：
  - 团队名称和描述
  - 创建者信息
  - 成员数量
  - "申请加入"按钮（如果未申请）
  - "申请审批中"状态（如果已申请）

#### Tab 3: 待审批
- 仅团队创建者可见
- 显示所有待处理的加入申请
- 每个申请显示：
  - 申请人用户名和邮箱
  - 申请的团队名称
  - 申请理由
  - 申请时间
  - "确认"和"拒绝"按钮

### 3. **申请流程**

#### 用户申请加入团队
1. 在"公开团队"tab查看可用团队
2. 点击"申请加入"按钮
3. 可选择输入申请理由
4. 提交后状态变为"申请审批中"

#### 团队创建者审批申请
1. 在"待审批"tab查看所有待处理申请
2. 查看申请人信息和申请理由
3. 选择"确认"或"拒绝"
4. 如果确认，申请人自动成为团队成员（角色：viewer）

## 🗄️ 数据库变更

### 1. Teams表新增字段
```sql
ALTER TABLE teams ADD COLUMN is_public INTEGER DEFAULT 0;
```

### 2. 新增Team Applications表
```sql
CREATE TABLE team_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  message TEXT,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  reviewed_by INTEGER,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### 3. 索引
```sql
CREATE INDEX idx_team_applications_team_id ON team_applications(team_id);
CREATE INDEX idx_team_applications_user_id ON team_applications(user_id);
CREATE INDEX idx_team_applications_status ON team_applications(status);
```

## 🔌 API 端点

### 获取团队列表（已更新）
```
GET /api/teams
Response: {
  myTeams: Array,      // 用户加入的团队
  publicTeams: Array   // 公开的团队（排除已加入的）
}
```

### 申请加入团队
```
POST /api/teams/:id/apply
Body: { message: string }
Response: { message: 'Application submitted successfully' }
```

### 获取待审批申请
```
GET /api/teams/applications/pending
Response: { applications: Array }
```

### 审批申请
```
POST /api/teams/:id/applications/:applicationId/review
Body: { action: 'approve' | 'reject' }
Response: { message: 'Application approved/rejected' }
```

### 创建团队（已更新）
```
POST /api/teams
Body: {
  name: string,
  description?: string,
  isPublic: boolean    // 新增字段
}
```

## 🎨 前端变更

### 新增函数
- `switchTeamsTab(tab)` - 切换团队管理tab
- `renderMyTeamsList(teams)` - 渲染我的团队
- `renderPublicTeamsList(teams)` - 渲染公开团队
- `renderApplicationsList(applications)` - 渲染待审批申请
- `applyToTeam(teamId)` - 申请加入团队
- `reviewApplication(teamId, applicationId, action)` - 审批申请

### 更新函数
- `loadTeams()` - 同时加载我的团队、公开团队和待审批申请
- `showTeams()` - 更新界面支持三个tab
- `handleCreateTeam()` - 支持公开/私有选项

## 📝 使用示例

### 场景1：用户申请加入公开团队
1. 登录系统（使用高级用户或管理员账号）
2. 点击"团队"菜单
3. 切换到"公开团队"tab
4. 找到想要加入的团队
5. 点击"申请加入"
6. 输入申请理由（可选）
7. 等待团队创建者审批

### 场景2：团队创建者审批申请
1. 登录系统（团队创建者账号）
2. 点击"团队"菜单
3. 切换到"待审批"tab（如果有待审批申请，会显示红色数字标记）
4. 查看申请人信息和申请理由
5. 点击"确认"批准申请，或点击"拒绝"拒绝申请
6. 如果批准，申请人立即成为团队成员

### 场景3：创建公开团队
1. 登录系统（高级用户或管理员账号）
2. 点击"团队"菜单
3. 点击"创建团队"按钮
4. 填写团队名称和描述
5. 勾选"公开团队（其他用户可申请加入）"选项
6. 点击"保存"
7. 团队创建成功后，会出现在"公开团队"列表中

## 🔒 权限控制

- 申请加入团队：所有高级用户和管理员
- 查看公开团队：所有高级用户和管理员
- 审批申请：仅团队创建者
- 创建公开/私有团队：所有高级用户和管理员

## 🎯 业务规则

1. 用户不能申请加入已经是成员的团队
2. 用户不能对同一团队提交多个待处理的申请
3. 只有公开团队才能接受申请
4. 批准的申请自动将用户添加为团队成员（角色：viewer）
5. 拒绝的申请可以重新申请
6. 待审批申请数量会显示在"待审批"tab上

## 🚀 部署说明

### 本地开发环境
数据库迁移已自动应用到本地D1数据库。

### 生产环境
需要执行以下步骤：
```bash
# 1. 应用数据库迁移到生产环境
cd /home/user/webapp
npx wrangler d1 execute review-system-production --command="ALTER TABLE teams ADD COLUMN is_public INTEGER DEFAULT 0;"
npx wrangler d1 execute review-system-production --file=./migrations/0012_add_team_applications.sql

# 2. 构建并部署
npm run build
npm run deploy:prod
```

## 📊 测试建议

1. **创建公开团队测试**
   - 使用高级用户账号创建一个公开团队
   - 验证团队在"我的团队"中显示，并标记为"公开"

2. **申请加入测试**
   - 使用另一个高级用户账号查看"公开团队"
   - 申请加入刚创建的团队
   - 验证申请状态显示为"申请审批中"

3. **审批申请测试**
   - 使用团队创建者账号查看"待审批"tab
   - 验证待审批数量显示正确
   - 批准申请
   - 验证申请人成为团队成员

4. **权限测试**
   - 验证普通用户无法访问团队功能
   - 验证非创建者无法看到"待审批"tab
   - 验证申请被批准后不能重复申请

## 版本信息

- **功能版本**: V4.2.0
- **开发日期**: 2025-10-14
- **数据库迁移**: 0012_add_team_applications.sql
