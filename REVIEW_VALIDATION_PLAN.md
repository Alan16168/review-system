# 复盘编辑界面验证功能实现计划

## 📋 需要实现的功能

### 1. 必填字段验证 (Required Validation)

**触发时机**：用户提交/保存复盘时

**验证逻辑**：
- 检查所有 `required='yes'` 的问题
- 确保这些问题的答案不为空（trim后长度>0）
- 如果有空答案，阻止提交并显示错误提示

**需要修改的函数**：
1. `handleEditReview()` - 保存复盘时验证
2. `submitNewAnswerSet()` - 提交答案集合时验证

### 2. 私人答案过滤 (Private Answer Filtering)

**触发时机**：查看复盘详情时

**过滤逻辑**：
- 对于 `owner='private'` 的问题
- 只显示以下情况的答案：
  - 当前用户是答案的创建者
  - 或当前用户是复盘的创建者
- 其他用户的私人答案显示提示文字："此答案为私人答案，仅回答者和复盘创建者可见"

**需要修改的函数**：
1. `showReviewDetail()` - 查看复盘详情时过滤
2. `showEditReview()` - 编辑复盘时过滤（如果适用）

## 🔧 实现细节

### 1. 必填字段验证函数

```javascript
// 验证必填问题是否已回答
function validateRequiredQuestions(questions, answers) {
  const errors = [];
  
  questions.forEach(q => {
    if (q.required === 'yes') {
      const answer = answers[q.question_number];
      
      // 检查不同类型问题的答案
      let isEmpty = false;
      
      if (q.question_type === 'text' || q.question_type === 'time_with_text') {
        // 文本类型：检查answer字段
        isEmpty = !answer || !answer.answer || answer.answer.trim() === '';
      } else if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
        // 选择类型：检查answer字段
        isEmpty = !answer || !answer.answer || answer.answer.trim() === '';
      }
      
      if (isEmpty) {
        errors.push({
          questionNumber: q.question_number,
          questionText: q.question_text
        });
      }
    }
  });
  
  return errors;
}
```

### 2. 错误提示函数

```javascript
// 显示必填字段错误提示
function showRequiredFieldsError(errors) {
  const errorMessages = errors.map(err => 
    `Q${err.questionNumber}: ${err.questionText}`
  ).join('<br>');
  
  showNotification(
    `${i18n.t('requiredFieldsEmpty')}:<br><br>${errorMessages}`,
    'error',
    8000 // 显示8秒
  );
}
```

### 3. 私人答案过滤函数

```javascript
// 过滤私人答案
function filterPrivateAnswers(question, answers, currentUserId, reviewCreatorId) {
  if (question.owner !== 'private') {
    // 公开问题，返回所有答案
    return answers;
  }
  
  // 私人问题，只返回当前用户的答案或创建者可以看到所有答案
  return answers.filter(answer => {
    return answer.user_id === currentUserId || currentUserId === reviewCreatorId;
  });
}
```

### 4. 私人答案提示

```javascript
// 生成私人答案提示HTML
function getPrivateAnswerHint(question, answerCount, filteredCount) {
  if (question.owner === 'private' && answerCount > filteredCount) {
    const hiddenCount = answerCount - filteredCount;
    return `
      <div class="text-sm text-gray-500 italic mt-2">
        <i class="fas fa-lock mr-1"></i>
        ${i18n.t('privateAnswersHidden').replace('{count}', hiddenCount)}
      </div>
    `;
  }
  return '';
}
```

## 📝 需要添加的翻译

### 中文
```javascript
'requiredFieldsEmpty': '以下必填问题尚未回答',
'privateAnswersHidden': '有 {count} 个私人答案已隐藏',
'privateAnswerNotVisible': '此答案为私人答案，仅回答者和复盘创建者可见',
```

### 英文
```javascript
'requiredFieldsEmpty': 'The following required questions have not been answered',
'privateAnswersHidden': '{count} private answer(s) hidden',
'privateAnswerNotVisible': 'This is a private answer, visible only to the answerer and review creator',
```

## 🎯 实施步骤

1. ✅ 添加翻译文本
2. ⏳ 添加验证函数
3. ⏳ 在 handleEditReview 中添加验证
4. ⏳ 在 submitNewAnswerSet 中添加验证
5. ⏳ 在 showReviewDetail 中添加答案过滤
6. ⏳ 测试所有场景

## 🧪 测试场景

### 必填字段验证
1. 创建包含必填问题的模板
2. 创建复盘并尝试不填必填问题就提交
3. 验证是否显示错误提示
4. 填写必填问题后提交
5. 验证是否成功保存

### 私人答案过滤
1. 创建包含私人问题的模板
2. 多个用户回答问题
3. 用户A查看复盘，应该只看到：
   - 自己的私人答案
   - 如果是创建者，看到所有答案
4. 用户B查看复盘，应该只看到：
   - 自己的私人答案
   - 看不到用户A的私人答案
