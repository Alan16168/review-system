# 数据库字段更新：owner 和 required

## 更新日期
2025-11-16

## 更新内容

### 1. 数据库迁移

创建了新的迁移文件：`migrations/0035_add_owner_and_required_fields.sql`

为 `template_questions` 表增加了两个新字段：

#### 字段一：owner（答案可见性）
- **类型**: TEXT
- **默认值**: 'public'（公开）
- **可选值**: 
  - 'public'（公开）：所有有权查看该复盘的人都可以看到此答案
  - 'private'（私人）：只有回答问题的人（创建答案的人）和复盘的创建人可以看到此答案
- **用途**: 控制答案的可见权限

#### 字段二：required（答案必填属性）
- **类型**: TEXT
- **默认值**: 'no'（可选）
- **可选值**:
  - 'yes'（必填）：该答案必须回答，不能为空
  - 'no'（可选）：该答案可选回答，可以为空
- **用途**: 标识该问题是否必须回答

### 2. 后端API更新

#### 文件：`src/routes/templates.ts`

更新了以下API端点以支持新字段：

1. **GET /api/templates** - 获取所有模板
   - 返回的问题列表现在包含 `owner` 和 `required` 字段

2. **GET /api/templates/:id** - 获取单个模板
   - 返回的问题列表现在包含 `owner` 和 `required` 字段

3. **GET /api/templates/admin/:id** - 管理员获取模板详情
   - 返回的问题列表现在包含 `owner` 和 `required` 字段

4. **POST /api/templates/:id/questions** - 添加新问题
   - 接受 `owner` 和 `required` 参数（带默认值）
   - 插入数据库时包含这两个字段

5. **PUT /api/templates/:templateId/questions/:questionId** - 更新问题
   - 接受 `owner` 和 `required` 参数（带默认值）
   - 更新数据库时包含这两个字段

#### 文件：`src/routes/reviews.ts`

更新了获取复盘详情的API：

1. **GET /api/reviews/:id** - 获取复盘详情
   - 返回的模板问题现在包含 `owner` 和 `required` 字段
   - 前端可以基于这些字段进行权限控制和必填验证

### 3. 前端翻译更新

#### 文件：`public/static/i18n.js`

添加了新的翻译条目：

**中文翻译：**
```javascript
'answerOwner': '答案可见性',
'answerOwnerPublic': '公开',
'answerOwnerPrivate': '私人',
'answerOwnerHint': '公开：所有有权查看复盘的人均可见；私人：仅回答者和复盘创建者可见',
'answerRequired': '是否必填',
'answerRequiredYes': '必填',
'answerRequiredNo': '可选',
'answerRequiredHint': '必填：答案不能为空；可选：答案可以为空',
```

**英文翻译：**
```javascript
'answerOwner': 'Answer Visibility',
'answerOwnerPublic': 'Public',
'answerOwnerPrivate': 'Private',
'answerOwnerHint': 'Public: visible to all with review access; Private: only visible to answerer and review creator',
'answerRequired': 'Required',
'answerRequiredYes': 'Yes',
'answerRequiredNo': 'No',
'answerRequiredHint': 'Yes: answer cannot be empty; No: answer can be empty',
```

## 待实现功能

### 前端需要实现的功能

1. **模板编辑功能** - 需要在模板编辑界面添加以下控件：
   - 答案可见性选择器（公开/私人）
   - 是否必填选择器（必填/可选）
   - 相应的表单验证逻辑

2. **复盘编辑功能** - 需要实现：
   - 根据 `required` 字段验证必填问题
   - 提交时检查所有必填问题是否已回答
   - 显示必填标识（如红色星号）

3. **复盘查看功能** - 需要实现：
   - 根据 `owner` 字段和当前用户权限过滤显示答案
   - 如果答案是 'private' 且当前用户不是回答者或复盘创建者，则隐藏该答案
   - 显示适当的权限提示

4. **复盘打印功能** - 需要实现：
   - 打印时根据 `owner` 字段过滤答案
   - 确保私人答案只在有权限的情况下打印

## 数据库状态

- ✅ 本地数据库已应用迁移
- ⏳ 生产数据库需要执行：`npx wrangler d1 migrations apply review-system-production`

## 测试建议

1. 创建新模板时测试 owner 和 required 字段的默认值
2. 编辑现有模板问题，测试字段更新
3. 创建复盘并测试：
   - 必填问题的验证
   - 私人答案的可见性控制
4. 测试不同用户角色查看复盘时的答案可见性

## 备注

- 所有现有问题的 `owner` 默认为 'public'
- 所有现有问题的 `required` 默认为 'no'
- 后端API已完全支持，前端UI需要进一步实现
