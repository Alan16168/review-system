# Template Owner Field Implementation Guide

## 概述
为模板系统添加 `owner` 属性字段，控制模板的可见性：
- `owner='private'`: 只有创建者和admin可以看见
- `owner='team'`: 只有团队成员、创建者和admin可以看见
- `owner='public'`: 所有人都可以看见（默认值）

## 1. 数据库迁移

✅ 已创建: `migrations/0037_add_template_owner_field.sql`

```sql
ALTER TABLE templates ADD COLUMN owner TEXT DEFAULT 'public' CHECK (owner IN ('private', 'team', 'public'));
CREATE INDEX IF NOT EXISTS idx_templates_owner ON templates(owner);
UPDATE templates SET owner = 'public' WHERE owner IS NULL;
```

**应用迁移**:
```bash
# 本地
npx wrangler d1 migrations apply review-system-production --local

# 生产
npx wrangler d1 migrations apply review-system-production
```

## 2. 后端API修改

### 文件: `src/routes/templates.ts`

#### A. 修改查询模板列表 (GET /)

**原代码** (约第33行):
```typescript
const templatesResult = await c.env.DB.prepare(`
  SELECT 
    id, 
    name,
    description,
    is_default, 
    created_at
  FROM templates
  WHERE is_active = 1
  ORDER BY is_default DESC, created_at DESC
`).all();
```

**修改为**:
```typescript
const user = c.get('user') as any;
const templatesResult = await c.env.DB.prepare(`
  SELECT 
    id, 
    name,
    description,
    is_default,
    owner,
    created_by,
    created_at
  FROM templates
  WHERE is_active = 1
    AND (
      owner = 'public'
      OR created_by = ?
      OR ? = 'admin'
      OR (owner = 'team' AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = ? AND tm.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = created_by
        )
      ))
    )
  ORDER BY is_default DESC, created_at DESC
`).bind(user.userId, user.role, user.userId).all();
```

#### B. 修改获取单个模板 (GET /:id)

**原代码** (约第86行):
```typescript
const template = await c.env.DB.prepare(`
  SELECT 
    id, 
    name,
    description,
    is_default, 
    created_at
  FROM templates
  WHERE id = ? AND is_active = 1
`).bind(templateId).first();
```

**修改为**:
```typescript
const user = c.get('user') as any;
const template = await c.env.DB.prepare(`
  SELECT 
    id, 
    name,
    description,
    is_default,
    owner,
    created_by,
    created_at
  FROM templates
  WHERE id = ? 
    AND is_active = 1
    AND (
      owner = 'public'
      OR created_by = ?
      OR ? = 'admin'
      OR (owner = 'team' AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = ? AND tm.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = created_by
        )
      ))
    )
`).bind(templateId, user.userId, user.role, user.userId).first();
```

#### C. 修改管理员获取所有模板 (GET /admin/all)

**添加** `owner` 字段到SELECT语句 (约第140行):
```typescript
SELECT 
  t.id, 
  t.name,
  t.description,
  t.is_default,
  t.is_active,
  t.owner,  -- 添加这行
  t.created_at,
  t.updated_at,
  t.created_by,
  u.username as creator_name,
  u.role as creator_role
FROM templates t
LEFT JOIN users u ON t.created_by = u.id
```

#### D. 修改创建模板 (POST /)

**找到创建模板的SQL** (约第200-250行之间):
```typescript
await c.env.DB.prepare(`
  INSERT INTO templates (name, description, is_default, is_active, created_by)
  VALUES (?, ?, ?, ?, ?)
`).bind(...).run();
```

**修改为**:
```typescript
const { name, description, is_default, is_active, owner } = await c.req.json();

// 验证 owner 值
if (owner && !['private', 'team', 'public'].includes(owner)) {
  return c.json({ error: 'Invalid owner value' }, 400);
}

await c.env.DB.prepare(`
  INSERT INTO templates (name, description, is_default, is_active, owner, created_by)
  VALUES (?, ?, ?, ?, ?, ?)
`).bind(name, description, is_default ? 1 : 0, is_active ? 1 : 0, owner || 'public', user.userId).run();
```

#### E. 修改更新模板 (PUT /:id)

