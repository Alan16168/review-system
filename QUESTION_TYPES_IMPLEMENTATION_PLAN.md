# 问题类型扩展 - 实施计划

## 需求概述

为模板管理系统添加三种答案类型：
1. **文字型** (现有) - 用户自由输入文字答案
2. **单选型** (新增) - 类似考试单选题，从A/B/C/D等选项中选择一个
3. **多选型** (新增) - 类似考试多选题，从A/B/C/D等选项中选择一个或多个

## 数据库设计

### 已完成的迁移 (0025_add_question_types.sql)

```sql
-- 新增字段到 template_questions 表
ALTER TABLE template_questions ADD COLUMN question_type TEXT DEFAULT 'text' 
  CHECK(question_type IN ('text', 'multiple_choice', 'single_choice'));

-- 选项存储 (JSON格式)
-- 例如: ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"]
ALTER TABLE template_questions ADD COLUMN options TEXT DEFAULT NULL;

-- 标准答案存储
-- 单选: "A" 或 "B" 或 "C"
-- 多选: "A,B,C" (逗号分隔)
-- 文字: NULL (无标准答案)
ALTER TABLE template_questions ADD COLUMN correct_answer TEXT DEFAULT NULL;
```

### review_answers 表
- 不需要修改
- 文字型答案：存储在 `answer` 字段
- 单选答案：存储 "A" 或 "B" 等
- 多选答案：存储 "A,B,C" 等逗号分隔格式

## 后端 API 修改

### 需要修改的端点

#### 1. POST /api/templates/:id/questions (创建问题)
**修改文件**: `src/routes/templates.ts`

```typescript
// 接受新字段
const { 
  question_text, 
  question_text_en, 
  question_type = 'text',  // 新增
  options = null,           // 新增
  correct_answer = null,    // 新增
  max_length 
} = await c.req.json();

// 验证
if (question_type === 'single_choice' || question_type === 'multiple_choice') {
  if (!options || !Array.isArray(JSON.parse(options))) {
    return c.json({ error: 'Options required for choice questions' }, 400);
  }
  if (!correct_answer) {
    return c.json({ error: 'Correct answer required for choice questions' }, 400);
  }
}

// 插入SQL
INSERT INTO template_questions 
  (template_id, question_number, question_text, question_text_en, 
   question_type, options, correct_answer, max_length)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

#### 2. PUT /api/templates/:templateId/questions/:id (更新问题)
- 同样接受和验证新字段
- 更新SQL包含新字段

#### 3. GET /api/templates/:id (获取模板详情)
- 返回数据中包含 question_type, options, correct_answer
- 前端需要这些数据来渲染不同类型的问题

## 前端UI修改

### 1. 管理后台 - 创建/编辑问题模态框

**文件**: `public/static/app.js`

**新增UI组件**:

```javascript
// 问题类型选择器
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    ${i18n.t('questionType')} *
  </label>
  <select id="question-type" class="w-full px-4 py-2 border rounded-lg"
          onchange="handleQuestionTypeChange()">
    <option value="text">${i18n.t('questionTypeText')}</option>
    <option value="single_choice">${i18n.t('questionTypeSingleChoice')}</option>
    <option value="multiple_choice">${i18n.t('questionTypeMultipleChoice')}</option>
  </select>
</div>

// 选项编辑器 (仅当选择单选/多选时显示)
<div id="options-container" class="hidden">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    ${i18n.t('choiceOptions')} *
  </label>
  <div id="options-list">
    <!-- 动态添加的选项输入框 -->
  </div>
  <button type="button" onclick="addOption()" 
          class="mt-2 text-indigo-600 hover:text-indigo-800">
    <i class="fas fa-plus mr-1"></i>${i18n.t('addOption')}
  </button>
</div>

// 标准答案选择器
<div id="correct-answer-container" class="hidden">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    ${i18n.t('correctAnswer')} *
    <span class="text-xs text-gray-500">${i18n.t('correctAnswerHint')}</span>
  </label>
  
  <!-- 单选: 使用 radio buttons -->
  <div id="single-choice-answer" class="hidden space-y-2">
    <!-- 根据选项动态生成 -->
  </div>
  
  <!-- 多选: 使用 checkboxes -->
  <div id="multiple-choice-answer" class="hidden space-y-2">
    <!-- 根据选项动态生成 -->
  </div>
