# 复盘系统 - Owner 和 Required 字段更新总结

## 更新时间
2025-11-16

## 更新目标

为复盘系统的每个问题类型增加两个新属性：

1. **Owner（答案可见性）**：控制答案的查看权限
2. **Required（是否必填）**：标识问题是否必须回答

## 已完成的工作

### ✅ 1. 数据库层面

#### 迁移文件
- 创建了 `migrations/0035_add_owner_and_required_fields.sql`
- 已应用到本地数据库
- 需要应用到生产环境：
  ```bash
  npx wrangler d1 migrations apply review-system-production
  ```

#### 新增字段

**template_questions 表**
```sql
-- owner 字段
owner TEXT DEFAULT 'public' CHECK(owner IN ('public', 'private'))

-- required 字段  
required TEXT DEFAULT 'no' CHECK(required IN ('yes', 'no'))
```

**字段说明**：

| 字段 | 类型 | 默认值 | 可选值 | 说明 |
|------|------|--------|--------|------|
| owner | TEXT | 'public' | 'public', 'private' | 公开=所有人可见，私人=仅回答者和创建者可见 |
| required | TEXT | 'no' | 'yes', 'no' | yes=必须回答，no=可选回答 |

### ✅ 2. 后端API层面

#### 更新的文件
- `src/routes/templates.ts` - 模板管理API
- `src/routes/reviews.ts` - 复盘查看API

#### 更新的端点

1. **GET /api/templates** - 获取所有模板（包含新字段）
2. **GET /api/templates/:id** - 获取单个模板（包含新字段）
3. **GET /api/templates/admin/:id** - 获取模板详情（包含新字段）
4. **POST /api/templates/:id/questions** - 添加问题（支持新字段）
5. **PUT /api/templates/:templateId/questions/:questionId** - 更新问题（支持新字段）
6. **GET /api/reviews/:id** - 获取复盘（包含新字段）

#### API 响应示例

```json
{
  "template": {
    "id": 1,
    "name": "Daily Review",
    "questions": [
      {
        "question_number": 1,
        "question_text": "What did you learn today?",
        "question_type": "text",
        "answer_length": 200,
        "owner": "public",      // 新字段
        "required": "yes"       // 新字段
      },
      {
        "question_number": 2,
        "question_text": "Personal reflections",
        "question_type": "text",
        "answer_length": 500,
        "owner": "private",     // 新字段
        "required": "no"        // 新字段
      }
    ]
  }
}
```

### ✅ 3. 前端翻译层面

#### 更新的文件
- `public/static/i18n.js`

#### 新增翻译

**中文**：
- answerOwner: 答案可见性
- answerOwnerPublic: 公开
- answerOwnerPrivate: 私人
- answerOwnerHint: 提示文本
- answerRequired: 是否必填
- answerRequiredYes: 必填
- answerRequiredNo: 可选
- answerRequiredHint: 提示文本

**英文**：
- answerOwner: Answer Visibility
- answerOwnerPublic: Public
- answerOwnerPrivate: Private
- answerOwnerHint: Hint text
- answerRequired: Required
- answerRequiredYes: Yes
- answerRequiredNo: No
- answerRequiredHint: Hint text

### ✅ 4. 文档

创建了以下文档：

1. **CHANGELOG_OWNER_REQUIRED.md** - 详细的更改日志
2. **TODO_FRONTEND_IMPLEMENTATION.md** - 前端实现指南
3. **SUMMARY.md** - 本文档

### ✅ 5. Git 提交

```bash
# 提交1: 数据库和API更新
commit 7c04449: Add owner and required fields to template questions

# 提交2: 前端实现待办文档
commit 3ce26c0: Add frontend implementation TODO for owner and required fields
```

## 待完成的工作

### ⏳ 1. 前端UI实现（高优先级）

#### 模板编辑功能
- [ ] 在问题编辑表单中添加 owner 选择器
- [ ] 在问题编辑表单中添加 required 选择器
- [ ] 在问题列表中显示必填和私人标识图标
- [ ] 保存和更新问题时传递新字段

#### 复盘编辑功能
- [ ] 在必填问题旁显示红色星号
- [ ] 实现必填问题的验证逻辑
- [ ] 提交时检查所有必填问题是否已回答
- [ ] 显示验证错误提示

#### 复盘查看功能
- [ ] 根据 owner 字段过滤答案显示
- [ ] 实现权限检查逻辑（仅回答者和创建者可见私人答案）
- [ ] 显示私人答案标识
- [ ] 显示权限提示信息

#### 复盘打印功能
- [ ] 打印前根据权限过滤私人答案
- [ ] 在打印版本中显示标识

