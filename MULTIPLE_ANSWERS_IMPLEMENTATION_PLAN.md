# 多答案功能实现计划

## 概述
为每个复盘问题支持多个答案，每个答案记录创建时间，用户可以添加/删除答案。

## 数据库变更 ✅ 已完成

### Migration 0028: `allow_multiple_answers_per_question.sql`
- ✅ 移除 `UNIQUE(review_id, user_id, question_number)` 约束
- ✅ 保留 `created_at` 字段（已存在）
- ✅ 允许同一用户对同一问题创建多个答案

## 后端API修改（需要实现）

### 1. GET /api/reviews/:id - 获取复盘详情
**当前行为**: 返回每个问题的单个答案
**新行为**: 返回每个问题的答案数组（包含多个答案及其创建时间）

```typescript
// 当前结构
answersByQuestion: {
  "1": [{ user_id, username, answer, updated_at }]
}

// 新结构 
answersByQuestion: {
  "1": [
    { id, user_id, username, answer, created_at, updated_at },
    { id, user_id, username, answer, created_at, updated_at }
  ]
}
```

**修改文件**: `src/routes/reviews.ts` (line ~370)

### 2. PUT /api/reviews/:id/my-answer/:questionNumber - 保存答案
**当前行为**: 更新或插入单个答案（UPSERT）
**新行为**: 总是插入新答案（INSERT）

**修改文件**: `src/routes/reviews.ts` (line ~600)

### 3. DELETE /api/reviews/:id/answer/:answerId - 删除特定答案
**当前行为**: 通过 user_id 和 question_number 删除
**新行为**: 通过 answer_id 删除特定答案

**修改文件**: `src/routes/reviews.ts` (line ~650)

## 前端修改（需要实现）

### 1. 编辑复盘界面 - `showEditReview()` 函数

#### A. 显示现有答案（带时间戳）
```html
<div class="answer-list">
  <div class="answer-item" data-answer-id="123">
    <div class="answer-header">
      <span class="answer-time">2025-11-12 10:30:25</span>
      <button onclick="deleteAnswer(123)" class="delete-btn">
        <i class="fas fa-minus-circle text-red-600"></i>
      </button>
    </div>
    <textarea class="answer-content" readonly>答案内容...</textarea>
  </div>
</div>
```

#### B. 添加新答案按钮
```html
<button onclick="addNewAnswer(questionNumber)" class="add-answer-btn">
  <i class="fas fa-plus-circle text-green-600"></i> 添加新答案
</button>
```

#### C. 新答案输入框
```html
<textarea id="new-answer-{questionNumber}" 
          class="new-answer-input" 
          placeholder="输入新答案..."></textarea>
```

**修改文件**: `public/static/app.js` (showEditReview函数, line ~3200)

### 2. 保存逻辑修改 - `handleEditReview()` 函数

```javascript
// 当前逻辑：收集每个问题的一个答案
// 新逻辑：只收集新添加的答案

const newAnswers = {};
questions.forEach(q => {
  const newAnswerElem = document.getElementById(`new-answer-${q.question_number}`);
  if (newAnswerElem && newAnswerElem.value.trim()) {
    newAnswers[q.question_number] = newAnswerElem.value.trim();
  }
});

// 发送新答案到API
for (const [questionNum, answer] of Object.entries(newAnswers)) {
  await axios.put(`/api/reviews/${id}/my-answer/${questionNum}`, { answer });
}
```

**修改文件**: `public/static/app.js` (handleEditReview函数, line ~3414)

### 3. 查看复盘界面 - `showReviewDetail()` 函数

显示每个问题的所有答案（带时间戳）：

```html
<div class="question">
  <h3>问题1: 我的目标是什么？</h3>
  
  <!-- 答案列表 -->
  <div class="answers-list">
    <div class="answer-card">
      <div class="answer-meta">
        <span class="author">张三</span>
        <span class="time">2025-11-10 14:30:25</span>
      </div>
      <div class="answer-content">答案内容...</div>
    </div>
    
    <div class="answer-card">
      <div class="answer-meta">
        <span class="author">李四</span>
        <span class="time">2025-11-11 09:15:10</span>
      </div>
      <div class="answer-content">另一个答案...</div>
    </div>
  </div>
</div>
```

**修改文件**: `public/static/app.js` (showReviewDetail函数, line ~2100)

### 4. 新增JavaScript函数