</div>
```

**新增JavaScript函数**:

```javascript
// 处理问题类型变化
function handleQuestionTypeChange() {
  const type = document.getElementById('question-type').value;
  const optionsContainer = document.getElementById('options-container');
  const correctAnswerContainer = document.getElementById('correct-answer-container');
  
  if (type === 'text') {
    optionsContainer.classList.add('hidden');
    correctAnswerContainer.classList.add('hidden');
  } else {
    optionsContainer.classList.remove('hidden');
    correctAnswerContainer.classList.remove('hidden');
    updateCorrectAnswerUI(type);
  }
}

// 添加选项
let optionCount = 0;
function addOption() {
  const optionsList = document.getElementById('options-list');
  const letter = String.fromCharCode(65 + optionCount); // A, B, C, D...
  
  const optionDiv = document.createElement('div');
  optionDiv.className = 'flex items-center space-x-2 mb-2';
  optionDiv.innerHTML = `
    <span class="text-sm font-medium text-gray-700">${letter}.</span>
    <input type="text" 
           class="flex-1 px-3 py-2 border rounded-lg option-input" 
           placeholder="${i18n.t('optionPlaceholder')}"
           data-letter="${letter}">
    <button type="button" onclick="removeOption(this)" 
            class="text-red-600 hover:text-red-800">
      <i class="fas fa-trash"></i>
    </button>
  `;
  optionsList.appendChild(optionDiv);
  optionCount++;
  
  updateCorrectAnswerOptions();
}

// 删除选项
function removeOption(button) {
  button.parentElement.remove();
  updateCorrectAnswerOptions();
}

// 更新标准答案选择器
function updateCorrectAnswerOptions() {
  const type = document.getElementById('question-type').value;
  const options = document.querySelectorAll('.option-input');
  
  if (type === 'single_choice') {
    const container = document.getElementById('single-choice-answer');
    container.innerHTML = '';
    options.forEach((input, index) => {
      const letter = input.dataset.letter;
      const div = document.createElement('div');
      div.innerHTML = `
        <label class="flex items-center">
          <input type="radio" name="correct-answer-radio" value="${letter}" 
                 class="mr-2">
          <span>${letter}. ${input.value || '(未填写)'}</span>
        </label>
      `;
      container.appendChild(div);
    });
  } else if (type === 'multiple_choice') {
    const container = document.getElementById('multiple-choice-answer');
    container.innerHTML = '';
    options.forEach((input, index) => {
      const letter = input.dataset.letter;
      const div = document.createElement('div');
      div.innerHTML = `
        <label class="flex items-center">
          <input type="checkbox" class="correct-answer-checkbox" value="${letter}" 
                 class="mr-2">
          <span>${letter}. ${input.value || '(未填写)'}</span>
        </label>
      `;
      container.appendChild(div);
    });
  }
}