**找到更新模板的SQL** (约第300-350行之间):
```typescript
await c.env.DB.prepare(`
  UPDATE templates
  SET name = ?, description = ?, is_default = ?, is_active = ?
  WHERE id = ?
`).bind(...).run();
```

**修改为**:
```typescript
const { name, description, is_default, is_active, owner } = await c.req.json();

// 验证 owner 值
if (owner && !['private', 'team', 'public'].includes(owner)) {
  return c.json({ error: 'Invalid owner value' }, 400);
}

await c.env.DB.prepare(`
  UPDATE templates
  SET name = ?, description = ?, is_default = ?, is_active = ?, owner = ?
  WHERE id = ?
`).bind(name, description, is_default ? 1 : 0, is_active ? 1 : 0, owner || 'public', templateId).run();
```

## 3. 国际化翻译

### 文件: `public/static/i18n.js`

**在中文翻译 (zh) 的模板管理部分添加** (约第625-716行之间):
```javascript
// Template Management
'templateManagement': '模板管理',
'templates': '模板',
'templateOwner': '模板可见性',
'templateOwnerPrivate': '私人',
'templateOwnerTeam': '团队',
'templateOwnerPublic': '公开',
'templateOwnerHint': '私人：仅创建者和管理员；团队：团队成员可见；公开：所有人可见',
'templateOwnerDescription': '选择谁可以查看和使用此模板',
```

**在英文翻译 (en) 的模板管理部分添加** (约第1355-1448行之间):
```javascript
// Template Management
'templateManagement': 'Template Management',
'templates': 'Templates',
'templateOwner': 'Template Visibility',
'templateOwnerPrivate': 'Private',
'templateOwnerTeam': 'Team',
'templateOwnerPublic': 'Public',
'templateOwnerHint': 'Private: Creator and admin only; Team: Team members; Public: Everyone',
'templateOwnerDescription': 'Choose who can view and use this template',
```

**在日文翻译 (ja) 的模板管理部分添加** (约第1950-2050行之间):
```javascript
// Template Management
'templateManagement': 'テンプレート管理',
'templates': 'テンプレート',
'templateOwner': 'テンプレートの可視性',
'templateOwnerPrivate': 'プライベート',
'templateOwnerTeam': 'チーム',
'templateOwnerPublic': '公開',
'templateOwnerHint': 'プライベート：作成者と管理者のみ；チーム：チームメンバー；公開：全員',
'templateOwnerDescription': 'このテンプレートを誰が表示して使用できるかを選択',
```

**在西班牙语翻译 (es) 添加** (如果存在es部分):
```javascript
'templateOwner': 'Visibilidad de Plantilla',
'templateOwnerPrivate': 'Privado',
'templateOwnerTeam': 'Equipo',
'templateOwnerPublic': 'Público',
'templateOwnerHint': 'Privado: Solo creador y admin; Equipo: Miembros del equipo; Público: Todos',
'templateOwnerDescription': 'Elija quién puede ver y usar esta plantilla',
```

## 4. 前端界面修改

### A. 模板管理界面 (showAdminTemplates函数)

**文件**: `public/static/app.js`

**查找** `showAdminTemplates` 函数 (约第4500-4800行之间)

**在模板列表表格的表头添加**:
```javascript
<thead>
  <tr class="bg-gray-50">
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('templateName')}</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('templateOwner')}</th>  <!-- 添加这列 -->
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('questionCount')}</th>
    ...
  </tr>
</thead>
```

**在模板列表的每一行添加**:
```javascript
<td class="px-6 py-4 whitespace-nowrap">
  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
    ${template.owner === 'private' ? 'bg-red-100 text-red-800' : 
      template.owner === 'team' ? 'bg-yellow-100 text-yellow-800' : 
      'bg-green-100 text-green-800'}">
    ${i18n.t('templateOwner' + template.owner.charAt(0).toUpperCase() + template.owner.slice(1))}
  </span>
</td>
```

### B. 创建/编辑模板模态框 (showCreateTemplateModal / showEditTemplateModal)

**查找** `showCreateTemplateModal` 或 `showEditTemplateModal` 函数