### ⏳ 2. 生产环境部署

```bash
# 应用数据库迁移到生产环境
npx wrangler d1 migrations apply review-system-production

# 部署代码到 Cloudflare Pages
npm run deploy:prod
```

## 业务逻辑说明

### Owner 字段（答案可见性）

#### 规则
- **public（公开）**：默认值
  - 所有有权查看该复盘的人都能看到此答案
  - 适用于：团队分享、公开学习的内容
  
- **private（私人）**：
  - 只有两类人可以看到：
    1. 回答问题的人本人
    2. 创建这个复盘的人
  - 适用于：个人反思、敏感信息

#### 实现逻辑
```javascript
// 伪代码
function canViewAnswer(answer, question, currentUser, review) {
  if (question.owner === 'public') {
    return true; // 所有人都能看
  }
  
  if (question.owner === 'private') {
    // 只有回答者本人或复盘创建者能看
    return (
      currentUser.id === answer.user_id ||
      currentUser.id === review.creator_id
    );
  }
  
  return false;
}
```

### Required 字段（是否必填）

#### 规则
- **no（可选）**：默认值
  - 答案可以为空
  - 提交复盘时不强制要求填写
  
- **yes（必填）**：
  - 答案不能为空
  - 提交复盘时必须填写
  - UI 上显示红色星号标识

#### 实现逻辑
```javascript
// 伪代码
function validateRequiredQuestions(questions, answers) {
  const errors = [];
  
  questions.forEach(question => {
    if (question.required === 'yes') {
      const answer = answers[question.question_number];
      
      if (!answer || answer.trim() === '') {
        errors.push({
          questionNumber: question.question_number,
          message: '此问题为必填项'
        });
      }
    }
  });
  
  return errors;
}
```

## 测试场景

### 场景1：创建模板
1. 管理员创建新模板
2. 添加问题时设置：
   - 问题1：owner=public, required=yes
   - 问题2：owner=private, required=no
3. 保存后检查数据库字段是否正确

### 场景2：填写复盘
1. 用户基于模板创建复盘
2. 尝试提交：
   - 必填问题未填写 → 显示错误，阻止提交
   - 必填问题已填写 → 允许提交
3. 可选问题可以留空

### 场景3：查看复盘（权限测试）
1. **创建者查看**：
   - 可以看到所有答案（public + private）
   
2. **回答者查看**：
   - 可以看到所有 public 答案
   - 只能看到自己的 private 答案
   
3. **其他用户查看**：
   - 只能看到所有 public 答案
   - 看不到任何 private 答案

### 场景4：打印复盘
1. 打印前自动过滤私人答案
2. 只打印当前用户有权查看的内容
3. 显示适当的标识

## 向后兼容性

### 现有数据
- 所有现有问题的 `owner` 自动设为 'public'
- 所有现有问题的 `required` 自动设为 'no'
- 不影响现有功能

### 前端代码
```javascript
// 使用默认值确保兼容性
const owner = question.owner || 'public';
const required = question.required || 'no';
```

## 性能考虑

- 数据库已建立索引：
  ```sql
  CREATE INDEX idx_template_questions_owner ON template_questions(owner);
  CREATE INDEX idx_template_questions_required ON template_questions(required);
  ```
- 查询优化：在需要时才过滤私人答案
- 前端缓存：减少重复的权限检查

## 安全考虑

- 私人答案的过滤在后端和前端都要实现
- 后端验证用户身份和权限
- 前端UI隐藏无权查看的内容
- API响应不包含用户无权查看的私人答案

## 下一步行动

1. **立即执行**：
   - 查看 `TODO_FRONTEND_IMPLEMENTATION.md` 了解详细实现步骤
   - 从模板编辑功能开始实现前端UI

2. **测试验证**：
   - 在开发环境充分测试所有场景
   - 确保权限控制逻辑正确

3. **生产部署**：
   - 应用数据库迁移
   - 部署新代码
   - 监控系统运行

## 相关文档

- `CHANGELOG_OWNER_REQUIRED.md` - 详细更改记录
- `TODO_FRONTEND_IMPLEMENTATION.md` - 前端实现指南
- `migrations/0035_add_owner_and_required_fields.sql` - 数据库迁移文件

## 联系与支持

如有问题，请查看：
1. 本文档的业务逻辑说明部分
2. TODO 文档中的实现示例
3. CHANGELOG 中的技术细节

---

**状态**：
- 数据库：✅ 完成
- 后端API：✅ 完成
- 翻译：✅ 完成
- 前端UI：⏳ 待实现
- 生产部署：⏳ 待执行
