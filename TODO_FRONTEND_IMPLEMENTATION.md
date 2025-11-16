# 前端实现待办事项 - Owner 和 Required 字段

## 概述
数据库和后端API已经完全支持 `owner`（答案可见性）和 `required`（是否必填）字段。
现在需要在前端实现相应的UI和业务逻辑。

## 1. 模板编辑功能

### 位置
管理后台 → 模板管理 → 编辑模板 → 问题列表

### 需要添加的UI组件

#### 1.1 问题表单中添加两个新字段

```html
<!-- 答案可见性选择器 -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    <i class="fas fa-eye mr-1"></i>
    ${t('answerOwner')}
    <span class="text-gray-500 text-xs ml-2">${t('answerOwnerHint')}</span>
  </label>
  <select id="questionOwner" class="w-full px-3 py-2 border rounded-lg">
    <option value="public">${t('answerOwnerPublic')}</option>
    <option value="private">${t('answerOwnerPrivate')}</option>
  </select>
</div>

<!-- 是否必填选择器 -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    <i class="fas fa-asterisk mr-1"></i>
    ${t('answerRequired')}
    <span class="text-gray-500 text-xs ml-2">${t('answerRequiredHint')}</span>
  </label>
  <select id="questionRequired" class="w-full px-3 py-2 border rounded-lg">
    <option value="no">${t('answerRequiredNo')}</option>
    <option value="yes">${t('answerRequiredYes')}</option>
  </select>
</div>
```

#### 1.2 添加问题时包含这两个字段

```javascript
// 在 addQuestionToTemplate 或类似函数中
const questionData = {
  question_text: questionText,
  question_number: questionNumber,
  answer_length: answerLength,
  question_type: questionType,
  options: options,
  correct_answer: correctAnswer,
  owner: document.getElementById('questionOwner').value, // 新增
  required: document.getElementById('questionRequired').value // 新增
};
```

#### 1.3 编辑问题时显示和更新这两个字段

```javascript
// 在 editQuestion 或类似函数中
document.getElementById('questionOwner').value = question.owner || 'public';
document.getElementById('questionRequired').value = question.required || 'no';
```

#### 1.4 问题列表中显示图标标识

```html
<!-- 在问题列表中添加图标 -->
<div class="question-item">
  <span class="question-number">Q${question.question_number}</span>
  <span class="question-text">${question.question_text}</span>
  
  <!-- 必填标识 -->
  ${question.required === 'yes' ? 
    '<span class="badge badge-required" title="' + t('answerRequiredYes') + '">
      <i class="fas fa-asterisk text-red-500"></i>
    </span>' : ''}
  
  <!-- 私人标识 -->
  ${question.owner === 'private' ? 
    '<span class="badge badge-private" title="' + t('answerOwnerPrivate') + '">
      <i class="fas fa-lock text-gray-500"></i>
    </span>' : ''}
  
  <div class="question-actions">...</div>
</div>
```

## 2. 复盘编辑功能

### 位置
我的复盘 → 编辑复盘

### 需要实现的功能

#### 2.1 显示必填标识

```html
<!-- 在问题标题旁显示必填星号 -->
<div class="question-header">
  <h3 class="question-title">
    ${question.question_text}
    ${question.required === 'yes' ? 
      '<span class="text-red-500 ml-1" title="' + t('answerRequiredYes') + '">*</span>' : ''}
  </h3>
</div>
```

#### 2.2 表单验证

```javascript
// 在提交复盘时验证必填问题
function validateReviewAnswers(questions, answers) {
  const errors = [];
  
  questions.forEach(question => {
    if (question.required === 'yes') {
      const answer = answers[question.question_number];
      
      // 检查答案是否为空
      if (!answer || answer.trim() === '') {
        errors.push({
          questionNumber: question.question_number,
          questionText: question.question_text,
          message: t('answerRequiredYes')
        });
      }
    }
  });
  
  if (errors.length > 0) {
    // 显示错误提示
    showValidationErrors(errors);
    return false;
  }
  
  return true;
}

// 在保存前调用验证
async function saveReview() {
  const isValid = validateReviewAnswers(currentQuestions, currentAnswers);
  if (!isValid) {
    return; // 阻止保存
  }
  
  // 继续保存逻辑...
}
```

#### 2.3 实时验证提示

```javascript
// 为必填问题添加实时验证
function setupRequiredFieldValidation() {
  document.querySelectorAll('.answer-input').forEach(input => {
    const questionNumber = input.dataset.questionNumber;
    const question = currentQuestions.find(q => q.question_number === questionNumber);
    
    if (question && question.required === 'yes') {
      input.addEventListener('blur', () => {
        if (!input.value.trim()) {
          showFieldError(input, t('answerRequiredYes'));
        } else {
          clearFieldError(input);
        }
      });
    }
  });
}
```

## 3. 复盘查看功能

### 位置
我的复盘 → 查看复盘
公开复盘 → 查看复盘
团队复盘 → 查看复盘

### 需要实现的功能

#### 3.1 答案可见性过滤