```javascript
// 添加新答案输入框
function addNewAnswer(questionNumber) {
  const container = document.getElementById(`answer-container-${questionNumber}`);
  const textarea = document.createElement('textarea');
  textarea.id = `new-answer-${questionNumber}`;
  textarea.className = 'w-full px-4 py-3 border rounded-lg';
  textarea.placeholder = i18n.t('enterNewAnswer');
  textarea.rows = 4;
  container.appendChild(textarea);
  
  // 隐藏添加按钮，显示取消按钮
  document.getElementById(`add-btn-${questionNumber}`).classList.add('hidden');
  document.getElementById(`cancel-btn-${questionNumber}`).classList.remove('hidden');
}

// 取消添加新答案
function cancelNewAnswer(questionNumber) {
  const newAnswerElem = document.getElementById(`new-answer-${questionNumber}`);
  if (newAnswerElem) {
    newAnswerElem.remove();
  }
  
  // 显示添加按钮，隐藏取消按钮
  document.getElementById(`add-btn-${questionNumber}`).classList.remove('hidden');
  document.getElementById(`cancel-btn-${questionNumber}`).classList.add('hidden');
}

// 删除答案
async function deleteAnswer(answerId, reviewId, questionNumber) {
  if (!confirm(i18n.t('confirmDeleteAnswer'))) return;
  
  try {
    await axios.delete(`/api/reviews/${reviewId}/answer/${answerId}`);
    showNotification(i18n.t('deleteSuccess'), 'success');
    // 重新加载编辑页面
    showEditReview(reviewId);
  } catch (error) {
    showNotification(i18n.t('operationFailed'), 'error');
  }
}
```

## 国际化翻译（需要添加）

```javascript
// 中文
'enterNewAnswer': '输入新答案...',
'addNewAnswer': '添加新答案',
'confirmDeleteAnswer': '确定要删除这个答案吗？',
'answerCreatedAt': '创建于',
'noAnswersYet': '还没有答案',

// English
'enterNewAnswer': 'Enter new answer...',
'addNewAnswer': 'Add New Answer',
'confirmDeleteAnswer': 'Are you sure you want to delete this answer?',
'answerCreatedAt': 'Created at',
'noAnswersYet': 'No answers yet',

// 日本語
'enterNewAnswer': '新しい回答を入力...',
'addNewAnswer': '新しい回答を追加',
'confirmDeleteAnswer': 'この回答を削除してもよろしいですか？',
'answerCreatedAt': '作成日時',
'noAnswersYet': 'まだ回答がありません',

// Español
'enterNewAnswer': 'Ingrese nueva respuesta...',
'addNewAnswer': 'Agregar Nueva Respuesta',
'confirmDeleteAnswer': '¿Está seguro de que desea eliminar esta respuesta?',
'answerCreatedAt': 'Creado el',
'noAnswersYet': 'Aún no hay respuestas',
```

## UI设计考虑

### 1. 答案时间戳格式
- 使用相对时间："2小时前"、"3天前"
- 悬停显示完整时间："2025-11-12 14:30:25"

### 2. 颜色主题
- 添加按钮：绿色 (text-green-600)
- 删除按钮：红色 (text-red-600)
- 答案卡片：浅灰背景 (bg-gray-50)

### 3. 布局
- 每个问题下方显示所有答案
- 答案按创建时间倒序排列（最新的在上面）
- 新答案输入框在现有答案下方

## 测试清单

- [ ] 创建新复盘，添加答案
- [ ] 编辑现有复盘，添加第二个答案
- [ ] 删除答案
- [ ] 查看带多个答案的复盘
- [ ] 团队复盘：多个成员各自添加多个答案
- [ ] 不同语言界面测试（中/英/日/西）
- [ ] 时间戳显示正确

## 实施步骤

1. ✅ 数据库迁移（已完成）
2. ⏸️ 后端API修改（待实施）
3. ⏸️ 前端编辑界面（待实施）
4. ⏸️ 前端查看界面（待实施）
5. ⏸️ 国际化翻译（待实施）
6. ⏸️ 测试和调试（待实施）

## 注意事项

1. **向后兼容**: 现有的单答案数据将继续工作
2. **性能**: 答案数量多时需要分页显示
3. **权限**: 用户只能删除自己的答案，创建者可以删除所有答案
4. **UI响应**: 添加/删除答案后需要平滑的UI更新