// 收集表单数据
function collectQuestionFormData() {
  const type = document.getElementById('question-type').value;
  const data = {
    question_text: document.getElementById('question-text').value,
    question_text_en: document.getElementById('question-text-en').value,
    question_type: type,
    max_length: document.getElementById('max-length')?.value || null
  };
  
  if (type === 'single_choice' || type === 'multiple_choice') {
    // 收集选项
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs).map(input => {
      return `${input.dataset.letter}. ${input.value}`;
    });
    data.options = JSON.stringify(options);
    
    // 收集标准答案
    if (type === 'single_choice') {
      const selected = document.querySelector('input[name="correct-answer-radio"]:checked');
      data.correct_answer = selected ? selected.value : null;
    } else {
      const checked = document.querySelectorAll('.correct-answer-checkbox:checked');
      const answers = Array.from(checked).map(cb => cb.value);
      data.correct_answer = answers.join(',');
    }
  }
  
  return data;
}
```

### 2. 复盘创建/编辑 - 显示选择题

**文件**: `public/static/app.js` - showCreateReviewStep2() 函数

```javascript
// 根据问题类型渲染不同的输入界面
questions.forEach(q => {
  if (q.question_type === 'single_choice') {
    // 单选题 - 使用 radio buttons
    const options = JSON.parse(q.options || '[]');
    html += `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          ${q.question_number}. ${escapeHtml(q.question_text)}
        </label>
        <div class="space-y-2">
          ${options.map(opt => {
            const letter = opt.charAt(0);
            return `
              <label class="flex items-center p-2 border rounded hover:bg-gray-50">
                <input type="radio" name="question-${q.question_number}" 
                       value="${letter}" class="mr-2">
                <span>${escapeHtml(opt)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (q.question_type === 'multiple_choice') {
    // 多选题 - 使用 checkboxes
    const options = JSON.parse(q.options || '[]');
    html += `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          ${q.question_number}. ${escapeHtml(q.question_text)}
          <span class="text-xs text-gray-500">(可多选)</span>
        </label>
        <div class="space-y-2">
          ${options.map(opt => {
            const letter = opt.charAt(0);
            return `
              <label class="flex items-center p-2 border rounded hover:bg-gray-50">
                <input type="checkbox" class="question-${q.question_number}-checkbox" 
                       value="${letter}" class="mr-2">
                <span>${escapeHtml(opt)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    // 文字题 - 使用 textarea (现有逻辑)
    html += `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          ${q.question_number}. ${escapeHtml(q.question_text)}
        </label>
        <textarea id="answer-${q.question_number}" rows="4"
                  class="w-full px-4 py-2 border rounded-lg"></textarea>
      </div>
    `;
  }
});
```

**收集答案的函数需要修改**:

```javascript
function collectAnswers() {
  const answers = {};
  
  questions.forEach(q => {
    const qNum = q.question_number;
    
    if (q.question_type === 'single_choice') {
      const selected = document.querySelector(`input[name="question-${qNum}"]:checked`);
      answers[qNum] = selected ? selected.value : '';
    } else if (q.question_type === 'multiple_choice') {
      const checked = document.querySelectorAll(`.question-${qNum}-checkbox:checked`);
      const values = Array.from(checked).map(cb => cb.value);
      answers[qNum] = values.join(',');
    } else {
      const textarea = document.getElementById(`answer-${qNum}`);
      answers[qNum] = textarea ? textarea.value : '';
    }
  });
  
  return answers;
}
```

### 3. 复盘查看 - 显示用户选择的答案

**文件**: `public/static/app.js` - showReviewDetail() 函数

```javascript
// 显示答案时，根据问题类型格式化显示
if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
  const options = JSON.parse(q.options || '[]');
  const userAnswer = ans.answer; // "A" 或 "A,B,C"
  const selectedLetters = userAnswer.split(',');
  
  // 高亮用户选择的选项
  const optionsHtml = options.map(opt => {
    const letter = opt.charAt(0);
    const isSelected = selectedLetters.includes(letter);
    const isCorrect = q.correct_answer?.split(',').includes(letter);
    
    return `
      <div class="p-2 border rounded ${isSelected ? 'bg-blue-50 border-blue-300' : ''}">
        ${isSelected ? '<i class="fas fa-check-circle text-blue-600 mr-2"></i>' : ''}
        ${escapeHtml(opt)}
        ${isCorrect ? '<i class="fas fa-star text-yellow-500 ml-2" title="标准答案"></i>' : ''}
      </div>
    `;
  }).join('');
  
  answerHtml = optionsHtml;
} else {
  // 文字型答案 (现有逻辑)
  answerHtml = escapeHtml(ans.answer);
}
```

## 工作量估算

- **后端API修改**: 30分钟
- **管理后台UI**: 90分钟
- **复盘创建/编辑UI**: 45分钟
- **复盘查看UI**: 30分钟
- **测试**: 30分钟
- **部署**: 15分钟

**总计**: 约3.5小时

## 风险和注意事项

1. **向后兼容**: 现有的文字型问题必须继续正常工作
2. **数据验证**: 必须验证选项和标准答案的格式
3. **UI复杂度**: 选项编辑器需要动态添加/删除功能
4. **生产数据库**: 需要在生产环境应用迁移

## 测试计划

### 单元测试
1. 创建文字型问题 (现有功能)
2. 创建单选型问题 (新功能)
3. 创建多选型问题 (新功能)
4. 编辑各类型问题
5. 删除各类型问题

### 集成测试
1. 使用包含不同类型问题的模板创建复盘
2. 回答文字型问题
3. 选择单选答案
4. 选择多选答案（选择多个）
5. 查看复盘详情，验证答案正确显示
6. 验证标准答案显示

### 边界测试
1. 不提供选项时尝试创建选择题（应报错）
2. 不选择标准答案时尝试创建选择题（应报错）
3. 添加20个选项（测试UI性能）
4. 选择全部选项作为多选答案

## 下一步行动

请确认是否继续实现此功能。由于工作量较大，我建议：

1. **方案A**: 完整实现（3.5小时）- 包含所有UI和功能
2. **方案B**: 分阶段实现 - 先完成后端和基础UI（1.5小时），然后逐步完善
3. **方案C**: 简化版本 - 只实现单选型（1.5小时），多选型后续添加

请告诉我您希望采用哪个方案？