```javascript
// 根据 owner 字段过滤答案
function filterAnswersByPermission(question, answers, currentUserId, reviewCreatorId) {
  if (question.owner === 'public') {
    // 公开答案，所有人可见
    return answers;
  } else if (question.owner === 'private') {
    // 私人答案，仅回答者和复盘创建者可见
    return answers.filter(answer => 
      answer.user_id === currentUserId || // 是回答者本人
      currentUserId === reviewCreatorId    // 是复盘创建者
    );
  }
  return answers;
}

// 在渲染答案时使用过滤函数
function renderQuestionWithAnswers(question, allAnswers, currentUserId, reviewCreatorId) {
  const visibleAnswers = filterAnswersByPermission(
    question, 
    allAnswers, 
    currentUserId, 
    reviewCreatorId
  );
  
  return `
    <div class="question">
      <h3>${question.question_text}</h3>
      ${renderAnswers(visibleAnswers)}
      ${visibleAnswers.length === 0 ? '<p class="text-gray-500">' + t('noAnswersYet') + '</p>' : ''}
    </div>
  `;
}
```

#### 3.2 私人答案标识

```html
<!-- 为私人答案添加视觉标识 -->
<div class="answer-item">
  ${question.owner === 'private' ? 
    '<span class="badge badge-private">
      <i class="fas fa-lock mr-1"></i>
      ' + t('answerOwnerPrivate') + '
    </span>' : ''}
  <div class="answer-content">${answer.answer}</div>
</div>
```

#### 3.3 权限提示

```javascript
// 当用户无权查看某些答案时显示提示
function showPermissionHint(question, totalAnswerCount, visibleAnswerCount) {
  if (question.owner === 'private' && totalAnswerCount > visibleAnswerCount) {
    const hiddenCount = totalAnswerCount - visibleAnswerCount;
    return `
      <div class="permission-hint text-sm text-gray-500 italic mt-2">
        <i class="fas fa-info-circle mr-1"></i>
        ${t('someAnswersHidden').replace('{count}', hiddenCount)}
      </div>
    `;
  }
  return '';
}
```

## 4. 复盘打印功能

### 位置
我的复盘 → 查看复盘 → 打印按钮

### 需要实现的功能

#### 4.1 打印前过滤私人答案

```javascript
function prepareReviewForPrint(review, currentUserId) {
  const printData = { ...review };
  
  // 过滤每个问题的答案
  printData.questions = review.questions.map(question => {
    const filteredAnswers = filterAnswersByPermission(
      question,
      question.answers || [],
      currentUserId,
      review.creator_id
    );
    
    return {
      ...question,
      answers: filteredAnswers
    };
  });
  
  return printData;
}

// 在打印函数中使用
function printReview(reviewId) {
  const review = getCurrentReview();
  const currentUserId = getCurrentUser().id;
  const printableReview = prepareReviewForPrint(review, currentUserId);
  
  // 生成打印内容
  const printContent = generatePrintHTML(printableReview);
  
  // 打开打印窗口
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}
```

#### 4.2 打印样式中添加私人标识

```css
/* 打印样式 */
@media print {
  .badge-private {
    border: 1px solid #666;
    padding: 2px 6px;
    font-size: 10px;
  }
  
  .badge-required {
    color: #dc2626;
  }
}
```

## 5. 需要添加的翻译

```javascript
// 中文
'someAnswersHidden': '有 {count} 个答案因权限设置而隐藏',
'noAnswersYet': '暂无答案',

// 英文
'someAnswersHidden': '{count} answer(s) hidden due to privacy settings',
'noAnswersYet': 'No answers yet',
```

## 6. 测试场景

### 6.1 模板编辑测试
- [ ] 创建新问题时可以设置 owner 和 required
- [ ] 编辑现有问题时可以修改 owner 和 required
- [ ] 问题列表正确显示必填和私人标识
- [ ] 保存后字段值正确存储到数据库

### 6.2 复盘编辑测试
- [ ] 必填问题显示红色星号
- [ ] 提交时验证所有必填问题已回答
- [ ] 空必填问题显示错误提示
- [ ] 填写后错误提示消失

### 6.3 复盘查看测试
- [ ] 公开答案：所有用户都能看到
- [ ] 私人答案：只有回答者和创建者能看到
- [ ] 其他用户看不到私人答案
- [ ] 显示适当的权限提示

### 6.4 打印测试
- [ ] 打印内容包含所有有权限的答案
- [ ] 私人答案根据权限正确过滤
- [ ] 打印样式正确显示标识

## 7. 优先级

1. **高优先级**（核心功能）
   - 模板编辑：添加 owner 和 required 字段
   - 复盘编辑：必填验证
   - 复盘查看：私人答案过滤

2. **中优先级**（用户体验）
   - 视觉标识（图标、徽章）
   - 实时验证提示
   - 权限提示信息

3. **低优先级**（锦上添花）
   - 打印功能优化
   - 动画效果
   - 详细的帮助文档

## 8. 实现步骤建议

1. **第一步**：在模板编辑界面添加两个新字段的UI
2. **第二步**：实现模板编辑时的保存和更新逻辑
3. **第三步**：在复盘编辑界面添加必填验证
4. **第四步**：在复盘查看界面实现私人答案过滤
5. **第五步**：更新打印功能支持权限过滤
6. **第六步**：添加视觉标识和提示
7. **第七步**：全面测试各个场景

## 注意事项

- 所有逻辑都要考虑向后兼容性（旧问题可能没有这些字段）
- 使用默认值：owner='public', required='no'
- 确保翻译支持中英文
- 保持UI一致性和用户友好性