**在 is_active 复选框后添加** (约第4900-5100行之间):
```javascript
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    ${i18n.t('templateOwner')}
  </label>
  <select id="template-owner" 
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
    <option value="public" ${template?.owner === 'public' || !template ? 'selected' : ''}>
      ${i18n.t('templateOwnerPublic')} - ${i18n.t('templateOwnerHint').split(';')[2]}
    </option>
    <option value="team" ${template?.owner === 'team' ? 'selected' : ''}>
      ${i18n.t('templateOwnerTeam')} - ${i18n.t('templateOwnerHint').split(';')[1]}
    </option>
    <option value="private" ${template?.owner === 'private' ? 'selected' : ''}>
      ${i18n.t('templateOwnerPrivate')} - ${i18n.t('templateOwnerHint').split(';')[0]}
    </option>
  </select>
  <p class="mt-1 text-xs text-gray-500">${i18n.t('templateOwnerDescription')}</p>
</div>
```

**在创建模板的提交函数中添加** `owner` 字段:
```javascript
const templateData = {
  name: document.getElementById('template-name').value,
  description: document.getElementById('template-description').value,
  is_default: document.getElementById('template-is-default')?.checked || false,
  is_active: document.getElementById('template-is-active')?.checked || true,
  owner: document.getElementById('template-owner').value  // 添加这行
};
```

### C. 复盘创建界面 (showCreateReview函数)

**文件**: `public/static/app.js`

**查找** 模板选择下拉框 (约第2500-2800行之间)

**修改模板选择器，添加owner标识**:
```javascript
<select id="review-template" 
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        onchange="handleTemplateChange()">
  ${templates.map(t => `
    <option value="${t.id}">
      ${t.name} (${t.questions.length} ${i18n.t('questions')})
      ${t.owner !== 'public' ? ' 🔒 ' + i18n.t('templateOwner' + t.owner.charAt(0).toUpperCase() + t.owner.slice(1)) : ''}
    </option>
  `).join('')}
</select>
```

**或者在模板名称旁边显示小图标**:
```javascript
<option value="${t.id}">
  ${t.owner === 'private' ? '🔒 ' : t.owner === 'team' ? '👥 ' : ''}${t.name} (${t.questions.length})
</option>
```

## 5. 测试步骤

### 5.1 数据库测试
```bash
# 查看迁移是否成功
npx wrangler d1 execute review-system-production --local --command="SELECT * FROM templates LIMIT 1"

# 应该看到 owner 列
```

### 5.2 API测试

**创建私人模板**:
```bash
curl -X POST https://review-system.pages.dev/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "私人模板测试",
    "description": "这是一个私人模板",
    "owner": "private",
    "is_active": true
  }'
```

**获取模板列表**:
```bash
# 用创建者账号
curl https://review-system.pages.dev/api/templates \
  -H "Authorization: Bearer CREATOR_TOKEN"
# 应该看到私人模板

# 用其他用户账号
curl https://review-system.pages.dev/api/templates \
  -H "Authorization: Bearer OTHER_USER_TOKEN"
# 不应该看到私人模板（除非是admin）
```

### 5.3 前端测试

1. 登录管理员账号
2. 进入模板管理
3. 创建新模板，选择不同的 owner 类型
4. 用不同用户登录，验证模板可见性
5. 创建复盘时，检查模板列表是否正确过滤

## 6. 部署清单

- [ ] 应用数据库迁移（本地）
- [ ] 测试本地功能
- [ ] 更新package.json版本号（6.10.0 → 6.11.0）
- [ ] Git提交
- [ ] 推送到GitHub
- [ ] 构建项目
- [ ] 应用数据库迁移（生产）
- [ ] 部署到Cloudflare Pages
- [ ] 验证生产环境

## 7. 注意事项

1. **向后兼容**: 所有现有模板自动设置为 `owner='public'`
2. **权限检查**: 确保只有创建者和admin能修改模板的owner属性
3. **团队可见性**: `owner='team'` 需要查询team_members表来验证
4. **性能优化**: 已为owner字段创建索引
5. **UI提示**: 在选择owner时提供清晰的说明文字

## 8. 版本信息

- **版本**: V6.11.0
- **功能**: 模板owner属性（private/team/public）
- **日期**: 2025-11-17
- **影响**: 模板系统、复盘创建流程
